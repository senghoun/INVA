import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';

export interface CachedSecurityPolicy {
  rateLimit: {
    enabled: boolean;
    maxAttempts: number;
    windowSeconds: number;
    lockoutSeconds: number;
  };
  ipRestriction: {
    mode: 'DISABLED' | 'ALLOWLIST' | 'BLOCKLIST';
    allowlist: string[];
    blocklist: string[];
  };
  domainRestriction: {
    enabled: boolean;
    allowedDomains: string[];
    serviceDomainMap?: Record<string, string[]>;
  };
  session: {
    accessTokenTtl: number;
    refreshTokenTtl: number;
    maxConcurrentSessions: number;
  };
}

const DEFAULT_GATEWAY_POLICY: CachedSecurityPolicy = {
  rateLimit: {
    enabled: true,
    maxAttempts: 100, // Gateway rate limit per window
    windowSeconds: 60,
    lockoutSeconds: 60,
  },
  ipRestriction: {
    mode: 'DISABLED',
    allowlist: [],
    blocklist: [],
  },
  domainRestriction: {
    enabled: false,
    allowedDomains: ['invaestate.com', 'inva.io'],
    serviceDomainMap: {
      'auth-service': ['*'],
      'hr-service': ['hr.invaestate.com', 'super.invaestate.com'],
      'crm-service': ['crm.invaestate.com', 'super.invaestate.com'],
      'ac-service': ['super.invaestate.com'],
      'it-service': ['super.invaestate.com'],
    },
  },
  session: {
    accessTokenTtl: 900,
    refreshTokenTtl: 604800,
    maxConcurrentSessions: 0,
  },
};

/**
 * CIDR and IP match utility
 */
export function isIpMatched(clientIp: string, rule: string): boolean {
  const cleanIp = clientIp.replace('::ffff:', '').trim();
  const cleanRule = rule.trim();
  if (cleanRule === cleanIp) return true;
  if (!cleanRule.includes('/')) return false;

  try {
    const [range, bits = '32'] = cleanRule.split('/');
    const bitCount = parseInt(bits, 10);
    if (isNaN(bitCount) || bitCount < 0 || bitCount > 32) return false;
    const mask = bitCount === 0 ? 0 : (~0 << (32 - bitCount)) >>> 0;
    const ip2long = (ipStr: string) =>
      ipStr
        .split('.')
        .reduce((acc, oct) => ((acc << 8) + parseInt(oct, 10)) >>> 0, 0);
    return (ip2long(cleanIp) & mask) === (ip2long(range) & mask);
  } catch {
    return false;
  }
}

/**
 * Check if hostname is localhost, loopback, .local, or private LAN IP
 */
export function isLocalOrPrivateHost(hostname: string): boolean {
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname.endsWith('.local')
  ) {
    return true;
  }
  // Private IPv4 LAN address patterns (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)
  return /^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(hostname);
}

/**
 * Gateway Security Policy Manager
 * Maintains a low-latency cached security policy fetched from auth-service / database.
 */
export class GatewaySecurityPolicyManager {
  private readonly logger = new Logger(GatewaySecurityPolicyManager.name);
  private policy: CachedSecurityPolicy = { ...DEFAULT_GATEWAY_POLICY };
  private lastFetchedAt = 0;
  private readonly TTL_MS = 15_000; // 15 seconds cache
  private authServiceUrl: string;

  // In-memory sliding window rate limiter for gateway
  // Bounded to prevent unbounded growth under distributed attack (many distinct IPs).
  private rateLimitStore = new Map<string, { count: number; resetTime: number }>();
  private readonly RATE_LIMIT_MAX_KEYS = 20_000;

  constructor(authServiceUrl: string = 'http://127.0.0.1:3001') {
    this.authServiceUrl = authServiceUrl;

  }

  public getPolicy(): CachedSecurityPolicy {
    if (Date.now() - this.lastFetchedAt > this.TTL_MS) {
      // Avoid thundering herd: refresh at most once per TTL window even under burst.
      this.lastFetchedAt = Date.now();
      this.refreshPolicy().catch(() => {
        // On failure allow next request to retry quickly instead of waiting full TTL
        this.lastFetchedAt = Date.now() - this.TTL_MS + 3_000;
      });
    }
    return this.policy;
  }

  public async refreshPolicy(): Promise<CachedSecurityPolicy> {
    try {
      if (!process.env.JWT_SECRET) return this.policy;
      // Reuse a process-wide JwtService to avoid constructing a new instance per poll.
      const signer = (globalThis as any).__gatewayPolicyJwt as JwtService | undefined;
      const jwt = signer || new JwtService({ secret: process.env.JWT_SECRET });
      (globalThis as any).__gatewayPolicyJwt = jwt;
      const token = jwt.sign({ scope: 'policy:read' }, {
        algorithm: 'HS256', expiresIn: 30,
        audience: 'auth-policy', issuer: 'api-gateway',
      });
      const res = await fetch(`${this.authServiceUrl}/api/v1/auth/internal/security/policy`, {
        headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(3000),
      });

      if (res.ok) {
        const data = await res.json();
        this.policy = {
          rateLimit: data.rateLimit || DEFAULT_GATEWAY_POLICY.rateLimit,
          ipRestriction: data.ipRestriction || DEFAULT_GATEWAY_POLICY.ipRestriction,
          domainRestriction: data.domainRestriction || DEFAULT_GATEWAY_POLICY.domainRestriction,
          session: data.session || DEFAULT_GATEWAY_POLICY.session,
        };
        this.lastFetchedAt = Date.now();
        this.logger.debug('Refreshed security policy from auth-service');
      }
    } catch (err: any) {
      // Retain existing cached policy on failure
      this.logger.debug(`Could not refresh policy from auth-service: ${err?.message}`);
    }
    return this.policy;
  }

  /**
   * Check if an origin is allowed by the dynamic CORS policy
   */
  public isOriginAllowed(origin: string): boolean {
    if (!origin) return true;
    try {
      const hostname = new URL(origin).hostname;

      // Allow localhost and local/private network IPs in development
      if (process.env.NODE_ENV !== 'production' && isLocalOrPrivateHost(hostname)) {
        return true;
      }

      // Check against allowedDomains in the active policy
      const policy = this.getPolicy();
      const allowedDomains = policy.domainRestriction?.allowedDomains || [];

      for (const domain of allowedDomains) {
        const cleanDomain = domain.trim().toLowerCase();
        if (hostname === cleanDomain || hostname.endsWith(`.${cleanDomain}`)) {
          return true;
        }
      }

      // Fallback allowed base domains
      if (/(^|\.)(inva\.io|invaestate\.com)$/i.test(hostname)) {
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * Verify IP against allowlist / blocklist
   * Returns { allowed: true } or { allowed: false, reason: string }
   */
  public checkIpRestriction(clientIp: string): { allowed: boolean; reason?: string } {
    const policy = this.getPolicy();
    const mode = policy.ipRestriction?.mode || 'DISABLED';
    if (mode === 'DISABLED') return { allowed: true };

    const ip = clientIp.replace('::ffff:', '').trim();

    // In dev/local, allow loopback
    if (process.env.NODE_ENV !== 'production' && (ip === '127.0.0.1' || ip === 'localhost' || ip === '::1')) {
      return { allowed: true };
    }

    if (mode === 'BLOCKLIST') {
      const blocklist = policy.ipRestriction.blocklist || [];
      const isBlocked = blocklist.some((rule) => isIpMatched(ip, rule));
      if (isBlocked) {
        return {
          allowed: false,
          reason: `Client IP ${ip} is blocked by enterprise security policy`,
        };
      }
      return { allowed: true };
    }

    if (mode === 'ALLOWLIST') {
      const allowlist = policy.ipRestriction.allowlist || [];
      if (allowlist.length === 0) return { allowed: false, reason: 'IP allowlist is empty.' };
      const isAllowed = allowlist.some((rule) => isIpMatched(ip, rule));
      if (!isAllowed) {
        return {
          allowed: false,
          reason: `Client IP ${ip} is not in the authorized IP allowlist`,
        };
      }
      return { allowed: true };
    }

    return { allowed: true };
  }

  /**
   * Verify whether the caller domain has permission to access the target microservice route
   */
  public checkServiceDomainAccess(
    serviceKey: string,
    originOrReferer?: string,
  ): { allowed: boolean; reason?: string } {
    const policy = this.getPolicy();
    if (!policy.domainRestriction?.enabled) {
      return { allowed: true };
    }

    if (!originOrReferer) {
      // Direct server-to-server or non-browser request
      return { allowed: true };
    }



    let hostname = '';
    try {
      hostname = new URL(originOrReferer).hostname;
    } catch {
      hostname = originOrReferer;
    }

    // Localhost, loopback, and local/private network development IPs are always allowed
    if (process.env.NODE_ENV !== 'production' && isLocalOrPrivateHost(hostname)) {
      return { allowed: true };
    }

    // Check service-domain binding
    const map = policy.domainRestriction.serviceDomainMap;
    if (map && map[serviceKey]) {
      const allowedForService = map[serviceKey];
      // Wildcard allows all approved domains
      if (allowedForService.includes('*')) {
        return { allowed: true };
      }

      const match = allowedForService.some(
        (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
      );

      if (!match) {
        return {
          allowed: false,
          reason: `Domain ${hostname} is not authorized to access ${serviceKey}. Permitted domains: ${allowedForService.join(', ')}`,
        };
      }
    }

    return { allowed: true };
  }

  /** Gateway flood protection; auth-service separately counts failed credentials. */
  public checkRateLimit(key: string): { allowed: boolean; retryAfterSeconds?: number } {
    const policy = this.getPolicy();
    if (!policy.rateLimit?.enabled) return { allowed: true };
    const max = Math.max(300, (policy.rateLimit.maxAttempts || 5) * 60);
    const windowMs = 60_000;
    const now = Date.now();

    const rateKey = `gw:${key}`;
    const existing = this.rateLimitStore.get(rateKey);
    // Lazy reap: purge an expired bucket if present, and when the map is full evict oldest.
    if (existing && now > existing.resetTime) {
      this.rateLimitStore.delete(rateKey);
    }
    if (this.rateLimitStore.size >= this.RATE_LIMIT_MAX_KEYS) {
      const oldest = this.rateLimitStore.keys().next().value as string | undefined;
      if (oldest) this.rateLimitStore.delete(oldest);
    }
    const current = this.rateLimitStore.get(rateKey);
    if (!current) {
      this.rateLimitStore.set(rateKey, { count: 1, resetTime: now + windowMs });
      return { allowed: true };
    }

    if (current.count >= max) {
      const retryAfter = Math.ceil((current.resetTime - now) / 1000);
      return { allowed: false, retryAfterSeconds: retryAfter };
    }

    current.count += 1;
    return { allowed: true };
  }
}

export const gatewayPolicyManager = new GatewaySecurityPolicyManager(
  process.env.AUTH_SERVICE_URL || 'http://127.0.0.1:3001',
);

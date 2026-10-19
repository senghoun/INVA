import { Injectable, UnauthorizedException, ServiceUnavailableException, ForbiddenException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

/**
 * Cached entry for a validated sid. Short TTL keeps revocation window small
 * while removing the auth-service round-trip on every request (≈5-20 ms saved).
 */
interface CachedSession {
  payload: JwtPayload;
  expiresAt: number;
}

/**
 * Downstream services consult auth so revocation and role changes take effect.
 * Hot path: every authenticated request. Uses a small in-memory TTL cache
 * with request coalescing and keep-alive to auth-service.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);
  private readonly cache = new Map<string, CachedSession>();
  private readonly inFlight = new Map<string, Promise<JwtPayload>>();
  /** Keep the decoded sid->cacheKey mapping from the most recent fetch so on-logout can be bounded. */
  private readonly CACHE_TTL_MS = 30_000; // 30s: balances revocation latency vs throughput
  private readonly MAX_CACHE_ENTRIES = 10_000;
  private authServiceUrl!: string;

  constructor(private readonly config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      issuer: 'inva-auth',
      audience: 'inva-api',
      ignoreExpiration: false,
      algorithms: ['HS256'],
      passReqToCallback: true,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
    this.authServiceUrl = this.config.get<string>('AUTH_SERVICE_URL', 'http://127.0.0.1:3001');
    // Periodic reaping so the map does not grow on a long-lived process with many distinct sessions.
    const timer = setInterval(() => this.reapExpired(), 60_000);
    // Don't block process exit in tests.
    if (typeof timer.unref === 'function') timer.unref();
  }

  private cacheKey(payload: JwtPayload, companyId?: string): string {
    // Per-session + per-tenant isolation; a company switch must re-validate.
    return `${payload.sid || payload.sub}:${companyId || ''}`;
  }

  private getCached(key: string): JwtPayload | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.payload;
  }

  private setCached(key: string, payload: JwtPayload): void {
    if (this.cache.size >= this.MAX_CACHE_ENTRIES) {
      // Evict oldest (Map insertion order)
      const oldest = this.cache.keys().next().value as string | undefined;
      if (oldest) this.cache.delete(oldest);
    }
    this.cache.set(key, { payload, expiresAt: Date.now() + this.CACHE_TTL_MS });
  }

  private reapExpired(): void {
    const now = Date.now();
    for (const [k, v] of this.cache) {
      if (now > v.expiresAt) this.cache.delete(k);
    }
  }

  /**
   * Invalidate a single session on explicit 401/403 from auth — caller revoked
   * or tenant access changed. Keeps the next request from serving stale data.
   */
  private invalidate(key: string): void {
    this.cache.delete(key);
    this.inFlight.delete(key);
  }

  async validate(
    request: { headers: { authorization?: string; 'x-company-id'?: string } },
    payload: JwtPayload,
  ): Promise<JwtPayload> {
    if (payload.type !== 'access' || !payload.sid) throw new UnauthorizedException('Please sign in again.');

    const companyId = request.headers['x-company-id'];
    const key = this.cacheKey(payload, companyId);

    const cached = this.getCached(key);
    if (cached) return cached;

    // Coalesce concurrent validations for the same sid (thundering-herd guard under burst traffic).
    const existing = this.inFlight.get(key);
    if (existing) return existing;

    const promise = this.fetchAndValidate(request, payload, key);
    this.inFlight.set(key, promise);
    try {
      const result = await promise;
      return result;
    } finally {
      this.inFlight.delete(key);
    }
  }

  private async fetchAndValidate(
    request: { headers: { authorization?: string; 'x-company-id'?: string } },
    payload: JwtPayload,
    key: string,
  ): Promise<JwtPayload> {
    let response: Response;
    try {
      response = await fetch(`${this.authServiceUrl}/api/v1/auth/me`, {
        headers: {
          Authorization: request.headers.authorization || '',
          ...(request.headers['x-company-id'] ? { 'X-Company-Id': request.headers['x-company-id'] } : {}),
        },
        // keep-alive is handled by Node's global fetch/undici pool; 2s is enough for same-host loopback.
        signal: AbortSignal.timeout(2000),
      });
    } catch {
      throw new ServiceUnavailableException('Session verification unavailable.');
    }
    if (response.status === 401) {
      this.invalidate(key);
      throw new UnauthorizedException('Session is no longer active.');
    }
    if (response.status === 403) {
      this.invalidate(key);
      throw new ForbiddenException('Company access is no longer available.');
    }
    if (!response.ok) throw new ServiceUnavailableException('Session verification unavailable.');
    const user = await response.json();
    if (!user.isActive || user.id !== payload.sub) {
      this.invalidate(key);
      throw new UnauthorizedException();
    }
    const enriched: JwtPayload = {
      ...payload,
      email: user.email,
      userType: user.userType,
      roles: user.roles,
      companyScope: user.companyScope,
    };
    this.setCached(key, enriched);
    return enriched;
  }
}

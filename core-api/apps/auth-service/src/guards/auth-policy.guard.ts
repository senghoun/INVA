import { normalizePhone, PHONE_PATTERN } from '../security/login-identity';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CanActivate, ExecutionContext, ForbiddenException, HttpException, Injectable } from '@nestjs/common';
import { BlockList, isIP } from 'node:net';
import { SecurityPolicyService } from '../services/security-policy.service';
import { AuthPrismaService } from '../database/auth-prisma.service';

export function matchesIp(ip: string, rule: string): boolean {
  try {
    const clean = ip.replace(/^::ffff:/, '');
    const [address, prefix] = rule.trim().split('/');
    const family = isIP(address);
    if (!family || !isIP(clean)) return false;
    const block = new BlockList();
    const type = family === 6 ? 'ipv6' : 'ipv4';
    if (prefix !== undefined) block.addSubnet(address, Number(prefix), type);
    else block.addAddress(address, type);
    return block.check(clean, isIP(clean) === 6 ? 'ipv6' : 'ipv4');
  } catch { return false; }
}

/** Apply saved policy at the service boundary, including requests bypassing the gateway. */
@Injectable()
export class AuthPolicyGuard implements CanActivate {
  constructor(private readonly policyService: SecurityPolicyService, private readonly prisma: AuthPrismaService, private readonly jwt: JwtService, private readonly config: ConfigService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const handler = context.getHandler().name;
    // These endpoints use dedicated JWT guards. Session introspection must remain available.
    if (handler === 'readGatewayPolicy' || handler === 'me') return true;
    const request = context.switchToHttp().getRequest();
    const policy = await this.policyService.getPolicy();
    let ip = request.ip;
    const clientContext = request.headers['x-inva-client-context'];
    if (typeof clientContext === 'string') {
      try {
        const claims = this.jwt.verify(clientContext, { secret: this.config.getOrThrow<string>('JWT_SECRET'),
          algorithms: ['HS256'], audience: 'auth-proxy', issuer: 'api-gateway' });
        if (claims.method !== request.method || claims.path !== request.url.split('?')[0] || !isIP(claims.ip)) throw new Error();
        ip = claims.ip;
      } catch { throw new ForbiddenException('Invalid gateway client context.'); }
    }
    request.securityClientIp = ip;
    const { mode, allowlist, blocklist } = policy.ipRestriction;
    if ((mode === 'ALLOWLIST' && !allowlist.some(rule => matchesIp(ip, rule))) ||
        (mode === 'BLOCKLIST' && blocklist.some(rule => matchesIp(ip, rule)))) {
      await this.policyService.recordAuditLog({ action: 'IP_BLOCKED', outcome: 'BLOCKED', ip });
      throw new ForbiddenException('Access denied by IP policy.');
    }
    // Browser origin restriction is supplemental; it never replaces token/role checks.
    if (policy.domainRestriction.enabled && request.headers.origin) {
      let host = '';
      try { host = new URL(request.headers.origin).hostname; } catch { throw new ForbiddenException('Invalid origin.'); }
      if (!policy.domainRestriction.allowedDomains.some(domain => host === domain || host.endsWith(`.${domain}`))) {
        throw new ForbiddenException('Origin is not allowed.');
      }
    }
    if (handler === 'login') {
      let identity = typeof request.body?.email === 'string' ? request.body.email.trim().toLowerCase() : '';
      const phone = normalizePhone(request.body?.phone);
      if (request.body?.email === undefined && typeof phone === 'string' && PHONE_PATTERN.test(phone)) {
        const account = await this.prisma.user.findUnique({ where: { phone }, select: { email: true } });
        // Email and phone aliases share the account's audit and failed-login budget.
        identity = account?.email?.toLowerCase() || `phone:${phone}`;
      }
      request.loginAuditIdentity = identity;
    }
    if (handler === 'login' && policy.rateLimit.enabled) {
      const { maxAttempts, windowSeconds, lockoutSeconds } = policy.rateLimit;
      const email = request.loginAuditIdentity;
      // Preserve audit history; a verified success starts a new failure streak.
      const lastSuccess = await this.prisma.auditLog.findFirst({
        where: { userEmail: { equals: email }, outcome: 'SUCCESS',
          action: { in: ['LOGIN_SUCCESS', 'PASSWORD_CHANGED'] } },
        orderBy: { timestamp: 'desc' }, select: { timestamp: true },
      });
      const cutoff = Math.max(Date.now() - (windowSeconds + lockoutSeconds) * 1000,
        lastSuccess?.timestamp.getTime() || 0);
      const failures = await this.prisma.auditLog.findMany({
        where: { action: 'LOGIN_FAILED', outcome: 'FAILED', ip,
          userEmail: { equals: email }, timestamp: { gt: new Date(cutoff) } },
        orderBy: { timestamp: 'desc' }, take: maxAttempts,
      });
      if (failures.length >= maxAttempts &&
          failures[0].timestamp.getTime() - failures[failures.length - 1].timestamp.getTime() <= windowSeconds * 1000) {
        const remaining = Math.ceil((failures[0].timestamp.getTime() + lockoutSeconds * 1000 - Date.now()) / 1000);
        if (remaining > 0) {
          await this.policyService.recordAuditLog({ action: 'RATE_LIMITED', outcome: 'BLOCKED', ip });
          context.switchToHttp().getResponse().header('Retry-After', String(remaining));
          throw new HttpException('Too many failed login attempts. Please try again later.', 429);
        }
      }
    }
    return true;
  }
}

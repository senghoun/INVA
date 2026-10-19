import { Injectable, ExecutionContext, CanActivate, ForbiddenException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { isIP } from 'node:net';

/**
 * GatewayEnforcementGuard — best-practice API gateway pattern:
 * Downstream services MUST NOT be reachable directly from the public internet.
 * Only the api-gateway is exposed via the load balancer. This guard enforces
 * that invariant at the application layer (defense in depth behind the infra).
 *
 * - If `GATEWAY_ENFORCEMENT=true` (production): every request must carry a
 *   valid `x-inva-client-context` JWT minted by the gateway, OR originate
 *   from a trusted loopback/proxy IP. Direct browser calls are rejected.
 * - Otherwise (dev): guard is a no-op — local development still works with
 *   direct service ports.
 *
 * Drop-in: add as a global APP_GUARD in domain services behind the gateway.
 */
@Injectable()
export class GatewayEnforcementGuard implements CanActivate {
  private readonly logger = new Logger(GatewayEnforcementGuard.name);
  private readonly enforced: boolean;
  private readonly trustedProxies: Set<string>;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {
    this.enforced = config.get<string>('GATEWAY_ENFORCEMENT', 'false') === 'true';
    const raw = (config.get<string>('GATEWAY_TRUSTED_PROXIES', '') || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    this.trustedProxies = new Set(raw);
  }

  canActivate(context: ExecutionContext): boolean {
    if (!this.enforced) return true;

    const request = context.switchToHttp().getRequest();
    const url: string = request.url || '';
    const cleanRoute = url.split('?')[0];

    // Liveness probe must remain reachable for orchestrator health checks & gateway health.
    if (cleanRoute === '/health/live' || cleanRoute === '/api/v1/health/live' || cleanRoute === '/health' || cleanRoute === '/api/v1/health') {
      return true;
    }
    // Swagger docs are disabled in production anyway; allow them in dev/staging when enforced.
    if (cleanRoute.startsWith('/api/docs')) return true;

    const token = request.headers['x-inva-client-context'];
    if (typeof token === 'string' && token.length > 0) {
      try {
        const claims = this.jwt.verify(token, {
          secret: this.config.getOrThrow<string>('JWT_SECRET'),
          algorithms: ['HS256'],
          audience: 'auth-proxy',
          issuer: 'api-gateway',
        });
        if (
          typeof claims.ip === 'string' &&
          typeof claims.method === 'string' &&
          typeof claims.path === 'string'
        ) {
          if (claims.method !== request.method || claims.path !== cleanRoute || !isIP(claims.ip)) {
            throw new Error('context mismatch');
          }
          // Valid gateway attestation — downstream can trust request.ip === claims.ip
          return true;
        }
      } catch {
        throw new ForbiddenException('Direct access to this service is not allowed. Please use the API Gateway.');
      }
      throw new ForbiddenException('Direct access to this service is not allowed. Please use the API Gateway.');
    }

    // No gateway token: only allow trusted internal callers (e.g. gateway on same host)
    // In k8s this is the gateway pod IP in the allowlist.
    const remoteIp = (request.ip || '').replace('::ffff:', '');
    if (this.trustedProxies.has(remoteIp) || remoteIp === '127.0.0.1' || remoteIp === '::1') {
      return true;
    }

    this.logger.warn(`Blocked direct access to ${request.method} ${cleanRoute} from ${remoteIp} — missing gateway context`);
    throw new ForbiddenException('Direct access to this service is not allowed. Please use the API Gateway.');
  }
}

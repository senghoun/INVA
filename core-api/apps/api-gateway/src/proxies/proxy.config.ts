import { JwtService } from '@nestjs/jwt';
import proxy from '@fastify/http-proxy';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

export interface MicroserviceRoute {
  prefix: string;
  rewritePrefix: string;
  configKey: string;
  defaultUrl: string;
}

export const MICROSERVICE_ROUTES: MicroserviceRoute[] = [
  {
    prefix: '/api/v1/auth',
    rewritePrefix: '/api/v1/auth',
    configKey: 'AUTH_SERVICE_URL',
    defaultUrl: 'http://127.0.0.1:3001',
  },
  {
    prefix: '/api/v1/hr',
    rewritePrefix: '/api/v1/hr',
    configKey: 'HR_SERVICE_URL',
    defaultUrl: 'http://127.0.0.1:3002',
  },
  {
    prefix: '/api/v1/crm',
    rewritePrefix: '/api/v1/crm',
    configKey: 'CRM_SERVICE_URL',
    defaultUrl: 'http://127.0.0.1:3003',
  },
  {
    prefix: '/api/v1/ac',
    rewritePrefix: '/api/v1/ac',
    configKey: 'AC_SERVICE_URL',
    defaultUrl: 'http://127.0.0.1:3004',
  },
  {
    prefix: '/api/v1/it',
    rewritePrefix: '/api/v1/it',
    configKey: 'IT_SERVICE_URL',
    defaultUrl: 'http://127.0.0.1:3005',
  },
];

/**
 * Shared signing helper — reusing one JwtService avoids constructing a new
 * instance per proxied request (previously `new JwtService()` inside the
 * hot path).
 */
let gatewayJwt: JwtService | null = null;
function getGatewayJwt(config: ConfigService): JwtService {
  if (!gatewayJwt) gatewayJwt = new JwtService({ secret: config.getOrThrow<string>('JWT_SECRET') });
  return gatewayJwt;
}

export async function registerGatewayProxies(
  fastify: any,
  config: ConfigService,
  logger: Logger,
): Promise<void> {
  const jwt = getGatewayJwt(config);

  for (const route of MICROSERVICE_ROUTES) {
    const upstream = config.get<string>(route.configKey, route.defaultUrl);
    await fastify.register(proxy as any, {
      upstream,
      prefix: route.prefix,
      rewritePrefix: route.rewritePrefix,
      http2: false,
      // Throughput & resilience: keep-alive pool + strict timeouts
      undici: {
        pipelining: 0,
        connections: 64,
        keepAliveTimeout: 30_000,
        keepAliveMaxTimeout: 60_000,
        bodyTimeout: 30_000,
        headersTimeout: 30_000,
      },
      // Fastify-level proxy timeout (fallback if undici timeout is not honoured)
      timeout: 30_000,
      replyOptions: {
        rewriteRequestHeaders: (request: any, headers: Record<string, any>) => ({
          ...headers,
          'x-forwarded-for': request.ip,
          // Short-lived proof that the request came through the gateway (verified in AuthPolicyGuard)
          'x-inva-client-context': jwt.sign(
            {
              ip: request.ip,
              method: request.method,
              path: request.url.split('?')[0],
            },
            { algorithm: 'HS256', audience: 'auth-proxy', issuer: 'api-gateway', expiresIn: 15 },
          ),
        }),
      },
    });
    logger.log(`[Proxy] ${route.prefix}/* ──► ${upstream}${route.rewritePrefix}`);
  }
}

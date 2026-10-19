import { httpLoggerOptions, getTelegramAlerts, AlertingLogger, registerHttpMonitoring, startTelegramRelay } from '@common';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from '@fastify/helmet';
import { AppModule } from './app.module';
import { registerGatewayProxies } from './proxies/proxy.config';
import { DOC_SERVICES } from './docs/docs-registry';
import { REFERENCE_JS } from './docs/portal.assets';
import { DOCS_BASE_CSS } from '@common';
import { gatewayTelemetryStore } from './telemetry/gateway-telemetry.store';
import { serviceToggleStore } from './telemetry/service-toggle.store';
import { gatewayPolicyManager } from './security/gateway-policy.manager';

const alerts = getTelegramAlerts('api-gateway');

async function bootstrap(): Promise<void> {
  const logger = new Logger('ApiGateway');

  const stopTelegramRelay = await startTelegramRelay(alerts);

  const trustedProxies = (process.env.GATEWAY_TRUSTED_PROXIES || '')
    .split(',')
    .map((ip) => ip.trim())
    .filter(Boolean);

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: process.env.NODE_ENV !== 'production' ? httpLoggerOptions : false,
      bodyLimit: 1048576,
      trustProxy: trustedProxies.length ? trustedProxies : undefined,
      // Throughput tuning — keep connections hot between LB ↔ gateway ↔ upstream
      keepAliveTimeout: 65_000,
      connectionTimeout: 30_000,
      requestTimeout: 30_000,
      maxRequestsPerSocket: 0, // unlimited — LB keeps socket open
      // Reduce per-request overhead
      caseSensitive: true,
      ignoreTrailingSlash: true,
      // Return 413 faster on oversize bodies
      onProtoPoisoning: 'error',
      onConstructorPoisoning: 'error',
    } as any),
    { logger: new AlertingLogger(alerts), abortOnError: false },
  );

  app.getHttpAdapter().getInstance().addHook('onClose', async () => { stopTelegramRelay(); });

  const config = app.get(ConfigService);
  const port = config.get<number>('GATEWAY_PORT', config.get<number>('PORT', 3000));

  // ── HTTP Security Headers (Helmet) ──────────────────────────────────────────
  await app.register(helmet as any, {
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
    crossOriginEmbedderPolicy: false,
  });

  // ── Best-effort response compression ──────────────────────────────────────
  // Uses @fastify/compress when installed; otherwise gateway still serves
  // correctly without it (no hard dependency introduced here).
  try {
    const compress: any = await import('@fastify/compress' as any).then((m: any) => m.default || m);
    await app.register(compress, {
      global: true,
      threshold: 1024,
      encodings: ['gzip', 'deflate'],
    });
    logger.log('Response compression enabled (gzip/deflate, 1kB threshold)');
  } catch {
    logger.warn('@fastify/compress not installed — responses will be uncompressed. Run `npm i @fastify/compress` to enable.');
  }

  // ── Dynamic Enterprise CORS (Powered by DB Security Policy) ───────────────
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (process.env.NODE_ENV !== 'production') return callback(null, true);

      const isAllowed = gatewayPolicyManager.isOriginAllowed(origin);
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by enterprise security policy`), false);
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Company-Id', 'X-Requested-With', 'X-Inva-Client'],
    credentials: true,
    exposedHeaders: ['Retry-After'],
    maxAge: 600,
  });

  // ── Validation Pipe ───────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ── Fastify Reverse Proxy Routing to Domain Microservices ─────────────────
  const fastify = app.getHttpAdapter().getInstance() as any;

  // Light global headers — CDN / browser caching hints for safe GETs
  fastify.addHook('onSend', async (request: any, reply: any, payload: any) => {
    // No-store for auth/state-changing, short cache for safe idempotent endpoints.
    const url: string = request.url || '';
    const method: string = request.method || 'GET';
    if (method === 'GET' && reply.statusCode === 200) {
      if (url.startsWith('/health') || url.startsWith('/api/v1/health')) {
        reply.header('cache-control', 'no-store');
      }
    } else if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      reply.header('cache-control', 'no-store');
    }
    // Ensure Vary is set when CORS is dynamic
    if (request.headers.origin) reply.header('vary', 'Origin');
    return payload;
  });

  const httpMonitor = registerHttpMonitoring(fastify, alerts, true);

  // ── Service Route Mapping for Disconnect Interception ─────────────────────
  const serviceRouteMap: Record<string, { key: string; name: string }> = {
    '/api/v1/auth': { key: 'auth-service', name: 'Auth & Identity Service' },
    '/api/v1/hr': { key: 'hr-service', name: 'HR & Personnel Service' },
    '/api/v1/crm': { key: 'crm-service', name: 'CRM & Deals Service' },
    '/api/v1/ac': { key: 'ac-service', name: 'Accounting & Ledger Service' },
    '/api/v1/it': { key: 'it-service', name: 'IT Operations Service' },
  };

  // ── API Traffic, Security Enforcement & Telemetry Hook ────────────────────
  fastify.addHook('onRequest', (request: any, reply: any, done: any) => {
    (request as any)._startTime = performance.now();

    const url = request.url || '';
    const cleanRoute = url.split('?')[0];

    // Exclude synthetic internal probes, health checks, swagger docs from policy blocks
    const isPublicProbe =
      cleanRoute.startsWith('/health/') ||
      cleanRoute === '/health' ||
      cleanRoute === '/api/v1/health' ||
      cleanRoute.startsWith('/api/docs') ||
      cleanRoute.startsWith('/favicon') ||
      cleanRoute.startsWith('/assets/');

    if (isPublicProbe) {
      done();
      return;
    }

    const clientIp = request.ip || '127.0.0.1';

    // 1. IP restriction check (DB policy)
    const ipCheck = gatewayPolicyManager.checkIpRestriction(clientIp);
    if (!ipCheck.allowed) {
      httpMonitor.policyBlock(request, 'ip_block');
      reply.code(403).send({
        statusCode: 403,
        error: 'Forbidden',
        message: ipCheck.reason,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 2. Dynamic Rate Limit check (DB policy)
    const rateLimitCheck = gatewayPolicyManager.checkRateLimit(clientIp);
    if (!rateLimitCheck.allowed) {
      reply
        .code(429)
        .header('Retry-After', String(rateLimitCheck.retryAfterSeconds || 60))
        .send({
          statusCode: 429,
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Try again in ${rateLimitCheck.retryAfterSeconds} seconds.`,
          retryAfter: rateLimitCheck.retryAfterSeconds,
          timestamp: new Date().toISOString(),
        });
      return;
    }

    // 3. Service disconnection and domain-service access checks
    const originHeader = request.headers.origin || request.headers.referer;
    for (const [prefix, info] of Object.entries(serviceRouteMap)) {
      if (cleanRoute === prefix || cleanRoute.startsWith(prefix + '/')) {
        // Disconnected check
        if (serviceToggleStore.isDisconnected(info.key)) {
          reply.code(503).send({
            statusCode: 503,
            error: 'Service Unavailable',
            message: `${info.name} has been temporarily disconnected by Super Admin.`,
            service: info.key,
            disconnectedByAdmin: true,
            timestamp: new Date().toISOString(),
          });
          return;
        }

        // Domain-to-Service authorization check (e.g. hr.invaestate.com -> only hr and auth)
        const domainCheck = gatewayPolicyManager.checkServiceDomainAccess(info.key, originHeader);
        if (!domainCheck.allowed) {
          httpMonitor.policyBlock(request, 'domain_block');
          reply.code(403).send({
            statusCode: 403,
            error: 'Forbidden',
            message: domainCheck.reason,
            service: info.key,
            timestamp: new Date().toISOString(),
          });
          return;
        }
      }
    }

    done();
  });

  fastify.addHook('onResponse', (request: any, reply: any, done: any) => {
    try {
      const url = request.url || '';
      const cleanRoute = url.split('?')[0];

      // Exclude synthetic internal probes, monitoring heartbeats, and swagger docs
      if (
        url.includes('/favicon') ||
        url.includes('/assets/') ||
        cleanRoute.startsWith('/health/') ||
        cleanRoute === '/health' ||
        cleanRoute === '/api/v1/health' ||
        cleanRoute.startsWith('/api/v1/gateway/telemetry') ||
        cleanRoute.startsWith('/api/docs')
      ) {
        done();
        return;
      }

      const durationMs = Math.round(performance.now() - ((request as any)._startTime || performance.now()));
      const authHeader = (request.headers.authorization || '') as string;
      let userEmail = 'ANONYMOUS';
      let userId: string | null = null;
      let userRoles: string[] = [];

      // Extract user info from JWT without blocking
      if (authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const decoded = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
            if (decoded.email) userEmail = decoded.email;
            if (decoded.sub) userId = decoded.sub;
            if (Array.isArray(decoded.roles)) userRoles = decoded.roles;
          }
        } catch {}
      }

      gatewayTelemetryStore.recordRequest({
        id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        method: request.method || 'GET',
        url,
        route: cleanRoute,
        statusCode: reply.statusCode || 200,
        durationMs,
        userEmail,
        userId,
        userRoles,
        ip: request.ip || '127.0.0.1',
        timestamp: new Date().toLocaleTimeString(),
      });
    } catch {}
    done();
  });

  await registerGatewayProxies(fastify, config, logger);

  // ── Developer Docs: portal at /api/docs, reference console at /api/docs/reference ─
  if (config.get<string>('NODE_ENV') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('inva Core API Gateway (core)')
      .setDescription(
        'Gateway-local OpenAPI document (gateway controller endpoints only).\n\n' +
          'The full cross-service reference lives at /api/docs/reference — it aggregates all microservices via /api/docs/specs/*.json.',
      )
      .setVersion('2.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT access token (without "Bearer " prefix)',
        },
        'bearer',
      )
      .addTag('gateway', 'API Gateway health & routing')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs/reference', app, document, {
      customSiteTitle: 'inva Core API — Reference',
      customCss: DOCS_BASE_CSS,
      customJsStr: [REFERENCE_JS],
      explorer: true,
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        tryItOutEnabled: false,
        docExpansion: 'none',
        defaultModelsExpandDepth: 2,
        defaultModelExpandDepth: 2,
        defaultModelRendering: 'example',
        showExtensions: true,
        showCommonExtensions: true,
        withCredentials: false,
        requestInterceptor: (request: any) => {
          request.credentials = 'omit';
          return request;
        },
        spec: null as any,
        urls: [
          { url: '/api/docs/specs/all.json', name: '🌟 All Ecosystem APIs (Unified Hub)' },
          ...DOC_SERVICES.map(
            (s) => ({ url: `/api/docs/specs/${s.key}.json`, name: `${s.emoji} ${s.name} (Port ${s.port})` }),
          ),
          { url: '/api/docs/specs/gateway.json', name: '⚡ Gateway Core (Port 3000)' },
        ],
      },
    });

    logger.log(`Developer portal:    http://0.0.0.0:${port}/api/docs`);
    logger.log(`API reference UI:    http://0.0.0.0:${port}/api/docs/reference`);
  }

  await app.listen(port, '0.0.0.0');
  logger.log(`🚀 inva Enterprise API Gateway running at http://0.0.0.0:${port}`);
}

bootstrap().catch(async () => {
  const logger = new Logger('ApiGateway');
  logger.error('Fatal error during API Gateway bootstrap');
  alerts.notify({ kind: 'startup_failure' });
  await alerts.flush();
  process.exit(1);
});

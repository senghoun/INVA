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
import { DOCS_BASE_CSS, buildSwaggerUiOptions } from '@common';

const alerts = getTelegramAlerts('hr-service');

function gatewayOnlyCorsOrigin(config: ConfigService) {
  // Domain services are NOT directly exposed to browsers in production.
  // Only the gateway is public. When enforcement is on, reject all browser origins here —
  // browsers must go through the gateway; service-to-service via gateway uses the signed header.
  if (config.get<string>('GATEWAY_ENFORCEMENT', 'false') === 'true') return false;
  // Dev: allow configured browser origins so direct-port debugging still works.
  const raw = config.get<string>('BROWSER_ORIGINS', '');
  const allowed = raw.split(',').map((s) => s.trim()).filter(Boolean);
  if (allowed.length) return allowed as any;
  return true;
}

async function bootstrap(): Promise<void> {
  const logger = new Logger('HrService');

  const stopTelegramRelay = await startTelegramRelay(alerts);

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: process.env.NODE_ENV !== 'production' ? httpLoggerOptions : false,
      bodyLimit: 1048576,
      trustProxy: true,
      keepAliveTimeout: 65_000,
      connectionTimeout: 30_000,
      requestTimeout: 30_000,
    } as any),
    { logger: new AlertingLogger(alerts), abortOnError: false },
  );

  registerHttpMonitoring(app.getHttpAdapter().getInstance(), alerts);

  app.getHttpAdapter().getInstance().addHook('onClose', async () => { stopTelegramRelay(); });

  const config = app.get(ConfigService);
  const port = config.get<number>('HR_SERVICE_PORT', 3002);

  await app.register(helmet as any, {
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  });

  const corsOrigin = gatewayOnlyCorsOrigin(config);
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Company-Id', 'X-Requested-With', 'X-Inva-Client', 'X-Inva-Client-Context'],
    exposedHeaders: ['Retry-After'],
    maxAge: 600,
  });

  // Ensure Vary + no-store on state-changing
  app.getHttpAdapter().getInstance().addHook('onSend', async (request: any, reply: any, payload: any) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) reply.header('cache-control', 'no-store');
    return payload;
  });

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  if (config.get<string>('NODE_ENV') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('inva HR Service')
      .setDescription('Human Resources — internal employees & departments')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT access token',
        },
        'bearer',
      )
      .addTag('hr', 'Human Resources management')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      customSiteTitle: 'inva HR Service — API Reference',
      customCss: DOCS_BASE_CSS,
      swaggerOptions: buildSwaggerUiOptions(),
    });
    logger.log(`HR Service Swagger docs at http://0.0.0.0:${port}/api/docs`);
  }

  await app.listen(port, '0.0.0.0');
  logger.log(`HR Service running at http://0.0.0.0:${port}/api/v1`);
}

bootstrap().catch(async () => {
  const logger = new Logger('HrService');
  logger.error('Fatal error during bootstrap');
  alerts.notify({ kind: 'startup_failure' });
  await alerts.flush();
  process.exit(1);
});

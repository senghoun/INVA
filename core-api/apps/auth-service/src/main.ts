import cookie from '@fastify/cookie';
import { browserOrigins } from './security/browser-session';
import { httpLoggerOptions, getTelegramAlerts, AlertingLogger, registerHttpMonitoring } from '@common';
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

const alerts = getTelegramAlerts('auth-service');

async function bootstrap(): Promise<void> {
  const logger = new Logger('AuthService');

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: process.env.NODE_ENV !== 'production' ? httpLoggerOptions : false,
      bodyLimit: 1048576,
    }),
    { logger: new AlertingLogger(alerts), abortOnError: false },
  );

  registerHttpMonitoring(app.getHttpAdapter().getInstance(), alerts);

  const config = app.get(ConfigService);
  const port = config.get<number>('AUTH_SERVICE_PORT', 3001);

  await app.register(helmet as any, {
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  });

  await app.register(cookie);

  app.enableCors({
    origin: browserOrigins(config),
    credentials: true,
    exposedHeaders: ['Retry-After'],
  });

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: false,
      },
    }),
  );

  if (config.get<string>('NODE_ENV') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('inva Auth Service')
      .setDescription('Authentication, User Management, and Authorization API')
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
      .addTag('auth', 'Authentication & token management')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      customSiteTitle: 'inva Auth Service — API Reference',
      customCss: DOCS_BASE_CSS,
      swaggerOptions: buildSwaggerUiOptions(),
    });
    logger.log(`Auth Service Swagger docs at http://0.0.0.0:${port}/api/docs`);
  }

  await app.listen(port, '0.0.0.0');
  logger.log(`Auth Service running at http://0.0.0.0:${port}/api/v1`);
}

bootstrap().catch(async () => {
  const logger = new Logger('AuthService');
  logger.error('Fatal error during bootstrap');
  alerts.notify({ kind: 'startup_failure' });
  await alerts.flush();
  process.exit(1);
});

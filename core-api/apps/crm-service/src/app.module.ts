import { validateEnvironment, LivenessModule } from '@common';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { PassportModule } from '@nestjs/passport';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { CrmModule } from './crm.module';
import { LoggingInterceptor, JwtStrategy, GatewayEnforcementGuard } from '@common';

@Module({
  imports: [
    LivenessModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      cache: true,
      validate: validateEnvironment('crm-service'),
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: {
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
          password: config.get<string>('REDIS_PASSWORD') || undefined,
          connectTimeout: 2000,
          enableOfflineQueue: true,
          maxRetriesPerRequest: 1,
          enableReadyCheck: false,
        },
        defaultJobOptions: {
          removeOnComplete: true,
          removeOnFail: false,
        },
      }),
    }),
    CrmModule,
  ],
  providers: [
    JwtStrategy,
    { provide: APP_GUARD, useClass: GatewayEnforcementGuard },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  ],
})
export class AppModule {}

import { validateEnvironment, LivenessModule } from '@common';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ItModule } from './it.module';
import { LoggingInterceptor, JwtStrategy, GatewayEnforcementGuard } from '@common';

@Module({
  imports: [
    LivenessModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      cache: true,
      validate: validateEnvironment('it-service'),
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
  ],
  providers: [
    JwtStrategy,
    { provide: APP_GUARD, useClass: GatewayEnforcementGuard },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  ],
})
export class AppModule {}

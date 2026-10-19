import { PasswordResetService } from './services/password-reset.service';
import { PasswordResetDeliveryService } from './services/password-reset-delivery.service';
import { TelegramRecoveryService } from './services/telegram-recovery.service';
import { TelegramController, TelegramInternalController } from './controllers/telegram.controller';
import { TelegramMonitorGuard } from './guards/telegram-monitor.guard';
import { TelegramSettingsService } from './services/telegram-settings.service';
import { TelegramCommandsService } from './services/telegram-commands.service';
import { CompanyAccessService } from './services/company-access.service';
import { MfaService } from './services/mfa.service';
import { AuthPolicyGuard } from './guards/auth-policy.guard';
import { AuthAuditInterceptor } from './guards/auth-audit.interceptor';
import { Module } from '@nestjs/common';
import { JwtModule, JwtSignOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PolicyReaderGuard } from './guards/policy-reader.guard';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { SecurityPolicyService } from './services/security-policy.service';
import { AuthRepository } from './repositories/auth.repository';
import { AuthPrismaService } from './database/auth-prisma.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          issuer: 'inva-auth', audience: 'inva-api',
          expiresIn: config.get<JwtSignOptions['expiresIn']>('JWT_ACCESS_EXPIRES_IN', '15m'),
        },
      }),
    }),
  ],
  controllers: [AuthController, TelegramController, TelegramInternalController],
  providers: [
    TelegramMonitorGuard,
    TelegramSettingsService,
    TelegramCommandsService,
    AuthService,
    PasswordResetService,
    PasswordResetDeliveryService,
    TelegramRecoveryService,
    CompanyAccessService,
    MfaService,
    PolicyReaderGuard,
    AuthAuditInterceptor,
    AuthPolicyGuard,
    SecurityPolicyService,
    AuthRepository,
    AuthPrismaService,
    JwtStrategy,
  ],
  exports: [AuthService, SecurityPolicyService, AuthRepository, AuthPrismaService],
})
export class AuthModule {}

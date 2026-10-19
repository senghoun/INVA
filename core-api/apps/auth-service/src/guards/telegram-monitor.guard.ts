import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MONITORING_SERVICES } from '../dto/telegram-settings.dto';

@Injectable()
export class TelegramMonitorGuard implements CanActivate {
  constructor(private readonly jwt: JwtService, private readonly config: ConfigService) {}
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const header = request.headers.authorization;
    try {
      if (typeof header !== 'string' || !header.startsWith('Bearer ')) throw new Error();
      const claims = this.jwt.verify(header.slice(7), {
        secret: this.config.getOrThrow<string>('JWT_SECRET'), algorithms: ['HS256'],
        audience: 'telegram-monitoring', issuer: MONITORING_SERVICES,
      });
      if (claims.scope !== 'telegram:monitor' || !Number.isInteger(claims.exp) || !Number.isInteger(claims.iat) ||
          claims.exp <= claims.iat || claims.exp - claims.iat > 30 || claims.iat > Math.floor(Date.now() / 1000) + 5) throw new Error();
      if (request.method === 'POST' && request.body?.service !== claims.iss) throw new Error();
      return true;
    } catch { throw new UnauthorizedException(); }
  }
}

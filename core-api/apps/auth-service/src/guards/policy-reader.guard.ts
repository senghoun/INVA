import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PolicyReaderGuard implements CanActivate {
  constructor(private readonly jwt: JwtService, private readonly config: ConfigService) {}
  canActivate(context: ExecutionContext): boolean {
    const header = context.switchToHttp().getRequest().headers.authorization || '';
    try {
      const payload = this.jwt.verify(header.replace(/^Bearer /, ''), {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
        algorithms: ['HS256'], audience: 'auth-policy', issuer: 'api-gateway',
      });
      if (payload.scope !== 'policy:read') throw new Error();
      return true;
    } catch { throw new UnauthorizedException(); }
  }
}

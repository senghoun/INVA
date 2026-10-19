import { jsonStringArray } from '@common';
import { isUUID } from 'class-validator';
import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '@common';
import { AuthRepository } from '../repositories/auth.repository';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService, private readonly repository: AuthRepository) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      issuer: 'inva-auth', audience: 'inva-api',
      ignoreExpiration: false,
      algorithms: ['HS256'], passReqToCallback: true,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(request: { headers: Record<string, unknown> }, payload: JwtPayload): Promise<JwtPayload> {
    if (payload.type !== 'access' || !payload.sid || !payload.sub) {
      throw new UnauthorizedException('Please sign in again.');
    }
    const [user, session] = await Promise.all([
      this.repository.findByIdWithRoles(payload.sub),
      this.repository.findActiveSession(payload.sub, payload.sid),
    ]);
    if (!user?.isActive || user.mustChangePassword || !session || (user.mfaEnabled && !session.mfaVerified)) throw new UnauthorizedException('Session is no longer active.');
    let companyScope: JwtPayload['companyScope'];
    const companyId = request.headers['x-company-id'];
    if (companyId !== undefined) {
      if (typeof companyId !== 'string' || !isUUID(companyId)) throw new ForbiddenException('Invalid company context.');
      const membership = await this.repository.findCompanyMembership(payload.sub, companyId);
      if (!membership || user.userType !== 'INTERNAL') throw new ForbiddenException('No active access to this company.');
      companyScope = { companyId: membership.companyId, branchIds: jsonStringArray(membership.branchIds), permissions: jsonStringArray(membership.permissions) };
    }
    return { ...payload, companyScope, email: user.email, userType: user.userType,
      roles: user.userRoles.filter(r => r.role.isActive).map(r => r.role.name) };
  }
}

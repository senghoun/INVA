import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JwtAuthGuard validates the Bearer token on every protected route.
 * On success it attaches the decoded JwtPayload to request.user.
 * Throws 401 UnauthorizedException on missing or invalid tokens.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  override handleRequest<TUser>(err: any, user: TUser, info: any): TUser {
    if (err || !user) {
      throw (
        err ||
        new UnauthorizedException(
          info?.message || 'Unauthorized access. Valid Bearer token required.',
        )
      );
    }
    return user;
  }
}

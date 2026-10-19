import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { USER_TYPE_KEY } from '../decorators/require-user-type.decorator';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

/**
 * UserTypeGuard enforces domain-level access control based on the
 * userType claim embedded in the JWT.
 *
 * Must be applied AFTER JwtAuthGuard so that request.user is populated.
 */
@Injectable()
export class UserTypeGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredTypes = this.reflector.getAllAndOverride<
      JwtPayload['userType'][]
    >(USER_TYPE_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredTypes || requiredTypes.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: JwtPayload }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('No authenticated user found on request.');
    }

    if (!requiredTypes.includes(user.userType)) {
      throw new ForbiddenException(
        `Access denied. Required user type: [${requiredTypes.join(', ')}]. ` +
          `Your user type: ${user.userType}.`,
      );
    }

    return true;
  }
}

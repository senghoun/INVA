import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/require-roles.decorator';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

/**
 * RolesGuard enforces role-based access control based on the
 * roles claim embedded in the authenticated JWT payload.
 *
 * Must be placed after JwtAuthGuard so request.user exists.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: JwtPayload }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('No authenticated user found on request.');
    }

    const userRoles = user.roles || [];
    const hasRole = requiredRoles.some((role) =>
      userRoles.map((r) => r.toUpperCase()).includes(role.toUpperCase()),
    );

    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied. Required roles: [${requiredRoles.join(', ')}]. Your roles: [${userRoles.join(', ')}].`,
      );
    }

    return true;
  }
}

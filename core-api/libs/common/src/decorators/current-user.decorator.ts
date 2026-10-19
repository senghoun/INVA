import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

/**
 * Parameter decorator that extracts the authenticated user payload
 * from request.user (populated by JwtAuthGuard via Passport).
 *
 * Usage:
 *   @Get('me')
 *   getMe(@CurrentUser() user: JwtPayload) {}
 *
 *   @Get('email')
 *   getEmail(@CurrentUser('email') email: string) {}
 */
export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user?: JwtPayload }>();
    const user = request.user;
    if (!user) return null;
    return data ? user[data] : user;
  },
);

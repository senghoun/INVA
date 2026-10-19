import { SetMetadata, CustomDecorator } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Decorator to enforce RBAC roles on a route handler or controller.
 * Must be used in conjunction with RolesGuard.
 *
 * Usage:
 *   @RequireRoles('admin', 'hr_manager')
 */
export const RequireRoles = (...roles: string[]): CustomDecorator<string> =>
  SetMetadata(ROLES_KEY, roles);

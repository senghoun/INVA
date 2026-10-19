import { SetMetadata, CustomDecorator } from '@nestjs/common';
import { UserType } from '../interfaces/jwt-payload.interface';

export const USER_TYPE_KEY = 'userType';

/**
 * Decorator to enforce domain-level user type (INTERNAL vs EXTERNAL).
 * Must be used in conjunction with UserTypeGuard.
 *
 * Usage:
 *   @RequireUserType('INTERNAL')
 */
export const RequireUserType = (
  ...types: UserType[]
): CustomDecorator<string> => SetMetadata(USER_TYPE_KEY, types);

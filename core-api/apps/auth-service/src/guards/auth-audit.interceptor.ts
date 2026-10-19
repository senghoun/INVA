import { JwtService } from '@nestjs/jwt';
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { catchError, mergeMap } from 'rxjs/operators';
import { SecurityPolicyService } from '../services/security-policy.service';

@Injectable()
export class AuthAuditInterceptor implements NestInterceptor {
  constructor(private readonly policy: SecurityPolicyService, private readonly jwt: JwtService) {}
  intercept(context: ExecutionContext, next: CallHandler) {
    const req = context.switchToHttp().getRequest();
    if (req.method === 'GET') return next.handle();
    const handler = context.getHandler().name;
    const actions: Record<string, string> = {
      requestPasswordReset: 'PASSWORD_RESET_REQUESTED', verifyPasswordReset: 'PASSWORD_RESET_VERIFIED', confirmPasswordReset: 'PASSWORD_RESET_COMPLETED',
      linkTelegramRecovery: 'TELEGRAM_RECOVERY_LINK_REQUESTED', unlinkTelegramRecovery: 'TELEGRAM_RECOVERY_UNLINKED',
      login: 'LOGIN_SUCCESS', verifyMfa: 'LOGIN_SUCCESS', disableMfa: 'MFA_REMOVED', setupMfa: 'MFA_ENROLLMENT_STARTED', confirmMfa: 'MFA_ENABLED', refresh: 'TOKEN_REFRESHED', logout: 'LOGOUT',
      resetUserPassword: 'ADMIN_PASSWORD_RESET', completeTemporaryPassword: 'TEMPORARY_PASSWORD_CHANGED', changePassword: 'PASSWORD_CHANGED', register: 'USER_REGISTERED',
      createUser: 'USER_CREATED', updateUser: 'USER_UPDATED', deleteUser: 'USER_DEACTIVATED',
      createRole: 'ROLE_CREATED', deleteRole: 'ROLE_DEACTIVATED', assignRole: 'ROLE_ASSIGNED', removeRole: 'ROLE_REMOVED',
    };
    const record = (success: boolean, value?: any) => {
      let verifiedEmail: string | undefined;
      if (value?.accessToken) {
        try { verifiedEmail = this.jwt.verify(value.accessToken, { algorithms: ['HS256'], issuer: 'inva-auth', audience: 'inva-api' }).email; } catch { /* Never infer identity from untrusted claims. */ }
      }
      const pending = success && handler === 'login' && (value?.requiresMfa || value?.requiresPasswordChange);
      return this.policy.recordAuditLog({
      userEmail: req.user?.email || verifiedEmail || (handler === 'login' ? req.loginAuditIdentity : undefined),
      action: handler === 'login' && !success ? 'LOGIN_FAILED' : pending ? 'LOGIN_PASSWORD_VERIFIED' : actions[handler] || handler,
      outcome: pending ? 'PENDING' : success ? 'SUCCESS' : 'FAILED', ip: req.securityClientIp || req.ip,
      userAgent: req.headers['user-agent']?.slice(0, 512),
      details: { targetId: req.params?.id || (handler === 'completeTemporaryPassword' ? req.user?.sub : null) || null },
    });
    };
    return next.handle().pipe(
      mergeMap(async value => { await record(true, value); return value; }),
      catchError(async error => {
        // Infrastructure and validation errors are not incorrect passwords.
        if (handler !== 'login' || error.getStatus?.() === 401) await record(false);
        throw error;
      }),
    );
  }
}

import { rateLimiter } from './rate-limiter';
import {
  request,
  setStoredToken,
  clearStoredTokens,
  getStoredToken,
  getStoredRefreshToken,
  isJwtExpired,
  isCookieSession,
} from './api';
import {
  User,
  Role,
  UserType,
  TwoFactorMethod,
  MfaSetupResult,
  MfaChallengeResponse,
  SecurityPolicy,
  TelegramSettings,
  TelegramSettingsUpdate,
  TelegramChatDiscovery,
  PaginatedAuditLog,
} from '../types';
import { API_ROUTES } from '../config/api';

// ─── Response Interfaces ─────────────────────────────────────────────────────

export interface LoginResult {
  accessToken: string;
  refreshToken?: string;
  browserSession?: boolean;
  tokenType: string;
  expiresIn: number;
}

/** Returned when MFA is required after credential check */
export interface MfaRequiredResult {
  requiresMfa: true;
  challenge: MfaChallengeResponse;
}

export interface PasswordChangeRequiredResult {
  requiresPasswordChange: true;
  passwordChangeToken: string;
  expiresIn: number;
}
export type LoginResponse = LoginResult | MfaRequiredResult | PasswordChangeRequiredResult;
export function isPasswordChangeRequired(r: LoginResponse): r is PasswordChangeRequiredResult {
  return (r as PasswordChangeRequiredResult).requiresPasswordChange === true;
}

export function isMfaRequired(r: LoginResponse): r is MfaRequiredResult {
  return (r as MfaRequiredResult).requiresMfa === true;
}

// ─── Query Params ────────────────────────────────────────────────────────────

export interface UserQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  userType?: UserType;
  isActive?: boolean;
}

export interface PaginatedUsersResult {
  data: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuditLogQueryParams {
  page?: number;
  limit?: number;
  userEmail?: string;
  ip?: string;
  action?: string;
  outcome?: string;
  from?: string; // ISO date string
  to?: string;   // ISO date string
}

// ─── User Mutation Payloads ──────────────────────────────────────────────────

export interface CreateUserData {
  email: string;
  password: string;
  userType?: UserType;
  roleIds?: string[];
}

export interface UpdateUserData {
  email?: string;
  userType?: UserType;
  isActive?: boolean;
}

// ─── Auth Service ────────────────────────────────────────────────────────────

export interface SessionState {
  status: 'checking' | 'authenticated' | 'signed-out' | 'unavailable';
  message?: string;
  retryAt?: number;
}
class AuthService {
  private profileRequest: { key: string; promise: Promise<User | null> } | null = null;
  private sessionState: SessionState = { status: getStoredToken() || getStoredRefreshToken() ? 'checking' : 'signed-out' };
  private sessionListeners = new Set<(state: SessionState) => void>();
  public getSessionState(): SessionState { return this.sessionState; }
  public subscribeSession(listener: (state: SessionState) => void): () => void {
    this.sessionListeners.add(listener); listener(this.sessionState);
    return () => { this.sessionListeners.delete(listener); };
  }
  private setSessionState(state: SessionState): void {
    this.sessionState = state;
    this.sessionListeners.forEach(listener => listener(state));
  }
  private profileVersion = 0;
  private currentUser: User | null = null;
  private authListeners: Set<(user: User | null) => void> = new Set();

  constructor() {
    window.addEventListener('inva:session-cleared', () => {
      ++this.profileVersion;
      this.profileRequest = null;
      this.setSessionState({ status: 'signed-out' });
      this.currentUser = null;
      this.notify();
    });
    window.addEventListener('storage', event => {
      if (event.key?.startsWith('inva_superapp_')) void this.fetchProfile().catch(() => {});
    });
  }

  public canAdminister(): boolean {
    return !!this.currentUser?.isActive && this.currentUser.userType === 'INTERNAL' && this.currentUser.roles.includes('ADMIN');
  }

  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  public isAuthenticated(): boolean {
    const token = getStoredToken();
    if (!token) return false;
    if (isJwtExpired(token) && !getStoredRefreshToken()) return false;
    return true;
  }

  public subscribe(listener: (user: User | null) => void): () => void {
    this.authListeners.add(listener);
    listener(this.currentUser);
    return () => this.authListeners.delete(listener);
  }

  private notify(): void {
    this.authListeners.forEach((l) => l(this.currentUser));
  }

  // ─── Core Login / Logout ──────────────────────────────────────────────────

  /**
   * Attempt login. Returns either a full LoginResult (tokens) or an
   * MfaRequiredResult when a second factor is needed. Callers should use
   * `isMfaRequired()` to discriminate.
   */
  public async login(email: string, password: string): Promise<LoginResponse> {
    const res = await request<LoginResponse>(`${API_ROUTES.AUTH}/login`, {
      method: 'POST',
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    });

    if (isPasswordChangeRequired(res)) {
      clearStoredTokens();
      rateLimiter.recordSuccess(`login:${email.trim().toLowerCase()}`);
      return res;
    }
    if (!isMfaRequired(res)) {
      rateLimiter.recordSuccess(`login:${email.trim().toLowerCase()}`);
      setStoredToken(res.accessToken, res.refreshToken);
      if (!await this.fetchProfile()) throw new Error('Unable to verify your session. Please sign in again.');
    }

    return res;
  }

  /**
   * Complete the MFA challenge. Provide the OTP code and the sessionToken
   * returned from the initial login challenge.
   */
  public async verifyMfaOtp(code: string, sessionToken: string): Promise<LoginResult> {
    const res = await request<LoginResult>(`${API_ROUTES.AUTH}/mfa/verify`, {
      method: 'POST',
      body: JSON.stringify({ code, sessionToken }),
    });
    setStoredToken(res.accessToken, res.refreshToken);
    await this.fetchProfile();
    return res;
  }

  public fetchProfile(): Promise<User | null> {
    const token = getStoredToken();
    const refreshToken = getStoredRefreshToken();
    const key = `${token || ''}:${refreshToken || ''}`;
    if (this.profileRequest?.key === key) return this.profileRequest.promise;
    const version = ++this.profileVersion;
    if (!token && !refreshToken) {
      this.currentUser = null; this.notify(); this.setSessionState({ status: 'signed-out' });
      sessionStorage.removeItem('inva_profile_cache');
      return Promise.resolve(null);
    }

    this.setSessionState({ status: 'checking' });
    let promise!: Promise<User | null>;
    promise = (async () => {
      try {
        const user = await request<User>(`${API_ROUTES.AUTH}/me`);
        if (version !== this.profileVersion || !getStoredToken()) return null;
        this.currentUser = user; this.notify(); this.setSessionState({ status: 'authenticated' });
        
        return user;
      } catch (err: any) {
        if (version !== this.profileVersion) return null;
        // The request layer clears credentials only for a confirmed invalid session.
        if (!getStoredToken() && !getStoredRefreshToken()) return null;
        if (err.status === 403) {
          this.setSessionState({ status: 'unavailable',
            message: err.message === 'Origin is not allowed.'
              ? 'This app address is not allowed by your sign-in policy. Open the app at an approved address or contact your administrator. Your session is saved.'
              : `${err.message || 'Session verification was denied by your sign-in policy.'} Your session is saved.` });
          throw err;
        }
        this.setSessionState({ status: 'unavailable',
          message: err.status === 429 ? 'Too many requests. Your session is saved; retrying shortly.' : 'Unable to verify your session right now. Your session is saved.',
          retryAt: Date.now() + (err.status === 429 ? Math.max(1, err.retryAfter ?? 60) : 10) * 1000 });
        throw err;
      } finally {
        if (this.profileRequest?.promise === promise) this.profileRequest = null;
      }
    })();
    this.profileRequest = { key, promise };
    return promise;
  }

  public async logout(): Promise<void> {
    const refreshToken = getStoredRefreshToken();
    try {
      if (refreshToken) await request(`${API_ROUTES.AUTH}/logout`, {
        method: 'POST', body: JSON.stringify(isCookieSession() ? {} : { refreshToken }),
      });
    } finally {
      clearStoredTokens();
    }
  }

  // ─── Password Management ──────────────────────────────────────────────────

  /** Change password for the currently authenticated user */
  public async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await request<void>(`${API_ROUTES.AUTH}/change-password`, {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (this.currentUser?.email) rateLimiter.recordSuccess(`login:${this.currentUser.email.trim().toLowerCase()}`);
    clearStoredTokens();
  }

  /** Send a password reset email (unauthenticated) */
  public async requestPasswordReset(email: string): Promise<void> {
    await request<void>(`${API_ROUTES.AUTH}/password/reset-request`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  /** Confirm a password reset using the emailed token */
  public async confirmPasswordReset(token: string, newPassword: string): Promise<void> {
    await request<void>(`${API_ROUTES.AUTH}/password/reset-confirm`, {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  }

  // ─── MFA Setup ────────────────────────────────────────────────────────────

  /** Initiate MFA setup. Returns QR URI (TOTP) or sends OTP (SMS/EMAIL/TELEGRAM) */
  public async setupMfa(method: TwoFactorMethod, password: string): Promise<MfaSetupResult> {
    return request<MfaSetupResult>(`${API_ROUTES.AUTH}/mfa/setup`, {
      method: 'POST',
      body: JSON.stringify({ method, password }),
    });
  }

  /** Confirm MFA setup by verifying the first OTP code */
  public async confirmMfaSetup(code: string): Promise<{ backupCodes: string[] }> {
    return request<{ backupCodes: string[] }>(`${API_ROUTES.AUTH}/mfa/confirm`, {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  /** Disable MFA for the current user */
  public async disableMfa(password: string, code: string): Promise<void> {
    await request<void>(`${API_ROUTES.AUTH}/mfa`, {
      method: 'DELETE',
      body: JSON.stringify({ password, code }),
    });
  }

  // ─── OTP ──────────────────────────────────────────────────────────────────

  /** Request an OTP be sent via a specific channel (used during login MFA) */
  public async sendOtp(
    sessionToken: string,
    channel: TwoFactorMethod,
  ): Promise<{ sent: boolean; destination?: string }> {
    return request(`${API_ROUTES.AUTH}/otp/send`, {
      method: 'POST',
      body: JSON.stringify({ sessionToken, channel }),
    });
  }

  // ─── Security Policy (Admin) ──────────────────────────────────────────────

  public async getSecurityPolicy(): Promise<SecurityPolicy> {
    return request<SecurityPolicy>(`${API_ROUTES.AUTH}/security/policy`);
  }

  public async updateSecurityPolicy(policy: Partial<SecurityPolicy>): Promise<SecurityPolicy> {
    const { id, updatedAt, updatedBy, ...cleanPayload } = policy as any;
    return request<SecurityPolicy>(`${API_ROUTES.AUTH}/security/policy`, {
      method: 'PATCH',
      body: JSON.stringify(cleanPayload),
    });
  }

  public async getTelegramSettings(): Promise<TelegramSettings> {
    return request<TelegramSettings>(`${API_ROUTES.AUTH}/security/telegram`);
  }

  public async updateTelegramSettings(settings: TelegramSettingsUpdate): Promise<TelegramSettings> {
    return request<TelegramSettings>(`${API_ROUTES.AUTH}/security/telegram`, {
      method: 'PATCH', body: JSON.stringify(settings),
    });
  }

  public async discoverTelegramChats(botToken?: string): Promise<TelegramChatDiscovery> {
    return request<TelegramChatDiscovery>(`${API_ROUTES.AUTH}/security/telegram/chats`, {
      method: 'POST', body: JSON.stringify(botToken ? { botToken } : {}),
    });
  }

  public async testTelegramAlerts(target?: { service?: string; kind?: string }): Promise<{ sent: boolean }> {
    return request<{ sent: boolean }>(`${API_ROUTES.AUTH}/security/telegram/test`, {
      method: 'POST', ...(target ? { body: JSON.stringify(target) } : {}),
    });
  }

  // ─── Audit Log (Admin) ────────────────────────────────────────────────────

  public async getAuditLog(params: AuditLogQueryParams = {}): Promise<PaginatedAuditLog> {
    const qs = new URLSearchParams();
    if (params.page)      qs.set('page', String(params.page));
    if (params.limit)     qs.set('limit', String(params.limit));
    if (params.userEmail) qs.set('userEmail', params.userEmail);
    if (params.ip)        qs.set('ip', params.ip);
    if (params.action)    qs.set('action', params.action);
    if (params.outcome)   qs.set('outcome', params.outcome);
    if (params.from)      qs.set('from', params.from);
    if (params.to)        qs.set('to', params.to);
    const query = qs.toString();
    return request<PaginatedAuditLog>(
      `${API_ROUTES.AUTH}/security/audit${query ? `?${query}` : ''}`,
    );
  }

  // ─── Users CRUD ───────────────────────────────────────────────────────────

  public async listUsers(params: UserQueryParams = {}): Promise<PaginatedUsersResult> {
    const searchParams = new URLSearchParams();
    if (params.page)     searchParams.set('page', String(params.page));
    if (params.limit)    searchParams.set('limit', String(params.limit));
    if (params.search)   searchParams.set('search', params.search);
    if (params.userType) searchParams.set('userType', params.userType);
    if (params.isActive !== undefined)
      searchParams.set('isActive', String(params.isActive));

    const qs = searchParams.toString();
    const endpoint = `${API_ROUTES.AUTH}/users${qs ? `?${qs}` : ''}`;
    return request<PaginatedUsersResult>(endpoint);
  }

  public async getUser(id: string): Promise<User> {
    return request<User>(`${API_ROUTES.AUTH}/users/${id}`);
  }

  public async createUser(data: CreateUserData): Promise<User> {
    return request<User>(`${API_ROUTES.AUTH}/users`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async updateUser(id: string, data: UpdateUserData): Promise<User> {
    return request<User>(`${API_ROUTES.AUTH}/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  public async resetUserPassword(id: string): Promise<{ temporaryPassword: string; expiresAt: string }> {
    return request(`${API_ROUTES.AUTH}/users/${id}/reset-password`, { method: 'POST' });
  }

  public async completeTemporaryPassword(passwordChangeToken: string, newPassword: string): Promise<void> {
    await request(`${API_ROUTES.AUTH}/complete-password-change`, {
      method: 'POST', body: JSON.stringify({ passwordChangeToken, newPassword }),
    });
  }

  public async deleteUser(id: string): Promise<User> {
    return request<User>(`${API_ROUTES.AUTH}/users/${id}`, {
      method: 'DELETE',
    });
  }

  // ─── Roles & Permissions RBAC ─────────────────────────────────────────────

  public async listRoles(includeInactive = true): Promise<Role[]> {
    return request<Role[]>(`${API_ROUTES.AUTH}/roles?includeInactive=${includeInactive}`);
  }

  public async createRole(name: string, description?: string): Promise<Role> {
    return request<Role>(`${API_ROUTES.AUTH}/roles`, {
      method: 'POST',
      body: JSON.stringify({ name: name.toUpperCase(), description }),
    });
  }

  public async deleteRole(id: string): Promise<Role> {
    return request<Role>(`${API_ROUTES.AUTH}/roles/${id}`, {
      method: 'DELETE',
    });
  }

  public async assignRole(userId: string, roleId: string): Promise<User> {
    return request<User>(`${API_ROUTES.AUTH}/users/${userId}/roles`, {
      method: 'POST',
      body: JSON.stringify({ roleId }),
    });
  }

  public async removeRole(userId: string, roleId: string): Promise<User> {
    return request<User>(`${API_ROUTES.AUTH}/users/${userId}/roles/${roleId}`, {
      method: 'DELETE',
    });
  }
}

export const authService = new AuthService();

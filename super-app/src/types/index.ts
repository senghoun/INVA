export type ServiceHealthStatus = 'UP' | 'DOWN' | 'DEGRADED' | 'CHECKING' | 'DISCONNECTED';

export interface MicroserviceConfig {
  key: string;
  name: string;
  port: number;
  url: string;
  proxyPrefix: string;
  tag: string;
  description: string;
  category: 'core' | 'operations' | 'business';
}

export interface ServiceLiveMetric {
  key: string;
  name: string;
  port: number;
  status: ServiceHealthStatus;
  latencyMs: number;
  latencyHistory: number[]; // rolling history (last 20 checks)
  uptimePercent: number;
  totalChecks: number;
  successfulChecks: number;
  lastChecked: string;
  error?: string;
}

export interface GatewayHealthResponse {
  status: string;
  gateway: string;
  timestamp: string;
  downstreamServices: Record<string, string>;
}

export type IncidentSeverity = 'CRITICAL' | 'WARNING' | 'INFO' | 'RESOLVED';

export interface IncidentEvent {
  id: string;
  serviceKey: string;
  serviceName: string;
  severity: IncidentSeverity;
  timestamp: string;
  title: string;
  details: string;
}

export type UserType = 'INTERNAL' | 'EXTERNAL';

// ─── MFA & OTP ─────────────────────────────────────────────────────────────
export type TwoFactorMethod = 'TOTP' | 'SMS' | 'EMAIL' | 'TELEGRAM';

export interface OtpChannel {
  method: TwoFactorMethod;
  destination: string; // masked phone/email/chat-id
}

export interface MfaSetupResult {
  method: TwoFactorMethod;
  /** Only for TOTP — otpauth:// URI to render as QR */
  otpauthUri?: string;
  /** Only for TOTP — base32 secret for manual entry */
  secret?: string;
  /** Shown once after setup confirmation */
  backupCodes?: string[];
}

export interface MfaChallengeResponse {
  /** Opaque token to include when verifying OTP */
  sessionToken: string;
  method: TwoFactorMethod;
  /** Masked destination, e.g. "***@gmail.com" or "+1***1234" */
  destination?: string;
}

// ─── Security Policy ────────────────────────────────────────────────────────
export interface RateLimitPolicy {
  enabled: boolean;
  /** Max failed attempts before lockout */
  maxAttempts: number;
  /** Sliding window in seconds */
  windowSeconds: number;
  /** Lockout duration in seconds */
  lockoutSeconds: number;
}

export type IpRestrictionMode = 'DISABLED' | 'ALLOWLIST' | 'BLOCKLIST';

export interface IpRestrictionPolicy {
  mode: IpRestrictionMode;
  /** CIDR ranges or exact IPs */
  allowlist: string[];
  blocklist: string[];
}

export interface DomainRestrictionPolicy {
  enabled: boolean;
  /** Allowed domains for authentication and API access, e.g. ["invaestate.com", "hr.invaestate.com"] */
  allowedDomains: string[];
  /** Mapping of microservice keys to authorized domains, e.g. {"hr-service": ["hr.invaestate.com", "super.invaestate.com"]} */
  serviceDomainMap?: Record<string, string[]>;
}

export interface SessionPolicy {
  /** Access token TTL in seconds */
  accessTokenTtl: number;
  /** Refresh token TTL in seconds */
  refreshTokenTtl: number;
  /** Max concurrent sessions per user (0 = unlimited) */
  maxConcurrentSessions: number;
}

export interface SecurityPolicy {
  id?: string;
  rateLimit: RateLimitPolicy;
  ipRestriction: IpRestrictionPolicy;
  domainRestriction: DomainRestrictionPolicy;
  session: SessionPolicy;
  updatedAt?: string;
  updatedBy?: string | null;
}

export type TelegramAlertKind = 'http_error' | 'logged_error' | 'startup_failure' | 'rate_limit' | 'ip_block' | 'domain_block' | 'suspicious_probe' | 'repeated_rejections';
export interface TelegramTopicRoute { service: string; kind: TelegramAlertKind | '*'; messageThreadId: number; }
export interface TelegramSettings {
  enabled: boolean;
  commandsEnabled: boolean;
  adminUserIds: string[];
  tokenConfigured: boolean;
  encryptionConfigured: boolean;
  botUsername: string | null;
  chatId: string;
  messageThreadId: number | null;
  topicRoutes: TelegramTopicRoute[];
  cooldownSeconds: number;
  maxPerMinute: number;
  failureThreshold: number;
  failureWindowSeconds: number;
  updatedAt: string;
  updatedBy: string | null;
}

export type TelegramSettingsUpdate = Partial<Pick<TelegramSettings,
  'enabled' | 'commandsEnabled' | 'adminUserIds' | 'chatId' | 'messageThreadId' | 'topicRoutes' | 'cooldownSeconds' | 'maxPerMinute' | 'failureThreshold' | 'failureWindowSeconds'>> & { botToken?: string };

export interface TelegramChatDiscovery {
  botUsername: string;
  chats: { id: string; label: string; type: string; senderUserIds?: string[]; topics?: { id: number; label: string }[] }[];
}

// ─── Audit Log ──────────────────────────────────────────────────────────────
export type AuditAction =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGIN_MFA_CHALLENGE'
  | 'LOGOUT'
  | 'PASSWORD_CHANGED'
  | 'PASSWORD_RESET_REQUESTED'
  | 'PASSWORD_RESET_CONFIRMED'
  | 'MFA_ENABLED'
  | 'MFA_DISABLED'
  | 'OTP_SENT'
  | 'OTP_VERIFIED'
  | 'OTP_FAILED'
  | 'RATE_LIMITED'
  | 'IP_BLOCKED'
  | 'ACCOUNT_LOCKED'
  | 'TOKEN_REFRESHED';

export type AuditOutcome = 'SUCCESS' | 'FAILED' | 'BLOCKED' | 'PENDING';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: AuditAction;
  outcome: AuditOutcome;
  userId?: string;
  userEmail?: string;
  ip: string;
  country?: string;
  userAgent?: string;
  details?: string;
}

export interface PaginatedAuditLog {
  data: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Password Policy ────────────────────────────────────────────────────────
export interface PasswordStrength {
  score: number; // 0-4
  label: 'Very Weak' | 'Weak' | 'Fair' | 'Strong' | 'Very Strong';
  color: string;
  checks: {
    minLength: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
}

// ─── Extended User ──────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  userType: UserType;
  isActive: boolean;
  mfaEnabled: boolean;
  mfaMethod?: TwoFactorMethod;
  phoneNumber?: string;
  telegramChatId?: string;
  lastLoginAt?: string;
  lastLoginIp?: string;
  failedLoginCount?: number;
  lockedUntil?: string;
  roles: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface AuthSession {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
}

export interface EndpointFieldDefinition {
  name: string;
  type: string;
  required: boolean;
  description?: string;
  example?: any;
  enum?: any[];
  default?: any;
}

export interface ApiEndpointItem {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  serviceKey: string;
  summary: string;
  description?: string;
  parameters?: any[];
  requestBody?: any;
  requestBodySchemaName?: string;
  resolvedSchema?: any;
  samplePayload?: any;
  requiredSamplePayload?: any;
  fieldDefinitions?: EndpointFieldDefinition[];
  responses?: any;
  security?: any[];
}

export interface ApiCallRecord {
  id: string;
  method: string;
  url: string;
  route: string;
  statusCode: number;
  durationMs: number;
  userEmail: string;
  userId: string | null;
  userRoles: string[];
  ip: string;
  timestamp: string;
}

export interface EndpointMetric {
  route: string;
  method: string;
  totalHits: number;
  avgDurationMs: number;
  errorCount: number;
  lastAccessed: string;
}

export interface UserActivityMetric {
  email: string;
  userId: string | null;
  totalCalls: number;
  lastCall: string;
  roles: string[];
  topEndpoints: { route: string; count: number }[];
}

export interface GatewayTelemetrySummary {
  status: string;
  timestamp: string;
  totalRequests: number;
  totalErrors: number;
  activeUsersCount: number;
  avgLatencyMs: number;
  endpoints: EndpointMetric[];
  users: UserActivityMetric[];
  recentLogs: ApiCallRecord[];
}

/**
 * Centralized Dynamic Environment Configuration for INVA Super-App
 * Reads from Vite's `import.meta.env` with sensible fallbacks.
 * Matches `core-api/.env` network topology and ports.
 */

const getEnvString = (key: string, fallback: string): string => {
  const val = import.meta.env[key];
  if (typeof val === 'string' && val.trim().length > 0) {
    return val.trim();
  }
  return fallback;
};

const getEnvNumber = (key: string, fallback: number): number => {
  const val = import.meta.env[key];
  if (val !== undefined && val !== null && val !== '') {
    const num = Number(val);
    if (!isNaN(num)) return num;
  }
  return fallback;
};

export const env = {
  app: {
    name: getEnvString('VITE_APP_NAME', 'INVA SUPER-APP'),
    tagline: getEnvString('VITE_APP_TAGLINE', 'API Gateway & Microservices Control Center'),
    version: getEnvString('VITE_APP_VERSION', '2.0.0'),
    mode: getEnvString('VITE_APP_ENV', import.meta.env.MODE || 'development'),
    port: getEnvNumber('VITE_PORT', 5174),
  },

  api: {
    // API version prefix, e.g. '/api/v1' or '/api/v2'
    version: getEnvString('VITE_API_VERSION', '/api/v1'),
    // Optional base URL prefix (e.g. 'http://127.0.0.1:3000' or empty string for proxy)
    baseUrl: getEnvString('VITE_API_BASE_URL', ''),
    // Telemetry and health polling interval in ms
    defaultPollInterval: getEnvNumber('VITE_DEFAULT_POLL_INTERVAL', 3000),
  },

  services: {
    gateway: {
      key: 'gateway',
      name: 'API Gateway',
      port: getEnvNumber('VITE_GATEWAY_PORT', 3000),
      url: getEnvString('VITE_GATEWAY_URL', 'http://127.0.0.1:3000'),
    },
    auth: {
      key: 'auth-service',
      name: 'Auth & Identity Service',
      port: getEnvNumber('VITE_AUTH_SERVICE_PORT', 3001),
      url: getEnvString('VITE_AUTH_SERVICE_URL', 'http://127.0.0.1:3001'),
    },
    hr: {
      key: 'hr-service',
      name: 'HR & Personnel Service',
      port: getEnvNumber('VITE_HR_SERVICE_PORT', 3002),
      url: getEnvString('VITE_HR_SERVICE_URL', 'http://127.0.0.1:3002'),
    },
    crm: {
      key: 'crm-service',
      name: 'CRM & Customer Portal',
      port: getEnvNumber('VITE_CRM_SERVICE_PORT', 3003),
      url: getEnvString('VITE_CRM_SERVICE_URL', 'http://127.0.0.1:3003'),
    },
    ac: {
      key: 'ac-service',
      name: 'Accounting & Ledger Service',
      port: getEnvNumber('VITE_AC_SERVICE_PORT', 3004),
      url: getEnvString('VITE_AC_SERVICE_URL', 'http://127.0.0.1:3004'),
    },
    it: {
      key: 'it-service',
      name: 'IT Operations & Assets',
      port: getEnvNumber('VITE_IT_SERVICE_PORT', 3005),
      url: getEnvString('VITE_IT_SERVICE_URL', 'http://127.0.0.1:3005'),
    },
  },

  ai: {
    geminiApiKey: getEnvString('VITE_GEMINI_API_KEY', ''),
    atriaApiUrl: getEnvString('VITE_ATRIA_API_URL', 'https://api.atria-asi.ai'),
    atriaApiKey: getEnvString('VITE_ATRIA_API_KEY', ''),
    atriaModel: getEnvString('VITE_ATRIA_MODEL', 'Atria-Dawn-Preview'),
  },

  /**
   * Auth security hints — read from .env to pre-configure the Security Policy
   * for this specific deployment (e.g. hr.invaestate.com vs crm.invaestate.com).
   *
   * These are consumed by authBootstrap() on app startup.
   * Actual enforcement is always done server-side; these are UI-layer hints.
   *
   * .env.hr example:
   *   VITE_AUTH_ALLOWED_DOMAINS=invaestate.com
   *   VITE_AUTH_REQUIRE_MFA=true
   *   VITE_AUTH_IP_ALLOWLIST=192.168.10.0/24,10.8.0.0/16
   */
  authPolicy: {
    /** Comma-separated allowed email domains, e.g. "invaestate.com,inva.io" */
    allowedDomains: getEnvString('VITE_AUTH_ALLOWED_DOMAINS', '')
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean),

    /** Whether MFA is required for all logins in this deployment */
    requireMfa: getEnvString('VITE_AUTH_REQUIRE_MFA', 'false') === 'true',

    /** Max login attempts before lockout */
    rateLimitMaxAttempts: getEnvNumber('VITE_AUTH_RATE_LIMIT_MAX_ATTEMPTS', 5),

    /** Lockout duration in seconds */
    rateLimitLockoutSeconds: getEnvNumber('VITE_AUTH_RATE_LIMIT_LOCKOUT_SECONDS', 900),

    /**
     * Comma-separated IP/CIDR allowlist.
     * Empty = no IP restriction from env (use Security Policy panel instead).
     * e.g. "192.168.10.0/24,10.8.0.0/16"
     */
    ipAllowlist: getEnvString('VITE_AUTH_IP_ALLOWLIST', '')
      .split(',')
      .map((ip) => ip.trim())
      .filter(Boolean),
  },
} as const;

export type AppEnv = typeof env;


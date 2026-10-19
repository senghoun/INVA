export type ApplicationName = 'api-gateway' | 'auth-service' | 'hr-service' | 'crm-service' | 'ac-service' | 'it-service';

const SETTINGS: Record<ApplicationName, { port: string; defaultPort: number; database?: string }> = {
  'api-gateway': { port: 'GATEWAY_PORT', defaultPort: 3000 },
  'auth-service': { port: 'AUTH_SERVICE_PORT', defaultPort: 3001, database: 'DATABASE_AUTH_URL' },
  'hr-service': { port: 'HR_SERVICE_PORT', defaultPort: 3002, database: 'DATABASE_HR_URL' },
  'crm-service': { port: 'CRM_SERVICE_PORT', defaultPort: 3003, database: 'DATABASE_CRM_URL' },
  'ac-service': { port: 'AC_SERVICE_PORT', defaultPort: 3004, database: 'DATABASE_AC_URL' },
  'it-service': { port: 'IT_SERVICE_PORT', defaultPort: 3005, database: 'DATABASE_IT_URL' },
};

/** Validate only the selected application's dependencies. Never include supplied values in errors. */
export function validateEnvironment(application: ApplicationName) {
  return (input: Record<string, unknown>): Record<string, unknown> => {
    const output = { ...input };
    const problems: string[] = [];
    const production = input.NODE_ENV === 'production';
    const settings = SETTINGS[application];
    const text = (key: string) => typeof input[key] === 'string' ? input[key] as string : '';

    if (input.NODE_ENV !== undefined && !['development', 'test', 'production'].includes(text('NODE_ENV'))) {
      problems.push('NODE_ENV must be development, test, or production');
    }
    output.NODE_ENV = input.NODE_ENV ?? 'development';

    const integer = (key: string, fallback: number, maximum: number) => {
      const raw = output[key] ?? fallback;
      const value = Number(raw);
      if (!/^\d+$/.test(String(raw)) || !Number.isSafeInteger(value) || value < 1 || value > maximum) {
        problems.push(`${key} must be an integer between 1 and ${maximum}`);
      } else output[key] = value;
    };
    if (application === 'api-gateway' && input.GATEWAY_PORT === undefined && input.PORT !== undefined) {
      output.GATEWAY_PORT = input.PORT;
    }
    integer(settings.port, settings.defaultPort, 65535);

    const secret = (key: string) => {
      const value = text(key);
      if (!value.trim()) problems.push(`${key} is required`);
      else if (production && value.length < 32) problems.push(`${key} must contain at least 32 characters in production`);
    };
    secret('JWT_SECRET');
    if (application === 'auth-service') {
      secret('JWT_REFRESH_SECRET');
      if (text('JWT_SECRET') && text('JWT_SECRET') === text('JWT_REFRESH_SECRET')) {
        problems.push('JWT_REFRESH_SECRET must differ from JWT_SECRET');
      }
      if (text('TELEGRAM_ENCRYPTION_KEY') && !/^[a-f0-9]{64}$/i.test(text('TELEGRAM_ENCRYPTION_KEY'))) problems.push('TELEGRAM_ENCRYPTION_KEY must be a hex-encoded 32-byte key');
      if (text('MFA_ENCRYPTION_KEY') && !/^[a-f0-9]{64}$/i.test(text('MFA_ENCRYPTION_KEY'))) problems.push('MFA_ENCRYPTION_KEY must be a hex-encoded 32-byte key');
      if (text('BROWSER_ORIGINS')) {
        for (const origin of text('BROWSER_ORIGINS').split(',').map(value => value.trim())) {
          try {
            const url = new URL(origin);
            if (!['http:', 'https:'].includes(url.protocol) || url.origin !== origin || (production && url.protocol !== 'https:')) throw new Error();
          } catch { problems.push('BROWSER_ORIGINS must contain exact HTTP(S) origins, using HTTPS in production'); }
        }
      }
      integer('THROTTLE_TTL', 60000, 86400000);
      integer('THROTTLE_LIMIT', 100, 1000000);
    }

    if (settings.database) {
      try {
        const url = new URL(text(settings.database));
        if (!['postgresql:', 'postgres:'].includes(url.protocol) || !url.hostname || url.pathname.length < 2) throw new Error();
      } catch { problems.push(`${settings.database} must be a PostgreSQL connection URL with a host and database`); }
    }

    const upstreamKeys = application === 'api-gateway'
      ? ['AUTH_SERVICE_URL', 'HR_SERVICE_URL', 'CRM_SERVICE_URL', 'AC_SERVICE_URL', 'IT_SERVICE_URL']
      : application === 'auth-service' ? ['HR_SERVICE_URL'] : ['AUTH_SERVICE_URL', ...(application === 'crm-service' ? ['AC_SERVICE_URL'] : [])];
    for (const key of upstreamKeys) {
      if (input[key] === undefined) continue; // Existing localhost defaults remain supported.
      try {
        const url = new URL(text(key));
        if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error();
        output[key] = url.origin;
      } catch { problems.push(`${key} must be an HTTP(S) origin without credentials, path, query, or fragment`); }
    }

    if (application === 'crm-service' || application === 'ac-service') {
      if (input.REDIS_HOST !== undefined && !text('REDIS_HOST').trim()) problems.push('REDIS_HOST must not be empty');
      integer('REDIS_PORT', 6379, 65535);
    }
    if (problems.length) throw new Error(`Invalid ${application} configuration: ${problems.join('; ')}`);
    return output;
  };
}

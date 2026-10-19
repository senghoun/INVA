import { env } from './env';

/**
 * Centralized API Version & Base Routing Configuration
 * Driven dynamically by environment variables (`VITE_API_VERSION`, `VITE_API_BASE_URL`)
 */

export const API_VERSION = env.api.version;
export const API_BASE_URL = env.api.baseUrl;

/**
 * Builds a fully qualified API path if VITE_API_BASE_URL is set,
 * or returns the relative root path (for dev proxying).
 */
export const buildApiUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return API_BASE_URL ? `${API_BASE_URL.replace(/\/+$/, '')}${cleanEndpoint}` : cleanEndpoint;
};

export const API_ROUTES = {
  HEALTH: `${API_VERSION}/health`,
  GATEWAY_TELEMETRY: `${API_VERSION}/gateway/telemetry`,
  GATEWAY_SERVICES_TOGGLES: `${API_VERSION}/gateway/services/toggles`,
  GATEWAY_SERVICE_TOGGLE: (key: string) => `${API_VERSION}/gateway/services/${key}/toggle`,
  GATEWAY: `${API_VERSION}/gateway`,
  AUTH: `${API_VERSION}/auth`,
  HR: `${API_VERSION}/hr`,
  CRM: `${API_VERSION}/crm`,
  AC: `${API_VERSION}/ac`,
  IT: `${API_VERSION}/it`,
} as const;

/**
 * Central registry for the inva developer documentation portal.
 *
 * Single source of truth shared by:
 *  - the gateway portal page (/api/docs) and its JavaScript bundle,
 *  - the DocsController spec endpoints (/api/docs/specs/*.json),
 *  - the gateway Swagger UI reference page (/api/docs/reference),
 *  - the gateway main.ts bootstrap log lines.
 *
 * Adding a microservice here automatically extends every doc surface.
 */

export interface DocService {
  /** Spec key, also used in /api/docs/specs/<key>.json */
  key: string;
  /** Service toggle-store key (e.g. 'auth-service') */
  toggleKey: string;
  /** Human name shown in the portal */
  name: string;
  /** One-line description shown on portal cards */
  description: string;
  /** Portal accent color */
  color: string;
  /** Emoji glyph used in the portal UI */
  emoji: string;
  /** Downstream port */
  port: number;
  /** Env var holding the upstream base URL */
  configKey: string;
  /** Default upstream base URL */
  defaultUrl: string;
  /** Gateway proxy prefix (also the OpenAPI tag for its endpoints) */
  routePrefix: string;
  /** OpenAPI tag description used in merged specs */
  tagDescription: string;
  /** Typical first endpoint to try (shown on the portal card) */
  starterEndpoint: { method: string; path: string; label: string };
}

export const DOC_SERVICES: DocService[] = [
  {
    key: 'auth',
    toggleKey: 'auth-service',
    name: 'Auth Service',
    description: 'Login, JWT tokens, users, roles & security policies',
    color: '#3b82f6',
    emoji: '🔐',
    port: 3001,
    configKey: 'AUTH_SERVICE_URL',
    defaultUrl: 'http://127.0.0.1:3001',
    routePrefix: '/api/v1/auth',
    tagDescription: 'Authentication & token management',
    starterEndpoint: { method: 'POST', path: '/api/v1/auth/login', label: 'Login' },
  },
  {
    key: 'hr',
    toggleKey: 'hr-service',
    name: 'HR Service',
    description: 'Employees, departments & personnel management',
    color: '#10b981',
    emoji: '👥',
    port: 3002,
    configKey: 'HR_SERVICE_URL',
    defaultUrl: 'http://127.0.0.1:3002',
    routePrefix: '/api/v1/hr',
    tagDescription: 'Human Resources — employees & departments',
    starterEndpoint: { method: 'GET', path: '/api/v1/hr/employees', label: 'List employees' },
  },
  {
    key: 'crm',
    toggleKey: 'crm-service',
    name: 'CRM Service',
    description: 'Deals, client organizations & customer portal',
    color: '#f59e0b',
    emoji: '💼',
    port: 3003,
    configKey: 'CRM_SERVICE_URL',
    defaultUrl: 'http://127.0.0.1:3003',
    routePrefix: '/api/v1/crm',
    tagDescription: 'CRM — deals & customer portal',
    starterEndpoint: { method: 'GET', path: '/api/v1/crm/deals', label: 'List deals' },
  },
  {
    key: 'ac',
    toggleKey: 'ac-service',
    name: 'Accounting Service',
    description: 'Invoices & general ledger entries',
    color: '#8b5cf6',
    emoji: '💰',
    port: 3004,
    configKey: 'AC_SERVICE_URL',
    defaultUrl: 'http://127.0.0.1:3004',
    routePrefix: '/api/v1/ac',
    tagDescription: 'Accounting — invoices & general ledger',
    starterEndpoint: { method: 'GET', path: '/api/v1/ac/invoices', label: 'List invoices' },
  },
  {
    key: 'it',
    toggleKey: 'it-service',
    name: 'IT Operations',
    description: 'Tickets, assets & infrastructure tooling',
    color: '#06b6d4',
    emoji: '💻',
    port: 3005,
    configKey: 'IT_SERVICE_URL',
    defaultUrl: 'http://127.0.0.1:3005',
    routePrefix: '/api/v1/it',
    tagDescription: 'IT Operations & system infrastructure',
    starterEndpoint: { method: 'GET', path: '/api/v1/it/tickets', label: 'List tickets' },
  },
];

/** Names of every portal page / asset served by DocsController. */
export const DOCS_ROUTES = {
  portal: 'api/docs',
  portalJs: 'api/docs/portal.js',
  status: 'api/docs/status',
  specsBase: 'api/docs/specs',
  reference: 'api/docs/reference',
} as const;

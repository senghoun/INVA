import { getActiveCompany, setActiveCompany, companyRevision } from './company-context';
import { API_ROUTES, buildApiUrl } from '../config/api';
import { browserContextHeaders } from './browser-context';

const TOKEN_KEY = 'inva_superapp_access_token';
const REFRESH_TOKEN_KEY = 'inva_superapp_refresh_token';
const SESSION_MARKER = 'inva_browser_session';
const COOKIE_SESSION = 'cookie-session';
let sessionVersion = 0;
let accessToken: string | null = null;
let refreshCredential: string | null = null;

// Remove credentials persisted by the old portal. Cookies are established on the next login.
localStorage.removeItem(TOKEN_KEY);
localStorage.removeItem(REFRESH_TOKEN_KEY);

export const getStoredToken = (): string | null => accessToken;
export const getStoredRefreshToken = (): string | null => refreshCredential || (sessionStorage.getItem(SESSION_MARKER) ? COOKIE_SESSION : null);
export const setStoredToken = (token: string, refreshToken?: string): void => {
  ++sessionVersion;
  accessToken = token;
  refreshCredential = refreshToken || COOKIE_SESSION;
  sessionStorage.setItem(SESSION_MARKER, '1'); // Non-secret reload hint; never an authorization source.
};
export const clearStoredTokens = (): void => {
  ++sessionVersion;
  accessToken = null;
  refreshCredential = null;
  sessionStorage.removeItem(SESSION_MARKER);
  setActiveCompany(null);
  sessionStorage.removeItem('inva_profile_cache');
  window.dispatchEvent(new Event('inva:session-cleared'));
};

export const isJwtExpired = (token: string): boolean => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const payload = JSON.parse(window.atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (typeof payload.exp !== 'number') return true;
    // Expired if current time is within 10s of expiry
    return Date.now() >= payload.exp * 1000 - 10000;
  } catch {
    return true;
  }
};

// Singleton in-flight token refresh promise to deduplicate concurrent requests
let refreshPromise: Promise<string | null> | null = null;

export async function attemptTokenRefresh(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  const refreshToken = getStoredRefreshToken();
  const version = sessionVersion;
  if (!refreshToken) {
    clearStoredTokens();
    return null;
  }

  const renew = async () => {
      // Another tab may have rotated the session while this tab waited for the lock.
      if (sessionVersion !== version || getStoredRefreshToken() !== refreshToken) return getStoredToken();
      const refreshUrl = buildApiUrl(`${API_ROUTES.AUTH}/refresh`);
      const res = await fetch(refreshUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Inva-Client': 'browser', ...browserContextHeaders() },
        credentials: 'include',
        body: JSON.stringify(refreshToken === COOKIE_SESSION ? {} : { refreshToken }),
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) {
        if (res.status === 401 && sessionVersion === version && getStoredRefreshToken() === refreshToken) clearStoredTokens();
        if (getStoredRefreshToken() && getStoredRefreshToken() !== refreshToken) return getStoredToken();
        const retryAfter = Number(res.headers.get('Retry-After'));
        const data = await res.json().catch(() => null);
        const message = Array.isArray(data?.message) ? data.message.join(' ') : data?.message;
        throw Object.assign(new Error(message || 'Unable to renew session. Please try again.'), { status: res.status, ...(res.status === 429 ? { retryAfter: retryAfter > 0 ? retryAfter : 60 } : {}) });
      }

      const data = await res.json();
      if (sessionVersion !== version || getStoredRefreshToken() !== refreshToken) return null;
      if (data.accessToken && (data.refreshToken || data.browserSession)) {
        setStoredToken(data.accessToken, data.refreshToken);
        return data.accessToken;
      }
      throw new Error('Invalid session response. Please try again.');
  };
  // Web Locks serialize rotation across tabs when the browser supports them.
  const operation = typeof navigator !== 'undefined' && navigator.locks
    ? navigator.locks.request('inva-session-refresh', renew)
    : renew();
  refreshPromise = operation.finally(() => { refreshPromise = null; });

  return refreshPromise;
}

export async function request<T = any>(
  endpoint: string,
  options: RequestInit = {},
  isRetry = false
): Promise<T> {
  const scopeRevision = companyRevision();
  let token = getStoredToken();
  const initialRefreshToken = getStoredRefreshToken();

  // Proactive refresh if access token is already known to be expired
  if ((!token && getStoredRefreshToken() || token && isJwtExpired(token)) && !isRetry && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
    const newToken = await attemptTokenRefresh();
    token = newToken;
  }

  const headers = new Headers(options.headers || {});
  headers.set('X-Inva-Client', 'browser');
  for (const [name, value] of Object.entries(browserContextHeaders())) headers.set(name, value);

  if (token && !endpoint.includes('/auth/login') && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const companyId = getActiveCompany();
  if (companyId && !headers.has('X-Company-Id') && !endpoint.split('?')[0].endsWith('/auth/company-access')) headers.set('X-Company-Id', companyId);

  // Fastify rejects an empty request declared as JSON (for example, role DELETEs).
  if (options.body != null && options.body !== '' && !headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Ensure fully-qualified API URL via buildApiUrl
  const url = endpoint.startsWith('http') ? endpoint : buildApiUrl(endpoint);

  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    signal: options.signal || AbortSignal.timeout(15000),
    headers,
  });

  if (companyRevision() !== scopeRevision) throw Object.assign(new Error('Company context changed while the request was in progress. Reload this view.'), { contextChanged: true });

  // Handle 401 Token Expiration with Automatic Silent Refresh
  if (response.status === 401 && (token || initialRefreshToken) && !isRetry && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
    const currentToken = getStoredToken();
    const newToken = currentToken && currentToken !== token ? currentToken : await attemptTokenRefresh();
    if (newToken) {
      // Retry once with new access token
      const retryHeaders = new Headers(options.headers || {});
      retryHeaders.set('Authorization', `Bearer ${newToken}`);
      return request<T>(endpoint, { ...options, headers: retryHeaders }, true);
    }
  }

  if (!response.ok) {
    let errorData: any;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }
    if (response.status === 401 && token && token === getStoredToken() && endpoint.split('?')[0].endsWith('/auth/me')) clearStoredTokens();
    const message = (Array.isArray(errorData?.message) ? errorData.message.join(' ') : errorData?.message) || `HTTP Error ${response.status}: ${response.statusText}`;
    const error = new Error(message) as Error & { status?: number; data?: any; retryAfter?: number };
    error.status = response.status;
    error.data = errorData;
    const retryHeader = response.headers.get('Retry-After');
    const seconds = retryHeader === null ? Number(errorData?.retryAfterSeconds ?? errorData?.retryAfter) :
      /^\d+(\.\d+)?$/.test(retryHeader) ? Number(retryHeader) : Math.ceil((Date.parse(retryHeader) - Date.now()) / 1000);
    if (Number.isFinite(seconds) && seconds >= 0) error.retryAfter = seconds;
    throw error;
  }

  // Check if content-type is JSON
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json() as Promise<T>;
  }

  return response.text() as Promise<T>;
}

export const isCookieSession = (): boolean => getStoredRefreshToken() === COOKIE_SESSION;

/**
 * Client-side sliding-window rate limiter.
 *
 * This is a UX guard that prevents hammering the backend with repeated
 * requests from the same browser session. Real enforcement happens server-side
 * (backend 429 responses with Retry-After headers are also surfaced here).
 */

export interface RateLimitState {
  /** Timestamps of attempts within the current window */
  attempts: number[];
  /** Timestamp when lockout expires (ms), 0 = not locked */
  lockedUntil: number;
}

export interface RateLimitConfig {
  /** Max attempts allowed in the window before lockout */
  maxAttempts: number;
  /** Window duration in ms */
  windowMs: number;
  /** Lockout duration in ms after maxAttempts exceeded */
  lockoutMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  /** Remaining attempts before lockout (only meaningful when allowed=true) */
  remaining: number;
  /** ms until lockout expires (only meaningful when allowed=false) */
  retryAfterMs: number;
  /** Formatted string for display, e.g. "4m 32s" */
  retryAfterLabel: string;
}

const DEFAULTS: RateLimitConfig = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000,  // 15 minutes
  lockoutMs: 15 * 60 * 1000, // 15 minutes
};

/**
 * Default configs — these are overridden at runtime by applyPolicy()
 * which is called after the SecurityPolicy is loaded from the backend.
 * Edit these only as a last-resort fallback when the backend is offline.
 */
let CONFIGS: Record<string, RateLimitConfig> = {
  login: { maxAttempts: 5, windowMs: 15 * 60 * 1000, lockoutMs: 15 * 60 * 1000 },
  otp:   { maxAttempts: 5, windowMs: 10 * 60 * 1000, lockoutMs: 10 * 60 * 1000 },
  reset: { maxAttempts: 3, windowMs: 60 * 60 * 1000, lockoutMs: 30 * 60 * 1000 },
};

class RateLimiter {
  private store: Map<string, RateLimitState> = new Map();

  /**
   * KEY SCOPING RULES
   * ─────────────────────────────────────────────────────────────
   * "login:admin@inva.io"   → per-user   (only locks that email)
   * "otp:user@inva.io"      → per-user   (only locks that email's OTP)
   * "reset:user@inva.io"    → per-user   (only locks that email's reset)
   * "ip:203.0.113.50"       → per-IP     (blocks ALL accounts from that IP)
   * "global:login"          → global     (blocks ALL users on this device)
   * ─────────────────────────────────────────────────────────────
   * Server-side (backend) is the authoritative enforcer.
   * This class mirrors that state in the UI for UX feedback only.
   */

  private getConfig(key: string): RateLimitConfig {
    const base = key.split(':')[0];
    return CONFIGS[base] ?? DEFAULTS;
  }

  private getState(key: string): RateLimitState {
    if (!this.store.has(key)) {
      this.store.set(key, { attempts: [], lockedUntil: 0 });
    }
    return this.store.get(key)!;
  }

  /** Format ms remaining as "Xm Ys" */
  public formatTime(ms: number): string {
    if (ms <= 0) return '0s';
    const totalSec = Math.ceil(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    if (m > 0 && s > 0) return `${m}m ${s}s`;
    if (m > 0) return `${m}m`;
    return `${s}s`;
  }

  /** Check if an action is allowed WITHOUT recording an attempt */
  public check(key: string): RateLimitResult {
    const config = this.getConfig(key);
    const state = this.getState(key);
    const now = Date.now();

    // Check hard lockout
    if (state.lockedUntil > now) {
      const retryAfterMs = state.lockedUntil - now;
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs,
        retryAfterLabel: this.formatTime(retryAfterMs),
      };
    }

    // An expired lock starts a fresh streak even when the observation window is longer.
    if (state.lockedUntil > 0) {
      state.attempts = [];
      state.lockedUntil = 0;
    }

    // Purge old attempts outside the window
    state.attempts = state.attempts.filter((t) => now - t < config.windowMs);

    const remaining = config.maxAttempts - state.attempts.length;
    return {
      allowed: remaining > 0,
      remaining: Math.max(0, remaining),
      retryAfterMs: 0,
      retryAfterLabel: '',
    };
  }

  /** Record a failed attempt and return updated state */
  public recordFailure(key: string): RateLimitResult {
    const config = this.getConfig(key);
    const state = this.getState(key);
    const now = Date.now();

    // Purge old attempts
    state.attempts = state.attempts.filter((t) => now - t < config.windowMs);
    state.attempts.push(now);

    if (state.attempts.length >= config.maxAttempts) {
      state.lockedUntil = now + config.lockoutMs;
      const retryAfterMs = config.lockoutMs;
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs,
        retryAfterLabel: this.formatTime(retryAfterMs),
      };
    }

    const remaining = config.maxAttempts - state.attempts.length;
    return {
      allowed: true,
      remaining,
      retryAfterMs: 0,
      retryAfterLabel: '',
    };
  }

  /** Record a success — reset the attempt counter */
  public recordSuccess(key: string): void {
    this.store.delete(key);
  }

  /** Override lockout from a server 429 Retry-After header (seconds) */
  public applyServerLockout(key: string, retryAfterSeconds: number): void {
    const state = this.getState(key);
    state.lockedUntil = Date.now() + retryAfterSeconds * 1000;
  }

  /** Manually clear a key (e.g., admin override) */
  public reset(key: string): void {
    this.store.delete(key);
  }

  /**
   * Sync client-side limits from the SecurityPolicy stored in the backend.
   * Call this after the admin saves changes in the Security Policy panel,
   * or after the app loads the policy on startup.
   *
   * Usage:
   *   const policy = await authService.getSecurityPolicy();
   *   rateLimiter.applyPolicy(policy);
   */
  public applyPolicy(policy: {
    rateLimit: {
      enabled: boolean;
      maxAttempts: number;
      windowSeconds: number;
      lockoutSeconds: number;
    };
  }): void {
    if (!policy.rateLimit.enabled) {
      // Disable client-side limiting by setting very high values
      CONFIGS = {
        login: { maxAttempts: 9999, windowMs: 1000, lockoutMs: 1000 },
        otp:   { maxAttempts: 9999, windowMs: 1000, lockoutMs: 1000 },
        reset: { maxAttempts: 9999, windowMs: 1000, lockoutMs: 1000 },
      };
      return;
    }

    const { maxAttempts, windowSeconds, lockoutSeconds } = policy.rateLimit;
    CONFIGS = {
      // Login uses policy values directly
      login: {
        maxAttempts,
        windowMs: windowSeconds * 1000,
        lockoutMs: lockoutSeconds * 1000,
      },
      // OTP gets half the window/lockout for faster feedback
      otp: {
        maxAttempts: Math.max(3, Math.floor(maxAttempts * 0.8)),
        windowMs: Math.min(windowSeconds, 600) * 1000,
        lockoutMs: Math.min(lockoutSeconds, 600) * 1000,
      },
      // Password reset: fewer attempts allowed, longer window
      reset: {
        maxAttempts: Math.max(2, Math.floor(maxAttempts * 0.5)),
        windowMs: Math.max(windowSeconds, 3600) * 1000,
        lockoutMs: Math.max(lockoutSeconds * 0.5, 1800) * 1000,
      },
    };
  }

  // ─── IP-Level Lockout (affects ALL users from that IP) ─────────────────
  /**
   * Lock all authentication attempts from a specific IP address.
   * This is GLOBAL per-IP — it blocks every account trying to log in from
   * that address, regardless of which email they use.
   *
   * Called when the backend returns a 429 or 403 with an IP block reason.
   */
  public lockIp(ip: string, durationMs: number): void {
    const key = `ip:${ip}`;
    const state = this.getState(key);
    state.lockedUntil = Date.now() + durationMs;
  }

  /**
   * Check if the current IP is blocked BEFORE allowing any auth action.
   * Returns true if blocked (should abort the action).
   */
  public checkIp(ip: string): { blocked: boolean; retryAfterLabel: string } {
    const key = `ip:${ip}`;
    const state = this.getState(key);
    const now = Date.now();
    if (state.lockedUntil > now) {
      return { blocked: true, retryAfterLabel: this.formatTime(state.lockedUntil - now) };
    }
    return { blocked: false, retryAfterLabel: '' };
  }

  // ─── Admin / Debug Inspection ──────────────────────────────────────────
  /**
   * Returns a snapshot of all active rate-limit entries.
   * Useful for the Audit Log panel or admin debug views.
   *
   * Scope of each entry:
   *   login:email  → per-user  (one user, one action)
   *   otp:email    → per-user  (one user, OTP only)
   *   reset:email  → per-user  (one user, reset only)
   *   ip:x.x.x.x  → per-IP    (ALL users from that IP blocked)
   *   global:*     → global    (ALL users on this device)
   */
  public listAll(): Array<{
    key: string;
    scope: 'per-user' | 'per-ip' | 'global';
    attempts: number;
    lockedUntil: number;
    isLocked: boolean;
    retryAfterLabel: string;
  }> {
    const now = Date.now();
    return Array.from(this.store.entries()).map(([key, state]) => {
      const scope = key.startsWith('ip:') ? 'per-ip'
        : key.startsWith('global:') ? 'global'
        : 'per-user';
      const isLocked = state.lockedUntil > now;
      return {
        key,
        scope,
        attempts: state.attempts.length,
        lockedUntil: state.lockedUntil,
        isLocked,
        retryAfterLabel: isLocked ? this.formatTime(state.lockedUntil - now) : '',
      };
    });
  }
}

export const rateLimiter = new RateLimiter();

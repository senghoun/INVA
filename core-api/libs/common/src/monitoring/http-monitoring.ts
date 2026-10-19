import { isIP } from 'node:net';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { TelegramAlerts, AlertKind } from './telegram-alerts';
import { clientContext } from './client-context';

export function suspiciousProbe(url: string): boolean {
  // Inspect only a bounded path; do not inspect or export bodies or query strings.
  let path = url.split('?')[0].slice(0, 2048);
  try { path = decodeURIComponent(path); } catch { /* Malformed escapes remain inspectable. */ }
  return /(?:^|\/)\.(?:env(?:[./]|$)|git(?:\/|$))|(?:^|\/)(?:wp-admin|wp-login\.php|xmlrpc\.php|phpmyadmin)(?:\/|$)|(?:^|\/)\.\.(?:\/|\\)|\/etc\/passwd/i.test(path);
}

export class HttpMonitor {
  private readonly failures = new Map<string, { count: number; reset: number }>();
  constructor(private readonly alerts: TelegramAlerts, private readonly security: boolean) {}

  observe(request: FastifyRequest, status: number): void {
    if (!this.alerts.enabled || request.url.split('?')[0].startsWith('/api/v1/auth/internal/telegram/')) return;
    // Use registered templates: real paths can contain reset tokens or personal data.
    const route = request.routeOptions?.url || '[unmatched route]';
    const event = {
      ...clientContext(request.headers),
      method: request.method,
      route,
      status,
      requestId: request.id,
      // Domain services see the gateway's socket IP; only gateway runs security detection.
      ip: isIP(request.ip) ? request.ip : undefined,
    };
    if (status >= 500) this.alerts.notify({ ...event, kind: 'http_error' });
    // ThrottlerGuard can reject requests sent directly to a domain service.
    if (status === 429) this.alerts.notify({ ...event, kind: 'rate_limit' });
    if (!this.security) return;
    if (suspiciousProbe(request.url)) {
      this.alerts.notify({ ...event, route: '[suspicious probe]', kind: 'suspicious_probe' });
    }
    if (![400, 401, 403, 404].includes(status)) return;
    const now = Date.now();
    const key = `${event.ip || 'unknown'}:${status}`;
    let entry = this.failures.get(key);
    if (!entry || now >= entry.reset) {
      if (this.failures.size >= 10_000) this.failures.delete(this.failures.keys().next().value!);
      entry = { count: 0, reset: now + this.alerts.failureWindowMs };
      this.failures.set(key, entry);
    }
    entry.count++;
    if (entry.count >= this.alerts.failureThreshold) {
      this.alerts.notify({ ...event, kind: 'repeated_rejections', count: entry.count, windowSeconds: this.alerts.failureWindowMs / 1000 });
    }
  }

  policyBlock(request: FastifyRequest, kind: Extract<AlertKind, 'ip_block' | 'domain_block'>): void {
    this.alerts.notify({ ...clientContext(request.headers), kind, method: request.method, status: 403,
      route: request.routeOptions?.url || '[unmatched route]',
      ip: isIP(request.ip) ? request.ip : undefined, requestId: request.id });
  }
}

/** onResponse covers Nest, Fastify parser failures, policy blocks and upstream proxy responses. */
export function registerHttpMonitoring(fastify: FastifyInstance, alerts: TelegramAlerts, security = false): HttpMonitor {
  const monitor = new HttpMonitor(alerts, security);
  fastify.addHook('onResponse', (request, reply, done) => {
    try { monitor.observe(request, reply.statusCode); } catch { /* Monitoring must not break requests. */ }
    done();
  });
  return monitor;
}

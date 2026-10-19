import { ConsoleLogger } from '@nestjs/common';
import { formatTelegramAlert } from './telegram-alert-format';
import { telegramMenuKeyboard } from './telegram-keyboard';
import { resolveTelegramTopic, TelegramTopicRoute } from './telegram-topics';
import type { ClientContext } from './client-context';

export type AlertKind = 'http_error' | 'logged_error' | 'startup_failure' |
  'rate_limit' | 'ip_block' | 'domain_block' | 'suspicious_probe' | 'repeated_rejections';
export interface TelegramRuntimeSettings {
  enabled: boolean;
  cooldownSeconds: number;
  maxPerMinute: number;
  failureThreshold: number;
  failureWindowSeconds: number;
}

export interface AlertEvent extends Partial<ClientContext> {
  service?: string;
  kind: AlertKind;
  source?: string;
  method?: string;
  route?: string;
  status?: number;
  ip?: string;
  requestId?: string;
  count?: number;
  windowSeconds?: number;
}

function positiveInteger(value: string | undefined, fallback: number, max: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, max) : fallback;
}

/** Best-effort, bounded transport. Never send raw exceptions, URLs, headers or bodies. */
export class TelegramAlerts {
  private readonly logger = new ConsoleLogger('TelegramAlerts');
  private token: string;
  private chatId: string;
  private messageThreadId: number | null = null;
  private topicRoutes: TelegramTopicRoute[] = [];
  enabled: boolean;
  failureThreshold: number;
  failureWindowMs: number;
  private cooldownMs: number;
  private maxPerMinute: number;
  private readonly recent = new Map<string, number>();
  private readonly queue: AlertEvent[] = [];
  private draining = false;
  private relay?: (event: AlertEvent) => Promise<Response>;
  private generation = 0;
  private pausedUntil = 0;
  private budgetStart = 0;
  private sentInWindow = 0;
  private commandsEnabled = false;

  setCommandsEnabled(enabled: boolean): void { this.commandsEnabled = enabled; }

  constructor(readonly service: string, private readonly env: NodeJS.ProcessEnv = process.env) {
    this.token = env.TELEGRAM_BOT_TOKEN || '';
    this.chatId = env.TELEGRAM_CHAT_ID || '';
    this.enabled = env.TELEGRAM_ALERTS_ENABLED === 'true' && !!this.token && !!this.chatId;
    this.cooldownMs = positiveInteger(env.TELEGRAM_ALERT_COOLDOWN_SECONDS, 60, 3600) * 1000;
    this.maxPerMinute = positiveInteger(env.TELEGRAM_ALERT_MAX_PER_MINUTE, 20, 60);
    this.failureThreshold = positiveInteger(env.TELEGRAM_SECURITY_FAILURE_THRESHOLD, 10, 1000);
    this.failureWindowMs = positiveInteger(env.TELEGRAM_SECURITY_WINDOW_SECONDS, 60, 3600) * 1000;
    if (env.TELEGRAM_ALERTS_ENABLED === 'true' && !this.enabled) {
      this.logger.warn('Telegram alerts disabled: bot token and chat ID are required');
    }
  }

  setRelay(deliver: (event: AlertEvent) => Promise<Response>): void { this.relay = deliver; }

  configure(settings: TelegramRuntimeSettings, credentials?: { token: string; chatId: string; messageThreadId?: number | null; topicRoutes?: TelegramTopicRoute[] }): void {
    // Keep configuration refreshes idempotent: do not reset budgets on every poll.
    const identityChanged = credentials !== undefined &&
      (this.token !== credentials.token || this.chatId !== credentials.chatId || this.messageThreadId !== (credentials.messageThreadId ?? null) ||
        JSON.stringify(this.topicRoutes) !== JSON.stringify(credentials.topicRoutes ?? []));
    const changed = this.enabled !== settings.enabled || identityChanged;
    if (credentials) {
      this.token = credentials.token; this.chatId = credentials.chatId; this.messageThreadId = credentials.messageThreadId ?? null;
      this.topicRoutes = (credentials.topicRoutes ?? []).map(rule => ({ ...rule }));
    }
    this.enabled = settings.enabled && (!!this.relay || (!!this.token && !!this.chatId));
    this.cooldownMs = positiveInteger(String(settings.cooldownSeconds), 60, 3600) * 1000;
    this.maxPerMinute = positiveInteger(String(settings.maxPerMinute), 20, 60);
    this.failureThreshold = positiveInteger(String(settings.failureThreshold), 10, 1000);
    this.failureWindowMs = positiveInteger(String(settings.failureWindowSeconds), 60, 3600) * 1000;
    if (changed) {
      this.generation++;
      this.queue.length = 0;
      this.recent.clear();
      this.pausedUntil = 0;
    }
  }

  notify(event: AlertEvent): void {
    if (!this.enabled) return;
    const now = Date.now();
    if (now < this.pausedUntil) return;
    const key = JSON.stringify([event.service || this.service, event.kind, event.source, event.method, event.route, event.status, event.ip]);
    const last = this.recent.get(key);
    if (last !== undefined && now - last < this.cooldownMs) return;
    if (this.queue.length >= 100) return;
    if (this.recent.size >= 2000) this.recent.delete(this.recent.keys().next().value!);
    this.recent.set(key, now);
    this.queue.push({ ...event });
    void this.drain();
  }

  private format(event: AlertEvent): string {
    return formatTelegramAlert(event, this.service, this.env.NODE_ENV === 'production');
  }

  private async drain(): Promise<void> {
    if (this.draining) return;
    this.draining = true;
    try {
      while (this.queue.length) {
        const now = Date.now();
        if (now - this.budgetStart >= 60_000) {
          this.budgetStart = now;
          this.sentInWindow = 0;
        }
        if (now < this.pausedUntil || this.sentInWindow >= this.maxPerMinute) {
          this.queue.length = 0;
          break;
        }
        const event = this.queue.shift()!;
        this.sentInWindow++;
        const generation = this.generation;
        const threadId = resolveTelegramTopic({ ...event, service: event.service || this.service }, this.messageThreadId, this.topicRoutes);
        try {
          const response = this.relay ? await this.relay(event) : await fetch(`https://api.telegram.org/bot${this.token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: this.chatId, text: this.format(event), parse_mode: 'HTML',
              ...(threadId ? { message_thread_id: threadId } : {}),
              ...(this.commandsEnabled ? { reply_markup: telegramMenuKeyboard(event) } : {}) }),
            signal: AbortSignal.timeout(5000),
            redirect: 'error',
          });
          const result = await response.json() as { ok?: boolean; parameters?: { retry_after?: number } };
          if (generation !== this.generation) continue;
          if (!response.ok || result.ok !== true) {
            const retryAfter = positiveInteger(String(result.parameters?.retry_after), 30, 3600);
            this.pausedUntil = Date.now() + retryAfter * 1000;
            this.logger.warn('Telegram delivery failed; alerts temporarily paused');
          }
        } catch {
          if (generation !== this.generation) continue;
          // Never log the fetch error: it can contain the bot token in the URL.
          this.pausedUntil = Date.now() + 30_000;
          this.logger.warn('Telegram delivery failed; alerts temporarily paused');
        }
        if (this.queue.length && Date.now() >= this.pausedUntil) {
          await new Promise<void>(resolve => setTimeout(resolve, 1000));
        }
      }
    } finally {
      this.draining = false;
    }
  }

  /** Used for startup failures so process.exit does not discard the pending alert. */
  async flush(): Promise<void> {
    const deadline = Date.now() + 6000;
    while (this.draining && Date.now() < deadline) {
      await new Promise<void>(resolve => setTimeout(resolve, 25));
    }
  }
}

/** Capture Nest application/background error logs without exporting their sensitive content. */
export class AlertingLogger extends ConsoleLogger {
  constructor(private readonly alerts: TelegramAlerts) { super(); }

  override error(message: unknown, ...optionalParams: unknown[]): void {
    // Preserve a useful source context, but omit raw messages and stacks that may contain PII.
    const candidate = optionalParams[optionalParams.length - 1];
    const context = typeof candidate === 'string' && /^[A-Za-z][A-Za-z0-9_.-]{0,79}$/.test(candidate)
      ? candidate : 'Application';
    this.alerts.notify({ kind: 'logged_error', source: context });
    super.error('Application error; raw exception details withheld', context);
  }
}

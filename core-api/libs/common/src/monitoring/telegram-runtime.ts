import { JwtService } from '@nestjs/jwt';
import { TelegramAlerts, TelegramRuntimeSettings } from './telegram-alerts';

const instances = new Map<string, TelegramAlerts>();
export function getTelegramAlerts(service: string): TelegramAlerts {
  let alerts = instances.get(service);
  if (!alerts) {
    alerts = new TelegramAlerts(service, service === 'auth-service' ? process.env : {
      ...process.env, TELEGRAM_BOT_TOKEN: '', TELEGRAM_CHAT_ID: '', TELEGRAM_ALERTS_ENABLED: 'false',
    });
    instances.set(service, alerts);
  }
  return alerts;
}

/** Domain processes relay events; only auth-service owns the bot credentials. */
export async function startTelegramRelay(alerts: TelegramAlerts): Promise<() => void> {
  const base = `${process.env.AUTH_SERVICE_URL || 'http://127.0.0.1:3001'}/api/v1/auth/internal/telegram`;
  const jwt = new JwtService();
  const authorization = () => `Bearer ${jwt.sign({ scope: 'telegram:monitor' }, {
    secret: process.env.JWT_SECRET, algorithm: 'HS256', expiresIn: 15,
    audience: 'telegram-monitoring', issuer: alerts.service,
  })}`;
  alerts.setRelay(async event => {
    const response = await fetch(`${base}/events`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: authorization() },
      body: JSON.stringify({ ...event, service: alerts.service }), signal: AbortSignal.timeout(5000), redirect: 'error',
    });
    return response;
  });
  // No direct Telegram delivery, even if legacy environment credentials are present.
  alerts.configure({ enabled: false, cooldownSeconds: 60, maxPerMinute: 20, failureThreshold: 10, failureWindowSeconds: 60 });
  let refreshing = false;
  const refresh = async () => {
    if (refreshing) return;
    refreshing = true;
    try {
      const response = await fetch(`${base}/config`, {
        headers: { Authorization: authorization() }, signal: AbortSignal.timeout(3000), redirect: 'error',
      });
      if (response.ok) alerts.configure(await response.json() as TelegramRuntimeSettings);
    } catch { /* Retain last configuration; never log internal signed tokens. */ }
    finally { refreshing = false; }
  };
  await refresh();
  const timer = setInterval(() => { void refresh(); }, 15_000);
  timer.unref();
  return () => clearInterval(timer);
}

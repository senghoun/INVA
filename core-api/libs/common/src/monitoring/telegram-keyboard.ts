import { isIP } from 'node:net';
import type { AlertEvent } from './telegram-alerts';

export function telegramMenuKeyboard(event?: AlertEvent) {
  const rows = [];
  if (event?.kind === 'ip_block' && event.ip && isIP(event.ip)) {
    rows.push([{ text: `✅ ពិនិត្យ / Unblock ${event.ip}`, callback_data: `ip:${event.ip}` }]);
  }
  rows.push([
    { text: '🛡 Blocked IPs', callback_data: 'blocked:0' },
    { text: '⬅️ Menu', callback_data: 'menu' },
  ]);
  return { inline_keyboard: rows };
}

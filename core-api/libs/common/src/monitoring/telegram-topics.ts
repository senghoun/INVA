import type { AlertEvent, AlertKind } from './telegram-alerts';

export interface TelegramTopicRoute { service: string; kind: AlertKind | '*'; messageThreadId: number; }

export function telegramTopicRoutes(value: unknown): TelegramTopicRoute[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is TelegramTopicRoute => item !== null && typeof item === 'object' &&
    typeof item.service === 'string' && typeof item.kind === 'string' &&
    Number.isInteger(item.messageThreadId) && item.messageThreadId > 0 && item.messageThreadId <= 2147483647);
}

/** Most-specific match wins: service+event, event, service, then the default topic. */
export function resolveTelegramTopic(event: Pick<AlertEvent, 'service' | 'kind'>,
  fallback: number | null | undefined, routes: readonly TelegramTopicRoute[]): number | null {
  let result = fallback ?? null;
  let best = 0;
  for (const rule of routes) {
    if (rule.service !== '*' && rule.service !== event.service || rule.kind !== '*' && rule.kind !== event.kind) continue;
    const score = (rule.service !== '*' ? 1 : 0) + (rule.kind !== '*' ? 2 : 0);
    if (score > best) { best = score; result = rule.messageThreadId; }
  }
  return result;
}

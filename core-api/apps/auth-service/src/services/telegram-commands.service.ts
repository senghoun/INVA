import { jsonStringArray } from '@common';
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { BlockList, isIP } from 'node:net';
import { createHash, randomBytes } from 'node:crypto';
import type { Prisma } from '@prisma/client-auth';
import { telegramMenuKeyboard, telegramTopicRoutes } from '@common';
import { AuthPrismaService } from '../database/auth-prisma.service';
import { TelegramSettingsService } from './telegram-settings.service';

interface BotUser { id: number; is_bot?: boolean; }
interface BotMessage { chat: { id: number }; from?: BotUser; text?: string; message_thread_id?: number; }
interface BotUpdate {
  update_id: number;
  message?: BotMessage;
  callback_query?: { id: string; from: BotUser; message?: BotMessage; data?: string };
}
type Connection = Awaited<ReturnType<TelegramSettingsService['botConnection']>>;
type Tx = Prisma.TransactionClient;
type Outbound = { text: string; keyboard: ReturnType<typeof telegramMenuKeyboard>; messageThreadId: number | null };
const fingerprint = (value: string) => createHash('sha256').update(value).digest('hex');
const ruleTag = (policy: string, rule: string) => fingerprint(`${policy}:${rule}`).slice(0, 16);
const html = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function telegramRuleMatches(ip: string, rule: string): boolean {
  ip = ip.replace(/^::ffff:/, '');
  const [address, prefix] = rule.split('/');
  const family = isIP(address);
  if (!family || isIP(ip) !== family) return false;
  try {
    const list = new BlockList();
    const type = family === 6 ? 'ipv6' : 'ipv4';
    if (prefix === undefined) list.addAddress(address, type);
    else list.addSubnet(address, Number(prefix), type);
    return list.check(ip, type);
  } catch { return false; }
}

/** Dedicated update reader; database advisory lock keeps auth replicas from competing. */
@Injectable()
export class TelegramCommandsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramCommandsService.name);
  private timer?: NodeJS.Timeout;
  private polling = false;
  private warnAfter = 0;
  constructor(private readonly db: AuthPrismaService, private readonly settings: TelegramSettingsService) {}

  onModuleInit(): void {
    this.timer = setInterval(() => { void this.poll(); }, 5000);
    this.timer.unref();
  }
  onModuleDestroy(): void { if (this.timer) clearInterval(this.timer); }

  async poll(): Promise<void> {
    if (this.polling) return;
    this.polling = true;
    try {
      const connection = await this.settings.botConnection();
      if (!connection.commandsEnabled || !jsonStringArray(connection.adminUserIds).length || !connection.token || !connection.chatId) return;
      const outbound: Outbound[] = [];
      await this.db.$transaction(async tx => {
        const locks = await tx.$queryRaw<{ id: string }[]>`SELECT id FROM telegram_settings WHERE id = 'global' FOR UPDATE SKIP LOCKED`;
        if (!locks.length) return;
        // Reload after acquiring the reader lock; settings edits and offsets may have changed.
        const current = await tx.telegramSettings.findUniqueOrThrow({ where: { id: 'global' } });
        if (!current.commandsEnabled || current.botTokenEncrypted !== connection.botTokenEncrypted || current.chatId !== connection.chatId) return;
        const active = { ...connection, ...current };
        const updates = await this.settings.telegram<BotUpdate[]>(active.token, 'getUpdates', {
          offset: current.nextUpdateOffset, limit: 1, timeout: 0,
          allowed_updates: ['message', 'callback_query', 'channel_post', 'my_chat_member'],
        });
        for (const update of updates) {
          if (!Number.isSafeInteger(update.update_id) || update.update_id < current.nextUpdateOffset) continue;
          await this.handle(tx, active, update, outbound);
          await tx.telegramSettings.update({ where: { id: 'global' }, data: { nextUpdateOffset: update.update_id + 1 } });
        }
        await tx.telegramUnblockConfirmation.deleteMany({ where: { expiresAt: { lt: new Date() } } });
      }, { isolationLevel: 'ReadCommitted', timeout: 15000, maxWait: 1000 });
      // Publish success responses only after policy, audit and offset commit together.
      for (const item of outbound) await this.send({ ...connection, messageThreadId: item.messageThreadId }, item.text, item.keyboard);
    } catch {
      if (Date.now() >= this.warnAfter) {
        this.warnAfter = Date.now() + 60_000;
        this.logger.warn('Telegram bot management unavailable; verify bot access, database migration and competing webhook/update readers');
      }
    } finally { this.polling = false; }
  }

  private async send(connection: Connection, text: string, reply_markup = telegramMenuKeyboard()): Promise<void> {
    // A failed response must not roll back a committed-intent policy operation or replay it.
    try { await this.settings.telegram(connection.token, 'sendMessage', { chat_id: connection.chatId,
      ...(connection.messageThreadId ? { message_thread_id: connection.messageThreadId } : {}), text, parse_mode: 'HTML', reply_markup }); }
    catch { this.logger.warn('Telegram management response delivery failed; review the security audit log'); }
  }

  async handle(tx: Tx, connection: Connection, update: BotUpdate, outbound?: Outbound[]): Promise<void> {
    const callback = update.callback_query;
    const message = callback?.message || update.message;
    const sender = callback?.from || message?.from;
    const managedTopics = new Set([connection.messageThreadId ?? null, ...telegramTopicRoutes(connection.topicRoutes).map(rule => rule.messageThreadId)]);
    // Telegram's General topic can appear as thread 1; omit it on replies to General.
    const incomingThread = message?.message_thread_id === 1 && !managedTopics.has(1) && managedTopics.has(null)
      ? null : message?.message_thread_id ?? null;
    const authorized = connection.commandsEnabled && sender && !sender.is_bot &&
      Number.isSafeInteger(sender.id) && jsonStringArray(connection.adminUserIds).includes(String(sender.id)) &&
      message && String(message.chat.id) === connection.chatId &&
      managedTopics.has(incomingThread);
    if (callback) {
      try { await this.settings.telegram(connection.token, 'answerCallbackQuery', {
        callback_query_id: callback.id, text: authorized ? 'Processing…' : 'This action requires a configured admin in a managed chat/topic.',
        show_alert: !authorized,
      }); } catch { /* Expired callback acknowledgements do not authorize or prevent actions. */ }
    }
    if (!authorized) return;
    const replyConnection = { ...connection, messageThreadId: incomingThread };
    const respond = async (text: string, keyboard = telegramMenuKeyboard()) => {
      if (outbound) outbound.push({ text, keyboard, messageThreadId: incomingThread });
      else await this.send(replyConnection, text, keyboard);
    };
    const actorId = String(sender.id);
    const command = callback?.data || message.text?.split(/\s/)[0].replace(/@[^ ]+$/, '');
    if (!command) return;
    if (command === 'menu' || command === '/menu' || command === '/start') {
      await tx.telegramUnblockConfirmation.deleteMany({ where: { actorId, chatId: connection.chatId } });
      await respond('🛡 <b>INVA API SHIELD - MENU</b>\nChoose a security action. Unblocking requires confirmation.', {
        inline_keyboard: [
          [{ text: '🛡 Blocked IPs', callback_data: 'blocked:0' }, { text: '📊 Status', callback_data: 'status' }],
          [{ text: '🔄 Refresh menu', callback_data: 'menu' }],
        ],
      });
      return;
    }
    const policy = await tx.securityPolicy.findFirst({ orderBy: { updatedAt: 'desc' } });
    if (!policy) { await respond('No security policy exists. Initialize it in Super App.'); return; }
    if (command === 'status' || command === '/status') {
      await respond(`📊 <b>Security status</b>\nAlerts: ${connection.enabled ? 'Enabled' : 'Disabled'}\nIP policy: ${policy.ipRestrictionMode}\nBlocklist rules: ${jsonStringArray(policy.ipBlocklist).length}\nBot management: Enabled`);
      return;
    }
    if (command === '/blocked' || /^blocked:\d{1,6}$/.test(command)) {
      const page = command === '/blocked' ? 0 : Number(command.split(':')[1]);
      const pages = Math.max(1, Math.ceil(jsonStringArray(policy.ipBlocklist).length / 8));
      const safePage = Math.min(page, pages - 1);
      const rules = jsonStringArray(policy.ipBlocklist).slice(safePage * 8, safePage * 8 + 8);
      const rows = rules.map((rule, index) => [{ text: `✅ Unblock ${rule}`, callback_data: `rule:${safePage * 8 + index}:${ruleTag(policy.id, rule)}` }]);
      rows.push([
        ...(safePage > 0 ? [{ text: '⬅️ Previous', callback_data: `blocked:${safePage - 1}` }] : []),
        ...(safePage + 1 < pages ? [{ text: 'Next ➡️', callback_data: `blocked:${safePage + 1}` }] : []),
        { text: '⬅️ Menu', callback_data: 'menu' },
      ]);
      await respond(`🛡 <b>Blocked IP rules (${jsonStringArray(policy.ipBlocklist).length})</b>\nIP policy: ${policy.ipRestrictionMode}\nPage ${safePage + 1}/${pages}\n${rules.map(rule => `<code>${html(rule)}</code>`).join('\n') || 'The blocklist is empty.'}\n\nRules are enforced when IP policy is BLOCKLIST.`, { inline_keyboard: rows });
      return;
    }
    let rule: string | undefined;
    if (command.startsWith('ip:') && isIP(command.slice(3))) {
      if (policy.ipRestrictionMode !== 'BLOCKLIST') {
        await respond('This IP was rejected by another policy. Review allowlist mode in Super App; removing a blocklist rule will not grant access.'); return;
      }
      rule = jsonStringArray(policy.ipBlocklist).find(item => telegramRuleMatches(command.slice(3), item));
    } else if (/^rule:\d{1,6}:[a-f0-9]{16}$/.test(command)) {
      const [, index, tag] = command.split(':');
      const candidate = jsonStringArray(policy.ipBlocklist)[Number(index)];
      if (candidate && ruleTag(policy.id, candidate) === tag) rule = candidate;
    } else if (/^confirm:[a-f0-9]{32}$/.test(command)) {
      const id = command.slice(8);
      await tx.$queryRaw`SELECT id FROM telegram_unblock_confirmations WHERE id = ${id} FOR UPDATE`;
      const confirmation = await tx.telegramUnblockConfirmation.findUnique({ where: { id } });
      if (!confirmation || confirmation.expiresAt <= new Date() || confirmation.actorId !== actorId ||
          confirmation.chatId !== connection.chatId || (confirmation.messageThreadId ?? null) !== incomingThread ||
          confirmation.botFingerprint !== fingerprint(connection.token)) {
        await respond('This confirmation is expired or unavailable. Open Blocked IPs again.'); return;
      }
      await tx.$queryRaw`SELECT id FROM security_policies WHERE id = ${confirmation.policyId}::uuid FOR UPDATE`;
      const latest = await tx.securityPolicy.findFirst({ orderBy: { updatedAt: 'desc' } });
      await tx.telegramUnblockConfirmation.delete({ where: { id } });
      if (!latest || latest.id !== confirmation.policyId || !jsonStringArray(latest.ipBlocklist).includes(confirmation.rule)) {
        await respond('The policy changed or this rule has already been removed. Refresh Blocked IPs.'); return;
      }
      await tx.securityPolicy.update({ where: { id: latest.id }, data: {
        ipBlocklist: jsonStringArray(latest.ipBlocklist).filter(item => item !== confirmation.rule), updatedBy: `telegram:${actorId}`,
      } });
      await tx.auditLog.create({ data: { action: 'TELEGRAM_IP_UNBLOCKED', outcome: 'SUCCESS', ip: '127.0.0.1',
        details: { actorTelegramUserId: actorId, chatId: connection.chatId, messageThreadId: incomingThread, removedRule: confirmation.rule, policyId: latest.id } } });
      await respond(`✅ <b>Blocklist rule removed:</b> <code>${html(confirmation.rule)}</code>\nGateways receive policy updates on their next refresh. Other matching rules and allowlist policies may still restrict access.`);
      return;
    } else return;
    if (!rule) { await respond('No matching current blocklist rule found. Refresh Blocked IPs.'); return; }
    const id = randomBytes(16).toString('hex');
    // Bound pending confirmations per operator; old buttons expire when a new request is made.
    await tx.telegramUnblockConfirmation.deleteMany({ where: { actorId, chatId: connection.chatId } });
    await tx.telegramUnblockConfirmation.create({ data: {
      id, policyId: policy.id, rule, actorId, chatId: connection.chatId,
      messageThreadId: incomingThread,
      botFingerprint: fingerprint(connection.token), expiresAt: new Date(Date.now() + 5 * 60_000),
    } });
    await respond(`⚠️ <b>Confirm unblock</b>\nRemove rule <code>${html(rule)}</code>?${rule.includes('/') ? '\nThis is a CIDR range: removal affects the entire range.' : ''}\nConfirmation expires in 5 minutes.`, {
      inline_keyboard: [[{ text: '✅ Confirm unblock', callback_data: `confirm:${id}` }, { text: '❌ Cancel', callback_data: 'menu' }]],
    });
  }
}

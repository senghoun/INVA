import { jsonStringArray } from '@common';
import { BadRequestException, HttpException, Injectable, Logger, OnModuleDestroy, OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import type { TelegramSettings } from '@prisma/client-auth';
import { formatTelegramTestMessage, getTelegramAlerts, resolveTelegramTopic, telegramMenuKeyboard, telegramTopicRoutes, TelegramRuntimeSettings } from '@common';
import { AuthPrismaService } from '../database/auth-prisma.service';
import { TelegramTestTargetDto, UpdateTelegramSettingsDto } from '../dto/telegram-settings.dto';

interface TelegramChat { id: number; type: string; title?: string; username?: string; first_name?: string; }
interface TelegramUpdate { message?: { chat: TelegramChat; from?: { id: number; is_bot?: boolean }; message_thread_id?: number;
  forum_topic_created?: { name: string }; forum_topic_edited?: { name?: string } }; channel_post?: { chat: TelegramChat }; my_chat_member?: { chat: TelegramChat }; }

@Injectable()
export class TelegramSettingsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramSettingsService.name);
  private readonly alerts = getTelegramAlerts('auth-service');
  private timer?: NodeJS.Timeout;
  private refreshing = false;
  constructor(private readonly db: AuthPrismaService, private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    await this.refresh();
    this.timer = setInterval(() => { void this.refresh(); }, 15_000);
    this.timer.unref();
  }
  onModuleDestroy(): void { if (this.timer) clearInterval(this.timer); }
  private async refresh(): Promise<void> {
    if (this.refreshing) return;
    this.refreshing = true;
    try { await this.runtime(); }
    catch { this.logger.warn('Telegram settings unavailable; verify database migrations and encryption key'); }
    finally { this.refreshing = false; }
  }

  private key(): Buffer {
    const value = this.config.get<string>('TELEGRAM_ENCRYPTION_KEY', '');
    if (!/^[a-f0-9]{64}$/i.test(value)) throw new ServiceUnavailableException('Telegram encryption key is not configured.');
    return Buffer.from(value, 'hex');
  }
  private encrypt(token: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key(), iv);
    cipher.setAAD(Buffer.from('inva:telegram:global'));
    const ciphertext = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
    return [iv, cipher.getAuthTag(), ciphertext].map(part => part.toString('base64url')).join('.');
  }
  private decrypt(value: string): string {
    try {
      const [iv, tag, data] = value.split('.').map(part => Buffer.from(part, 'base64url'));
      const cipher = createDecipheriv('aes-256-gcm', this.key(), iv);
      cipher.setAAD(Buffer.from('inva:telegram:global')); cipher.setAuthTag(tag);
      return Buffer.concat([cipher.update(data), cipher.final()]).toString('utf8');
    } catch { throw new ServiceUnavailableException('Saved Telegram credentials cannot be decrypted. Check the encryption key.'); }
  }
  private async row(): Promise<TelegramSettings> {
    const existing = await this.db.telegramSettings.findUnique({ where: { id: 'global' } });
    if (existing) return existing;
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN', '');
    const chatId = this.config.get<string>('TELEGRAM_CHAT_ID', '');
    const number = (key: string, fallback: number, max: number) => {
      const value = Number(this.config.get(key));
      return Number.isInteger(value) && value >= 1 && value <= max ? value : fallback;
    };
    return this.db.telegramSettings.upsert({ where: { id: 'global' }, update: {}, create: {
      id: 'global', botTokenEncrypted: token ? this.encrypt(token) : null,
      commandsEnabled: false, adminUserIds: [], nextUpdateOffset: 0, messageThreadId: null, topicRoutes: [],
      botUsername: this.config.get<string>('TELEGRAM_BOT_USERNAME') || null,
      chatId: /^-?[1-9]\d{0,19}$/.test(chatId) ? chatId : '',
      enabled: this.config.get('TELEGRAM_ALERTS_ENABLED') === 'true' && !!token && /^-?[1-9]\d{0,19}$/.test(chatId),
      cooldownSeconds: number('TELEGRAM_ALERT_COOLDOWN_SECONDS', 60, 3600),
      maxPerMinute: number('TELEGRAM_ALERT_MAX_PER_MINUTE', 20, 60),
      failureThreshold: number('TELEGRAM_SECURITY_FAILURE_THRESHOLD', 10, 1000),
      failureWindowSeconds: number('TELEGRAM_SECURITY_WINDOW_SECONDS', 60, 3600),
    } });
  }
  private publicSettings(row: TelegramSettings) {
    const { botTokenEncrypted, id, nextUpdateOffset, ...settings } = row;
    return { ...settings, tokenConfigured: !!botTokenEncrypted,
      encryptionConfigured: /^[a-f0-9]{64}$/i.test(this.config.get<string>('TELEGRAM_ENCRYPTION_KEY', '')) };
  }
  async getSettings() { return this.publicSettings(await this.row()); }

  async runtime(): Promise<TelegramRuntimeSettings> {
    const row = await this.row();
    const token = row.enabled && row.botTokenEncrypted ? this.decrypt(row.botTokenEncrypted) : '';
    const settings = { enabled: row.enabled && !!token && !!row.chatId,
      cooldownSeconds: row.cooldownSeconds, maxPerMinute: row.maxPerMinute,
      failureThreshold: row.failureThreshold, failureWindowSeconds: row.failureWindowSeconds };
    this.alerts.configure(settings, { token, chatId: row.chatId, messageThreadId: row.messageThreadId, topicRoutes: telegramTopicRoutes(row.topicRoutes) });
    this.alerts.setCommandsEnabled(row.commandsEnabled && jsonStringArray(row.adminUserIds).length > 0);
    return settings; // No credentials leave the auth service.
  }

  async botConnection() {
    const row = await this.row();
    return { ...row, token: row.botTokenEncrypted ? this.decrypt(row.botTokenEncrypted) : '' };
  }

  async telegram<T>(token: string, method: 'getMe' | 'getUpdates' | 'sendMessage' | 'answerCallbackQuery', body = {}): Promise<T> {
    let response: Response;
    let data: { ok?: boolean; result?: T; error_code?: number };
    try {
      response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        signal: AbortSignal.timeout(5000), redirect: 'error',
      });
      data = await response.json() as typeof data;
    } catch { throw new ServiceUnavailableException('Telegram is unavailable. Try again later.'); }
    if (!response.ok || data.ok !== true || data.result === undefined) {
      if (response.status === 401 || response.status === 404) throw new BadRequestException('Telegram rejected the bot token.');
      if (response.status === 409) throw new BadRequestException('Chat discovery is unavailable while this bot has a webhook or another update reader. Enter the chat ID manually.');
      if (response.status === 429) throw new HttpException('Telegram rate limit reached. Try again later.', 429);
      throw new BadRequestException('Telegram rejected the request. Check the chat ID and bot permissions.');
    }
    return data.result;
  }

  async update(dto: UpdateTelegramSettingsDto, email: string, ip: string) {
    if (dto.topicRoutes) {
      const keys = dto.topicRoutes.map(rule => `${rule.service}:${rule.kind}`);
      if (new Set(keys).size !== keys.length || dto.topicRoutes.some(rule => rule.service === '*' && rule.kind === '*')) {
        throw new BadRequestException('Topic rules must have unique service/event matches. Use the default topic for all other events.');
      }
    }
    await this.row();
    // Verify replacement tokens before storing them; usernames come from Telegram.
    const bot = dto.botToken ? await this.telegram<{ username?: string; is_bot: boolean }>(dto.botToken, 'getMe') : undefined;
    if (bot && (!bot.is_bot || !bot.username)) throw new BadRequestException('A valid Telegram bot is required.');
    const encrypted = dto.botToken ? this.encrypt(dto.botToken) : undefined;
    const row = await this.db.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM telegram_settings WHERE id = 'global' FOR UPDATE`;
      const current = await tx.telegramSettings.findUniqueOrThrow({ where: { id: 'global' } });
      const chatChanged = dto.chatId !== undefined && dto.chatId !== current.chatId;
      if ((dto.commandsEnabled ?? current.commandsEnabled) && !(dto.adminUserIds ?? jsonStringArray(current.adminUserIds)).length) {
        throw new BadRequestException('Choose at least one Telegram admin user ID before enabling bot management.');
      }
      if ((dto.commandsEnabled ?? current.commandsEnabled) && (!(encrypted || current.botTokenEncrypted) || !(dto.chatId ?? current.chatId))) {
        throw new BadRequestException('Save a bot and destination before enabling bot management.');
      }
      const { botToken, topicRoutes, ...changes } = dto;
      if ((dto.enabled ?? current.enabled) && !(encrypted || current.botTokenEncrypted)) throw new BadRequestException('Configure a bot token before enabling alerts.');
      if ((dto.enabled ?? current.enabled) && !(dto.chatId ?? current.chatId)) throw new BadRequestException('Choose a chat ID before enabling alerts.');
      if ((dto.enabled ?? current.enabled) && !encrypted && current.botTokenEncrypted) this.decrypt(current.botTokenEncrypted);
      const updated = await tx.telegramSettings.update({ where: { id: 'global' }, data: {
        ...changes, ...(chatChanged && dto.messageThreadId === undefined ? { messageThreadId: null } : {}),
        ...(topicRoutes !== undefined ? { topicRoutes: topicRoutes.map(rule => ({ service: rule.service, kind: rule.kind, messageThreadId: rule.messageThreadId })) } :
          chatChanged ? { topicRoutes: [] } : {}),
        ...(encrypted ? { botTokenEncrypted: encrypted, botUsername: bot!.username,
          nextUpdateOffset: 0, commandsEnabled: false, adminUserIds: [], messageThreadId: null, topicRoutes: [] } : {}), updatedBy: email,
      } });
      if (dto.botToken !== undefined || dto.chatId !== undefined && dto.chatId !== current.chatId ||
          dto.adminUserIds !== undefined || dto.commandsEnabled !== undefined || dto.messageThreadId !== undefined || dto.topicRoutes !== undefined) {
        await tx.telegramUnblockConfirmation.deleteMany({});
      }
      await tx.auditLog.create({ data: { action: 'TELEGRAM_SETTINGS_UPDATED', outcome: 'SUCCESS', userEmail: email, ip,
        details: { changedFields: Object.keys(dto), tokenChanged: !!dto.botToken } } });
      return updated;
    }, { isolationLevel: 'ReadCommitted' });
    await this.runtime();
    return this.publicSettings(row);
  }

  async discoverChats(draftToken?: string) {
    const row = draftToken ? undefined : await this.row();
    if (row?.commandsEnabled) throw new BadRequestException('Disable bot management before discovering a new destination.');
    const token = draftToken || (row?.botTokenEncrypted ? this.decrypt(row.botTokenEncrypted) : '');
    if (!token) throw new BadRequestException('Configure a bot token first.');
    const bot = await this.telegram<{ username: string }>(token, 'getMe');
    // No offset: do not acknowledge/remove updates needed by another consumer.
    const updates = await this.telegram<TelegramUpdate[]>(token, 'getUpdates', { limit: 100, timeout: 0 });
    const chats = new Map<string, { id: string; label: string; type: string; senderUserIds: string[]; topics: { id: number; label: string }[] }>();
    for (const update of updates) {
      const chat = (update.message || update.channel_post || update.my_chat_member)?.chat;
      if (!chat || !Number.isSafeInteger(chat.id)) continue;
      const id = String(chat.id);
      const entry = chats.get(id) || { id, label: (chat.title || chat.username || chat.first_name || id).slice(0, 100), type: chat.type, senderUserIds: [], topics: [] };
      const threadId = update.message?.message_thread_id;
      if (Number.isInteger(threadId) && threadId! > 0 && threadId! <= 2147483647) {
        const topic = entry.topics.find(item => item.id === threadId);
        const name = update.message?.forum_topic_edited?.name || update.message?.forum_topic_created?.name;
        if (!topic) entry.topics.push({ id: threadId!, label: name?.slice(0, 128) || `Topic #${threadId}` });
        else if (name) topic.label = name.slice(0, 128);
      }
      const sender = update.message?.from;
      if (sender && !sender.is_bot && Number.isSafeInteger(sender.id) && sender.id > 0 && !entry.senderUserIds.includes(String(sender.id))) {
        entry.senderUserIds.push(String(sender.id));
      }
      chats.set(id, entry);
    }
    return { botUsername: bot.username, chats: [...chats.values()] };
  }

  async sendTest(email: string, ip: string, target: TelegramTestTargetDto = {}) {
    const row = await this.row();
    if (!row.botTokenEncrypted || !row.chatId) throw new BadRequestException('Save a bot and chat ID before sending a test.');
    const threadId = target.service || target.kind ? resolveTelegramTopic({ service: target.service || 'auth-service', kind: target.kind || 'http_error' }, row.messageThreadId, telegramTopicRoutes(row.topicRoutes)) : row.messageThreadId;
    await this.telegram(this.decrypt(row.botTokenEncrypted), 'sendMessage', {
      chat_id: row.chatId,
      ...(threadId ? { message_thread_id: threadId } : {}),
      text: formatTelegramTestMessage(target.service || 'auth-service', this.config.get<string>('NODE_ENV') === 'production'),
      parse_mode: 'HTML',
      ...(row.commandsEnabled && jsonStringArray(row.adminUserIds).length ? { reply_markup: telegramMenuKeyboard() } : {}),
    });
    await this.db.auditLog.create({ data: { action: 'TELEGRAM_TEST_SENT', outcome: 'SUCCESS', userEmail: email, ip } });
    return { sent: true };
  }
}

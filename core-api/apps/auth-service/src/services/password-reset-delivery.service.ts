import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export type RecoveryChannel = 'sms' | 'telegram' | 'email';
export interface ResetCodeDelivery {
  challengeId: string;
  channel: RecoveryChannel;
  destination: string;
  code: string;
  expiresAt: Date;
}

@Injectable()
export class PasswordResetDeliveryService {
  constructor(private readonly config: ConfigService) {}

  assertAvailable(channel: RecoveryChannel): void {
    const mode = this.config.get('PASSWORD_RESET_DELIVERY', 'disabled');
    if (mode === 'local' && ['development', 'test'].includes(this.config.get('NODE_ENV', ''))) return;
    if (mode === 'live') {
      if (channel === 'telegram' && this.config.get('PASSWORD_RESET_TELEGRAM_BOT_TOKEN')) return;
      if (channel === 'sms' && this.config.get('PASSWORD_RESET_SMS_PROVIDER') === 'twilio' &&
          this.config.get('TWILIO_ACCOUNT_SID') && this.config.get('TWILIO_AUTH_TOKEN') &&
          (this.config.get('TWILIO_FROM_NUMBER') || this.config.get('TWILIO_MESSAGING_SERVICE_SID'))) return;
    }
    throw new ServiceUnavailableException('Password recovery delivery is not configured for this channel. Contact support.');
  }

  async telegramMessage(chatId: string, text: string): Promise<void> {
    const token = this.config.getOrThrow<string>('PASSWORD_RESET_TELEGRAM_BOT_TOKEN');
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, protect_content: true }),
      redirect: 'error', signal: AbortSignal.timeout(5000),
    });
    const data = await response.json() as { ok?: boolean };
    if (!response.ok || !data.ok) throw new Error('Recovery message delivery failed.');
  }

  async send(payload: ResetCodeDelivery): Promise<void> {
    this.assertAvailable(payload.channel);
    if (this.config.get('PASSWORD_RESET_DELIVERY') === 'local') {
      const directory = resolve('.local/password-reset-outbox');
      await mkdir(directory, { recursive: true, mode: 0o700 });
      await writeFile(resolve(directory, `${payload.challengeId}.json`), JSON.stringify(payload, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
      return;
    }
    const text = `Your INVA password reset code is ${payload.code}. It expires in 10 minutes. Do not share this code. If you did not request this, ignore this message.`;
    if (payload.channel === 'telegram') return this.telegramMessage(payload.destination, text);
    const sid = this.config.getOrThrow<string>('TWILIO_ACCOUNT_SID');
    if (!/^AC[0-9a-fA-F]{32}$/.test(sid)) throw new Error('Invalid SMS configuration.');
    const body = new URLSearchParams({ To: payload.destination, Body: text });
    const messagingService = this.config.get<string>('TWILIO_MESSAGING_SERVICE_SID');
    if (messagingService) body.set('MessagingServiceSid', messagingService);
    else body.set('From', this.config.getOrThrow<string>('TWILIO_FROM_NUMBER'));
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST', headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${this.config.getOrThrow<string>('TWILIO_AUTH_TOKEN')}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      }, body, redirect: 'error', signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error('Recovery message delivery failed.');
  }
}

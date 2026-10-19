import { BadRequestException, Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { Prisma } from '@prisma/client-auth';
import { AuthPrismaService } from '../database/auth-prisma.service';
import { verifyPassword } from '../security/passwords';

const digest = (value: string) => createHash('sha256').update(value).digest('hex');

@Injectable()
export class TelegramRecoveryService {
  constructor(private readonly db: AuthPrismaService, private readonly config: ConfigService) {}

  private settings() {
    const username = this.config.get<string>('PASSWORD_RESET_TELEGRAM_BOT_USERNAME');
    const secret = this.config.get<string>('PASSWORD_RESET_TELEGRAM_WEBHOOK_SECRET');
    if (!username || !/^[A-Za-z0-9_]{5,32}$/.test(username) || !secret || !/^[A-Za-z0-9_-]{32,256}$/.test(secret)) {
      throw new ServiceUnavailableException('Telegram recovery bot is not configured.');
    }
    return { username, secret };
  }

  async link(userId: string, password: string) {
    const { username } = this.settings();
    const token = randomBytes(32).toString('hex');
    await this.db.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId}::uuid FOR UPDATE`;
      const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
      if (!user.isActive || user.mustChangePassword || !await verifyPassword(password, user.passwordHash)) throw new UnauthorizedException('Current password is incorrect.');
      // Replacement requires unlinking first with password verification.
      if (user.telegramChatId) throw new BadRequestException('Unlink the existing Telegram recovery account before linking another.');
      await tx.telegramRecoveryLink.updateMany({ where: { userId, usedAt: null }, data: { usedAt: new Date() } });
      await tx.telegramRecoveryLink.create({ data: { userId, passwordVersion: digest(user.passwordHash), tokenHash: digest(token), expiresAt: new Date(Date.now() + 600000) } });
    });
    return { url: `https://t.me/${username}?start=${token}`, expiresIn: 600 };
  }

  async unlink(userId: string, password: string) {
    await this.db.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId}::uuid FOR UPDATE`;
      const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
      if (!user.isActive || user.mustChangePassword || !await verifyPassword(password, user.passwordHash)) throw new UnauthorizedException('Current password is incorrect.');
      await tx.user.update({ where: { id: userId }, data: { telegramChatId: null } });
      await tx.telegramRecoveryLink.updateMany({ where: { userId, usedAt: null }, data: { usedAt: new Date() } });
      await tx.passwordResetChallenge.updateMany({ where: { userId, channel: 'telegram', usedAt: null }, data: { usedAt: new Date() } });
    });
    return { message: 'Telegram recovery unlinked.' };
  }

  async webhook(secret: string | undefined, update: unknown) {
    const expected = this.settings().secret;
    if (!secret || Buffer.byteLength(secret) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(secret), Buffer.from(expected))) {
      throw new UnauthorizedException('Invalid webhook secret.');
    }
    const message = (update as { message?: { text?: unknown; chat?: { id?: unknown; type?: unknown }; from?: { id?: unknown; is_bot?: unknown } } } | null)?.message;
    if (!message || typeof message.text !== 'string' || message.chat?.type !== 'private' ||
        !Number.isSafeInteger(message.chat.id) || Number(message.chat.id) <= 0 || message.from?.id !== message.chat.id || message.from?.is_bot !== false) return { ok: true };
    const match = /^\/start ([0-9a-f]{64})$/.exec(message.text);
    if (!match) return { ok: true };
    const link = await this.db.telegramRecoveryLink.findUnique({ where: { tokenHash: digest(match[1]) } });
    if (!link) return { ok: true };
    try {
      await this.db.$transaction(async tx => {
        await tx.$queryRaw`SELECT id FROM users WHERE id = ${link.userId}::uuid FOR UPDATE`;
        const current = await tx.telegramRecoveryLink.findUniqueOrThrow({ where: { tokenHash: link.tokenHash } });
        const user = await tx.user.findUniqueOrThrow({ where: { id: link.userId } });
        if (current.usedAt || current.expiresAt <= new Date() || !user.isActive || user.mustChangePassword || user.telegramChatId || digest(user.passwordHash) !== current.passwordVersion) return;
        await tx.user.update({ where: { id: user.id }, data: { telegramChatId: String(message.chat!.id) } });
        await tx.telegramRecoveryLink.update({ where: { tokenHash: current.tokenHash }, data: { usedAt: new Date() } });
      });
    } catch (error) {
      // A chat may recover only one INVA account. Do not reveal which one.
      if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')) throw error;
    }
    return { ok: true };
  }
}

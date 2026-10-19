import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, createHmac, randomBytes, randomInt, randomUUID, timingSafeEqual } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { PasswordResetChallenge, Prisma, User } from '@prisma/client-auth';
import { AuthPrismaService } from '../database/auth-prisma.service';
import { ForgotPasswordDto, ResetPasswordDto, VerifyPasswordResetDto } from '../dto/password-reset.dto';
import { hashPassword, verifyPassword } from '../security/passwords';
import { PasswordResetDeliveryService } from './password-reset-delivery.service';

const CODE_TTL_SECONDS = 600;
const RESET_TTL_SECONDS = 300;
const MAX_ATTEMPTS = 5;
const INVALID = 'Invalid or expired password reset. Request a new code.';
const digest = (value: string) => createHash('sha256').update(value).digest('hex');
const equals = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);
  constructor(private readonly db: AuthPrismaService, private readonly config: ConfigService, private readonly delivery: PasswordResetDeliveryService) {}

  private codeHash(id: string, code: string): string {
    return createHmac('sha256', this.config.getOrThrow<string>('JWT_SECRET')).update(`password-reset:${id}:${code}`).digest('hex');
  }

  private validAccount(challenge: PasswordResetChallenge, user: User): boolean {
    const destination = challenge.channel === 'telegram' ? user.telegramChatId : challenge.channel === 'sms' ? user.phone : user.email;
    return user.isActive && destination === challenge.destination && digest(user.passwordHash) === challenge.passwordVersion;
  }

  async request(dto: ForgotPasswordDto) {
    const channel = dto.channel || (dto.phone ? 'sms' : 'email');
    this.delivery.assertAvailable(channel); // Same error for every identity when delivery is unavailable.
    if (((channel === 'sms' || channel === 'telegram') && !dto.phone) || (channel === 'email' && !dto.email)) {
      throw new BadRequestException('SMS/Telegram requires phone; email delivery requires email.');
    }
    const started = Date.now();
    const responseFloor = this.config.get('PASSWORD_RESET_DELIVERY') === 'live' ? 6000 : 300;
    const id = randomUUID();
    const code = randomInt(0, 1000000).toString().padStart(6, '0');
    const expiresAt = new Date(Date.now() + CODE_TTL_SECONDS * 1000);
    try {
      const user = dto.phone ? await this.db.user.findUnique({ where: { phone: dto.phone } })
        : await this.db.user.findUnique({ where: { email: dto.email! } });
      if (user?.isActive) {
        const challenge = await this.db.$transaction(async tx => {
          await tx.$queryRaw`SELECT id FROM users WHERE id = ${user.id}::uuid FOR UPDATE`;
          const current = await tx.user.findUniqueOrThrow({ where: { id: user.id } });
          const destination = channel === 'telegram' ? current.telegramChatId : channel === 'sms' ? current.phone : current.email;
          if (!current.isActive || !destination || (dto.phone ? current.phone !== dto.phone : current.email !== dto.email)) return null;
          const recent = await tx.passwordResetChallenge.findMany({
            where: { userId: user.id, createdAt: { gt: new Date(Date.now() - 3600000) } },
            orderBy: { createdAt: 'desc' }, take: 10,
          });
          if (recent.length >= 10 || (recent[0] && Date.now() - recent[0].createdAt.getTime() < 60000)) return null;
          await tx.passwordResetChallenge.updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: new Date() } });
          return tx.passwordResetChallenge.create({ data: { id, userId: user.id, channel, destination,
            passwordVersion: digest(current.passwordHash), codeHash: this.codeHash(id, code), expiresAt } });
        });
        if (challenge) {
          try { await this.delivery.send({ challengeId: id, channel, destination: challenge.destination, code, expiresAt }); }
          catch {
            await this.db.passwordResetChallenge.updateMany({ where: { id }, data: { usedAt: new Date() } });
            this.logger.warn('Password reset delivery failed.');
          }
        }
      }
      // Unknown, inactive, suppressed and valid accounts have identical public responses.
      return { message: 'If the account is eligible, a verification code will be sent.', challengeId: id, expiresIn: CODE_TTL_SECONDS };
    } finally { await delay(Math.max(0, responseFloor + randomInt(0, 50) - (Date.now() - started))); }
  }

  async verify(dto: VerifyPasswordResetDto) {
    const tokenSecret = randomBytes(32).toString('hex');
    const challenge = await this.db.passwordResetChallenge.findUnique({ where: { id: dto.challengeId } });
    if (!challenge) throw new UnauthorizedException(INVALID);
    const verified = await this.db.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${challenge.userId}::uuid FOR UPDATE`;
      const current = await tx.passwordResetChallenge.findUniqueOrThrow({ where: { id: challenge.id } });
      const user = await tx.user.findUniqueOrThrow({ where: { id: current.userId } });
      if (current.usedAt || current.verifiedAt || current.expiresAt <= new Date() || current.attempts >= MAX_ATTEMPTS || !this.validAccount(current, user)) return false;
      const matches = equals(current.codeHash, this.codeHash(current.id, dto.code));
      await tx.passwordResetChallenge.update({ where: { id: current.id }, data: {
        attempts: { increment: 1 },
        ...(matches ? { verifiedAt: new Date(), resetTokenHash: digest(tokenSecret), resetExpiresAt: new Date(Date.now() + RESET_TTL_SECONDS * 1000) }
          : current.attempts + 1 >= MAX_ATTEMPTS ? { usedAt: new Date() } : {}),
      } });
      return matches; // Commit failed attempts; throw only outside the transaction.
    });
    if (!verified) throw new UnauthorizedException(INVALID);
    return { token: `${challenge.id}.${tokenSecret}`, expiresIn: RESET_TTL_SECONDS };
  }

  async reset(dto: ResetPasswordDto) {
    const [id, secret] = dto.token.split('.');
    const candidate = await this.db.passwordResetChallenge.findUnique({ where: { id } });
    if (!candidate?.resetTokenHash || !equals(candidate.resetTokenHash, digest(secret))) throw new UnauthorizedException(INVALID);
    const passwordHash = await hashPassword(dto.newPassword);
    const result = await this.db.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${candidate.userId}::uuid FOR UPDATE`;
      const challenge = await tx.passwordResetChallenge.findUniqueOrThrow({ where: { id } });
      const user = await tx.user.findUniqueOrThrow({ where: { id: challenge.userId } });
      if (challenge.usedAt || !challenge.verifiedAt || !challenge.resetExpiresAt || challenge.resetExpiresAt <= new Date() ||
          !challenge.resetTokenHash || !equals(challenge.resetTokenHash, digest(secret)) || !this.validAccount(challenge, user)) return null;
      if (await verifyPassword(dto.newPassword, user.passwordHash)) throw new BadRequestException('Choose a password different from the current password.');
      await tx.user.update({ where: { id: user.id }, data: { passwordHash, mustChangePassword: false, temporaryPasswordExpiresAt: null } });
      await tx.passwordResetChallenge.updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: new Date() } });
      await tx.authChallenge.updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: new Date() } });
      await tx.mfaCredential.deleteMany({ where: { userId: user.id, verifiedAt: null } });
      await tx.refreshToken.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } });
      return { userId: user.id, email: user.email };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted });
    if (!result) throw new UnauthorizedException(INVALID);
    return { ...result, message: 'Password updated. Sign in with your new password.' };
  }
}

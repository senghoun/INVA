import { jsonStringArray } from '@common';
import { Injectable, BadRequestException, HttpException, UnauthorizedException, ForbiddenException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';
import { TOTP, Secret } from 'otpauth';
import { AuthPrismaService } from '../database/auth-prisma.service';
import { verifyPassword } from '../security/passwords';

@Injectable()
export class MfaService {
  constructor(private readonly db: AuthPrismaService, private readonly config: ConfigService, private readonly jwt: JwtService) {}
  private key(): Buffer {
    // Keep this key stable across restarts; existing authenticator secrets depend on it.
    const value = this.config.get<string>('MFA_ENCRYPTION_KEY', '');
    if (!/^[a-f0-9]{64}$/i.test(value)) throw new ServiceUnavailableException('MFA encryption is not configured.');
    return Buffer.from(value, 'hex');
  }
  private encrypt(secret: string): string {
    const iv = randomBytes(12); const cipher = createCipheriv('aes-256-gcm', this.key(), iv);
    const payload = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
    return [iv, cipher.getAuthTag(), payload].map(value => value.toString('base64url')).join('.');
  }
  private decrypt(value: string): string {
    const [iv, tag, data] = value.split('.').map(part => Buffer.from(part, 'base64url'));
    const cipher = createDecipheriv('aes-256-gcm', this.key(), iv); cipher.setAuthTag(tag);
    return Buffer.concat([cipher.update(data), cipher.final()]).toString('utf8');
  }
  private totp(secret: string, label = 'Account') { return new TOTP({ issuer: 'INVA', label, secret, digits: 6, period: 30 }); }
  private hash(code: string) { return createHash('sha256').update(code).digest('hex'); }
  private counter(secret: string, code: string): bigint | null {
    if (!/^\d{6}$/.test(code)) return null;
    const totp = this.totp(secret); const timestamp = Date.now();
    const delta = totp.validate({ token: code, window: 1, timestamp });
    return delta === null ? null : BigInt(Math.floor(timestamp / 30000) + delta);
  }
  async setup(userId: string, method: string, password: string) {
    if (method !== 'TOTP') throw new BadRequestException('Only authenticator-app MFA is configured.');
    const user = await this.db.user.findUnique({ where: { id: userId } });
    if (!user?.isActive || !await verifyPassword(password, user.passwordHash)) throw new UnauthorizedException('Current password is incorrect.');
    if (user.mfaEnabled) throw new ForbiddenException('Use verified authenticator replacement; existing MFA cannot be overwritten.');
    const secret = new Secret({ size: 20 }).base32;
    const encrypted = this.encrypt(secret);
    await this.db.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId}::uuid FOR UPDATE`;
      const current = await tx.user.findUniqueOrThrow({ where: { id: userId } });
      if (current.mfaEnabled || current.passwordHash !== user.passwordHash || !current.isActive) throw new ForbiddenException('Account changed. Sign in again.');
      await tx.mfaCredential.upsert({ where: { userId }, create: { userId, secretEncrypted: encrypted, setupExpiresAt: new Date(Date.now() + 300000) },
        update: { secretEncrypted: encrypted, setupExpiresAt: new Date(Date.now() + 300000), verifiedAt: null, lastCounter: -1 } });
    }, { isolationLevel: 'ReadCommitted' });
    return { method: 'TOTP', secret, otpauthUri: this.totp(secret, user.email || user.phone || user.id).toString(), expiresIn: 300 };
  }
  async confirm(userId: string, code: string) {
    const codes = Array.from({ length: 10 }, () => randomBytes(16).toString('hex'));
    await this.db.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId}::uuid FOR UPDATE`;
      const current = await tx.user.findUnique({ where: { id: userId } });
      if (!current?.isActive || current.mustChangePassword) throw new UnauthorizedException('Sign in again.');
      const credential = await tx.mfaCredential.findUnique({ where: { userId } });
      if (!credential || credential.verifiedAt || credential.setupExpiresAt <= new Date()) throw new UnauthorizedException('Enrollment expired.');
      const counter = this.counter(this.decrypt(credential.secretEncrypted), code);
      if (counter === null) throw new UnauthorizedException('Invalid verification code.');
      await tx.mfaCredential.update({ where: { userId }, data: { verifiedAt: new Date(), lastCounter: counter, recoveryHashes: codes.map(value => this.hash(value)) } });
      await tx.user.update({ where: { id: userId }, data: { mfaEnabled: true } });
      await tx.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
    }, { isolationLevel: 'ReadCommitted' });
    return { backupCodes: codes };
  }
  async disable(userId: string, password: string, code: string) {
    const previous = await this.db.user.findUnique({ where: { id: userId } });
    if (!previous?.isActive || !await verifyPassword(password, previous.passwordHash)) throw new UnauthorizedException('Current password is incorrect.');
    await this.db.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId}::uuid FOR UPDATE`;
      const user = await tx.user.findUnique({ where: { id: userId } });
      const credential = await tx.mfaCredential.findUnique({ where: { userId } });
      if (!user?.isActive || user.mustChangePassword || user.passwordHash !== previous.passwordHash || !user.mfaEnabled || !credential?.verifiedAt) throw new UnauthorizedException('Account changed. Sign in again.');
      const recovery = jsonStringArray(credential.recoveryHashes).includes(this.hash(code));
      const counter = recovery ? null : this.counter(this.decrypt(credential.secretEncrypted), code);
      if (!recovery && (counter === null || counter <= credential.lastCounter)) throw new UnauthorizedException('A fresh authenticator or recovery code is required.');
      await tx.mfaCredential.delete({ where: { userId } });
      await tx.user.update({ where: { id: userId }, data: { mfaEnabled: false } });
      await tx.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
      await tx.authChallenge.updateMany({ where: { userId, usedAt: null }, data: { usedAt: new Date() } });
    }, { isolationLevel: 'ReadCommitted' });
    return { message: 'Authenticator removed. All sessions ended. Sign in to enroll a replacement.' };
  }

  async challenge(userId: string) {
    const user = await this.db.user.findUniqueOrThrow({ where: { id: userId } });
    const challenge = await this.db.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId}::uuid FOR UPDATE`;
      const cutoff = new Date(Date.now() - 15 * 60000);
      const recent = await tx.authChallenge.aggregate({ where: { userId, purpose: 'MFA_LOGIN', createdAt: { gt: cutoff } }, _sum: { attempts: true }, _count: true });
      if ((recent._sum.attempts || 0) >= 20 || recent._count >= 10) throw new HttpException('MFA attempt limit reached. Try again later.', 429);
      return tx.authChallenge.create({ data: { userId, purpose: 'MFA_LOGIN', expiresAt: new Date(Date.now() + 300000) } });
    }, { isolationLevel: 'ReadCommitted' });
    return { requiresMfa: true as const, challenge: { method: 'TOTP' as const, sessionToken: this.jwt.sign({ sub: userId, jti: challenge.id, type: 'mfa-login', version: this.hash(user.passwordHash) }, { audience: 'mfa-login', expiresIn: 300 }), expiresIn: 300 } };
  }
  async verify(sessionToken: string, code: string): Promise<{ userId: string; passwordHash: string }> {
    let claims: { sub: string; jti: string; type: string; version: string };
    try { claims = this.jwt.verify(sessionToken, { algorithms: ['HS256'], issuer: 'inva-auth', audience: 'mfa-login' }); }
    catch { throw new UnauthorizedException('MFA challenge expired.'); }
    if (claims.type !== 'mfa-login' || !claims.sub || !claims.jti) throw new UnauthorizedException();
    const accepted = await this.db.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${claims.sub}::uuid FOR UPDATE`;
      const challenge = await tx.authChallenge.findUnique({ where: { id: claims.jti } });
      const user = await tx.user.findUnique({ where: { id: claims.sub } });
      const credential = await tx.mfaCredential.findUnique({ where: { userId: claims.sub } });
      if (!challenge || challenge.userId !== claims.sub || challenge.purpose !== 'MFA_LOGIN' || challenge.usedAt || challenge.attempts >= 5 || challenge.expiresAt <= new Date() || !user?.isActive || claims.version !== this.hash(user.passwordHash) || user.mustChangePassword || !user.mfaEnabled || !credential?.verifiedAt) return false;
      const recent = await tx.authChallenge.aggregate({ where: { userId: claims.sub, purpose: 'MFA_LOGIN', createdAt: { gt: new Date(Date.now() - 15 * 60000) } }, _sum: { attempts: true } });
      if ((recent._sum.attempts || 0) >= 20) return false;
      const hash = this.hash(code); const recovery = jsonStringArray(credential.recoveryHashes).includes(hash);
      const counter = recovery ? null : this.counter(this.decrypt(credential.secretEncrypted), code);
      const valid = recovery || counter !== null && counter > credential.lastCounter;
      await tx.authChallenge.update({ where: { id: challenge.id }, data: { attempts: { increment: 1 }, ...(valid ? { usedAt: new Date() } : {}) } });
      if (!valid) return false;
      await tx.mfaCredential.update({ where: { userId: claims.sub }, data: recovery ? { recoveryHashes: jsonStringArray(credential.recoveryHashes).filter(value => value !== hash) } : { lastCounter: counter! } });
      return { userId: claims.sub, passwordHash: user.passwordHash };
    }, { isolationLevel: 'ReadCommitted' });
    if (!accepted) throw new UnauthorizedException('Invalid, expired, or already-used MFA code.');
    return accepted;
  }
}

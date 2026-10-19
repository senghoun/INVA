require('ts-node').register({ files: true });
const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { readFile, unlink } = require('node:fs/promises');
const { randomUUID } = require('node:crypto');
const { PrismaClient } = require('@prisma/client-auth');
const { ConfigService } = require('@nestjs/config');
const { PasswordResetService } = require('../apps/auth-service/src/services/password-reset.service');
const { PasswordResetDeliveryService } = require('../apps/auth-service/src/services/password-reset-delivery.service');
const { TelegramRecoveryService } = require('../apps/auth-service/src/services/telegram-recovery.service');
const { hashPassword, verifyPassword } = require('../apps/auth-service/src/security/passwords');
const { plainToInstance } = require('class-transformer');
const { validate } = require('class-validator');
const { ForgotPasswordDto, ResetPasswordDto } = require('../apps/auth-service/src/dto/password-reset.dto');
const url = process.env.PASSWORD_RESET_TEST_DATABASE_URL;
if (!url || !new URL(url).pathname.endsWith('_test')) throw new Error('Set PASSWORD_RESET_TEST_DATABASE_URL to an isolated database ending in _test.');
const db = new PrismaClient({ datasources: { db: { url } } });
const config = new ConfigService({ NODE_ENV: 'test', PASSWORD_RESET_DELIVERY: 'local', JWT_SECRET: 'isolated-test-secret-'.repeat(4),
  PASSWORD_RESET_TELEGRAM_BOT_USERNAME: 'inva_test_bot', PASSWORD_RESET_TELEGRAM_WEBHOOK_SECRET: 'test_webhook_secret_'.repeat(3) });
const delivery = new PasswordResetDeliveryService(config);
const service = new PasswordResetService(db, config, delivery);
const telegram = new TelegramRecoveryService(db, config);
const userIds = [], files = [];
const originalPassword = 'OriginalPass123!';
let nextPhone = 81000000;
async function user(overrides = {}) {
  const account = await db.user.create({ data: { email: `recovery-${randomUUID()}@example.invalid`, phone: `+855${nextPhone++}`,
    passwordHash: await hashPassword(originalPassword), ...overrides } });
  userIds.push(account.id); return account;
}
async function request(account, channel = 'sms') {
  const result = await service.request({ phone: account.phone, channel });
  const file = `.local/password-reset-outbox/${result.challengeId}.json`;
  files.push(file);
  return { ...result, delivery: JSON.parse(await readFile(file, 'utf8')) };
}
async function verified(account) {
  const result = await request(account);
  const grant = await service.verify({ challengeId: result.challengeId, code: result.delivery.code });
  return { ...result, ...grant };
}
after(async () => {
  await db.refreshToken.deleteMany({ where: { userId: { in: userIds } } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await Promise.all(files.map(f => unlink(f).catch(() => {})));
  await db.$disconnect();
});

test('DTO rejects absent/both identities and malformed reset UUIDs; permits phone and telegram', async () => {
  assert.ok((await validate(plainToInstance(ForgotPasswordDto, {}))).length);
  assert.ok((await validate(plainToInstance(ForgotPasswordDto, { phone: '+85512345678', email: 'a@example.com' }))).length);
  assert.deepEqual(await validate(plainToInstance(ForgotPasswordDto, { phone: '+855 12 345 678', channel: 'telegram' })), []);
  assert.ok((await validate(plainToInstance(ResetPasswordDto, { token: '-'.repeat(36) + '.' + 'a'.repeat(64), newPassword: 'ValidPassword123' }))).length);
});
test('full reset stores hashes, revokes sessions/challenges, preserves verified MFA and prevents replay', async () => {
  const account = await user();
  await db.refreshToken.create({ data: { userId: account.id, tokenHash: 'test', expiresAt: new Date(Date.now() + 600000) } });
  await db.authChallenge.create({ data: { userId: account.id, purpose: 'MFA', expiresAt: new Date(Date.now() + 600000) } });
  await db.mfaCredential.create({ data: { userId: account.id, secretEncrypted: 'test-only', verifiedAt: new Date(), setupExpiresAt: new Date() } });
  await db.user.update({ where: { id: account.id }, data: { mfaEnabled: true } });
  const grant = await verified(account);
  const challenge = await db.passwordResetChallenge.findUniqueOrThrow({ where: { id: grant.challengeId } });
  assert.notEqual(challenge.codeHash, grant.delivery.code);
  assert.notEqual(challenge.resetTokenHash, grant.token.split('.')[1]);
  await service.reset({ token: grant.token, newPassword: 'NewPassword456!' });
  const updated = await db.user.findUniqueOrThrow({ where: { id: account.id } });
  assert.equal(await verifyPassword('NewPassword456!', updated.passwordHash), true);
  assert.equal(await verifyPassword(originalPassword, updated.passwordHash), false);
  assert.equal(updated.mfaEnabled, true);
  assert.ok(await db.mfaCredential.findUnique({ where: { userId: account.id } }));
  assert.equal(await db.refreshToken.count({ where: { userId: account.id, revokedAt: null } }), 0);
  assert.equal(await db.authChallenge.count({ where: { userId: account.id, usedAt: null } }), 0);
  await assert.rejects(service.reset({ token: grant.token, newPassword: 'AnotherPass123!' }), { status: 401 });
});
test('wrong codes persist attempts and exhaust after five guesses', async () => {
  const result = await request(await user());
  const bad = result.delivery.code === '000000' ? '111111' : '000000';
  for (let i = 0; i < 5; i++) await assert.rejects(service.verify({ challengeId: result.challengeId, code: bad }), { status: 401 });
  const challenge = await db.passwordResetChallenge.findUniqueOrThrow({ where: { id: result.challengeId } });
  assert.equal(challenge.attempts, 5); assert.ok(challenge.usedAt);
  await assert.rejects(service.verify({ challengeId: result.challengeId, code: result.delivery.code }), { status: 401 });
});
test('expired code and expired reset token cannot authorize a password change', async () => {
  const first = await request(await user());
  await db.passwordResetChallenge.update({ where: { id: first.challengeId }, data: { expiresAt: new Date(0) } });
  await assert.rejects(service.verify({ challengeId: first.challengeId, code: first.delivery.code }), { status: 401 });
  const second = await verified(await user());
  await db.passwordResetChallenge.update({ where: { id: second.challengeId }, data: { resetExpiresAt: new Date(0) } });
  await assert.rejects(service.reset({ token: second.token, newPassword: 'AnotherPass123!' }), { status: 401 });
});
test('code is single-use even with concurrent verification', async () => {
  const result = await request(await user());
  const outcomes = await Promise.allSettled([1,2].map(() => service.verify({ challengeId: result.challengeId, code: result.delivery.code })));
  assert.equal(outcomes.filter(x => x.status === 'fulfilled').length, 1);
});
test('reset grant is single-use under concurrent password updates', async () => {
  const grant = await verified(await user());
  const outcomes = await Promise.allSettled([1,2].map(n => service.reset({ token: grant.token, newPassword: `ConcurrentPass${n}!` })));
  assert.equal(outcomes.filter(x => x.status === 'fulfilled').length, 1);
});
test('unknown/inactive/unlinked accounts return the same public response shape without creating challenges', async () => {
  const inactive = await user({ isActive: false });
  const unlinked = await user();
  for (const dto of [{ phone: '+85512340000' }, { phone: inactive.phone }, { phone: unlinked.phone, channel: 'telegram' }]) {
    const result = await service.request(dto);
    assert.deepEqual(Object.keys(result).sort(), ['challengeId', 'expiresIn', 'message']);
    assert.equal(await db.passwordResetChallenge.findUnique({ where: { id: result.challengeId } }), null);
  }
});
test('cooldown suppresses resend and unknown reset tokens cannot bypass verification', async () => {
  const account = await user();
  await request(account);
  const second = await service.request({ phone: account.phone });
  assert.equal(await db.passwordResetChallenge.findUnique({ where: { id: second.challengeId } }), null);
  await assert.rejects(service.reset({ token: `${second.challengeId}.${'a'.repeat(64)}`, newPassword: 'AnotherPass123!' }), { status: 401 });
});
test('a changed password or contact invalidates outstanding recovery authorization', async () => {
  const account = await user();
  const grant = await verified(account);
  await db.user.update({ where: { id: account.id }, data: { passwordHash: await hashPassword('ChangedElsewhere1!') } });
  await assert.rejects(service.reset({ token: grant.token, newPassword: 'AnotherPass123!' }), { status: 401 });
  const second = await user(); const code = await request(second);
  await db.user.update({ where: { id: second.id }, data: { phone: '+85589999999' } });
  await assert.rejects(service.verify({ challengeId: code.challengeId, code: code.delivery.code }), { status: 401 });
});
test('telegram linking requires password and authenticated webhook; groups/replay cannot rebind', async () => {
  const account = await user();
  await assert.rejects(telegram.link(account.id, 'incorrect'), { status: 401 });
  const link = await telegram.link(account.id, originalPassword);
  const token = new URL(link.url).searchParams.get('start');
  const update = { message: { text: `/start ${token}`, chat: { id: 123456789, type: 'private' }, from: { id: 123456789, is_bot: false } } };
  await assert.rejects(telegram.webhook('invalid', update), { status: 401 });
  await telegram.webhook(config.get('PASSWORD_RESET_TELEGRAM_WEBHOOK_SECRET'), { message: { ...update.message, chat: { id: 123456789, type: 'group' } } });
  assert.equal((await db.user.findUniqueOrThrow({ where: { id: account.id } })).telegramChatId, null);
  await telegram.webhook(config.get('PASSWORD_RESET_TELEGRAM_WEBHOOK_SECRET'), update);
  const sent = await request(account, 'telegram');
  assert.equal(sent.delivery.destination, '123456789');
  await telegram.unlink(account.id, originalPassword);
  await telegram.webhook(config.get('PASSWORD_RESET_TELEGRAM_WEBHOOK_SECRET'), update);
  assert.equal((await db.user.findUniqueOrThrow({ where: { id: account.id } })).telegramChatId, null);
  await assert.rejects(service.verify({ challengeId: sent.challengeId, code: sent.delivery.code }), { status: 401 });
});
test('local mode is refused in production; live mode requires configured channel', () => {
  assert.throws(() => new PasswordResetDeliveryService(new ConfigService({ NODE_ENV: 'production', PASSWORD_RESET_DELIVERY: 'local' })).assertAvailable('sms'), { status: 503 });
  assert.throws(() => new PasswordResetDeliveryService(new ConfigService({ PASSWORD_RESET_DELIVERY: 'live' })).assertAvailable('sms'), { status: 503 });
});
test('SMS and Telegram adapters call provider endpoints with private recipient, without sending live messages', async () => {
  const originalFetch = global.fetch; const requests = [];
  global.fetch = async (url, options) => { requests.push({ url, options }); return { ok: true, json: async () => ({ ok: true }) }; };
  try {
    const live = new PasswordResetDeliveryService(new ConfigService({ PASSWORD_RESET_DELIVERY: 'live', PASSWORD_RESET_SMS_PROVIDER: 'twilio',
      TWILIO_ACCOUNT_SID: 'AC' + 'a'.repeat(32), TWILIO_AUTH_TOKEN: 'test-token', TWILIO_FROM_NUMBER: '+15551234567', PASSWORD_RESET_TELEGRAM_BOT_TOKEN: 'fake-test-bot-token' }));
    const payload = { challengeId: randomUUID(), channel: 'sms', destination: '+85512345678', code: '123456', expiresAt: new Date() };
    await live.send(payload);
    assert.ok(requests[0].url.startsWith('https://api.twilio.com/'));
    assert.equal(requests[0].options.body.get('To'), payload.destination);
    await live.send({ ...payload, channel: 'telegram', destination: '123456789' });
    assert.equal(JSON.parse(requests[1].options.body).chat_id, '123456789');
    assert.equal(requests[1].options.redirect, 'error');
  } finally { global.fetch = originalFetch; }
});
test('HTTP routes validate input and complete the three-step flow without exposing codes', async () => {
  process.env.DATABASE_AUTH_URL = url;
  process.env.NODE_ENV = 'test';
  process.env.PASSWORD_RESET_DELIVERY = 'local';
  process.env.TELEGRAM_ALERTS_ENABLED = 'false';
  const { NestFactory } = require('@nestjs/core');
  const { FastifyAdapter } = require('@nestjs/platform-fastify');
  const { ValidationPipe } = require('@nestjs/common');
  const { AppModule } = require('../apps/auth-service/src/app.module');
  const app = await NestFactory.create(AppModule, new FastifyAdapter(), { logger: false });
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  try {
    await app.init();
    const http = app.getHttpAdapter().getInstance();
    await http.ready();
    const account = await user();
    const invalid = await http.inject({ method: 'POST', url: '/api/v1/auth/password/reset-request', payload: {} });
    assert.equal(invalid.statusCode, 400);
    const response = await http.inject({ method: 'POST', url: '/api/v1/auth/password/reset-request', payload: { phone: account.phone, channel: 'sms' } });
    assert.equal(response.statusCode, 200, response.body);
    assert.equal(response.headers['cache-control'], 'no-store');
    const data = response.json();
    assert.equal(data.code, undefined);
    const file = `.local/password-reset-outbox/${data.challengeId}.json`; files.push(file);
    const code = JSON.parse(await readFile(file, 'utf8')).code;
    const verified = await http.inject({ method: 'POST', url: '/api/v1/auth/password/reset-verify', payload: { challengeId: data.challengeId, code } });
    assert.equal(verified.statusCode, 200, verified.body);
    const completed = await http.inject({ method: 'POST', url: '/api/v1/auth/password/reset-confirm', payload: { token: verified.json().token, newPassword: 'HttpRecoveryPass1!' } });
    assert.equal(completed.statusCode, 200, completed.body);
    assert.deepEqual(Object.keys(completed.json()), ['message']);
    assert.equal(await verifyPassword('HttpRecoveryPass1!', (await db.user.findUniqueOrThrow({ where: { id: account.id } })).passwordHash), true);
  } finally { await app.close(); }
});

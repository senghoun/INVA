const { test } = require('node:test');
const assert = require('node:assert/strict');
const { legacyPhone, mapUser, planImport } = require('./legacy-users.cjs');
const bcrypt = require('bcryptjs');
const row = (id = 1, phone = '012345678') => ({ id, phone, prefix: '+855', first_name: 'Test', last_name: 'User',
  gender: 0, photo: 'defaults/user_profile.png', language: 'kh', active: 1, user_type_id: 2,
  password: '', created_at: '2020-01-01 00:00:00', updated_at: null });
test('normalizes Cambodian legacy formats and rejects ambiguous phones', () => {
  for (const phone of ['012 345 678', '12345678', '85512345678', '+855 12 345 678']) assert.equal(legacyPhone('+855', phone), '+85512345678');
  for (const phone of ['', null, 'bad', '0123', '0123/45678']) assert.equal(legacyPhone('+855', phone), null);
  assert.equal(legacyPhone('+44', '012345678'), null);
});
test('preserves source identity, status, image, profile, language and missing credentials without grants', () => {
  const { data } = mapUser({ ...row(), active: 0 });
  assert.equal(data.email, null); assert.equal(data.legacyUserId, 1);
  assert.equal(data.isActive, false); assert.equal(data.gender, 'MALE');
  assert.equal(data.userType, 'EXTERNAL'); assert.equal(data.language, 'km');
  assert.equal(data.legacyMetadata.language, 'kh');
  assert.equal(data.passwordHash, '!legacy-password-missing');
  assert.equal(data.createdAt.toISOString(), '2020-01-01T00:00:00.000Z');
  for (const field of ['userRoles','companyMemberships','mfaCredential','password_confirmation','fcm_token']) assert.equal(data[field], undefined);
  assert.equal(mapUser({ ...row(), gender: 1, user_type_id: 1 }).data.userType, 'INTERNAL');
});
test('quarantines every duplicate instead of choosing a winning identity or merging target accounts', () => {
  const plan = planImport([row(1), row(2, '+85512345678'), row(3,'098765432')], [{ id: 'existing', phone: '+85598765432', legacyUserId: null }]);
  assert.equal(plan.users.length, 0);
  assert.deepEqual(plan.quarantine.map(q => q.reason), ['DUPLICATE_SOURCE_PHONE','DUPLICATE_SOURCE_PHONE','TARGET_PHONE_CONFLICT']);
});
test('reruns skip mapped IDs without overwriting later target changes', () => {
  const plan = planImport([row()], [{ id: 'uuid', legacyUserId: 1, phone: '+85599999999' }]);
  assert.equal(plan.alreadyImported, 1); assert.equal(plan.users.length, 0);
});
test('unknown classifications and unsupported credentials require review', () => {
  assert.equal(mapUser({ ...row(), user_type_id: 7 }).reason, 'UNKNOWN_USER_TYPE');
  assert.equal(mapUser({ ...row(), gender: 7 }).reason, 'UNKNOWN_GENDER');
  assert.equal(mapUser({ ...row(), password: 'plaintext' }).reason, 'UNSUPPORTED_PASSWORD_FORMAT');
});
test('Laravel bcrypt hashes remain verifiable; missing passwords never authenticate', async () => {
  const { verifyPassword, hashPassword } = require('../../apps/auth-service/src/security/passwords');
  const hash = (await bcrypt.hash('LegacyPass123!', 10)).replace('$2a$', '$2y$').replace('$2b$', '$2y$');
  const { data } = mapUser({ ...row(), password: hash });
  assert.equal(data.passwordHash, hash);
  assert.equal(await verifyPassword('LegacyPass123!', data.passwordHash), true);
  assert.equal(await verifyPassword('wrong', data.passwordHash), false);
  assert.equal(await verifyPassword('anything', mapUser(row()).data.passwordHash), false);
  const upgraded = await hashPassword('LegacyPass123!');
  assert.ok(upgraded.startsWith('$argon2id$'));
  assert.equal(await verifyPassword('LegacyPass123!', upgraded), true);
});
test('admin DTO allows phone-only identities, validates inherited profile fields and rejects missing identities', async () => {
  const { plainToInstance } = require('class-transformer');
  const { validate } = require('class-validator');
  const { CreateUserDto } = require('../../apps/auth-service/src/dto/create-user.dto');
  const { UpdateUserDto } = require('../../apps/auth-service/src/dto/update-user.dto');
  const valid = plainToInstance(CreateUserDto, { phone: '+855 12 345 678', password: 'ValidPass123!', firstName: 'Test', gender: 'FEMALE', language: 'km' });
  assert.deepEqual(await validate(valid), []);
  assert.equal(valid.phone, '+85512345678');
  const invalid = plainToInstance(CreateUserDto, { password: 'ValidPass123!' });
  assert.ok((await validate(invalid)).some(e => e.property === 'email'));
  const badProfile = plainToInstance(UpdateUserDto, { gender: 'unknown', language: null, firstName: 42 });
  assert.deepEqual((await validate(badProfile)).map(e => e.property).sort(), ['firstName', 'gender', 'language']);
  assert.deepEqual(await validate(plainToInstance(UpdateUserDto, { firstName: null, gender: null, image: null })), []);
});

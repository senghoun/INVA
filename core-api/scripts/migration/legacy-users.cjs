const PHONE_PATTERN = /^\+[1-9]\d{7,14}$/;

function legacyPhone(prefix, phone) {
  let value = String(phone ?? '').trim().replace(/[\s().-]/g, '');
  const country = String(prefix ?? '').trim();
  if (!value) return null;
  if (!value.startsWith('+')) {
    if (!/^\+[1-9]\d{0,3}$/.test(country)) return null;
    // Cambodia legacy records use either local trunk 0, national digits, or 855... .
    if (country !== '+855') return null; // Unverified numbering rules require review.
    if (value.startsWith('855')) value = '+' + value;
    else value = country + value.replace(/^0/, '');
  }
  return PHONE_PATTERN.test(value) ? value : null;
}
function sourceDate(value) {
  if (!value) return null;
  const date = new Date(value.replace(' ', 'T') + 'Z');
  return Number.isNaN(date.getTime()) ? null : date;
}
function mapUser(row) {
  const phone = legacyPhone(row.prefix, row.phone);
  if (!Number.isSafeInteger(row.id) || row.id <= 0) return { reason: 'INVALID_ID' };
  if (!phone) return { reason: 'INVALID_OR_MISSING_PHONE' };
  if (![1, 2].includes(row.user_type_id)) return { reason: 'UNKNOWN_USER_TYPE' };
  if (row.gender !== null && ![0, 1, 2].includes(row.gender)) return { reason: 'UNKNOWN_GENDER' };
  if (![0, 1].includes(row.active)) return { reason: 'UNKNOWN_ACTIVE_STATUS' };
  const hash = row.password || '!legacy-password-missing';
  if (row.password && !/^\$2[aby]\$(0[4-9]|[12]\d|3[01])\$[./A-Za-z0-9]{53}$/.test(hash)) return { reason: 'UNSUPPORTED_PASSWORD_FORMAT' };
  const language = row.language === 'kh' ? 'km' : row.language;
  if (!['en', 'km', 'zh'].includes(language)) return { reason: 'UNKNOWN_LANGUAGE' };
  const createdAt = sourceDate(row.created_at), updatedAt = sourceDate(row.updated_at);
  if ((row.created_at && !createdAt) || (row.updated_at && !updatedAt)) return { reason: 'INVALID_DATE' };
  return { data: {
    email: null, phone, firstName: row.first_name || null, lastName: row.last_name || null,
    gender: row.gender === null ? null : ['MALE', 'FEMALE', 'OTHER'][row.gender],
    image: row.photo || null, language, passwordHash: hash,
    isActive: row.active === 1, userType: row.user_type_id === 1 ? 'INTERNAL' : 'EXTERNAL',
    legacyUserId: row.id,
    ...(createdAt ? { createdAt } : {}), ...(updatedAt ? { updatedAt } : {}),
    legacyMetadata: { source: 'invaesta_new_db.users', version: 1, userTypeId: row.user_type_id,
      prefix: row.prefix, phone: row.phone, language: row.language, referId: row.refer_id,
      code: row.code, app: row.app, system: row.system, website: row.website,
      oldId: row.old_id, allBranch: row.all_branch, passwordChangedAt: row.password_changed_at,
      isHidePhone: row.is_hide_phone, passwordMissing: !row.password,
      createdAt: row.created_at, updatedAt: row.updated_at },
  } };
}
function planImport(rows, existing) {
  const mapped = rows.map(row => ({ row, ...mapUser(row) }));
  const counts = new Map();
  for (const { data } of mapped) if (data) counts.set(data.phone, (counts.get(data.phone) || 0) + 1);
  const sourceIds = new Map(existing.filter(u => u.legacyUserId !== null).map(u => [u.legacyUserId, u]));
  const phones = new Map(existing.filter(u => u.phone).map(u => [u.phone, u]));
  const users = [], quarantine = [];
  let alreadyImported = 0;
  for (const item of mapped) {
    if (sourceIds.has(item.row.id)) { alreadyImported++; continue; }
    let reason = item.reason;
    if (item.data && counts.get(item.data.phone) > 1) reason = 'DUPLICATE_SOURCE_PHONE';
    if (item.data && phones.has(item.data.phone)) reason = 'TARGET_PHONE_CONFLICT';
    if (reason) quarantine.push({ sourceId: item.row.id, reason });
    else users.push(item.data);
  }
  return { users, quarantine, alreadyImported };
}
module.exports = { legacyPhone, mapUser, planImport };

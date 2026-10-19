// Read-only MySQL source; dry-run by default. No roles, sessions or messages imported.
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { PrismaClient } = require('@prisma/client-auth');
require('dotenv').config({ path: path.resolve(__dirname, '../.env'), quiet: true });
require('dotenv').config({ path: path.resolve(__dirname, '../.local/legacy-mysql.env'), quiet: true });
const { planImport } = require('./migration/legacy-users.cjs');

async function main() {
  const args = process.argv.slice(2);
  if (args.some(arg => arg !== '--apply')) throw new Error('Usage: npm run migrate:legacy-users -- [--apply]');
  const apply = args.includes('--apply');
  const database = process.env.LEGACY_MYSQL_DATABASE || 'invaesta_new_db';
  if (database !== 'invaesta_new_db') throw new Error('This mapping supports only invaesta_new_db.');
  if (!process.env.LEGACY_MYSQL_USER || process.env.LEGACY_MYSQL_PASSWORD === undefined) throw new Error('Configure .local/legacy-mysql.env (see migration documentation).');
  const fields = ['id','first_name','last_name','gender','prefix','phone','password','photo','language','active','user_type_id','created_at','updated_at','refer_id','code','app','system','website','old_id','all_branch','password_changed_at','is_hide_phone'];
  const query = `SET time_zone = '+00:00'; SELECT JSON_OBJECT(${fields.map(f => `'${f}', \`${f}\``).join(',')}) FROM users ORDER BY id`;
  const raw = execFileSync(process.env.LEGACY_MYSQL_BINARY || '/opt/homebrew/bin/mysql', [
    '--protocol=TCP', '-h', process.env.LEGACY_MYSQL_HOST || '127.0.0.1', '-P', process.env.LEGACY_MYSQL_PORT || '8889',
    '-u', process.env.LEGACY_MYSQL_USER, '--default-character-set=utf8mb4', '--batch', '--raw', '--skip-column-names', database, '-e', query,
  ], { env: { ...process.env, MYSQL_PWD: process.env.LEGACY_MYSQL_PASSWORD }, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
  const rows = raw.trim().split('\n').filter(Boolean).map(line => JSON.parse(line));
  const db = new PrismaClient();
  try {
    const existing = await db.user.findMany({ select: { id: true, phone: true, legacyUserId: true } });
    const plan = planImport(rows, existing);
    const report = { mode: apply ? 'apply' : 'dry-run', source: database, sourceCount: rows.length,
      importable: plan.users.length, alreadyImported: plan.alreadyImported, quarantined: plan.quarantine.length,
      withoutPassword: plan.users.filter(u => u.passwordHash === '!legacy-password-missing').length,
      quarantine: plan.quarantine, imported: 0 };
    if (apply) {
      // Atomic import. No updates/merges: existing identities and later changes are never overwritten.
      await db.$transaction(async tx => {
        for (let offset = 0; offset < plan.users.length; offset += 500) {
          const result = await tx.user.createMany({ data: plan.users.slice(offset, offset + 500) });
          report.imported += result.count;
        }
      }, { timeout: 120000, isolationLevel: 'Serializable' });
    }
    const dir = path.resolve(__dirname, '../.local');
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    fs.writeFileSync(path.join(dir, 'legacy-users-report.json'), JSON.stringify(report, null, 2) + '\n', { mode: 0o600 });
    const { quarantine, ...summary } = report;
    console.log(JSON.stringify(summary, null, 2));
    console.log('Quarantine contains source IDs and reasons only: .local/legacy-users-report.json');
  } finally { await db.$disconnect(); }
}
main().catch(() => { console.error('Migration failed; no credentials or source rows logged. Check source connection, target migrations and unique constraints.'); process.exitCode = 1; });

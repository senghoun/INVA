// PostgreSQL and Redis with project-owned data directories.
const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const { spawn, spawnSync } = require('node:child_process');
require('dotenv').config({ path: path.resolve(__dirname, '../.env'), quiet: true });
const local = path.resolve(__dirname, '../.local');
const data = path.join(local, 'postgres');
const socket = path.join(local, 'postgres-socket');
const pgBin = process.env.LOCAL_POSTGRES_BIN || '/opt/homebrew/bin';
const redis = process.env.LOCAL_REDIS_BINARY || '/Applications/MAMP/Library/bin/redis-server';
const port = Number(process.env.DATABASE_PORT || 5432);
const redisPort = Number(process.env.REDIS_PORT || 6379);
const user = process.env.POSTGRES_USER || 'inva';
const password = process.env.POSTGRES_PASSWORD;
function pg(binary, args, options = {}) {
  const result = spawnSync(path.join(pgBin, binary), args, { encoding: 'utf8', ...options });
  if (result.error || result.status !== 0) throw new Error(`${binary} failed; inspect .local logs. ${result.error?.message || result.stderr || ''}`);
  return result.stdout.trim();
}
function listening(target) {
  return new Promise(resolve => {
    const client = net.connect({ host: '127.0.0.1', port: target });
    client.setTimeout(500);
    const finish = value => { client.destroy(); resolve(value); };
    client.once('connect', () => finish(true));
    client.once('error', () => finish(false));
    client.once('timeout', () => finish(false));
  });
}
function identifier(value) {
  if (!/^[a-zA-Z0-9_]+$/.test(value || '')) throw new Error('Local database/user names must contain letters, numbers and underscores only.');
  return value;
}
function sql(input, host = socket) {
  return pg('psql', ['-X', '-v', 'ON_ERROR_STOP=1', '-h', host, '-p', String(port), '-U', user, '-d', 'postgres', '-At'], { input, env: { ...process.env, PGPASSWORD: password } });
}
async function start() {
  if (!password) throw new Error('POSTGRES_PASSWORD is required.');
  identifier(user);
  for (const value of [port, redisPort]) if (!Number.isInteger(value) || value < 1 || value > 65535) throw new Error('Invalid infrastructure port.');
  fs.mkdirSync(local, { recursive: true, mode: 0o700 });
  fs.mkdirSync(socket, { recursive: true, mode: 0o700 });
  if (!fs.existsSync(path.join(data, 'PG_VERSION'))) {
    if (await listening(port)) throw new Error(`Port ${port} is occupied; set DATABASE_PORT and all database URLs to a free port.`);
    const passwordFile = path.join(local, 'postgres-init-password');
    fs.writeFileSync(passwordFile, password, { mode: 0o600 });
    try { pg('initdb', ['-D', data, '-U', user, '--encoding=UTF8', '--locale=C', '--auth-local=trust', '--auth-host=scram-sha-256', `--pwfile=${passwordFile}`]); }
    finally { fs.unlinkSync(passwordFile); }
  }
  const status = spawnSync(path.join(pgBin, 'pg_ctl'), ['-D', data, 'status'], { encoding: 'utf8' });
  if (status.status !== 0) {
    if (await listening(port)) throw new Error(`Port ${port} belongs to another server; refusing to provision it.`);
    pg('pg_ctl', ['-D', data, '-l', path.join(local, 'postgres.log'), '-o', `-h 127.0.0.1 -p ${port} -k '${socket.replace(/'/g, "'\\''")}'`, '-w', 'start']);
  }
  if (fs.realpathSync(sql('SHOW data_directory;')) !== fs.realpathSync(data)) throw new Error('Refusing to provision a PostgreSQL server outside the project.');
  sql('SELECT 1;', '127.0.0.1'); // Verify TCP credentials; never reset existing passwords.
  const databases = ['AUTH', 'HR', 'AC', 'CRM', 'IT', 'PV'].map(domain => identifier(process.env[`POSTGRES_${domain}_DB`] || `inva_${domain.toLowerCase()}_db`));
  const existing = new Set(sql('SELECT datname FROM pg_database;').split('\n'));
  for (const database of databases) if (!existing.has(database)) sql(`CREATE DATABASE "${database}" OWNER "${user}";`);
  console.log(`Project PostgreSQL ready on 127.0.0.1:${port}; domain databases provisioned.`);
  if (!(await listening(redisPort))) {
    fs.mkdirSync(path.join(local, 'redis'), { recursive: true });
    const args = ['--bind', '127.0.0.1', '--port', String(redisPort), '--dir', path.join(local, 'redis'), '--appendonly', 'yes', '--daemonize', 'no', '--pidfile', path.join(local, 'redis.pid')];
    if (process.env.REDIS_PASSWORD) args.push('--requirepass', process.env.REDIS_PASSWORD);
    const fd = fs.openSync(path.join(local, 'redis.log'), 'a', 0o600);
    const child = spawn(redis, args, { detached: true, stdio: ['ignore', fd, fd] });
    child.on('error', error => { console.error(error.message); process.exitCode = 1; });
    child.unref(); fs.closeSync(fd);
    for (let i = 0; i < 60 && !(await listening(redisPort)); i++) await new Promise(resolve => setTimeout(resolve, 500));
    if (!(await listening(redisPort))) throw new Error('Redis did not start; inspect .local/redis.log.');
  }
  console.log(`Redis ready on 127.0.0.1:${redisPort}.`);
}
async function main() {
  const command = process.argv[2] || 'start';
  if (command === 'start') return start();
  if (command === 'status') {
    console.log(`PostgreSQL (${port}): ${await listening(port) ? 'listening' : 'stopped'}`);
    console.log(`Redis (${redisPort}): ${await listening(redisPort) ? 'listening' : 'stopped'}`);
    return;
  }
  throw new Error('Use start or status.');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });

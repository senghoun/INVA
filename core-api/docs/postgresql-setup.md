# PostgreSQL setup

Core API uses PostgreSQL 17 for Auth, HR, Accounting, CRM and IT. PV is a reserved database with no Prisma schema. Redis remains the queue/cache backend.

## Local development

The local `.env` uses PostgreSQL URLs on port 5432. Existing JWT, MFA and Telegram encryption keys are preserved. The MySQL environment is saved privately in `.local/backups/mysql-cutover-2026-10-14/.env.mysql.backup`; the MySQL data directory remains intact.

```sh
npm run infra:start
npm run prisma:generate
npm run prisma:deploy:all
npm run dev:all
```

Or use `npm run dev:local` after installing dependencies. `infra:start` starts a project-owned cluster under `.local/postgres` and provisions six domain databases. It refuses to provision another server or reset existing passwords. PostgreSQL listens on loopback; its private Unix socket is under `.local/postgres-socket`. Local credentials have administrative privileges for migrations and are intended for development.

`LOCAL_POSTGRES_BIN` selects the directory containing `initdb`, `pg_ctl` and `psql` (default `/opt/homebrew/bin`). `LOCAL_REDIS_BINARY` selects Redis (default MAMP's bundled binary). If port 5432 is occupied, update `DATABASE_PORT` and all `DATABASE_*_URL` values together. `POSTGRES_USER`, `POSTGRES_PASSWORD` and URL credentials must agree. URL credentials require percent encoding for reserved characters.

## Docker

```sh
docker compose up -d postgres redis
npm run prisma:deploy:all
```

Compose uses a separate `postgres17_data` volume and configurable `POSTGRES_*_DB` database names. Initialization runs once on an empty volume; changing credentials or database names later does not modify existing databases. Run either Docker or the project-local servers on their configured ports. Docker configuration has been prepared but was not run during this cutover.

## Migrations and application behavior

The original PostgreSQL history is restored under each active `prisma/<domain>/migrations` directory. New forward migrations preserve the current JSON list contracts using JSONB and align remaining column types and foreign-key actions with Prisma. UUID IDs are native PostgreSQL UUID columns. Row-lock predicates cast bound IDs to UUID; search filters explicitly request case-insensitive matching. Phone checks, nonnegative MFA attempt checks and immutable HR leave audit triggers remain active.

JSON lists remain compatible with the existing application; no API changes are required. Attendance retains its local-calendar date encoded at UTC midnight, and explicit transactions retain READ COMMITTED isolation.

## Data preserved during the 2026-10-14 switch

All 18 existing Auth records and 6 HR records were copied from local MySQL into PostgreSQL and compared field by field using canonical row hashes. Accounting, CRM and IT were empty. The administrator password hash, roles, policy, sessions, audit records and HR/Telegram settings were retained. Private source snapshots are retained under `.local/backups/mysql-cutover-2026-10-14`. The one-time copy tooling and obsolete MySQL migration files were removed after verification. Preserve the original encryption keys alongside database backups.

The previous PostgreSQL environment backup is retained in the same private backup folder. This switch imported the current MySQL records; it did not restore data from an older PostgreSQL deployment.

## Verification

```sh
npm run typecheck
npm run build:all
npm run lint
```

Test suites, their commands and their dependencies were removed during project cleanup at the owner's request. Verification now uses type checks, lint, builds and live service checks.

Before cleanup, verified locally: 228 unit tests and 40 PostgreSQL integration tests passed, TypeScript checks and all six service builds passed, and all five database schemas match their Prisma models. All five downstream services reported UP; the preserved administrator login and profile both returned HTTP 200 through the gateway.

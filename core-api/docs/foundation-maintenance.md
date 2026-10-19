# Local foundation maintenance (01.1a)

The existing Nest monorepo, React portal, Prisma schemas, credentials and API contracts are retained. No new infrastructure/dependencies or database migrations are required for this increment.

## Startup configuration

Each `AppModule` registers `validateEnvironment(applicationName)` with Nest ConfigModule. Validation runs before the application initializes connections/listeners. It preserves `.env`/runtime precedence, validates only relevant service settings and reports field names without supplied values.

- All services require non-empty `JWT_SECRET`; production requires at least 32 characters. Length validation is not proof of cryptographic entropy. Use independently generated random secrets through the deployment secret manager.
- Auth additionally requires a different `JWT_REFRESH_SECRET`, also at least 32 characters in production.
- Each domain service requires its own PostgreSQL URL with host/database. An unrelated service database is not required. PostgreSQL query options remain supported.
- Service ports are normalized to numbers in 1–65535. Existing 3000–3005 defaults remain; gateway `PORT` fallback remains.
- Explicit upstream URLs must be HTTP(S) origins without credentials/path/query/fragment. A trailing slash is normalized away; absent values preserve existing localhost defaults.
- Auth throttle TTL/limit and CRM/AC Redis port are normalized positive integers. Blank/malformed settings fail startup instead of silently falling back.
- `NODE_ENV` supports development/test/production; default is development. Deployment configuration must explicitly set production.

Do not paste secrets into chat/logs or replace existing secrets as part of routine validation. Existing local `.env` was checked without printing values or connecting to databases. The examples file remains a local-development template, not approved production configuration.

## Health semantics

| Endpoint | Purpose | Limits |
|---|---|---|
| Gateway `/health/live` | Responding process; no remote probes | Use for process liveness, not tenant/business/database correctness. |
| Domain `/api/v1/health/live` | Same process-only check; available when Swagger is disabled | Public response contains only status; excluded from Auth throttling. |
| Existing gateway `/health` and `/api/v1/health` | Same aggregate JSON shape and 5-second cache; bounded downstream liveness probes | Top-level OK historically means gateway responds; inspect each downstream status. |
| Gateway `/health/availability` | 200 AVAILABLE when all downstream processes respond; 503 UNAVAILABLE otherwise | Respects manual disconnects even with cached probes. Database/queue readiness is not certified. |

Probes have a 1500ms abort deadline; rejected probes leave no manual timer behind. A reconnect can take up to the existing 5-second cache period to reflect underlying reachability. Health routes bypass gateway policy/toggle routing interception and telemetry. Actual dependency-aware readiness remains future scope; do not configure this availability route as a substitute for verified business readiness.

## Logs and local checks

Fastify request logs omit query strings and headers; errors use a generic message/type. Redaction also covers the separate top-level error log message. The Nest HTTP interceptor emits method/path/status/duration/correlation ID for success and failure without request bodies or exception details. Existing domain-specific logs, audit, Prisma logging, gateway telemetry and startup fatal logging have separate review needs; this change is not a claim that every logging channel is fully redacted. Production Fastify logging retains its previous disabled setting.

In `core-api/`: `npm run typecheck`, `npm run lint`, `npm run build:all`. Lint no longer edits files; `npm run lint:fix` is explicit. The flat ESLint configuration begins with correctness checks without imposing a broad legacy formatting rewrite.

The TypeScript build emits an application beneath `dist/apps/<service>/apps/<service>/src/main.js`, including its referenced shared code. `start:prod:*` now uses this actual path. The six artifacts were checked for loading and invalid-config rejection in a separate working directory with empty synthetic credentials, before any database or network initialization.

In `super-app/`: `npm run typecheck`, `npm run build`. The current build reports a bundle over 500kB; approved route-based splitting can address this separately.

## Employee failure behavior

The existing hook API and employee mutations remain. Failed directory requests clear records; failed counts clear totals; successful partial results remain usable with a visible error/retry alert. Request sequencing prevents an older success, denial or completion from replacing current results/loading state; cleanup prevents late updates after unmount. Failures show unavailable metrics rather than false zero directory counts. The new reusable `ErrorState` uses an alert and the existing Button; backend authorization remains authoritative.

## Rollback and remaining work

Restore only this increment's source files from the team's durable source archive/version control and rebuild. No schema/data rollback or secret rotation is needed. Keep the existing credential engine until its decision is settled. Scoped membership, cookie/CSRF sessions, MFA, query/form adoption and actual PostgreSQL/browser migration evidence remain tracked in `migration/PROGRESS.md`. A passing type/unit/build check is not a production security release.

Implementation references: [Nest custom config validation](https://docs.nestjs.com/techniques/configuration), [Nest health checks](https://docs.nestjs.com/recipes/terminus), [OWASP logging guidance](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html) checked 2026-10-01. Existing installed Nest APIs and actual builds/tests were used; no major-version migration was performed.

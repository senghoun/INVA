> Historical implementation evidence. Test suites, test commands and temporary verification scripts referenced here were removed during the 2026-10-14 project cleanup. Current checks are documented in [PostgreSQL setup](../../postgresql-setup.md).

# Acceptance — Phase 00 audit

Status: READY FOR REVIEW WITH ACCESS GAPS. Date: 2026-10-01. Environment: local source inspection. Human decision: PENDING. Repository revision: unavailable (no Git repository found).

Scope: inspect local `core-api/` and `super-app/`, repair instruction pack consistency, document observed behavior/risks/proposed slices. Application source and databases remain unchanged. Identity and topology proposals are not approvals.

Changed documentation: five prompt-pack files (README, START_HERE, CHANGELOG, regenerated FULL_PROMPT_PACK, manifest) plus documents in `docs/migration/`. No API/event/schema contract changed. Pre-repair pack artifacts preserved at `/private/tmp/inva-prompt-pack-before-audit-20261001`.

| Check | Actual command/method | Result / evidence |
|---|---|---|
| Backend tests | core-api: `npm test -- --runInBand` | PASS: 2 suites / 60 tests / 5.251s, injected repository/Prisma mocks. |
| Portal service tests | super-app: `npm test` | PASS: 26 tests, fake fetch/storage VM harness; no browser rendering. |
| Backend type check | `./node_modules/.bin/tsc --noEmit --incremental false` | PASS: exit 0. |
| Portal type check | same command in super-app | PASS: exit 0. |
| Pack consistency | Compare embedded source sections, manifest byte/hash/count, canonical/standalone master | PASS: all 28 Markdown files match manifest bytes/SHA-256; all 25 embedded sections match source; canonical/standalone masters identical; migration document links resolve. |
| Build/lint/independent artifact | Not executed | NOT RUN; no readiness conclusion. |
| Real PostgreSQL/security/isolation | Not executed | NOT RUN; no isolated fixture established. |
| Browser/provider/queue/contract/migration/restore/load | Not executed | NOT RUN; dependent scope/evidence not supplied. |

Review limits: original legacy source/data, deployed ingress, client compatibility, hosting/ownership/pool budgets are unresolved. Missing domains are access gaps, not invented completed features. A01–A13 in `00-audit.md` require approved implementation and regression evidence.

Next boundary: review the three ADRs and the exact 01.1 proposal in `slice-backlog.md`. This audit is not final Phase 00 sign-off for unknown legacy features and is not permission to deploy.

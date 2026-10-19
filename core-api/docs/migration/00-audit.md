> Historical implementation evidence. Test suites, test commands and temporary verification scripts referenced here were removed during the 2026-10-14 project cleanup. Current checks are documented in [PostgreSQL setup](../postgresql-setup.md).

# Phase 00 — Current project audit

Date: 2026-10-01 (Asia/Phnom_Penh). Status: READY FOR REVIEW WITH ACCESS GAPS. Scope: local `core-api/` and `super-app/`. This is a source audit, not production certification. No Git repository was found at the workspace root or either application; there is no revision/rollback history to cite. No application source, dependencies, databases, or live routes were changed.

## Instruction pack review

The canonical Version 3 master was already present, but README/startup references and the combined edition still selected Version 2. The manifest also described Version 2 and stale content. Repaired README/startup instructions, regenerated the reading edition from named sources, and recalculated manifest counts/hashes. Inherited Version 2 phase headings are intentional per `VERSION_3_NOTES.md`. Original changed pack files are preserved at `/private/tmp/inva-prompt-pack-before-audit-20261001` (temporary local review copy, not a durable backup).

## Observed applications and infrastructure

| Area | Source evidence | Observation |
|---|---|---|
| Backend | `core-api/nest-cli.json`, `package.json` | Nest monorepo: gateway, Auth, HR, CRM, AC, IT; shared technical and event libraries. |
| Database | `core-api/prisma/{auth,hr,ac,crm,it}/schema.prisma` | Five PostgreSQL Prisma schemas/clients. Cross-domain identifiers have no cross-database FK. |
| Local hosting | `core-api/docker-compose.yml`, `docker/postgres/init.sh` | PostgreSQL 16 and Redis 7; init reserves a sixth PV database but no PV application was found. Runtime DB roles, deployment capacity, and pool budget are unverified. |
| Portal | `super-app/src/App.tsx`, `components/layout/`, `components/common/` | React portal with hash-based navigation, shared sidebar/navbar and controls. Reuse before adding a new shell. |
| Auth | `apps/auth-service/src/{controllers,services,repositories,strategies}/`, `prisma/auth/` | Local bcrypt credentials, global roles, rotating hashed refresh-token records, policy/audit, temporary-password lifecycle. |
| HR | `apps/hr-service/src/`, `prisma/hr/` | Employee/account links, company/branch hierarchy, schedules, attendance, leave, employee HR permissions. |
| Finance/CRM | `apps/{ac-service,crm-service}/src/`, `libs/contracts/src/events/deal-billing.event.ts` | Deals enqueue billing jobs; AC creates/approves invoices and double-entry records. Redis/Bull is already in use. |
| IT | `apps/it-service/src/controllers/it.controller.ts`, `prisma/it/` | Health endpoint and placeholder asset model; no complete IT workflow established. |
| Docs/operations | `docs/api-docs-portal.md`, `apps/api-gateway/src/docs/`, `telemetry/` | Existing gateway docs/telemetry/toggles. These are existing features to preserve. |

Paths in the table are relative to `core-api/` unless prefixed with an application directory.

## Verified baseline

| Check | Result | Limits |
|---|---|---|
| `cd core-api && npm test -- --runInBand` | PASS: 2 suites, 60 tests | Auth uses injected repository/Prisma mocks; Fastify injection is not a running deployment. HR guard tests do not prove PostgreSQL isolation. |
| `cd super-app && npm test` | PASS: 26 tests | VM-transpiled service tests with fake fetch/storage; no rendered browser workflow. |
| In each app: `./node_modules/.bin/tsc --noEmit --incremental false` | PASS | Type checking only; no production build or independent artifact verification. |
| PostgreSQL, queue, browser, upgrade/restore, load tests | NOT RUN | No isolated database/provider fixture authorized or established. |
| Lint | NOT RUN | Existing backend script has `--fix`; non-mutating lint configuration still needs review. |

Lockfiles report Nest 11.2.6, Fastify 5.12.5, Prisma/client 5.22.0, React 18.3.1, Vite 8.3.1, TypeScript 5.9.3. Host Node is 23.9.0. These are observations, not approved production versions. Current official docs were checked for Nest migration, Vite runtime, Keycloak, and PostgreSQL numeric behavior; see ADR-001. No upgrades were performed.

## Prioritized source findings

| ID | Severity / observation | Evidence and consequence | Proposed correction / verification |
|---|---|---|---|
| A01 | High: missing company-scoped grants | Auth `UserRole` has user/role only; shared `JwtPayload` has no tenant/company/branch grants; HR guard permits ADMIN/HR_ADMIN globally and permissioned lists without company enforcement. | Explicit membership/scope model and two-company detail/list/count/mutation tests; do not assume UI filters isolate data. |
| A02 | High: long-lived browser tokens in localStorage | `super-app/src/services/api.ts` stores access and refresh tokens. | Approved browser session transport, cookie/CSRF/CORS contract and compatibility plan. |
| A03 | High: advertised MFA APIs lack implemented flow | Frontend `auth.service.ts` calls MFA setup/verify/confirm; backend `auth.service.ts` rejects users with `mfaEnabled`. No equivalent MFA controller routes found. | Choose identity engine; keep fail-closed behavior; do not present UI as a completed MFA flow. |
| A04 | High: duplicate billing on replay | Billing consumer calls create unconditionally; invoice `dealId` is indexed, not unique; numbering uses changing `invoice.count()+1`. Sequential repeat delivery can obtain a new number and create a second invoice. Consumer comment claiming idempotence is incorrect. | Business-operation deduplication, safe numbering, real PostgreSQL concurrent/replay tests. Business reviewer must define whether multiple invoices per deal are legitimate. |
| A05 | High: approval race | `AcService.approveInvoice` checks DRAFT before repository transaction; repository unconditionally updates status and inserts ledger rows. Concurrent approvals can both pass the initial check. | Conditional transition/locking and transaction-scoped invariant; race must produce one ledger pair. |
| A06 | High: non-durable publication | CRM updates WON before queue enqueue; AC commits approval before enqueue. Both catch queue failure and return success; no outbox model found. | Owner transaction with outbox, recoverable dispatch, deduplicated consumption; preserve visible pending state. |
| A07 | High: leave balance and review disagree | Leave service catches every deduction error then approves; repository deducts outside review transaction, clamps negative remaining balance, and upsert resets remaining to total without subtracting used days. | Approve/deduct atomically; agree missing entitlement, insufficient balance, cancellation, cross-year and retry rules with HR. |
| A08 | Medium: portal invoice integration omits identity | CRM fetches protected AC invoice route with no authorization/service credential and no deadline. | Narrow authorized service contract and timeout. Runtime result NOT RUN; source predicts protected request rejection. |
| A09 | Medium: salary uses float | HR `EmployeeProfile.baseSalary` is Float; AC uses Decimal. | Approved decimal/rounding/backfill plan before payroll. Preserve source values for reconciliation. |
| A10 | Medium: attendance depends on host time | Attendance uses `new Date()` and local `setHours`; business timezone contract is absent from inspected service. | Explicit business-day/timezone rules; tests around Phnom Penh midnight and schedule grace boundaries. |
| A11 | Medium: incomplete V3 frontend foundation | Manifest lacks TanStack Query/React Hook Form; HR hooks hold/refetch server data in useState/useEffect; no approved centralized company cache boundary established. | Adopt required foundations one screen at a time using existing controls. |
| A12 | Medium: runtime/deployment verification incomplete | Direct service CORS uses `origin: true`; services bind all interfaces; no explicit aggregate DB pool budget established. | Review ingress/direct access, production origins, service identity, pools and readiness before release. |
| A13 | Medium: owner ID meaning conflicts | CRM Deal schema says ownerId is HR employee UUID; createDeal assigns `actor.sub` (Auth user UUID). | Inspect existing records; approve intended identity, map explicitly, quarantine unmatched records. |

Severity ranks review priority; concurrency and outage findings are source-derived risks, not executed reproductions. Passing existing tests does not dismiss these gaps.

## Access gaps and unresolved business requirements

Only the two local applications were treated as in scope. No original legacy repository, sanitized data extract, live database introspection, deployed ingress, mobile contract, runtime grants, operational ownership, traffic/pool measurements, restore evidence, or approved identity decision was supplied. No complete Payments, Property, Valuation, Sales/contracts, payroll, statutory formulas, or business reporting implementation was identified in these applications. Their legacy parity remains UNKNOWN, not confirmed absent from the wider business. Khmer/English employee name fields exist; full UI localization is unverified. Uploads, exports, print templates, scheduled jobs and offline/mobile rules require the original source/data scope; do not fabricate behavior.

## Proposed next step

Review [decisions/ADR-001-foundation.md](decisions/ADR-001-foundation.md), [decisions/ADR-002-identity.md](decisions/ADR-002-identity.md), and [decisions/ADR-003-organization-scope.md](decisions/ADR-003-organization-scope.md). Exact Phase 01.1 proposal is in [slice-backlog.md](slice-backlog.md). No decisions are labelled approved.

# Implementation backlog — one outcome at a time

The latest user request authorizes all v3 prompt-pack local implementation. The platform is new; legacy import/reconciliation is not needed. Per-slice approval pauses below are historical and do not block this authorization. Full release evidence remains required.

The user previously authorized continued local best-practice improvements. Subslice 01.1a (startup checks, process health, HTTP logging, build/check commands, employee failure handling) is implemented for review. The identity/schema plan and subsequent entries remain PROPOSED. Preserve Auth -> Shared Core -> HR -> Finance. Existing source is reused; a slice is not a new service.

## Current implementation evidence — 2026-10-02

Auth security and company/employee-directory scope increments are implemented and tested, as recorded in `acceptance/01-auth-security-increment.md` and `acceptance/01-company-access-employee-scope.md`. Company switching and grants are connected to real APIs; employee requests enforce scope in guards and SQL. These are partial deliveries of 01.2/01.3/01.4 and the required employee foundation, not completion of their full phases. Prior proposed approval pauses below are historical; continue under the full-pack request.

The leave integrity increment is also implemented and tested in `acceptance/03-leave-integrity-increment.md`: company-scoped employee leave routes, serialized review/refund/overlap/entitlement updates, transactional immutable events and portal error/refresh behavior. This is a conservative calendar-based increment, not acceptance of all scheduling/statutory policies or the entire 03.leave slice.

Attendance scope and retry integrity are implemented and tested in `acceptance/03-attendance-scope-increment.md`: company/branch enforcement, own-clock versus delegated management, first-punch/checkout evidence preservation, final late-review integrity and portal status/error fixes. Timezone/overnight/offline/correction/audit requirements remain open; this does not complete 03.attendance.

Next: close employment-reference/transfer invariants and lifecycle preservation, propagate scope to related HR access/attendance/payroll flows; complete company-specific leave policies and balance/cancellation UI, extend transactional business audit beyond leave and add offboarding confirmation, then deliver the remaining Core prerequisites and approved decimal payroll. Keep live statutory/payment execution disabled pending concrete inputs. Location official dataset imports must use supplied/authoritative records, not fabricated codes.

## Phase 01.1 foundation — maintenance subset implemented

Prerequisites: accept ADR-001 topology/tooling scope, choose the credential authority in ADR-002, and approve ADR-003 stable organization identity/access layout. Use an isolated two-company fixture for integration tests. Identity/schema changes wait for these decisions; the independent local maintenance subset 01.1a proceeds under the user’s subsequent authorization.

Outcome: the existing portal starts through the existing gateway, the approved identity path can be exercised locally, and required config/health failures are clear; existing employee/admin navigation and contracts remain usable. This foundation is not a full Auth security release.

Planned files/boundaries:

1. Reuse `core-api/apps/auth-service/src/` for the approved identity integration and Access foundation. Add reviewed startup validation in app/config code; preserve existing Auth endpoints or document an approved compatibility adapter. Never scaffold a competing `apps/core` just to match the sample tree.
2. Reuse `apps/api-gateway/src/main.ts` and proxy/security configuration. Add separate liveness/readiness outcomes, explicit local origins and config diagnostics only where needed; keep docs registry routes.
3. Expand `prisma/auth/schema.prisma` and its migrations for the approved memberships/grants; refer to current HR-owned Company/Branch UUIDs through a reviewed contract. Do not move/delete HR company records. Validate branch/company consistency and untrusted context. Exact schema depends on ADR-003.
4. Add a protected verification-delivery interface only when chosen engine needs it. Provider-owned delivery stays with provider; local adapter uses isolated development sink. No real invitations or OTP return/logging.
5. Reuse portal `App.tsx`, `main.tsx`, layout/common components and services/api foundation. Introduce the required query provider and minimum shared PageContainer/PageHeader/loading/error primitives. Establish typed approved company context and scoped query-key convention. Full company switching/grant UX remains 01.2; no cosmetic selector without backend authority.
6. `core-api/package.json`, `super-app/package.json` and lockfiles: only approved necessary foundations/tooling; runtime pin/support check under ADR-001. Add non-mutating check commands and meaningful tests. No broad upgrades or module relocations.

Checks: existing 86 tests/type checks; build artifacts; invalid-config startup; local health; actual identity integration smoke test; two-company membership/branch rejection at API; browser navigation/loading/error flow; fresh PostgreSQL and expand-only upgrade fixture; no secrets in logs. Tests missing fixture/provider evidence stay NOT RUN. Review sessions and cookie/CSRF plan before changing token transport (01.4), and preserve current fail-closed MFA behavior until 01.3.

Stop: report changed files, migrations/contracts, actual evidence and limitations in `acceptance/01.1.md`; do not start 01.2 or deploy.

## Subsequent proposed slices

| ID | User outcome | Prerequisite / owner / data scope | UI/API and acceptance / stopping point |
|---|---|---|---|
| 01.2 | Company-scoped accounts, invitations, role grants | 01.1 + scope ADR; Auth/Access, preserved org IDs | Account/company UX and API; two-company lists/details/counts/mutations, unauthorized grant denial; stop before MFA. |
| 01.3 | Working verification/MFA/recovery | Approved identity/delivery; identity engine | Real/provider screens; bypass, replay, origin/RP, replacement tests; no production assurance claim before passing. |
| 01.4 | Safe sessions/revocation/step-up | Approved transport/service identity; Auth + consumers | Cookie/CSRF if approved, devices/revoke UI, narrow service grants; refresh races/revocation/outage tests. |
| 01.5 | Reviewed identity migration | Legacy fixtures/mappings | No duplicate/extra grants; PostgreSQL + browser acceptance and reconciliation. |
| 02.minimum | Organization/location/audit minimum usable by HR | Auth scope; logical platform owners | Preserve Company/Branch IDs; valid location/org selectors, scoped reads/writes and audit; optional admin deferred only by review. |
| 03.employees | Scoped employee CRUD preserving workflow | 02.minimum; HR | Reuse employee forms/table; real DB/UI parity, sensitive-field scope, stable account links. |
| 03.attendance | Correct business-day clocks/reasons | Confirm schedule/offline/timezone policy; HR | Today/clock/review UI; midnight/grace/concurrency tests. |
| 03.leave | Atomic approval and correct entitlement | HR agrees insufficiency/cancellation/cross-year policy | Existing leave UI/API; double review/retry/rollback/used-balance tests with PostgreSQL. |
| 03.payroll | Versioned approved decimal payroll, posting pending | Approved formulas and salary conversion; HR | Payroll UI/API, frozen calculation/evidence, rounding and reconciliation; Finance not falsely marked complete. |
| 04.billing | One invoice and balanced posting under retries | Billing-party bridge; Finance owns invoice/ledger | Numbering + conditional approval + outbox/inbox; queue outage, duplicate, concurrent approval tests; existing numbers preserved. |
| 05–12 | Remaining pack outcomes | Original source/scope/contracts per phase | Define each numbered slice from evidence before implementation; no empty apps. |

A04–A07 are high-priority corrections in their domain phases. A separately approved smaller maintenance slice may address them earlier; record that decision and its compatibility tests.

## Implemented maintenance boundary: 01.1a

See [acceptance/01.1a-foundation.md](acceptance/01.1a-foundation.md). Remaining items above still require their own evidence; neither this maintenance increment nor its unit tests complete the identity/scope migration.

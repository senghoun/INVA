# Migration progress

Updated: 2026-10-02 (Asia/Phnom_Penh).

Current request: implement all prompts in `business_platform_prompt_pack_v3_complete`, then continue after interruption. The platform is new; no legacy import is needed. The request authorizes continued local implementation across slices. Production deployment/live provider side effects remain outside that authorization.

Current work: Auth/company access, employee-directory scope, leave integrity and attendance scope, IN PROGRESS. Retain existing services and Organization UUIDs. See [Auth security increment](acceptance/01-auth-security-increment.md), [company/employee scope evidence](acceptance/01-company-access-employee-scope.md), [leave integrity evidence](acceptance/03-leave-integrity-increment.md) and [attendance evidence](acceptance/03-attendance-scope-increment.md).

Implemented and verified: cookie browser sessions, Argon2id/bcrypt upgrade, TOTP/recovery codes and controlled authenticator removal, session API/UI, query/form foundations, lazy workspaces; Auth memberships/branch grants, validated company switching and grant administration; employee list/count/search/detail/CRUD scope and private/financial field protection; scoped leave APIs, atomic approval/refund/entitlement/overlap checks, append-only transactional leave events and portal error/refresh fixes; scoped attendance APIs, first-punch preservation, atomic checkout, separate checkout notes and unavailable-status handling.

Current evidence: 109 backend and 43 frontend tests pass; 11 isolated Auth and 28 isolated HR PostgreSQL tests pass; two Chrome journeys pass through isolated gateway/Auth/HR/portal, including persistent leave approval, attendance retry/evidence checks and company isolation. Backend lint/typecheck, all six builds and portal build pass. Local development Auth and HR migration repairs are recorded below; the leave-event and checkout-note migrations now also exist in the local HR database. This is not full Phase 01/02/03 or platform isolation acceptance: other HR/domain APIs, invitations/passkeys/step-up, shared capabilities, employment/offboarding, downstream phases and release/restore checks remain open.

Business inputs: statutory payroll/tax/NSSF rules and payment provider have not been specified. Continue configurable/sandbox implementation; production calculations and live payments cannot use invented values. Production MFA key and browser origins require environment configuration; the local development MFA key is now configured.

## Local login repair — 2026-10-02

The user's portal at `http://192.168.255.107:5174` was blocked by both the browser-origin configuration and the saved security policy's old LAN address. Added the exact origin to local `.env` and the exact hostname to the development policy, preserving all existing entries and domain enforcement. The policy change was recorded through the existing audited update service. Auth's development watcher reloaded the configuration.

A subsequent login exposed missing user columns in local `inva_auth_db` at localhost:5432. A private PostgreSQL 18 backup was saved to `/private/tmp/inva-auth-before-login-fix-20261002-pg18.dump`. Existing security/audit table columns and indexes were inspected before baselining `20260928060000_auth_security_policy_audit`; the four remaining additive Auth migrations were deployed successfully. This supersedes earlier statements that Auth migrations had only reached the isolated test database: the local development Auth database is now migrated. Production and the local HR database were not changed by this repair.

Verified administrator login through the running Vite -> gateway -> Auth path returned 200, authenticated `/auth/me` returned 200, and the verification session was immediately logged out. Credentials/tokens were not printed and the account password was not reset. No production deployment or full security acceptance is implied.

## Company-context usability repair — 2026-10-02

The employee-directory permission message was caused by an unselected company. The local administrator already had an active assignment with employee access to INVA Real Estate HQ; no account permissions were added or bypassed during this repair. Verified Auth company-context validation, employee list and counts through the actual LAN portal/gateway returned HTTP 200 (one employee).

The portal now automatically selects a sole existing assignment only after Auth validates it. Multiple assignments still require a user choice. A failed selection is not retried in a loop; an explicit user clear is preserved; selection attempts reset on account changes. Duplicate list/count error messages are deduplicated. Frontend tests/build and browser company-isolation checks pass, including a staff account whose sole assignment opens the directory automatically and whose explicit clearing removes its records.

## Local attendance repair — 2026-10-02

The administrator has no linked employee, so personal attendance previously returned `Employee not found.` while missing HR schema changes caused server errors. Personal attendance now resolves only the authenticated account's linked employee within the verified company/branch scope. An unlinked or out-of-scope account receives `NO_EMPLOYEE_PROFILE` with no record; the portal explains how to enable personal clock-in and continues displaying authorized team records. It does not infer an employee from an Auth UUID or assign an arbitrary employee.

Backed up local development `inva_hr_db` privately to `/private/tmp/inva-hr-before-attendance-fix-20261002.dump` (0600). Compared existing columns, indexes and foreign/unique/check constraints with the migrated isolated database, confirming the complete-HR-schema migration was already present. Baselined only `20260929093000_complete_hr_schema`, then deployed the missing employee-role, leave-event and checkout-note migrations. No database reset or reseeding occurred. This supersedes earlier isolated-only HR migration statements; production was not changed.

Verified administrator login, personal attendance status, attendance records, late requests and employee list through the running LAN portal/gateway: all returned HTTP 200. Personal status correctly returned `NO_EMPLOYEE_PROFILE`. The verification session was logged out. The isolated HR regression suite passes 27 tests, including unlinked, same-UUID, foreign-company and linked in-scope account cases; backend unit tests, typecheck/lint, HR build and portal tests/build pass. Both Chrome journeys pass, including the unlinked-profile message, absent personal clock-in button and continued team attendance visibility.

Follow-up verification: the user's open Brave portal at `http://localhost:5174/#hr/attendance` visibly displayed the unlinked-profile explanation and existing team attendance log without the reported errors. Rechecked live attendance status/records/late requests, leave types/requests and account access: HTTP 200. Corrected the HR summary card to display `No employee profile` for this state instead of `Not Checked In`.

## Local MFA configuration repair — 2026-10-02

Confirmed the development MFA key was absent and there were no stored MFA credentials or enabled accounts. Generated a random 32-byte encryption key directly into local `.env`, restricted that file to 0600, and added environment-file exclusions in `.gitignore`. The key was not printed or committed. Documented key preservation across restarts and database restores in `.env.example`.

Auth's development watcher reloaded. MFA enrollment through the running LAN portal returned HTTP 201 for a temporary verification account; its stored ciphertext decrypted correctly using the saved key. Removed the verification account and ended its session. No administrator account was enrolled, reset or modified. Keep this environment key with protected database recovery materials; production configuration remains separate.

## Expanded employee profile form — 2026-10-02

The shared add/edit modal now includes the selected company, permitted branch selection, company/branch-filtered departments, department-filtered positions/sectors, employment type, manager/leader, probation date, contact details, localized names and personal details. Private fields follow the membership's private-read permission; payroll editing requires payroll-manage permission and, for an existing employee, payroll-read permission. Existing working-schedule assignments are preserved; no schedule editor/list API is claimed by this increment.

Editing loads the complete scoped profile rather than relying on directory summaries. Unchanged optional values are omitted from updates; explicitly cleared optional values use null, and the backend clears nullable dates/relations. Clearing bank or salary fields still requires payroll permission. Creation forwards the supported optional fields through an explicit allowlist and does not link an Auth account. Changing company closes the editor; saving rechecks the company context.

Validation: 109 backend tests, 43 frontend tests, 28 isolated HR persistence tests and both isolated Chrome journeys pass. Browser checks confirm organization assignment preservation, localized name/phone/salary persistence, reopening the saved profile and clearing phone. Backend typecheck/lint, HR build and portal build pass. No schema migration was required and no existing development employee was modified by the automated tests. Full employment lifecycle, working schedule management and platform acceptance remain open.

## Compact employee profile tabs — 2026-10-02

Replaced the long employee form with a medium-width dialog bounded to the viewport, with Details, Employment, Contact, Personal and permission-controlled Payroll tabs. The tab panel scrolls independently; header, navigation and save/cancel actions remain visible. Fields stay mounted so switching tabs preserves edits. Keyboard arrows/Home/End navigate tabs, and submission reveals/focuses invalid fields even when their tab was hidden. The shared Modal accepts optional body styling so other dialogs retain their existing layout.

Follow-up UX refinement: replaced the fixed-height frame with a content-sized dialog capped to the viewport, evenly spaced segmented tabs, a compact employee/company context row, section headings and Back/Next navigation. The save/cancel footer stays outside the scrollable fields. Build and both isolated browser journeys pass, including invalid-field tab focus and saving changes across tabs.

## Reusable date picker — 2026-10-02

Added the shared `super-app/src/components/common/DatePicker.tsx`, exported through common components. It retains native date-entry validation and date-only `YYYY-MM-DD` values, with a styled calendar rendered in a portal to avoid dialog/tab clipping. Month/year selection uses the shared searchable `DatalistSelect` with compact sizing and the project theme. Supports keyboard arrows/Home/End/PageUp/PageDown, Escape dismissal, optional minimum/maximum dates, disabled/read-only states, Today and optional Clear actions. Calendar calculations use UTC date-only arithmetic; Today follows the browser's local date.

Applied to employee hire/probation/birth dates, leave start/end dates (end constrained by start), and exposed the existing invoice due-date value using this component. No additional dependency or backend schema change was required. Build and both isolated Chrome journeys pass; calendar checks cover leap-day selection, keyboard movement across a month boundary, Escape closing the calendar without closing the employee dialog, and persistence of the selected date.

## Shared dropdown exclusivity repair — 2026-10-02

`DatalistSelect` now closes on outside pointer actions, keyboard focus changes, disabling the control and opening another instance. Closing restores display text without emitting unnecessary empty-value callbacks for unrelated controls. Combobox/listbox/option semantics expose open and selected states. Calendar month/year searches retain focus until selection rather than moving focus into the day grid while typing. Browser regression coverage includes clicking between dropdowns, Tab navigation and closing lists when switching employee sections.

## Simplified company header — 2026-10-02

Company context remains required for scoped data access. A single validated assignment now displays a compact company badge instead of an unnecessary UUID dropdown. Multiple assignments use the shared searchable selector with organization names where the account may read them, and human-readable fallback labels otherwise. Added an optional selection callback to `DatalistSelect` so company changes occur only on confirmed selection, not while searching. Auth validation and cache/session refresh on switching are retained; membership permissions are unchanged.

Verified portal production build and both isolated Chrome journeys. Coverage checks named multi-company switching, a single-assignment badge without a dropdown, explicit context clearing and company isolation. The final revoked-membership assertion checks HR directly after the long gateway workflow to avoid exhausting the gateway flood budget; gateway protection is unchanged.

Earlier audit/maintenance evidence follows. Counts, dependency statements and authorization limits below describe that earlier increment, not the current repository.

---


Updated: 2026-10-01 (Asia/Phnom_Penh).
Instruction baseline: `docs/business_platform_prompt_pack_v3_complete/MASTER_PROMPT.md` (Version 3), with inherited phase/gate/release requirements. `docs/migration-prompts/` remains historical.

Historical maintenance: **01.1a — local foundation maintenance**, READY FOR REVIEW. The user authorized further best-practice improvements after the audit. This authorization covers the reversible local maintenance recorded here; it does not record selection of a new credential engine or approval of the complete 01.1 schema/identity plan.

Implemented:

- Shared startup validation wired to all six applications; own-service database requirements, normalized numeric settings/upstream origins, distinct Auth secrets, redacted diagnostics.
- Shared public liveness at `/health/live` (gateway) and `/api/v1/health/live` (domain services). Existing aggregate gateway health uses bounded liveness probes instead of production-disabled Swagger.
- Gateway `/health/availability` returns 503 when a downstream process is down/disconnected. This is process reachability, **not database/queue readiness**.
- Shared HTTP logging strips query strings/credential headers and redacts Fastify's extra error-message path; records failed-request status and correlation ID.
- Corrected six production start paths to actual emitted artifacts. Added non-mutating type checks and an ESLint 9 flat configuration; `lint:fix` is explicitly separate.
- Employee requests surface partial/complete failures, clear failed data, ignore stale responses and unmounted effects. Reusable error/retry UI distinguishes failure from empty results and avoids false zero directory metrics.

Evidence: [01.1a acceptance](acceptance/01.1a-foundation.md), [operating notes](../foundation-maintenance.md). No schemas/database records/credentials/permissions or live routes were migrated. No dependencies installed/upgraded and no new deployment added.

Baseline audit and source maps remain available: [audit](00-audit.md), [feature map](feature-preservation-matrix.md), [schema map](legacy-to-postgresql-map.md), [ownership](data-ownership.md), [dependencies](dependency-map.md), [backlog](slice-backlog.md), [rollback](cutover-and-rollback.md).

Outstanding 01.1 scope: credential engine decision, organization/membership contract and fixture, query/form foundations, verification delivery, database/queue-aware readiness, actual identity/browser/PostgreSQL integration evidence. ADR-001/002/003 remain proposed except the current maintenance choice to reuse existing topology. Current Auth stays in place during this maintenance; this is not acceptance of its final security design.

Known high-priority remaining findings: company isolation, localStorage session transport, missing backend MFA, billing replay/approval/outbox defects, leave review/balance integrity. See A01–A13 in audit. No scope exclusions were silently accepted as passing tests.

Production status: NOT AUTHORIZED. Provider/browser/PostgreSQL migration/restore/queue/load checks NOT RUN. Full 01.1 and later numbered slices are not claimed complete.

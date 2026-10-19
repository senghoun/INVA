# Leave integrity and scope increment

Date: 2026-10-02 (Asia/Phnom_Penh). Status: IMPLEMENTED AND TESTED; Phase 03 remains IN PROGRESS.

The full-pack request and “please continue” authorize these local changes. Existing HR services, routes and Organization identifiers are retained. No legacy import or statutory rule assumptions are introduced.

Implemented:

- Verified company and branch scope applies to leave request lists, entitlement reads/writes, submissions and reviews. Platform administrators require membership and explicit leave permissions on these routes. Auth exposes `hr.leave.view`, `hr.leave.request`, `hr.leave.manage` and `hr.leave.approve`; existing assignments must receive the appropriate grants rather than inheriting access silently.
- Request-only users can submit for their own linked employee. Delegated submissions require leave management permission. Linked employees cannot approve their own requests. Foreign employee/branch requests and reviews fail without modifying data.
- Employee-row serialization, request locks and a single transaction coordinate approvals, overlapping submissions, cancellations and entitlement edits. Concurrent approvals charge once; competing requests cannot overdraw a balance. Cancellation of approved leave refunds once. Replaying the same final decision does not alter its original evidence. Rejected/cancelled requests cannot be reopened through review.
- An explicit entitlement is required for approval. Missing or insufficient balances produce 409 and leave the request pending. Editing an entitlement preserves used days; reductions below used days are rejected. No error is swallowed or negative balance clamped into apparent success.
- Requests use validated date-only UTC boundaries and half-day durations within the calendar range. Cross-year requests must be split into separate entitlement-year requests. Overlap checks conservatively reject any intersecting date range for pending or approved requests, including two half-day requests on the same date. Automatic holiday/shift/business-day calculation is not claimed.
- Shared leave-type reads require selected company access. Leave-type mutation is restricted to central administrators because the current catalog is global. Types referenced by requests or entitlements cannot be deleted; history must be retained.
- `hr_leave_events` stores submission, entitlement and review evidence in the same transaction as the mutation. Records contain resource/employee/company identifiers, authenticated actor ID, state and numeric/date metadata; private reasons and review notes are excluded. Application mutation paths append records. A database trigger rejects updates/deletes; a database owner can still alter that trigger and requires separate operational controls. Historical employees do not own/cascade-delete audit evidence.
- The portal reports failed leave loads/reviews, clears failed or old-context records, ignores old responses and pending responses after sign-out, shows unavailable counts instead of false zero metrics, displays cancelled requests, and refreshes when opening the leave tab. A failed review keeps the dialog open with the server error.
- Company employee-management permission cannot bypass central administrator authority for login-account links.

Migration: `prisma/hr/migrations/20261002100000_leave_business_events/migration.sql`, additive table/indexes/immutability trigger, applied only to isolated `inva_pack_hr_test` on local port 55439. The application database has not been migrated. Deploy the checked-in migration through the normal reviewed deployment process before running this HR build against another database; audit failure is deliberately fail-closed. Existing entitlement corruption is not silently backfilled or asserted reconciled.

Evidence:

- 101 backend unit/boundary tests and 40 frontend API/loading tests pass.
- 19 HR PostgreSQL tests pass, including existing employee isolation and nine leave integrity tests plus history retention and self-approval denial. Tests cover concurrent double review/refund, competing approvals, overlaps, missing balance, entitlement preservation, cross-year/duration rejection, foreign scope and audit rollback/immutability.
- Two real Chrome journeys pass. The company-access journey creates an explicit entitlement and scoped leave request through authenticated browser API calls, reviews it through the portal, reloads and checks the persisted balance and actor-bound event, then switches company and verifies the request disappears. The second journey exercises cookie/MFA/recovery/session revocation.
- Backend lint/typecheck and all six builds, plus portal typecheck/build, pass. Test fixtures use local databases whose names contain `test`; business events intentionally remain in the isolated test database as append-only evidence.

Remaining: company-specific/versioned leave policies; approved shift/holiday and half-day time-slot semantics; complete balances/cancellation/audit portal workflows; protected exports; HR-wide scope enforcement; employment history and controlled transfers/offboarding. Employee hard deletion still cascades leave operational records through the existing schema; the retained event evidence does not make that employee lifecycle acceptable. Historical policy/configuration defaults are not verified statutory entitlements. Full Phase 03 and release/restore/security acceptance remain open.

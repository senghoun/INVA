# Attendance scope and retry integrity increment

Date: 2026-10-02 (Asia/Phnom_Penh). Status: IMPLEMENTED AND TESTED; complete attendance scheduling/release acceptance remains IN PROGRESS.

Continued under the user's full-pack request. Existing routes, employee/company identifiers and HR ownership are preserved.

Implemented:

- Today status, clock-in/out, attendance records and late-request submission/list/review require verified company membership and attendance permission, including central administrators. Queries and mutation targets apply company and branch restrictions. Department filters cannot overwrite the company predicate. Nested late reasons are filtered as well; an inconsistent foreign employee link cannot expose foreign reasons.
- Auth permission catalog includes `hr.attendance.clock`, alongside view/manage. Clock-only users can punch or submit late requests for their own linked employee; delegated targets require manage permission. Existing memberships must receive the intended permissions explicitly. Company-scoped permissions are mapped to the portal access summary.
- Employee-row locking serializes punch mutations, with company-before-employee ordering matching existing employment writes. Inactive employees and inactive selected companies cannot punch. The first clock-in time, GPS values, lateness and note are retained on retries, including retries after checkout. A retry does not reopen a completed day.
- Checkout checks the original clock-in inside the transaction, rejects backwards timestamps, and retains the first checkout time/location on retries. Checkout notes have their own field, preserving the original clock-in note. There is no implicit correction through a repeated punch.
- Late-request review is scoped and serialized. Repeating the same decision preserves the original reviewer/notes; a different final decision is rejected. This protects API decision integrity but is not a complete append-only attendance audit or correction workflow.
- Date-only inputs, coordinate bounds, expected-arrival format, known status values, integer pagination and a 100-record page limit are validated. Date ranges require both boundaries and correct ordering; month queries require month/year together and compare stored date labels using UTC month boundaries.
- Today status now returns the portal's canonical status plus the existing boolean fields for compatibility. Failed status requests display unavailable instead of claiming the user has not clocked in. Attendance loads expose errors, clear failed or old-company records, and ignore late responses after company/session changes or unmount. Opening the attendance tab refreshes its data. The portal shows both check-in and checkout notes.

Migration: `20261002110000_attendance_checkout_evidence` adds nullable `attendance_records.check_out_notes`. Applied only to the isolated local `inva_pack_hr_test` database. Application/production databases were not migrated; the migration must be applied through the deployment process before using this build with another database. Historical notes were not copied or relabelled because their provenance is unknown.

Evidence:

- 109 backend unit/boundary and 42 frontend API/loading tests pass.
- 26 HR PostgreSQL tests pass, including seven new attendance tests: foreign company/branch and own-status denial, atomic checkout validation, concurrent clock-in/out evidence preservation, department-filter scope, final late-review replay, and nested foreign-reason rejection. Earlier employee/leave tests continue to pass.
- Two Chrome journeys pass through isolated gateway/Auth/HR/portal. The company journey now verifies real clock-in, replay, checkout, separate notes, reload persistence and hiding records after switching company; it also retains the leave approval/grant/revocation checks. Cookie/MFA/recovery/session checks pass separately.
- Backend typecheck/lint, all six builds, HR's final build, portal build and Prisma HR schema validation pass.

Remaining: the existing server-local day and lateness calculation is retained. A company IANA timezone/business-day policy, overnight shifts, effective-dated schedules, company holidays and daylight-saving boundaries are not implemented or accepted. The existing database date representation may require reconciliation before switching timezone semantics. Offline submissions do not yet have client-event identity, captured/server timestamps or device trust; same-day retry preservation does not claim those capabilities. Attendance corrections with reasons, independent approval, append-only transactional audit, protected exports and lifecycle retention remain open. Employee deletion still uses the existing cascading relationships. Company access to other HR/domain surfaces and complete release/restore acceptance remain open. No payroll/statutory rules were invented.

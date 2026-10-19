# Phase 03 - HR and Payroll (Version 2)

Read MASTER_PROMPT.md, the approved Phase 00 decisions, completed Auth scope, and Phase 02 prerequisites for the active HR slice. Implement only the authorized slice. Apply the service decision gate: when HR is approved as independent, give it a private PostgreSQL database/role, migrations, artifact, and deployment; otherwise keep it an isolated module in the approved application with private repositories and explicit interfaces. Reuse Core capabilities instead of rebuilding them. Apply RELEASE_CHECKLIST.md from the first HR release.

## Step 03.1 - Employees and employment

Implement employee profiles/codes, optional user linkage, current/permanent addresses, emergency contacts, contracts, departments, positions/grades, reporting managers, company/branch assignments, and effective-dated employment history. Employees can exist without user accounts. Users may have legitimate employment records in different organizations.

Use approved local geography: shared reference queries for co-deployment, or synchronized reference tables for an independent database. Do not call Location per row. Store employee house/street details privately in HR. Cache/reference Organization data as approved, without treating a stale copy as authority for sensitive access grants.

Provide onboarding, controlled employee import with preview/errors, transfer history, and offboarding. Inviting an employee requests Auth account/access provisioning; it does not directly insert into Auth tables. Offboarding initiates scoped access revocation and asset return without deleting historical payroll or another company's account access.

## Step 03.2 - Attendance, schedules, and leave

Implement work schedules, shifts, check-in/check-out, corrections with reasons and approval, leave types/balances/requests, leave approval, holidays, and overtime if present in approved scope. Preserve audited late-arrival/early-leaving reasons and other existing rules rather than inventing a universal threshold.

Preserve existing mobile API compatibility. Do not reintroduce background location tracking. Use location only for explicit foreground attendance actions where authorized. Store capture time, receipt time, time zone, location accuracy, and review indicators as needed. Do not treat phone GPS or client time as unquestionable proof.

Handle duplicate submissions, offline synchronization, overnight shifts, overlapping leave, corrections, company time zones, and concurrent requests explicitly. Preserve raw attendance evidence and track corrections; do not silently overwrite it.

## Step 03.3 - Payroll calculation and approval

Implement effective-dated salary structures, allowances, deductions, approved attendance/leave inputs, payroll periods/runs, calculation versions, review, approval, and payslips. Use decimal arithmetic and explicit currency/rounding. Keep bank details restricted and require step-up plus business approval for sensitive changes.

Make statutory/NSSF/tax rules configurable and effective-dated. Require verified source rules and accountant/HR-owner approval before production calculations. Do not invent legal rates, claim compliance, or silently substitute zero when a mandatory rule is missing.

A payroll run should record its input snapshot and calculation version. Approval binds to the specific run/version; changing material inputs invalidates approval or creates a controlled revision. Prevent duplicate runs/postings for the same approved payroll operation. Preserve approved history.

## Step 03.4 - Integrations and assets

HR calculates pay. Finance records expense/liability. Payments executes/records disbursement. Publish a restricted `PayrollApproved.v1` event with references and permitted summary information; expose an authorized immutable posting-summary contract. Keep line-level salaries out of broad broadcast topics.

Until Finance and Payments phases are implemented, mark integration as pending/disabled and persist retryable requests; do not mark payroll paid. Provide contract tests now and full integration tests later.

Implement employee equipment assignment, return, condition, and related approvals. Finance owns asset accounting/depreciation, not HR. Add training/performance only where explicitly present in approved migration scope; do not expand the initial phase into a new recruitment suite.

## Required React screens

Employees/detail/history, department/position administration, attendance and corrections, shifts/calendar, leave and approvals, payroll runs/detail/review, payslips, employee assets, employee self-service, and scoped HR reports. Preserve approved language, filters, exports, print behavior, and user workflows.

## Step 03.5 - Migration and acceptance

Import employees, employment history, attendance, leave balances, payroll snapshots, and assets from sanitized legacy data. Reconcile record counts, leave balances, payroll totals, employee codes, timestamps, and relationships. Quarantine ambiguous historical data.

Test self-only versus manager/HR/payroll access, cross-tenant/branch denial, duplicate/offline attendance, overnight shifts, concurrent leave, effective dates, payroll rounding, unauthorized salary exports, approval tampering, local geography outage behavior, and offboarding access revocation.

Demonstrate create employee -> assign branch/shift -> submit attendance/leave -> approved payroll -> pending Finance handoff, with real persistence after refresh.

## Done and stop

Provide the authorized slice's working HR flow, APIs, migration/reconciliation evidence, and actual tests. Explicitly identify downstream integrations waiting for Phases 04/05. Contract-tested pending handoff is not a completed Finance/Payments integration. STOP at the authorized slice boundary. Accounting requires separate approval.

## Slice authorization guide

| Slice | Demonstration |
|---|---|
| 03.1 | Authorized HR user creates an employee with valid branch/address; it survives refresh and is hidden from unauthorized users. |
| 03.2a | Employee records attendance; duplicate/offline submission does not create a second result; a correction retains evidence. |
| 03.2b | Employee requests leave; authorized manager decides; balance and overlap rules remain correct under concurrency. |
| 03.3 | Approved inputs produce a decimal-safe payroll run; review binds to its version; unauthorized salary access is denied. |
| 03.4 | Approved payroll handoff is durable and pending until integrated; equipment custody/return works where in scope. |
| 03.5 | Legacy employee, attendance, leave, and payroll fixtures reconcile; the approved HR release passes its checklist. |

Do not build every HR screen before delivering 03.1. Every slice includes its own permissions, relevant audit, UI and tests. Offboarding needs a tracked urgent revocation request and confirmation/retry handling; employment termination alone must not claim that already-issued credentials are invalidated. A manager's access follows the approved current reporting/scope policy, not an unvalidated caller-supplied manager ID.

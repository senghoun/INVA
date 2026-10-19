# Authentication and administration

Auth administration (users, roles, security policy, audit) and gateway controls require an active INTERNAL user with the active ADMIN role. Internal classification alone is insufficient. Login, registration, and refresh remain public and throttled; registration always creates EXTERNAL accounts. `/auth/me`, logout, and password change are available to authenticated users.

Access JWTs carry `type: access` and a session ID. Auth validates the database session, active account, and current active roles for each protected request. Downstream JWT strategies consult auth directly, failing closed if session verification is unavailable. Existing tokens issued before this change require a new sign-in. Deploy/restart gateway and downstream services together.

Refresh tokens have unique JWT IDs and rotate with atomic single-use consumption. Logout revokes the authenticated session; password changes/resets and account suspension revoke refresh sessions and therefore their access tokens. Saved security policy controls token lifetimes, maximum concurrent sessions, IP rules, and failed-login lockout. Failed-login streaks are scoped to the account and client IP; successful login or password change resets the streak while retaining audit history. The gateway applies a separate short flood-protection window and does not count successful logins as credential failures. The standard Nest throttle remains an additional per-process request limit.

The gateway reads policy using a short-lived server JWT restricted to the `auth-policy` audience. Proxy requests carry a signed client-IP context. Auth ignores arbitrary forwarding headers. If the gateway itself is behind a trusted reverse proxy, set `GATEWAY_TRUSTED_PROXIES` to its explicit trusted IPs/CIDRs; never set an unrestricted trust rule. All services require `JWT_SECRET`, and auth also requires `JWT_REFRESH_SECRET`. Use separate unpredictable secrets. Bootstrap seeding requires an explicit ADMIN_PASSWORD and no longer prints it.

Apply the additive migration before starting auth:

```sh
npx prisma migrate deploy --schema prisma/auth/schema.prisma
npm run prisma:generate
```

Migration `20260928060000_auth_security_policy_audit` creates the missing policy and audit tables without changing existing user records. Login, logout, refresh, account/role changes, policy changes, and blocked requests produce real audit events; credentials and tokens are excluded.

The frontend uses server pagination/search, shows API errors, and refreshes tokens once for concurrent requests. Temporary network failures retain credentials. Failed refresh authentication clears the UI session. Logout and password change call the actual API. Role management displays stored roles and assignments; local permission overrides and demo audit records have been removed.

MFA setup and email password recovery are not implemented by this backend. Their setup controls are unavailable; accounts flagged MFA-enabled are denied password-only login/refresh rather than bypassing a second factor. New custom role names do not grant endpoint permissions without corresponding server authorization rules. Other domain-specific authorization policies are outside this auth administration change.

Validation:

```sh
# core-api
npm run typecheck
npm run build
# super-app
npm run typecheck
npm run build
npm run build:hr
```

The automated test suites and one-time verification scripts were removed during project cleanup at the owner's request.

User Directory now exposes Edit user (email, internal/external classification, active
status) and Reset password. Own-password actions use the current-password flow.
Password resets use POST /auth/users/:id/reset-password, restricted to internal
administrators. Auth generates a unique random temporary password, valid for 24 hours,
and returns it once with Cache-Control: no-store. No email is sent. PATCH no longer
accepts a password field. ADMIN_PASSWORD_RESET audit events contain
actor and target identifiers, never the password. Account updates and associated
session revocation now commit in one transaction. Email/type changes, suspension,
and password resets revoke existing sessions. Null mutation fields are rejected.

Domain controllers enforce ADMIN or the corresponding service role: HR_ADMIN,
CRM_MANAGER, ACCOUNTANT (or the existing finance_manager role), IT_ADMIN. AUDITOR grants GET access only; it does not grant
writes. Internal-only restrictions still apply. CRM's external invoice portal keeps
its existing external-account and organization ownership checks. Custom roles do
not automatically grant domain privileges. Downstream JWT validation consults Auth
for current roles/session validity and fails closed if Auth is unavailable.

Temporary-password login returns requiresPasswordChange, passwordChangeToken, and
expiresIn (600 seconds), with no access/refresh tokens or session. Super-App keeps
this challenge only in memory and shows the shared-component required-change form.
POST /auth/complete-password-change accepts the challenge and newPassword. Tokens
are scoped to the password-change audience/type and bound to the stored password
hash; another reset invalidates them. Completion atomically checks the current hash,
active status, expiry and required-change flag, changes the hash, clears the flag,
and revokes sessions. Replay/concurrent completion fails. The user signs in again
with their chosen password. Temporary passwords cannot be reused as the new password.
Existing access and refresh flows also deny accounts awaiting a password change.
Migration: 20260929090000_temporary_password adds two fields; existing accounts are
unaffected until reset. EditUserModal and RequiredPasswordChangeModal reuse common
Modal, Button, Input, Label, and DatalistSelect (account classification).


HR schema repair (20260929093000_complete_hr_schema): the original migration did
not include the organization hierarchy, expanded employee fields, attendance,
leave, HR configuration or HR-role tables now used by the service. Migrate status
alone reported success because the missing migration had never been recorded.
The new transactional migration matches the current schema and preserves existing
employee/department rows. Verify local HR reads through the running gateway and HR service.

Super-App Roles & Access shows a service access table with active/inactive filters.
User assignment uses explicit Assign/Remove controls and distinguishes direct
assignments from ADMIN inheritance. The table is a summary of server-enforced
service roles, not an editable per-endpoint policy. External and suspended account
restrictions still apply. All role dialogs use the shared components.


Employee HR roles (20260929100000_employee_hr_roles)
- HR employee-role assignments are stored in employee_hr_roles; they are independent
  of global Auth role names. An active linked employee can access HR endpoints using
  the union of permissions from their assigned HR roles, without a global HR_ADMIN.
- GET /hr/access/me returns the caller's resolved permissions. GET /hr/me returns
  the caller's own employee profile when hr:self:read is granted.
- GET/PUT /hr/employees/:id/access requires hr:roles:manage or central ADMIN/HR_ADMIN.
  PUT replaces roleIds atomically; optional authUserId links/unlinks a login account.
  Only central ADMIN can change links; Auth verifies the target is active INTERNAL.
  Generic employee DTOs no longer accept authUserId. Duplicate links return 409.
- HR permissions are read from the HR database on every request. Changing role
  definitions, removing assignments, unlinking accounts, or suspending employees
  takes effect immediately. Central ADMIN is the recovery exception; ADMIN/HR_ADMIN
  retain administrative access (HR_ADMIN is denied if its linked employee is inactive).
- hr:self:read scopes attendance/leave lists to the actor's employee and permits
  own profile/leave types. hr:attendance:clock permits only own check-in/out and late
  requests. It does NOT permit attendance approvals. hr:leaves:request is own-only.
- Administrative read/write/delete/manage/approve permissions map explicitly to
  controller actions. Missing policy metadata denies access. Payroll labels do not
  grant an API capability where a payroll endpoint does not exist.
- Existing saved HR role definitions are preserved. Review their checked permissions;
  enable the new Clock In / Out (Own Record) permission for employee self-service.
- Super-App: HR > Employees > HR access. Auth administrators choose a login account;
  HR access managers can assign roles to already-linked employees. Save applies
  immediately. Inactive or unlinked employees can have saved roles but gain no access.
- Verify linking and permissions through HR > Employees > HR access in the running portal.


Employee creation uses the API email field (not workEmail). The frontend trims
contact details and omits blank optional email/phone/department fields. Employee
codes are explicitly entered, with duplicate-code errors shown beside the field.
The success screen offers HR access setup; matching contact email never implicitly
links a login identity. Employee rows show whether a login account is linked.


## Email or phone login

`POST /api/v1/auth/login` accepts exactly one of `email` or `phone`, plus
`password`. Existing `{ "email": "alice@inva.io", "password": "..." }` clients
remain compatible. Phone example:

```json
{ "phone": "+85512345678", "password": "your-password" }
```

Phone numbers require international format with a country code and 8–15 digits.
Spaces, parentheses, periods and hyphens are removed before validation/storage;
local numbers are rejected rather than guessing a country. Numbers are unique
across accounts. This is phone-and-password login; no SMS or OTP is sent.

Registration and administrator account creation accept an optional `phone` while
still requiring email. An INTERNAL ADMIN can assign/change a login phone with
`PATCH /auth/users/:id` and remove it with `{ "phone": null }`. Phone changes revoke
existing sessions. `/auth/me` and user directory responses include the nullable
phone. HR employee contact numbers do not automatically become login numbers.

Phone login keeps the existing MFA, temporary-password, active-account, token and
browser-cookie checks. Email and phone failures for a linked account share the
same account/IP lockout and audit identity. Unknown numbers return the same generic
credential error as wrong passwords. Database uniqueness conflicts return HTTP 409.

Apply migration `20261008090000_user_phone_login` before running the updated auth
service. It adds a nullable unique phone column and a format constraint; existing
accounts keep their email login and have no phone until one is assigned:

```sh
npx prisma migrate deploy --schema prisma/auth/schema.prisma
npm run prisma:generate:auth
```

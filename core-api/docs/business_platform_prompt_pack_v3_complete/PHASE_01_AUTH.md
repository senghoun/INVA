# Phase 01 - Authentication, Verification, and Access (Version 2)

Read MASTER_PROMPT.md, the approved Phase 00 decisions, and PROGRESS.md. Implement only the authorized numbered slice. Apply RELEASE_CHECKLIST.md to its release scope. Never create an authentication engine before its ADR is approved.

## Objective and ownership

Create one shared identity and access system for the portal and future services. Auth proves identity, manages authenticators/sessions/access assignments, and exposes trustworthy security context. Each business service will still enforce its resource and business rules. Users and employees are different records.

Use the identity-engine decision approved in Phase 00 after comparing a maintained provider with application-managed authentication. Prefer a suitable maintained provider when its operational model fits, but do not introduce one without approval. The requirements below apply to either implementation. Provider-managed credentials, authenticators, and verification flows remain with the provider; Core integrates them and owns the approved platform access model. Do not create competing credential/role authorities or build an OAuth/OIDC server. Use trusted issuer and subject for provider identity mapping, not email matching alone. Provider-hosted security screens may satisfy the UI requirement when integrated with the approved user experience.

## Step 01.1 - Foundations and minimum dependencies

Create/reuse the React portal shell, approved edge configuration, and `apps/core` Auth/Access module. Add a separate NestJS gateway/BFF only when its decision gate is approved. Add configuration validation, health checks, OpenAPI, structured redacted logging, migrations, and local development commands. Start only required dependencies.

Create minimal tenant/company/branch IDs and records inside an Organization module in Core. Add memberships and scope-aware role assignments inside Auth. Full Organization CRUD belongs to Phase 02; do not duplicate these IDs later or hardcode a real company as the universal default.

Define the protected verification/invitation delivery boundary. When the identity provider owns verification delivery, configure that integration rather than duplicating OTP handling in Core. For Core-owned delivery, define `NotificationDeliveryPort`. Use an actual configured delivery adapter or an isolated development mail sink. Never return OTPs to public APIs or production logs. Full template/delivery-history administration comes in Phase 02.

## Step 01.2 - Account lifecycle and authorization

Implement invitations, activation, login/logout, current-user profile, password recovery where applicable, account suspension, authorized tenant/company switching, roles, permission catalog, scoped assignments, and account security history. Disable public self-registration unless explicitly required by the audit.

Use namespaced permissions such as `hr.employee.view`, `hr.payroll.approve`, `finance.invoice.issue`, and `platform.locations.manage`. Permission evaluation includes tenant/company, branch/team/record scope, and required authentication strength. Add role-management safeguards against granting permissions the administrator does not control.

Business employee/contact phone edits must not silently change verified authentication contacts. Invitations and recovery responses should not unnecessarily reveal whether an account exists.

## Step 01.3 - Password, OTP, and MFA

For local passwords, use Argon2id with parameters verified against current primary guidance and tested on target hardware. Inspect legacy hash formats; migrate by approved compatible verification and rehash-on-success, or a controlled reset. Never attempt to recover plaintext or rehash an old hash as if it were the user's password.

Implement email ownership verification; password-plus-authenticator TOTP; passkey/WebAuthn enrollment/login with server verification; single-use recovery codes; and controlled authenticator replacement. Support phone ownership verification through a configurable SMS adapter when required. Phone/email ownership verification is not equivalent to strong MFA. Do not allow weak email/SMS recovery to silently bypass privileged MFA policy.

For delivered verification codes, proposed configurable defaults are 5-minute expiry, 60-second resend delay, and 5 failed attempts per challenge, plus account/destination/network send and attempt limits. Bind each challenge to its user, purpose, destination, and relevant session/action. Resend invalidates the older code without resetting aggregate abuse counters. Validate/consume atomically. Do not reuse these delivery rules as the TOTP protocol's validity window.

Protect verification secrets at rest using a reviewed approach resistant to trivial offline guessing of short codes. Encrypt TOTP seeds with keys outside the database. Never log codes, seeds, recovery codes, raw tokens, or password values. Notify users about material credential changes without exposing secrets in durable audit/history records.

## Step 01.4 - Sessions and sensitive actions

Implement the session model approved in Phase 00. For the browser, keep long-lived secrets server-side or in HttpOnly Secure cookies with an explicit SameSite and CSRF policy; do not put them in localStorage. If JWT access tokens are used, validate signature, algorithm allowlist, issuer, audience, lifetime, and session/access status. A password accepted before required MFA completes must not produce a fully privileged session.

Implement session/device listing, per-session revocation, global session revocation, expiry, and refresh-token rotation/reuse detection where refresh tokens exist. Handle legitimate concurrent refresh requests without bypassing replay protection. Verify revocation at APIs, not only at the login screen; define maximum ordinary revocation delay and require current checks for sensitive actions. Fail closed where required if authorization state is unavailable.

Create a step-up mechanism for payroll approval, bank-detail changes, role grants, and later financial actions. Auth supplies fresh verified assurance; the target service checks permission and binds approval to the actual resource/version. A fresh OTP never grants missing business permission.

Use separate limited service credentials for internal requests. Gateway-provided identity headers must not be spoofable from public clients. Future external/mobile integrations need a documented secure transport; preserve existing mobile contracts through an approved compatibility plan.

## Required React screens

Login, invitation acceptance, verification/MFA challenge, recovery, account security, passkeys/authenticators, sessions, user management, role/permission assignments, company switcher, and explicit forbidden/session-expired screens. Reuse approved branding and localization. Connect forms to real APIs and persist state appropriately.

## Step 01.5 - Identity migration and acceptance tests

Migrate users, grants, memberships, status, and approved identifiers without granting extra access. Detect duplicate accounts for review rather than merging on email/phone alone.

Test successful and failed login, MFA bypass attempts, challenge expiry/reuse/concurrent submission, resend limits, purpose mismatch, passkey origin/RP checks, recovery, refresh races, revoked sessions, forged tenant headers, cross-company access, unauthorized role grants, and sensitive-action step-up. Use at least two tenants, multiple branches, a privileged user, an ordinary employee user, and an external non-employee user.

Demonstrate login -> MFA -> authorized portal -> company switch -> revocation -> denied API request. Run PostgreSQL integration and browser end-to-end tests. Report provider/SMS tests as blocked or sandbox-only when credentials are unavailable.

## Done and stop

Provide working code/UI, migrations, API/security documentation, legacy identity mapping, test evidence, and known gaps. Full Organization/Notification administration remains Phase 02. For each slice, connect its required React UI immediately and report its actual evidence. Do not defer all UI/tests until 01.5. A foundation demo is not a complete security release. STOP at the authorized slice boundary; do not start another slice or Phase 02 without approval.

## Slice authorization guide

| Slice | Deliverable and stopping point |
|---|---|
| 01.1 | Approved identity adapter, portal/configuration foundation, minimum Organization identity, health and integration smoke test. |
| 01.2 | Invitations/accounts, current user, company switching, scoped roles and permission enforcement. |
| 01.3 | Required verification, MFA/passkeys, recovery and authenticator replacement, with real security screens or approved provider screens. |
| 01.4 | Session/device management, revocation, service identity and step-up integration contracts. |
| 01.5 | Legacy identity reconciliation and complete security acceptance for the approved Auth scope. |

Every slice includes relevant tests and UI. No production login rollout before all controls required by its approved assurance policy are present. The provider selection must define the supported OIDC/browser/mobile flow, exact redirects, issuer/audience checks, assurance claims, and logout/revocation semantics. Test key rotation and unknown-key behavior where JWTs are used, with bounded refresh rather than uncontrolled fetching.

Reference guidance: [S08-S11, S13, S18, S22] in SOURCES.md.

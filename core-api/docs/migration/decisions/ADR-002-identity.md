# ADR-002 — Choose one credential authority

Status: PROPOSED / SELECTION UNRESOLVED. Date: 2026-10-01. Approval: PENDING. Slice prerequisite: 01.1 identity path. Reviewer: platform/security owner (unconfirmed).

Evidence: Auth bcrypt passwordHash, UserRole and RefreshToken schema; current backend session verification; portal localStorage tokens and frontend MFA calls without implemented server flow. Existing identity engine is application-managed. No approved external/mobile client specification or IdP deployment was supplied.

| Option | Benefit | Cost / required proof |
|---|---|---|
| Retain and harden current Auth | Lowest immediate contract/UUID disruption; existing tested lifecycle | Own MFA/passkeys/recovery/assurance/session security and maintenance; legacy hash/Argon2id migration decision, real security review/tests. |
| Maintained Keycloak integration | Provider credential/session/authenticator management; documented WebAuthn/passkey capabilities | Additional operational ownership, issuer/subject mapping, availability/key rotation, redirect/logout/claim validation, reviewed import or reset plan; existing bearer/mobile compatibility. |
| Managed OIDC provider | Offloads some hosting/security operations | Vendor selection, cost, data residency/availability and migration compatibility are unknown; not selected or provisioned. |

[Keycloak administration guide](https://www.keycloak.org/docs/latest/server_admin/index.html) checked 2026-10-01 for provider capabilities. This is a candidate evaluation, not approval or a working integration.

Proposal: decide before implementing credentials/MFA. Prefer a maintained provider when operating model fits; current evidence cannot settle hosting/cost/client requirements. Do not silently add Keycloak or rebuild OAuth/OIDC. Preserve fail-closed behavior for enabled MFA. Platform Access owns memberships/resource grants; provider owns chosen authenticators. Existing HR permissions remain business policies with reviewed mapping, not a second password authority.

Decision must specify browser authorization-code/PKCE or application session path, mobile compatibility, exact redirects, issuer/audience/algorithm checks, subject mapping (never verified identity from email alone), assurance claims, recovery/step-up, revocation delay and failure behavior. Long-lived browser secrets must leave localStorage under an approved HttpOnly/Secure/SameSite and CSRF policy or server-held session. Transport change is coordinated with refresh/logout/API clients, not a unilateral UI edit.

Acceptance: real two-company identity fixtures, revoked access, refresh races, forged issuer/context, unknown keys/rotation where applicable, MFA bypass/recovery and browser flow. Migration/recovery preserve UUID mappings and statuses, quarantine duplicates, maintain one writer and compatible client window. Provider credentials/hosting/data availability remain unresolved; no external integration was run.

## Current implementation decision, 2026-10-01

Under the user's subsequent request to implement the complete pack for a new platform, retain and harden the existing service topology and application-managed Auth for local implementation. No new external identity deployment or competing OAuth/OIDC authority is introduced. Use Argon2id with compatible bcrypt upgrade, cookie browser sessions, local TOTP and recovery-code verification, TanStack Query, React Hook Form and Zod. This records the implementation decision taken under broad task authorization; it is not an independent production security approval. Remaining provider/passkey/assurance/restore/release acceptance stays open.

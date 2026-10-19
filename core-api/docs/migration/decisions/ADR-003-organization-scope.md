# ADR-003 — Preserve Organization UUIDs and add scoped Access

Status: PROPOSED. Date: 2026-10-01. Approval: PENDING. Slice: 01.1 foundations / 01.2 enforcement. Reviewer: platform and HR owners (unconfirmed).

Evidence: current Company/Branch authority is HR schema and OrganizationService. Auth has global UserRole only. HR guard grants global administrative access; optional employee company/branch columns do not constitute verified memberships. CRM ClientOrganization describes external customers, not platform legal companies.

Compare leaving global grants, immediately moving companies into a new Core database, and keeping current storage while adding a logical Organization contract and scoped Access. Global grants do not satisfy requested isolation. Immediate relocation risks changed IDs, employee FKs and duplicated writers. Proposal: retain HR company/branch UUIDs and one existing writer; introduce a reviewed Organization read/validation contract and memberships/scoped assignments in Access without creating new organization IDs. Defer physical ownership migration to a separate accepted slice.

Tenant versus company hierarchy, cross-company administrator behavior, branch/team rules, and authoritative storage for membership must be approved. Null legacy company cannot be assigned to a universal default. No email/domain matching automatically confers membership. Historical global grants require reviewed migration, not automatic expansion into every company.

Within a process use internal interface; across existing deployments use authenticated deadline-bound API or approved versioned projection, never another service's Prisma client. Access owns assignments; HR owns record-specific employee/manager/self rules. Enforce detail/list/count/search/mutation/referenced branch consistency at backend and include scope in frontend query keys; clear scoped cache on authorized switch. Business record checks remain mandatory even if UI actions are hidden.

Need application checks plus reviewed DB role/RLS strategy: RLS is not automatically enabled by adding a company column. Test runtime pooled connections and roles if selected. Migration must preserve org/employee links, quarantine inconsistent branch/company records and retain compatibility until scoped policy release. No cross-database transaction is assumed.

Acceptance: two companies with multiple branches, admin/ordinary/external actors; deny forged context, cross-company detail/list/count/mutation and indirect-link access; test membership revocation, stale projection/unavailable authority and company-switch cache behavior. PostgreSQL/browser tests NOT RUN. No runtime membership grants changed.

## Implemented company/employee boundary, 2026-10-02

Under the full-pack local implementation request, retain HR's Company/Branch IDs as the Organization authority. Auth owns active company memberships, namespaced permissions, and optional branch restrictions. Empty branch restrictions mean all branches in that company. Company context is caller-selected and verified against current membership; it is not authority supplied by a token claim, UI selector, email domain, or arbitrary header.

Existing ADMIN is retained as an explicit platform/bootstrap administrator for Organization metadata and access assignment. It does not bypass employee company/branch filtering. Employee-directory SQL, read redaction and write/reference checks now enforce the verified scope. The portal validates switches, clears caches, and rejects late results from a prior company. Company access changes and their Auth audit record commit together. Employee relationship validation also runs under reference locks in the write transaction.

This implements one bounded part of the proposal. It does not certify scope for remaining HR/Finance/CRM/files/jobs/exports or choose a larger tenant hierarchy/RLS policy. Complete two-company release, payroll step-up, business audit/offboarding, transfer history and restore acceptance remain open. See `../acceptance/01-company-access-employee-scope.md` for exact test evidence and limits.

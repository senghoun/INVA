> Historical implementation evidence. Test suites, test commands and temporary verification scripts referenced here were removed during the 2026-10-14 project cleanup. Current checks are documented in [PostgreSQL setup](../../postgresql-setup.md).

# Company access and employee scope increment

Date: 2026-10-02 (Asia/Phnom_Penh). Status: IMPLEMENTED AND TESTED IN ISOLATION; full phases remain IN PROGRESS.

Authorization: the user's request to implement the entire v3 pack and subsequent “please continue”. The platform is new; no legacy import is required. Existing service topology, Organization UUIDs and one Auth credential authority are retained.

Implemented:

- Auth-owned company memberships with branch restrictions, namespaced permission catalog, status and grant provenance. An empty branch list explicitly means all branches of that company. Memberships do not create or duplicate Organization IDs.
- Administrator-only grants validate current company/branch identity and active status through HR's Organization API with a three-second deadline. Grant changes and a redacted audit record commit together. Revocation remains possible during an Organization outage. Public context headers cannot grant membership; current membership is checked at Auth on each request.
- `/auth/company-access` lists the caller's active assignments; `/auth/users/:id/company-access` reads assignments for platform administrators; PUT updates an assignment. No email/domain matching confers membership. External/inactive accounts cannot receive active internal company access.
- Portal company switcher first asks Auth to validate the selected context. Grant administration uses real accounts/companies/branches and loads existing grants before edits. Switching clears query caches and employee state; late responses from the old context are rejected. Membership discovery stays accessible without the revoked context. Company labels currently use stable UUIDs in the switcher.
- Downstream JWT verification forwards the selected company to Auth and receives current verified scope. Company-denied responses remain 403 rather than triggering an unrelated login refresh.
- Employee list, search, pagination, counts, details, create, update, toggle and delete require explicit company permission, including platform administrators. SQL queries and mutation predicates apply company and permitted branches. Pagination uses integers and caps pages at 100 records.
- Branch, department, position, sector, manager and leader references are checked against the selected company. Restricted branches cannot be bypassed by supplied query/body values; branch/company inconsistencies are excluded from directory reads.
- Payroll and bank fields require explicit payroll read/write grants. Writing a zero salary also requires write permission. Private employee fields require `hr.employee.private.view`. Nested reporting records outside branch scope are removed; remaining nested records receive the same sensitive-field redaction.

Migration: `20261001120000_company_memberships`. Applied only to isolated `inva_pack_auth_test`; existing HR migrations were applied to a new isolated `inva_pack_hr_test`, both on local port 55439. Application/production database records were not changed.

Evidence:

- 93 backend unit/HTTP-boundary tests pass; 37 frontend API/loading tests pass.
- 11 Auth PostgreSQL/Fastify tests pass, including current membership, foreign context denial, revocation and ordinary-staff grant denial.
- Eight employee PostgreSQL tests pass for company/branch list/count/search/detail/mutation/reference restrictions, financial redaction/write denial, and persistent creation. Status-change response redaction and Organization transfer/mismatch checks also pass.
- Two Chrome tests pass through isolated Vite, gateway, Auth and HR processes: cookie reload/MFA/recovery/session revocation; company switching, isolated employee lists/details/counts, branch mismatch rejection, real grant form submission and membership revocation. Enrollment/recovery DOM snapshots, traces and screenshots are disabled to avoid saving secrets.
- Backend lint/typecheck, frontend typecheck, all six final backend builds and the final portal production build pass. The portal entry bundle is about 300 kB before gzip, with domain workspaces loaded separately.

Follow-up leave scope/integrity and atomic business events are recorded in [03-leave-integrity-increment.md](03-leave-integrity-increment.md). Counts above describe this earlier employee increment.

Remaining scope: Organization lifecycle/preferences/location/document capabilities, invitations and ownership verification, passkeys, action-bound step-up, business audit for remaining HR mutations, controlled transfers/offboarding, scoped employee-access administration, attendance/full leave policy/payroll/Finance/CRM/reporting/file/job/export enforcement, service credentials and full release/restore acceptance. Existing Organization/bootstrap and other domain APIs still retain their earlier permission paths. Do not describe this employee-directory increment as complete platform tenant isolation or production security acceptance. Employee writes lock their current company and supplied employment references, validate again inside the persistence transaction, and then commit. Branch company reassignment is rejected; department/branch mismatches are rejected. Complete controlled-transfer history and stronger database relationship constraints remain follow-up work. No statutory or payment-provider values were invented.

Run with explicit local test URLs:

```sh
AUTH_TEST_DATABASE_URL=postgresql://USER@127.0.0.1:PORT/inva_pack_auth_test npm run test:auth:postgres
HR_TEST_DATABASE_URL=postgresql://USER@127.0.0.1:PORT/inva_pack_hr_test npm run test:hr:postgres
# From super-app, after core-api build:all:
AUTH_TEST_DATABASE_URL=... HR_TEST_DATABASE_URL=... npm run test:browser
```

Normal unit tests skip PostgreSQL suites when these variables are absent. Test URLs must name local databases containing `test`; the harness never defaults to `.env` application databases.

# Proposed Ownership and Dependencies

Validate this map against the repository in Phase 00. These are logical responsibilities, not a mandatory count of deployed services. `Core` is an initial grouping, not permission to move all shared-looking business logic into one large application.

## Authoritative ownership

| Boundary | Owns | Does not own |
|---|---|---|
| Identity engine | Credentials, authenticators, protocol/session behavior according to the approved design. | HR employment, customer profiles, payroll permission decisions. |
| Platform Auth & Access | Trusted identity mapping, scoped platform memberships/grants, invitation coordination, security integration. | Employee salaries, company branch definitions, valuation approval. |
| Organization | Tenant/company/branch structure, organization addresses, branding, enabled modules. | Employee placement/history, attendance, salary formulas. |
| Location | Official reference geography, codes, parent relationships, language labels, dataset versions. | Private employee/customer/property house and street records. |
| Documents | Private storage, metadata, versions, validation/quarantine, controlled access delivery. | The business decision that a valuation is approved or a user may read a payroll file. |
| Notifications | Delivery jobs, templates, preferences, retries, provider delivery state. | Whether an OTP is valid or an invoice is paid. |
| Audit | Protected audit collection and authorized retrieval. | Domain state transitions or unrestricted copies of sensitive records. |
| HR | Employees, employment assignments, departments/positions/grades, attendance, leave, payroll calculations, equipment custody. | Login credential authority, accounting ledger, payment execution. |
| Finance / AC | Billing, receivables/payables, allocations, journal entries, accounting periods, financial statements, asset accounting. | Attendance-based payroll calculation, customer master, provider execution. |
| Payments | Payment attempts, verified movement, provider adapters, refunds and payout execution. | Invoice balance authority, financial posting, salary calculation. |
| Customer & Contact | People/business contacts, contact methods, addresses, roles, reviewed merges. | CRM activity, login recovery changes, authoritative balances. |
| Property & Listings | Property facts, coordinates/address, listings, mandates, asking prices, authoritative holds/availability. | Valuation conclusions, buyer follow-ups, money movement. |
| CRM | Leads/opportunities, relationship activity, follow-ups, tasks, showings, customer requirements. | Customer master, property availability, Finance balances. |
| Property Valuation | Assignment facts, snapshots, inspections, evidence, calculations, review, approval, report versions/issuance. | Current property listing truth, customer identity, invoice balance. |
| Sales & Contracts | Quotations, agreed terms, contracts, order milestones, fulfillment coordination. | Opportunity state, direct edits to Property/PV/Finance states. |
| Reporting | Authorized read-only projections and defined metrics. | Editable master records or operational approval decisions. |

An external company in the Customer directory is not automatically a tenant/legal company in Organization. An employee, customer, and user can refer to the same person for different purposes without being one universal writable record.

## Proposed initial grouping - subject to approval

Keep Organization, Location, delivery, storage infrastructure, audit, and platform access as separated modules in Core initially. An external identity provider remains its own product deployment when chosen; Core integrates it rather than owning its private tables.

Consider HR and Finance as separate deployments where the source and operating plan support that separation. Keep Payments as a Finance module initially unless a separate integration/security/release boundary is justified. Evaluate Customer, CRM, and Sales together for deployment cost, while preserving distinct responsibilities. Property and Valuation retain separate models even if an approved first deployment groups them.

Do not merge useful existing systems merely to match this grouping. Do not create every listed application on day one.

## Sequence dependencies

| Phase | Necessary dependency | Allowed bridge |
|---|---|---|
| Auth | Company/branch identity and verification delivery. | Minimal Organization-owned records and a protected delivery interface; extend later without recreating IDs. |
| Shared Core | Auth/access enforcement. | Use the approved identity integration, not a second login system. |
| HR | Required Core capabilities. | Approved minimum shared slice; optional Core administration remains explicitly deferred. |
| HR payroll | Future Finance/Payments. | Persist approved payroll and a retryable handoff; mark posting/payment pending, not paid. |
| Finance | Customer identities not yet migrated. | Approved read-only legacy adapter or immutable document billing snapshots with optional external references; no competing customer master. |
| Payments | Finance allocation/posting contract. | Sandbox provider/manual verification as explicitly approved; do not fabricate confirmation. |
| Customer | Prior Finance/legacy references. | Reconcile stable IDs and aliases without rewriting issued invoices. |
| CRM | Customer/Property reads. | Approved local read projections or explicit APIs, with freshness and failure behavior. |
| Valuation | Case-specific customer/property evidence. | Historical snapshots plus external references; do not rewrite approved reports. |
| Sales | Operational and billing owners. | Durable coordination and pending/exception states, not cross-database transactions. |
| Reporting | Defined source contracts/metrics. | Controlled bootstrap plus changes; never direct unrestricted joins across private service databases. |

When a bridge is unavailable or unsafe, propose an approved dependency reorder or a smaller slice. Never invent a finished downstream service.

## Location modes

**One backend/database:** shared reference tables or an internal Location interface can serve the authorized modules. Keep edits owned by Location. Avoid HTTP calls back to the same process.

**Independent service databases:** frequent location reads/filters use local synchronized geography. The master is edited only in Core. Each service owns its private business address; it stores reference IDs and necessary historical snapshots. Keep version/gap/resync status visible.

For SQL analysis, distinguish employee home province, employee workplace, customer current address, property location, and invoice-time billing address. Aggregate facts at the intended grain before joining; do not multiply totals by joining unrelated records only on province.

## First business demonstrations

1. Auth: invite -> verify required factors -> scoped portal access -> revoke -> denied API request.
2. Shared/HR: create branch -> select valid location -> create employee -> persist -> enforce self/manager/HR scope.
3. HR/Finance: approved payroll version -> one accounting posting -> retry does not duplicate it.
4. Finance/Payments: invoice -> verified payment -> one allocation/posting -> visible reconciliation status.
5. Sales/PV: accepted scope -> one case -> reviewed report -> controlled release eligibility.

These are demonstrations for acceptance, not permission to run live payments or migrate production.

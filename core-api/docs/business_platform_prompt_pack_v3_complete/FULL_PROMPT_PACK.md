# Complete Business Platform Migration Prompts - Version 3

**NestJS + React + TypeScript + PostgreSQL**

Generated reading edition. Execute only the approved active slice using the canonical source files. Version 2 headings in inherited phase files describe their original revision.

## Included sections

1. `README.md`
2. `START_HERE.md`
3. `MASTER_PROMPT.md`
4. `ARCHITECTURE_DECISION_GATE.md`
5. `OWNERSHIP_AND_DEPENDENCIES.md`
6. `API_EVENT_CONVENTIONS.md`
7. `RELEASE_CHECKLIST.md`
8. `PHASE_00_AUDIT.md`
9. `PHASE_01_AUTH.md`
10. `PHASE_02_SHARED_SERVICES.md`
11. `PHASE_03_HR.md`
12. `PHASE_04_ACCOUNTING.md`
13. `PHASE_05_PAYMENTS.md`
14. `PHASE_06_CUSTOMERS.md`
15. `PHASE_07_PROPERTIES.md`
16. `PHASE_08_CRM.md`
17. `PHASE_09_VALUATION.md`
18. `PHASE_10_SALES.md`
19. `PHASE_11_REPORTING.md`
20. `PHASE_12_CUTOVER.md`
21. `templates/ADR_TEMPLATE.md`
22. `templates/PHASE_ACCEPTANCE_TEMPLATE.md`
23. `templates/PROGRESS_TEMPLATE.md`
24. `CHANGELOG.md`
25. `SOURCES.md`


---

<!-- Source file: README.md -->

# Business Platform Migration Prompt Pack - Version 3

**Required stack:** NestJS + TypeScript backend, React + TypeScript frontend, PostgreSQL.

**Purpose:** Restructure an existing project incrementally, using clear business ownership and justified microservice boundaries. This pack contains instructions, not migrated application code or a certification of the existing architecture.

**Prepared:** 2026-10-01. Recheck relevant official documentation and compatible stable versions during the repository audit. Package versions are intentionally not guessed.

## Start here

1. Use this folder in place at `core-api/docs/business_platform_prompt_pack_v3_complete/`. Resolve filenames relative to this directory. Keep `docs/migration-prompts/` as historical material; do not combine its master with this pack. Preserve existing source and migration evidence.
2. Give the coding agent access to the actual in-scope repository and a sanitized schema or authorized non-production database. Do not share production credentials in chat.
3. Use the first message in `START_HERE.md`. Start with Phase 00 only.
4. Approve architecture decisions and the next numbered slice. Authorize one slice at a time, not the entire combined document.
5. Review real test results and the acceptance report before proceeding. A phase approval is not production deployment permission.

## Version 3 baseline

Version 3 adds the shared React shell, feature-first organization, reusable UI patterns, API/query/form foundations, design tokens, and consistent backend boundaries from `MASTER_PROMPT.md`. Phase files inherited from Version 2 retain their slice and approval rules. `MASTER_PROMPT.md` is canonical; `MASTER_PROMPT_V3_STANDALONE.md` is an identical convenience copy.

## Changes retained from Version 2

- A phase is an implementation milestone, not an instruction to create another application or database.
- Each service extraction must pass `ARCHITECTURE_DECISION_GATE.md`.
- Identity-provider evaluation is mandatory before choosing application-managed credentials.
- A custom NestJS gateway is optional; reuse suitable edge infrastructure.
- Shared services deliver a usable minimum first, without waiting for every optional administration feature.
- Independent release, contract compatibility, database-upgrade safety, recovery, and operations checks apply to each released slice, not just the final phase.
- Existing controls for tenant isolation, money, migration, permissions, and reliable events are retained.

## Required versus proposed technology

| Category | Instruction |
|---|---|
| Required | NestJS, React, TypeScript, PostgreSQL. Preserve supported external/mobile interfaces. |
| Version 3 foundation | TanStack Query, React Hook Form, Tailwind/design tokens, REST/OpenAPI, and Prisma unless an alternative is approved. Preserve a suitable existing component library; confirm schema validation and tooling in Phase 00. |
| Authentication decision | Evaluate a maintained identity provider against application-managed authentication. Prefer a suitable maintained provider when its operating model fits. Obtain approval; do not silently add one or build an OAuth/OIDC server. |
| Infrastructure decision | Use an existing gateway/reverse proxy when adequate. Add Redis, RabbitMQ, object storage adapters, or extra workers only when the current slice needs them and the decision is approved. |
| Not automatic | Kubernetes, Kafka, a service mesh, microfrontends, GraphQL, event sourcing, universal workflow engines, separate servers per module. |

## Phase order

| Phase | Focus | First useful result |
|---|---|---|
| 00 | Audit and architecture decisions | Evidence-based inventory and approved first implementation slice. |
| 01 | Auth, access, OTP/MFA, sessions | Sign in and enforce company-scoped access. |
| 02 | Shared Platform Core | Required company/branch, location, delivery, storage, and audit capabilities. |
| 03 | HR and Payroll | Create an employee, then attendance/leave, then controlled payroll. |
| 04 | AC / Finance and Billing | Balanced posting, invoices, receivables, payroll handoff. |
| 05 | Payments | Verified money movement and one correct Finance effect. |
| 06 | Customer and Contact | One customer master and reviewed legacy identity mappings. |
| 07 | Property and Listings | Property records, controlled publication, authoritative availability. |
| 08 | CRM | Leads, follow-ups, activities, opportunities, and correct reporting. |
| 09 | Property Valuation | Evidence, review, approval, revision, and report issuance. |
| 10 | Sales and Contracts | Accepted commercial terms and controlled fulfillment. |
| 11 | Reporting and Analytics | Authorized cross-domain metrics with visible freshness. |
| 12 | Consolidated validation and staged cutover | Reconciled, reviewed release of the authorized rollout scope. |

Keep the requested order by default. Dependencies may require approved minimum scaffolding or a legacy adapter, not fake completed integrations. A phase-order change requires a recorded decision and approval. Production hardening starts with Phase 01; Phase 12 consolidates it.

## Which instructions to load

Always load `MASTER_PROMPT.md`, the approved audit/decisions/progress, and the active phase file. Load `ARCHITECTURE_DECISION_GATE.md` when deciding deployment boundaries or infrastructure. Load `API_EVENT_CONVENTIONS.md` when changing public contracts or asynchronous processing. Apply `RELEASE_CHECKLIST.md` to every release scope.

`OWNERSHIP_AND_DEPENDENCIES.md` is the proposed ownership map to validate against the source. `templates/` contains fill-in evidence documents, not pre-approved decisions. `FULL_PROMPT_PACK.md` is a convenient reading copy; it is not a request to execute every phase.

**Do not run both old and new master prompts.** Once Version 3 is adopted, use it as the instruction baseline and retain earlier project decisions as evidence to review, not as silently overridden assumptions.

## Current project review

The repository audit and proposed next slice are in [../migration/PROGRESS.md](../migration/PROGRESS.md). Audit evidence does not imply architecture approval or application readiness.


---

<!-- Source file: START_HERE.md -->

# Copy-and-paste messages

## 1. First message: audit only

```text
Read docs/business_platform_prompt_pack_v3_complete/MASTER_PROMPT.md,
docs/business_platform_prompt_pack_v3_complete/ARCHITECTURE_DECISION_GATE.md,
docs/business_platform_prompt_pack_v3_complete/OWNERSHIP_AND_DEPENDENCIES.md, and
docs/business_platform_prompt_pack_v3_complete/PHASE_00_AUDIT.md.

Inspect my actual old project and run Phase 00 only.
The target stack is NestJS, React, TypeScript, and PostgreSQL.

Do not change application code, install or upgrade dependencies,
modify database records, or switch live routes in this phase.
Documentation and safe read-only inspection are allowed.

Identify existing business rules, permissions, schemas, integrations,
legacy compatibility, and the single authoritative owner of each record.

Evaluate which boundaries need separate deployments. A phase does not
automatically become a microservice. Evaluate the identity provider,
gateway, ORM, and event transport before committing to them.

Create the audit, feature map, ownership/dependency map, architecture
decisions, migration/reconciliation/rollback plan, and slice backlog.
Separate observations from recommendations and unverified assumptions.

Do not infer details from an architecture image or invent source access.
List genuine blockers. Show the proposed Phase 01.1 work and stop for approval.
```

## 2. After approving the audit: start the first Auth slice

```text
Read docs/business_platform_prompt_pack_v3_complete/MASTER_PROMPT.md,
docs/business_platform_prompt_pack_v3_complete/PHASE_01_AUTH.md, the approved audit and decisions,
and docs/migration/PROGRESS.md.

Implement approved slice 01.1 only.
Use the approved identity engine and deployment topology.
Do not create every future service or add unapproved infrastructure.

Before editing, name the files and behavior this slice changes.
Preserve existing supported behavior and compatibility.
Run the relevant checks and record actual results.
Update the feature map, acceptance report, and PROGRESS.md.
Stop before slice 01.2 and wait for approval.
```

## 3. Continue or authorize a different slice

```text
Read the Version 3 master prompt, the active phase file, the approved
audit/decisions, and docs/migration/PROGRESS.md.

Active phase file: [EXACT FILE]
Authorized slice: [EXACT SLICE ID]
Approved rollout scope: [LOCAL / STAGING / SEPARATELY AUTHORIZED PRODUCTION SCOPE]

Implement only that slice. Recheck actual repository state and previous
acceptance evidence. Reuse existing completed work; do not regenerate it.

Apply the service decision gate before adding a deployable application.
Apply contract conventions and the release checklist where relevant.
Report PASS / FAIL / NOT RUN with evidence. Record blockers and approved
deferrals separately. Stop at this slice boundary.
```

Replace bracketed fields before submitting. A local implementation instruction never authorizes live payments, real mass notifications, destructive migrations, or production routing changes.

## 4. Review before accepting a slice

```text
Review the completed slice against its acceptance criteria and
docs/business_platform_prompt_pack_v3_complete/RELEASE_CHECKLIST.md. Do not add features.

Check source-to-target behavior, tenant/permission isolation, financial
or approval invariants, API/event compatibility, migration safety,
independent deployability where applicable, and actual test evidence.

Report findings with severity, affected files, reproducible evidence,
and required fixes. Distinguish observed defects from risks not yet tested.
Do not mark the slice complete while required checks remain failing or unrun.
```

## 5. Resume in another coding-agent session

```text
Read docs/business_platform_prompt_pack_v3_complete/MASTER_PROMPT.md, the current phase file,
docs/migration/PROGRESS.md, its linked acceptance report, and approved ADRs.

Confirm the real repository state, active slice, outstanding blockers,
and next authorized action. Do not assume prior chat claims are test evidence.
Continue only the already-authorized unfinished work. Do not move to the
next slice or recreate existing services without approval.
```


---

<!-- Source file: MASTER_PROMPT.md -->

# Business Platform Master Prompt - Version 3
## NestJS + React + PostgreSQL
## Clean Frontend System + Clean Backend Architecture

You are restructuring my existing business platform.

Work on the real repository. Do not generate a replacement project from assumptions.

The required technology stack is:

- Backend: NestJS + TypeScript
- Frontend: React + TypeScript
- Database: PostgreSQL
- API: REST + OpenAPI
- Frontend server-state: TanStack Query
- Forms: React Hook Form + approved schema validation
- Styling: Tailwind CSS + reusable design tokens
- Component foundation: shadcn/ui or the approved existing component library
- ORM/database access: Prisma unless Phase 00 approves another suitable option

The system must be clean, scalable, reusable, easy to maintain, and safe to migrate from the existing project.

A development phase is not automatically a microservice. Separate business responsibilities first. Create an independently deployed microservice only when the architecture decision gate justifies it.

---

# 1. Permanent implementation rules

## 1.1 Inspect before changing

Before modifying a module:

1. Inspect the existing source code.
2. Inspect routes, controllers, database tables, jobs, reports, imports, exports, permissions, and frontend workflows.
3. Record existing business rules.
4. Identify reusable existing code.
5. Identify duplicate or conflicting logic.
6. Preserve existing behavior unless a change is explicitly approved.
7. Do not invent missing requirements.

Do not rewrite working modules only because a different folder structure looks cleaner.

---

# 2. Frontend UI/UX direction

## 2.1 Overall UX

Build the web admin interface with a ChatGPT-inspired application layout and interaction quality.

This means:

- Clean and minimal visual hierarchy.
- Persistent left sidebar.
- Collapsible sidebar.
- Main content area with generous spacing.
- Clear page headers.
- Simple top actions.
- Smooth responsive behavior.
- Consistent dialogs, drawers, dropdowns, tables, forms, filters, tabs, notifications, and empty states.
- Keyboard-friendly navigation.
- Fast perceived performance.
- Light and dark mode support where approved.
- Khmer and English UI support.
- Consistent typography and spacing across every module.

Do not copy ChatGPT branding, logo, proprietary assets, or exact product screens.
Use the same design philosophy and interaction pattern, adapted to this business admin platform.

The application should feel like one product even though the backend contains multiple business modules.

---

# 3. Frontend application shell

Create one reusable application shell.

Recommended layout:

```text
┌───────────────────────────────────────────────────────────────┐
│ Sidebar                  │ Main Application Area              │
│                          │                                    │
│ Logo / Product           │ Page Header                        │
│ Company Switcher         │ ├─ Breadcrumb / title              │
│                          │ └─ Page actions                     │
│ Navigation               │                                    │
│ ├─ Dashboard             │ Page content                       │
│ ├─ HR                    │                                    │
│ ├─ Finance               │                                    │
│ ├─ CRM                   │                                    │
│ ├─ Property              │                                    │
│ ├─ Valuation             │                                    │
│ └─ Settings              │                                    │
│                          │                                    │
│                          │                                    │
│ User / Settings          │                                    │
└───────────────────────────────────────────────────────────────┘
```

Use the same shell for all business modules.

Do not create different sidebars or unrelated layout systems for HR, Finance, CRM, Property, or Valuation.

---

# 4. Frontend folder structure

Use feature-first organization with a small shared foundation.

Recommended structure:

```text
apps/
└── web/
    └── src/
        ├── app/
        │   ├── App.tsx
        │   ├── router/
        │   │   ├── index.tsx
        │   │   ├── routes.ts
        │   │   └── route-meta.ts
        │   ├── providers/
        │   │   ├── AppProviders.tsx
        │   │   ├── QueryProvider.tsx
        │   │   ├── ThemeProvider.tsx
        │   │   ├── AuthProvider.tsx
        │   │   └── I18nProvider.tsx
        │   ├── layouts/
        │   │   ├── AppShell.tsx
        │   │   ├── AuthLayout.tsx
        │   │   └── FullscreenLayout.tsx
        │   ├── guards/
        │   │   ├── RequireAuth.tsx
        │   │   ├── RequirePermission.tsx
        │   │   └── RequireCompany.tsx
        │   └── config/
        │
        ├── features/
        │   ├── auth/
        │   ├── organization/
        │   ├── locations/
        │   ├── hr/
        │   │   ├── employees/
        │   │   ├── attendance/
        │   │   ├── leave/
        │   │   └── payroll/
        │   ├── finance/
        │   ├── payments/
        │   ├── customers/
        │   ├── property/
        │   ├── crm/
        │   ├── valuation/
        │   ├── sales/
        │   └── reporting/
        │
        ├── components/
        │   ├── ui/
        │   ├── forms/
        │   ├── data-display/
        │   ├── feedback/
        │   ├── navigation/
        │   └── shared/
        │
        ├── hooks/
        ├── lib/
        │   ├── api/
        │   ├── auth/
        │   ├── permissions/
        │   ├── dates/
        │   ├── money/
        │   ├── errors/
        │   └── utils/
        ├── stores/
        ├── types/
        ├── i18n/
        └── styles/
```

Do not create random top-level folders for every developer preference.

Do not put business-specific code inside `components/ui`.

---

# 5. Frontend feature structure

Each feature should follow the same predictable structure.

Example:

```text
features/hr/employees/
├── api/
│   ├── employee.api.ts
│   ├── employee.keys.ts
│   └── employee.types.ts
├── components/
│   ├── EmployeeForm.tsx
│   ├── EmployeeTable.tsx
│   ├── EmployeeStatusBadge.tsx
│   └── EmployeeFilters.tsx
├── hooks/
│   ├── useEmployees.ts
│   ├── useEmployee.ts
│   └── useEmployeePermissions.ts
├── pages/
│   ├── EmployeeListPage.tsx
│   ├── EmployeeCreatePage.tsx
│   └── EmployeeDetailPage.tsx
├── schemas/
│   └── employee.schema.ts
├── utils/
│   └── employee.formatters.ts
└── index.ts
```

Keep feature-specific components inside their feature.

Move a component into the shared component layer only when it is genuinely reusable across different features.

---

# 6. Reusable frontend component rule

Before creating any component:

1. Search for an existing component.
2. Reuse it if it already solves the requirement.
3. Extend it through props or composition when the extension remains generic.
4. Do not copy and rename the component.
5. Do not create nearly identical tables, dialogs, filters, form fields, pagination controls, or page headers.

Examples of components that should normally exist once:

```text
AppShell
Sidebar
SidebarItem
PageHeader
PageContainer
PageActions
DataTable
DataTableToolbar
DataTablePagination
SearchInput
FilterBar
DateRangeFilter
CompanyFilter
BranchFilter
StatusBadge
EmptyState
ErrorState
LoadingState
ConfirmDialog
FormDialog
Drawer
DetailSection
InfoRow
StatCard
FormField
AsyncSelect
LocationSelect
EmployeeSelect
CustomerSelect
MoneyInput
DatePicker
PermissionGate
FileUploader
DocumentList
AuditTimeline
```

Do not duplicate these inside HR, Finance, CRM, or Property.

Feature code supplies columns, actions, data, labels, and business behavior.

---

# 7. Avoid both duplication and over-abstraction

"Do not repeat code" does not mean create one giant component that supports every possible screen.

Follow this rule:

```text
Same visual pattern + same behavior
    → reuse the same component

Same visual pattern + small configurable differences
    → reuse through props/composition

Different business behavior
    → keep separate feature components

Repeated business logic
    → extract to a shared domain helper/use-case only when ownership is correct
```

Do not create components with dozens of boolean props such as:

```text
isEmployee
isCustomer
isFinance
isProperty
isCRM
isValuation
```

That is not clean reuse.

Prefer composition.

---

# 8. Shared design system

Define centralized design tokens.

Example:

```text
styles/
├── globals.css
├── tokens.css
└── typography.css
```

Centralize:

- Background colors.
- Surface colors.
- Border colors.
- Text colors.
- Muted text.
- Primary brand color.
- Success/warning/error colors.
- Radius.
- Shadows.
- Spacing.
- Typography.
- Sidebar width.
- Header height.
- Content maximum widths.

Do not hardcode arbitrary colors and spacing inside feature pages when a design token exists.

All modules must use the same:

- Button variants.
- Form controls.
- Dialog style.
- Table style.
- Badges.
- Tabs.
- Cards.
- Dropdowns.
- Tooltips.
- Loading skeletons.
- Error states.
- Empty states.
- Toasts.

---

# 9. Page pattern

Every admin list page should follow one structure:

```text
PageHeader
├── Title
├── Description / count
└── Primary actions

FilterBar
├── Search
├── Company / branch
├── Date range
├── Status
└── Feature-specific filters

Content
└── DataTable

Pagination
```

Example:

```tsx
<PageContainer>
  <PageHeader
    title="Employees"
    description="Manage employees and employment records."
    actions={<CreateEmployeeButton />}
  />

  <EmployeeFilters />

  <EmployeeTable />
</PageContainer>
```

Do not manually reproduce page title spacing, buttons, search boxes, or pagination on every page.

---

# 10. Form pattern

Use one consistent form architecture.

Forms should:

- Use React Hook Form.
- Use one approved schema-validation library.
- Share field components.
- Display server-side validation errors.
- Prevent duplicate submission.
- Show saving state.
- Warn when leaving with important unsaved changes where appropriate.
- Use permission-aware fields.
- Support keyboard navigation.
- Persist only approved draft behavior.

Recommended structure:

```text
FeatureForm
├── FormSection
│   ├── FormField
│   ├── AsyncSelect
│   └── DatePicker
├── FormSection
└── FormActions
```

Do not independently implement validation rules in five different React screens and backend endpoints.

Backend remains the authority for business validation.

---

# 11. Data table pattern

Create one reusable DataTable foundation.

Support:

- Server-side pagination.
- Server-side sorting.
- Server-side filtering.
- Search.
- Column visibility where approved.
- Row selection.
- Bulk actions where approved.
- Permission-aware actions.
- Loading state.
- Empty state.
- Error state.
- Export trigger.
- Responsive handling.

Do not download a huge dataset into the browser merely to filter it.

Do not create a completely new table component for every module.

---

# 12. Frontend API pattern

Use one HTTP/API client foundation.

Example:

```text
lib/api/
├── client.ts
├── errors.ts
├── pagination.ts
└── request-context.ts
```

Rules:

- Do not call `fetch()` randomly throughout components.
- Do not repeat authorization-header handling.
- Do not repeat error normalization.
- Do not repeat tenant/company context logic.
- Keep feature endpoint functions inside the feature's `api/` folder.
- Keep TanStack Query keys centralized per feature.
- Invalidate only relevant caches.
- Include authorized company/tenant scope in cache keys where required.
- Clear scoped caches on company switch.

Components should not understand low-level HTTP details.

---

# 13. Frontend state rules

Use:

- TanStack Query for server state.
- Local React state for local UI state.
- A small global store only for genuine cross-app client state.

Examples of appropriate global client state:

- Sidebar collapsed state.
- Theme.
- Current UI locale.
- Approved current-company selection if not fully URL/server controlled.

Do not place server entities such as all employees, invoices, properties, or customers into a giant global client store.

Do not use global state as a second database.

---

# 14. Frontend permissions

Use a reusable UI permission component:

```tsx
<PermissionGate permission="hr.employee.create">
  <CreateEmployeeButton />
</PermissionGate>
```

This only controls UX visibility.

The NestJS backend must always enforce the permission again.

Never treat frontend permission checks as security.

---

# 15. Responsive behavior

The admin system must work on:

- Desktop.
- Laptop.
- Tablet.
- Practical mobile administrative screens where required.

Sidebar behavior:

```text
Desktop:
Persistent sidebar, collapsible.

Tablet:
Collapsed sidebar by default.

Mobile:
Overlay drawer navigation.
```

Tables may transform to cards or use horizontal scrolling when appropriate.

Do not destroy information hierarchy merely to force every desktop table into a tiny screen.

---

# 16. Accessibility

Reusable components must support:

- Keyboard interaction.
- Visible focus.
- Correct labels.
- Accessible dialogs.
- ARIA only where needed.
- Adequate contrast.
- Screen-reader-friendly validation errors.

Use accessible component primitives where possible.

---

# 17. Backend architecture

NestJS backend must use a consistent feature-first modular structure.

Do not put all controllers in one folder, all services in another folder, and all repositories in another global folder.

Recommended application structure:

```text
apps/
└── hr/
    └── src/
        ├── main.ts
        ├── app.module.ts
        ├── config/
        ├── common/
        │   ├── auth/
        │   ├── errors/
        │   ├── logging/
        │   ├── pagination/
        │   └── validation/
        ├── database/
        │   ├── prisma/
        │   └── migrations/
        └── modules/
            ├── employees/
            ├── attendance/
            ├── leave/
            └── payroll/
```

Each module follows the same internal pattern.

---

# 18. Backend module pattern

Recommended structure:

```text
modules/employees/
├── employees.module.ts
├── presentation/
│   ├── employee.controller.ts
│   ├── employee.response.ts
│   └── dto/
│       ├── create-employee.dto.ts
│       ├── update-employee.dto.ts
│       └── list-employees.query.ts
├── application/
│   ├── use-cases/
│   │   ├── create-employee.use-case.ts
│   │   ├── update-employee.use-case.ts
│   │   ├── get-employee.use-case.ts
│   │   └── list-employees.use-case.ts
│   └── ports/
│       ├── employee.repository.ts
│       └── location-reader.ts
├── domain/
│   ├── employee.ts
│   ├── employee.policy.ts
│   ├── employee.errors.ts
│   └── value-objects/
├── infrastructure/
│   ├── persistence/
│   │   ├── prisma-employee.repository.ts
│   │   └── employee.mapper.ts
│   └── integrations/
└── tests/
```

Use this depth where the domain complexity justifies it.

For simple modules, reduce unnecessary ceremony while preserving the same direction:

```text
controller -> application/use-case -> repository/integration
```

Do not create architecture files that contain no meaningful behavior.

---

# 19. Backend dependency direction

Dependencies should flow inward.

```text
Controller / Transport
        ↓
Application Use Case
        ↓
Domain Rules
        ↓
Port / Interface
        ↑
Infrastructure Adapter
```

Domain and application logic must not depend directly on:

- HTTP request objects.
- React/frontend types.
- Prisma-generated database records as domain models.
- RabbitMQ-specific message objects.
- External provider SDK objects.

Adapters translate external representations into application/domain types.

---

# 20. Backend controller rules

Controllers should be thin.

Controller responsibilities:

- Parse HTTP input.
- Validate DTO.
- Obtain authenticated request context.
- Call one application use case.
- Map result to the API response.
- Return the correct HTTP status.

Controllers must not contain:

- Payroll calculations.
- Accounting logic.
- SQL queries.
- Complex authorization decisions.
- Large transaction workflows.
- Email/SMS provider logic.

---

# 21. Backend use-case rules

Application use cases coordinate business actions.

Example:

```text
CreateEmployeeUseCase
1. Verify authorized company/branch scope.
2. Validate referenced Organization IDs.
3. Validate business rules.
4. Create employee.
5. Persist employee.
6. Write required audit/outbox records in the transaction.
7. Return result.
```

Keep each use case focused on one business operation.

Avoid giant services such as:

```text
HrService
FinanceService
CrmService
```

with hundreds of unrelated methods.

---

# 22. Backend domain rules

Important business invariants should have one authoritative implementation.

Examples:

- Payroll approval rules.
- Leave balance rules.
- Invoice outstanding-balance rules.
- Valuation status transitions.
- Property reservation rules.
- Customer duplicate/merge rules.

Do not repeat the same rule in:

- Controller.
- Service.
- Background job.
- Export code.
- Frontend.

Expose reusable domain/application logic so every entry point follows the same rule.

---

# 23. Backend repository pattern

Repository interfaces belong to the application/domain boundary when needed.

Infrastructure owns Prisma implementation.

Example:

```ts
export interface EmployeeRepository {
  findById(id: string, scope: AccessScope): Promise<Employee | null>;
  save(employee: Employee): Promise<void>;
}
```

Do not create a useless generic repository such as:

```ts
GenericRepository<T>
```

for every table.

Use direct Prisma access inside a small simple module when abstraction adds no benefit, but keep database calls out of controllers.

For important domains and external-service boundaries, use explicit ports/interfaces.

---

# 24. PostgreSQL and schema rules

Each authoritative owner controls its schema/migrations.

Use:

- Foreign keys inside the same data boundary.
- Unique constraints.
- NOT NULL constraints.
- CHECK constraints where appropriate.
- Transactions.
- Proper indexes based on actual queries.
- NUMERIC for monetary values.
- Timestamp/date types deliberately.
- Soft-delete only where the business requires history; do not use it automatically everywhere.

Do not rely only on application validation when PostgreSQL can safely enforce an invariant.

Do not create database triggers for ordinary business logic unless there is a documented reason.

---

# 25. Backend shared code

Create shared backend packages only for technical cross-cutting concerns.

Acceptable examples:

```text
packages/
├── contracts/
├── observability/
├── nest-auth/
├── testing/
└── config/
```

Do not create:

```text
packages/common-business/
```

containing Employee, Customer, Invoice, Property, Payroll, and CRM models shared by every service.

That creates hidden coupling.

Business ownership stays with the responsible module/service.

---

# 26. API contract rules

Use consistent response and error conventions.

Do not unnecessarily wrap every API response in multiple generic levels.

Define consistent:

- Pagination.
- Validation errors.
- Forbidden responses.
- Not found.
- Conflict.
- Idempotency.
- Optimistic concurrency where required.
- Correlation ID.
- Request tracing.

Generate or maintain OpenAPI definitions from the backend.

Frontend types may be generated from approved API contracts if the chosen tooling is stable and controlled.

Do not manually duplicate the same API schema in multiple places when code generation or an approved contract package can safely avoid it.

---

# 27. Error handling

Create one backend exception/error mapping policy.

Domain errors remain meaningful:

```text
EmployeeNotFound
LeaveBalanceInsufficient
PayrollAlreadyApproved
InvoicePeriodLocked
PropertyAlreadyReserved
```

Transport maps these to appropriate HTTP responses.

Do not expose internal stack traces, SQL errors, Prisma internals, secrets, or provider credentials to users.

Frontend should receive normalized errors it can display consistently.

---

# 28. Logging and observability

Every service/application should use the same technical logging conventions.

Include:

- Request/correlation ID.
- Service/module.
- Operation.
- User/service actor where safe.
- Tenant/company context where safe.
- Duration.
- Error classification.

Do not log:

- Passwords.
- OTP values.
- Access/refresh tokens.
- Full salary data unnecessarily.
- Bank secrets.
- Sensitive identity documents.

Separate:

- Technical logs.
- Business audit.
- Metrics.
- Traces.

---

# 29. Backend authorization pattern

Create a consistent authorization mechanism.

Example flow:

```text
Authentication
      ↓
Request Context
      ↓
Permission / Scope Guard
      ↓
Application Use Case
      ↓
Domain-specific authorization/business rule
```

Reusable infrastructure may evaluate:

- Permission name.
- Tenant membership.
- Company scope.
- Branch scope.

The business module still decides record-specific rules.

Do not repeat manually written authorization code in every controller.

---

# 30. Shared request context

Use one typed request context.

Example:

```ts
type RequestContext = {
  actorId: string;
  tenantId: string;
  companyId?: string;
  branchIds: string[];
  permissions: string[];
  authStrength: string;
  correlationId: string;
};
```

Do not pass raw request objects deeply into application/domain layers.

Do not trust company or branch IDs simply because the frontend sent them.

---

# 31. Backend validation

Use consistent DTO/schema validation at boundaries.

Then validate business invariants inside the application/domain layer.

Example:

```text
DTO validation:
- string format
- required fields
- date format
- number ranges

Business validation:
- branch belongs to company
- employee cannot have overlapping active contract
- period is not locked
- user can approve this payroll run
```

Do not confuse input validation with business authorization.

---

# 32. Transactions

A transaction should cover one owner's atomic business operation.

Example:

```text
Create invoice
├── invoice
├── invoice lines
├── ledger posting
├── audit reference
└── outbox event
```

where all of those belong to Finance.

Do not create a distributed transaction across HR + Finance + Payments.

Use explicit integration workflow, idempotency, and compensation when crossing service boundaries.

---

# 33. Testing structure

Frontend:

```text
component tests
feature tests
critical browser E2E
```

Backend:

```text
unit tests for business rules
use-case tests
real PostgreSQL integration tests
API tests
contract tests
```

Shared UI components should be tested once for their generic behavior.
Feature tests should test feature-specific configuration/behavior.

Do not duplicate the same low-level component test in every feature.

---

# 34. Naming conventions

Use predictable names.

React:

```text
EmployeeListPage
EmployeeTable
EmployeeForm
useEmployees
employeeApi
employeeSchema
```

NestJS:

```text
EmployeesModule
EmployeeController
CreateEmployeeUseCase
EmployeeRepository
PrismaEmployeeRepository
```

Avoid:

```text
Helper
Utils2
CommonService
ManagerService
DataService
BaseService
NewEmployeeService
FinalEmployeeService
```

unless the name accurately represents a narrow responsibility.

---

# 35. Code-quality rules

Before adding code:

1. Search for an existing implementation.
2. Reuse or extend if ownership and behavior match.
3. Do not copy-paste logic between modules.
4. Remove obsolete duplicate code only after verified migration.
5. Keep files focused.
6. Avoid extremely large components/controllers/services.
7. Avoid premature abstractions.
8. Avoid circular imports.
9. Enforce import boundaries with ESLint/CI.
10. Use strict TypeScript.

If a repeated pattern appears in at least two meaningful places and has the same semantics, consider extraction.

Do not extract code merely because two lines happen to look similar.

---

# 36. UI acceptance checklist for every feature

A frontend feature is not complete unless:

- It uses AppShell.
- It uses shared PageHeader/PageContainer.
- It uses shared buttons/form controls.
- It uses shared dialog/drawer primitives.
- It uses the shared DataTable when appropriate.
- It uses the same loading/empty/error states.
- It follows responsive behavior.
- It supports approved localization.
- It respects permission visibility.
- It handles server errors.
- It has no obvious duplicate component implementation.
- It persists data after refresh.
- It has no fake buttons or placeholder metrics.

---

# 37. Backend acceptance checklist for every module

A backend module is not complete unless:

- Ownership is clear.
- Routes are documented.
- Controller is thin.
- Business rules have one authoritative implementation.
- Authorization is enforced server-side.
- Database constraints are reviewed.
- Important operations are transactional.
- Idempotency/concurrency is handled where needed.
- Errors use the common error policy.
- Logs use common observability.
- Tests cover permissions and business rules.
- No direct writes occur to another service's database.
- No duplicate implementation of shared technical concerns exists.

---

# 38. Refactoring old frontend code

When migrating an old screen:

1. Capture its existing business behavior.
2. Separate business logic from presentation.
3. Identify duplicated UI.
4. Replace duplicate primitives with shared components.
5. Preserve the workflow unless redesign is approved.
6. Move API access into feature API files.
7. Move server data into TanStack Query.
8. Remove obsolete duplicate implementation only after parity tests pass.

Do not redesign every screen at the same time as changing its business behavior.

---

# 39. Refactoring old backend code

When migrating an old backend module:

1. Inspect controller/service/model/query/jobs.
2. List every business rule.
3. Identify duplicated rules across controllers, exports, jobs, and reports.
4. Select one authoritative implementation.
5. Create the new NestJS module/use cases.
6. Add PostgreSQL constraints.
7. Add compatibility adapter where legacy callers still exist.
8. Migrate safely.
9. Reconcile results.
10. Remove old paths only after approved cutover.

---

# 40. Required first frontend foundation slice

Before developing multiple business screens, build the reusable frontend foundation:

```text
AppShell
Sidebar
Sidebar collapse/mobile drawer
Header
CompanySwitcher
UserMenu
PageContainer
PageHeader
PageActions
Button/Input/Select/Textarea
FormField
Dialog
Drawer
Dropdown
Tabs
Badge
DataTable
Pagination
SearchInput
FilterBar
DateRangeFilter
LoadingState
EmptyState
ErrorState
ConfirmDialog
PermissionGate
Toast
Theme system
i18n foundation
API client
query provider
error normalization
```

Do not spend months building a design system before business features.

Build only the primitives required for the first approved feature, but ensure each primitive is reusable.

---

# 41. Required first backend foundation slice

Before implementing many domains, establish:

```text
Configuration
Environment validation
Database connection
Migration strategy
Request context
Authentication integration
Authorization guards/policies
Validation
Global error mapping
Pagination conventions
Logging/correlation
Health/readiness
OpenAPI
Testing foundation
```

Then implement the first real business workflow.

Do not create empty modules for all future services.

---

# 42. Recommended migration order

Follow the approved sequence:

```text
00 Audit and architecture decisions

01 Auth and Access

02 Shared Platform Core
   ├── Organization
   ├── Location
   ├── Documents
   ├── Notifications
   └── Audit

03 HR
   ├── Employees
   ├── Attendance
   ├── Leave
   └── Payroll

04 Finance / Accounting
   ├── Accounting foundations
   ├── Billing
   ├── Receivables / Payables
   └── Reports

05 Payments

06 Customer & Contact

07 Property & Listings

08 CRM

09 Property Valuation

10 Sales & Contracts

11 Reporting & Analytics

12 Validation and staged cutover
```

Implementation phase does not equal deployment count.

---

# 43. Required behavior from the coding agent

For every approved slice:

Before coding, output:

```text
1. Existing behavior found
2. Files/modules involved
3. Reusable components/services found
4. Duplicate code found
5. Proposed refactor
6. Database/API changes
7. Risks
8. Tests to run
```

Then implement only that slice.

After coding, output:

```text
1. What changed
2. Reusable components created/reused
3. Backend patterns used
4. Migrations created
5. Compatibility impact
6. Tests actually run
7. PASS / FAIL / NOT RUN
8. Known remaining issues
9. Next proposed slice
```

Do not claim completion when required tests were not executed.

Stop before moving to the next slice.

---

# 44. Non-negotiable rules

Never:

- Create the same UI component separately for each module when one reusable component fits.
- Copy business rules into several services.
- Put business logic in controllers.
- Put SQL in React.
- Call another service's database directly.
- Trust frontend permissions.
- Hardcode tenant/company IDs.
- Build giant "CommonService" classes.
- Build giant generic frontend components with dozens of mode flags.
- Add infrastructure without an actual requirement.
- Replace working features without auditing them.
- Run destructive production migrations without approval.
- Claim a test passed when it was not run.

Always:

- Prefer composition.
- Prefer feature ownership.
- Prefer explicit contracts.
- Prefer one authoritative implementation of each business rule.
- Prefer a consistent product shell.
- Prefer reusable UI primitives.
- Prefer predictable backend modules.
- Prefer the simplest architecture that satisfies the real requirement.


---

<!-- Source file: ARCHITECTURE_DECISION_GATE.md -->

# Architecture Decision and Service-Readiness Gate

Read with the master prompt before adding a deployment, database boundary, identity engine, gateway, or broker. A decision to retain a module is valid; do not invent operational benefits to justify extraction. [S01]

## Gate A - Business boundary

Record in `docs/migration/decisions/` using `templates/ADR_TEMPLATE.md`:

1. The capability and its business owner, authoritative records, allowed state transitions, and consumers.
2. The invariants that must commit atomically, such as balanced ledger posting or exclusive active property reservation.
3. The actual dependency graph and expected call volume for important user journeys.
4. The separation benefit: independent release, different load, security isolation, operational ownership, or a proven integration boundary.
5. The cost: deployments, migrations, secrets, network failures, synchronization, observability, backups, and on-call work.
6. Whether the current team and hosting can operate that cost. Do not assume a dedicated team or hosting capacity that has not been confirmed.

If functions constantly call each other or always need coordinated data/schema releases, reconsider the split. A department name, menu, table, or CRUD endpoint is not enough to justify a service.

## Gate B - Compare deployment choices

| Choice | Required documentation |
|---|---|
| Isolated module inside an existing NestJS app | Owning module, private repositories, public internal interfaces, schema/table ownership, intentional shared transactions/FKs, and potential future extraction work. |
| Independent NestJS service | All module requirements plus its artifact, private data access, API/event contracts, service identity, failure policy, deployment, supported version combinations, monitoring, recovery, and migration plan. |

Within one deployment, do not add HTTP loops or a broker solely to simulate microservices. Across deployment boundaries, do not bypass contracts through shared ORM clients or direct database access. Independently deployed services must not depend on an atomic transaction across their databases.

Record `RETAIN MODULE`, `EXTRACT SERVICE`, or `DEFER DECISION`, with reasoning and approval. Revisit when actual needs change; do not scaffold the future deployment immediately.

## Gate C - Authentication engine

Compare the existing suitable identity system, at least one maintained provider candidate when relevant, and an application-managed option. Assess MFA/passkeys, recovery, session revocation, OIDC/browser/mobile compatibility, migration, tenant policy, availability, operating effort, and total cost. A provider such as Keycloak is a candidate, not a silent requirement. [S09]

Select one credential authority. Identify where platform memberships and scoped grants live; avoid a second competing editable authority. With OIDC, document issuer/subject mapping, approved flows, audience checking, redirect validation, assurance claims, and logout/revocation semantics. Do not infer a verified identity from email matching.

If application-managed authentication is chosen, record the maintenance/security responsibility and required review. The NestJS requirement does not require building authentication protocols from scratch.

## Gate D - Gateway and transport

Evaluate existing ingress/reverse-proxy/hosting capabilities before adding a custom gateway. Add a BFF only for a specific browser-session or composition responsibility, with its own failure and security design. No payroll, ledger, or approval logic in the gateway. [S02]

For every integration choose in-process interface, synchronous API, or durable asynchronous processing. Record immediate consistency needs, acceptable delay, timeouts, retry safety, and expected failure behavior. Use a broker only when justified. A durable background job and a cross-service domain event are different contracts. [S21]

Do not deploy both RabbitMQ and a separate queue stack without separate, demonstrated requirements. Redis caches must not become the only copy of durable invoices, payroll, or critical workflow progress.

## Gate E - Readiness before an independent service release

Provide evidence that the service:

- Builds into its own artifact and can deploy with supported existing consumer versions.
- Owns its schema/migration lifecycle without another service changing its private tables.
- Enforces authorization and tenant scope even when bypassing the public gateway is attempted.
- Has defined deadlines, safe retries, bounded worker/pool sizes, and outage behavior.
- Handles contract versions, duplicates, out-of-order events, and replay as applicable.
- Provides useful health, logs, metrics, traces, and operator recovery instructions.
- Can restore its data and reconcile effects that cross service boundaries.
- Passes the applicable `RELEASE_CHECKLIST.md` checks with real evidence.

A service can need other services to perform a business transaction without needing them to deploy in lockstep. Independence does not mean the entire platform works with every dependency offline.

## Output

Return the approved boundary, alternative rejected or deferred, decision evidence, resulting code/database layout, supported contract versions, required tests, and the first small vertical slice. Do not proceed with unapproved structural changes.


---

<!-- Source file: OWNERSHIP_AND_DEPENDENCIES.md -->

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


---

<!-- Source file: API_EVENT_CONVENTIONS.md -->

# API, Event, and Integration Conventions

Apply only where the active slice exposes a contract or performs asynchronous processing. Do not turn these conventions into a requirement to add a broker to every module.

## API contracts

Use documented REST/OpenAPI and the approved public routing namespace. Example logical routes: `/api/v1/hr/employees`, `/api/v1/locations/provinces`, `/api/v1/finance/invoices`. Actual identity-provider protocol endpoints may differ; do not rewrite provider protocols to imitate application CRUD.

Document request/response schemas, field sensitivity, authorization, validation, status codes, pagination, sorting, date/time zone, currency, and concurrency behavior. Use stable machine-readable error codes plus safe messages and a correlation ID. Keep internal stack traces, SQL, and secrets out of errors.

Tenant/company parameters select an authorized context; they never grant access. Enforce resource scope for nested and indirect IDs, searches, totals, exports, and uploads. Server-side allowlists constrain filters and sort fields. Bound page sizes and bulk request sizes.

A successful asynchronous request returns an accepted/pending state and a status reference, not a completed business outcome. Do not label a payment paid or an email delivered merely because a job was queued.

Use explicit optimistic versions or locking where concurrent edits matter. Approval commands must identify the reviewed record/version. On conflicts, return a clear safe failure; do not silently overwrite newer work.

## Idempotency

For retriable business commands, persist an idempotency key scoped to the operation and authorized tenant/caller context, with a request fingerprint, durable state, and result reference. Reject reuse with a different material payload. Serialize or otherwise protect concurrent duplicates.

Choose key retention from the business retry window. Permanent uniqueness of operations such as payroll posting or provider confirmation must not depend solely on a short-lived key cache. Identify the underlying unique business reference.

A timeout may occur after the owner committed. Callers must reconcile or retry the same operation identity, not automatically create a new charge, invoice, or case.

## Synchronous calls

Choose a bounded timeout/deadline, retryable error classes, maximum retry attempts, and jittered backoff where needed. Retry only safe/idempotent operations. Avoid retries at every layer that multiply traffic. Propagate correlation context without forwarding unnecessary bearer credentials or private data.

Document which user operations fail, remain readable from local data, or enter pending state during dependency outages. Do not use cached permissions to allow sensitive actions beyond the approved freshness policy. Circuit breakers/bulkheads are options when the dependency behavior warrants them, not a mandatory framework for each call. [S21]

## Domain events

A command requests work from an owner. A domain event states a fact already committed by its owner. Keep names specific, such as `hr.payroll.approved.v1`, rather than broadcasting generic unrestricted database rows.

The approved envelope should define: event ID, type/schema version, source, aggregate ID and version or relevant sequence, occurred time, correlation/causation IDs, authorized tenant/company context where applicable, and minimal payload. Global public Location dataset events need an explicit separate scope/schema; do not represent them by a fake universal tenant ID.

Authenticate publishers/consumers and restrict channels by service and data sensitivity. Treat envelope context as assertions to validate against producer authorization, not arbitrary permission grants. Keep salary details, bank data, credential secrets, and unnecessary PII out of general-purpose topics.

Producer: commit the owner update and outgoing record together; use a durable outbox or approved equivalent. Consumer: atomically apply its own database effects and deduplication marker, then acknowledge. External side effects need their own durable operation identity and reconciliation; a local transaction cannot atomically include an external bank. [S06]

When using RabbitMQ, configure appropriate durable topology, publication confirmation, unroutable-message handling, consumer acknowledgements, bounded prefetch, retry/dead-letter policies, and redelivery tests. A publisher confirm and a consumer acknowledgement cover different stages. [S07]

Handle duplicates, gaps, and out-of-order delivery according to domain semantics. Do not globally drop older events merely because a later timestamp was seen. A delta event may require sequence recovery. Do not assume ordering across publishers, queues, or retry paths.

Keep dead-letter payloads protected. Authorized replay must preserve event identity, produce audit evidence, and not bypass business approval or re-execute historical live payments.

## Versioning and compatibility

Publish contracts with supported producer/consumer versions and a deprecation plan. Prefer compatible additions, but test the actual serializers/clients; adding fields or enum values is not universally safe. Keep supported older consumers working until their retirement is approved.

Use consumer contract tests and a mixed-version integration matrix. Do not solve a contract mismatch by requiring all unrelated services to deploy simultaneously. Shared TypeScript packages must not expose private models or force lockstep upgrades.

## Projections and bootstrap

For Location and Reporting, define a consistent snapshot plus checkpoint/watermark, then replay changes without loss or double counting. Record applied versions, gaps, lag, and resynchronization actions. Handle merges, deletions/retirement, corrections, and reversals explicitly.

Local projections are read-only copies, not alternate master data. Consumers must not synchronously ask the master for a label on every returned row. Make stale data visible where it affects decisions. [S05]

## Integration contract acceptance

Test validation and scope, duplicate commands, changed-payload key reuse, concurrent writes, timeout after commit, unsupported versions, duplicate/out-of-order events, consumer crash before acknowledgement, publication outage, restricted data access, bootstrap races, and safe replay. Record actual results, including NOT RUN.


---

<!-- Source file: RELEASE_CHECKLIST.md -->

# Per-Slice Release Checklist

Apply from the first releasable slice. Phase 12 consolidates evidence; it is not the first security, migration, or operations review.

For each applicable check record PASS, FAIL, or NOT RUN with command/environment/evidence. A check may be N/A only with a written reason and reviewer acceptance. A required failed or unrun check blocks the release of that scope. Approved deferral changes scope explicitly; it does not turn a missing feature into a passing test.

## 1. Scope and working behavior

- The exact slice, tenant group, environment, source revision, configuration, and allowed rollout are recorded.
- Existing behavior is mapped to source evidence and regression tests; proposed changes are separately approved.
- Backend, persistence, permissions, and required React flow work together. Loading/errors/forbidden/retry paths exist.
- No mock provider success, fake totals, unrestricted seed accounts, or placeholder buttons are represented as working production features.

## 2. Architecture and release independence

- A deployment decision exists for every new service; modules are not misrepresented as independent services.
- An independent service has its own build artifact, reproducible deployment, runtime identity, configuration, migrations, and data ownership.
- It can deploy with the documented supported versions of consumers/producers. Mixed-version contract tests pass.
- Shared packages do not expose private ORM/repositories or force unrelated applications to redeploy.
- No unauthorized cross-service database reads/writes or circular synchronous dependency was introduced.

## 3. Security and isolation

- Authentication, required MFA/assurance, session revocation, and scoped authorization are tested at the actual APIs.
- Two-tenant and multi-branch tests cover details, lists, search, counts, mutation, indirect links, files, jobs, and exports.
- Credential recovery/replacement and sensitive actions cannot bypass the approved MFA/permission policy.
- Service credentials and internal endpoints reject unauthorized actors/context; admin authority cannot be self-escalated.
- Secrets/PII are redacted. CORS, CSRF, cookies, upload validation, private storage, and current dependencies are reviewed.
- RLS, when used, is tested with real runtime roles and pooled transaction context, not only a superuser test connection.

## 4. Database and migration safety

- Fresh setup and upgrade from a sanitized legacy fixture are tested using real PostgreSQL.
- Migrations are reviewed for lock duration, existing-version compatibility, backfill/reconciliation, and failure behavior.
- Expand/contract staging and the removal window are explicit. Old columns/tables are not removed while supported versions still use them.
- Record counts, identifiers, dates, relationships, snapshots, and material financial totals are reconciled.
- Source-to-target mapping and ambiguous-record handling are traceable; there is one authoritative writer at cutover.
- Financial invariants, decimal rounding, period locks, approval versions, and concurrency are tested where applicable.

## 5. Reliability and resource budget

- HTTP deadlines, retries, worker concurrency, queue limits, and dependency outage behavior are configured and tested.
- Database pools are explicitly sized. Account for every process, worker, and planned replica; reserve capacity for maintenance and operations. Do not approve a service count whose aggregate pools exceed the database budget.
- Rate limits, pagination, uploads, and exports cannot let one tenant exhaust the entire application unchecked.
- Critical events have durable publication, deduplication, bounded retry, dead-letter review, and safe replay/reconciliation.
- Shutdown drains traffic/jobs safely. Liveness does not restart an otherwise healthy process merely because an optional remote dependency is down; readiness reflects the requests the instance can safely serve. [S20]

## 6. Observability and measured performance

- Structured redacted logs, correlation IDs, useful metrics, and critical cross-service traces are available. [S17]
- Alerts have an owner and an action: failed postings, provider mismatches, queue lag, error rate, slow endpoints, or broken synchronization.
- Latency/throughput/error/queue-lag targets are agreed for the actual workload. Report measured results with dataset, concurrency, hardware, and duration.
- Slow queries are inspected and indexes justified. Ordinary address display does not cause per-row Location HTTP calls.
- Reporting displays freshness, and health/metrics interfaces do not leak private tenant or payroll data publicly.

## 7. Recovery and side effects

- Backups are restored into a separate environment and verified. Include files, relevant configuration, and access to required encryption keys under an approved secure recovery plan.
- Recovery point and recovery time objectives are explicit and tested to the extent of the approved scope; do not claim unmeasured guarantees.
- Restoring/replaying a domain cannot blindly repeat charges, payouts, mass notifications, or approvals. Reconcile with external providers and downstream operation IDs.
- Rollback after new writes is documented, including forward repair or reverse reconciliation where necessary. A route switch alone is not a data rollback.
- Sensitive HR/accounting data is accepted by the appropriate business reviewer; authentication/security concerns have the required review.

## 8. Approval and evidence

Update `docs/migration/acceptance/`, `PROGRESS.md`, the feature map, and ADRs. Include test commands, relevant artifacts, failures, unrun checks, provider environment, reconciliation results, approved exclusions, and exact rollback conditions.

Do not interpret a coding-agent success message or a checklist with unchecked boxes as approval. Record the human decision for the specific rollout. No production action without explicit authorization.


---

<!-- Source file: PHASE_00_AUDIT.md -->

# Phase 00 - Repository Audit and Architecture Decisions

Read `MASTER_PROMPT.md`, `ARCHITECTURE_DECISION_GATE.md`, and `OWNERSHIP_AND_DEPENDENCIES.md`. Perform Phase 00 only. Application code and databases are read-only. Documentation and safe local inspection are allowed; package installation/upgrades, migrations, outbound integrations, and production changes are not authorized.

## Objective

Determine what the actual project does, what must be preserved, and which structure is justified. Missing source or schema is a blocker to conclusions that depend on it. Do not infer legacy versions, features, data volume, team size, hosting, or performance from earlier architecture pictures.

## Step 00.1 - Inventory and evidence

Inspect manifests/lockfiles, backend modules, routes, controllers, policies, migrations, database constraints, models, scheduled jobs, queues, imports/exports, print templates, upload handling, frontend screens, and deployment configuration. Record real source paths. Do not reproduce secret values.

Identify the repositories/applications actually in scope, current frameworks and databases, external/mobile clients, auth methods, company/branch isolation, critical reports, financial/approval workflows, and integration dependencies. Run only safe existing baseline checks that do not modify data or contact live services; record limits and NOT RUN where applicable.

## Step 00.2 - Business behavior and migration scope

Create a feature-preservation matrix with feature, source path/route, present behavior, owner/tables, permission scope, target owner, migration approach, acceptance test, and status. Include hidden business rules in jobs, SQL, exports, and history transitions.

Inspect applicable attendance reasons, offline/mobile behavior, leave/payroll formulas, invoice numbering/allocations, customer duplicate policy, CRM follow-up counting/filtering, valuation approvals/revisions, and Khmer/English behavior. Do not impose rules from unrelated projects. Classify observations, requested corrections, proposed enhancements, and unresolved assumptions separately.

Agree what is mandatory for each migration slice and what is optional. Do not expand an old system into a new recruitment suite, property-management suite, or AI product just because it appears adjacent to the domain.

## Step 00.3 - Boundary and technology decisions

For each logical capability, compare an isolated module with an independent service using the decision gate. Record the approved initial deployments and a dependency map. Identify transactional invariants that must stay within one owner. Do not require all domains to be extracted.

Evaluate the identity engine before credentials implementation. Include suitable maintained provider candidates and the application-managed alternative. Record browser/mobile flows, identity mapping, memberships/grants, recovery, revocation, MFA/step-up, and migration compatibility. Approve one source of truth.

Evaluate existing gateway/edge capabilities before a custom NestJS gateway/BFF. Select compatible stable runtime, backend/frontend, PostgreSQL, ORM/driver, and tooling versions from official sources. Preserve suitable existing tooling. Decide the initial database/role model, RLS scope, contract strategy, and whether the first integration actually needs a broker or Redis.

Document pool/concurrency budgets, expected hosting constraints, observability approach, and targets for the actual workload. Mark estimates as estimates; do not claim measured performance without measurements.

## Step 00.4 - Resolve sequence dependencies and define small slices

Preserve Auth -> Shared Core -> HR -> Finance as the intended build order.

- Auth starts with minimal Organization-owned company/branch identity and protected verification delivery. Expand these later without recreating IDs or a second login system.
- Define the Phase 02 minimum needed before employee CRUD, attendance, and payroll. Optional shared administration may remain in a reviewed backlog; essential authorization, integrity, and audit cannot.
- HR can calculate and approve payroll before Finance/Payments exists, but must record posting/payment pending and provide tested future contracts.
- Finance before Customer uses an approved legacy read adapter or immutable billing-party snapshots. Do not invent an editable customer master in Finance. Propose a dependency reorder when the safe bridge is unavailable.

Produce a slice backlog with ID, user outcome, prerequisites, changed owner, required UI/API, test evidence, migration scope, and stopping point. Each slice must be small enough to review and demonstrate independently; it need not be an independent service.

## Step 00.5 - Migration, release, and recovery plan

Plan sanitized fixtures, backup restoration, repeatable/resumable imports, source-to-target ID mapping, conflict quarantine, calculation/financial reconciliation, compatibility adapters, and single-writer cutover. Address source database differences explicitly rather than merely generating a new PostgreSQL schema.

Define staged release per authorized scope, supported contract/application version combinations, expand/contract migrations, late-write synchronization, and rollback after new writes. Do not describe rollback solely as routing to legacy. Historical import/replay must not send real messages or execute live money movement.

Apply the release checklist to each future release. Phase 12 is the final consolidation for the approved scope, not permission to delay tests, monitoring, or backups.

## Required outputs

Create these documents under `docs/migration/`:

- `00-audit.md` with evidence and baseline findings.
- `feature-preservation-matrix.md` and `legacy-to-postgresql-map.md`.
- `data-ownership.md` and `dependency-map.md`.
- `decisions/` with approved/proposed ADRs and explicitly unresolved choices.
- `slice-backlog.md` and `PROGRESS.md`.
- `cutover-and-rollback.md` and the per-slice acceptance plan.

Use the included templates as unfilled evidence structures. Proposals must not be labelled approved until the user approves them.

## Acceptance and stop

Every in-scope domain has source evidence or a stated access gap, a proposed owner, migration strategy, and test plan. Decisions on identity, deployment, gateway, database boundaries, and immediate dependencies are explicit. No application/database modifications have occurred.

Return the findings, proposed decisions, true blockers, and exact Phase 01.1 implementation plan. Stop for approval.


---

<!-- Source file: PHASE_01_AUTH.md -->

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


---

<!-- Source file: PHASE_02_SHARED_SERVICES.md -->

# Phase 02 - Shared Platform Core (Version 2)

Read MASTER_PROMPT.md, the approved Auth scope/report, Phase 00 decisions, and PROGRESS.md. Implement only the authorized slice. Keep the shared capabilities as separate modules inside `apps/core` initially; apply the decision gate before extracting any deployment. Do not create six applications for six modules. Apply RELEASE_CHECKLIST.md to each released scope.

## Minimum before HR versus optional administration

The Phase 00 backlog must identify which Core capabilities each HR slice needs. Build the minimum usable company/branch and location flow, required delivery/storage, and secure audit first. Do not wait for every advanced template editor, provider adapter, full document browser, or operational dashboard before employee CRUD. A capability needed to protect or preserve an actual operation is not optional.

Mark unfinished work explicitly as BLOCKED, IN PROGRESS, or APPROVED DEFERRED. Only the approved minimum scope can be accepted as complete when optional work remains. Starting HR requires approval that its real prerequisites are satisfied; it must not be represented as full Phase 02 completion.

## Step 02.1 - Organization

Expand the existing Organization-owned tenant/company/branch scaffolding without recreating IDs. Implement company and branch identity, status, address, branding, time zone/language preferences, approved module enablement, and lifecycle controls. Validate branch-company-tenant relationships.

Auth owns user access assignments. HR will own employee assignments, departments, positions/grades, managers, work shifts, and leave calendars. Do not equate a department with a CRM sales team. Module disablement hides/blocks access according to policy without deleting domain history.

Build Company and Branch administration screens and integrate the existing company switcher. Keep cross-company visibility explicit.

## Step 02.2 - Location and reference data

Implement countries and administrative areas, including Cambodia's province/capital, district/municipality/khan, commune/sangkat, and village hierarchy where supported by an authoritative dataset. Store stable internal IDs, separate official codes as strings, Khmer/English labels, parent relationships, active/retired state, source, and dataset version. Do not invent official location codes or force the same hierarchy on every country.

Provide public/authorized lookup routes under `/api/v1/locations`, administrator-controlled import/validate/publish routes, and authenticated internal snapshot/change-feed routes. Validate hierarchy and ambiguous source data before publishing. Ordinary tenant admins may select official locations but may not rewrite the shared catalog. Keep custom sales territories separate.

For the approved first independent consumer, implement versioned snapshot bootstrap, incremental updates, gap detection, idempotent application, resynchronization, and sync-health reporting. For co-deployed modules, use approved local reference queries or internal interfaces instead; do not replicate data just to imitate separate services. Support small cached dropdown responses and bulk lookups. Do not require one network request per row on HR/customer/property lists.

Organization owns its address details. HR/Customer/Property will own theirs. Issued invoices/reports retain snapshots. Location never stores a global collection of private employee/customer addresses.

## Step 02.3 - Documents

Implement private storage, metadata, tenant/entity associations, authorized uploads/downloads, versioning, file size/type validation, malware/quarantine workflow, and short-lived access links where appropriate. Validate access to the business record before granting file access, through its owning service or a current authorized policy projection. Merely knowing a file ID is insufficient.

Keep approval and retention decisions with the domain's rules; Documents supplies storage capability. Do not release unscanned restricted uploads in production by silently skipping unavailable scanning. Isolate development storage. Preserve existing document references and print-template assets during migration.

## Step 02.4 - Notifications

Replace/complete the Phase 01 delivery interface with email and in-app delivery first. Add existing SMS/Telegram adapters where configured. Implement localization, templates, user preferences, delivery attempts, bounded retries, dead-letter handling, and safe replay.

The approved identity engine (provider or Core Auth) generates/verifies its authentication challenges. Notification only delivers when it is that engine's configured delivery path. Do not maintain a second OTP validator in Notifications. Keep secret-bearing OTP messages out of general message history, application logs, long-lived outboxes, and unrestricted admin screens. Any transient secret payload must have protected access, short retention, and expiry so workers cannot send an expired verification as if it were valid.

A failed notification must not undo a completed payroll approval or payment. Distinguish queued, sent/accepted, delivered where provider-confirmed, and failed; do not label accepted provider requests as confirmed delivery without evidence.

## Step 02.5 - Audit and operational plumbing

Implement append-only business/security audit ingestion with actor/service, tenant/company, action, record reference, timestamp, correlation ID, approved reason, and redacted change details. Separate this from debugging logs and performance metrics. Protect access/retention; never store passwords, OTPs, tokens, or unnecessary payroll details.

For an approved reliable cross-service event integration, implement the selected transport with producer transactional outbox, consumer inbox/deduplication, appropriate publication confirmation, acknowledgment after durable processing, bounded retries, dead-letter handling, and replay authorization. Use RabbitMQ only when approved, not as a prerequisite for every Core module. For in-process modules, use internal interfaces; persist critical asynchronous work rather than assuming in-memory events survive a crash. Define event schemas, restricted channels, duplicate/out-of-order behavior, and a versioned contract registry. Share transport helpers, not business repositories. Critical business audit must be durably recorded with the owner operation or its outbox so a central audit outage does not silently lose evidence.

## Required screens and APIs

Platform Settings for Companies, Branches, Locations/Dataset Versions, Documents, Notification Templates/Delivery Status, and Audit History. Display failed jobs and reference-data synchronization status without exposing sensitive payloads. Use scoped server pagination/search, not full-table downloads.

## Acceptance tests

Test hierarchy validation, leading-zero codes, Khmer/English names, old area retirement, duplicate/out-of-order updates, snapshot rebuild, and continued display from local reference copies during a Core lookup outage. Where a separate HR database is approved, build the reusable consumer contract/test fixture for Phase 03; do not fabricate a completed HR integration. Test co-deployed local lookup behavior instead when that is the approved topology.

Test cross-tenant files, expired links, malicious file attempts, notification retries, expired OTP delivery, redaction, unauthorized geography editing, and branch-company mismatch. Prove repeated events do not duplicate business/audit processing unintentionally.

## Done and stop

Deliver the authorized slice's real UI/APIs, migrations, tests, adapters, operating instructions, and provider limitations. Demonstrate branch creation and valid location selection for the required HR path. Record approved optional deferrals explicitly. STOP at the slice boundary; moving to HR or another slice needs approval.

## Slice authorization guide

02.1 = Organization; 02.2 = Location; 02.3 = Documents; 02.4 = Notifications; 02.5 = Audit and the first required durable integration. Each includes the minimum required administration and tests. The approved slice backlog may deliver prerequisites earlier but must not duplicate ownership.

Keep document access based on the owner record and current authorization, not just a client-supplied owner ID or object-storage path. Apply privacy/retention rules to audit and notification metadata; general platform administrators do not automatically gain payroll-file or OTP access.

Reference guidance: [S05-S08, S10] in SOURCES.md.


---

<!-- Source file: PHASE_03_HR.md -->

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


---

<!-- Source file: PHASE_04_ACCOUNTING.md -->

# Phase 04 - AC / Finance and Billing (Version 2)

Read MASTER_PROMPT.md, approved architecture decisions, the actual financial source/rules, and the completed HR contracts. Implement only the authorized slice. Finance and Billing start as one coherent module group. Extract a Finance deployment only after its decision gate; a separate deployment owns its PostgreSQL database/role, migrations, contracts, and artifact. Apply the release checklist to each approved rollout.

## Objective and invariants

Finance owns invoices, financial obligations, allocations, accounting posting, and the authoritative invoice balance. HR owns payroll calculation. Payments owns verified money movement. This is not simply income/expense CRUD.

Use PostgreSQL NUMERIC and decimal-safe values across calculations, APIs, and exports. Define currency, scale, rounding, exchange-rate source/date, transaction currency, and functional currency. Never sum different currencies without a defined conversion basis. [S15]

## Step 04.1 - Financial foundations and posting

Implement company-scoped chart of accounts, journals, account/report mappings, financial periods, controlled period locking/reopening, numbering rules, and approved opening balances.

Implement posting in one Finance transaction with balanced debit/credit totals in the relevant ledger currency and valid accounts/period/company relationships. Protect every posting path, including imports and corrections. An ordinary row CHECK cannot prove a multi-line journal balances. Test the actual owner-level invariant and concurrent posting.

Posted entries are not ordinary editable/deletable CRUD. Use controlled reversal/adjustment with reasons, references, permission and applicable approval. Do not count migrated history and opening balances twice. Deliver the minimum ledger/posting UI and evidence before proceeding.

## Step 04.2 - Counterparties and the Customer bridge

Resolve this prerequisite before exposing customer billing. The Customer migration is Phase 06. Use the approved read-only legacy Customer adapter with stable references, or Finance-owned immutable billing-party details on a document with a nullable external reference. Do not create a second editable Customer master.

Finance may own accounting-specific counterparty settings such as credit terms without claiming ownership of universal contact identity. Document how Phase 06 resolves IDs/aliases. When no safe bridge exists, stop for an approved dependency reorder rather than inventing customers or reporting a fake integration.

## Step 04.3 - Invoices, vendor bills, and allocations

Implement draft validation, controlled issuance/posting, invoice lines, verified tax configuration, due dates/terms, credit notes, vendor bills, receivables/payables, allocations and balances. Keep document lifecycle, accounting-posting state and collection state distinguishable.

Support partial payments, overpayments/unapplied funds, credit notes, and reversals through explicit rules. Invoice numbering must be atomic and correctly scoped; do not use `count + 1`. Keep issued billing/address/tax/line snapshots unchanged by future customer/location updates. Preserve approved Khmer/English layouts and print/export behavior.

Build billing screens with current balance, source transaction links, allowed actions, and clear pending/error states. Restrict imports/exports and sensitive fields using backend permissions.

## Step 04.4 - HR integration and future Payments

Consume the restricted, immutable approved payroll summary through its public contract. Create the configured expense/liability journal once per originating payroll operation/version and record the result. Do not recalculate pay or infer paid status from approval.

Define required invoice/posting events and the confirmed-payment allocation contract. When Payments is a co-deployed Finance module, use an explicit internal interface and intentional local transactions. When separate, use the approved reliable interservice contract. Before Phase 05, keep unavailable live processing disabled/pending or use the approved legacy adapter.

Finance allocation and its journal effects must be atomic within Finance and idempotent across retries. A confirmed bank movement awaiting allocation remains visible as an exception; do not create another charge to repair it.

## Step 04.5 - Reports and controls

Implement general ledger, trial balance, account movements, receivables/payables aging, and the approved financial statements. Add bank reconciliation and asset depreciation where genuinely in migration scope. HR tracks custody, not asset accounting value.

Require verified, effective-dated statutory settings and appropriate accountant approval. Do not invent Cambodian tax/NSSF rates or silently replace missing mandatory rules with zero. Require strong verification/separation of duties for configured sensitive financial changes; fresh MFA does not grant a missing posting permission.

## Step 04.6 - Reconciliation and acceptance

Reconcile opening/closing balances, journal totals, invoices, allocations, currencies, tax snapshots, numbers, periods, legacy receipts, and payroll references. Choose detailed history versus opening-balance migration explicitly per period. Quarantine unexplained differences.

Test unbalanced posting, cross-company accounts, locked periods, decimal rounding, simultaneous numbering, duplicate payroll delivery, immutable posted entries, partial/overpayments, credit notes/reversals, changed approved inputs, date-effective settings, and unauthorized exports. Run real PostgreSQL concurrency/integration tests and source-based calculation fixtures.

Demonstrate invoice -> posting -> receivable and approved payroll -> one expense/liability posting, including a retry. Record business/accountant review. Live settlement remains a later integration dependency, not a fabricated success.

## Stop and release

Every slice includes working UI/APIs, appropriate migrations, contracts, tests, and source mapping. Apply the release checklist now; do not defer financial migration safety to Phase 12. Stop at the authorized slice boundary. No production accounting cutover or live financial side effects without explicit approval.


---

<!-- Source file: PHASE_05_PAYMENTS.md -->

# Phase 05 - Payments and Money Movement (Version 2)

Read MASTER_PROMPT.md, approved Finance/HR contracts, and the deployment decision. Implement only the authorized slice. Default to an isolated Payments module inside Finance unless an independent integration/security/release boundary is approved. A separate Payments service owns its private database, migrations, artifact and runtime identity; a co-deployed module keeps private repositories and an explicit internal interface. Apply RELEASE_CHECKLIST.md. Own attempts, verification and money-movement outcomes, not invoice balances or payroll formulas.

## Build sequence

1. Implement payment request/attempt records, amount/currency/reference validation, idempotency keys, explicit state transitions, and protected manual cash/bank-transfer confirmation. A bank-slip upload is unverified evidence, not confirmed payment.
2. Implement one genuinely required provider adapter from its current official documentation, using sandbox credentials first. Verify callback authenticity on the required raw content, validate expected merchant/account/amount/currency/reference, and use server-to-server confirmation where required. Do not trust a browser success redirect.
3. Handle duplicate, delayed, missing, and out-of-order callbacks. Persist enough evidence for reconciliation without storing prohibited secrets or payment credentials. Add retries, reconciliation jobs, and an operator queue for unresolved attempts.
4. Publish confirmed payment events through an outbox. Finance consumes them idempotently, allocates funds, and updates balances/postings. Show money-confirmed versus Finance-allocation-pending as distinct conditions so operators do not charge again to repair an accounting delay.
5. Implement approved refunds and payroll disbursement integration. Business authorization precedes execution. Require step-up, separation of duties where configured, currency/amount validation, partial-refund limits, and concurrency-safe protection against duplicate refunds/payouts.

## Boundaries and security

Use limited service/provider credentials and approved storage/rotation. Keep payment-service administration private. Do not build a card-data vault. Missing provider credentials produce a clear disabled/pending feature, not fake successful processing. Explicitly separate sandbox/manual test records from live transactions.

A payment event may be delivered twice; its Finance allocation and journal effects must occur once for the operation. Notification failures must not reverse a payment. Corrections require controlled financial compensation, not editing away evidence.

## React screens

Payment requests, attempt timeline, verified/unverified evidence, reconciliation exceptions, authorized confirmation, refund requests/status, disbursement batches/status, and integration health. Link to invoices and payroll through authorized APIs.

## Migration and acceptance

Import legacy transaction/provider references and reconcile them against Finance receipts/allocations. Do not replay historical live charges, refunds, notifications, or payouts during migration.

Test duplicate callbacks, invalid signatures, wrong merchant/amount/currency, out-of-order transitions, gateway timeout after provider success, concurrent refunds, duplicate payout requests, manual evidence approval, cross-tenant access, and Finance downtime/recovery. Demonstrate one confirmation produces one Finance effect after retry/replay.

Report live-provider tests as NOT RUN unless actually authorized and executed. Deliver the active slice's contracts, UI, migrations, reconciliation, test evidence and runbook. Stop at the slice boundary; another slice or Customer requires approval.

## Slice authorization guide

- 05.1 = request/attempt model and protected manual verification.
- 05.2 = one sandbox provider with authentic server-side confirmation.
- 05.3 = retries, ordering, reconciliation, and unresolved-attempt handling.
- 05.4 = one idempotent Finance allocation/posting handoff.
- 05.5 = separately authorized refunds and payroll disbursement.
- 05.6 = legacy-reference reconciliation and release evidence.

Each build item maps to the corresponding slice above. Every slice includes its own required UI, permissions, relevant migration checks, and test evidence. Do not defer these to the final item.

With co-deployment, use the approved internal Finance interface; do not require a broker or loopback HTTP solely for this module. With a separate service, use the tested outbox/consumer contract. A provider timeout may mean the payment already succeeded: reconcile by the original reference before authorizing another attempt. Do not persist raw card secrets or create a card vault.


---

<!-- Source file: PHASE_06_CUSTOMERS.md -->

# Phase 06 - Customer and Contact Identity (Version 2)

Read MASTER_PROMPT.md, the approved deployment decision and the legacy-to-Finance party mapping. Implement only the authorized slice. Customer can be an isolated module in an approved commercial application or an independent service after its decision gate. Keep customer identity ownership explicit in either case. Independent services use private databases/roles; co-deployed modules use private repositories and internal interfaces. Apply RELEASE_CHECKLIST.md.

## Build sequence and ownership

1. Implement individuals, organizations, associated contact people, customer codes, multiple phones/emails, addresses, status, permitted relationship roles, and source history. One person may be a buyer, seller, landlord, borrower, or referrer without unrelated duplicate identities.
2. Implement authorized create/edit, server search/filtering, imports with preview/validation/rejected-row output, exports, and auditable change history. Use local reference geography and preserve Khmer/English names and leading-zero codes.
3. Implement candidate duplicate detection and reviewed merge, not automatic merge based only on matching phone/email/name. Preserve aliases/old IDs and notify downstream systems through versioned mappings. Preserve the actual legacy duplicate-import policy unless an explicit change is approved.
4. Replace Finance's legacy Customer read adapter with the new API/projection. Resolve each existing external reference through the migration map. Attach references to appropriate records without altering issued invoice billing snapshots or historical balances.
5. Publish minimal customer-created/updated/merged events to authorized consumers. Support safe rebuild of projections and reconciliation of old aliases. Keep relationship activity in CRM, financial balances in Finance, and case facts in PV.

## Privacy and UI

Do not expose customers across tenants merely because their phone numbers match. Enforce company/branch/record sharing policies from the approved model. Keep login/recovery phone changes in Auth separate from contact editing.

Build customer directory, detail, contact/address management, import review, merge review, and authorized cross-module summaries. A summary displays Finance/CRM/PV data from their contracts; it does not become another editable copy of those records.

## Migration and acceptance

Migrate records with source IDs/codes and reconciliation of customer counts, contact associations, addresses, Finance mappings, and duplicates. Quarantine conflicts and record approved resolution. Avoid silent normalization that loses original evidence.

Test shared family/company phone numbers, missing/N/A phones, Khmer names, duplicate imports, concurrent edits, reviewed merge, cross-tenant access, local geography sync, Finance links, and unchanged old invoice snapshots. Do not mark migration done while material unresolved identities remain.

Deliver the active slice's working UI/APIs, migrations, source mappings, contracts, reconciliation, and tests. Stop at the slice boundary; Property needs separate approval.

## Slice authorization guide

- 06.1 = identity/contact/address model.
- 06.2 = authorized CRUD, search, and controlled imports/exports.
- 06.3 = candidate duplicate review and controlled merge.
- 06.4 = replace the Finance legacy adapter and reconcile IDs.
- 06.5 = minimal update/merge contracts and source reconciliation.

Each build item maps to the corresponding slice above. Every slice includes its own required UI, permissions, relevant migration checks, and test evidence. Do not defer these to the final item.

Match old records using reviewed source mappings, not assumed global email/phone uniqueness. A merge must preserve aliases and prevent later requests to an old ID from recreating another editable identity. Define customer visibility across companies explicitly; tenancy and customer-sharing rules are not interchangeable.


---

<!-- Source file: PHASE_07_PROPERTIES.md -->

# Phase 07 - Property and Listings (Version 2)

Read MASTER_PROMPT.md, the approved property feature map, and its deployment decision. Implement only the authorized slice in the approved module/application. A separate Property service owns its database/role, migrations, artifact, and contracts; otherwise preserve module/table ownership with internal interfaces. Apply RELEASE_CHECKLIST.md.

## Build sequence

1. Implement property identifiers, types, administrative addresses/coordinates, land/building dimensions, physical features, owner/contact references, title/parcel references, and private documents. Use shared location IDs with local geography; house/street/parcel details remain owned here.
2. Implement sale/rent listings, asking prices, publication state, availability, marketing content, mandate references/dates, photos, and controlled publication channels. Distinguish the underlying property from its listing and from a valuation case snapshot.
3. Implement any approved reservation/hold workflow as the authoritative availability decision. Sales/CRM requests holds through this API; neither independently sets property availability. Use concurrency control, unique active-hold rules, authorized expiry/release, and idempotency.
4. Provide authorized search/filtering, map/list/detail screens, imports, exports, media integration, and minimal property/listing/reservation events. Preserve the actual required field order, validations, codes, existing maps, ownership/referral details, and mobile/API contracts identified in the audit.

## Boundaries

Customer owns contact identity. CRM owns buyer needs, showings, and follow-ups. PV owns valuation evidence/conclusions. Finance owns invoices/receipts. Asking price is not assessed value. A collateral property must not automatically become a public listing.

Do not add tenant lease/maintenance operations or an automated valuation engine unless separately approved. External map provider availability, licensing, and coordinates must be validated for the configured deployment; missing map credentials should not corrupt address data.

## Migration and acceptance

Preserve property/listing identities, historical status, media links, owner references, dimensions, dates, and document access. Reconcile property/listing counts, relationships, and active availability against legacy data. Do not collapse several listings into one property without a reviewed mapping.

Test duplicate submissions, concurrent reservations, hold expiry, invalid location hierarchy, restricted ownership documents, cross-company access, unavailable map service, and record display without live Location calls. Demonstrate approved listing changes persist and publish correct idempotent events.

Deliver the active slice's backend/UI, migrations, maps/media behavior, source mapping, contracts, tests, and run instructions. Stop at the slice boundary; CRM requires approval.

## Slice authorization guide

- 07.1 = property records, valid address, ownership references, and protected media.
- 07.2 = listings, asking prices, mandates, and publication states.
- 07.3 = authoritative reservation/hold decisions under concurrency.
- 07.4 = search/map/import/export workflows and migration reconciliation.

Each build item maps to the corresponding slice above. Every slice includes its own required UI, permissions, relevant migration checks, and test evidence. Do not defer these to the final item.

Separate current asking prices from immutable valuation case conclusions. Do not conflate a cadastral parcel, property, and marketing listing without an approved model. Internal database holds and external reservation commands must use the same authoritative availability rules.


---

<!-- Source file: PHASE_08_CRM.md -->

# Phase 08 - CRM and Customer Relationships (Version 2)

Read MASTER_PROMPT.md, the approved CRM feature map, deployment decision and Customer/Property contracts. Implement only the authorized slice. CRM may remain in an approved commercial deployment with private module repositories; a separate CRM service must pass its decision gate and own its database/artifact/migrations. Keep Customer, Property and Finance ownership intact. Apply RELEASE_CHECKLIST.md.

## Build sequence

1. Implement lead capture/source/assignment, qualification, opportunities and pipelines, lead/customer linking, requirements, tasks, notes, calls, follow-ups, reminders, appointments, property showings, and outcomes. A lead may remain unqualified before being linked to a formal Customer identity.
2. Integrate Customer identity and Property matching/search through contracts or justified local projections. Never create competing customer masters, independent listing availability, or editable Finance balances inside CRM.
3. Reproduce existing permission scope, follow-up tabs, date filters, count/deduplication rules, notes requirements, favorites, assignment logic, calendars, activity history, and exports from source evidence. Make any proposed behavior change explicit rather than silently replacing a mature workflow with generic CRUD.
4. Add authorized team/agent dashboards with clear metric definitions and correct date/time-zone behavior. Ensure table, totals, and exports use the same filtered/scoped query logic. Do not count many joined activity rows as many unique customers or employees accidentally.
5. Integrate notifications and later Sales/PV summaries without blocking normal CRM work on unrelated services. Keep clear pending/retry states for incomplete integrations.

## AI boundary

AI is optional after the operational CRM passes its acceptance tests. Any approved AI feature may summarize, suggest matches, or draft text using permission-filtered data. It must not directly edit databases, publish listings, approve money movement, or turn unavailable providers into a broken core workflow.

## Migration and acceptance

Migrate leads, ownership, customer/property links, activities, scheduled follow-ups, and pipeline history. Reconcile counts by the audited rules, not only raw row totals. Preserve prior timestamps and historical outcomes.

Test today/overdue/upcoming boundaries in the configured time zone, follow-up deduplication, note-before-completion rules where present, search, calendar overlap, assignment scope, export parity, customer-merge mappings, cross-tenant access, and provider downtime. Demonstrate a lead -> qualified customer -> property requirement -> showing/follow-up sequence with correct history.

Deliver the active slice's working APIs/UI, migrations, metric definitions, regression tests, and source reconciliation. Stop at the slice boundary; Valuation needs approval.

## Slice authorization guide

- 08.1 = lead capture, qualification, opportunity pipeline, and minimum working follow-up.
- 08.2 = Customer/Property integration and requirement matching.
- 08.3 = complete audited activity/calendar/follow-up behavior and export parity.
- 08.4 = scoped dashboards using agreed metric definitions.
- 08.5 = required notification/downstream summaries and migration acceptance.

Each build item maps to the corresponding slice above. Every slice includes its own required UI, permissions, relevant migration checks, and test evidence. Do not defer these to the final item.

Keep AI in a separate approved backlog after the operational CRM passes. Do not block normal relationship work on an optional AI, map, or reporting provider. When a cross-domain summary is unavailable, show that limitation rather than a fabricated zero balance or empty customer history.


---

<!-- Source file: PHASE_09_VALUATION.md -->

# Phase 09 - Property Valuation (PV) (Version 2)

Read MASTER_PROMPT.md, the actual valuation source, approved workflow and deployment decisions. Implement only the authorized slice. Preserve PV as a distinct domain; use an independent database/application only when its decision gate is approved, otherwise private modules/interfaces in the approved deployment. Apply RELEASE_CHECKLIST.md. Preserve professional review controls; do not describe the software as automatically certified or as a substitute for authorized valuation judgment.

## Build sequence

1. Implement intake, client/bank and borrower references, purpose, property references, assigned staff, case documents, inspection scheduling/findings, comparable evidence, calculations/adjustments, comments, deadlines, and case history.
2. Save case-specific property/address/evidence snapshots. Updating a current Property or Customer record must not silently rewrite an approved valuation report. Preserve legacy calculations and dynamic parameters through audited regression fixtures.
3. Implement the approved case workflow. Proposed default: Draft -> Pending -> Review -> Approved. Track report issuance separately: Not Issued -> Issued -> Superseded. The audit must explicitly map legacy status codes rather than guessing equivalents.
4. Keep feedback, missing information, urgent priority, support requests, and blocking conditions separate from the main lifecycle where appropriate. Define allowed transitions, responsible roles, reasons, and separation-of-duties rules. Fresh MFA does not bypass case permissions.
5. After approval/issuance, amendments create a controlled revision with linked reason/evidence and the required review trail. Preserve earlier approved/issued versions. Do not revert approved cases silently or overwrite historical calculations.
6. Integrate Finance billing/payment eligibility, Documents, and Notifications. Approval and permission to release are distinct: a payment-before-release policy can hold delivery without erasing approval. No single notification failure should undo a valid approval.

## UI and external access

Build intake, queue, assignment, inspection/calculation, technical review, approval, issue/revision, and case reporting views. Preserve actual report templates, Khmer/English layout, exports, and branch/client access rules. Bank users may be external Auth users, not employees. Require case-specific access for bank portal documents.

## Migration and acceptance

Migrate all cases, status history, calculations, adjustments, property snapshots, documents, approvals, and issuance/revision links. Reconcile calculation outputs and report values against approved fixtures, with controlled explanations for differences.

Test unsupported transitions, reviewer/approver scope, concurrent edits, approval version binding, amendment history, restricted bank access, unchanged old reports after address edits, payment hold/release, and exports. Do not treat the proposed workflow as an international compliance claim.

Deliver the active slice's backend/UI, reports, migrations, tested workflow rules, contracts, and reconciled history. Stop at the slice boundary; Sales requires approval.

## Slice authorization guide

- 09.1 = case intake, assignment and inspection/evidence foundations.
- 09.2 = controlled snapshots and source-based calculation fixtures.
- 09.3 = main review/approval workflow with explicit legacy-status mapping.
- 09.4 = feedback, urgency, blockers, and support handling.
- 09.5 = amendments/revisions with preserved approved versions.
- 09.6 = Finance eligibility, Documents, Notifications and external bank access.
- 09.7 = report/output reconciliation and release evidence.

Each build item maps to the corresponding slice above. Every slice includes its own required UI, permissions, relevant migration checks, and test evidence. Do not defer these to the final item.

Approval binds to the exact case/report inputs reviewed. Report issuance/release and payment eligibility are separate conditions. Do not use an out-of-date Finance summary to release a restricted report when policy requires a current check. Record who reviewed, approved, issued, and amended each version.


---

<!-- Source file: PHASE_10_SALES.md -->

# Phase 10 - Sales, Quotations, and Contracts (Version 2)

Read MASTER_PROMPT.md, the approved deployment decision, and CRM/Property/PV/Finance/Payments contracts. Implement only the authorized slice. Sales can be an isolated commercial module or an approved independent service with its own data/artifact/migrations. Apply RELEASE_CHECKLIST.md. Do not force existing direct PV-to-billing flows through unnecessary orders.

## Build sequence

1. Implement service catalog, versioned quotations, line pricing, discounts and approval thresholds, accepted orders, contracts/engagement letters, agreed scope, milestones, cancellation, and fulfillment tracking.
2. Integrate Customer identity and CRM opportunity references. Accepted terms become an immutable commercial snapshot with controlled amendments. CRM owns the opportunity; Sales owns the agreement; Finance owns the invoice.
3. On acceptance or a billing milestone, request the appropriate PV assignment, Property hold, or Finance invoice through explicit idempotent contracts. Use stable originating order/milestone/version references to avoid duplicated cases, reservations, or invoices.
4. Implement a durable coordination state for multi-service workflows, with retry, timeout, operator intervention, and explicit compensation. Do not assume a transaction spans all service databases. Cancellation may require an approved release, credit note, or refund request rather than deleting records.
5. Expose progress derived from owning services without independently changing their state. A confirmed payment does not automatically mean every promised deliverable is complete.

## React screens

Catalog, quotations, quotation versions/review, accepted orders/contracts, milestones, amendments, fulfillment status, and exceptions needing action. Link to CRM, PV, Property, and Finance through scoped APIs and clear navigation.

## Migration and acceptance

Migrate existing quotes/contracts/orders and map their financial/fulfillment references. Never recreate live historical orders that trigger duplicate invoices or payment requests. Preserve agreed terms and document versions.

Test double acceptance, discount approval bypass, stale quote acceptance, duplicate milestone events, reservation rejection, service outage/retry, partial fulfillment, cancellation after invoicing/payment, and cross-tenant references. Demonstrate accepted quotation -> one requested case/order fulfillment -> one invoice -> tracked completion.

Deliver the active slice's components, contracts, migrations, coordinator/reconciliation logic, and evidence. Stop at the slice boundary; Reporting requires approval.

## Slice authorization guide

- 10.1 = catalog, quotations, pricing review, and accepted terms.
- 10.2 = Customer/CRM linkage and immutable commercial snapshots.
- 10.3 = idempotent fulfillment/billing requests.
- 10.4 = durable coordination, partial failure, cancellation and compensation.
- 10.5 = truthful fulfillment status and legacy reconciliation.

Each build item maps to the corresponding slice above. Every slice includes its own required UI, permissions, relevant migration checks, and test evidence. Do not defer these to the final item.

In a co-deployed module group, avoid distributed choreography for operations that belong in one intentional local transaction. Across separate owners, persist coordination progress and reconcile timeouts. A compensating refund or credit note needs the usual authorization and does not mean that a completed bank movement can be rolled back by deleting a row.


---

<!-- Source file: PHASE_11_REPORTING.md -->

# Phase 11 - Reporting and Analytics (Version 2)

Read MASTER_PROMPT.md, the actual reporting requirements, source contracts, and approved metric/deployment decisions. Implement only the authorized slice. Do not automatically create a warehouse or another microservice for one dashboard. Apply RELEASE_CHECKLIST.md.

## Step 11.1 - Define metrics and choose a read architecture

Agree metric meaning, grain, filters, source, date/time zone, currency/conversion, and access scope. Distinguish employee home/work province, customer current address, property location, and invoice-time billing address. Distinguish invoiced amount, collected cash, and posted revenue. Never sum currencies without a declared basis.

For co-deployed modules, start with approved scoped SQL views/read models and measured query plans where adequate. Materialized summaries require refresh/freshness rules. A read view must not grant general users access to raw salary details.

For actual cross-service reporting or workload isolation, propose a separate authorized reporting read database/application through the decision gate. Populate it through owned contracts or an explicitly approved controlled ingestion design. Do not directly join unrestricted private service databases at request time or build an alternate editable master.

## Step 11.2 - Ingestion and projection correctness

For independent projections, bootstrap a consistent snapshot and checkpoint, then apply versioned changes without losing or counting concurrent updates twice. Use outbox/inbox semantics where applicable. Handle late corrections, reversals, customer merges/aliases, archived records, retired locations, and source history. Support replay/rebuild with explicit watermarks and gap detection.

Design facts/dimensions or prepared summaries at the intended grain. Aggregate independent facts before joining them at province/company level; do not multiply customers, employees, properties and invoices by joining only on province.

Keep sensitive projections purpose-limited. Define data retention, accessible fields, and authorization for backfills and rebuilds. A general reporting service should not receive all employee bank/salary data by default.

## Step 11.3 - Working dashboards and exports

Build authorized filters, pagination, drill-down, asynchronous large exports, freshness indicators, sync-health and reconciliation views. Show unavailable data honestly. Do not present an asynchronous read model as instantaneous truth.

Use indexed queries and measured materialization when justified. Keep reports read-only. Avoid long live API fan-out chains across all transactional services. A single React dashboard does not require one backend transaction spanning all sources.

## Step 11.4 - Reconcile, test and release

Reconcile totals to source owners for selected tenants/companies and periods. Test financial reversals, duplicate and out-of-order events, bootstrap races, source outages, ID merges, address changes, replay, unauthorized exports, and absence of cross-tenant leakage. Verify that historical and current-location reports answer the agreed different questions.

Measure actual p50/p95 latency, throughput, query plans, row counts, workload/hardware, and update lag. Do not invent achieved targets. Record accepted freshness and failure behavior.

Deliver the active slice's metric catalog, source contracts, query/projection logic, migrations, rebuild/reconciliation commands, UI/exports, tests and alerts. Stop at the authorized slice boundary. Phase 12 requires approval; it does not replace per-release tests already required here.


---

<!-- Source file: PHASE_12_CUTOVER.md -->

# Phase 12 - Consolidated Validation and Staged Cutover (Version 2)

Read MASTER_PROMPT.md, RELEASE_CHECKLIST.md, the actual completed slice reports, approved ADRs, and cutover/rollback plan. This phase prepares/rehearses the authorized rollout scope. It does not automatically authorize live traffic, migrations, messages, payments, refunds or payouts.

Earlier approved slices may already have been released after their own gates. Do not make all twelve phases a prerequisite for releasing a smaller justified scope. Conversely, do not claim unfinished domains are part of a completed release.

## Step 12.1 - Confirm scope and evidence

Identify exact domains, features, tenant groups, deployment versions, provider modes, and source/target revisions for this rollout. List incomplete integrations, exclusions, blockers and approved deferrals.

Review per-slice source-feature preservation, security, tenant isolation, contract compatibility, migration and operational evidence. Run remaining whole-flow regressions against real PostgreSQL and supported producer/consumer versions. Check independent build/deployment where services are actually separate.

Validate sensitive Auth revocation and step-up at receiving services, administrative access, credentials, uploads, report/export scope, log redaction, RLS/pooled context, and external callback authenticity. Automated checks do not imply security certification.

## Step 12.2 - Performance, failure and operations rehearsal

Use representative data, concurrency, hosting and planned replica/worker counts. Measure latency, throughput, error rate, queue lag and query behavior. Verify aggregate database connection budgets, bounded workers, pagination, deadlines and rate limits.

Rehearse unavailable reference lookups, current-authorization checks, identity provider outage, broker failure, duplicate/out-of-order events, poison messages, file storage/notification failures, provider timeout after success, and partial-domain downtime. Confirm safe degraded reads, required fail-closed operations, pending states, durable retry and operator recovery.

Check liveness/readiness and graceful shutdown without creating restart storms for optional dependency outages. Review actionable alerts, trace correlation, secret rotation and ownership.

## Step 12.3 - Migration and recovery rehearsal

Run resumable dry-run imports on sanitized source copies. Reconcile IDs, relationships, counts, dates, currencies, balances, snapshots, approved history, files, and late legacy changes. Quarantine material ambiguity; do not conceal differences with arbitrary adjustment rows.

Restore database and relevant file backups into a separate environment and validate usable recovery. Securely restore required encryption-key access and configuration without publishing secrets. Reconcile restored owner state with external payments and downstream operation identities before replaying work.

For each migrated domain define its single authoritative writer, maintenance/change-capture strategy, final checkpoint, route switch, feature flags, supported old/new contracts, and rollback conditions. Schema removal follows the approved expand/contract window.

After new-system writes, rollback requires approved reverse reconciliation or forward repair. Never promise that switching the gateway alone restores correctness. Historical migration must not replay live charges, refunds, payouts, notifications, or unapproved business-trigger events.

## Step 12.4 - Controlled rollout and sign-off

Produce a release checklist for each service/module deployment and tenant group. Include CI/CD artifacts, commands, configuration, health, monitoring, on-call/runbooks, backup/restore, provider reconciliation, and recorded recovery objectives/measurements.

Obtain the required business acceptance, HR review, accountant approval for balances/formulas, and security review. State any provider tests that remain sandbox-only or NOT RUN. The approver must know exactly what will and will not work.

Return what passed, failed, was not run, or is excluded; actual measurements; reconciliation evidence; the rollout sequence; and rollback thresholds. Stop before production actions until separately authorized for those exact actions.

## Completion

A rehearsed and approved rollout establishes readiness only for its specified scope. Do not label the entire platform complete while required domains, providers, migrations, contracts, operational controls or business approvals remain unresolved.


---

<!-- Source file: templates/ADR_TEMPLATE.md -->

# ADR-[NUMBER] - [Decision title]

Status: PROPOSED / APPROVED / REJECTED / SUPERSEDED
Date: [date]
Owner/reviewer: [name or role]
Active slice: [ID]
Approval evidence: [reference; leave unapproved until real approval]

## Context and source evidence

[Actual repository paths, business rules, constraints, measured workload, and unknowns.]

## Decision to make

[For example: isolated module versus independent service; identity engine; gateway; transport; ORM.]

## Ownership and invariants

[Authoritative data, one writer, transactions that must stay atomic, access scope, consumers.]

## Options compared

| Option | Benefits for this project | Costs/risks | Evidence or assumption |
|---|---|---|---|
| Keep module/reuse existing capability | [fill] | [fill] | [fill] |
| Extract/add proposed capability | [fill] | [fill] | [fill] |

## Proposed decision and reason

[Do not treat a preference or phase number as evidence of need.]

## Resulting design

[Code boundary, deployment, data ownership, contracts, permissions, operational owner.]

## Compatibility and migration

[Supported versions, schema evolution, source mapping, single writer, rollout, rollback after new writes.]

## Failure, security and resource behavior

[Timeouts, retry/idempotency, auth freshness, outage behavior, pool/worker budget, monitoring, backup/recovery.]

## Validation and consequences

[Tests needed, measured outcomes, rejected alternatives, residual risks and review triggers.]

## Approval

[Actual approved scope and date, or explicitly PENDING.]


---

<!-- Source file: templates/PHASE_ACCEPTANCE_TEMPLATE.md -->

# Acceptance - [Slice ID and title]

Status: IN PROGRESS / READY FOR REVIEW / ACCEPTED SCOPE / BLOCKED
Repository revision: [revision]
Environment: [local/staging/explicitly approved production scope]
Approved scope: [user journey, companies/tenants, modules/services]
Decision references: [ADRs]

## Working outcome

[What a real authorized user can do, with persistence and failure handling.]

## Changed files and interfaces

[Files, migrations, APIs/events, UI and deployment/configuration changes.]

## Preservation and reconciliation

[Source feature references, behavior changes approved, IDs/counts/balances/history reconciled, exceptions.]

## Actual checks

| Check | Command/method | Environment/fixture | PASS / FAIL / NOT RUN | Evidence |
|---|---|---|---|---|
| Lint/type check/build | [fill] | [fill] | NOT RUN | [fill] |
| Unit and PostgreSQL integration | [fill] | [fill] | NOT RUN | [fill] |
| Tenant/permission/security | [fill] | [fill] | NOT RUN | [fill] |
| Required browser/API workflow | [fill] | [fill] | NOT RUN | [fill] |
| Contract/mixed-version compatibility | [fill] | [fill] | NOT RUN | [fill] |
| Migration/restore/reconciliation | [fill] | [fill] | NOT RUN | [fill] |
| Concurrency/retry/failure | [fill] | [fill] | NOT RUN | [fill] |
| Applicable release checks | [fill] | [fill] | NOT RUN | [fill] |

N/A needs a reason and acceptance. Do not replace NOT RUN with PASS because code compiled or a mock succeeded.

## Limitations, blockers and approved deferrals

[Separate not-implemented scope, unavailable credentials, sandbox-only tests, failed required work, and approved optional backlog.]

## Release and rollback

[Independent artifact when applicable, supported versions, schema plan, one writer, resource budget, monitoring, backup and rollback/data reconciliation.]

## Demonstration and next boundary

[Reproducible demonstration steps and the next proposed slice, not automatic authorization.]

## Human decision

[Accepted scope, requested fixes, or PENDING. Production action permission is separate and explicit.]


---

<!-- Source file: templates/PROGRESS_TEMPLATE.md -->

# Migration Progress

Instruction baseline: Business Platform Prompt Pack Version 2
Repository/revision: [fill]
Current authorized phase/slice: [fill]
Current permitted environment/actions: [fill]
Last updated: [date]

## Approved decisions

| Decision | Status | Evidence | Next review trigger |
|---|---|---|---|
| Deployment boundaries | PROPOSED | [ADR] | [fill] |
| Identity engine/access model | PROPOSED | [ADR] | [fill] |
| Gateway/BFF | PROPOSED | [ADR] | [fill] |
| Database/ORM/isolation | PROPOSED | [ADR] | [fill] |
| Transport/caching | PROPOSED | [ADR] | [fill] |

## Slice tracking

| Slice | User outcome | Status | Prerequisites | Acceptance evidence | Remaining work |
|---|---|---|---|---|---|
| 00 | Audit and first implementation plan | NOT STARTED | Repository and sanitized schema | [fill] | [fill] |
| [ID] | [outcome] | [status] | [fill] | [report] | [fill] |

Statuses: NOT STARTED, IN PROGRESS, BLOCKED, READY FOR REVIEW, ACCEPTED SCOPE, APPROVED DEFERRED. A whole phase is not complete merely because one slice is accepted.

## Authoritative writers and live routing

| Domain | Current writer | Legacy/new route | Synchronization checkpoint | Cutover approval |
|---|---|---|---|---|
| [domain] | [owner] | [fill] | [fill] | PENDING |

## Unresolved blockers and exclusions

[Missing input, test failures, provider access, migration exceptions, responsible reviewer.]

## Next proposed action

[Exact slice/files and approvals required. Do not start it automatically.]


---

<!-- Source file: CHANGELOG.md -->

# Version 3 Change Log

## 2026-10-01 — Repository audit and pack consistency

- Use the Version 3 master as the canonical instruction source. Preserve inherited Version 2 phase requirements.
- Correct README/startup version references and use the actual repository path.
- Regenerate the combined reading edition from its named source files, including the current master.
- Refresh manifest file counts, byte sizes, and SHA-256 hashes; include Version 3 companion files.
- Record the current project audit, findings, proposals, and baseline evidence in `../migration/`. No application/database migration performed.

# Version 2 Change Log

Version 2 replaces the instruction pack, not the source project. No repository migration, live provider integration, or production readiness is claimed by distributing these files.

## Retained

The requested sequence, NestJS/React/PostgreSQL target, audit-first migration, business ownership, backend permissions, multi-tenant safeguards, local geography reads, historical snapshots, decimal-safe finance/payroll, reliable event processing, reconciliation, and explicit approval boundaries remain.

## Revised

1. Service deployment is conditional on an approved decision gate, not required once a phase starts. Co-deployed module rules and independent-service rules are now explicit.
2. Auth requires an identity-engine comparison first; application-managed credentials are not the silent fallback. Provider-hosted security UI may satisfy approved requirements without duplication.
3. The mandatory custom NestJS gateway has been removed. Existing edge infrastructure is evaluated before a BFF or custom gateway.
4. Infrastructure is introduced for real current needs. RabbitMQ, Redis and extra deployments are proposed options, not universal prerequisites.
5. Early phases are broken into numbered user-workflow slices. Shared Core has an approved minimum before HR and explicit optional backlog.
6. Finance resolves the Customer bridge before building exposed billing behavior. Payments can remain an isolated Finance module initially.
7. Contract compatibility, resource budgets, monitoring, migrations, backups and recovery are checked for each released slice rather than postponed to Phase 12.
8. Reporting starts from actual query needs and approved topology; a separate warehouse/service is not automatic.
9. Copy-and-paste session prompts, ADR/acceptance/progress templates, and source references are included.

## Adoption

Keep earlier audit and acceptance evidence. Review existing approved decisions against these changes; do not silently re-run completed migration steps or invalidate prior approvals. Update PROGRESS.md to record the adopted instruction version and any revised slice numbering. Finance substep ordering is more explicit in this version.

Unapproved enhancements remain proposals. A shorter implementation scope must be explicitly approved and labelled accurately; it must not be described as the completed whole platform.


---

<!-- Source file: SOURCES.md -->

# Primary Technical References - Version 2

Checked when preparing this pack on 2026-10-01. Recheck official documentation and supported package versions during Phase 00 and before relevant implementation.

These references support general engineering patterns. They do not prescribe this project's service count, domain allocation, phase order, hosting budget, exact security defaults, statutory rules, or performance. Those are proposed project requirements requiring approval and actual tests. No tax, labor, NSSF, accounting-compliance, or valuation-certification claim is made by this pack.

## [S01] Microservice boundaries - Microsoft Learn

Business responsibilities, coupling, service size and independent deployment.

```text
https://learn.microsoft.com/en-us/azure/architecture/microservices/model/microservice-boundaries
```

## [S02] API gateways - Microsoft Learn

Gateway responsibilities and technology selection; not a mandate for a custom NestJS proxy.

```text
https://learn.microsoft.com/en-us/azure/architecture/microservices/design/gateway
```

## [S03] NestJS workspaces - NestJS

Standard and monorepo code organization.

```text
https://docs.nestjs.com/cli/monorepo
```

## [S04] Strangler Fig pattern - Microsoft Learn

Incremental replacement of legacy functionality.

```text
https://learn.microsoft.com/en-us/azure/architecture/patterns/strangler-fig
```

## [S05] Data considerations for microservices - Microsoft Learn

Owned data, local projections, consistency and cross-domain read needs.

```text
https://learn.microsoft.com/en-us/azure/architecture/microservices/design/data-considerations
```

## [S06] Transactional outbox pattern - AWS Prescriptive Guidance

Reliable business-state/event publication and idempotent downstream handling.

```text
https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html
```

## [S07] Consumer acknowledgements and publisher confirms - RabbitMQ

Broker delivery and processing acknowledgement stages.

```text
https://www.rabbitmq.com/docs/confirms
```

## [S08] Microservices Security Cheat Sheet - OWASP

Trust boundaries, authentication context and service authorization.

```text
https://cheatsheetseries.owasp.org/cheatsheets/Microservices_Security_Cheat_Sheet.html
```

## [S09] Server Administration Guide - Keycloak

An identity-provider candidate with configurable authentication, OTP, passkeys and sessions.

```text
https://www.keycloak.org/docs/latest/server_admin/index.html
```

## [S10] Multi-Tenant Security Cheat Sheet - OWASP

Tenant-context validation and isolation across database, cache, files and asynchronous work.

```text
https://cheatsheetseries.owasp.org/cheatsheets/Multi_Tenant_Security_Cheat_Sheet.html
```

## [S11] Multifactor Authentication Cheat Sheet - OWASP

Authentication factors, OTP handling, enrollment and recovery risks.

```text
https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html
```

## [S12] Build a React app from scratch - React

React application tooling options and framework tradeoffs.

```text
https://react.dev/learn/build-a-react-app-from-scratch
```

## [S13] Session Management Cheat Sheet - OWASP

Session transport, lifecycle and security controls.

```text
https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
```

## [S14] Row security policies - PostgreSQL

RLS behavior, policies and privileged-role caveats.

```text
https://www.postgresql.org/docs/current/ddl-rowsecurity.html
```

## [S15] Numeric types - PostgreSQL

Exact numeric representation versus inexact floating point.

```text
https://www.postgresql.org/docs/current/datatype-numeric.html
```

## [S16] Data migration using expand and contract - Prisma

Staged schema/data change and compatible application transition.

```text
https://www.prisma.io/docs/guides/database/data-migration
```

## [S17] Observability primer - OpenTelemetry

Logs, metrics and traces as complementary operational signals.

```text
https://opentelemetry.io/docs/concepts/observability-primer/
```

## [S18] Transaction Authorization Cheat Sheet - OWASP

Sensitive transaction confirmation and authorization tied to business actions.

```text
https://cheatsheetseries.owasp.org/cheatsheets/Transaction_Authorization_Cheat_Sheet.html
```

## [S19] Prisma recipe - NestJS

Prisma integration as a NestJS data-access option.

```text
https://docs.nestjs.com/recipes/prisma
```

## [S20] Health checks (Terminus) - NestJS

Health-check implementation tooling. The proposed liveness/readiness and dependency policy must be designed for the chosen hosting environment.

```text
https://docs.nestjs.com/recipes/terminus
```

## [S21] Interservice communication - Microsoft Learn

Synchronous/asynchronous choices, resilience, versioning and distributed communication.

```text
https://learn.microsoft.com/en-us/azure/architecture/microservices/design/interservice-communication
```

## [S22] Password Storage Cheat Sheet - OWASP

Maintained password hashing and secure legacy hash migration considerations.

```text
https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
```

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

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

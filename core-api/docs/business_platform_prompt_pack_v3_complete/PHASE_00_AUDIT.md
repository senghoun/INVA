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

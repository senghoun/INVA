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

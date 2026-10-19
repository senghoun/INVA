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

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

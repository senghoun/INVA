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

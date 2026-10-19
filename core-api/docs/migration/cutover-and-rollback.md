# Incremental cutover and recovery plan

Status: PROPOSED; no cutover or production action authorized.

1. Establish version-controlled source or a verified durable source archive before application edits. The temporary prompt-pack copy is only review evidence. Identify current writers/clients and pin the exact approved release scope.
2. Obtain a sanitized source fixture and isolated PostgreSQL/queue environment; disable notifications, provider calls and money movement during import/replay. Record actual runtime DB roles and pool budgets.
3. Test a fresh schema and upgrade from the fixture. Use expand/backfill/verify/switch/contract: keep supported old columns/contracts until consumers are migrated and the removal window is approved.
4. Import with stable source-to-target UUID mappings, resumable batch checkpoints and conflict quarantine. Reconcile counts, org/employee/customer links, leave balances, invoice lines, ledger debits/credits and historical document identifiers.
5. Shadow authorized reads and compare results; side effects stay disabled. Define API/event versions, consumer compatibility matrix and late-write capture strategy. Do not dual-write independently without an owned recovery process.
6. Transfer one authoritative writer per record set during a controlled scope window. Route switch follows reconciled data and release checks. Confirm queue operation IDs and outbox/inbox handling before replay.
7. Observe latency/errors, queue lag, denied-scope events and financial discrepancies. Actual targets/owners/hosting capacity remain unconfirmed; no measured guarantees are claimed.

Before new writes, application rollback may restore the previous compatible artifact while leaving additive schema intact. After new writes, first pause affected writers/dispatchers, preserve the new data/audit/events, and reconcile by operation ID. Prefer forward repair when old code cannot interpret new state. Reverse mapping/reconciliation requires a tested adapter and business approval; routing to an old app alone is not data rollback. Never delete issued ledger history or blindly replay payments/notifications.

Restore backups in a separate environment, including database/files/configuration and access to encryption keys. Verify counts, balances, runtime authorization, orphan detection and controlled replay. Recovery point/time objectives and downtime windows are PENDING; tests NOT RUN. Human approval for an implementation slice does not authorize production rollout.

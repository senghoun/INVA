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

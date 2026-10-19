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

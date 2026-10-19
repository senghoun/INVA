# Phase 10 - Sales, Quotations, and Contracts (Version 2)

Read MASTER_PROMPT.md, the approved deployment decision, and CRM/Property/PV/Finance/Payments contracts. Implement only the authorized slice. Sales can be an isolated commercial module or an approved independent service with its own data/artifact/migrations. Apply RELEASE_CHECKLIST.md. Do not force existing direct PV-to-billing flows through unnecessary orders.

## Build sequence

1. Implement service catalog, versioned quotations, line pricing, discounts and approval thresholds, accepted orders, contracts/engagement letters, agreed scope, milestones, cancellation, and fulfillment tracking.
2. Integrate Customer identity and CRM opportunity references. Accepted terms become an immutable commercial snapshot with controlled amendments. CRM owns the opportunity; Sales owns the agreement; Finance owns the invoice.
3. On acceptance or a billing milestone, request the appropriate PV assignment, Property hold, or Finance invoice through explicit idempotent contracts. Use stable originating order/milestone/version references to avoid duplicated cases, reservations, or invoices.
4. Implement a durable coordination state for multi-service workflows, with retry, timeout, operator intervention, and explicit compensation. Do not assume a transaction spans all service databases. Cancellation may require an approved release, credit note, or refund request rather than deleting records.
5. Expose progress derived from owning services without independently changing their state. A confirmed payment does not automatically mean every promised deliverable is complete.

## React screens

Catalog, quotations, quotation versions/review, accepted orders/contracts, milestones, amendments, fulfillment status, and exceptions needing action. Link to CRM, PV, Property, and Finance through scoped APIs and clear navigation.

## Migration and acceptance

Migrate existing quotes/contracts/orders and map their financial/fulfillment references. Never recreate live historical orders that trigger duplicate invoices or payment requests. Preserve agreed terms and document versions.

Test double acceptance, discount approval bypass, stale quote acceptance, duplicate milestone events, reservation rejection, service outage/retry, partial fulfillment, cancellation after invoicing/payment, and cross-tenant references. Demonstrate accepted quotation -> one requested case/order fulfillment -> one invoice -> tracked completion.

Deliver the active slice's components, contracts, migrations, coordinator/reconciliation logic, and evidence. Stop at the slice boundary; Reporting requires approval.

## Slice authorization guide

- 10.1 = catalog, quotations, pricing review, and accepted terms.
- 10.2 = Customer/CRM linkage and immutable commercial snapshots.
- 10.3 = idempotent fulfillment/billing requests.
- 10.4 = durable coordination, partial failure, cancellation and compensation.
- 10.5 = truthful fulfillment status and legacy reconciliation.

Each build item maps to the corresponding slice above. Every slice includes its own required UI, permissions, relevant migration checks, and test evidence. Do not defer these to the final item.

In a co-deployed module group, avoid distributed choreography for operations that belong in one intentional local transaction. Across separate owners, persist coordination progress and reconcile timeouts. A compensating refund or credit note needs the usual authorization and does not mean that a completed bank movement can be rolled back by deleting a row.

# API, Event, and Integration Conventions

Apply only where the active slice exposes a contract or performs asynchronous processing. Do not turn these conventions into a requirement to add a broker to every module.

## API contracts

Use documented REST/OpenAPI and the approved public routing namespace. Example logical routes: `/api/v1/hr/employees`, `/api/v1/locations/provinces`, `/api/v1/finance/invoices`. Actual identity-provider protocol endpoints may differ; do not rewrite provider protocols to imitate application CRUD.

Document request/response schemas, field sensitivity, authorization, validation, status codes, pagination, sorting, date/time zone, currency, and concurrency behavior. Use stable machine-readable error codes plus safe messages and a correlation ID. Keep internal stack traces, SQL, and secrets out of errors.

Tenant/company parameters select an authorized context; they never grant access. Enforce resource scope for nested and indirect IDs, searches, totals, exports, and uploads. Server-side allowlists constrain filters and sort fields. Bound page sizes and bulk request sizes.

A successful asynchronous request returns an accepted/pending state and a status reference, not a completed business outcome. Do not label a payment paid or an email delivered merely because a job was queued.

Use explicit optimistic versions or locking where concurrent edits matter. Approval commands must identify the reviewed record/version. On conflicts, return a clear safe failure; do not silently overwrite newer work.

## Idempotency

For retriable business commands, persist an idempotency key scoped to the operation and authorized tenant/caller context, with a request fingerprint, durable state, and result reference. Reject reuse with a different material payload. Serialize or otherwise protect concurrent duplicates.

Choose key retention from the business retry window. Permanent uniqueness of operations such as payroll posting or provider confirmation must not depend solely on a short-lived key cache. Identify the underlying unique business reference.

A timeout may occur after the owner committed. Callers must reconcile or retry the same operation identity, not automatically create a new charge, invoice, or case.

## Synchronous calls

Choose a bounded timeout/deadline, retryable error classes, maximum retry attempts, and jittered backoff where needed. Retry only safe/idempotent operations. Avoid retries at every layer that multiply traffic. Propagate correlation context without forwarding unnecessary bearer credentials or private data.

Document which user operations fail, remain readable from local data, or enter pending state during dependency outages. Do not use cached permissions to allow sensitive actions beyond the approved freshness policy. Circuit breakers/bulkheads are options when the dependency behavior warrants them, not a mandatory framework for each call. [S21]

## Domain events

A command requests work from an owner. A domain event states a fact already committed by its owner. Keep names specific, such as `hr.payroll.approved.v1`, rather than broadcasting generic unrestricted database rows.

The approved envelope should define: event ID, type/schema version, source, aggregate ID and version or relevant sequence, occurred time, correlation/causation IDs, authorized tenant/company context where applicable, and minimal payload. Global public Location dataset events need an explicit separate scope/schema; do not represent them by a fake universal tenant ID.

Authenticate publishers/consumers and restrict channels by service and data sensitivity. Treat envelope context as assertions to validate against producer authorization, not arbitrary permission grants. Keep salary details, bank data, credential secrets, and unnecessary PII out of general-purpose topics.

Producer: commit the owner update and outgoing record together; use a durable outbox or approved equivalent. Consumer: atomically apply its own database effects and deduplication marker, then acknowledge. External side effects need their own durable operation identity and reconciliation; a local transaction cannot atomically include an external bank. [S06]

When using RabbitMQ, configure appropriate durable topology, publication confirmation, unroutable-message handling, consumer acknowledgements, bounded prefetch, retry/dead-letter policies, and redelivery tests. A publisher confirm and a consumer acknowledgement cover different stages. [S07]

Handle duplicates, gaps, and out-of-order delivery according to domain semantics. Do not globally drop older events merely because a later timestamp was seen. A delta event may require sequence recovery. Do not assume ordering across publishers, queues, or retry paths.

Keep dead-letter payloads protected. Authorized replay must preserve event identity, produce audit evidence, and not bypass business approval or re-execute historical live payments.

## Versioning and compatibility

Publish contracts with supported producer/consumer versions and a deprecation plan. Prefer compatible additions, but test the actual serializers/clients; adding fields or enum values is not universally safe. Keep supported older consumers working until their retirement is approved.

Use consumer contract tests and a mixed-version integration matrix. Do not solve a contract mismatch by requiring all unrelated services to deploy simultaneously. Shared TypeScript packages must not expose private models or force lockstep upgrades.

## Projections and bootstrap

For Location and Reporting, define a consistent snapshot plus checkpoint/watermark, then replay changes without loss or double counting. Record applied versions, gaps, lag, and resynchronization actions. Handle merges, deletions/retirement, corrections, and reversals explicitly.

Local projections are read-only copies, not alternate master data. Consumers must not synchronously ask the master for a label on every returned row. Make stale data visible where it affects decisions. [S05]

## Integration contract acceptance

Test validation and scope, duplicate commands, changed-payload key reuse, concurrent writes, timeout after commit, unsupported versions, duplicate/out-of-order events, consumer crash before acknowledgement, publication outage, restricted data access, bootstrap races, and safe replay. Record actual results, including NOT RUN.

# Phase 02 - Shared Platform Core (Version 2)

Read MASTER_PROMPT.md, the approved Auth scope/report, Phase 00 decisions, and PROGRESS.md. Implement only the authorized slice. Keep the shared capabilities as separate modules inside `apps/core` initially; apply the decision gate before extracting any deployment. Do not create six applications for six modules. Apply RELEASE_CHECKLIST.md to each released scope.

## Minimum before HR versus optional administration

The Phase 00 backlog must identify which Core capabilities each HR slice needs. Build the minimum usable company/branch and location flow, required delivery/storage, and secure audit first. Do not wait for every advanced template editor, provider adapter, full document browser, or operational dashboard before employee CRUD. A capability needed to protect or preserve an actual operation is not optional.

Mark unfinished work explicitly as BLOCKED, IN PROGRESS, or APPROVED DEFERRED. Only the approved minimum scope can be accepted as complete when optional work remains. Starting HR requires approval that its real prerequisites are satisfied; it must not be represented as full Phase 02 completion.

## Step 02.1 - Organization

Expand the existing Organization-owned tenant/company/branch scaffolding without recreating IDs. Implement company and branch identity, status, address, branding, time zone/language preferences, approved module enablement, and lifecycle controls. Validate branch-company-tenant relationships.

Auth owns user access assignments. HR will own employee assignments, departments, positions/grades, managers, work shifts, and leave calendars. Do not equate a department with a CRM sales team. Module disablement hides/blocks access according to policy without deleting domain history.

Build Company and Branch administration screens and integrate the existing company switcher. Keep cross-company visibility explicit.

## Step 02.2 - Location and reference data

Implement countries and administrative areas, including Cambodia's province/capital, district/municipality/khan, commune/sangkat, and village hierarchy where supported by an authoritative dataset. Store stable internal IDs, separate official codes as strings, Khmer/English labels, parent relationships, active/retired state, source, and dataset version. Do not invent official location codes or force the same hierarchy on every country.

Provide public/authorized lookup routes under `/api/v1/locations`, administrator-controlled import/validate/publish routes, and authenticated internal snapshot/change-feed routes. Validate hierarchy and ambiguous source data before publishing. Ordinary tenant admins may select official locations but may not rewrite the shared catalog. Keep custom sales territories separate.

For the approved first independent consumer, implement versioned snapshot bootstrap, incremental updates, gap detection, idempotent application, resynchronization, and sync-health reporting. For co-deployed modules, use approved local reference queries or internal interfaces instead; do not replicate data just to imitate separate services. Support small cached dropdown responses and bulk lookups. Do not require one network request per row on HR/customer/property lists.

Organization owns its address details. HR/Customer/Property will own theirs. Issued invoices/reports retain snapshots. Location never stores a global collection of private employee/customer addresses.

## Step 02.3 - Documents

Implement private storage, metadata, tenant/entity associations, authorized uploads/downloads, versioning, file size/type validation, malware/quarantine workflow, and short-lived access links where appropriate. Validate access to the business record before granting file access, through its owning service or a current authorized policy projection. Merely knowing a file ID is insufficient.

Keep approval and retention decisions with the domain's rules; Documents supplies storage capability. Do not release unscanned restricted uploads in production by silently skipping unavailable scanning. Isolate development storage. Preserve existing document references and print-template assets during migration.

## Step 02.4 - Notifications

Replace/complete the Phase 01 delivery interface with email and in-app delivery first. Add existing SMS/Telegram adapters where configured. Implement localization, templates, user preferences, delivery attempts, bounded retries, dead-letter handling, and safe replay.

The approved identity engine (provider or Core Auth) generates/verifies its authentication challenges. Notification only delivers when it is that engine's configured delivery path. Do not maintain a second OTP validator in Notifications. Keep secret-bearing OTP messages out of general message history, application logs, long-lived outboxes, and unrestricted admin screens. Any transient secret payload must have protected access, short retention, and expiry so workers cannot send an expired verification as if it were valid.

A failed notification must not undo a completed payroll approval or payment. Distinguish queued, sent/accepted, delivered where provider-confirmed, and failed; do not label accepted provider requests as confirmed delivery without evidence.

## Step 02.5 - Audit and operational plumbing

Implement append-only business/security audit ingestion with actor/service, tenant/company, action, record reference, timestamp, correlation ID, approved reason, and redacted change details. Separate this from debugging logs and performance metrics. Protect access/retention; never store passwords, OTPs, tokens, or unnecessary payroll details.

For an approved reliable cross-service event integration, implement the selected transport with producer transactional outbox, consumer inbox/deduplication, appropriate publication confirmation, acknowledgment after durable processing, bounded retries, dead-letter handling, and replay authorization. Use RabbitMQ only when approved, not as a prerequisite for every Core module. For in-process modules, use internal interfaces; persist critical asynchronous work rather than assuming in-memory events survive a crash. Define event schemas, restricted channels, duplicate/out-of-order behavior, and a versioned contract registry. Share transport helpers, not business repositories. Critical business audit must be durably recorded with the owner operation or its outbox so a central audit outage does not silently lose evidence.

## Required screens and APIs

Platform Settings for Companies, Branches, Locations/Dataset Versions, Documents, Notification Templates/Delivery Status, and Audit History. Display failed jobs and reference-data synchronization status without exposing sensitive payloads. Use scoped server pagination/search, not full-table downloads.

## Acceptance tests

Test hierarchy validation, leading-zero codes, Khmer/English names, old area retirement, duplicate/out-of-order updates, snapshot rebuild, and continued display from local reference copies during a Core lookup outage. Where a separate HR database is approved, build the reusable consumer contract/test fixture for Phase 03; do not fabricate a completed HR integration. Test co-deployed local lookup behavior instead when that is the approved topology.

Test cross-tenant files, expired links, malicious file attempts, notification retries, expired OTP delivery, redaction, unauthorized geography editing, and branch-company mismatch. Prove repeated events do not duplicate business/audit processing unintentionally.

## Done and stop

Deliver the authorized slice's real UI/APIs, migrations, tests, adapters, operating instructions, and provider limitations. Demonstrate branch creation and valid location selection for the required HR path. Record approved optional deferrals explicitly. STOP at the slice boundary; moving to HR or another slice needs approval.

## Slice authorization guide

02.1 = Organization; 02.2 = Location; 02.3 = Documents; 02.4 = Notifications; 02.5 = Audit and the first required durable integration. Each includes the minimum required administration and tests. The approved slice backlog may deliver prerequisites earlier but must not duplicate ownership.

Keep document access based on the owner record and current authorization, not just a client-supplied owner ID or object-storage path. Apply privacy/retention rules to audit and notification metadata; general platform administrators do not automatically gain payroll-file or OTP access.

Reference guidance: [S05-S08, S10] in SOURCES.md.

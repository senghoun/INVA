# Phase 06 - Customer and Contact Identity (Version 2)

Read MASTER_PROMPT.md, the approved deployment decision and the legacy-to-Finance party mapping. Implement only the authorized slice. Customer can be an isolated module in an approved commercial application or an independent service after its decision gate. Keep customer identity ownership explicit in either case. Independent services use private databases/roles; co-deployed modules use private repositories and internal interfaces. Apply RELEASE_CHECKLIST.md.

## Build sequence and ownership

1. Implement individuals, organizations, associated contact people, customer codes, multiple phones/emails, addresses, status, permitted relationship roles, and source history. One person may be a buyer, seller, landlord, borrower, or referrer without unrelated duplicate identities.
2. Implement authorized create/edit, server search/filtering, imports with preview/validation/rejected-row output, exports, and auditable change history. Use local reference geography and preserve Khmer/English names and leading-zero codes.
3. Implement candidate duplicate detection and reviewed merge, not automatic merge based only on matching phone/email/name. Preserve aliases/old IDs and notify downstream systems through versioned mappings. Preserve the actual legacy duplicate-import policy unless an explicit change is approved.
4. Replace Finance's legacy Customer read adapter with the new API/projection. Resolve each existing external reference through the migration map. Attach references to appropriate records without altering issued invoice billing snapshots or historical balances.
5. Publish minimal customer-created/updated/merged events to authorized consumers. Support safe rebuild of projections and reconciliation of old aliases. Keep relationship activity in CRM, financial balances in Finance, and case facts in PV.

## Privacy and UI

Do not expose customers across tenants merely because their phone numbers match. Enforce company/branch/record sharing policies from the approved model. Keep login/recovery phone changes in Auth separate from contact editing.

Build customer directory, detail, contact/address management, import review, merge review, and authorized cross-module summaries. A summary displays Finance/CRM/PV data from their contracts; it does not become another editable copy of those records.

## Migration and acceptance

Migrate records with source IDs/codes and reconciliation of customer counts, contact associations, addresses, Finance mappings, and duplicates. Quarantine conflicts and record approved resolution. Avoid silent normalization that loses original evidence.

Test shared family/company phone numbers, missing/N/A phones, Khmer names, duplicate imports, concurrent edits, reviewed merge, cross-tenant access, local geography sync, Finance links, and unchanged old invoice snapshots. Do not mark migration done while material unresolved identities remain.

Deliver the active slice's working UI/APIs, migrations, source mappings, contracts, reconciliation, and tests. Stop at the slice boundary; Property needs separate approval.

## Slice authorization guide

- 06.1 = identity/contact/address model.
- 06.2 = authorized CRUD, search, and controlled imports/exports.
- 06.3 = candidate duplicate review and controlled merge.
- 06.4 = replace the Finance legacy adapter and reconcile IDs.
- 06.5 = minimal update/merge contracts and source reconciliation.

Each build item maps to the corresponding slice above. Every slice includes its own required UI, permissions, relevant migration checks, and test evidence. Do not defer these to the final item.

Match old records using reviewed source mappings, not assumed global email/phone uniqueness. A merge must preserve aliases and prevent later requests to an old ID from recreating another editable identity. Define customer visibility across companies explicitly; tenancy and customer-sharing rules are not interchangeable.

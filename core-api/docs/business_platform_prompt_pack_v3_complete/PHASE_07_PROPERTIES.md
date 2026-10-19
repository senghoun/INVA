# Phase 07 - Property and Listings (Version 2)

Read MASTER_PROMPT.md, the approved property feature map, and its deployment decision. Implement only the authorized slice in the approved module/application. A separate Property service owns its database/role, migrations, artifact, and contracts; otherwise preserve module/table ownership with internal interfaces. Apply RELEASE_CHECKLIST.md.

## Build sequence

1. Implement property identifiers, types, administrative addresses/coordinates, land/building dimensions, physical features, owner/contact references, title/parcel references, and private documents. Use shared location IDs with local geography; house/street/parcel details remain owned here.
2. Implement sale/rent listings, asking prices, publication state, availability, marketing content, mandate references/dates, photos, and controlled publication channels. Distinguish the underlying property from its listing and from a valuation case snapshot.
3. Implement any approved reservation/hold workflow as the authoritative availability decision. Sales/CRM requests holds through this API; neither independently sets property availability. Use concurrency control, unique active-hold rules, authorized expiry/release, and idempotency.
4. Provide authorized search/filtering, map/list/detail screens, imports, exports, media integration, and minimal property/listing/reservation events. Preserve the actual required field order, validations, codes, existing maps, ownership/referral details, and mobile/API contracts identified in the audit.

## Boundaries

Customer owns contact identity. CRM owns buyer needs, showings, and follow-ups. PV owns valuation evidence/conclusions. Finance owns invoices/receipts. Asking price is not assessed value. A collateral property must not automatically become a public listing.

Do not add tenant lease/maintenance operations or an automated valuation engine unless separately approved. External map provider availability, licensing, and coordinates must be validated for the configured deployment; missing map credentials should not corrupt address data.

## Migration and acceptance

Preserve property/listing identities, historical status, media links, owner references, dimensions, dates, and document access. Reconcile property/listing counts, relationships, and active availability against legacy data. Do not collapse several listings into one property without a reviewed mapping.

Test duplicate submissions, concurrent reservations, hold expiry, invalid location hierarchy, restricted ownership documents, cross-company access, unavailable map service, and record display without live Location calls. Demonstrate approved listing changes persist and publish correct idempotent events.

Deliver the active slice's backend/UI, migrations, maps/media behavior, source mapping, contracts, tests, and run instructions. Stop at the slice boundary; CRM requires approval.

## Slice authorization guide

- 07.1 = property records, valid address, ownership references, and protected media.
- 07.2 = listings, asking prices, mandates, and publication states.
- 07.3 = authoritative reservation/hold decisions under concurrency.
- 07.4 = search/map/import/export workflows and migration reconciliation.

Each build item maps to the corresponding slice above. Every slice includes its own required UI, permissions, relevant migration checks, and test evidence. Do not defer these to the final item.

Separate current asking prices from immutable valuation case conclusions. Do not conflate a cadastral parcel, property, and marketing listing without an approved model. Internal database holds and external reservation commands must use the same authoritative availability rules.

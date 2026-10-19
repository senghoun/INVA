# Source-to-PostgreSQL preservation map

Status: CURRENT POSTGRESQL SOURCES INVENTORIED; original legacy import design BLOCKED on source/schema access. Current Prisma migrations are not proof of an import or a restored database.

| Source group | Existing target | Preserve / reconcile | Unresolved |
|---|---|---|---|
| Auth users/roles/sessions | `prisma/auth/schema.prisma` | UUID, normalized email, status, role links, temporary-password flags; keep hashes protected | Actual legacy hash format, duplicates, IdP mapping and memberships. |
| HR organization/employee | `prisma/hr/schema.prisma` | UUID, employeeCode, Auth link, company/branch/manager hierarchy, Khmer/English names, date fields | Orphans, mismatched branch/company, incomplete company assignment; no universal default. |
| Salary | HR Float baseSalary | Preserve original value and provenance; proposed Decimal migration must compare approved rounded totals | Currency/precision/rounding and actual historical salary values. |
| Attendance/leave | HR records/requests/entitlements | Employee-day uniqueness; schedule/timezone; request history; total/used/remaining balances | Missing entitlements, carryover/cancellation/cross-year/holiday policy and concurrent approvals. |
| CRM | CRM customers/orgs/deals | Auth/customer links, org identity, amounts/currency, owner reference, closedAt | Auth user versus employee owner meaning; duplicates/merge rules. |
| Finance | AC invoices/items/ledger | Issued number, status, exact Decimal values, line totals, balanced ledger and approver reference | Duplicate billing, numbering/approval races, historical balances. |
| Other legacy domains/files | No supplied legacy source | Source-to-target identifiers, file hashes, histories and approvals required | Source access and scope. |

Future import mapping: sourceSystem + sourceTable + sourceId -> target UUID, mapping version, import batch, source fingerprint, disposition. Quarantine ambiguous references; do not merge on matching email/phone. Imports must be repeatable/resumable and side effects disabled. Compare counts, per-company totals, relationships, time/date conversions and approved financial sums. No data was exported or imported in this audit.

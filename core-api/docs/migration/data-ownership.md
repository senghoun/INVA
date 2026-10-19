# Data ownership — observed and proposed

Status: PROPOSED, approval pending. Preserve UUIDs and one writer; never create replacement organization IDs to fit a folder diagram.

| Capability | Current writer / source | Proposed owner | Atomic invariants / migration constraint |
|---|---|---|---|
| Credentials, sessions, global roles | Auth schema/service | One selected identity engine plus platform Access | Credential/session revocation; no second credential authority. |
| HR permission catalog/assignments | HR `HrRole`, `EmployeeHrRole` | HR policies; platform memberships in Access | Keep existing grants until reviewed scope mapping; no privilege expansion. |
| Companies/branches | HR Company/Branch, OrganizationService | Organization logical module, initially existing HR storage | Company/branch relationship and stable IDs; physical move deferred. |
| Employees/schedules/attendance/leave | HR schema/services | HR | Review + entitlement effects must commit together. |
| Payroll | No implementation identified | HR | Decimal/versioned approvals and pending Finance handoff; rules unknown. |
| Customers/external businesses | CRM CustomerProfile/ClientOrganization | Customer logical module within existing CRM initially | Customer organization is not an internal tenant company. |
| Deals/opportunities | CRM Deal | CRM | Transition and durable billing intent commit together. Owner UUID semantics unresolved. |
| Invoices/items/ledger | AC | Finance | One authorized approval, balanced entries, numbering, deduplicated billing. |
| Verified payments | No implementation identified | Finance Payments module initially | Verification and allocation semantics require approved contract. |
| Locations/delivery/storage/audit | Auth audit exists; other capabilities not established | Separated platform modules as needed | Avoid copying geographic/auth authorities into HR/Finance. |
| IT assets | IT placeholder model | Existing IT boundary retained | No new workflow inferred. |
| Property/Valuation/Sales/Reporting | No authoritative implementation identified | Owners from pack, deployment deferred | Source and acceptance rules required before extraction. |

Consumers use APIs/events across independent processes. Shared technical code may carry typed context/contracts, not private ORM clients. Company identity location, scoped grants, and cross-database consistency are proposed in ADR-003.

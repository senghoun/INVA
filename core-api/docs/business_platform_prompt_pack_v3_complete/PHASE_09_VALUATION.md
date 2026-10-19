# Phase 09 - Property Valuation (PV) (Version 2)

Read MASTER_PROMPT.md, the actual valuation source, approved workflow and deployment decisions. Implement only the authorized slice. Preserve PV as a distinct domain; use an independent database/application only when its decision gate is approved, otherwise private modules/interfaces in the approved deployment. Apply RELEASE_CHECKLIST.md. Preserve professional review controls; do not describe the software as automatically certified or as a substitute for authorized valuation judgment.

## Build sequence

1. Implement intake, client/bank and borrower references, purpose, property references, assigned staff, case documents, inspection scheduling/findings, comparable evidence, calculations/adjustments, comments, deadlines, and case history.
2. Save case-specific property/address/evidence snapshots. Updating a current Property or Customer record must not silently rewrite an approved valuation report. Preserve legacy calculations and dynamic parameters through audited regression fixtures.
3. Implement the approved case workflow. Proposed default: Draft -> Pending -> Review -> Approved. Track report issuance separately: Not Issued -> Issued -> Superseded. The audit must explicitly map legacy status codes rather than guessing equivalents.
4. Keep feedback, missing information, urgent priority, support requests, and blocking conditions separate from the main lifecycle where appropriate. Define allowed transitions, responsible roles, reasons, and separation-of-duties rules. Fresh MFA does not bypass case permissions.
5. After approval/issuance, amendments create a controlled revision with linked reason/evidence and the required review trail. Preserve earlier approved/issued versions. Do not revert approved cases silently or overwrite historical calculations.
6. Integrate Finance billing/payment eligibility, Documents, and Notifications. Approval and permission to release are distinct: a payment-before-release policy can hold delivery without erasing approval. No single notification failure should undo a valid approval.

## UI and external access

Build intake, queue, assignment, inspection/calculation, technical review, approval, issue/revision, and case reporting views. Preserve actual report templates, Khmer/English layout, exports, and branch/client access rules. Bank users may be external Auth users, not employees. Require case-specific access for bank portal documents.

## Migration and acceptance

Migrate all cases, status history, calculations, adjustments, property snapshots, documents, approvals, and issuance/revision links. Reconcile calculation outputs and report values against approved fixtures, with controlled explanations for differences.

Test unsupported transitions, reviewer/approver scope, concurrent edits, approval version binding, amendment history, restricted bank access, unchanged old reports after address edits, payment hold/release, and exports. Do not treat the proposed workflow as an international compliance claim.

Deliver the active slice's backend/UI, reports, migrations, tested workflow rules, contracts, and reconciled history. Stop at the slice boundary; Sales requires approval.

## Slice authorization guide

- 09.1 = case intake, assignment and inspection/evidence foundations.
- 09.2 = controlled snapshots and source-based calculation fixtures.
- 09.3 = main review/approval workflow with explicit legacy-status mapping.
- 09.4 = feedback, urgency, blockers, and support handling.
- 09.5 = amendments/revisions with preserved approved versions.
- 09.6 = Finance eligibility, Documents, Notifications and external bank access.
- 09.7 = report/output reconciliation and release evidence.

Each build item maps to the corresponding slice above. Every slice includes its own required UI, permissions, relevant migration checks, and test evidence. Do not defer these to the final item.

Approval binds to the exact case/report inputs reviewed. Report issuance/release and payment eligibility are separate conditions. Do not use an out-of-date Finance summary to release a restricted report when policy requires a current check. Record who reviewed, approved, issued, and amended each version.

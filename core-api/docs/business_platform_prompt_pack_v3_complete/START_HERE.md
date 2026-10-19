# Copy-and-paste messages

## 1. First message: audit only

```text
Read docs/business_platform_prompt_pack_v3_complete/MASTER_PROMPT.md,
docs/business_platform_prompt_pack_v3_complete/ARCHITECTURE_DECISION_GATE.md,
docs/business_platform_prompt_pack_v3_complete/OWNERSHIP_AND_DEPENDENCIES.md, and
docs/business_platform_prompt_pack_v3_complete/PHASE_00_AUDIT.md.

Inspect my actual old project and run Phase 00 only.
The target stack is NestJS, React, TypeScript, and PostgreSQL.

Do not change application code, install or upgrade dependencies,
modify database records, or switch live routes in this phase.
Documentation and safe read-only inspection are allowed.

Identify existing business rules, permissions, schemas, integrations,
legacy compatibility, and the single authoritative owner of each record.

Evaluate which boundaries need separate deployments. A phase does not
automatically become a microservice. Evaluate the identity provider,
gateway, ORM, and event transport before committing to them.

Create the audit, feature map, ownership/dependency map, architecture
decisions, migration/reconciliation/rollback plan, and slice backlog.
Separate observations from recommendations and unverified assumptions.

Do not infer details from an architecture image or invent source access.
List genuine blockers. Show the proposed Phase 01.1 work and stop for approval.
```

## 2. After approving the audit: start the first Auth slice

```text
Read docs/business_platform_prompt_pack_v3_complete/MASTER_PROMPT.md,
docs/business_platform_prompt_pack_v3_complete/PHASE_01_AUTH.md, the approved audit and decisions,
and docs/migration/PROGRESS.md.

Implement approved slice 01.1 only.
Use the approved identity engine and deployment topology.
Do not create every future service or add unapproved infrastructure.

Before editing, name the files and behavior this slice changes.
Preserve existing supported behavior and compatibility.
Run the relevant checks and record actual results.
Update the feature map, acceptance report, and PROGRESS.md.
Stop before slice 01.2 and wait for approval.
```

## 3. Continue or authorize a different slice

```text
Read the Version 3 master prompt, the active phase file, the approved
audit/decisions, and docs/migration/PROGRESS.md.

Active phase file: [EXACT FILE]
Authorized slice: [EXACT SLICE ID]
Approved rollout scope: [LOCAL / STAGING / SEPARATELY AUTHORIZED PRODUCTION SCOPE]

Implement only that slice. Recheck actual repository state and previous
acceptance evidence. Reuse existing completed work; do not regenerate it.

Apply the service decision gate before adding a deployable application.
Apply contract conventions and the release checklist where relevant.
Report PASS / FAIL / NOT RUN with evidence. Record blockers and approved
deferrals separately. Stop at this slice boundary.
```

Replace bracketed fields before submitting. A local implementation instruction never authorizes live payments, real mass notifications, destructive migrations, or production routing changes.

## 4. Review before accepting a slice

```text
Review the completed slice against its acceptance criteria and
docs/business_platform_prompt_pack_v3_complete/RELEASE_CHECKLIST.md. Do not add features.

Check source-to-target behavior, tenant/permission isolation, financial
or approval invariants, API/event compatibility, migration safety,
independent deployability where applicable, and actual test evidence.

Report findings with severity, affected files, reproducible evidence,
and required fixes. Distinguish observed defects from risks not yet tested.
Do not mark the slice complete while required checks remain failing or unrun.
```

## 5. Resume in another coding-agent session

```text
Read docs/business_platform_prompt_pack_v3_complete/MASTER_PROMPT.md, the current phase file,
docs/migration/PROGRESS.md, its linked acceptance report, and approved ADRs.

Confirm the real repository state, active slice, outstanding blockers,
and next authorized action. Do not assume prior chat claims are test evidence.
Continue only the already-authorized unfinished work. Do not move to the
next slice or recreate existing services without approval.
```

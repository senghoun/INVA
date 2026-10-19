# Phase 08 - CRM and Customer Relationships (Version 2)

Read MASTER_PROMPT.md, the approved CRM feature map, deployment decision and Customer/Property contracts. Implement only the authorized slice. CRM may remain in an approved commercial deployment with private module repositories; a separate CRM service must pass its decision gate and own its database/artifact/migrations. Keep Customer, Property and Finance ownership intact. Apply RELEASE_CHECKLIST.md.

## Build sequence

1. Implement lead capture/source/assignment, qualification, opportunities and pipelines, lead/customer linking, requirements, tasks, notes, calls, follow-ups, reminders, appointments, property showings, and outcomes. A lead may remain unqualified before being linked to a formal Customer identity.
2. Integrate Customer identity and Property matching/search through contracts or justified local projections. Never create competing customer masters, independent listing availability, or editable Finance balances inside CRM.
3. Reproduce existing permission scope, follow-up tabs, date filters, count/deduplication rules, notes requirements, favorites, assignment logic, calendars, activity history, and exports from source evidence. Make any proposed behavior change explicit rather than silently replacing a mature workflow with generic CRUD.
4. Add authorized team/agent dashboards with clear metric definitions and correct date/time-zone behavior. Ensure table, totals, and exports use the same filtered/scoped query logic. Do not count many joined activity rows as many unique customers or employees accidentally.
5. Integrate notifications and later Sales/PV summaries without blocking normal CRM work on unrelated services. Keep clear pending/retry states for incomplete integrations.

## AI boundary

AI is optional after the operational CRM passes its acceptance tests. Any approved AI feature may summarize, suggest matches, or draft text using permission-filtered data. It must not directly edit databases, publish listings, approve money movement, or turn unavailable providers into a broken core workflow.

## Migration and acceptance

Migrate leads, ownership, customer/property links, activities, scheduled follow-ups, and pipeline history. Reconcile counts by the audited rules, not only raw row totals. Preserve prior timestamps and historical outcomes.

Test today/overdue/upcoming boundaries in the configured time zone, follow-up deduplication, note-before-completion rules where present, search, calendar overlap, assignment scope, export parity, customer-merge mappings, cross-tenant access, and provider downtime. Demonstrate a lead -> qualified customer -> property requirement -> showing/follow-up sequence with correct history.

Deliver the active slice's working APIs/UI, migrations, metric definitions, regression tests, and source reconciliation. Stop at the slice boundary; Valuation needs approval.

## Slice authorization guide

- 08.1 = lead capture, qualification, opportunity pipeline, and minimum working follow-up.
- 08.2 = Customer/Property integration and requirement matching.
- 08.3 = complete audited activity/calendar/follow-up behavior and export parity.
- 08.4 = scoped dashboards using agreed metric definitions.
- 08.5 = required notification/downstream summaries and migration acceptance.

Each build item maps to the corresponding slice above. Every slice includes its own required UI, permissions, relevant migration checks, and test evidence. Do not defer these to the final item.

Keep AI in a separate approved backlog after the operational CRM passes. Do not block normal relationship work on an optional AI, map, or reporting provider. When a cross-domain summary is unavailable, show that limitation rather than a fabricated zero balance or empty customer history.

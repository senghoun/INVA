# Version 3 Prompt Pack

This pack is the latest consolidated version.

## Main change in V3
`MASTER_PROMPT.md` has been upgraded with stricter frontend and backend architecture standards:

- ChatGPT-inspired admin application shell and interaction model.
- Feature-first React organization.
- Shared reusable UI components and design tokens.
- No copy/paste UI patterns across modules.
- TanStack Query server-state conventions.
- Consistent form, table, API, permission, error, and state patterns.
- Feature-first NestJS module organization.
- Thin controllers and explicit application use cases.
- Clear domain/business-rule ownership.
- Explicit infrastructure adapters and database boundaries.
- Shared technical code only; no shared mutable business models.
- Consistent validation, request context, authorization, observability, transactions, and testing.
- Anti-overengineering guidance: reuse without creating giant generic abstractions.

All existing V2 phase prompts remain included and are governed by the V3 master prompt.

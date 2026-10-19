# ADR-001 — Reuse topology and establish supported foundations

Status: PROPOSED. Date: 2026-10-01. Approval: PENDING. Slice: 01.1. Reviewer: platform owner (unconfirmed).

Evidence: six applications in `nest-cli.json`; five Prisma domains; existing gateway security/docs/telemetry; portal layout/common components. No hosting/team/load measurements supplied.

Compare retaining current applications with consolidating into a new Core app or extracting additional services. Retention preserves contracts and existing workflows with minimal migration; it retains network/auth coupling and operational cost. Consolidation might reduce deployments but changes schema ownership, routes and release behavior without workload evidence. New extraction adds deployments, private schemas, recovery and monitoring with no demonstrated immediate benefit.

Proposal: RETAIN existing deployments for this iteration; separate logical responsibilities through modules/interfaces when needed. DEFER consolidation/extraction. Gateway stays for current proxy/docs/policy responsibilities; do not create another BFF without evidence. Existing Bull/Redis billing remains; do not add RabbitMQ. Runtime service credentials, data roles and aggregate pools require review before any independent release. Each service must own migrations and enforce scope when reached directly.

Keep installed versions for Phase 00; do not upgrade merely to latest. Current lockfile/Node observations are in audit. Select a supported LTS Node/toolchain in the implementation plan and test every build/test path. The current Nest guide covers a different major from this project's Nest 11, so follow the corresponding versioned guide before any upgrade. Current Vite guidance documents runtime floors; successful type checking does not certify the host as a supported production runtime. [Nest migration guide](https://docs.nestjs.com/migration-guide), [Vite guide](https://vite.dev/guide/) checked 2026-10-01.

Frontend: retain React/Tailwind/shared controls, add TanStack Query and React Hook Form only for required first workflows, approve one form schema library, and centralize tokens/typed API errors/scope keys incrementally. Prisma stays unless an explicit approved alternative solves a real problem. Salary conversion needs exact monetary types; PostgreSQL distinguishes exact numeric from inexact floating point. [PostgreSQL numeric types](https://www.postgresql.org/docs/current/datatype-numeric.html).

Compatibility/recovery: expand-only migrations, documented API/event versions, old clients retained until parity; rollback after new writes follows cutover plan. No service-readiness certification until independent artifacts, two-company/API tests, pool limits, restore and failure checks pass. Workload/pool/latency estimates are UNSET, not measured. Confirm hosting and ingress before specifying counts or deadlines beyond existing behavior.

## Local maintenance authorization, 2026-10-01

The user requested further best-practice improvements after receiving the audit. Under that scope, 01.1a reuses all current deployments, credentials and component boundaries, adds no infrastructure or package upgrade, and fixes shared startup/health/logging/tooling and employee failure behavior. This records the implementation scope actually taken; broader runtime/provider/data ownership proposals remain PENDING. See `../acceptance/01.1a-foundation.md`.

## Current implementation decision, 2026-10-01

Under the user's subsequent request to implement the complete pack for a new platform, retain and harden the existing service topology and application-managed Auth for local implementation. No new external identity deployment or competing OAuth/OIDC authority is introduced. Use Argon2id with compatible bcrypt upgrade, cookie browser sessions, local TOTP and recovery-code verification, TanStack Query, React Hook Form and Zod. This records the implementation decision taken under broad task authorization; it is not an independent production security approval. Remaining provider/passkey/assurance/restore/release acceptance stays open.

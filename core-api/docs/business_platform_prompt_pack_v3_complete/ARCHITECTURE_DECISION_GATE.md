# Architecture Decision and Service-Readiness Gate

Read with the master prompt before adding a deployment, database boundary, identity engine, gateway, or broker. A decision to retain a module is valid; do not invent operational benefits to justify extraction. [S01]

## Gate A - Business boundary

Record in `docs/migration/decisions/` using `templates/ADR_TEMPLATE.md`:

1. The capability and its business owner, authoritative records, allowed state transitions, and consumers.
2. The invariants that must commit atomically, such as balanced ledger posting or exclusive active property reservation.
3. The actual dependency graph and expected call volume for important user journeys.
4. The separation benefit: independent release, different load, security isolation, operational ownership, or a proven integration boundary.
5. The cost: deployments, migrations, secrets, network failures, synchronization, observability, backups, and on-call work.
6. Whether the current team and hosting can operate that cost. Do not assume a dedicated team or hosting capacity that has not been confirmed.

If functions constantly call each other or always need coordinated data/schema releases, reconsider the split. A department name, menu, table, or CRUD endpoint is not enough to justify a service.

## Gate B - Compare deployment choices

| Choice | Required documentation |
|---|---|
| Isolated module inside an existing NestJS app | Owning module, private repositories, public internal interfaces, schema/table ownership, intentional shared transactions/FKs, and potential future extraction work. |
| Independent NestJS service | All module requirements plus its artifact, private data access, API/event contracts, service identity, failure policy, deployment, supported version combinations, monitoring, recovery, and migration plan. |

Within one deployment, do not add HTTP loops or a broker solely to simulate microservices. Across deployment boundaries, do not bypass contracts through shared ORM clients or direct database access. Independently deployed services must not depend on an atomic transaction across their databases.

Record `RETAIN MODULE`, `EXTRACT SERVICE`, or `DEFER DECISION`, with reasoning and approval. Revisit when actual needs change; do not scaffold the future deployment immediately.

## Gate C - Authentication engine

Compare the existing suitable identity system, at least one maintained provider candidate when relevant, and an application-managed option. Assess MFA/passkeys, recovery, session revocation, OIDC/browser/mobile compatibility, migration, tenant policy, availability, operating effort, and total cost. A provider such as Keycloak is a candidate, not a silent requirement. [S09]

Select one credential authority. Identify where platform memberships and scoped grants live; avoid a second competing editable authority. With OIDC, document issuer/subject mapping, approved flows, audience checking, redirect validation, assurance claims, and logout/revocation semantics. Do not infer a verified identity from email matching.

If application-managed authentication is chosen, record the maintenance/security responsibility and required review. The NestJS requirement does not require building authentication protocols from scratch.

## Gate D - Gateway and transport

Evaluate existing ingress/reverse-proxy/hosting capabilities before adding a custom gateway. Add a BFF only for a specific browser-session or composition responsibility, with its own failure and security design. No payroll, ledger, or approval logic in the gateway. [S02]

For every integration choose in-process interface, synchronous API, or durable asynchronous processing. Record immediate consistency needs, acceptable delay, timeouts, retry safety, and expected failure behavior. Use a broker only when justified. A durable background job and a cross-service domain event are different contracts. [S21]

Do not deploy both RabbitMQ and a separate queue stack without separate, demonstrated requirements. Redis caches must not become the only copy of durable invoices, payroll, or critical workflow progress.

## Gate E - Readiness before an independent service release

Provide evidence that the service:

- Builds into its own artifact and can deploy with supported existing consumer versions.
- Owns its schema/migration lifecycle without another service changing its private tables.
- Enforces authorization and tenant scope even when bypassing the public gateway is attempted.
- Has defined deadlines, safe retries, bounded worker/pool sizes, and outage behavior.
- Handles contract versions, duplicates, out-of-order events, and replay as applicable.
- Provides useful health, logs, metrics, traces, and operator recovery instructions.
- Can restore its data and reconcile effects that cross service boundaries.
- Passes the applicable `RELEASE_CHECKLIST.md` checks with real evidence.

A service can need other services to perform a business transaction without needing them to deploy in lockstep. Independence does not mean the entire platform works with every dependency offline.

## Output

Return the approved boundary, alternative rejected or deferred, decision evidence, resulting code/database layout, supported contract versions, required tests, and the first small vertical slice. Do not proceed with unapproved structural changes.

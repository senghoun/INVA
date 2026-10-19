# Primary Technical References - Version 2

Checked when preparing this pack on 2026-10-01. Recheck official documentation and supported package versions during Phase 00 and before relevant implementation.

These references support general engineering patterns. They do not prescribe this project's service count, domain allocation, phase order, hosting budget, exact security defaults, statutory rules, or performance. Those are proposed project requirements requiring approval and actual tests. No tax, labor, NSSF, accounting-compliance, or valuation-certification claim is made by this pack.

## [S01] Microservice boundaries - Microsoft Learn

Business responsibilities, coupling, service size and independent deployment.

```text
https://learn.microsoft.com/en-us/azure/architecture/microservices/model/microservice-boundaries
```

## [S02] API gateways - Microsoft Learn

Gateway responsibilities and technology selection; not a mandate for a custom NestJS proxy.

```text
https://learn.microsoft.com/en-us/azure/architecture/microservices/design/gateway
```

## [S03] NestJS workspaces - NestJS

Standard and monorepo code organization.

```text
https://docs.nestjs.com/cli/monorepo
```

## [S04] Strangler Fig pattern - Microsoft Learn

Incremental replacement of legacy functionality.

```text
https://learn.microsoft.com/en-us/azure/architecture/patterns/strangler-fig
```

## [S05] Data considerations for microservices - Microsoft Learn

Owned data, local projections, consistency and cross-domain read needs.

```text
https://learn.microsoft.com/en-us/azure/architecture/microservices/design/data-considerations
```

## [S06] Transactional outbox pattern - AWS Prescriptive Guidance

Reliable business-state/event publication and idempotent downstream handling.

```text
https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html
```

## [S07] Consumer acknowledgements and publisher confirms - RabbitMQ

Broker delivery and processing acknowledgement stages.

```text
https://www.rabbitmq.com/docs/confirms
```

## [S08] Microservices Security Cheat Sheet - OWASP

Trust boundaries, authentication context and service authorization.

```text
https://cheatsheetseries.owasp.org/cheatsheets/Microservices_Security_Cheat_Sheet.html
```

## [S09] Server Administration Guide - Keycloak

An identity-provider candidate with configurable authentication, OTP, passkeys and sessions.

```text
https://www.keycloak.org/docs/latest/server_admin/index.html
```

## [S10] Multi-Tenant Security Cheat Sheet - OWASP

Tenant-context validation and isolation across database, cache, files and asynchronous work.

```text
https://cheatsheetseries.owasp.org/cheatsheets/Multi_Tenant_Security_Cheat_Sheet.html
```

## [S11] Multifactor Authentication Cheat Sheet - OWASP

Authentication factors, OTP handling, enrollment and recovery risks.

```text
https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html
```

## [S12] Build a React app from scratch - React

React application tooling options and framework tradeoffs.

```text
https://react.dev/learn/build-a-react-app-from-scratch
```

## [S13] Session Management Cheat Sheet - OWASP

Session transport, lifecycle and security controls.

```text
https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
```

## [S14] Row security policies - PostgreSQL

RLS behavior, policies and privileged-role caveats.

```text
https://www.postgresql.org/docs/current/ddl-rowsecurity.html
```

## [S15] Numeric types - PostgreSQL

Exact numeric representation versus inexact floating point.

```text
https://www.postgresql.org/docs/current/datatype-numeric.html
```

## [S16] Data migration using expand and contract - Prisma

Staged schema/data change and compatible application transition.

```text
https://www.prisma.io/docs/guides/database/data-migration
```

## [S17] Observability primer - OpenTelemetry

Logs, metrics and traces as complementary operational signals.

```text
https://opentelemetry.io/docs/concepts/observability-primer/
```

## [S18] Transaction Authorization Cheat Sheet - OWASP

Sensitive transaction confirmation and authorization tied to business actions.

```text
https://cheatsheetseries.owasp.org/cheatsheets/Transaction_Authorization_Cheat_Sheet.html
```

## [S19] Prisma recipe - NestJS

Prisma integration as a NestJS data-access option.

```text
https://docs.nestjs.com/recipes/prisma
```

## [S20] Health checks (Terminus) - NestJS

Health-check implementation tooling. The proposed liveness/readiness and dependency policy must be designed for the chosen hosting environment.

```text
https://docs.nestjs.com/recipes/terminus
```

## [S21] Interservice communication - Microsoft Learn

Synchronous/asynchronous choices, resilience, versioning and distributed communication.

```text
https://learn.microsoft.com/en-us/azure/architecture/microservices/design/interservice-communication
```

## [S22] Password Storage Cheat Sheet - OWASP

Maintained password hashing and secure legacy hash migration considerations.

```text
https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
```

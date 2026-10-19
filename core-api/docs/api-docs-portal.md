# Developer Docs Portal (`/api/docs`)

The API Gateway serves a complete developer documentation experience — no separate
tooling, no build step, everything generated from the running services.

## Pages

| URL | What it is |
| --- | --- |
| `GET /api/docs` | **Developer portal** — landing page with live service status cards, quick-start, one-click token helper, and raw spec links. |
| `GET /api/docs/reference` | **API reference console** (Swagger UI) — unified + per-service definitions, persisted authorization, request duration, filter box. |
| `GET /api/docs/status` | JSON liveness per service (`online`, `connected`) used by the portal badges. |
| `GET /api/docs/portal.js` | Portal client script (status polling + token helper). |
| `GET /api/docs/specs/all.json` | Unified OpenAPI document merging all microservices (also consumed by the super-app). |
| `GET /api/docs/specs/{auth,hr,crm,ac,it}.json` | Per-service spec, rewritten to execute through the Gateway. |
| `GET /api/docs/specs/gateway.json` | Gateway-core spec (health endpoints). |

## Portal features

- **Live status cards** — each service card shows an UP / DOWN / DISCONNECTED badge
  (polled every 30 s from `/api/docs/status`), its port, and a starter endpoint.
  Clicking a card opens the reference console with that service's definition pre-selected.
- **Get a Token** — log in with email/password; on success the JWT is stored in
  `localStorage` and written into the Swagger UI `authorized` store, so the reference
  console is already authorized when you open it. `Clear stored token` removes both.
  Handles the `requiresPasswordChange` response with next-step guidance.
- **Quick Start** — four-step onboarding for new developers.

## Reference console features

- **Definition picker** (top right): Unified Hub, one per service, Gateway core.
  The last selection is remembered per browser and restored on the next visit.
- **`← Developer Portal`** button in the topbar.
- **Persisted authorization** — access tokens survive page reloads.
- **Filter box** — press `/` anywhere to jump to it.
- **Request timing**, example-first model rendering, and vendor extensions shown.
- All "Try it out" calls execute against the Gateway origin (`servers: /`), so they
  are routed, rate-limited and telemetry-recorded exactly like real client traffic.

## Architecture

```
apps/api-gateway/src/docs/docs-registry.ts   ← single source of truth (services, names, ports, spec urls)
apps/api-gateway/src/docs/portal.page.ts     ← portal HTML template (server-rendered)
apps/api-gateway/src/docs/portal.assets.ts   ← portal.js + reference-page script (plain strings)
apps/api-gateway/src/controllers/docs.controller.ts ← serves portal / status / specs
libs/common/src/swagger/swagger-ui-preset.ts ← shared Swagger UI options + CSS for ALL services
```

Adding a microservice: add one entry to `DOC_SERVICES` in `docs-registry.ts` — the
portal card, reference picker, status probe, unified spec merge and proxy already
pick it up automatically.

## Notes

- Docs are served only when `NODE_ENV !== 'production'`.
- Downstream specs are cached in-memory for 10 s; probes time out after 1.5 s.
- The gateway Swagger UI lives at `api/docs/reference` (v11 of `@nestjs/swagger`
  serves its static assets under that prefix, which is why the DocsController can
  safely own `api/docs/*` JSON/HTML routes).

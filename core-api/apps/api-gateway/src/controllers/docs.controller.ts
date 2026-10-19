import { Controller, Get, Header, NotFoundException, Param } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { serviceToggleStore } from '../telemetry/service-toggle.store';
import { DOC_SERVICES, DOCS_ROUTES } from '../docs/docs-registry';
import { buildPortalHtml } from '../docs/portal.page';
import { PORTAL_JS } from '../docs/portal.assets';

/** How long fetched downstream specs stay cached (ms). */
const SPEC_CACHE_TTL_MS = 10_000;
/** Per-service liveness probe timeout (ms). */
const PROBE_TIMEOUT_MS = 1_500;

/**
 * Non-authenticated documentation surface served by the API Gateway:
 *
 *   GET /api/docs               → developer portal (HTML)
 *   GET /api/docs/portal.js     → portal client script
 *   GET /api/docs/status        → live per-service status for the portal
 *   GET /api/docs/specs/*.json  → OpenAPI specs (unified / per-service / gateway)
 *
 * The interactive Swagger UI reference console lives at /api/docs/reference
 * (mounted in main.ts via SwaggerModule.setup) and consumes these specs.
 */
@ApiExcludeController()
@Controller(DOCS_ROUTES.portal)
export class DocsController {
  private readonly specCache = new Map<string, { spec: unknown; fetchedAt: number }>();

  constructor(
    private readonly config: ConfigService,
  ) {}

  /** Actual port this gateway is listening on (also correct on custom ports). */
  private get gatewayPort(): number {
    return this.config.get<number>('GATEWAY_PORT', this.config.get<number>('PORT', 3000));
  }

  // ── Portal page & assets ──────────────────────────────────────────────────

  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  getPortal(): string {
    return buildPortalHtml();
  }

  @Get('portal.js')
  @Header('Content-Type', 'text/javascript; charset=utf-8')
  getPortalJs(): string {
    return PORTAL_JS;
  }

  // ── Live status for the portal service cards ─────────────────────────────

  @Get('status')
  async getStatus() {
    const services = await Promise.all(
      DOC_SERVICES.map(async (svc) => {
        const upstream = this.resolveUpstream(svc);
        return {
          key: svc.key,
          name: svc.name,
          port: svc.port,
          online: await this.isServiceUp(upstream),
          connected: serviceToggleStore.isConnected(svc.toggleKey),
          specReachable: Boolean(await this.fetchSpec(svc, { cache: false })),
        };
      }),
    );

    return { status: 'OK', checkedAt: new Date().toISOString(), services };
  }

  // ── OpenAPI specs ─────────────────────────────────────────────────────────

  /** Gateway-core spec (health endpoints only). */
  @Get('specs/gateway.json')
  getGatewaySpec() {
    return {
      openapi: '3.0.0',
      info: {
        title: 'inva Core API Gateway',
        description: 'Gateway health and proxy orchestration',
        version: '2.0',
      },
      servers: [{ url: '/', description: `API Gateway Hub (Port ${this.gatewayPort})` }],
      tags: [{ name: 'gateway', description: 'API Gateway routing and health' }],
      paths: {
        '/health': {
          get: {
            summary: 'Health check of API Gateway and downstream services',
            operationId: 'GatewayHealth',
            tags: ['gateway'],
            responses: { 200: { description: 'Gateway and downstream status' } },
          },
        },
      },
    };
  }

  /** Single downstream service spec, rewritten to execute through the Gateway. */
  @Get('specs/all.json')
  async getUnifiedSpec() {
    const mergedPaths: Record<string, unknown> = {
      '/health': {
        get: {
          summary: 'Health check of API Gateway and downstream services',
          operationId: 'GatewayHealth',
          tags: ['gateway'],
          responses: { 200: { description: 'Gateway and downstream status' } },
        },
      },
    };
    const mergedSchemas: Record<string, unknown> = {};
    const mergedTags: Array<{ name: string; description: string }> = [
      { name: 'gateway', description: 'API Gateway health & routing' },
    ];
    const offline: string[] = [];

    for (const target of DOC_SERVICES) {
      mergedTags.push({ name: target.key, description: target.tagDescription });

      const spec = await this.fetchSpec(target);
      if (!spec) {
        offline.push(target.name);
        continue;
      }
      Object.assign(mergedPaths, spec.paths ?? {});
      Object.assign(mergedSchemas, spec.components?.schemas ?? {});
    }

    const offlineNote = offline.length
      ? `\n\n> ⚠️ Currently unreachable: ${offline.join(', ')}. Their endpoints are temporarily missing from this document.`
      : '';

    return {
      openapi: '3.0.0',
      info: {
        title: '🌟 inva Enterprise Core API Gateway Hub',
        description:
          '**Unified API documentation for every inva microservice.**\n\n' +
          'All requests executed here go through the API Gateway (Port ' + this.gatewayPort + ') and are routed to the owning service:\n' +
          DOC_SERVICES.map(
            (s) => `- ${s.emoji} **${s.name}** — \`${s.routePrefix}/*\` → Port ${s.port}`,
          ).join('\n') +
          '\n\n> **Authentication**: click **Authorize 🔓**, paste a JWT access token from `POST /api/v1/auth/login`, and test any protected endpoint across all services.' +
          offlineNote,
        version: '2.0',
      },
      servers: [{ url: '/', description: `API Gateway (Port ${this.gatewayPort} — routes to all downstream services)` }],
      tags: mergedTags,
      paths: mergedPaths,
      components: {
        securitySchemes: {
          bearer: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'JWT access token (e.g. from POST /api/v1/auth/login)',
          },
        },
        schemas: mergedSchemas,
      },
      security: [{ bearer: [] }],
    };
  }

  /** Unified spec — declared before the parametric route for readability. */
  @Get('specs/:service.json')
  async getServiceSpec(@Param('service') serviceKey: string) {
    const target = DOC_SERVICES.find((s) => s.key === serviceKey);
    if (!target) {
      throw new NotFoundException(
        `Unknown service spec: "${serviceKey}". Available: ${DOC_SERVICES.map((s) => s.key).join(', ')}, all, gateway.`,
      );
    }

    const spec = await this.fetchSpec(target);
    if (!spec) {
      return {
        openapi: '3.0.0',
        info: {
          title: `${target.emoji} ${target.name} (Offline)`,
          description: `Service is currently unreachable at ${this.resolveUpstream(target)}. Its endpoints are served once it is back online.`,
          version: '1.0',
        },
        paths: {},
      };
    }

    // Rewrite servers so "Try it out" executes through the Gateway proxy.
    return {
      ...spec,
      servers: [
        { url: '/', description: `API Gateway (Port ${this.gatewayPort}) → ${target.name} (Port ${target.port})` },
      ],
    };
  }

  // ── Internals ─────────────────────────────────────────────────────────────

  private resolveUpstream(svc: { configKey: string; defaultUrl: string }): string {
    return this.config.get<string>(svc.configKey, svc.defaultUrl);
  }

  private async fetchSpec(
    svc: { key: string; configKey: string; defaultUrl: string },
    opts: { cache?: boolean } = {},
  ): Promise<any | null> {
    const useCache = opts.cache !== false;
    const cached = this.specCache.get(svc.key);
    if (useCache && cached && Date.now() - cached.fetchedAt < SPEC_CACHE_TTL_MS) {
      return cached.spec;
    }

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
      const res = await fetch(`${this.resolveUpstream(svc)}/api/docs-json`, {
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) return null;
      const spec = await res.json();
      if (useCache) this.specCache.set(svc.key, { spec, fetchedAt: Date.now() });
      return spec;
    } catch {
      return null;
    }
  }

  private async isServiceUp(upstream: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
      const res = await fetch(`${upstream}/api/docs`, { signal: controller.signal });
      clearTimeout(timer);
      return res.ok;
    } catch {
      return false;
    }
  }
}

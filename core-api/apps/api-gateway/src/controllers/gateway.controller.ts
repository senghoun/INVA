import { JwtAuthGuard, RolesGuard, UserTypeGuard, RequireRoles, RequireUserType } from '@common';
import { Controller, Get, Post, Delete, Param, Body, UseGuards, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { gatewayTelemetryStore } from '../telemetry/gateway-telemetry.store';
import { serviceToggleStore } from '../telemetry/service-toggle.store';

@ApiTags('gateway')
@Controller()
export class GatewayController {
  private cachedDownstream: { timestamp: number; data: Record<string, any> } | null = null;
  private readonly CACHE_TTL_MS = 5000; // 5 seconds TTL

  constructor(private readonly config: ConfigService) {}

  @Get('health/availability')
  @ApiOperation({ summary: 'Downstream process availability; does not certify database or queue readiness' })
  @ApiResponse({ status: 200, description: 'All downstream processes respond to liveness probes' })
  @ApiResponse({ status: 503, description: 'At least one downstream process is unavailable or disconnected' })
  async getAvailability() {
    const health = await this.getHealth();
    if (Object.values(health.downstreamServices).some(status => status !== 'UP')) {
      throw new ServiceUnavailableException({ status: 'UNAVAILABLE' });
    }
    return { status: 'AVAILABLE' };
  }

  @Get(['health', 'api/v1/health'])
  @ApiOperation({ summary: 'Health check of API Gateway and downstream services' })
  @ApiResponse({ status: 200, description: 'Gateway status' })
  async getHealth() {
    const now = Date.now();
    // Coalesce concurrent health checks — only one upstream fanout at a time.
    if ((this as any)._healthPromise) return (this as any)._healthPromise;
    if (this.cachedDownstream && now - this.cachedDownstream.timestamp < this.CACHE_TTL_MS) {
      // Overlay real-time admin disconnect overrides even on cached health data
      const dataWithOverrides = { ...this.cachedDownstream.data };
      for (const key of Object.keys(dataWithOverrides)) {
        if (serviceToggleStore.isDisconnected(key)) {
          dataWithOverrides[key] = 'DISCONNECTED';
        }
      }
      return {
        status: 'OK',
        gateway: 'inva-api-gateway',
        timestamp: new Date().toISOString(),
        downstreamServices: dataWithOverrides,
        cached: true,
      };
    }

    const services = [
      { name: 'auth-service', url: this.config.get('AUTH_SERVICE_URL', 'http://127.0.0.1:3001') },
      { name: 'hr-service', url: this.config.get('HR_SERVICE_URL', 'http://127.0.0.1:3002') },
      { name: 'crm-service', url: this.config.get('CRM_SERVICE_URL', 'http://127.0.0.1:3003') },
      { name: 'ac-service', url: this.config.get('AC_SERVICE_URL', 'http://127.0.0.1:3004') },
      { name: 'it-service', url: this.config.get('IT_SERVICE_URL', 'http://127.0.0.1:3005') },
    ];

    const healthStatus: Record<string, any> = {};

    const p: Promise<any> = Promise.all(
      services.map(async (svc) => {
        if (serviceToggleStore.isDisconnected(svc.name)) {
          healthStatus[svc.name] = 'DISCONNECTED';
          return;
        }

        try {
          const res = await fetch(`${svc.url}/api/v1/health/live`, { signal: AbortSignal.timeout(1500) });
          healthStatus[svc.name] = res.ok ? 'UP' : `STATUS_${res.status}`;
        } catch {
          healthStatus[svc.name] = 'DOWN';
        }
      }),
    ).then(() => {
      this.cachedDownstream = { timestamp: now, data: healthStatus };
      return {
        status: 'OK',
        gateway: 'inva-api-gateway',
        timestamp: new Date().toISOString(),
        downstreamServices: healthStatus,
      };
    }).finally(() => { (this as any)._healthPromise = null; });
    (this as any)._healthPromise = p;
    return p;
  }

  @Get('api/v1/gateway/services/toggles')
  @UseGuards(JwtAuthGuard, UserTypeGuard, RolesGuard)
  @RequireUserType('INTERNAL')
  @RequireRoles('ADMIN')
  @ApiOperation({ summary: 'List all microservice connection states (admin switches)' })
  @ApiResponse({ status: 200, description: 'Microservices connection toggle states' })
  getServiceToggles() {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      toggles: serviceToggleStore.getAll(),
    };
  }

  @Post('api/v1/gateway/services/:key/toggle')
  @UseGuards(JwtAuthGuard, UserTypeGuard, RolesGuard)
  @RequireUserType('INTERNAL')
  @RequireRoles('ADMIN')
  @ApiOperation({ summary: 'Connect or disconnect a microservice from Gateway proxy routing' })
  @ApiParam({ name: 'key', description: 'Service identifier (e.g. auth-service, hr-service)' })
  @ApiBody({ schema: { type: 'object', properties: { connected: { type: 'boolean' } } } })
  @ApiResponse({ status: 200, description: 'Service toggle updated successfully' })
  toggleService(
    @Param('key') key: string,
    @Body() body: { connected?: boolean },
  ) {
    const isConnected = body.connected !== undefined ? Boolean(body.connected) : true;
    serviceToggleStore.setConnection(key, isConnected);
    this.cachedDownstream = null; // Invalidate cache immediately

    return {
      status: 'OK',
      service: key,
      connected: isConnected,
      message: isConnected
        ? `Service ${key} is now CONNECTED and accepting traffic.`
        : `Service ${key} has been DISCONNECTED. Incoming traffic will be halted with HTTP 503.`,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('api/v1/gateway/telemetry')
  @UseGuards(JwtAuthGuard, UserTypeGuard, RolesGuard)
  @RequireUserType('INTERNAL')
  @RequireRoles('ADMIN')
  @ApiOperation({ summary: 'Real-time API traffic and per-user request analytics' })
  @ApiResponse({ status: 200, description: 'Telemetry metrics' })
  getTelemetry() {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      ...gatewayTelemetryStore.getSummary(),
    };
  }

  @Delete('api/v1/gateway/telemetry')
  @UseGuards(JwtAuthGuard, UserTypeGuard, RolesGuard)
  @RequireUserType('INTERNAL')
  @RequireRoles('ADMIN')
  @ApiOperation({ summary: 'Reset telemetry metrics' })
  clearTelemetry() {
    gatewayTelemetryStore.clear();
    return { status: 'OK', message: 'Telemetry store reset' };
  }
}

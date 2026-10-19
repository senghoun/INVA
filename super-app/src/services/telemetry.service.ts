import { request } from './api';
import { GatewayTelemetrySummary } from '../types';
import { API_ROUTES } from '../config/api';

class TelemetryService {
  public async getTelemetry(): Promise<GatewayTelemetrySummary> {
    return request<GatewayTelemetrySummary>(API_ROUTES.GATEWAY_TELEMETRY);
  }

  public async clearTelemetry(): Promise<void> {
    return request<void>(API_ROUTES.GATEWAY_TELEMETRY, {
      method: 'DELETE',
    });
  }
}

export const telemetryService = new TelemetryService();

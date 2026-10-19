import { request } from './api';
import { authService } from './auth.service';
import { API_ROUTES } from '../config/api';
import { healthMonitor } from './health.service';

export interface ServiceTogglesResponse {
  status: string;
  timestamp: string;
  toggles: Record<string, boolean>;
}

export interface ToggleServiceResponse {
  status: string;
  service: string;
  connected: boolean;
  message: string;
  timestamp: string;
}

export type ToggleListener = (toggles: Record<string, boolean>) => void;

class ServiceToggleService {
  private toggles: Record<string, boolean> = {
    'auth-service': true,
    'hr-service': true,
    'crm-service': true,
    'ac-service': true,
    'it-service': true,
  };
  private listeners: Set<ToggleListener> = new Set();
  private isFetching: boolean = false;

  constructor() {
    authService.subscribe(user => { if (user && authService.canAdminister()) void this.fetchToggles(); });
  }

  public subscribe(listener: ToggleListener): () => void {
    this.listeners.add(listener);
    listener({ ...this.toggles });
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const copy = { ...this.toggles };
    this.listeners.forEach((listener) => {
      try {
        listener(copy);
      } catch (err) {
        console.error('Error in toggle listener:', err);
      }
    });
  }

  public async fetchToggles(): Promise<Record<string, boolean>> {
    if (this.isFetching) return this.toggles;
    this.isFetching = true;
    try {
      if (!authService.canAdminister()) return this.toggles;
      const data = await request<ServiceTogglesResponse>(API_ROUTES.GATEWAY_SERVICES_TOGGLES);
      this.toggles = data.toggles || {};
      this.notify();
    } catch (err) {
      console.warn('Could not fetch service toggles from gateway:', err);
    } finally {
      this.isFetching = false;
    }
    return this.toggles;
  }

  public isConnected(serviceKey: string): boolean {
    return this.toggles[serviceKey] ?? true;
  }

  public async toggleService(serviceKey: string, connected: boolean): Promise<boolean> {
    // Optimistic update
    this.toggles[serviceKey] = connected;
    this.notify();

    try {
      const data = await request<ToggleServiceResponse>(API_ROUTES.GATEWAY_SERVICE_TOGGLE(serviceKey), {
        method: 'POST', body: JSON.stringify({ connected }),
      });
      this.toggles[serviceKey] = data.connected;
      this.notify();
      await healthMonitor.checkHealthNow();
      return true;
    } catch (err) {
      console.error(`Failed to toggle service ${serviceKey}:`, err);
      // Rollback
      this.toggles[serviceKey] = !connected;
      this.notify();
      return false;
    }
  }
}

export const serviceToggleService = new ServiceToggleService();

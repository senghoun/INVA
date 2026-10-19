export class ServiceToggleStore {
  private serviceStatus: Map<string, boolean> = new Map([
    ['auth-service', true],
    ['hr-service', true],
    ['crm-service', true],
    ['ac-service', true],
    ['it-service', true],
  ]);

  public isConnected(serviceKey: string): boolean {
    return this.serviceStatus.get(serviceKey) ?? true;
  }

  public isDisconnected(serviceKey: string): boolean {
    return !this.isConnected(serviceKey);
  }

  public setConnection(serviceKey: string, connected: boolean): void {
    this.serviceStatus.set(serviceKey, connected);
  }

  public getAll(): Record<string, boolean> {
    const result: Record<string, boolean> = {};
    for (const [key, val] of this.serviceStatus.entries()) {
      result[key] = val;
    }
    return result;
  }
}

export const serviceToggleStore = new ServiceToggleStore();

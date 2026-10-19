export interface ApiCallRecord {
  id: string;
  method: string;
  url: string;
  route: string;
  statusCode: number;
  durationMs: number;
  userEmail: string;
  userId: string | null;
  userRoles: string[];
  ip: string;
  timestamp: string;
}

export interface EndpointMetric {
  route: string;
  method: string;
  totalHits: number;
  avgDurationMs: number;
  errorCount: number;
  lastAccessed: string;
}

export interface UserActivityMetric {
  email: string;
  userId: string | null;
  totalCalls: number;
  lastCall: string;
  roles: string[];
  topEndpoints: { route: string; count: number }[];
}

export interface GatewayTelemetrySummary {
  totalRequests: number;
  totalErrors: number;
  activeUsersCount: number;
  avgLatencyMs: number;
  endpoints: EndpointMetric[];
  users: UserActivityMetric[];
  recentLogs: ApiCallRecord[];
}

class GatewayTelemetryStore {
  private recentLogs: ApiCallRecord[] = [];
  private readonly maxLogs: number = 200;
  // Bound maps — without caps, cardinality of routes/users can grow with attacker-controlled paths.
  private readonly MAX_ENDPOINT_KEYS = 500;
  private readonly MAX_USER_KEYS = 5000;
  private endpointHits: Map<string, { count: number; totalMs: number; errors: number; lastTime: string }> = new Map();
  private userStats: Map<string, { userId: string | null; count: number; lastTime: string; roles: Set<string>; routes: Map<string, number> }> = new Map();

  public recordRequest(record: ApiCallRecord): void {
    // 1. Add to recent logs circular buffer
    this.recentLogs.unshift(record);
    if (this.recentLogs.length > this.maxLogs) {
      this.recentLogs.pop();
    }

    // 2. Track endpoint metrics (drop new keys when at capacity — keep hot keys)
    const epKey = `${record.method} ${record.route}`;
    let ep = this.endpointHits.get(epKey);
    if (!ep) {
      if (this.endpointHits.size >= this.MAX_ENDPOINT_KEYS) return;
      ep = { count: 0, totalMs: 0, errors: 0, lastTime: record.timestamp };
    }
    ep.count++;
    ep.totalMs += record.durationMs;
    if (record.statusCode >= 400) {
      ep.errors++;
    }
    ep.lastTime = record.timestamp;
    this.endpointHits.set(epKey, ep);

    // 3. Track user activity (drop new users when at capacity)
    const userKey = record.userEmail || 'ANONYMOUS';
    let u = this.userStats.get(userKey);
    if (!u) {
      if (this.userStats.size >= this.MAX_USER_KEYS) return;
      u = {
        userId: record.userId,
        count: 0,
        lastTime: record.timestamp,
        roles: new Set<string>(),
        routes: new Map<string, number>(),
      };
    }
    u.count++;
    u.lastTime = record.timestamp;
    if (record.userId) u.userId = record.userId;
    if (record.userRoles) {
      record.userRoles.forEach((r) => u.roles.add(r));
    }
    const rCount = u.routes.get(record.route) || 0;
    u.routes.set(record.route, rCount + 1);
    // Bound per-user route breakdown to avoid map explosion
    if (u.routes.size > 50) {
      const smallest = [...u.routes.entries()].sort((a, b) => a[1] - b[1])[0]?.[0];
      if (smallest) u.routes.delete(smallest);
    }
    this.userStats.set(userKey, u);
  }

  public getSummary(): GatewayTelemetrySummary {
    let totalRequests = 0;
    let totalErrors = 0;
    let totalMs = 0;

    const endpoints: EndpointMetric[] = [];
    this.endpointHits.forEach((data, key) => {
      const [method, ...rest] = key.split(' ');
      const route = rest.join(' ');
      totalRequests += data.count;
      totalErrors += data.errors;
      totalMs += data.totalMs;

      endpoints.push({
        route,
        method,
        totalHits: data.count,
        avgDurationMs: Math.round(data.totalMs / (data.count || 1)),
        errorCount: data.errors,
        lastAccessed: data.lastTime,
      });
    });

    endpoints.sort((a, b) => b.totalHits - a.totalHits);

    const users: UserActivityMetric[] = [];
    this.userStats.forEach((data, email) => {
      const topEpList = Array.from(data.routes.entries())
        .map(([route, count]) => ({ route, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      users.push({
        email,
        userId: data.userId,
        totalCalls: data.count,
        lastCall: data.lastTime,
        roles: Array.from(data.roles),
        topEndpoints: topEpList,
      });
    });

    users.sort((a, b) => b.totalCalls - a.totalCalls);

    return {
      totalRequests,
      totalErrors,
      activeUsersCount: users.length,
      avgLatencyMs: totalRequests > 0 ? Math.round(totalMs / totalRequests) : 0,
      endpoints,
      users,
      recentLogs: this.recentLogs.slice(0, 50),
    };
  }

  public clear(): void {
    this.recentLogs = [];
    this.endpointHits.clear();
    this.userStats.clear();
  }
}

export const gatewayTelemetryStore = new GatewayTelemetryStore();

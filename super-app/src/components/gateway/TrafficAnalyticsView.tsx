import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Users,
  Activity,
  ArrowUpRight,
  Clock,
  Shield,
  Search,
  RefreshCw,
  Zap,
  Globe,
  Trash2,
  AlertTriangle,
  ChevronRight,
  User,
  Filter,
} from 'lucide-react';
import { telemetryService } from '../../services/telemetry.service';
import { GatewayTelemetrySummary, EndpointMetric, UserActivityMetric, ApiCallRecord } from '../../types';

const TRAFFIC_SUBTABS = ['endpoints', 'users', 'logs'] as const;
type TrafficSubTab = (typeof TRAFFIC_SUBTABS)[number];

const getInitialTrafficTab = (): TrafficSubTab => {
  if (typeof window === 'undefined') return 'endpoints';
  const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
  const parts = hash.split('?')[0].split('/');
  if (parts[0] === 'traffic' && parts[1] && TRAFFIC_SUBTABS.includes(parts[1] as TrafficSubTab)) {
    return parts[1] as TrafficSubTab;
  }
  const saved = localStorage.getItem('inva_traffic_active_subtab') as TrafficSubTab | null;
  if (saved && TRAFFIC_SUBTABS.includes(saved)) {
    return saved;
  }
  return 'endpoints';
};

export const TrafficAnalyticsView: React.FC = () => {
  const [summary, setSummary] = useState<GatewayTelemetrySummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TrafficSubTab>(getInitialTrafficTab);

  const handleSubTabChange = (tab: TrafficSubTab) => {
    setActiveTab(tab);
    try {
      localStorage.setItem('inva_traffic_active_subtab', tab);
      window.location.hash = `traffic/${tab}`;
    } catch (_) {}
  };

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
      const parts = hash.split('?')[0].split('/');
      if (parts[0] === 'traffic' && parts[1] && TRAFFIC_SUBTABS.includes(parts[1] as TrafficSubTab)) {
        setActiveTab(parts[1] as TrafficSubTab);
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedUserEmail, setSelectedUserEmail] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      const data = await telemetryService.getTelemetry();
      setSummary(data);
    } catch (err) {
      console.warn('Could not load telemetry metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    // Auto-refresh telemetry every 6 seconds, pausing if browser tab is hidden
    const timer = setInterval(() => {
      if (typeof document === 'undefined' || document.visibilityState === 'visible') {
        fetchMetrics();
      }
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchMetrics();
    setTimeout(() => setIsRefreshing(false), 300);
  };

  const handleClearTelemetry = async () => {
    if (window.confirm('Reset all in-memory API traffic and per-user counters?')) {
      await telemetryService.clearTelemetry();
      await fetchMetrics();
    }
  };

  const filteredEndpoints = (summary?.endpoints || []).filter(
    (e) =>
      e.route.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.method.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = (summary?.users || []).filter(
    (u) =>
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.roles.some((r) => r.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredLogs = (summary?.recentLogs || []).filter((l) => {
    if (selectedUserEmail && l.userEmail !== selectedUserEmail) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      l.route.toLowerCase().includes(q) ||
      l.method.toLowerCase().includes(q) ||
      l.userEmail.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel rounded-2xl p-6 border border-dark-border relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500 via-cyan-500 to-transparent"></div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-500 p-0.5 shadow-lg shadow-emerald-500/25">
              <div className="w-full h-full bg-[#0a0d14] rounded-[10px] flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  API Traffic & Per-User Telemetry
                </h2>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  REAL-TIME GATEWAY HOOKS
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Live inspection of request volume per microservice API route and caller identity (JWT claims)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleManualRefresh}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-white transition"
              title="Refresh telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
            <button
              onClick={handleClearTelemetry}
              className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-rose-950/40 border border-slate-700 hover:border-rose-500/40 text-slate-400 hover:text-rose-300 text-xs font-semibold transition flex items-center space-x-1.5"
              title="Reset telemetry counters"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset Counters</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mt-6">
          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-white font-mono">
                {summary?.totalRequests || 0}
              </div>
              <div className="text-[11px] text-slate-400">Total Gateway Hits</div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-white font-mono">
                {summary?.activeUsersCount || 0}
              </div>
              <div className="text-[11px] text-slate-400">Unique Callers / Users</div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-white font-mono">
                {summary?.avgLatencyMs || 0} <span className="text-xs font-normal text-slate-400">ms</span>
              </div>
              <div className="text-[11px] text-slate-400">Average Gateway Latency</div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-white font-mono">
                {summary?.totalErrors || 0}
              </div>
              <div className="text-[11px] text-slate-400">4xx / 5xx Status Errors</div>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Navigation & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2 bg-[#0e1322] border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => { handleSubTabChange('endpoints'); setSelectedUserEmail(null); }}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'endpoints'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Requests Per API ({summary?.endpoints?.length || 0})
          </button>
          <button
            onClick={() => handleSubTabChange('users')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'users'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Activity By User ({summary?.users?.length || 0})
          </button>
          <button
            onClick={() => handleSubTabChange('logs')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'logs'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Live Request Stream ({summary?.recentLogs?.length || 0})
          </button>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter route, method, or user email..."
            className="w-full sm:w-64 bg-dark-bg border border-dark-border rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Selected User Filter Banner */}
      {selectedUserEmail && (
        <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between text-xs animate-fadeIn">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-indigo-400" />
            <span className="text-slate-300">Filtering calls made by:</span>
            <strong className="text-indigo-300 font-mono">{selectedUserEmail}</strong>
          </div>
          <button
            onClick={() => setSelectedUserEmail(null)}
            className="text-xs text-slate-400 hover:text-white underline"
          >
            Clear user filter
          </button>
        </div>
      )}

      {/* TAB 1: Requests Per API */}
      {activeTab === 'endpoints' && (
        <div className="glass-panel rounded-2xl border border-dark-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase bg-slate-900/40">
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">API Route</th>
                  <th className="py-3 px-4 text-right">Total Requests</th>
                  <th className="py-3 px-4 text-right">Traffic Share</th>
                  <th className="py-3 px-4 text-right">Avg Duration</th>
                  <th className="py-3 px-4 text-right">Errors</th>
                  <th className="py-3 px-4 text-right">Last Hit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {filteredEndpoints.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No API traffic recorded yet. Make calls via API Explorer or your client.
                    </td>
                  </tr>
                ) : (
                  filteredEndpoints.map((ep) => {
                    const share =
                      summary?.totalRequests && summary.totalRequests > 0
                        ? Math.round((ep.totalHits / summary.totalRequests) * 100)
                        : 0;

                    const methodColors: Record<string, string> = {
                      GET: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
                      POST: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
                      PATCH: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
                      DELETE: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
                    };

                    return (
                      <tr key={`${ep.method}-${ep.route}`} className="hover:bg-slate-800/30 transition">
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              methodColors[ep.method] || 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {ep.method}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-100 font-sans text-xs">
                          {ep.route}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-white text-sm">
                          {ep.totalHits}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-indigo-500 rounded-full"
                                style={{ width: `${share}%` }}
                              ></div>
                            </div>
                            <span className="text-slate-400 text-[10px]">{share}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right text-emerald-400">
                          {ep.avgDurationMs} ms
                        </td>
                        <td className="py-3 px-4 text-right">
                          {ep.errorCount > 0 ? (
                            <span className="text-rose-400 font-bold">{ep.errorCount}</span>
                          ) : (
                            <span className="text-slate-500">0</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-400 text-[10px]">
                          {ep.lastAccessed}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Activity By User */}
      {activeTab === 'users' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredUsers.length === 0 ? (
            <div className="col-span-2 glass-panel rounded-2xl p-8 text-center text-slate-500">
              No user traffic recorded yet.
            </div>
          ) : (
            filteredUsers.map((u) => {
              const isSelected = selectedUserEmail === u.email;
              return (
                <div
                  key={u.email}
                  className={`glass-panel rounded-2xl p-5 border transition-all duration-200 flex flex-col justify-between space-y-4 ${
                    isSelected
                      ? 'border-indigo-500 shadow-lg shadow-indigo-950/40 bg-indigo-950/20'
                      : 'border-dark-border hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold shrink-0">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-xs text-white font-mono">
                            {u.email}
                          </span>
                          {u.email === 'ANONYMOUS' && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 font-mono">
                              No Token
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Last active: <span className="font-mono text-slate-300">{u.lastCall}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xl font-black text-white font-mono">{u.totalCalls}</div>
                      <div className="text-[10px] uppercase text-slate-400">Total Requests</div>
                    </div>
                  </div>

                  {/* Active Domain Roles */}
                  {u.roles.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {u.roles.map((r) => (
                        <span
                          key={r}
                          className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-500/30"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Top Endpoints Called by this user */}
                  <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                      Top APIs Accessed:
                    </div>
                    {u.topEndpoints.map((ep) => (
                      <div
                        key={ep.route}
                        className="flex items-center justify-between text-[11px] font-mono p-1.5 rounded bg-dark-bg/60 border border-slate-800/60"
                      >
                        <span className="text-slate-300 truncate max-w-[280px]">{ep.route}</span>
                        <span className="text-indigo-400 font-bold ml-2">{ep.count} hits</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      setSelectedUserEmail(u.email);
                      handleSubTabChange('logs');
                    }}
                    className="w-full py-2 rounded-xl bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white text-xs font-semibold transition flex items-center justify-center space-x-1"
                  >
                    <span>View Request Stream</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 3: Live Request Stream Logs */}
      {activeTab === 'logs' && (
        <div className="glass-panel rounded-2xl border border-dark-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase bg-slate-900/40">
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Route</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4 text-right">Latency</th>
                  <th className="py-3 px-4 text-right">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No logs matching query.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const isSuccess = log.statusCode < 400;
                    return (
                      <tr key={log.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-2.5 px-4 text-slate-400 text-[10px]">{log.timestamp}</td>
                        <td className="py-2.5 px-4 font-bold">{log.method}</td>
                        <td className="py-2.5 px-4 font-semibold text-slate-200 font-sans text-xs">
                          {log.route}
                        </td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              isSuccess
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            }`}
                          >
                            {log.statusCode}
                          </span>
                        </td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`font-mono text-xs ${
                              log.userEmail === 'ANONYMOUS' ? 'text-slate-500' : 'text-indigo-300 font-semibold'
                            }`}
                          >
                            {log.userEmail}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right text-emerald-400">{log.durationMs} ms</td>
                        <td className="py-2.5 px-4 text-right text-slate-500 text-[10px]">{log.ip}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

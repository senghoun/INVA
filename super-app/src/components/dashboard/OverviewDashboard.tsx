import React from 'react';
import {
  Server,
  CheckCircle2,
  Activity,
  Percent,
} from 'lucide-react';
import { ServiceLiveMetric, IncidentEvent } from '../../types';
import { ServiceCard } from './ServiceCard';
import { TopologyMap } from './TopologyMap';
import { IncidentLog } from './IncidentLog';

interface OverviewDashboardProps {
  metrics: ServiceLiveMetric[];
  incidents: IncidentEvent[];
  onExploreRoutes: (serviceKey: string) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  metrics,
  incidents,
  onExploreRoutes,
}) => {
  const upServicesCount = metrics.filter((m) => m.status === 'UP').length;
  const avgLatency =
    metrics.length > 0
      ? Math.round(
          metrics.reduce((acc, curr) => acc + curr.latencyMs, 0) / metrics.length
        )
      : 0;

  const avgUptime =
    metrics.length > 0
      ? (
          metrics.reduce((acc, curr) => acc + curr.uptimePercent, 0) / metrics.length
        ).toFixed(1)
      : '100.0';

  return (
    <div className="space-y-6">
      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Services */}
        <div className="glass-panel rounded-2xl p-4 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
              Ecosystem Services
            </span>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-black text-white">{metrics.length}</span>
              <span className="text-xs text-slate-400 font-medium">Domain Microservices</span>
            </div>
          </div>
        </div>

        {/* Online Ratio */}
        <div className="glass-panel rounded-2xl p-4 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
              Online Status
            </span>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-black text-emerald-400">
                {upServicesCount} / {metrics.length}
              </span>
              <span className="text-xs text-slate-400 font-medium">Nodes Responding</span>
            </div>
          </div>
        </div>

        {/* Avg Latency */}
        <div className="glass-panel rounded-2xl p-4 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
              Mean Ping Latency
            </span>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-black font-mono text-purple-400">
                {avgLatency}ms
              </span>
              <span className="text-xs text-slate-400 font-medium">Round-trip avg</span>
            </div>
          </div>
        </div>

        {/* Ecosystem Reliability */}
        <div className="glass-panel rounded-2xl p-4 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Percent className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
              Mesh Availability
            </span>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-black text-white">{avgUptime}%</span>
              <span className="text-xs text-emerald-400 font-medium">SLA Tier-1</span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Service Mesh Topology */}
      <TopologyMap metrics={metrics} onSelectService={onExploreRoutes} />

      {/* Microservice Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Active Domain Microservices
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live health, latency histories, and direct endpoint exploration
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {metrics.map((metric) => (
            <ServiceCard
              key={metric.key}
              metric={metric}
              onExploreRoutes={onExploreRoutes}
            />
          ))}
        </div>
      </div>

      {/* Real-time Incident Feed */}
      <IncidentLog incidents={incidents} />
    </div>
  );
};

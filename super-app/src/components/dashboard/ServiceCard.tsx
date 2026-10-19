import React, { useState } from 'react';
import {
  Server,
  Zap,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  ArrowUpRight,
  Shield,
  Briefcase,
  Users,
  DollarSign,
  Cpu,
  Power,
  PowerOff,
} from 'lucide-react';
import { ServiceLiveMetric } from '../../types';
import { KNOWN_MICROSERVICES } from '../../config/services';
import { serviceToggleService } from '../../services/service-toggle.service';
import { LatencyChart } from './LatencyChart';
import { API_ROUTES, buildApiUrl } from '../../config/api';

interface ServiceCardProps {
  metric: ServiceLiveMetric;
  onExploreRoutes: (serviceKey: string) => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ metric, onExploreRoutes }) => {
  const [isPinging, setIsPinging] = useState(false);
  const [pingResult, setPingResult] = useState<string | null>(null);
  const [isToggling, setIsToggling] = useState(false);

  const config = KNOWN_MICROSERVICES.find((s) => s.key === metric.key) || {
    name: metric.name,
    port: metric.port,
    proxyPrefix: '/api',
    description: '',
    category: 'core',
  };

  const getServiceIcon = () => {
    switch (metric.key) {
      case 'gateway':
        return Zap;
      case 'auth-service':
        return Shield;
      case 'hr-service':
        return Users;
      case 'crm-service':
        return Briefcase;
      case 'ac-service':
        return DollarSign;
      case 'it-service':
        return Cpu;
      default:
        return Server;
    }
  };

  const Icon = getServiceIcon();

  const handleQuickPing = async () => {
    setIsPinging(true);
    setPingResult(null);
    const start = performance.now();
    try {
      const pingUrl =
        metric.key === 'gateway'
          ? buildApiUrl(API_ROUTES.HEALTH)
          : buildApiUrl(`/api/docs/specs/${metric.key.replace('-service', '')}.json`);

      const res = await fetch(pingUrl);
      const duration = Math.round(performance.now() - start);
      setPingResult(res.ok ? `${duration}ms OK` : `HTTP ${res.status}`);
    } catch (e: any) {
      setPingResult('TIMEOUT');
    } finally {
      setIsPinging(false);
      setTimeout(() => setPingResult(null), 3500);
    }
  };

  const isDownstream = metric.key !== 'gateway';
  const isDisconnected = metric.status === 'DISCONNECTED';
  const isUp = metric.status === 'UP';
  const isDown = metric.status === 'DOWN';
  const isDegraded = metric.status === 'DEGRADED';

  const statusColor = isUp
    ? '#22c55e'
    : isDisconnected
    ? '#f59e0b'
    : isDown
    ? '#ef4444'
    : '#f59e0b';

  const handleToggle = async () => {
    if (!isDownstream) return;
    setIsToggling(true);
    await serviceToggleService.toggleService(metric.key, isDisconnected);
    setIsToggling(false);
  };

  return (
    <div className="glass-card rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between group">
      {/* Glow top border */}
      <div
        className="absolute top-0 left-0 right-0 h-1 transition-all duration-300"
        style={{
          backgroundColor: statusColor,
          boxShadow: `0 0 12px ${statusColor}`,
        }}
      />

      {/* Card Header */}
      <div>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center border"
              style={{
                backgroundColor: `${statusColor}15`,
                borderColor: `${statusColor}30`,
              }}
            >
              <Icon className="w-5 h-5" style={{ color: statusColor }} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 text-sm tracking-tight group-hover:text-indigo-300 transition-colors">
                {metric.name}
              </h3>
              <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-mono">
                <span>Port {metric.port}</span>
                <span>•</span>
                <span className="text-indigo-400">{config.proxyPrefix}</span>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border"
            style={{
              backgroundColor: `${statusColor}15`,
              borderColor: `${statusColor}30`,
              color: statusColor,
            }}
          >
            {isUp && <CheckCircle2 className="w-3.5 h-3.5" />}
            {isDown && <XCircle className="w-3.5 h-3.5" />}
            {isDegraded && <AlertTriangle className="w-3.5 h-3.5" />}
            {isDisconnected && <PowerOff className="w-3.5 h-3.5" />}
            <span>{isDisconnected ? 'DISCONNECTED (ADMIN)' : metric.status}</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-400 mb-4 line-clamp-2 h-8">
          {config.description}
        </p>

        {/* Real-time Metrics Matrix */}
        <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-dark-bg/60 border border-dark-border/60 mb-4">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
              Uptime Ratio
            </span>
            <span className="text-sm font-semibold text-slate-200">
              {metric.uptimePercent}%
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
              Live Latency
            </span>
            <div className="flex items-center space-x-1">
              <span className="text-sm font-semibold font-mono text-indigo-400">
                {metric.latencyMs}ms
              </span>
            </div>
          </div>
        </div>

        {/* Sparkline Latency History */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            <span>Latency Timeline</span>
            <span>Last checked: {metric.lastChecked}</span>
          </div>
          <div className="bg-dark-bg/40 rounded-lg p-2 border border-dark-border/40 flex justify-center">
            <LatencyChart data={metric.latencyHistory} color={statusColor} height={32} />
          </div>
        </div>
      </div>

      {/* Card Actions */}
      <div className="pt-3 border-t border-dark-border/60 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleQuickPing}
            disabled={isPinging || isDisconnected}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-dark-surface hover:bg-dark-border text-slate-300 hover:text-white text-xs font-medium border border-dark-border transition disabled:opacity-40"
          >
            <Play className={`w-3 h-3 ${isPinging ? 'animate-spin text-indigo-400' : ''}`} />
            <span>{pingResult ? pingResult : isPinging ? 'Pinging...' : 'Test Ping'}</span>
          </button>

          {isDownstream && (
            <button
              onClick={handleToggle}
              disabled={isToggling}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition shadow-sm ${
                isDisconnected
                  ? 'bg-emerald-950/70 hover:bg-emerald-900/70 text-emerald-300 border-emerald-500/50'
                  : 'bg-rose-950/50 hover:bg-rose-900/50 text-rose-300 border-rose-500/40'
              }`}
              title={isDisconnected ? 'Connect service to Gateway' : 'Disconnect service from Gateway'}
            >
              <Power className={`w-3 h-3 ${isToggling ? 'animate-spin' : ''}`} />
              <span>{isDisconnected ? 'Connect' : 'Disconnect'}</span>
            </button>
          )}
        </div>

        <button
          onClick={() => onExploreRoutes(metric.key)}
          className="flex items-center space-x-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 group-hover:translate-x-0.5 transition-transform"
        >
          <span>Explore APIs</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

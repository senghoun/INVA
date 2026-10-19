import React, { useState } from 'react';
import {
  Zap,
  Shield,
  Users,
  Briefcase,
  DollarSign,
  Cpu,
  ArrowRight,
  Globe,
  Lock,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
} from 'lucide-react';
import { ServiceLiveMetric } from '../../types';
import { KNOWN_MICROSERVICES } from '../../config/services';
import { env } from '../../config/env';
import { API_ROUTES } from '../../config/api';

interface TopologyMapProps {
  metrics: ServiceLiveMetric[];
  onSelectService: (serviceKey: string) => void;
}

export const TopologyMap: React.FC<TopologyMapProps> = ({ metrics, onSelectService }) => {
  const [selectedNodeKey, setSelectedNodeKey] = useState<string | null>(null);

  const getMetric = (key: string) => metrics.find((m) => m.key === key);

  const gatewayMetric = getMetric('gateway');

  const downstreamServices = [
    {
      key: env.services.auth.key,
      name: env.services.auth.name,
      port: env.services.auth.port,
      prefix: API_ROUTES.AUTH,
      metric: getMetric(env.services.auth.key),
      icon: Shield,
      category: 'Identity & Access',
      db: 'inva_auth_db',
      routesCount: '8 Routes',
    },
    {
      key: env.services.hr.key,
      name: env.services.hr.name,
      port: env.services.hr.port,
      prefix: API_ROUTES.HR,
      metric: getMetric(env.services.hr.key),
      icon: Users,
      category: 'Personnel & Depts',
      db: 'inva_hr_db',
      routesCount: '6 Routes',
    },
    {
      key: env.services.crm.key,
      name: env.services.crm.name,
      port: env.services.crm.port,
      prefix: API_ROUTES.CRM,
      metric: getMetric(env.services.crm.key),
      icon: Briefcase,
      category: 'Deals & Clients',
      db: 'inva_crm_db',
      routesCount: '7 Routes',
    },
    {
      key: env.services.ac.key,
      name: env.services.ac.name,
      port: env.services.ac.port,
      prefix: API_ROUTES.AC,
      metric: getMetric(env.services.ac.key),
      icon: DollarSign,
      category: 'Invoices & Ledger',
      db: 'inva_ac_db',
      routesCount: '5 Routes',
    },
    {
      key: env.services.it.key,
      name: env.services.it.name,
      port: env.services.it.port,
      prefix: API_ROUTES.IT,
      metric: getMetric(env.services.it.key),
      icon: Cpu,
      category: 'Assets & Infrastructure',
      db: 'inva_it_db',
      routesCount: '4 Routes',
    },
  ];

  const activeSelectedService = downstreamServices.find((s) => s.key === selectedNodeKey);

  return (
    <div className="glass-panel rounded-2xl p-6 relative overflow-hidden border border-dark-border shadow-xl">
      {/* Mesh Header & Ribbon */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-dark-border">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping-slow"></span>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-white">
              Ecosystem Service Mesh Architecture
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-500/30">
              Topology Live Map
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time reverse proxy dispatch pipeline from clients through Fastify Gateway to domain microservices
          </p>
        </div>

        {/* Mesh Meta Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="px-2.5 py-1 rounded-lg bg-dark-card border border-dark-border flex items-center space-x-1.5 text-slate-300">
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
            <span>Fastify HTTP-Proxy</span>
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-dark-card border border-dark-border flex items-center space-x-1.5 text-slate-300">
            <Lock className="w-3.5 h-3.5 text-purple-400" />
            <span>JWT + Helmet</span>
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-dark-card border border-dark-border flex items-center space-x-1.5 text-slate-300">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sub-second Heartbeat</span>
          </div>
        </div>
      </div>

      {/* Visual Mesh Architecture Canvas */}
      <div className="py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* 1. Left Ingress Node: External Clients (2 Cols) */}
          <div className="lg:col-span-3 space-y-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 px-1 flex items-center justify-between">
              <span>Client Ingress</span>
              <span className="text-indigo-400 font-mono">0.0.0.0</span>
            </div>

            <div className="p-4 rounded-xl bg-dark-card/70 border border-dark-border space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200">Public Traffic</div>
                  <div className="text-[10px] text-slate-400">Web App / Mobile / API</div>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-dark-border/60 text-[11px] font-mono text-slate-400">
                <div className="flex justify-between">
                  <span>Protocol:</span>
                  <span className="text-slate-200">HTTP/1.1, JSON</span>
                </div>
                <div className="flex justify-between">
                  <span>Port:</span>
                  <span className="text-indigo-400">:{env.services.gateway.port} / :{env.app.port}</span>
                </div>
                <div className="flex justify-between">
                  <span>Security:</span>
                  <span className="text-emerald-400">Bearer Auth</span>
                </div>
              </div>
            </div>

            <div className="hidden lg:flex items-center justify-center space-x-2 text-indigo-400/60 font-mono text-xs py-1">
              <span>Encrypted Ingress</span>
              <ArrowRight className="w-4 h-4 text-indigo-400 animate-pulse" />
            </div>
          </div>

          {/* 2. Center Node: API Gateway Hub (3 Cols) */}
          <div className="lg:col-span-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 px-1 flex items-center justify-between">
              <span>Central Reverse Proxy</span>
              <span className="text-emerald-400 font-mono">Port {env.services.gateway.port}</span>
            </div>

            <div
              onClick={() => onSelectService('gateway')}
              className="cursor-pointer p-5 rounded-2xl bg-gradient-to-b from-indigo-950/70 via-dark-surface to-dark-bg border-2 border-indigo-500/60 shadow-2xl shadow-indigo-600/20 hover:border-indigo-400 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>

              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-400/40 flex items-center justify-center text-indigo-400 shadow-inner group-hover:scale-105 transition-transform">
                    <Zap className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-white tracking-wide group-hover:text-indigo-300 transition-colors">
                      API GATEWAY
                    </h3>
                    <span className="text-[11px] font-mono text-indigo-300">
                      inva-api-gateway
                    </span>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{gatewayMetric?.status || 'UP'}</span>
                </span>
              </div>

              {/* Gateway specs grid */}
              <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-dark-bg/80 border border-dark-border/80 text-[11px] mb-3 font-mono">
                <div>
                  <span className="text-[10px] uppercase text-slate-400 block font-sans">Latency</span>
                  <span className="font-bold text-indigo-400">{gatewayMetric?.latencyMs || 12}ms</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-400 block font-sans">Uptime</span>
                  <span className="font-bold text-emerald-400">{gatewayMetric?.uptimePercent || 100}%</span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                Routes, rate-limits, and proxies all microservice traffic with unified OpenAPI docs.
              </p>

              <div className="flex items-center justify-between text-[11px] text-indigo-400 pt-2 border-t border-dark-border/60">
                <span>Click to explore routes</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* 3. Right Nodes: Downstream Microservices Array (5 Cols) */}
          <div className="lg:col-span-5 space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 px-1 flex items-center justify-between">
              <span>Downstream Domain Services</span>
              <span className="text-slate-400 font-mono">5 Microservices</span>
            </div>

            <div className="space-y-2">
              {downstreamServices.map((service) => {
                const Icon = service.icon;
                const isUp = service.metric?.status === 'UP';
                const isDown = service.metric?.status === 'DOWN';
                const statusColor = isUp ? '#22c55e' : isDown ? '#ef4444' : '#f59e0b';
                const isSelected = selectedNodeKey === service.key;

                return (
                  <div
                    key={service.key}
                    onClick={() => {
                      setSelectedNodeKey(isSelected ? null : service.key);
                      onSelectService(service.key);
                    }}
                    className={`cursor-pointer p-3 rounded-xl border transition-all duration-200 flex items-center justify-between group ${
                      isSelected
                        ? 'bg-indigo-950/60 border-indigo-500 shadow-lg shadow-indigo-600/20'
                        : 'bg-dark-card/60 hover:bg-dark-card border-dark-border/70 hover:border-indigo-500/40'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center border transition-transform group-hover:scale-105"
                        style={{
                          backgroundColor: `${statusColor}15`,
                          borderColor: `${statusColor}30`,
                        }}
                      >
                        <Icon className="w-4 h-4" style={{ color: statusColor }} />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-slate-200 group-hover:text-indigo-300 transition-colors">
                            {service.name}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-dark-bg text-indigo-400 border border-dark-border">
                            {service.prefix}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-0.5">
                          <span>Port {service.port}</span>
                          <span>•</span>
                          <span className="font-mono text-slate-400">{service.db}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 text-right">
                      <div>
                        <div className="text-xs font-mono font-bold text-slate-200">
                          {service.metric?.latencyMs || 0}ms
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {service.metric?.uptimePercent || 100}% up
                        </div>
                      </div>

                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{
                          backgroundColor: statusColor,
                          boxShadow: `0 0 8px ${statusColor}`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Selected Node Details Drawer */}
      {activeSelectedService && (
        <div className="mt-4 p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <activeSelectedService.icon className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white text-xs">
                {activeSelectedService.name} (Port {activeSelectedService.port})
              </span>
              <span className="text-slate-400 text-xs ml-2">
                Upstream URL: <code className="text-indigo-300 font-mono">http://127.0.0.1:{activeSelectedService.port}</code>
              </span>
            </div>
          </div>

          <button
            onClick={() => onSelectService(activeSelectedService.key)}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition flex items-center space-x-1 shrink-0"
          >
            <span>Open in API Explorer</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};

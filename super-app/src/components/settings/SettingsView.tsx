import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Server,
  Key,
  Database,
  RefreshCw,
  CheckCircle2,
  Cpu,
  ExternalLink,
  Shield,
  Activity,
  Zap,
  Globe,
  Radio,
  Power,
  PowerOff,
} from 'lucide-react';
import { KNOWN_MICROSERVICES } from '../../config/services';
import { healthMonitor } from '../../services/health.service';
import { atriaCopilotService } from '../../services/atria-copilot.service';
import { serviceToggleService } from '../../services/service-toggle.service';
import { ServiceLiveMetric } from '../../types';
import { API_ROUTES } from '../../config/api';
import { env } from '../../config/env';

export const SettingsView: React.FC = () => {
  const [pollInterval, setPollInterval] = useState<number>(healthMonitor.getPollInterval());
  const [apiKey, setApiKey] = useState<string>(atriaCopilotService.getApiKey());
  const [model, setModel] = useState<string>(atriaCopilotService.getModel());
  const [metrics, setMetrics] = useState<ServiceLiveMetric[]>([]);
  const [toggles, setToggles] = useState<Record<string, boolean>>({});
  const [togglingService, setTogglingService] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    const unsubMetrics = healthMonitor.subscribe((newMetrics) => {
      setMetrics(newMetrics);
    });
    const unsubInterval = healthMonitor.subscribeInterval((newInterval) => {
      setPollInterval(newInterval);
    });
    const unsubToggles = serviceToggleService.subscribe((newToggles) => {
      setToggles(newToggles);
    });
    return () => {
      unsubMetrics();
      unsubInterval();
      unsubToggles();
    };
  }, []);

  const handleToggleService = async (key: string) => {
    setTogglingService(key);
    const current = toggles[key] ?? true;
    await serviceToggleService.toggleService(key, !current);
    setTogglingService(null);
  };

  const handleSelectInterval = (val: number) => {
    setPollInterval(val);
    healthMonitor.setPollInterval(val);
  };

  const handleSave = () => {
    healthMonitor.setPollInterval(pollInterval);
    atriaCopilotService.setApiKey(apiKey.trim());
    atriaCopilotService.setModel(model.trim() || 'Atria-Dawn-Preview');
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleTestHealth = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      await healthMonitor.checkHealthNow();
      setTestResult('Successfully pinged Gateway and all 5 downstream microservices.');
    } catch (err: any) {
      setTestResult(`Health probe error: ${err.message}`);
    } finally {
      setIsTesting(false);
      setTimeout(() => setTestResult(null), 4000);
    }
  };

  const dbCatalog = [
    { service: 'auth-service', db: 'inva_auth_db', port: 5432, engine: 'PostgreSQL', purpose: 'Users, Credentials, RBAC Roles, Tokens' },
    { service: 'hr-service', db: 'inva_hr_db', port: 5432, engine: 'PostgreSQL', purpose: 'Employees, Departments, Salaries, Hierarchy' },
    { service: 'crm-service', db: 'inva_crm_db', port: 5432, engine: 'PostgreSQL', purpose: 'Organizations, Contacts, Sales Deals, Pipeline' },
    { service: 'ac-service', db: 'inva_ac_db', port: 5432, engine: 'PostgreSQL', purpose: 'Invoices, Ledger Accounts, Billing Approval' },
    { service: 'it-service', db: 'inva_it_db', port: 5432, engine: 'PostgreSQL', purpose: 'Hardware Assets, IT Tickets, Infrastructure' },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header Banner */}
      <div className="glass-panel rounded-2xl p-6 border border-dark-border relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/25">
              <div className="w-full h-full bg-[#0a0d14] rounded-[10px] flex items-center justify-center">
                <Sliders className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  System Configuration & Mesh Parameters
                </h2>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  LIVE CONNECTED
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Dynamic telemetry tuning, AI copilot provider, and microservice topology registry
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleTestHealth}
            disabled={isTesting}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-slate-200 hover:text-white text-xs font-semibold transition-all duration-150 shadow-sm shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-cyan-400' : 'text-indigo-400'}`} />
            <span>{isTesting ? 'Probing Mesh...' : 'Probe All Services'}</span>
          </button>
        </div>

        {testResult && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{testResult}</span>
          </div>
        )}
      </div>

      {/* Dynamic Environment Overview */}
      <div className="glass-panel rounded-2xl p-5 border border-dark-border space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Radio className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Active Environment Variables (.env)
            </h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-400 border border-indigo-500/30">
            {env.app.mode} mode
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-dark-bg/60 border border-dark-border">
            <div className="text-[10px] text-slate-400 font-mono">App / Version</div>
            <div className="font-semibold text-slate-200 mt-1 truncate">{env.app.name}</div>
            <div className="text-[11px] text-indigo-400 font-mono">v{env.app.version} (:{env.app.port})</div>
          </div>
          <div className="p-3 rounded-xl bg-dark-bg/60 border border-dark-border">
            <div className="text-[10px] text-slate-400 font-mono">API Version Prefix</div>
            <div className="font-semibold text-emerald-400 mt-1 font-mono">{env.api.version}</div>
            <div className="text-[10px] text-slate-500 truncate">{env.api.baseUrl || '(Proxy to Gateway)'}</div>
          </div>
          <div className="p-3 rounded-xl bg-dark-bg/60 border border-dark-border">
            <div className="text-[10px] text-slate-400 font-mono">Gateway Target</div>
            <div className="font-semibold text-slate-200 mt-1 font-mono">Port {env.services.gateway.port}</div>
            <div className="text-[10px] text-slate-500 truncate font-mono">{env.services.gateway.url}</div>
          </div>
          <div className="p-3 rounded-xl bg-dark-bg/60 border border-dark-border">
            <div className="text-[10px] text-slate-400 font-mono">Poll Interval (Default)</div>
            <div className="font-semibold text-slate-200 mt-1 font-mono">{env.api.defaultPollInterval}ms</div>
            <div className="text-[10px] text-slate-500">Live Heartbeat</div>
          </div>
        </div>
      </div>

      {/* Grid Settings Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Heartbeat Polling Configuration */}
        <div className="glass-panel rounded-2xl p-5 border border-dark-border flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2.5 mb-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Real-Time Health Heartbeat
              </label>
            </div>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Configures how frequently the Super-App queries Fastify Gateway (<code className="text-indigo-300">{API_ROUTES.HEALTH}</code>) to dynamically detect service downtime and update latency graphs.
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              {[
                { val: 1000, label: '1s', desc: 'Ultra-Realtime (Dev)' },
                { val: 3000, label: '3s', desc: 'Fast (Recommended)' },
                { val: 5000, label: '5s', desc: 'Balanced' },
                { val: 10000, label: '10s', desc: 'Eco Mode' },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => handleSelectInterval(opt.val)}
                  className={`p-3 rounded-xl text-left border transition-all duration-200 ${
                    pollInterval === opt.val
                      ? 'bg-indigo-600/20 border-indigo-500/60 shadow-md shadow-indigo-600/10 ring-1 ring-indigo-500/30'
                      : 'bg-dark-bg/60 border-dark-border/80 hover:border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{opt.label}</span>
                    {pollInterval === opt.val && (
                      <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 font-mono flex items-center justify-between">
            <span>Current polling cycle:</span>
            <span className="text-indigo-300 font-semibold">{pollInterval / 1000}s ({pollInterval}ms)</span>
          </div>
        </div>

        {/* 2. Atria ASI Provider Config */}
        <div className="glass-panel rounded-2xl p-5 border border-dark-border flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2.5">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Atria ASI Copilot Engine
                </label>
              </div>
              <a
                href="https://atria-asi.ai"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-indigo-400 hover:underline flex items-center space-x-1"
              >
                <span>atria-asi.ai</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Target endpoint at <code className="text-cyan-400 font-mono">https://api.atria-asi.ai/v1</code> with the 744B parameter MoE architecture.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Atria API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter Atria API Key (e.g. atria_...)"
                  className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Model Identifier
                </label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="Atria-Dawn-Preview"
                  className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
            >
              {saved ? 'Saved!' : 'Save System Settings'}
            </button>
          </div>
        </div>
      </div>

      {/* 3. Live Microservices & Gateway Routing Switches */}
      <div className="glass-panel rounded-2xl p-5 border border-dark-border space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Server className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Microservices Gateway Routing & Admin Switches
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {metrics.filter((m) => m.status === 'UP').length} of {KNOWN_MICROSERVICES.length} Online
          </span>
        </div>

        <p className="text-xs text-slate-400">
          Super Admins can dynamically disconnect individual microservices from Gateway traffic. When disconnected, incoming calls to the service route will be immediately blocked with HTTP 503 maintenance response.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {KNOWN_MICROSERVICES.map((s) => {
            const live = metrics.find((m) => m.key === s.key);
            const isGateway = s.key === 'gateway';
            const isManuallyDisconnected = toggles[s.key] === false || live?.status === 'DISCONNECTED';
            const isUp = live?.status === 'UP';
            const isDown = live?.status === 'DOWN';

            const statusBadge = isManuallyDisconnected ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 bg-amber-500/10 text-amber-400 border border-amber-500/30">
                <PowerOff className="w-3 h-3" />
                <span>DISCONNECTED (ADMIN)</span>
              </span>
            ) : isUp ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>UP</span>
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 bg-rose-500/10 text-rose-400 border border-rose-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                <span>{live?.status || 'DOWN'}</span>
              </span>
            );

            return (
              <div
                key={s.key}
                className={`p-4 rounded-xl bg-dark-bg/70 border flex flex-col justify-between space-y-3.5 transition ${
                  isManuallyDisconnected
                    ? 'border-amber-500/40 bg-amber-950/10 shadow-lg shadow-amber-950/20'
                    : 'border-slate-800/90 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-xs text-slate-100">{s.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">{s.key}</div>
                  </div>
                  {statusBadge}
                </div>

                <div className="space-y-1 text-[11px] text-slate-400 font-mono bg-dark-bg/80 p-2 rounded-lg border border-dark-border/40">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Route Prefix:</span>
                    <span className="text-indigo-300 font-medium">{s.proxyPrefix}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Target Port:</span>
                    <span className="text-slate-300">:{s.port}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Live Latency:</span>
                    <span className="text-emerald-400 font-medium">{live?.latencyMs || 0} ms</span>
                  </div>
                </div>

                {/* Gateway Switch Actions */}
                {!isGateway && (
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-medium">
                      {isManuallyDisconnected ? 'Traffic Paused' : 'Traffic Active'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleService(s.key)}
                      disabled={togglingService === s.key}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition shadow-sm ${
                        isManuallyDisconnected
                          ? 'bg-emerald-950/70 hover:bg-emerald-900/70 text-emerald-300 border-emerald-500/50'
                          : 'bg-rose-950/50 hover:bg-rose-900/50 text-rose-300 border-rose-500/40'
                      }`}
                    >
                      <Power className={`w-3 h-3 ${togglingService === s.key ? 'animate-spin' : ''}`} />
                      <span>
                        {togglingService === s.key
                          ? 'Updating...'
                          : isManuallyDisconnected
                          ? 'Connect'
                          : 'Disconnect'}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Multi-Database Architecture Catalog */}
      <div className="glass-panel rounded-2xl p-5 border border-dark-border space-y-4">
        <div className="flex items-center space-x-2.5">
          <Database className="w-4 h-4 text-purple-400" />
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Database-Per-Service Topology (PostgreSQL 15)
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase">
                <th className="pb-2">Microservice</th>
                <th className="pb-2">Isolated Database</th>
                <th className="pb-2">Engine</th>
                <th className="pb-2">Port</th>
                <th className="pb-2">Primary Domain Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {dbCatalog.map((row) => (
                <tr key={row.service} className="hover:bg-slate-800/30 transition">
                  <td className="py-2.5 font-semibold text-slate-200">{row.service}</td>
                  <td className="py-2.5 text-indigo-400 font-semibold">{row.db}</td>
                  <td className="py-2.5 text-slate-400">{row.engine}</td>
                  <td className="py-2.5 text-slate-400">:{row.port}</td>
                  <td className="py-2.5 text-slate-300 font-sans text-xs">{row.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


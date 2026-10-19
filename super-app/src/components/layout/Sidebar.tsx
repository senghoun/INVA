import React from 'react';
import {
  Activity,
  Compass,
  Users,
  AlertTriangle,
  Sparkles,
  Sliders,
  Server,
  Layers,
  ChevronRight,
  BarChart3,
  Briefcase,
  TrendingUp,
  DollarSign,
} from 'lucide-react';
import { env } from '../../config/env';

export type NavigationTab =
  | 'topology'
  | 'traffic'
  | 'explorer'
  | 'hr'
  | 'crm'
  | 'accounting'
  | 'auth'
  | 'incidents'
  | 'gemini'
  | 'settings';

interface SidebarProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  incidentCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  incidentCount,
}) => {
  const navItems: {
    id: NavigationTab;
    label: string;
    description: string;
    icon: React.FC<any>;
    badge?: number;
    accentColor: string;
  }[] = [
    {
      id: 'topology',
      label: 'Live Mesh & Status',
      description: 'Topology & heartbeats',
      icon: Activity,
      accentColor: 'from-indigo-500 to-blue-500',
    },
    {
      id: 'traffic',
      label: 'API Traffic & Users',
      description: 'Hits & per-user metrics',
      icon: BarChart3,
      accentColor: 'from-emerald-500 to-cyan-500',
    },
    {
      id: 'explorer',
      label: 'API Gateway Explorer',
      description: 'Interactive test bench',
      icon: Compass,
      accentColor: 'from-cyan-500 to-indigo-500',
    },
    {
      id: 'hr',
      label: 'HR Suite (:3002)',
      description: 'Staff & departments',
      icon: Briefcase,
      accentColor: 'from-purple-500 to-pink-500',
    },
    {
      id: 'crm',
      label: 'CRM Pipeline (:3003)',
      description: 'Deals & client orgs',
      icon: TrendingUp,
      accentColor: 'from-amber-500 to-orange-500',
    },
    {
      id: 'accounting',
      label: 'Accounting (:3004)',
      description: 'Invoices & GL ledger',
      icon: DollarSign,
      accentColor: 'from-emerald-500 to-teal-500',
    },
    {
      id: 'auth',
      label: 'Auth & RBAC Matrix',
      description: 'Users & permissions',
      icon: Users,
      accentColor: 'from-purple-500 to-indigo-500',
    },
    {
      id: 'incidents',
      label: 'Incident Stream',
      description: 'Live alerts & history',
      icon: AlertTriangle,
      badge: incidentCount > 0 ? incidentCount : undefined,
      accentColor: 'from-amber-500 to-rose-500',
    },
    {
      id: 'gemini',
      label: 'Atria ASI Copilot',
      description: 'Autonomous AI ops',
      icon: Sparkles,
      accentColor: 'from-cyan-400 to-purple-500',
    },
    {
      id: 'settings',
      label: 'System Config',
      description: 'Mesh & API parameters',
      icon: Sliders,
      accentColor: 'from-slate-400 to-indigo-400',
    },
  ];

  return (
    <aside className="w-64 border-r border-dark-border bg-dark-surface/75 backdrop-blur-xl flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)] select-none">
      <div className="p-3.5 space-y-1.5">
        <div className="px-3 py-2 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center justify-between">
          <span>Mission Control</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
        </div>

        <nav className="space-y-1 relative" aria-label="Sidebar Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`group relative w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left border transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-950/60 via-indigo-900/30 to-indigo-950/20 text-white border-indigo-500/40 shadow-[0_4px_20px_-4px_rgba(99,102,241,0.25)]'
                    : 'bg-transparent text-slate-400 hover:text-slate-200 border-transparent hover:bg-dark-card/60 hover:border-dark-border/60'
                }`}
              >
                {/* Left Active Glow Bar with smooth scale transition */}
                <div
                  className={`absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-gradient-to-b ${item.accentColor} transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    isActive
                      ? 'opacity-100 scale-y-100 shadow-[0_0_12px_rgba(99,102,241,0.8)]'
                      : 'opacity-0 scale-y-50'
                  }`}
                />

                <div className="flex items-center space-x-3 pl-1">
                  {/* Icon Container with smooth scale and background glow */}
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      isActive
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 shadow-[0_0_12px_rgba(99,102,241,0.3)] scale-105'
                        : 'bg-dark-bg/60 text-slate-400 border border-dark-border/40 group-hover:text-slate-200 group-hover:border-dark-border group-hover:scale-105'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                        isActive ? 'text-indigo-400 rotate-0' : 'group-hover:text-indigo-300'
                      }`}
                    />
                  </div>

                  {/* Label and Subtitle with subtle slide */}
                  <div className="transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0.5">
                    <div
                      className={`text-xs font-semibold tracking-tight transition-colors duration-200 ${
                        isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'
                      }`}
                    >
                      {item.label}
                    </div>
                    <div className="text-[10px] text-slate-400 line-clamp-1 font-normal">
                      {item.description}
                    </div>
                  </div>
                </div>

                {/* Right Badge / Arrow */}
                <div className="flex items-center space-x-1.5">
                  {item.badge !== undefined && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse">
                      {item.badge}
                    </span>
                  )}

                  <ChevronRight
                    className={`w-3.5 h-3.5 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      isActive
                        ? 'text-indigo-400 opacity-100 translate-x-0'
                        : 'text-slate-400 opacity-0 -translate-x-1 group-hover:opacity-60 group-hover:translate-x-0'
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info Box with Ambient Glass Effect */}
      <div className="p-3.5 m-3 rounded-2xl glass-panel text-xs space-y-2.5 border border-dark-border shadow-lg">
        <div className="flex items-center justify-between text-slate-400">
          <span className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            <span className="text-[11px] font-medium text-slate-300">Target Gateway</span>
          </span>
          <span className="font-mono text-[11px] text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-500/20">
            :{env.services.gateway.port}
          </span>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping-slow"></span>
            <span className="text-[11px] font-medium text-slate-300">Microservices</span>
          </span>
          <span className="font-mono text-[11px] text-emerald-400">6 Connected</span>
        </div>
        <div className="pt-2 border-t border-dark-border/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <span>INVA MESH HUB</span>
          <span className="text-indigo-400">v2.0-STABLE</span>
        </div>
      </div>
    </aside>
  );
};

import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Info,
  ShieldAlert,
  Search,
  Clock,
  Radio,
} from 'lucide-react';
import { IncidentEvent, IncidentSeverity } from '../../types';

interface IncidentLogProps {
  incidents: IncidentEvent[];
}

export const IncidentLog: React.FC<IncidentLogProps> = ({ incidents }) => {
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');

  const filtered = incidents.filter((inc) => {
    const matchesSev = filterSeverity === 'ALL' || inc.severity === filterSeverity;
    const matchesSearch =
      search === '' ||
      inc.serviceName.toLowerCase().includes(search.toLowerCase()) ||
      inc.title.toLowerCase().includes(search.toLowerCase()) ||
      inc.details.toLowerCase().includes(search.toLowerCase());
    return matchesSev && matchesSearch;
  });

  const getSeverityBadge = (sev: IncidentSeverity) => {
    switch (sev) {
      case 'CRITICAL':
        return (
          <span className="flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
            <ShieldAlert className="w-3 h-3" />
            <span>CRITICAL</span>
          </span>
        );
      case 'WARNING':
        return (
          <span className="flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <AlertTriangle className="w-3 h-3" />
            <span>WARNING</span>
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <CheckCircle className="w-3 h-3" />
            <span>RESOLVED</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
            <Info className="w-3 h-3" />
            <span>INFO</span>
          </span>
        );
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border border-dark-border">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
            <Radio className="w-4 h-4 text-indigo-400" />
            <span>Real-Time Mesh Incident Stream</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Automatic tracking of service up/downtime transitions and latency spikes
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter incidents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-dark-bg/80 border border-dark-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-40 sm:w-52"
            />
          </div>

          {/* Severity Selector */}
          <div className="flex items-center bg-dark-bg/80 border border-dark-border rounded-lg p-0.5 text-xs">
            {['ALL', 'CRITICAL', 'WARNING', 'RESOLVED'].map((s) => (
              <button
                key={s}
                onClick={() => setFilterSeverity(s)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                  filterSeverity === s
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Incident List */}
      <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <div className="text-center py-12 rounded-xl bg-dark-bg/30 border border-dashed border-dark-border">
            <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
            <p className="text-sm font-semibold text-slate-300">
              No incidents reported
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              All microservices are communicating smoothly with 0 active outages.
            </p>
          </div>
        ) : (
          filtered.map((inc) => (
            <div
              key={inc.id}
              className="p-3.5 rounded-xl bg-dark-card/60 hover:bg-dark-card border border-dark-border/80 flex items-start justify-between transition-colors"
            >
              <div className="flex items-start space-x-3">
                <div className="pt-0.5">{getSeverityBadge(inc.severity)}</div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold text-slate-200">
                      {inc.title}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-dark-bg text-slate-400">
                      {inc.serviceName}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{inc.details}</p>
                </div>
              </div>

              <div className="flex items-center space-x-1 text-[11px] font-mono text-slate-400 shrink-0 ml-4">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>{inc.timestamp}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

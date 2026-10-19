import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ClipboardList, RefreshCw, Search, Filter, Download,
  ChevronLeft, ChevronRight, AlertCircle, CheckCircle2,
  XCircle, Clock, Loader2, Activity,
} from 'lucide-react';
import { authService } from '../../services/auth.service';
import { AuditLogEntry, AuditAction, AuditOutcome } from '../../types';
import { DatalistSelect } from '../common/DatalistSelect';

// ─── Helpers ──────────────────────────────────────────────────────────────

const OUTCOME_CONFIG: Record<AuditOutcome, { icon: React.ReactNode; classes: string; label: string }> = {
  SUCCESS: { icon: <CheckCircle2 className="w-3.5 h-3.5" />, classes: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', label: 'Success' },
  FAILED:  { icon: <XCircle className="w-3.5 h-3.5" />, classes: 'text-rose-400 bg-rose-500/10 border-rose-500/30', label: 'Failed' },
  BLOCKED: { icon: <AlertCircle className="w-3.5 h-3.5" />, classes: 'text-amber-400 bg-amber-500/10 border-amber-500/30', label: 'Blocked' },
  PENDING: { icon: <Clock className="w-3.5 h-3.5" />, classes: 'text-slate-400 bg-slate-500/10 border-slate-500/30', label: 'Pending' },
};

const ACTION_LABELS: Record<AuditAction, string> = {
  LOGIN_SUCCESS: 'Login',
  LOGIN_FAILED: 'Login Failed',
  LOGIN_MFA_CHALLENGE: 'MFA Challenge',
  LOGOUT: 'Logout',
  PASSWORD_CHANGED: 'Password Changed',
  PASSWORD_RESET_REQUESTED: 'Password Reset Req.',
  PASSWORD_RESET_CONFIRMED: 'Password Reset',
  MFA_ENABLED: '2FA Enabled',
  MFA_DISABLED: '2FA Disabled',
  OTP_SENT: 'OTP Sent',
  OTP_VERIFIED: 'OTP Verified',
  OTP_FAILED: 'OTP Failed',
  RATE_LIMITED: 'Rate Limited',
  IP_BLOCKED: 'IP Blocked',
  ACCOUNT_LOCKED: 'Account Locked',
  TOKEN_REFRESHED: 'Token Refreshed',
};

const ACTION_COLORS: Partial<Record<AuditAction, string>> = {
  LOGIN_SUCCESS: 'text-emerald-400',
  LOGIN_FAILED: 'text-rose-400',
  LOGIN_MFA_CHALLENGE: 'text-indigo-400',
  LOGOUT: 'text-slate-400',
  PASSWORD_CHANGED: 'text-violet-400',
  MFA_ENABLED: 'text-sky-400',
  MFA_DISABLED: 'text-amber-400',
  RATE_LIMITED: 'text-amber-400',
  IP_BLOCKED: 'text-rose-400',
  ACCOUNT_LOCKED: 'text-rose-400',
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

function exportCsv(entries: AuditLogEntry[]) {
  const headers = ['Timestamp', 'Action', 'Outcome', 'User', 'IP', 'Country', 'User Agent'];
  const rows = entries.map(e => [
    e.timestamp, ACTION_LABELS[e.action] ?? e.action, e.outcome,
    e.userEmail ?? '', e.ip, e.country ?? '', e.userAgent ?? '',
  ]);
  const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""').replace(/^[=+@-]/, "'" + String(c)[0])}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `security-audit-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Main Component ────────────────────────────────────────────────────────

export const AuditLogPanel: React.FC = () => {
  const [entries, setEntries]       = useState<AuditLogEntry[]>([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(true);
  const [autoRefresh, setAutoRef]   = useState(false);
  const [search, setSearch]         = useState('');
  const [filterAction, setFAction]  = useState('');
  const [filterOutcome, setFOut]    = useState('');
  const [error, setError] = useState('');
  const generation = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const LIMIT = 15;

  const load = useCallback(async (p = 1) => {
    const id = ++generation.current;
    setLoading(true); setError('');
    try {
      const res = await authService.getAuditLog({
        page: p,
        limit: LIMIT,
        userEmail: search || undefined,
        action: filterAction || undefined,
        outcome: filterOutcome || undefined,
      });
      if (id !== generation.current) return;
      setEntries(res.data);
      setTotal(res.total);
      setPage(p);

    } catch (err: any) {
      if (id !== generation.current) return;
      setError(err.message || 'Unable to load audit events.');
      setEntries([]); setTotal(0);
    } finally {
      if (id === generation.current) setLoading(false);
    }
  }, [search, filterAction, filterOutcome]);

  useEffect(() => { const timer = setTimeout(() => load(1), 250); return () => { clearTimeout(timer); ++generation.current; }; }, [load]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => load(page), 30000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [autoRefresh, page, load]);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="space-y-4">
      {error && <p role="alert" className="text-rose-300 text-sm">{error} <button onClick={() => load(page)} className="underline">Retry</button></p>}
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <ClipboardList className="w-4 h-4 text-indigo-400" />
              <span>Security Audit Log</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {`${total.toLocaleString()} events total`}

            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Auto-refresh toggle */}
          <button
            onClick={() => setAutoRef(v => !v)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
              autoRefresh
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                : 'border-dark-border text-slate-400 hover:text-white'
            }`}
          >
            <Activity className={`w-3 h-3 ${autoRefresh ? 'animate-pulse' : ''}`} />
            <span>{autoRefresh ? 'Live' : 'Auto-refresh'}</span>
          </button>

          <button onClick={() => exportCsv(entries)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-dark-border text-slate-400 hover:text-white text-xs font-medium transition">
            <Download className="w-3 h-3" />
            <span>Export CSV</span>
          </button>

          <button onClick={() => load(page)}
            className="p-1.5 rounded-lg border border-dark-border text-slate-400 hover:text-white transition">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-40">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by user or IP..."
            className="w-full bg-dark-bg border border-dark-border rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="w-44">
          <DatalistSelect
            value={filterAction}
            onChange={val => setFAction(val as any)}
            options={[
              { id: '', label: 'All Actions' },
              ...(Object.keys(ACTION_LABELS) as AuditAction[]).map(a => ({
                id: a,
                label: ACTION_LABELS[a],
              })),
            ]}
            placeholder="All Actions"
            size="sm"
          />
        </div>

        <div className="w-36">
          <DatalistSelect
            value={filterOutcome}
            onChange={val => setFOut(val as any)}
            options={[
              { id: '', label: 'All Outcomes' },
              { id: 'SUCCESS', label: 'Success' },
              { id: 'FAILED', label: 'Failed' },
              { id: 'BLOCKED', label: 'Blocked' },
              { id: 'PENDING', label: 'Pending' },
            ]}
            placeholder="All Outcomes"
            size="sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-dark-border overflow-hidden">
        {/* Head */}
        <div className="grid grid-cols-[1fr_1.2fr_auto_1fr_auto] gap-x-3 px-4 py-2.5 bg-dark-bg border-b border-dark-border text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          <span>Timestamp</span>
          <span>Action</span>
          <span>Status</span>
          <span>User / IP</span>
          <span>UA</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">No audit events found</div>
        ) : (
          <div className="divide-y divide-dark-border/50">
            {entries.map((entry) => {
              const outcomeConf = OUTCOME_CONFIG[entry.outcome];
              const actionColor = ACTION_COLORS[entry.action] ?? 'text-slate-300';
              return (
                <div key={entry.id}
                  className="grid grid-cols-[1fr_1.2fr_auto_1fr_auto] gap-x-3 px-4 py-2.5 hover:bg-dark-card/40 transition text-xs items-center">
                  {/* Timestamp */}
                  <div className="text-slate-500 tabular-nums text-[11px]">{formatTime(entry.timestamp)}</div>

                  {/* Action */}
                  <div className={`font-medium ${actionColor}`}>{ACTION_LABELS[entry.action] ?? entry.action}</div>

                  {/* Outcome badge */}
                  <div>
                    <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full border text-[11px] font-medium ${outcomeConf.classes}`}>
                      {outcomeConf.icon}
                      <span>{outcomeConf.label}</span>
                    </span>
                  </div>

                  {/* User / IP */}
                  <div className="min-w-0">
                    {entry.userEmail && (
                      <div className="text-slate-300 truncate">{entry.userEmail}</div>
                    )}
                    <div className="text-slate-500 font-mono text-[11px]">
                      {entry.ip}{entry.country ? ` · ${entry.country}` : ''}
                    </div>
                  </div>

                  {/* User agent (truncated) */}
                  <div className="text-slate-600 text-[11px] truncate max-w-28" title={entry.userAgent}>
                    {entry.userAgent?.split(' ')[0] ?? '—'}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Page {page} of {totalPages} · {total} events
          </p>
          <div className="flex items-center space-x-1">
            <button
              disabled={page <= 1}
              onClick={() => load(page - 1)}
              className="p-1.5 rounded-lg border border-dark-border text-slate-400 hover:text-white transition disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = i + Math.max(1, page - 2);
              if (p > totalPages) return null;
              return (
                <button key={p} onClick={() => load(p)}
                  className={`w-7 h-7 rounded-lg text-xs font-medium transition ${
                    p === page ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white border border-dark-border'
                  }`}
                >
                  {p}
                </button>
              );
            })}
            <button
              disabled={page >= totalPages}
              onClick={() => load(page + 1)}
              className="p-1.5 rounded-lg border border-dark-border text-slate-400 hover:text-white transition disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

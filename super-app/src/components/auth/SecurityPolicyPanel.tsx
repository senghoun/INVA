import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield, Save, RefreshCw, AlertCircle, CheckCircle2, Plus, Trash2,
  Globe, Clock, Zap, Server, Loader2, Lock,
} from 'lucide-react';
import { authService } from '../../services/auth.service';
import { rateLimiter } from '../../services/rate-limiter';
import { SecurityPolicy, IpRestrictionMode } from '../../types';
import { env } from '../../config/env';

// ─── Default fallback policy (seeded by deployment env vars like .env.hr) ────
const DEFAULT_POLICY: SecurityPolicy = {
  rateLimit: {
    enabled: true,
    maxAttempts: env.authPolicy?.rateLimitMaxAttempts ?? 5,
    windowSeconds: env.authPolicy?.rateLimitLockoutSeconds ?? 900,
    lockoutSeconds: env.authPolicy?.rateLimitLockoutSeconds ?? 900,
  },
  ipRestriction: {
    mode: (env.authPolicy?.ipAllowlist && env.authPolicy.ipAllowlist.length > 0) ? 'ALLOWLIST' : 'DISABLED',
    allowlist: env.authPolicy?.ipAllowlist ?? [],
    blocklist: [],
  },
  domainRestriction: {
    enabled: Boolean(env.authPolicy?.allowedDomains && env.authPolicy.allowedDomains.length > 0),
    allowedDomains: env.authPolicy?.allowedDomains && env.authPolicy.allowedDomains.length > 0
      ? env.authPolicy.allowedDomains
      : ['invaestate.com', 'hr.invaestate.com', 'super.invaestate.com'],
    serviceDomainMap: {
      'auth-service': ['*'],
      'hr-service': ['hr.invaestate.com', 'super.invaestate.com'],
      'crm-service': ['crm.invaestate.com', 'super.invaestate.com'],
      'ac-service': ['super.invaestate.com'],
      'it-service': ['super.invaestate.com'],
    },
  },
  session: {
    accessTokenTtl: 900,
    refreshTokenTtl: 604800,
    maxConcurrentSessions: 0,
  },
};

export const MICROSERVICES = [
  { key: 'auth-service', name: 'Auth & Identity Service', route: '/api/v1/auth', desc: 'Central login, MFA, tokens, user admin' },
  { key: 'hr-service', name: 'HR & Personnel Service', route: '/api/v1/hr', desc: 'Employees, departments, leaves' },
  { key: 'crm-service', name: 'CRM & Deals Service', route: '/api/v1/crm', desc: 'Clients, deals, property listings' },
  { key: 'ac-service', name: 'Accounting & Ledger Service', route: '/api/v1/ac', desc: 'Invoices, chart of accounts, tax' },
  { key: 'it-service', name: 'IT Operations Service', route: '/api/v1/it', desc: 'Hardware assets, equipment tracking' },
] as const;

// ─── Subcomponents ────────────────────────────────────────────────────────

const SectionCard: React.FC<{ title: string; subtitle: string; icon: React.ReactNode; accentColor: string; children: React.ReactNode }> =
  ({ title, subtitle, icon, accentColor, children }) => (
    <div className={`rounded-2xl border border-dark-border bg-dark-card/50 overflow-hidden`}>
      <div className={`flex items-center space-x-3 px-5 py-3.5 border-b border-dark-border bg-dark-bg/40`}>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accentColor}`}>
          {icon}
        </div>
        <div>
          <h4 className="text-sm font-bold text-white">{title}</h4>
          <p className="text-[11px] text-slate-400">{subtitle}</p>
        </div>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string }> =
  ({ checked, onChange, label }) => (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-xs text-slate-300">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? 'bg-indigo-600' : 'bg-dark-border'}`}
      >
        <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
      </button>
    </label>
  );

const NumberField: React.FC<{ label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; unit?: string }> =
  ({ label, value, onChange, min = 0, max, unit }) => (
    <div className="flex items-center justify-between gap-4">
      <label className="text-xs text-slate-300 flex-1">{label}</label>
      <div className="flex items-center space-x-1.5">
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          onChange={e => onChange(Number(e.target.value))}
          className="w-20 bg-dark-bg border border-dark-border rounded-lg px-2 py-1 text-xs text-slate-200 text-right focus:outline-none focus:border-indigo-500"
        />
        {unit && <span className="text-[11px] text-slate-500 w-10">{unit}</span>}
      </div>
    </div>
  );

const IpListEditor: React.FC<{ items: string[]; onChange: (items: string[]) => void; placeholder: string }> =
  ({ items, onChange, placeholder }) => {
    const [draft, setDraft] = useState('');

    const add = () => {
      const trimmed = draft.trim();
      if (!trimmed || items.includes(trimmed)) return;
      onChange([...items, trimmed]);
      setDraft('');
    };

    return (
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
            placeholder={placeholder}
            className="flex-1 bg-dark-bg border border-dark-border rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
          />
          <button
            onClick={add}
            className="px-2.5 py-1.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        {items.length > 0 && (
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {items.map((ip, i) => (
              <div key={i} className="flex items-center justify-between px-2.5 py-1.5 bg-dark-bg border border-dark-border rounded-lg">
                <code className="text-xs text-emerald-400 font-mono">{ip}</code>
                <button onClick={() => onChange(items.filter((_, j) => j !== i))}
                  className="text-slate-600 hover:text-rose-400 transition">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

// ─── Main Component ────────────────────────────────────────────────────────

export const SecurityPolicyPanel: React.FC = () => {
  const [policy, setPolicy]     = useState<SecurityPolicy>(DEFAULT_POLICY);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved]       = useState(false);
  const [domainDraft, setDomainDraft] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const p = await authService.getSecurityPolicy();
      setPolicy(p);
      setLoaded(true);
      // Sync client-side rate limiter with backend policy on load
      rateLimiter.applyPolicy(p);
    } catch (err: any) {
      setError(err.message || 'Failed to load security policy.');
    } finally {
      setLoading(false);
    }
  }, []);


  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const { id, updatedAt, updatedBy, ...cleanPayload } = policy as any;
      const updated = await authService.updateSecurityPolicy(cleanPayload);
      setPolicy(updated);
      // ── Immediately sync client-side rate limiter with the saved policy ──
      rateLimiter.applyPolicy(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save policy.');
    } finally {
      setSaving(false);
    }

  };

  const patch = <K extends keyof SecurityPolicy>(key: K, value: SecurityPolicy[K]) => {
    setPolicy(p => ({ ...p, [key]: value }));
  };

  const addDomain = () => {
    const d = domainDraft.trim().toLowerCase().replace(/^@/, '');
    if (!d || policy.domainRestriction.allowedDomains.includes(d)) return;
    patch('domainRestriction', {
      ...policy.domainRestriction,
      allowedDomains: [...policy.domainRestriction.allowedDomains, d],
    });
    setDomainDraft('');
  };

  const toggleServiceDomain = (serviceKey: string, domain: string) => {
    const currentMap = { ...(policy.domainRestriction.serviceDomainMap || {}) };
    const currentList = currentMap[serviceKey] || [];
    const isWildcard = currentList.includes('*');

    let updatedList: string[];
    if (isWildcard) {
      updatedList = [domain];
    } else if (currentList.includes(domain)) {
      updatedList = currentList.filter(d => d !== domain);
    } else {
      updatedList = [...currentList, domain];
    }
    currentMap[serviceKey] = updatedList;
    patch('domainRestriction', {
      ...policy.domainRestriction,
      serviceDomainMap: currentMap,
    });
  };

  const toggleAllDomainsForService = (serviceKey: string) => {
    const currentMap = { ...(policy.domainRestriction.serviceDomainMap || {}) };
    const currentList = currentMap[serviceKey] || [];
    const isWildcard = currentList.includes('*');
    currentMap[serviceKey] = isWildcard ? [] : ['*'];
    patch('domainRestriction', {
      ...policy.domainRestriction,
      serviceDomainMap: currentMap,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
        <span className="ml-2 text-sm text-slate-400">Loading security policy...</span>
      </div>
    );
  }

  if (!loaded) return <div role="alert" className="p-6 text-rose-300 text-sm">{error || 'Security policy unavailable.'}<button onClick={load} className="ml-4 underline">Retry</button></div>;

  const ipModeOptions: { value: IpRestrictionMode; label: string; desc: string }[] = [
    { value: 'DISABLED', label: 'Disabled', desc: 'No IP restrictions' },
    { value: 'ALLOWLIST', label: 'Allow Only Listed IPs', desc: 'Block all except allowlist' },
    { value: 'BLOCKLIST', label: 'Block Listed IPs', desc: 'Allow all except blocklist' },
  ];

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Shield className="w-4 h-4 text-indigo-400" />
            <span>Security Policy</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Configure authentication security rules for all users</p>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={load}
            className="p-2 rounded-lg bg-dark-card border border-dark-border text-slate-400 hover:text-white transition">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition disabled:opacity-60"
          >
            {saving ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Saving...</span></>
            ) : saved ? (
              <><CheckCircle2 className="w-3.5 h-3.5" /><span>Saved!</span></>
            ) : (
              <><Save className="w-3.5 h-3.5" /><span>Save Policy</span></>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Rate Limiting ───────────────────────────────────────────── */}
      <SectionCard
        title="Rate Limiting"
        subtitle="Protect against brute-force and credential stuffing attacks"
        icon={<Zap className="w-4 h-4" />}
        accentColor="bg-amber-500/10 border border-amber-500/30 text-amber-400"
      >
        <Toggle
          checked={policy.rateLimit.enabled}
          onChange={v => patch('rateLimit', { ...policy.rateLimit, enabled: v })}
          label="Enable rate limiting"
        />
        {policy.rateLimit.enabled && (
          <>
            <div className="border-t border-dark-border/50 pt-3 space-y-3">
              <NumberField
                label="Max failed attempts"
                value={policy.rateLimit.maxAttempts}
                min={1} max={20}
                onChange={v => patch('rateLimit', { ...policy.rateLimit, maxAttempts: v })}
              />
              <NumberField
                label="Sliding window"
                value={policy.rateLimit.windowSeconds}
                min={60}
                unit="seconds"
                onChange={v => patch('rateLimit', { ...policy.rateLimit, windowSeconds: v })}
              />
              <NumberField
                label="Lockout duration"
                value={policy.rateLimit.lockoutSeconds}
                min={60}
                unit="seconds"
                onChange={v => patch('rateLimit', { ...policy.rateLimit, lockoutSeconds: v })}
              />
            </div>
            <div className="flex items-center space-x-2 text-[11px] text-amber-400/80 bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>After {policy.rateLimit.maxAttempts} failures in {Math.round(policy.rateLimit.windowSeconds / 60)}m, users are locked for {Math.round(policy.rateLimit.lockoutSeconds / 60)}m.</span>
            </div>
          </>
        )}
      </SectionCard>

      {/* ── IP Restriction ──────────────────────────────────────────── */}
      <SectionCard
        title="IP Restrictions"
        subtitle="Control access by IP address or CIDR range"
        icon={<Globe className="w-4 h-4" />}
        accentColor="bg-sky-500/10 border border-sky-500/30 text-sky-400"
      >
        <div className="space-y-2">
          {ipModeOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => patch('ipRestriction', { ...policy.ipRestriction, mode: opt.value })}
              className={`w-full flex items-start space-x-3 p-3 rounded-xl border text-left transition ${
                policy.ipRestriction.mode === opt.value
                  ? 'border-sky-500/40 bg-sky-500/10'
                  : 'border-dark-border bg-dark-card/30 hover:border-slate-600'
              }`}
            >
              <div className={`mt-0.5 w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 transition ${
                policy.ipRestriction.mode === opt.value ? 'border-sky-400 bg-sky-400' : 'border-slate-500'
              }`} />
              <div>
                <div className="text-xs font-semibold text-white">{opt.label}</div>
                <div className="text-[11px] text-slate-400">{opt.desc}</div>
              </div>
            </button>
          ))}
        </div>

        {policy.ipRestriction.mode === 'ALLOWLIST' && (
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Allowed IPs / CIDR</label>
            <IpListEditor
              items={policy.ipRestriction.allowlist}
              onChange={v => patch('ipRestriction', { ...policy.ipRestriction, allowlist: v })}
              placeholder="e.g. 192.168.1.0/24 or 10.0.0.1"
            />
          </div>
        )}

        {policy.ipRestriction.mode === 'BLOCKLIST' && (
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Blocked IPs / CIDR</label>
            <IpListEditor
              items={policy.ipRestriction.blocklist}
              onChange={v => patch('ipRestriction', { ...policy.ipRestriction, blocklist: v })}
              placeholder="e.g. 203.0.113.0/24 or 1.2.3.4"
            />
          </div>
        )}
      </SectionCard>

      {/* ── Domain Restriction ─────────────────────────────────────── */}
      <SectionCard
        title="Domain Restrictions"
        subtitle="Limit sign-in to specific email domains"
        icon={<Lock className="w-4 h-4" />}
        accentColor="bg-violet-500/10 border border-violet-500/30 text-violet-400"
      >
        <Toggle
          checked={policy.domainRestriction.enabled}
          onChange={v => patch('domainRestriction', { ...policy.domainRestriction, enabled: v })}
          label="Enable domain allowlist"
        />
        {policy.domainRestriction.enabled && (
          <div className="pt-2 space-y-2">
            <label className="block text-xs font-semibold text-slate-300">Allowed Email Domains</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={domainDraft}
                onChange={e => setDomainDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addDomain(); } }}
                placeholder="e.g. inva.io"
                className="flex-1 bg-dark-bg border border-dark-border rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500 font-mono"
              />
              <button onClick={addDomain}
                className="px-2.5 py-1.5 rounded-lg bg-violet-600/80 hover:bg-violet-600 text-white text-xs transition">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            {policy.domainRestriction.allowedDomains.length > 0 && (
              <div className="space-y-1">
                {policy.domainRestriction.allowedDomains.map((d, i) => (
                  <div key={i} className="flex items-center justify-between px-2.5 py-1.5 bg-dark-bg border border-dark-border rounded-lg">
                    <code className="text-xs text-violet-400 font-mono">@{d}</code>
                    <button
                      onClick={() => patch('domainRestriction', {
                        ...policy.domainRestriction,
                        allowedDomains: policy.domainRestriction.allowedDomains.filter((_, j) => j !== i),
                      })}
                      className="text-slate-600 hover:text-rose-400 transition">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Microservices Access Authorization Matrix */}
            <div className="pt-4 border-t border-dark-border/60 space-y-3">
              <div>
                <h5 className="text-xs font-bold text-white flex items-center justify-between">
                  <span>Microservice Domain Access Matrix</span>
                  <span className="text-[10px] font-normal text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full border border-violet-500/20">
                    Enforced at API Gateway
                  </span>
                </h5>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Configure which domains can call each microservice. Requests from unauthorized domains will be rejected with 403 Forbidden.
                </p>
              </div>

              <div className="space-y-2.5">
                {MICROSERVICES.map(svc => {
                  const currentMap = policy.domainRestriction.serviceDomainMap || {};
                  const allowedList = currentMap[svc.key] || [];
                  const isWildcard = allowedList.includes('*');

                  return (
                    <div
                      key={svc.key}
                      className="p-3 rounded-xl bg-dark-bg/80 border border-dark-border space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-semibold text-white">{svc.name}</span>
                            <code className="text-[10px] text-slate-400 font-mono bg-dark-card px-1.5 py-0.5 rounded border border-dark-border">
                              {svc.route}
                            </code>
                          </div>
                          <p className="text-[10px] text-slate-400">{svc.desc}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleAllDomainsForService(svc.key)}
                          className={`text-[10px] font-medium px-2 py-1 rounded-md transition ${
                            isWildcard
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-dark-card text-slate-400 hover:text-white border border-dark-border'
                          }`}
                        >
                          {isWildcard ? 'All Domains (*)' : 'Restricted'}
                        </button>
                      </div>

                      {!isWildcard && (
                        <div className="pt-1.5 flex flex-wrap gap-1.5">
                          {policy.domainRestriction.allowedDomains.map(d => {
                            const isChecked = allowedList.includes(d);
                            return (
                              <button
                                key={d}
                                type="button"
                                onClick={() => toggleServiceDomain(svc.key, d)}
                                className={`flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-mono transition border ${
                                  isChecked
                                    ? 'bg-violet-600/30 text-violet-200 border-violet-500/50'
                                    : 'bg-dark-card text-slate-500 border-dark-border hover:border-slate-600'
                                }`}
                              >
                                <span>{isChecked ? '✓' : '+'}</span>
                                <span>{d}</span>
                              </button>
                            );
                          })}
                          {policy.domainRestriction.allowedDomains.length === 0 && (
                            <span className="text-[11px] text-amber-400">
                              Add domains above to configure access.
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </SectionCard>

      {/* ── Session Policy ─────────────────────────────────────────── */}
      <SectionCard
        title="Session Policy"
        subtitle="Control token lifetimes and concurrent sessions"
        icon={<Clock className="w-4 h-4" />}
        accentColor="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
      >
        <NumberField
          label="Access token TTL"
          value={policy.session.accessTokenTtl}
          min={60}
          unit="seconds"
          onChange={v => patch('session', { ...policy.session, accessTokenTtl: v })}
        />
        <NumberField
          label="Refresh token TTL"
          value={policy.session.refreshTokenTtl}
          min={3600}
          unit="seconds"
          onChange={v => patch('session', { ...policy.session, refreshTokenTtl: v })}
        />
        <NumberField
          label="Max concurrent sessions"
          value={policy.session.maxConcurrentSessions}
          min={0}
          unit="(0=∞)"
          onChange={v => patch('session', { ...policy.session, maxConcurrentSessions: v })}
        />
        <div className="flex items-center space-x-2 text-[11px] text-slate-500 bg-dark-bg/50 rounded-lg px-3 py-2">
          <Server className="w-3 h-3 shrink-0" />
          <span>Access token refreshes silently. Refresh token must be rotated on expiry.</span>
        </div>
      </SectionCard>
    </div>
  );
};

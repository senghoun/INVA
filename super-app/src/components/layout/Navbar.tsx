import { CompanySwitcher } from '../auth/CompanySwitcher';
import React, { useState, useEffect } from 'react';
import {
  Activity,
  Shield,
  Sparkles,
  RefreshCw,
  LogOut,
  LogIn,
  AlertTriangle,
  Radio,
} from 'lucide-react';
import { healthMonitor } from '../../services/health.service';
import { authService } from '../../services/auth.service';
import { ServiceLiveMetric, User } from '../../types';
import { DatalistSelect } from '../common/DatalistSelect';
import { env } from '../../config/env';

interface NavbarProps {
  onOpenLogin: () => void;
  onOpenAiConsole: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenLogin, onOpenAiConsole }) => {
  const [metrics, setMetrics] = useState<ServiceLiveMetric[]>([]);
  const [session, setSession] = useState(authService.getSessionState());
  useEffect(() => authService.subscribeSession(setSession), []);
  useEffect(() => {
    if (session.status !== 'unavailable' || session.retryAt === undefined) return;
    const timer = setTimeout(() => { void authService.fetchProfile().catch(() => {}); }, Math.max(1000, (session.retryAt || Date.now() + 10000) - Date.now()));
    return () => clearTimeout(timer);
  }, [session]);
  const [user, setUser] = useState<User | null>(authService.getCurrentUser());
  const [pollInterval, setPollInterval] = useState<number>(env.api.defaultPollInterval);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  useEffect(() => {
    const unsubHealth = healthMonitor.subscribe((newMetrics) => {
      setMetrics(newMetrics);
    });
    const unsubInterval = healthMonitor.subscribeInterval((intervalMs) => {
      setPollInterval(intervalMs);
    });
    const unsubAuth = authService.subscribe((newUser) => {
      setUser(newUser);
    });

    // Check auth profile on load
    authService.fetchProfile().catch(() => {});

    return () => {
      unsubHealth();
      unsubInterval();
      unsubAuth();
    };
  }, []);

  const downCount = metrics.filter((m) => m.status === 'DOWN').length;
  const degradedCount = metrics.filter((m) => m.status === 'DEGRADED').length;
  const isHealthy = downCount === 0 && degradedCount === 0 && metrics.length > 0;

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await healthMonitor.checkHealthNow();
    setTimeout(() => setIsRefreshing(false), 400);
  };

  const handleIntervalChange = (valStr: string) => {
    const val = Number(valStr);
    if (!isNaN(val) && val > 0) {
      setPollInterval(val);
      healthMonitor.setPollInterval(val);
    }
  };

  return (
    <header className="h-16 border-b border-dark-border bg-dark-surface/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Brand & Mesh Indicator */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-dark-bg rounded-[10px] flex items-center justify-center">
              <Radio className="w-5 h-5 text-indigo-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
                {env.app.name}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-400 border border-indigo-500/30">
                v{env.app.version}
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              {env.app.tagline}
            </p>
          </div>
        </div>

        {/* Global Mesh Status Badge */}
        <div className="hidden md:flex items-center pl-4 border-l border-dark-border">
          {isHealthy ? (
            <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping-slow inline-block"></span>
              <span>All 6 Services UP</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-950/60 border border-rose-500/30 text-rose-400 text-xs font-medium">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>
                {downCount > 0 ? `${downCount} Service DOWN` : `${degradedCount} Degraded`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-3">
        {/* Poller Interval Selector */}
        <div className="hidden lg:flex items-center space-x-2 bg-dark-card border border-dark-border rounded-lg px-2.5 py-0.5 text-xs text-slate-300">
          <Activity className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-slate-400">Heartbeat:</span>
          <DatalistSelect
            value={pollInterval}
            onChange={handleIntervalChange}
            options={[
              { id: '1000', label: '1s (Ultra)' },
              { id: '3000', label: '3s (Fast)' },
              { id: '5000', label: '5s (Normal)' },
              { id: '10000', label: '10s (Eco)' },
            ]}
            placeholder="Interval..."
            size="sm"
            hideSearchIcon
            dropdownAlign="right"
            className="w-32"
            inputClassName="bg-transparent border-none py-0.5 text-white font-medium focus:ring-0"
            accentColor="indigo"
          />
        </div>

        {/* Manual Refresh Button */}
        <button
          onClick={handleManualRefresh}
          className="p-2 rounded-lg bg-dark-card hover:bg-dark-border border border-dark-border text-slate-300 hover:text-white transition-all"
          title="Force Refresh Health"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
        </button>

        {/* Atria ASI Copilot Button */}
        <button
          onClick={onOpenAiConsole}
          className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 border border-indigo-400/30 transition-all transform hover:-translate-y-0.5"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-spin-slow" />
          <span>Atria ASI Copilot</span>
        </button>

        {/* User Account / Auth Button */}
        <CompanySwitcher />
          {user ? (
          <div className="flex items-center space-x-2 pl-2 border-l border-dark-border">
            <div className="flex items-center space-x-2 bg-dark-card border border-dark-border px-3 py-1 rounded-lg">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-medium text-slate-200 max-w-[130px] truncate">
                {user.email}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-900/60 text-indigo-300">
                {user.roles && user.roles[0] ? user.roles[0] : user.userType}
              </span>
            </div>
            <button
              onClick={() => { void authService.logout().catch(() => {}); }}
              className="p-1.5 rounded-lg hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : session.status !== 'signed-out' ? (
          <span role="status" className="text-xs text-amber-200 max-w-64">{session.status === 'checking' ? 'Restoring session…' : session.message}</span>
        ) : (
          <button
            onClick={onOpenLogin}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-dark-card hover:bg-dark-border border border-dark-border text-slate-200 hover:text-white text-xs font-medium transition"
          >
            <LogIn className="w-3.5 h-3.5 text-indigo-400" />
            <span>Admin Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};

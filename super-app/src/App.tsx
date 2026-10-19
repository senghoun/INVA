import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, NavigationTab } from './components/layout/Sidebar';
import { OverviewDashboard } from './components/dashboard/OverviewDashboard';
const ApiExplorer = lazy(() => import('./components/gateway/ApiExplorer').then(module => ({ default: module.ApiExplorer })));
const AuthManager = lazy(() => import('./components/auth/AuthManager').then(module => ({ default: module.AuthManager })));
import { IncidentLog } from './components/dashboard/IncidentLog';
const AtriaOpsConsole = lazy(() => import('./components/ai/AtriaOpsConsole').then(module => ({ default: module.AtriaOpsConsole })));
import { SettingsView } from './components/settings/SettingsView';
import { TrafficAnalyticsView } from './components/gateway/TrafficAnalyticsView';
const HrManager = lazy(() => import('./components/hr/HrManager').then(module => ({ default: module.HrManager })));
const CrmManager = lazy(() => import('./components/crm/CrmManager').then(module => ({ default: module.CrmManager })));
const AccountingManager = lazy(() => import('./components/accounting/AccountingManager').then(module => ({ default: module.AccountingManager })));
import { LoginModal } from './components/auth/LoginModal';
import { healthMonitor } from './services/health.service';
import { ServiceLiveMetric, IncidentEvent } from './types';

const VALID_TABS: NavigationTab[] = [
  'topology',
  'traffic',
  'explorer',
  'hr',
  'crm',
  'accounting',
  'auth',
  'incidents',
  'gemini',
  'settings',
];

const parseTabFromHash = (rawHash: string): NavigationTab | null => {
  const clean = rawHash.replace(/^#\/?/, '').toLowerCase().trim();
  const mainPart = clean.split('?')[0].split('/')[0];
  if (VALID_TABS.includes(mainPart as NavigationTab)) {
    return mainPart as NavigationTab;
  }
  return null;
};

const getInitialTab = (): NavigationTab => {
  if (typeof window === 'undefined') return 'topology';

  // 1. URL Hash (e.g. #hr or #hr/departments)
  const fromHash = parseTabFromHash(window.location.hash);
  if (fromHash) return fromHash;

  // 2. URL search params (e.g. ?tab=hr)
  try {
    const params = new URLSearchParams(window.location.search);
    const fromParam = params.get('tab')?.toLowerCase();
    if (fromParam && VALID_TABS.includes(fromParam as NavigationTab)) {
      return fromParam as NavigationTab;
    }
  } catch (_) {}

  // 3. LocalStorage persistence
  try {
    const saved = localStorage.getItem('inva_superapp_active_tab') as NavigationTab | null;
    if (saved && VALID_TABS.includes(saved)) {
      return saved;
    }
  } catch (_) {}

  return 'topology';
};

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavigationTab>(getInitialTab);
  const [metrics, setMetrics] = useState<ServiceLiveMetric[]>([]);
  const [incidents, setIncidents] = useState<IncidentEvent[]>([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  useEffect(() => {
    const openLogin = () => setShowLoginModal(true);
    window.addEventListener('inva:login-requested', openLogin);
    return () => window.removeEventListener('inva:login-requested', openLogin);
  }, []);
  const [selectedServiceForExplorer, setSelectedServiceForExplorer] = useState<string | undefined>(
    undefined
  );

  const handleTabChange = (tab: NavigationTab) => {
    if (tab !== 'explorer') {
      setSelectedServiceForExplorer(undefined);
    }
    setActiveTab(tab);
    try {
      localStorage.setItem('inva_superapp_active_tab', tab);
    } catch (_) {}

    const currentHashTab = parseTabFromHash(window.location.hash);
    if (currentHashTab !== tab) {
      window.location.hash = tab;
    }
  };

  // Sync state if browser back/forward or manual hash edit occurs
  useEffect(() => {
    const handleHashChange = () => {
      const tabFromHash = parseTabFromHash(window.location.hash);
      if (tabFromHash && tabFromHash !== activeTab) {
        if (tabFromHash !== 'explorer') {
          setSelectedServiceForExplorer(undefined);
        }
        setActiveTab(tabFromHash);
        try {
          localStorage.setItem('inva_superapp_active_tab', tabFromHash);
        } catch (_) {}
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [activeTab]);

  // Keep URL hash updated on initial load if none was present
  useEffect(() => {
    const currentHashTab = parseTabFromHash(window.location.hash);
    if (!currentHashTab) {
      window.history.replaceState(null, '', `#${activeTab}`);
    }
  }, [activeTab]);

  useEffect(() => {
    // Start real-time background health monitoring
    healthMonitor.start();

    const unsubHealth = healthMonitor.subscribe((newMetrics, newIncidents) => {
      setMetrics(newMetrics);
      setIncidents(newIncidents);
    });

    return () => {
      unsubHealth();
      healthMonitor.stop();
    };
  }, []);

  const handleExploreRoutes = (serviceKey: string) => {
    setSelectedServiceForExplorer(serviceKey);
    handleTabChange('explorer');
  };

  const activeIncidentsCount = incidents.filter(
    (inc) => inc.severity === 'CRITICAL' || inc.severity === 'WARNING'
  ).length;

  return (
    <div className="min-h-screen bg-dark-bg text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        onOpenLogin={() => setShowLoginModal(true)}
        onOpenAiConsole={() => handleTabChange('gemini')}
      />

      {/* Main Layout Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          incidentCount={activeIncidentsCount}
        />

        {/* Center Main View Area */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-h-[calc(100vh-4rem)]">
          <Suspense fallback={<p role="status" className="text-slate-400 p-8">Loading workspace…</p>}>
          {activeTab === 'topology' && (
            <OverviewDashboard
              metrics={metrics}
              incidents={incidents}
              onExploreRoutes={handleExploreRoutes}
            />
          )}

          {activeTab === 'traffic' && <TrafficAnalyticsView />}

          {activeTab === 'explorer' && (
            <ApiExplorer initialServiceFilter={selectedServiceForExplorer} />
          )}

          {activeTab === 'hr' && <HrManager />}

          {activeTab === 'crm' && <CrmManager />}

          {activeTab === 'accounting' && <AccountingManager />}

          {activeTab === 'auth' && <AuthManager />}

          {activeTab === 'incidents' && <IncidentLog incidents={incidents} />}

          {activeTab === 'gemini' && <AtriaOpsConsole />}

          {activeTab === 'settings' && <SettingsView />}
          </Suspense>
        </main>
      </div>

      {/* Modals */}
      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onSuccess={() => {
            setShowLoginModal(false);
          }}
        />
      )}
    </div>
  );
};

export default App;

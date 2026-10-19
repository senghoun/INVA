import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Building2,
  DollarSign,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Award,
  RefreshCw,
  X,
  Clock,
  Briefcase,
  Layers,
} from 'lucide-react';
import { crmService, Deal, ClientOrganization } from '../../services/crm.service';
import { DatalistSelect } from '../common/DatalistSelect';
import { ModalPortal } from '../common/ModalPortal';
import { Label } from '../common/Label';
import { Input } from '../common/Input';

const CRM_SUBTABS = ['deals', 'organizations'] as const;
type CrmSubTab = (typeof CRM_SUBTABS)[number];

const getInitialCrmTab = (): CrmSubTab => {
  if (typeof window === 'undefined') return 'deals';
  const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
  const parts = hash.split('?')[0].split('/');
  if (parts[0] === 'crm' && parts[1] && CRM_SUBTABS.includes(parts[1] as CrmSubTab)) {
    return parts[1] as CrmSubTab;
  }
  const saved = localStorage.getItem('inva_crm_active_subtab') as CrmSubTab | null;
  if (saved && CRM_SUBTABS.includes(saved)) {
    return saved;
  }
  return 'deals';
};

export const CrmManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<CrmSubTab>(getInitialCrmTab);

  const handleSubTabChange = (tab: CrmSubTab) => {
    setActiveTab(tab);
    try {
      localStorage.setItem('inva_crm_active_subtab', tab);
      window.location.hash = `crm/${tab}`;
    } catch (_) {}
  };

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
      const parts = hash.split('?')[0].split('/');
      if (parts[0] === 'crm' && parts[1] && CRM_SUBTABS.includes(parts[1] as CrmSubTab)) {
        setActiveTab(parts[1] as CrmSubTab);
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [organizations, setOrganizations] = useState<ClientOrganization[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Modals
  const [showCreateDeal, setShowCreateDeal] = useState(false);
  const [showCreateOrg, setShowCreateOrg] = useState(false);

  // Form states
  const [newDealForm, setNewDealForm] = useState({
    title: '',
    amount: '',
    currency: 'USD',
    clientOrgId: '',
  });

  const [newOrgForm, setNewOrgForm] = useState({
    name: '',
    industry: '',
    website: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [dealsList, orgsList] = await Promise.all([
        crmService.getDeals().catch(() => []),
        crmService.getOrganizations().catch(() => []),
      ]);
      setDeals(Array.isArray(dealsList) ? dealsList : (dealsList as any)?.data || []);
      setOrganizations(Array.isArray(orgsList) ? orgsList : (orgsList as any)?.data || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load CRM data');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkWon = async (dealId: string) => {
    setActionLoadingId(dealId);
    setErrorMsg(null);
    setSuccessNotice(null);
    try {
      const updated = await crmService.markDealWon(dealId);
      setSuccessNotice(
        `🎉 Deal "${updated.title}" marked as WON! BullMQ job published to Accounting for automated invoice generation.`
      );
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to mark deal as WON');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await crmService.createDeal({
        title: newDealForm.title,
        amount: parseFloat(newDealForm.amount),
        currency: newDealForm.currency,
        clientOrgId: newDealForm.clientOrgId,
      });
      setShowCreateDeal(false);
      setNewDealForm({ title: '', amount: '', currency: 'USD', clientOrgId: '' });
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create deal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await crmService.createOrganization({
        name: newOrgForm.name,
        industry: newOrgForm.industry || undefined,
        website: newOrgForm.website || undefined,
      });
      setShowCreateOrg(false);
      setNewOrgForm({ name: '', industry: '', website: '' });
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create client organization');
    } finally {
      setSubmitting(false);
    }
  };

  const dealsListSafe = Array.isArray(deals) ? deals : [];
  const orgsListSafe = Array.isArray(organizations) ? organizations : [];

  const totalPipelineValue = dealsListSafe.reduce((acc, d) => acc + (parseFloat(d.amount) || 0), 0);
  const wonDealsValue = dealsListSafe
    .filter((d) => d.status === 'WON')
    .reduce((acc, d) => acc + (parseFloat(d.amount) || 0), 0);

  const filteredDeals = dealsListSafe.filter((d) => {
    const q = search.toLowerCase();
    return (
      d.title?.toLowerCase().includes(q) ||
      d.organization?.name?.toLowerCase().includes(q) ||
      d.status?.toLowerCase().includes(q)
    );
  });

  const filteredOrgs = orgsListSafe.filter((o) => {
    const q = search.toLowerCase();
    return o.name?.toLowerCase().includes(q) || o.industry?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel rounded-2xl p-5 border border-dark-border">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <TrendingUp className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
                <span>CRM & Deals Pipeline</span>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                  Port :3003
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Client organizations, revenue pipelines, and cross-domain automated billing triggers
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl bg-dark-card border border-dark-border text-slate-300 hover:text-white transition"
            title="Refresh CRM data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          </button>

          {activeTab === 'deals' ? (
            <button
              onClick={() => setShowCreateDeal(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-semibold shadow-lg shadow-amber-500/20 flex items-center space-x-2 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create Deal</span>
            </button>
          ) : (
            <button
              onClick={() => setShowCreateOrg(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-semibold shadow-lg shadow-amber-500/20 flex items-center space-x-2 transition"
            >
              <Plus className="w-4 h-4" />
              <span>New Client Org</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel rounded-2xl p-4 border border-dark-border flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Pipeline Value</p>
            <p className="text-2xl font-black text-slate-100 mt-1">
              ${totalPipelineValue.toLocaleString(undefined, { minimumFractionDigits: 0 })}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-dark-border flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Closed WON Revenue</p>
            <p className="text-2xl font-black text-emerald-400 mt-1">
              ${wonDealsValue.toLocaleString(undefined, { minimumFractionDigits: 0 })}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Award className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-dark-border flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Client Organizations</p>
            <p className="text-2xl font-black text-orange-400 mt-1">{organizations.length}</p>
          </div>
          <div className="p-3 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
            <Building2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {successNotice && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
          <span>{successNotice}</span>
          <button onClick={() => setSuccessNotice(null)} className="text-emerald-400 hover:text-white ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          {errorMsg}
        </div>
      )}

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-dark-border pb-3">
        <div className="flex space-x-2">
          <button
            onClick={() => handleSubTabChange('deals')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-2 ${
              activeTab === 'deals'
                ? 'bg-amber-600/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 bg-dark-surface/40 border border-transparent'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Active Deals Pipeline ({deals.length})</span>
          </button>
          <button
            onClick={() => handleSubTabChange('organizations')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-2 ${
              activeTab === 'organizations'
                ? 'bg-amber-600/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 bg-dark-surface/40 border border-transparent'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Client Organizations ({organizations.length})</span>
          </button>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-dark-bg/80 border border-dark-border rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 w-full sm:w-64"
          />
        </div>
      </div>

      {/* Deals Pipeline View */}
      {activeTab === 'deals' && (
        <div className="space-y-3">
          {loading ? (
            <div className="glass-panel rounded-2xl p-12 border border-dark-border text-center text-slate-400 text-xs flex flex-col items-center space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
              <span>Loading revenue pipeline...</span>
            </div>
          ) : filteredDeals.length === 0 ? (
            <div className="glass-panel rounded-2xl p-12 border border-dark-border text-center text-slate-500 text-xs">
              No deals found. Click "Create Deal" to start a pipeline item.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDeals.map((deal) => {
                const isWon = deal.status === 'WON';
                const isLost = deal.status === 'LOST';
                const isOpen = deal.status === 'OPEN';

                return (
                  <div
                    key={deal.id}
                    className={`glass-panel rounded-2xl p-5 border transition flex flex-col justify-between space-y-4 ${
                      isWon
                        ? 'border-emerald-500/30 bg-emerald-950/10'
                        : isLost
                        ? 'border-rose-500/30 bg-rose-950/10'
                        : 'border-dark-border hover:border-amber-500/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                            isWon
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : isLost
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          }`}
                        >
                          {deal.status}
                        </span>

                        <span className="text-base font-black text-slate-100">
                          ${parseFloat(deal.amount).toLocaleString()}{' '}
                          <span className="text-[11px] font-normal text-slate-400 font-mono">
                            {deal.currency}
                          </span>
                        </span>
                      </div>

                      <h3 className="font-bold text-slate-100 text-sm mt-3">{deal.title}</h3>

                      <div className="mt-2 text-xs text-slate-400 flex items-center space-x-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-500" />
                        <span className="font-medium text-slate-300">
                          {deal.organization?.name || 'Unknown Client Organization'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-dark-border/60 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-mono">
                        {deal.createdAt ? new Date(deal.createdAt).toLocaleDateString() : 'N/A'}
                      </span>

                      {isOpen ? (
                        <button
                          onClick={() => handleMarkWon(deal.id)}
                          disabled={actionLoadingId === deal.id}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-[11px] shadow-sm flex items-center space-x-1.5 transition disabled:opacity-50"
                        >
                          {actionLoadingId === deal.id ? (
                            <>
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              <span>Triggering...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Mark WON</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">
                          {isWon ? '✓ Invoiced in AC' : 'Closed'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Organizations View */}
      {activeTab === 'organizations' && (
        <div className="glass-panel rounded-2xl border border-dark-border overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
              <span>Loading organizations...</span>
            </div>
          ) : filteredOrgs.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              No client organizations registered.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-dark-surface/80 border-b border-dark-border text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4">Organization Name</th>
                    <th className="py-3.5 px-4">Industry</th>
                    <th className="py-3.5 px-4">Website</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">UUID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-border">
                  {filteredOrgs.map((org) => (
                    <tr key={org.id} className="hover:bg-dark-surface/40 transition">
                      <td className="py-3.5 px-4 font-semibold text-slate-100">{org.name}</td>
                      <td className="py-3.5 px-4 text-slate-300">{org.industry || 'General Enterprise'}</td>
                      <td className="py-3.5 px-4">
                        {org.website ? (
                          <a
                            href={org.website}
                            target="_blank"
                            rel="noreferrer"
                            className="text-amber-400 hover:underline flex items-center space-x-1"
                          >
                            <span>{org.website}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold">
                          ACTIVE
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                        {org.id ? `${org.id.substring(0, 8)}...` : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Create Deal Modal */}
      {showCreateDeal && (
        <ModalPortal onClose={() => setShowCreateDeal(false)}>
          <div
            className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto modal-backdrop-animate"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowCreateDeal(false);
            }}
          >
            <div className="glass-panel rounded-2xl max-w-md w-full p-6 border border-dark-border space-y-4 my-8 modal-dialog-animate">
              <div className="flex items-center justify-between border-b border-dark-border pb-3">
                <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                  <span>Create New Sales Deal</span>
                </h3>
                <button
                  onClick={() => setShowCreateDeal(false)}
                  className="p-1 rounded-lg hover:bg-dark-surface text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateDeal} className="space-y-4 text-xs">
                <div>
                  <Label required>Deal Title</Label>
                  <Input
                    required
                    type="text"
                    value={newDealForm.title}
                    onChange={(e) => setNewDealForm({ ...newDealForm, title: e.target.value })}
                    placeholder="e.g. Cloud Migration & Support Contract"
                  />
                </div>

                <div>
                  <Label required>Client Organization</Label>
                  <DatalistSelect
                    required
                    value={newDealForm.clientOrgId}
                    onChange={(orgId) => setNewDealForm({ ...newDealForm, clientOrgId: orgId })}
                    options={organizations.map((org) => ({
                      id: org.id,
                      label: org.name,
                      sublabel: org.industry || 'Enterprise',
                    }))}
                    placeholder="Search client organization..."
                    accentColor="amber"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label required>Amount ($)</Label>
                    <Input
                      required
                      type="number"
                      min="1"
                      step="0.01"
                      value={newDealForm.amount}
                      onChange={(e) => setNewDealForm({ ...newDealForm, amount: e.target.value })}
                      placeholder="25000"
                    />
                  </div>
                  <div>
                    <Label>Currency</Label>
                    <DatalistSelect
                      value={newDealForm.currency}
                      onChange={(curr) => setNewDealForm({ ...newDealForm, currency: curr || 'USD' })}
                      options={[
                        { id: 'USD', label: 'USD ($)', sublabel: 'US Dollar' },
                        { id: 'EUR', label: 'EUR (€)', sublabel: 'Euro' },
                        { id: 'SGD', label: 'SGD (S$)', sublabel: 'Singapore Dollar' },
                        { id: 'GBP', label: 'GBP (£)', sublabel: 'British Pound' },
                        { id: 'JPY', label: 'JPY (¥)', sublabel: 'Japanese Yen' },
                      ]}
                      placeholder="Currency..."
                      accentColor="amber"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-dark-border">
                  <button
                    type="button"
                    onClick={() => setShowCreateDeal(false)}
                    className="px-4 py-2 rounded-xl bg-dark-surface text-slate-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold hover:from-amber-500 hover:to-orange-500 disabled:opacity-50"
                  >
                    {submitting ? 'Creating...' : 'Create Pipeline Deal'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Create Org Modal */}
      {showCreateOrg && (
        <ModalPortal onClose={() => setShowCreateOrg(false)}>
          <div
            className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto modal-backdrop-animate"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowCreateOrg(false);
            }}
          >
            <div className="glass-panel rounded-2xl max-w-md w-full p-6 border border-dark-border space-y-4 my-8 modal-dialog-animate">
              <div className="flex items-center justify-between border-b border-dark-border pb-3">
                <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-amber-400" />
                  <span>Register Client Organization</span>
                </h3>
                <button
                  onClick={() => setShowCreateOrg(false)}
                  className="p-1 rounded-lg hover:bg-dark-surface text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateOrg} className="space-y-4 text-xs">
                <div>
                  <Label required>Company / Organization Name</Label>
                  <Input
                    required
                    type="text"
                    value={newOrgForm.name}
                    onChange={(e) => setNewOrgForm({ ...newOrgForm, name: e.target.value })}
                    placeholder="e.g. Apex Global Solutions"
                  />
                </div>

                <div>
                  <Label>Industry Sector</Label>
                  <Input
                    type="text"
                    value={newOrgForm.industry}
                    onChange={(e) => setNewOrgForm({ ...newOrgForm, industry: e.target.value })}
                    placeholder="e.g. Fintech, Healthcare, Logistics"
                  />
                </div>

                <div>
                  <Label>Website URL</Label>
                  <Input
                    type="url"
                    value={newOrgForm.website}
                    onChange={(e) => setNewOrgForm({ ...newOrgForm, website: e.target.value })}
                    placeholder="https://example.com"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-dark-border">
                  <button
                    type="button"
                    onClick={() => setShowCreateOrg(false)}
                    className="px-4 py-2 rounded-xl bg-dark-surface text-slate-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold hover:from-amber-500 hover:to-orange-500 disabled:opacity-50"
                  >
                    {submitting ? 'Registering...' : 'Register Organization'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
};

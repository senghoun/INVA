import { Building2 } from 'lucide-react';
import { Button, DatalistSelect } from '../common';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { request } from '../../services/api';
import { authService } from '../../services/auth.service';
import { getActiveCompany, setActiveCompany } from '../../services/company-context';
export interface CompanyAccess { companyId: string; branchIds: string[]; permissions: string[] }
export function CompanySwitcher() {
  const [user, setUser] = useState(authService.getCurrentUser());
  const [company, setCompany] = useState(getActiveCompany());
  const [error, setError] = useState('');
  const [switching, setSwitching] = useState(false);
  const cache = useQueryClient();
  const automaticSelection = useRef<string | null>(null);
  useEffect(() => authService.subscribe(setUser), []);
  useEffect(() => { automaticSelection.current = null; }, [user?.id]);
  useEffect(() => { const changed = () => setCompany(getActiveCompany()); window.addEventListener('inva:company-changed', changed); return () => window.removeEventListener('inva:company-changed', changed); }, []);
  const access = useQuery({ queryKey: ['account', user?.id, 'company-access'], queryFn: () => request<CompanyAccess[]>('/api/v1/auth/company-access'), enabled: !!user });
  const companies = useQuery({
    queryKey: ['account', user?.id, 'company-names'],
    queryFn: () => request<{ id: string; name: string }[]>('/api/v1/hr/organizations/companies'),
    enabled: !!user && user.userType === 'INTERNAL' && !!access.data?.length,
    retry: false,
  });
  const switchCompany = useCallback(async (value: string) => {
    setSwitching(true); setError('');
    try {
      if (value) await request('/api/v1/auth/me', { headers: { 'X-Company-Id': value } });
      setActiveCompany(value || null);
      await cache.cancelQueries(); cache.clear();
      await authService.fetchProfile();
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Company switch failed.'); }
    finally { setSwitching(false); }
  }, [cache]);
  useEffect(() => {
    const assignment = access.data?.length === 1 ? access.data[0] : undefined;
    if (!user || user.userType !== 'INTERNAL' || company || !assignment || switching) return;
    const key = `${user.id}:${assignment.companyId}`;
    if (automaticSelection.current === key) return;
    automaticSelection.current = key; // Do not retry a denied selection or undo an explicit clear.
    void switchCompany(assignment.companyId);
  }, [access.data, user, company, switching, switchCompany]);
  if (!user || user.userType !== 'INTERNAL') return null;
  const assignments = access.data || [];
  const companyName = (id: string, index = 0) => companies.data?.find(entry => entry.id === id)?.name || (assignments.length === 1 ? 'Assigned company' : `Company ${index + 1}`);
  const soleAssignment = assignments.length === 1 ? assignments[0] : undefined;
  return <div className="min-w-0 text-xs space-y-1">
    {access.isPending || switching ? <span role="status" className="text-slate-400">Loading company…</span> : soleAssignment && company === soleAssignment.companyId ? (
      <div aria-label="Current company" className="inline-flex max-w-52 items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-slate-300">
        <Building2 className="h-4 w-4 shrink-0 text-indigo-400" />
        <span className="truncate" title={companyName(soleAssignment.companyId)}>{companyName(soleAssignment.companyId)}</span>
      </div>
    ) : soleAssignment ? (
      <Button size="sm" variant="secondary" onClick={() => void switchCompany(soleAssignment.companyId)}>Select {companyName(soleAssignment.companyId)}</Button>
    ) : assignments.length > 1 ? (
      <div className="w-48 sm:w-56">
        <label htmlFor="navbar-company" className="sr-only">Company context</label>
        <DatalistSelect id="navbar-company" size="sm" hideSearchIcon value={company || ''}
          placeholder="Select company" options={assignments.map((entry, index) => ({ id: entry.companyId, label: companyName(entry.companyId, index) }))}
          onChange={() => {}}
          onSelect={value => { if (value && value !== company) void switchCompany(value); }} />
      </div>
    ) : null}
    {(error || access.error) && <p role="alert" className="text-rose-300">{error || access.error?.message}</p>}
    {!access.isPending && assignments.length === 0 && <p className="text-slate-500">No company access assigned.</p>}
  </div>;
}

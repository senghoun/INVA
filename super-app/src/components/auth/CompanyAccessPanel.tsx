import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { request } from '../../services/api';
import { User } from '../../types';
import { Building2, ShieldCheck, Save, ShieldOff, CheckCircle2, AlertCircle, GitBranch } from 'lucide-react';
import { Badge, Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, DatalistSelect, Label } from '../common';

const permissionGroups: Record<string, string> = {
  'hr.employee': 'Employees', 'hr.attendance': 'Attendance', 'hr.leave': 'Leave',
  'hr.payroll': 'Payroll', 'finance.invoice': 'Invoices', 'finance.ledger': 'Ledger',
  'crm.customer': 'Customers', 'crm.deal': 'Deals',
  'platform.organization': 'Organizations', 'platform.documents': 'Documents',
};
const permissionLabels: Record<string, string> = {
  view: 'View records', manage: 'Manage records', delete: 'Delete employees',
  'private.view': 'View private details', 'access.manage': 'Manage employee access',
  clock: 'Clock in and out', request: 'Request leave', approve: 'Approve requests',
  issue: 'Issue invoices',
};
function permissionDetails(permission: string) {
  const group = Object.keys(permissionGroups).find(key => permission.startsWith(`${key}.`));
  const action = group ? permission.slice(group.length + 1) : permission.split('.').pop() || permission;
  return { group: group ? permissionGroups[group] : 'Other permissions', label: permissionLabels[action] || action.replace(/\./g, ' ') };
}

export function CompanyAccessPanel({ users }: { users: User[] }) {
  const [userId, setUserId] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [branchIds, setBranchIds] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [error, setError] = useState(''); const [saving, setSaving] = useState(false); const [notice, setNotice] = useState('');
  const cache = useQueryClient();
  const catalog = useQuery({ queryKey: ['platform', 'company-permissions'], queryFn: () => request<string[]>('/api/v1/auth/company-permissions') });
  const companies = useQuery({ queryKey: ['platform', 'companies'], queryFn: () => request<{ id: string; name: string }[]>('/api/v1/hr/organizations/companies') });
  const branches = useQuery({ queryKey: ['platform', companyId, 'branches'], queryFn: () => request<{ id: string; name: string }[]>(`/api/v1/hr/organizations/branches?companyId=${companyId}`), enabled: !!companyId });
  const assignments = useQuery({ queryKey: ['account', userId, 'company-access'], queryFn: () => request<{ companyId: string; branchIds: string[]; permissions: string[]; isActive: boolean }[]>(`/api/v1/auth/users/${userId}/company-access`), enabled: !!userId });
  useEffect(() => {
    const current = assignments.data?.find(entry => entry.companyId === companyId);
    setBranchIds(current?.branchIds || []); setPermissions(current?.permissions || []);
  }, [assignments.data, companyId]);
  async function save(isActive: boolean) {
    setSaving(true); setError(''); setNotice('');
    try {
      await request(`/api/v1/auth/users/${userId}/company-access/${companyId}`, { method: 'PUT', body: JSON.stringify({ branchIds, permissions, isActive }) });
      setNotice(isActive ? 'Company access saved.' : 'Company access revoked.');
      void cache.invalidateQueries({ queryKey: ['account'] });
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Unable to save company access.'); }
    finally { setSaving(false); }
  }
  const selectedAssignment = assignments.data?.find(entry => entry.companyId === companyId);
  const loadingAssignment = !!userId && assignments.isFetching;
  const loadError = catalog.error || companies.error || (companyId ? branches.error : null) || (userId ? assignments.error : null);
  const blocked = saving || !userId || !companyId || catalog.isPending || companies.isPending || branches.isPending || loadingAssignment || !!loadError;
  const grouped = (catalog.data || []).reduce<Record<string, string[]>>((groups, permission) => {
    const { group } = permissionDetails(permission);
    (groups[group] ||= []).push(permission);
    return groups;
  }, {});
  const checkboxClass = 'h-4 w-4 shrink-0 rounded border-slate-700 accent-indigo-500 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 disabled:cursor-not-allowed';

  return (
    <Card aria-label="Company access assignments">
      <CardHeader className="flex-wrap gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>Company access assignments</CardTitle>
            <CardDescription>Choose an account, then set its company, branch access and permissions.</CardDescription>
          </div>
        </div>
        <Badge variant={selectedAssignment?.isActive ? 'success' : 'default'}>
          {loadingAssignment ? 'Loading assignment' : selectedAssignment?.isActive ? 'Active assignment' : selectedAssignment ? 'Revoked assignment' : 'New assignment'}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-6">
        {(error || loadError) && (
          <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error || loadError?.message}</span>
          </div>
        )}
        {notice && (
          <div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />{notice}
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <Label htmlFor="company-access-account" required>Company access account</Label>
            <DatalistSelect id="company-access-account" value={userId} disabled={saving}
              placeholder="Select an account"
              onChange={value => { setUserId(value); setBranchIds([]); setPermissions([]); setError(''); setNotice(''); }}
              options={users.filter(user => user.isActive && user.userType === 'INTERNAL').map(user => ({ id: user.id, label: user.email }))} />
            <p className="mt-2 text-xs text-slate-500">Active internal accounts from the current directory page.</p>
          </div>
          <div>
            <Label htmlFor="company-access-company" required>Company access company</Label>
            <DatalistSelect id="company-access-company" value={companyId} disabled={saving || companies.isPending}
              placeholder={companies.isPending ? 'Loading companies…' : 'Select a company'}
              onChange={value => { setCompanyId(value); setBranchIds([]); setPermissions([]); setError(''); setNotice(''); }}
              options={(companies.data || []).map(company => ({ id: company.id, label: company.name }))} />
            <p className="mt-2 text-xs text-slate-500">Access applies only to the selected company.</p>
          </div>
        </div>

        <fieldset disabled={saving || !companyId || loadingAssignment || !!loadError} className="space-y-3">
          <legend className="mb-1 flex items-center gap-2 text-sm font-semibold text-white"><GitBranch className="h-4 w-4 text-indigo-400" />Allowed branches</legend>
          <p className="text-xs text-slate-400">Leave all branches unchecked to allow access to every branch in this company.</p>
          {!companyId ? (
            <div className="rounded-xl border border-dashed border-slate-800 p-4 text-sm text-slate-500">Select a company to view its branches.</div>
          ) : branches.isPending ? (
            <p role="status" className="text-sm text-slate-400">Loading branches…</p>
          ) : branches.data?.length === 0 ? (
            <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-400"><Building2 className="h-4 w-4 shrink-0" />This company has no branches. Access applies to the company.</div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {branches.data?.map(branch => <Label key={branch.id} className="mb-0 flex cursor-pointer items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/50 p-3 text-sm text-slate-300 transition-colors hover:border-slate-700 hover:bg-slate-800/50">
                <input type="checkbox" className={checkboxClass} checked={branchIds.includes(branch.id)} onChange={event => setBranchIds(previous => event.target.checked ? [...previous, branch.id] : previous.filter(id => id !== branch.id))} />
                {branch.name}
              </Label>)}
            </div>
          )}
        </fieldset>

        <fieldset disabled={saving || !userId || !companyId || loadingAssignment || !!loadError} className="space-y-3">
          <legend className="mb-1 text-sm font-semibold text-white">Permissions <span className="ml-2 text-xs font-normal text-slate-400">{permissions.length} selected</span></legend>
          <p className="text-xs text-slate-400">Select the actions this account can perform within its assigned company and branches.</p>
          {catalog.isPending ? <p role="status" className="text-sm text-slate-400">Loading permissions…</p> : (
            <div className="grid items-start gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {Object.entries(grouped).map(([group, entries]) => (
                <div key={group} className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/40">
                  <div className="flex items-center justify-between border-b border-slate-800/80 px-4 py-3">
                    <h4 className="text-xs font-semibold text-slate-200">{group}</h4>
                    <span className="text-xs text-slate-500">{entries.filter(permission => permissions.includes(permission)).length}/{entries.length}</span>
                  </div>
                  <div className="space-y-1 p-2">
                    {entries.map(permission => <Label key={permission} className="mb-0 flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2.5 text-sm text-slate-300 transition-colors hover:bg-slate-800/60">
                      <input type="checkbox" aria-label={permission} className={checkboxClass} checked={permissions.includes(permission)} onChange={event => setPermissions(previous => event.target.checked ? [...previous, permission] : previous.filter(value => value !== permission))} />
                      {permissionDetails(permission).label}
                    </Label>)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </fieldset>
      </CardContent>

      <CardFooter className="flex-col items-stretch gap-4 sm:flex-row sm:items-center">
        <p className="text-xs text-slate-400">{!userId || !companyId ? 'Select an account and company to edit access.' : 'Changes apply to the account’s next request.'}</p>
        <div className="flex flex-wrap gap-2 sm:justify-end">
          <Button variant="secondary" disabled={saving || !userId || !companyId || loadingAssignment || !selectedAssignment?.isActive || !!loadError}
            leftIcon={<ShieldOff className="h-4 w-4" />} onClick={() => void save(false)}>Revoke assignment</Button>
          <Button disabled={blocked} isLoading={saving} leftIcon={<Save className="h-4 w-4" />} onClick={() => void save(true)}>Save assignment</Button>
        </div>
      </CardFooter>
    </Card>
  );
}

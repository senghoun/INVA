import React, { useEffect, useState } from 'react';
import { Button, Input, Label, Modal, DatalistSelect } from '../../common';
import { authService } from '../../../services/auth.service';
import { hrService, EmployeeProfile, HrRole } from '../../../services/hr.service';
import { User } from '../../../types';

export const EmployeeAccessModal: React.FC<{ employee: EmployeeProfile; onClose: () => void }> = ({ employee, onClose }) => {
  const [roles, setRoles] = useState<HrRole[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [account, setAccount] = useState('');
  const [originalAccount, setOriginalAccount] = useState('');
  const [accounts, setAccounts] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [lookupError, setLookupError] = useState('');
  const [notice, setNotice] = useState('');
  const canLink = authService.getCurrentUser()?.roles.includes('ADMIN');
  const load = async () => {
    setLoading(true); setError('');
    try {
      const [access, available] = await Promise.all([hrService.getEmployeeAccess(employee.id), hrService.getHrRoles()]);
      setRoles(available); setSelected(access.roles.map(r => r.id)); setAccount(access.authUserId || ''); setOriginalAccount(access.authUserId || '');
    } catch (err: any) { setError(err.message || 'Unable to load employee access.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, [employee.id]);
  useEffect(() => {
    if (!canLink) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try { const result = await authService.listUsers({ search: search || undefined, userType: 'INTERNAL', isActive: true, limit: 20 }); if (!cancelled) { setAccounts(result.data); setLookupError(''); } }
      catch (err: any) { if (!cancelled) setLookupError(err.message); }
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [search, canLink]);
  const save = async () => {
    setPending(true); setError(''); setNotice('');
    try {
      const saved = await hrService.updateEmployeeAccess(employee.id, { roleIds: selected, ...(canLink && account !== originalAccount ? { authUserId: account || null } : {}) });
      setOriginalAccount(saved.authUserId || '');
      setNotice('Employee access saved. Permissions apply to the next API request.');
    } catch (err: any) { setError(err.message || 'Unable to save access.'); }
    finally { setPending(false); }
  };
  return <Modal isOpen maxWidth="lg" title={`HR access · ${employee.firstName} ${employee.lastName}`} onClose={() => { if (!pending) onClose(); }}>
    <div className="space-y-4">
      {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
      {notice && <p role="status" className="text-sm text-emerald-300">{notice}</p>}
      {loading ? <p role="status" className="text-slate-400">Loading access…</p> : roles.length === 0 && error ? <Button onClick={load}>Retry</Button> : <>
        <fieldset disabled={pending} className="space-y-4">
          <div><Label>Linked login account</Label>{canLink ? <div className="space-y-2">
            <Input aria-label="Search login accounts" placeholder="Search internal accounts by email…" value={search} onChange={e => setSearch(e.target.value)} />
            <DatalistSelect value={account} onChange={setAccount} placeholder="Select a login account" options={[{ id: '', label: 'No linked account' }, ...(!accounts.some(a => a.id === account) && account ? [{ id: account, label: `Linked account: ${account}` }] : []), ...accounts.map(a => ({ id: a.id, label: a.email }))]} />
            {lookupError && <p role="alert" className="text-xs text-rose-300">{lookupError}</p>}
          </div> : <p className="text-xs text-slate-300 break-all">{account || 'Not linked. Ask an Auth administrator to link the employee’s login account.'}</p>}</div>
          {(!account || !employee.isActive) && <p className="text-xs text-amber-300">Roles are saved, but access requires an active employee linked to an active internal login account.</p>}
          <div className="max-h-64 overflow-y-auto divide-y divide-dark-border border border-dark-border rounded-xl">{roles.map(role => <Label key={role.id} className="flex gap-3 p-3 cursor-pointer">
            <input type="checkbox" checked={selected.includes(role.id)} onChange={e => setSelected(ids => e.target.checked ? [...ids, role.id] : ids.filter(id => id !== role.id))} />
            <span><span className="text-sm text-white">{role.name}</span><span className="block text-xs text-slate-400 mt-1">{role.description}</span><span className="block text-xs text-slate-500 mt-1">{role.permissions.length} permissions</span></span>
          </Label>)}</div>
          <details className="text-xs text-slate-400"><summary>Selected permissions</summary><ul className="mt-2 space-y-1">{[...new Set(roles.filter(r => selected.includes(r.id)).flatMap(r => r.permissions))].sort().map(p => <li key={p}>{p}</li>)}</ul></details>
        </fieldset>
        <p className="text-xs text-slate-400">Removing HR roles removes their permissions. Central ADMIN and HR_ADMIN roles still provide administrative access. Self-service permissions apply only to the linked employee.</p>
        <div className="flex justify-end gap-2"><Button variant="secondary" disabled={pending} onClick={onClose}>Close</Button><Button isLoading={pending} onClick={save}>Save access</Button></div>
      </>}
    </div>
  </Modal>;
};

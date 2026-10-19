import React, { useState } from 'react';
import { Plus, RefreshCw, Search, Users } from 'lucide-react';
import { Role } from '../../types';
import { authService } from '../../services/auth.service';
import { Button, Input, Modal } from '../common';
import { accessDomains, roleAccess } from '../../config/role-access';

interface Props { roles: Role[]; onRefresh: () => void; onCreateRole: () => void; onManageUsers: () => void; }
export const RoleMatrix: React.FC<Props> = ({ roles, onRefresh, onCreateRole, onManageUsers }) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'active' | 'all' | 'inactive'>('active');
  const [confirm, setConfirm] = useState<Role | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const deactivate = async () => {
    if (!confirm || pending) return;
    setPending(true); setError('');
    try { await authService.deleteRole(confirm.id); setConfirm(null); onRefresh(); }
    catch (err: any) { setError(err.message); }
    finally { setPending(false); }
  };
  const visible = roles.filter(r => (filter === 'all' || r.isActive === (filter === 'active')) && `${r.name} ${r.description || ''}`.toLowerCase().includes(search.toLowerCase())).sort((a,b) => (a.name === 'ADMIN' ? -1 : b.name === 'ADMIN' ? 1 : a.name.localeCompare(b.name)));
  return <section className="glass-panel p-5 rounded-2xl space-y-5">
    <div className="flex flex-wrap justify-between items-start gap-4">
      <div><h2 className="text-white font-semibold">Roles & service access</h2><p className="text-xs text-slate-400 mt-1">{roles.filter(r => r.isActive).length} active roles · {roles.filter(r => !r.isActive).length} inactive</p></div>
      <div className="flex flex-wrap gap-2"><Button variant="secondary" size="sm" leftIcon={<Users className="w-4 h-4" />} onClick={onManageUsers}>Assign to users</Button><Button variant="ghost" size="icon-sm" aria-label="Refresh roles" onClick={onRefresh}><RefreshCw /></Button><Button size="sm" onClick={onCreateRole} leftIcon={<Plus className="w-4 h-4" />}>New role</Button></div>
    </div>
    <div className="flex flex-wrap gap-3 items-center justify-between">
      <Input containerClassName="max-w-sm" aria-label="Search roles" value={search} onChange={e => setSearch(e.target.value)} placeholder="Find a role…" leftIcon={<Search className="w-4 h-4" />} />
      <div className="flex gap-1" aria-label="Filter role status">{(['active','all','inactive'] as const).map(value => <Button key={value} size="sm" variant={filter === value ? 'primary' : 'ghost'} aria-pressed={filter === value} onClick={() => setFilter(value)}>{value === 'active' ? 'Active' : value === 'all' ? 'All roles' : 'Inactive'}</Button>)}</div>
    </div>
    <div className="overflow-x-auto rounded-xl border border-dark-border">
      <table className="w-full text-xs text-left"><caption className="sr-only">Role access by service. Internal accounts only; inactive roles grant no access.</caption>
        <thead className="bg-slate-950/60 text-slate-400"><tr><th className="p-4 min-w-56">Role</th>{accessDomains.map(domain => <th key={domain} className="p-3 text-center">{domain}</th>)}<th className="p-3">Status</th><th className="p-3 text-right">Action</th></tr></thead>
        <tbody className="divide-y divide-dark-border">{visible.map(role => <tr key={role.id} className="hover:bg-slate-800/30">
          <td className="p-4"><p className="text-slate-100 font-semibold">{role.name}</p><p className="mt-1 text-slate-400 max-w-xs">{role.description || 'No description'}</p></td>
          {roleAccess(role.name).map((level,index) => <td key={index} className="p-3 text-center"><span className={role.isActive && level === 'Manage' ? 'text-indigo-300' : role.isActive && level === 'Read' ? 'text-teal-300' : 'text-slate-600'}>{role.isActive ? level : '—'}</span></td>)}
          <td className={`p-3 ${role.isActive ? 'text-emerald-400' : 'text-slate-500'}`}>{role.isActive ? 'Active' : 'Inactive'}</td>
          <td className="p-3 text-right">{role.name.toUpperCase() === 'ADMIN' ? <span className="text-slate-500">Protected</span> : role.isActive ? <Button variant="ghost" size="sm" onClick={() => { setError(''); setConfirm(role); }}>Deactivate</Button> : <span className="text-slate-600">—</span>}</td>
        </tr>)}</tbody>
      </table>
      {!visible.length && <p className="p-8 text-center text-sm text-slate-400">No matching roles. Try another search or status.</p>}
    </div>
    <p className="text-xs text-slate-400">Manage = available read and write actions. Read = view only. These service roles require an internal account. Custom roles need an API permission mapping before they grant access.</p>
    {confirm && <Modal isOpen title={`Deactivate ${confirm.name}?`} onClose={() => { if (!pending) setConfirm(null); }}><div className="space-y-4"><p className="text-sm text-slate-300">This removes access provided by this role for every assigned user. Other assigned roles may still grant access.</p>{error && <p role="alert" className="text-sm text-rose-300">{error}</p>}<div className="flex justify-end gap-2"><Button variant="secondary" disabled={pending} onClick={() => setConfirm(null)}>Cancel</Button><Button variant="danger" isLoading={pending} onClick={deactivate}>Deactivate role</Button></div></div></Modal>}
  </section>;
};

import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { authService } from '../../services/auth.service';
import { User, Role } from '../../types';
import { Modal, Button, Input } from '../common';
import { accessSummary, roleAccess } from '../../config/role-access';

interface AssignRoleModalProps { user: User; allRoles: Role[]; onClose: () => void; onUpdated: () => void; }
export const AssignRoleModal: React.FC<AssignRoleModalProps> = ({ user, allRoles, onClose, onUpdated }) => {
  const [search, setSearch] = useState('');
  const [pending, setPending] = useState<string | null>(null);
  const [assigned, setAssigned] = useState(user.roles || []);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const toggle = async (role: Role) => {
    if (pending) return;
    const remove = assigned.includes(role.name);
    setPending(role.id); setError(''); setNotice('');
    try {
      const updated = remove ? await authService.removeRole(user.id, role.id) : await authService.assignRole(user.id, role.id);
      setAssigned(updated.roles);
      setNotice(`${role.name} ${remove ? 'removed' : 'assigned'}.`);
      onUpdated();
    } catch (err: any) { setError(err.message || 'Unable to change role.'); }
    finally { setPending(null); }
  };
  const admin = assigned.includes('ADMIN');
  const visible = allRoles.filter(r => r.isActive && `${r.name} ${r.description || ''}`.toLowerCase().includes(search.toLowerCase())).sort((a,b) => Number(assigned.includes(b.name)) - Number(assigned.includes(a.name)) || a.name.localeCompare(b.name));
  return <Modal isOpen title="Manage user access" maxWidth="2xl" onClose={() => { if (!pending) onClose(); }}>
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between gap-2"><p className="text-sm text-white break-all">{user.email}</p><span className="text-xs text-slate-400">{user.userType} · {assigned.length} assigned roles</span></div>
      {!user.isActive && <p className="text-xs text-amber-300">This account is suspended. Assigned roles do not enable access until it is activated.</p>}
      {user.userType === 'EXTERNAL' ? <p className="text-xs text-amber-300">Service administration requires an internal account. Assigning these roles will not override the external-account restriction.</p> : admin && <p className="text-xs text-indigo-300">ADMIN already provides access to all internal services. Removing another role does not remove access inherited from ADMIN.</p>}
      <Input aria-label="Search available roles" placeholder="Find a role…" value={search} onChange={e => setSearch(e.target.value)} leftIcon={<Search className="w-4 h-4" />} />
      {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}{notice && <p role="status" className="text-xs text-emerald-300">{notice}</p>}
      <div className="max-h-[50vh] overflow-y-auto rounded-xl border border-dark-border divide-y divide-dark-border">{visible.map(role => {
        const direct = assigned.includes(role.name);
        const inherited = user.userType === 'INTERNAL' && admin && role.name !== 'ADMIN' && roleAccess(role.name).some(level => level !== '—');
        const protectedRole = direct && role.name === 'ADMIN' && user.id === authService.getCurrentUser()?.id;
        return <div key={role.id} className="flex items-center justify-between gap-4 p-4"><div className="min-w-0"><p className="text-sm font-semibold text-white">{role.name}</p><p className="text-xs text-slate-400 mt-1">{accessSummary(role.name)}</p><p className="text-xs mt-2 text-indigo-300">{direct ? 'Direct assignment' : inherited ? 'Access inherited from ADMIN' : 'Not assigned'}{protectedRole && ' · your ADMIN role is protected'}</p></div><Button size="sm" variant={direct ? 'secondary' : 'primary'} disabled={!!pending || protectedRole} isLoading={pending === role.id} onClick={() => toggle(role)}>{direct ? 'Remove' : 'Assign'}</Button></div>;
      })}{!visible.length && <p className="p-8 text-sm text-center text-slate-400">No matching roles.</p>}</div>
      <div className="flex justify-between items-center gap-3"><span className="text-xs text-slate-400">Changes take effect immediately.</span><Button disabled={!!pending} onClick={onClose}>Done</Button></div>
    </div>
  </Modal>;
};

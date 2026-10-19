import { TelegramSettingsPanel } from './TelegramSettingsPanel';
import { CompanyAccessPanel } from './CompanyAccessPanel';
import React, { useEffect, useRef, useState } from 'react';
import { Users, Shield, Lock, ShieldCheck, ClipboardList, Key, RefreshCw } from 'lucide-react';
import { User, Role, UserType } from '../../types';
import { authService } from '../../services/auth.service';
import { EditUserModal } from './EditUserModal';
import { UserList } from './UserList';
import { RoleMatrix } from './RoleMatrix';
import { CreateUserModal } from './CreateUserModal';
import { CreateRoleModal } from './CreateRoleModal';
import { AssignRoleModal } from './AssignRoleModal';
import { ChangePasswordModal } from './ChangePasswordModal';
import { SecurityPolicyPanel } from './SecurityPolicyPanel';
import { AuditLogPanel } from './AuditLogPanel';
import { AccountSecurityPanel } from './AccountSecurityPanel';
import { LoginModal } from './LoginModal';

const tabs = [
  { id: 'users', label: 'User Directory', icon: Users },
  { id: 'roles', label: 'Roles & Access', icon: Shield },
  { id: 'security', label: 'Security Policy', icon: ShieldCheck },
  { id: 'audit', label: 'Audit Log', icon: ClipboardList },
] as const;
type Tab = typeof tabs[number]['id'];
const initialTab = (): Tab => {
  const tab = window.location.hash.replace(/^#\/?/, '').split('/')[1];
  return tabs.some(t => t.id === tab) ? tab as Tab : 'users';
};

export const AuthManager: React.FC = () => {
  const [session, setSession] = useState(authService.getSessionState());
  useEffect(() => authService.subscribeSession(setSession), []);
  const [tab, setTab] = useState<Tab>(initialTab);
  const [user, setUser] = useState(authService.getCurrentUser());
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [userType, setUserType] = useState('ALL');
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [login, setLogin] = useState(false);
  const [createUser, setCreateUser] = useState(false);
  const [createRole, setCreateRole] = useState(false);
  const [roleUser, setRoleUser] = useState<User | null>(null);
  const [changePassword, setChangePassword] = useState(false);
  const [editing, setEditing] = useState<{ user: User; mode: 'edit' | 'password' } | null>(null);
  const [notice, setNotice] = useState('');
  const requestId = useRef(0);
  const admin = !!user?.isActive && user.userType === 'INTERNAL' && user.roles.includes('ADMIN');
  const refresh = () => setRevision(r => r + 1);

  useEffect(() => authService.subscribe(setUser), []);
  useEffect(() => {
    const listener = () => setTab(initialTab());
    window.addEventListener('hashchange', listener);
    return () => window.removeEventListener('hashchange', listener);
  }, []);
  useEffect(() => {
    const id = ++requestId.current;
    if (!admin) {
      setEditing(null); setNotice(''); setUsers([]); setRoles([]); setRoleUser(null); setCreateUser(false); setCreateRole(false); setLoading(false);
      return;
    }
    setLoading(true); setError('');
    const timer = setTimeout(async () => {
      try {
        const [result, roleList] = await Promise.all([
          authService.listUsers({ page, limit: 20, search: search || undefined, userType: userType === 'ALL' ? undefined : userType as UserType }),
          authService.listRoles(true),
        ]);
        if (requestId.current !== id) return;
        if (page > result.totalPages) { setPage(result.totalPages); return; }
        setUsers(result.data); setTotal(result.total); setPages(result.totalPages); setRoles(roleList);
      } catch (err: any) {
        if (requestId.current === id) { setError(err.message || 'Unable to load accounts.'); setUsers([]); setRoles([]); }
      } finally { if (requestId.current === id) setLoading(false); }
    }, 250);
    return () => { clearTimeout(timer); ++requestId.current; };
  }, [admin, user?.id, page, search, userType, revision]);

  if (!user && session.status !== 'signed-out') return <div role="status" className="glass-panel rounded-2xl p-10 text-center max-w-lg mx-auto space-y-3">
    <RefreshCw className={`w-6 h-6 mx-auto text-indigo-400 ${session.status === 'checking' ? 'animate-spin' : ''}`} />
    <h2 className="text-lg font-bold text-white">{session.status === 'checking' ? 'Restoring your session' : 'Session verification paused'}</h2>
    <p className="text-sm text-slate-400">{session.message || 'Checking your saved sign-in. This is not a new login attempt.'}</p>
    {session.status === 'unavailable' && <button onClick={() => { void authService.fetchProfile().catch(() => {}); }} className="px-5 py-2 rounded-xl bg-indigo-600 text-white">Retry verification</button>}
  </div>;

  if (!admin) return (
    <div className="glass-panel rounded-2xl p-10 text-center max-w-lg mx-auto space-y-4">
      <Lock className="w-8 h-8 mx-auto text-indigo-400" />
      <h2 className="text-lg font-bold text-white">{user ? 'Administrator access required' : 'Sign in to manage authentication'}</h2>
      <p className="text-sm text-slate-400">An active internal account with the ADMIN role is required to manage users, roles, security policy, and audit logs.</p>
      {!user && <button onClick={() => setLogin(true)} className="px-5 py-2 rounded-xl bg-indigo-600 text-white">Sign in</button>}
      {user && <AccountSecurityPanel />}
      {user && <button onClick={() => setChangePassword(true)} className="text-indigo-300">Change my password</button>}
      {login && <LoginModal onClose={() => setLogin(false)} onSuccess={() => setLogin(false)} />}
      {changePassword && <ChangePasswordModal onClose={() => setChangePassword(false)} />}
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dark-border pb-4">
        <div role="tablist" aria-label="Authentication management" className="flex flex-wrap gap-2">
          {tabs.map(t => <button key={t.id} role="tab" aria-selected={tab === t.id}
            onClick={() => { setTab(t.id); window.location.hash = `auth/${t.id}`; }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${tab === t.id ? 'bg-indigo-600 text-white' : 'bg-dark-card text-slate-400 hover:text-white'}`}>
            <t.icon className="w-4 h-4" />{t.label}
          </button>)}
        </div>
        <button onClick={() => setChangePassword(true)} className="flex items-center gap-2 text-xs text-slate-300"><Key className="w-4 h-4" />Change password</button>
      </div>
      {(tab === 'users' || tab === 'roles') && error && <div role="alert" className="p-4 rounded-xl bg-rose-500/10 text-rose-300 text-sm">{error}<button onClick={refresh} className="ml-4 underline">Retry</button></div>}
      {notice && <p role="status" className="rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-300">{notice}</p>}
      {tab === 'users' && <>
        <UserList users={users} roles={roles} loading={loading} onRefresh={refresh} onCreateUser={() => setCreateUser(true)} onManageRoles={setRoleUser} onEditUser={user => { setNotice(''); setEditing({ user, mode: 'edit' }); }} onResetPassword={user => { setNotice(''); if (user.id === authService.getCurrentUser()?.id) setChangePassword(true); else setEditing({ user, mode: 'password' }); }}
          search={search} filterType={userType} onSearchChange={value => { setSearch(value); setPage(1); }} onTypeChange={value => { setUserType(value); setPage(1); }} />
        <div className="flex justify-between items-center text-xs text-slate-400">
          <span>{total} accounts · Page {page} of {pages}</span>
          <div className="flex gap-3"><button disabled={loading || page <= 1} onClick={() => setPage(p => p - 1)} className="disabled:opacity-30">Previous</button><button disabled={loading || page >= pages} onClick={() => setPage(p => p + 1)} className="disabled:opacity-30">Next</button></div>
        </div>
      </>}
      {tab === 'roles' && <CompanyAccessPanel users={users} />}
      {tab === 'roles' && (loading ? <p role="status" className="text-slate-400 p-8">Loading roles…</p> : <RoleMatrix onManageUsers={() => { setTab('users'); window.location.hash = 'auth/users'; }} roles={roles} onRefresh={refresh} onCreateRole={() => setCreateRole(true)} />)}
      {tab === 'security' && <><AccountSecurityPanel /><SecurityPolicyPanel /><TelegramSettingsPanel /></>}
      {tab === 'audit' && <AuditLogPanel />}
      {editing && <EditUserModal user={editing.user} mode={editing.mode} onClose={() => setEditing(null)} onSuccess={message => { setNotice(message); refresh(); }} />}
      {createUser && <CreateUserModal roles={roles.filter(r => r.isActive)} onClose={() => setCreateUser(false)} onSuccess={refresh} />}
      {createRole && <CreateRoleModal onClose={() => setCreateRole(false)} onSuccess={refresh} />}
      {roleUser && <AssignRoleModal user={roleUser} allRoles={roles.filter(r => r.isActive)} onClose={() => setRoleUser(null)} onUpdated={() => {
        refresh();

      }} />}
      {changePassword && <ChangePasswordModal onClose={() => setChangePassword(false)} />}
    </div>
  );
};

import React, { useState } from 'react';
import {
  Users,
  Shield,
  Search,
  CheckCircle,
  XCircle,
  Pencil,
  Key,
  Plus,
  RefreshCw,
  UserCheck,
  UserX,
} from 'lucide-react';
import { User, Role, UserType } from '../../types';
import { authService } from '../../services/auth.service';
import { DatalistSelect } from '../common/DatalistSelect';

interface UserListProps {
  search: string;
  filterType: string;
  onSearchChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  users: User[];
  roles: Role[];
  loading: boolean;
  onRefresh: () => void;
  onCreateUser: () => void;
  onManageRoles: (user: User) => void;
  onEditUser: (user: User) => void;
  onResetPassword: (user: User) => void;
}

export const UserList: React.FC<UserListProps> = ({
  users,
  roles,
  loading,
  onRefresh,
  onCreateUser,
  onManageRoles, onEditUser, onResetPassword, search, filterType, onSearchChange, onTypeChange,
}) => {
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState('');
  const filteredUsers = users;

  const handleToggleStatus = async (user: User) => {
    setPending(user.id); setError('');
    try {
      await authService.updateUser(user.id, { isActive: !user.isActive });
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally { setPending(null); }
  };

  const handleDeleteUser = async (user: User) => {
    if (window.confirm(`Are you sure you want to deactivate ${user.email}?`)) {
      try {
        await authService.deleteUser(user.id);
        onRefresh();
      } catch (err: any) {
        alert(`Failed to delete user: ${err.message}`);
      }
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border border-dark-border">
      {/* Table Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
            <Users className="w-4 h-4 text-indigo-400" />
            <span>User Directory & Identity Accounts</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage authenticated users, classification types, and RBAC permissions
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="bg-dark-bg/80 border border-dark-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-36 sm:w-48"
            />
          </div>

          {/* Type Filter */}
          <DatalistSelect
            value={filterType}
            onChange={(val) => onTypeChange(val || 'ALL')}
            options={[
              { id: 'ALL', label: 'All Types' },
              { id: 'INTERNAL', label: 'INTERNAL', sublabel: 'Staff' },
              { id: 'EXTERNAL', label: 'EXTERNAL', sublabel: 'Clients' },
            ]}
            placeholder="Filter type..."
            className="w-36 sm:w-44"
            inputClassName="bg-dark-bg/80 border-dark-border py-1.5 rounded-lg text-xs"
            accentColor="indigo"
          />

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            className="p-2 rounded-lg bg-dark-card hover:bg-dark-border border border-dark-border text-slate-300 hover:text-white transition"
            title="Reload Users"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>

          {/* Create User Button */}
          <button
            onClick={onCreateUser}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New User</span>
          </button>
        </div>
      </div>

      {error && <p role="alert" className="text-rose-300 text-xs mb-3">{error}</p>}
      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-dark-border/80 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <th className="pb-3 pl-2">User Email</th>
              <th className="pb-3">Type</th>
              <th className="pb-3">Assigned Roles</th>
              <th className="pb-3">Account Status</th>
              <th className="pb-3">Created</th>
              <th className="pb-3 text-right pr-2">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-border/40">
            {loading ? <tr><td colSpan={6} className="py-10 text-center text-slate-400" role="status">Loading users…</td></tr> : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                  No users found in database matching query.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-dark-card/40 transition-colors group">
                  <td className="py-3.5 pl-2">
                    <div className="font-semibold text-slate-200">{user.email}</div>
                    <div className="font-mono text-[10px] text-slate-400 truncate max-w-[180px]">
                      {user.id}
                    </div>
                  </td>
                  <td className="py-3.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        user.userType === 'INTERNAL'
                          ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                          : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                      }`}
                    >
                      {user.userType}
                    </span>
                  </td>
                  <td className="py-3.5">
                    <div className="flex flex-wrap gap-1 max-w-[260px]">
                      {user.roles && user.roles.length > 0 ? (
                        user.roles.map((r) => {
                          let badgeStyle = 'bg-dark-bg text-slate-300 border-dark-border';
                          if (r === 'ADMIN') badgeStyle = 'bg-indigo-950/90 text-indigo-300 border-indigo-500/40';
                          else if (r.includes('HR')) badgeStyle = 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40';
                          else if (r.includes('CRM')) badgeStyle = 'bg-cyan-950/90 text-cyan-300 border-cyan-500/40';
                          else if (r.includes('ACCOUNT')) badgeStyle = 'bg-amber-950/90 text-amber-300 border-amber-500/40';
                          else if (r.includes('IT')) badgeStyle = 'bg-purple-950/90 text-purple-300 border-purple-500/40';
                          else if (r.includes('AUDIT')) badgeStyle = 'bg-blue-950/90 text-blue-300 border-blue-500/40';

                          return (
                            <span
                              key={r}
                              className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${badgeStyle}`}
                            >
                              <Shield className="w-2.5 h-2.5" />
                              <span>{r}</span>
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">No services assigned</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5">
                    {user.isActive ? (
                      <span className="inline-flex items-center space-x-1 text-emerald-400 font-medium">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Active</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 text-rose-400 font-medium">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Suspended</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 text-slate-400 font-mono text-[11px]">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 text-right pr-2">
                    <div className="flex items-center justify-end space-x-2">
                      <button onClick={() => onEditUser(user)} title="Edit user" aria-label={`Edit ${user.email}`} className="p-2 text-slate-300 hover:text-white"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => onResetPassword(user)} title="Reset password" aria-label={`Reset password for ${user.email}`} className="p-2 text-slate-300 hover:text-white"><Key className="w-4 h-4" /></button>
                      <button
                        onClick={() => onManageRoles(user)}
                        className="px-2.5 py-1 rounded bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-500/40 text-indigo-300 hover:text-white text-[11px] font-semibold transition flex items-center space-x-1"
                      >
                        <Shield className="w-3 h-3 text-indigo-400" />
                        <span>Services & Roles</span>
                      </button>
                      <button
                        disabled={pending !== null || user.id === authService.getCurrentUser()?.id}
                        onClick={() => handleToggleStatus(user)}
                        className={`p-1 rounded transition ${
                          user.isActive
                            ? 'text-slate-400 hover:text-amber-400'
                            : 'text-slate-400 hover:text-emerald-400'
                        }`}
                        title={user.isActive ? 'Deactivate Account' : 'Activate Account'}
                      >
                        {user.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { X, UserPlus, Lock, Mail, Shield, AlertCircle } from 'lucide-react';
import { authService, CreateUserData } from '../../services/auth.service';
import { Role, UserType } from '../../types';
import { ModalPortal } from '../common/ModalPortal';
import { Label } from '../common/Label';
import { Input } from '../common/Input';

interface CreateUserModalProps {
  roles: Role[];
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  roles,
  onClose,
  onSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState<UserType>('INTERNAL');
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError(null);

    try {
      await authService.createUser({
        email: email.trim().toLowerCase(),
        password,
        userType,
        roleIds: selectedRoleIds,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const toggleRole = (roleId: string) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    );
  };

  return (
    <ModalPortal onClose={onClose}>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto modal-backdrop-animate"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="modal-dialog-animate rounded-2xl w-full max-w-md p-6 bg-[#0e131f]/95 border border-slate-700/60 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] relative overflow-hidden backdrop-blur-xl my-8">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-dark-border transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <UserPlus className="w-5 h-5" />
            </div>
          <div>
            <h3 className="text-base font-bold text-white">Create New Account</h3>
            <p className="text-xs text-slate-400">Add staff or client into inva_auth_db</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label required className="uppercase tracking-wider mb-1.5">
              Email Address
            </Label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@inva.io"
              leftIcon={<Mail />}
            />
          </div>

          <div>
            <Label required className="uppercase tracking-wider mb-1.5">
              Initial Password
            </Label>
            <Input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 characters"
              minLength={8}
              leftIcon={<Lock />}
            />
          </div>

          <div>
            <Label required className="uppercase tracking-wider mb-1.5">
              User Classification
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setUserType('INTERNAL')}
                className={`py-2 px-3 rounded-xl border text-xs font-medium transition ${
                  userType === 'INTERNAL'
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                    : 'bg-dark-bg border-dark-border text-slate-400 hover:text-slate-200'
                }`}
              >
                INTERNAL (Staff)
              </button>
              <button
                type="button"
                onClick={() => setUserType('EXTERNAL')}
                className={`py-2 px-3 rounded-xl border text-xs font-medium transition ${
                  userType === 'EXTERNAL'
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                    : 'bg-dark-bg border-dark-border text-slate-400 hover:text-slate-200'
                }`}
              >
                EXTERNAL (Client)
              </button>
            </div>
          </div>

          <div>
            <Label required className="uppercase tracking-wider mb-1.5">
              Assign Initial Roles
            </Label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 rounded-xl bg-dark-bg border border-dark-border">
              {roles.map((role) => {
                const isSelected = selectedRoleIds.includes(role.id);
                return (
                  <button
                    type="button"
                    key={role.id}
                    onClick={() => toggleRole(role.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-dark-surface border-dark-border text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Shield className="w-3 h-3 inline mr-1" />
                    {role.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-dark-bg border border-dark-border text-slate-300 hover:text-white text-xs font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition flex items-center space-x-1.5"
            >
              {loading ? (
                <span>Creating...</span>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Create User</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  </ModalPortal>
);
};

import React, { useState } from 'react';
import { X, ShieldPlus, AlertCircle } from 'lucide-react';
import { authService } from '../../services/auth.service';
import { ModalPortal } from '../common/ModalPortal';
import { Label } from '../common/Label';
import { Input } from '../common/Input';
import { Textarea } from '../common/Textarea';

interface CreateRoleModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateRoleModal: React.FC<CreateRoleModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a role identifier.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await authService.createRole(name.trim().toUpperCase(), description.trim() || undefined);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create role');
    } finally {
      setLoading(false);
    }
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
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-dark-border transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <ShieldPlus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Create RBAC Role</h3>
            <p className="text-xs text-slate-400">Define access authority level for ecosystem</p>
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
              Role Name (Uppercase identifier)
            </Label>
            <Input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value.toUpperCase())}
              placeholder="E.g. AUDITOR, HR_LEAD, SALES_REP"
              className="font-mono uppercase"
            />
          </div>

          <div>
            <Label className="uppercase tracking-wider mb-1.5">
              Description
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe access privileges granted by this role..."
              rows={3}
            />
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
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition flex items-center space-x-1.5"
            >
              {loading ? (
                <span>Creating...</span>
              ) : (
                <>
                  <ShieldPlus className="w-3.5 h-3.5" />
                  <span>Create Role</span>
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

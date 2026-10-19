import React, { useState } from 'react';
import { X, Lock, CheckCircle2, AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { authService } from '../../services/auth.service';
import { ModalPortal } from '../common/ModalPortal';
import { PasswordStrengthBar, getPasswordStrength } from './PasswordStrengthBar';

interface ChangePasswordModalProps {
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ onClose }) => {
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd]         = useState('');
  const [confirmPwd, setConfirm]    = useState('');
  const [showCurrent, setShowCur]   = useState(false);
  const [showNew, setShowNew]       = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [success, setSuccess]       = useState(false);

  const strength = getPasswordStrength(newPwd);
  const pwdMismatch = confirmPwd.length > 0 && newPwd !== confirmPwd;
  const isWeak = newPwd.length > 0 && strength.score < 2;
  const canSubmit = currentPwd && newPwd && confirmPwd && newPwd === confirmPwd && strength.score >= 2;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      await authService.changePassword(currentPwd, newPwd);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to change password. Check your current password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalPortal onClose={onClose}>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto modal-backdrop-animate"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="modal-dialog-animate rounded-2xl w-full max-w-md p-6 bg-[#0e131f]/95 border border-slate-700/60 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] relative overflow-hidden backdrop-blur-xl my-8">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-violet-500 to-transparent" />

          <button onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-dark-border transition">
            <X className="w-5 h-5" />
          </button>

          {!success ? (
            <>
              <div className="flex items-center space-x-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Change Password</h3>
                  <p className="text-xs text-slate-400">Update your account password</p>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Current password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Current Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showCurrent ? 'text' : 'password'}
                      required
                      value={currentPwd}
                      onChange={(e) => setCurrentPwd(e.target.value)}
                      placeholder="Current password"
                      className="w-full bg-dark-bg border border-dark-border rounded-xl pl-9 pr-10 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500"
                    />
                    <button type="button" onClick={() => setShowCur(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                      {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-dark-border" />

                {/* New password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showNew ? 'text' : 'password'}
                      required
                      value={newPwd}
                      onChange={(e) => setNewPwd(e.target.value)}
                      placeholder="New password"
                      className={`w-full bg-dark-bg border rounded-xl pl-9 pr-10 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none transition ${
                        isWeak ? 'border-amber-500/50 focus:border-amber-500' : 'border-dark-border focus:border-violet-500'
                      }`}
                    />
                    <button type="button" onClick={() => setShowNew(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {newPwd && <div className="mt-2"><PasswordStrengthBar password={newPwd} /></div>}
                </div>

                {/* Confirm password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={confirmPwd}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Confirm new password"
                      className={`w-full bg-dark-bg border rounded-xl pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none transition ${
                        pwdMismatch ? 'border-rose-500 focus:border-rose-500' : 'border-dark-border focus:border-violet-500'
                      }`}
                    />
                  </div>
                  {pwdMismatch && <p className="mt-1 text-xs text-rose-400">Passwords do not match</p>}
                </div>

                <div className="pt-3 flex items-center justify-end space-x-3">
                  <button type="button" onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-dark-bg border border-dark-border text-slate-300 hover:text-white text-xs font-medium transition">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !canSubmit}
                    className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-lg shadow-violet-600/30 transition flex items-center space-x-1.5 disabled:opacity-60"
                  >
                    {loading ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Updating...</span></>
                    ) : (
                      <span>Update Password</span>
                    )}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-white">Password Updated</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your password has been changed successfully. Use your new password on your next sign-in.
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30 transition"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </ModalPortal>
  );
};

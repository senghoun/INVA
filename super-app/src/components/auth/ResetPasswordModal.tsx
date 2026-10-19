import React, { useState } from 'react';
import { X, Mail, Lock, KeyRound, CheckCircle2, AlertCircle, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import { authService } from '../../services/auth.service';
import { rateLimiter } from '../../services/rate-limiter';
import { ModalPortal } from '../common/ModalPortal';
import { PasswordStrengthBar } from './PasswordStrengthBar';

interface ResetPasswordModalProps {
  onClose: () => void;
  /** Pre-fill email if coming from login modal */
  initialEmail?: string;
}

type Step = 'request' | 'sent' | 'confirm' | 'success';

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({ onClose, initialEmail }) => {
  const [step, setStep]         = useState<Step>('request');
  const [email, setEmail]       = useState(initialEmail || '');
  const [token, setToken]       = useState('');
  const [newPwd, setNewPwd]     = useState('');
  const [confirmPwd, setConfirm] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const RL_KEY = `reset:${email || 'global'}`;

  // ── Step 1: Request reset email ──────────────────────────────────────────
  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    const check = rateLimiter.check(RL_KEY);
    if (!check.allowed) {
      setError(`Too many attempts. Try again in ${check.retryAfterLabel}.`);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await authService.requestPasswordReset(email.trim().toLowerCase());
      rateLimiter.recordFailure(RL_KEY); // count as used attempt
      setStep('sent');
    } catch (err: any) {
      // Always show generic message to avoid user enumeration
      setStep('sent'); // intentionally proceed to prevent email enumeration
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: Confirm with token ───────────────────────────────────────────
  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newPwd || newPwd !== confirmPwd) return;

    setLoading(true);
    setError(null);
    try {
      await authService.confirmPasswordReset(token.trim(), newPwd);
      rateLimiter.reset(RL_KEY);
      setStep('success');
    } catch (err: any) {
      setError(err.message || 'Invalid or expired reset token. Please request a new one.');
    } finally {
      setLoading(false);
    }
  };

  const pwdMismatch = confirmPwd.length > 0 && newPwd !== confirmPwd;

  return (
    <ModalPortal onClose={onClose}>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto modal-backdrop-animate"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="modal-dialog-animate rounded-2xl w-full max-w-md p-6 bg-[#0e131f]/95 border border-slate-700/60 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] relative overflow-hidden backdrop-blur-xl my-8">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-sky-500 to-transparent" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-dark-border transition"
          >
            <X className="w-5 h-5" />
          </button>

          {/* ── Request Step ───────────────────────────────────────────── */}
          {step === 'request' && (
            <>
              <div className="flex items-center space-x-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Reset Password</h3>
                  <p className="text-xs text-slate-400">We'll send a reset link to your email</p>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleRequest} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full bg-dark-bg border border-dark-border rounded-xl pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end space-x-3">
                  <button type="button" onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-dark-bg border border-dark-border text-slate-300 hover:text-white text-xs font-medium transition">
                    Cancel
                  </button>
                  <button type="submit" disabled={loading}
                    className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-lg shadow-sky-600/30 transition flex items-center space-x-1.5 disabled:opacity-60">
                    {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Sending...</span></> : <span>Send Reset Link</span>}
                  </button>
                </div>
              </form>
            </>
          )}

          {/* ── Sent Step ──────────────────────────────────────────────── */}
          {step === 'sent' && (
            <>
              <div className="text-center py-4 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 mx-auto">
                  <Mail className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-white">Check Your Inbox</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  If <span className="text-white">{email}</span> is registered, a reset link has been sent.
                  Check your spam folder if you don't see it within a few minutes.
                </p>
                <p className="text-xs text-slate-500">
                  Already have a reset token?
                </p>
                <button
                  onClick={() => setStep('confirm')}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
                >
                  Enter Reset Token
                </button>
              </div>
            </>
          )}

          {/* ── Confirm Step ───────────────────────────────────────────── */}
          {step === 'confirm' && (
            <>
              <div className="flex items-center space-x-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Set New Password</h3>
                  <p className="text-xs text-slate-400">Enter the token from your email</p>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleConfirm} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Reset Token
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="Paste token from email"
                      className="w-full bg-dark-bg border border-dark-border rounded-xl pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPwd ? 'text' : 'password'}
                      required
                      value={newPwd}
                      onChange={(e) => setNewPwd(e.target.value)}
                      placeholder="New password"
                      className="w-full bg-dark-bg border border-dark-border rounded-xl pl-9 pr-10 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                    <button type="button" onClick={() => setShowPwd(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {newPwd && <div className="mt-2"><PasswordStrengthBar password={newPwd} /></div>}
                </div>

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
                      placeholder="Confirm password"
                      className={`w-full bg-dark-bg border rounded-xl pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none transition ${
                        pwdMismatch ? 'border-rose-500 focus:border-rose-500' : 'border-dark-border focus:border-indigo-500'
                      }`}
                    />
                  </div>
                  {pwdMismatch && <p className="mt-1 text-xs text-rose-400">Passwords do not match</p>}
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button type="button" onClick={() => setStep('sent')}
                    className="text-xs text-slate-400 hover:text-white flex items-center space-x-1 transition">
                    <ArrowLeft className="w-3 h-3" />
                    <span>Back</span>
                  </button>
                  <button
                    type="submit"
                    disabled={loading || newPwd !== confirmPwd || !newPwd || !token}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition flex items-center space-x-1.5 disabled:opacity-60"
                  >
                    {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Resetting...</span></> : <span>Reset Password</span>}
                  </button>
                </div>
              </form>
            </>
          )}

          {/* ── Success Step ───────────────────────────────────────────── */}
          {step === 'success' && (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-white">Password Reset</h3>
              <p className="text-xs text-slate-400">
                Your password has been successfully updated. You can now sign in with your new password.
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30 transition"
              >
                Sign In Now
              </button>
            </div>
          )}
        </div>
      </div>
    </ModalPortal>
  );
};

import { RequiredPasswordChangeModal } from './RequiredPasswordChangeModal';
import React, { useState, useEffect, useRef } from 'react';
import {
  X, ShieldCheck, Lock, Mail, AlertCircle, KeyRound,
  Eye, EyeOff, Loader2, Shield, RotateCcw,
} from 'lucide-react';
import { authService, isMfaRequired, isPasswordChangeRequired } from '../../services/auth.service';
import { rateLimiter } from '../../services/rate-limiter';
import { ModalPortal } from '../common/ModalPortal';
import { MfaChallengeResponse } from '../../types';
import { env } from '../../config/env';

interface LoginModalProps {
  onClose: () => void;
  onSuccess?: () => void;
  onForgotPassword?: () => void;
}

type LoginStep = 'credentials' | 'mfa';

// ─── OTP Input ───────────────────────────────────────────────────────────────
const OtpInput: React.FC<{
  value: string;
  onChange: (v: string) => void;
  onComplete: () => void;
  disabled?: boolean;
}> = ({ value, onChange, onComplete, disabled }) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.split('').concat(Array(6).fill('')).slice(0, 6);

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
  };

  const handleChange = (i: number, val: string) => {
    const d = val.replace(/\D/g, '').slice(-1);
    const next = [...digits.map((x) => x || '')];
    next[i] = d;
    const newVal = next.join('').slice(0, 6);
    onChange(newVal);
    if (d && i < 5) {
      inputRefs.current[i + 1]?.focus();
    }
    if (newVal.length === 6) onComplete();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted);
    if (pasted.length === 6) onComplete();
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKey(i, e)}
          className={`w-10 h-12 text-center text-lg font-bold rounded-xl border bg-dark-bg text-white
            transition focus:outline-none
            ${d ? 'border-indigo-500 shadow-[0_0_0_2px_rgba(99,102,241,0.25)]' : 'border-dark-border'}
            disabled:opacity-50`}
        />
      ))}
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────
export const LoginModal: React.FC<LoginModalProps> = ({ onClose, onSuccess, onForgotPassword }) => {
  // Credentials step
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [passwordChangeToken, setPasswordChangeToken] = useState<string | null>(null);
  const [passwordNotice, setPasswordNotice] = useState('');
  const [showPwd, setShowPwd]   = useState(false);

  // MFA step
  const [step, setStep]               = useState<LoginStep>('credentials');
  const [challenge, setChallenge]     = useState<MfaChallengeResponse | null>(null);
  const [recoveryCode, setRecoveryCode] = useState('');
  const [otpCode, setOtpCode]         = useState('');
  const [resendCountdown, setResend]  = useState(0);

  // Shared
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  // Rate limiting
  const RL_KEY = `login:${email.trim().toLowerCase() || 'global'}`;
  const [lockState, setLockState] = useState(() => rateLimiter.check('login:global'));

  useEffect(() => { setLockState(rateLimiter.check(RL_KEY)); setError(null); }, [RL_KEY]);

  // Countdown timer for lockout
  useEffect(() => {
    if (!lockState.allowed && lockState.retryAfterMs > 0) {
      const iv = setInterval(() => {
        const next = rateLimiter.check(RL_KEY);
        setLockState(next);
        if (next.allowed) clearInterval(iv);
      }, 1000);
      return () => clearInterval(iv);
    }
  }, [lockState.allowed, RL_KEY]);

  // Resend countdown
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const iv = setInterval(() => setResend((r) => r - 1), 1000);
    return () => clearInterval(iv);
  }, [resendCountdown]);

  // ── Step 1: Credentials ──────────────────────────────────────────────────
  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    // Check deployment domain restriction (e.g. hr.invaestate.com -> only @invaestate.com)
    if (env.authPolicy?.allowedDomains && env.authPolicy.allowedDomains.length > 0) {
      const emailDomain = email.trim().toLowerCase().split('@')[1];
      if (!emailDomain || !env.authPolicy.allowedDomains.includes(emailDomain)) {
        setError(`Access restricted. Only @${env.authPolicy.allowedDomains.join(', @')} accounts are allowed on this portal.`);
        return;
      }
    }

    const check = rateLimiter.check(RL_KEY);
    if (!check.allowed) {
      setLockState(check);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await authService.login(email.trim().toLowerCase(), password);

      if (isPasswordChangeRequired(res)) {
        setPassword(''); setPasswordChangeToken(res.passwordChangeToken);
      } else if (isMfaRequired(res)) {
        setChallenge(res.challenge);
        setStep('mfa');
        if (res.challenge.method !== 'TOTP') setResend(60);
      } else {
        rateLimiter.recordSuccess(RL_KEY);
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err: any) {
      const updated = err?.status === 401 ? rateLimiter.recordFailure(RL_KEY) : rateLimiter.check(RL_KEY);
      setLockState(rateLimiter.check(RL_KEY));

      // Surface server-side 429
      if (err?.status === 429) {
        const retryAfter = err?.retryAfter ?? 60;
        rateLimiter.applyServerLockout(RL_KEY, retryAfter);
        setLockState(rateLimiter.check(RL_KEY));
        setError(`Too many attempts. Try again in ${rateLimiter.formatTime(retryAfter * 1000)}.`);
      } else {
        const remainingMsg = err?.status === 401 && updated.remaining > 0
          ? ` ${updated.remaining} attempt${updated.remaining !== 1 ? 's' : ''} remaining.`
          : '';
        setError((err.message || 'Invalid credentials.') + remainingMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: MFA ──────────────────────────────────────────────────────────
  const handleMfaSubmit = async () => {
    if ((!recoveryCode && otpCode.length !== 6) || !challenge) return;

    const check = rateLimiter.check(`otp:${email}`);
    if (!check.allowed) {
      setError(`Too many OTP attempts. Try again in ${check.retryAfterLabel}.`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await authService.verifyMfaOtp(recoveryCode.trim() || otpCode, challenge.sessionToken);
      rateLimiter.recordSuccess(RL_KEY);
      rateLimiter.recordSuccess(`otp:${email}`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      rateLimiter.recordFailure(`otp:${email}`);
      setLockState(rateLimiter.check(`otp:${email}`));
      setOtpCode('');
      setError(err.message || 'Invalid or expired code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!challenge || resendCountdown > 0) return;
    try {
      await authService.sendOtp(challenge.sessionToken, challenge.method);
      setResend(60);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to resend code.');
    }
  };

  const methodIcon: Record<string, string> = {
    TOTP: '🔑',
    SMS: '📱',
    EMAIL: '✉️',
    TELEGRAM: '🤖',
  };

  const methodLabel: Record<string, string> = {
    TOTP: 'Authenticator App',
    SMS: 'SMS',
    EMAIL: 'Email',
    TELEGRAM: 'Telegram',
  };

  const isLocked = !lockState.allowed;

  if (passwordChangeToken) return <RequiredPasswordChangeModal token={passwordChangeToken}
    onCancel={() => { setPasswordChangeToken(null); setPassword(''); }}
    onComplete={() => { setPasswordChangeToken(null); setPassword(''); setPasswordNotice('Password changed. Sign in with your new password.'); }} />;

  return (
    <ModalPortal onClose={onClose}>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto modal-backdrop-animate"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="modal-dialog-animate rounded-2xl w-full max-w-md p-6 bg-[#0e131f]/95 border border-slate-700/60 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] relative overflow-hidden backdrop-blur-xl my-8">
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />

          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-dark-border transition"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center space-x-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              {step === 'mfa' ? <Shield className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {step === 'credentials' ? 'Super-App Administrator' : 'Two-Factor Authentication'}
              </h3>
              <p className="text-xs text-slate-400">
                {step === 'credentials'
                  ? 'Sign in with your account credentials'
                  : challenge
                    ? `${methodIcon[challenge.method]} Verify via ${methodLabel[challenge.method]}${challenge.destination ? ` · ${challenge.destination}` : ''}`
                    : 'Enter your verification code'}
              </p>
            </div>
          </div>

          {/* Step indicator */}
          <div className="flex items-center space-x-2 mb-5">
            {['credentials', 'mfa'].map((s, i) => (
              <React.Fragment key={s}>
                <div className={`h-1 flex-1 rounded-full transition-colors ${
                  step === 'credentials' && i === 0 ? 'bg-indigo-500' :
                  step === 'mfa' ? 'bg-indigo-500' : 'bg-dark-border'
                }`} />
              </React.Fragment>
            ))}
          </div>

          {/* Error / lockout banner */}
          {isLocked && (
            <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center space-x-2">
              <Lock className="w-4 h-4 shrink-0 text-amber-400" />
              <span>
                Account temporarily locked. Try again in{' '}
                <span className="font-bold tabular-nums">{lockState.retryAfterLabel}</span>
              </span>
            </div>
          )}

          {passwordNotice && <p role="status" className="text-sm text-emerald-300 mb-4">{passwordNotice}</p>}
          {error && !isLocked && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* ── STEP 1: Credentials ────────────────────────────────────── */}
          {step === 'credentials' && (
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Admin Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    disabled={isLocked}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@inva.io"
                    className="w-full bg-dark-bg border border-dark-border rounded-xl pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    required
                    value={password}
                    disabled={isLocked}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full bg-dark-bg border border-dark-border rounded-xl pl-9 pr-10 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Attempt meter */}
              {lockState.remaining < 5 && lockState.allowed && (
                <div className="flex items-center space-x-2 text-[11px] text-amber-400">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{lockState.remaining} attempt{lockState.remaining !== 1 ? 's' : ''} remaining before lockout</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                {onForgotPassword && (
                  <button
                    type="button"
                    onClick={onForgotPassword}
                    className="text-[11px] text-slate-400 hover:text-indigo-400 transition"
                  >
                    Forgot password?
                  </button>
                )}
              </div>

              <div className="pt-3 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-dark-bg border border-dark-border text-slate-300 hover:text-white text-xs font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || isLocked}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition flex items-center space-x-1.5 disabled:opacity-60"
                >
                  {loading ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Verifying...</span></>
                  ) : (
                    <span>Sign In to Super-App</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ── STEP 2: MFA ────────────────────────────────────────────── */}
          {step === 'mfa' && challenge && (
            <div className="space-y-5">
              {challenge.method === 'TOTP' ? (
                <p className="text-xs text-slate-400 text-center">
                  Open your authenticator app and enter the 6-digit code for{' '}
                  <span className="text-white font-medium">INVA Super-App</span>.
                </p>
              ) : (
                <p className="text-xs text-slate-400 text-center">
                  A verification code has been sent to{' '}
                  <span className="text-white font-medium">{challenge.destination || 'your device'}</span>.
                  It expires in 10 minutes.
                </p>
              )}

              <OtpInput
                value={otpCode}
                onChange={setOtpCode}
                onComplete={handleMfaSubmit}
                disabled={loading}
              />

              <div>
                <label htmlFor="mfa-recovery-code" className="block text-xs text-slate-400 mb-2">Or use a saved recovery code</label>
                <input id="mfa-recovery-code" type="text" autoComplete="off" value={recoveryCode} onChange={event => setRecoveryCode(event.target.value)} disabled={loading} className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-2 text-white" />
              </div>
              {/* Resend (non-TOTP only) */}
              {challenge.method !== 'TOTP' && (
                <div className="text-center">
                  {resendCountdown > 0 ? (
                    <p className="text-xs text-slate-500 tabular-nums">
                      Resend in {resendCountdown}s
                    </p>
                  ) : (
                    <button
                      onClick={handleResendOtp}
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 mx-auto"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Resend code</span>
                    </button>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => { setStep('credentials'); setOtpCode(''); setError(null); }}
                  className="px-4 py-2 rounded-xl bg-dark-bg border border-dark-border text-slate-300 hover:text-white text-xs font-medium transition"
                >
                  ← Back
                </button>
                <button
                  onClick={handleMfaSubmit}
                  disabled={(!recoveryCode.trim() && otpCode.length !== 6) || loading}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition flex items-center space-x-1.5 disabled:opacity-60"
                >
                  {loading ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Verifying...</span></>
                  ) : (
                    <span>Verify Code</span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </ModalPortal>
  );
};

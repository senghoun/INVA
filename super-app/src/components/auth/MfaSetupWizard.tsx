import { QRCodeSVG } from 'qrcode.react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import React, { useState, useEffect, useRef } from 'react';
import {
  X, ShieldCheck, Smartphone, Mail, MessageSquare, Key,
  Copy, CheckCircle2, AlertCircle, Loader2, ChevronRight, RotateCcw,
} from 'lucide-react';
import { clearStoredTokens } from '../../services/api';
import { authService } from '../../services/auth.service';
import { ModalPortal } from '../common/ModalPortal';
import { TwoFactorMethod, MfaSetupResult } from '../../types';

interface MfaSetupWizardProps {
  onClose: () => void;
  onEnabled: () => void;
}

type WizardStep = 'choose' | 'configure' | 'verify' | 'backup' | 'done';

const METHOD_CONFIG: Record<TwoFactorMethod, {
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  requiresDestination: boolean;
  destinationLabel?: string;
  destinationPlaceholder?: string;
}> = {
  TOTP: {
    label: 'Authenticator App',
    description: 'Google Authenticator, Authy, 1Password, etc.',
    icon: <Key className="w-5 h-5" />,
    color: 'indigo',
    requiresDestination: false,
  },
  SMS: {
    label: 'SMS / Text Message',
    description: 'Receive a code via text to your phone',
    icon: <Smartphone className="w-5 h-5" />,
    color: 'emerald',
    requiresDestination: true,
    destinationLabel: 'Phone Number',
    destinationPlaceholder: '+1 (555) 000-0000',
  },
  EMAIL: {
    label: 'Email OTP',
    description: 'Receive a code to your registered email',
    icon: <Mail className="w-5 h-5" />,
    color: 'sky',
    requiresDestination: true,
    destinationLabel: 'Email Address',
    destinationPlaceholder: 'you@example.com',
  },
  TELEGRAM: {
    label: 'Telegram Bot',
    description: 'Receive codes via Telegram message',
    icon: <MessageSquare className="w-5 h-5" />,
    color: 'blue',
    requiresDestination: true,
    destinationLabel: 'Telegram Chat ID',
    destinationPlaceholder: 'Your numeric Telegram chat ID',
  },
};

const colorMap: Record<string, string> = {
  indigo: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
  emerald: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
  sky: 'bg-sky-500/10 border-sky-500/30 text-sky-400',
  blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
};

const borderAccent: Record<string, string> = {
  indigo: 'via-indigo-500',
  emerald: 'via-emerald-500',
  sky: 'via-sky-500',
  blue: 'via-blue-500',
};

// Simple 6-digit OTP input
const OtpInput: React.FC<{ value: string; onChange: (v: string) => void; onComplete: () => void; disabled?: boolean }> = ({
  value, onChange, onComplete, disabled,
}) => {
  const digits = value.split('').concat(Array(6).fill('')).slice(0, 6);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (i: number, val: string) => {
    const d = val.replace(/\D/g, '').slice(-1);
    const next = [...digits.map(x => x || '')];
    next[i] = d;
    const newVal = next.join('').slice(0, 6);
    onChange(newVal);
    if (d && i < 5) refs.current[i + 1]?.focus();
    if (newVal.length === 6) onComplete();
  };

  const handleKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted);
    if (pasted.length === 6) onComplete();
    refs.current[Math.min(pasted.length, 5)]?.focus();
  };

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {digits.map((d, i) => (
        <input key={i} ref={el => { refs.current[i] = el; }}
          type="text" inputMode="numeric" maxLength={1} value={d} disabled={disabled}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKey(i, e)}
          className={`w-10 h-12 text-center text-lg font-bold rounded-xl border bg-dark-bg text-white transition focus:outline-none
            ${d ? 'border-indigo-500 shadow-[0_0_0_2px_rgba(99,102,241,0.25)]' : 'border-dark-border'} disabled:opacity-50`}
        />
      ))}
    </div>
  );
};

export const MfaSetupWizard: React.FC<MfaSetupWizardProps> = ({ onClose: dismiss, onEnabled }) => {
  const [step, setStep]           = useState<WizardStep>('choose');
  const [method, setMethod]       = useState<TwoFactorMethod>('TOTP');
  const { register, watch, trigger, formState: { errors } } = useForm<{ password: string }>({ resolver: zodResolver(z.object({ password: z.string().min(1, 'Enter your current password.').max(256) })) });
  const password = watch('password', '');
  const [destination, setDest]    = useState('');
  const [setupResult, setSetup]   = useState<MfaSetupResult | null>(null);
  const [code, setCode]           = useState('');
  const [backupCodes, setBackup]  = useState<string[]>([]);
  const [copied, setCopied]       = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [resend, setResend]       = useState(0);

  const onClose = () => { if (step === 'backup' || step === 'done') clearStoredTokens(); dismiss(); };
  const cfg = METHOD_CONFIG[method];

  // Resend countdown
  useEffect(() => {
    if (resend <= 0) return;
    const iv = setInterval(() => setResend(r => r - 1), 1000);
    return () => clearInterval(iv);
  }, [resend]);

  const handleSetup = async () => {
    if (!await trigger()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await authService.setupMfa(method, password);
      setSetup(result);
      setStep('configure');
      if (method !== 'TOTP') setResend(60);
    } catch (err: any) {
      setError(err.message || 'Failed to initiate MFA setup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (code.length !== 6) return;
    setLoading(true);
    setError(null);
    try {
      const { backupCodes: codes } = await authService.confirmMfaSetup(code);
      setBackup(codes);
      setStep('backup');
    } catch (err: any) {
      setCode('');
      setError(err.message || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!setupResult || resend > 0) return;
    try {
      await authService.setupMfa(method, password);
      setResend(60);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to resend code.');
    }
  };

  const handleCopyBackup = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const steps: WizardStep[] = ['choose', 'configure', 'verify', 'backup'];
  const stepIndex = steps.indexOf(step);

  return (
    <ModalPortal onClose={onClose}>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto modal-backdrop-animate"
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="modal-dialog-animate rounded-2xl w-full max-w-lg p-6 bg-[#0e131f]/95 border border-slate-700/60 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] relative overflow-hidden backdrop-blur-xl my-8">
          <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent ${borderAccent[cfg.color]} to-transparent`} />

          <button onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-dark-border transition">
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center space-x-3 mb-4">
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${colorMap[cfg.color]}`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Setup Two-Factor Authentication</h3>
              <p className="text-xs text-slate-400">Add an extra layer of security to your account</p>
            </div>
          </div>

          {/* Step indicators */}
          {step !== 'done' && (
            <div className="flex items-center gap-1.5 mb-5">
              {steps.slice(0, 4).map((s, i) => (
                <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  i < stepIndex ? 'bg-indigo-500' :
                  i === stepIndex ? 'bg-indigo-400' : 'bg-dark-border'
                }`} />
              ))}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ── Step: Choose Method ─────────────────────────────────────── */}
          {step === 'choose' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">Choose how you want to receive verification codes:</p>
              <div className="space-y-2">
                {(['TOTP'] as TwoFactorMethod[]).map((m) => {
                  const c = METHOD_CONFIG[m];
                  const isSelected = method === m;
                  return (
                    <button
                      key={m}
                      onClick={() => setMethod(m)}
                      className={`w-full flex items-center space-x-4 p-3.5 rounded-xl border text-left transition ${
                        isSelected
                          ? `${colorMap[c.color]} border-opacity-60 bg-opacity-20`
                          : 'border-dark-border hover:border-slate-600 bg-dark-card/50'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${colorMap[c.color]}`}>
                        {c.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white">{c.label}</div>
                        <div className="text-xs text-slate-400">{c.description}</div>
                      </div>
                      {isSelected && <ChevronRight className="w-4 h-4 text-indigo-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              <div>
                <label htmlFor="mfa-current-password" className="block text-sm text-slate-300 mb-2">Current password</label>
                <input id="mfa-current-password" type="password" autoComplete="current-password" {...register('password')} aria-invalid={!!errors.password} aria-describedby={errors.password ? 'mfa-password-error' : undefined} className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-2 text-white" />
              </div>
              {errors.password && <p id="mfa-password-error" role="alert" className="text-sm text-rose-300">{errors.password.message}</p>}
              {/* Destination input for non-TOTP */}
              {cfg.requiresDestination && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    {cfg.destinationLabel}
                  </label>
                  <input
                    type="text"
                    value={destination}
                    onChange={e => setDest(e.target.value)}
                    placeholder={cfg.destinationPlaceholder}
                    className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={handleSetup}
                  disabled={loading || !password || (cfg.requiresDestination && !destination)}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition flex items-center space-x-1.5 disabled:opacity-60"
                >
                  {loading ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Setting up...</span></>
                  ) : (
                    <span>Continue →</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ── Step: Configure (TOTP QR / OTP sent) ──────────────────── */}
          {step === 'configure' && setupResult && (
            <div className="space-y-4">
              {method === 'TOTP' && setupResult.otpauthUri ? (
                <>
                  <p className="text-xs text-slate-400">
                    Scan this QR code with your authenticator app, or enter the secret key manually.
                  </p>
                  {/* Render locally: authenticator secrets never go to a QR service. */}
                  <div className="flex justify-center">
                    <div className="p-4 bg-white rounded-2xl">
                      <QRCodeSVG value={setupResult.otpauthUri} size={180} title="Scan to enroll your INVA authenticator" />
                    </div>
                  </div>
                  {setupResult.secret && (
                    <div>
                      <p className="text-[11px] text-slate-500 mb-1 text-center">Manual entry key:</p>
                      <div className="flex items-center space-x-2 bg-dark-bg border border-dark-border rounded-xl px-3 py-2">
                        <code className="flex-1 text-xs font-mono text-emerald-400 break-all tracking-widest">
                          {setupResult.secret.match(/.{1,4}/g)?.join(' ')}
                        </code>
                        <button
                          onClick={() => { navigator.clipboard.writeText(setupResult.secret!); }}
                          className="text-slate-500 hover:text-slate-300 shrink-0"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center space-y-2 py-2">
                  <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center border ${colorMap[cfg.color]}`}>
                    {cfg.icon}
                  </div>
                  <p className="text-sm font-semibold text-white">Code Sent!</p>
                  <p className="text-xs text-slate-400">
                    A verification code has been sent to{' '}
                    <span className="text-white">{destination}</span>.
                  </p>
                </div>
              )}

              <div className="flex justify-between">
                <button onClick={() => { setStep('choose'); setSetup(null); setCode(''); }}
                  className="px-4 py-2 rounded-xl bg-dark-bg border border-dark-border text-slate-300 hover:text-white text-xs font-medium transition">
                  ← Back
                </button>
                <button onClick={() => setStep('verify')}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition">
                  Enter Code →
                </button>
              </div>
            </div>
          )}

          {/* ── Step: Verify Code ──────────────────────────────────────── */}
          {step === 'verify' && (
            <div className="space-y-5">
              <p className="text-xs text-slate-400 text-center">
                {method === 'TOTP'
                  ? 'Enter the 6-digit code from your authenticator app to confirm setup.'
                  : `Enter the code sent to ${destination}.`}
              </p>

              <OtpInput value={code} onChange={setCode} onComplete={handleVerify} disabled={loading} />

              {method !== 'TOTP' && (
                <div className="text-center">
                  {resend > 0 ? (
                    <p className="text-xs text-slate-500 tabular-nums">Resend in {resend}s</p>
                  ) : (
                    <button onClick={handleResend}
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 mx-auto">
                      <RotateCcw className="w-3 h-3" />
                      <span>Resend code</span>
                    </button>
                  )}
                </div>
              )}

              <div className="flex justify-between">
                <button onClick={() => { setStep('configure'); setCode(''); }}
                  className="px-4 py-2 rounded-xl bg-dark-bg border border-dark-border text-slate-300 hover:text-white text-xs font-medium transition">
                  ← Back
                </button>
                <button
                  onClick={handleVerify}
                  disabled={code.length !== 6 || loading}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition flex items-center space-x-1.5 disabled:opacity-60"
                >
                  {loading ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Verifying...</span></>
                  ) : (
                    <span>Verify & Enable</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ── Step: Backup Codes ─────────────────────────────────────── */}
          {step === 'backup' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                <strong>⚠️ Save these backup codes now.</strong> They are shown only once and can be used to access your account if you lose your device.
              </div>

              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((code, i) => (
                  <div key={i} className="bg-dark-bg border border-dark-border rounded-lg px-3 py-2 font-mono text-sm text-emerald-400 text-center tracking-widest">
                    {code}
                  </div>
                ))}
              </div>

              <button
                onClick={handleCopyBackup}
                className={`w-full flex items-center justify-center space-x-2 py-2 rounded-xl border text-xs font-medium transition ${
                  copied
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                    : 'border-dark-border bg-dark-card text-slate-300 hover:text-white'
                }`}
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied to clipboard!' : 'Copy all backup codes'}</span>
              </button>

              <div className="flex justify-end">
                <button
                  onClick={() => { setStep('done'); onEnabled(); }}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30 transition"
                >
                  I've saved my codes — Finish
                </button>
              </div>
            </div>
          )}

          {/* ── Step: Done ─────────────────────────────────────────────── */}
          {step === 'done' && (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-white">2FA Enabled! 🎉</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Two-factor authentication via <strong className="text-white">{cfg.label}</strong> is now active on your account.
                You'll be prompted for a code on your next sign-in.
              </p>
              <button onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30 transition">
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </ModalPortal>
  );
};

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '../../services/auth.service';
import { request, clearStoredTokens } from '../../services/api';
import { ModalPortal } from '../common/ModalPortal';
import { MfaSetupWizard } from './MfaSetupWizard';

interface Session { id: string; current: boolean; createdAt: string; expiresAt: string }

export function AccountSecurityPanel() {
  const [enrolling, setEnrolling] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const user = authService.getCurrentUser();
  const cache = useQueryClient();
  const key = ['account', user?.id, 'sessions'];
  const sessions = useQuery({ queryKey: key, queryFn: () => request<Session[]>('/api/v1/auth/sessions'), enabled: !!user });
  const revoke = useMutation({
    mutationFn: async (session: Session) => {
      await request(`/api/v1/auth/sessions/${session.id}`, { method: 'DELETE' });
      if (session.current) clearStoredTokens();
    },
    onSuccess: () => { setError(''); void cache.invalidateQueries({ queryKey: key }); },
    onError: (failure: Error) => setError(failure.message),
  });
  const revokeAll = useMutation({
    mutationFn: () => request('/api/v1/auth/sessions/revoke-all', { method: 'POST' }),
    onSuccess: () => clearStoredTokens(),
    onError: (failure: Error) => setError(failure.message),
  });
  const disable = useMutation({
    mutationFn: () => authService.disableMfa(password, code.trim()),
    onSuccess: () => { setPassword(''); setCode(''); setRemoving(false); clearStoredTokens(); },
    onError: (failure: Error) => setError(failure.message),
  });
  if (!user) return null;
  return <section className="glass-panel rounded-2xl p-5 space-y-4" aria-label="My account security">
    <h2 className="text-lg font-semibold text-white">My account security</h2>
    <div className="flex flex-wrap items-center gap-4">
      <p className="text-sm text-slate-300">Authenticator MFA: {user.mfaEnabled ? 'Enabled' : 'Not enabled'}</p>
      {user.mfaEnabled && <button onClick={() => { setError(''); setRemoving(true); }} className="text-sm text-rose-300">Remove authenticator</button>}
      {!user.mfaEnabled && <button onClick={() => setEnrolling(true)} className="rounded-xl px-4 py-2 bg-indigo-600 text-white text-sm">Set up authenticator</button>}
    </div>
    <h3 className="font-medium text-white">Active sessions</h3>
    {sessions.isPending && <p role="status" className="text-slate-400">Loading sessions…</p>}
    {sessions.error && <p role="alert" className="text-rose-300">{sessions.error.message} <button className="underline" onClick={() => void sessions.refetch()}>Retry</button></p>}
    {error && <p role="alert" className="text-rose-300">{error}</p>}
    <ul className="space-y-2">{sessions.data?.map(session => <li key={session.id} className="flex flex-wrap justify-between gap-3 border border-dark-border rounded-xl p-3 text-sm text-slate-300">
      <span>{session.current ? 'This session' : 'Other session'} · Signed in {new Date(session.createdAt).toLocaleString()} · Expires {new Date(session.expiresAt).toLocaleString()}</span>
      <button disabled={revoke.isPending || revokeAll.isPending} onClick={() => revoke.mutate(session)} className="text-rose-300 disabled:opacity-50">Revoke{session.current ? ' and sign out' : ''}</button>
    </li>)}</ul>
    {!sessions.isPending && !sessions.error && sessions.data?.length === 0 && <p className="text-slate-400">No active sessions.</p>}
    <button disabled={revoke.isPending || revokeAll.isPending} onClick={() => revokeAll.mutate()} className="text-sm text-rose-300 disabled:opacity-50">Sign out all sessions</button>
    {removing && <ModalPortal onClose={() => { if (!disable.isPending) { setRemoving(false); setPassword(''); setCode(''); } }}>
      <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4">
        <form aria-label="Remove authenticator" className="bg-dark-card border border-dark-border rounded-2xl p-6 w-full max-w-md space-y-4" onSubmit={event => { event.preventDefault(); disable.mutate(); }}>
          <h3 className="text-lg font-semibold text-white">Remove authenticator</h3>
          <p className="text-sm text-slate-400">Enter your current password and a fresh authenticator or saved recovery code. This ends all sessions. Sign in again to enroll a replacement.</p>
          <label className="block text-sm text-slate-300">Current password<input type="password" autoComplete="current-password" required maxLength={256} value={password} onChange={event => setPassword(event.target.value)} className="block w-full bg-dark-bg rounded-xl p-2 mt-2" /></label>
          <label className="block text-sm text-slate-300">Authenticator or recovery code<input type="text" autoComplete="one-time-code" required maxLength={64} value={code} onChange={event => setCode(event.target.value)} className="block w-full bg-dark-bg rounded-xl p-2 mt-2" /></label>
          {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
          <div className="flex justify-end gap-4"><button type="button" disabled={disable.isPending} onClick={() => { setRemoving(false); setPassword(''); setCode(''); }}>Cancel</button><button type="submit" disabled={disable.isPending} className="text-rose-300">Remove and sign out</button></div>
        </form>
      </div>
    </ModalPortal>}
    {enrolling && <MfaSetupWizard onClose={() => { setEnrolling(false); }} onEnabled={() => { setEnrolling(false); clearStoredTokens(); }} />}
  </section>;
}

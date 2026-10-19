import React, { useState } from 'react';
import { Modal, Button, Input, Label } from '../common';
import { authService } from '../../services/auth.service';

export const RequiredPasswordChangeModal: React.FC<{ token: string; onCancel: () => void; onComplete: () => void }> = ({ token, onCancel, onComplete }) => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (pending) return;
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setPending(true); setError('');
    try {
      await authService.completeTemporaryPassword(token, password);
      setPassword(''); setConfirm(''); onComplete();
    } catch (err: any) { setError(err.message || 'Unable to change password.'); }
    finally { setPending(false); }
  };
  return <Modal isOpen title="Choose your own password" onClose={() => { if (!pending) onCancel(); }}>
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm text-slate-400">Your administrator reset your password. Choose a different password to access the app. You will then sign in with your new password.</p>
      {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
      <fieldset disabled={pending} className="space-y-4">
        <div><Label htmlFor="required-new-password" required>New password</Label><Input id="required-new-password" autoFocus type="password" autoComplete="new-password" required minLength={8} maxLength={72} value={password} onChange={e => setPassword(e.target.value)} /></div>
        <div><Label htmlFor="required-confirm-password" required>Confirm password</Label><Input id="required-confirm-password" type="password" autoComplete="new-password" required minLength={8} maxLength={72} value={confirm} onChange={e => setConfirm(e.target.value)} /></div>
      </fieldset>
      <div className="flex justify-end gap-3"><Button type="button" variant="secondary" disabled={pending} onClick={onCancel}>Back to sign in</Button><Button type="submit" isLoading={pending}>Save my password</Button></div>
    </form>
  </Modal>;
};

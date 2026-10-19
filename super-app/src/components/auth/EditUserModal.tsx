import React, { useState } from 'react';
import { User, UserType } from '../../types';
import { authService, UpdateUserData } from '../../services/auth.service';
import { Modal, Button, Input, Label, DatalistSelect } from '../common';

interface Props {
  user: User;
  mode: 'edit' | 'password';
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export const EditUserModal: React.FC<Props> = ({ user, mode, onClose, onSuccess }) => {
  const [email, setEmail] = useState(user.email);
  const [userType, setUserType] = useState<UserType>(user.userType);
  const [isActive, setIsActive] = useState(user.isActive);
  const [generated, setGenerated] = useState<{ temporaryPassword: string; expiresAt: string } | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const self = user.id === authService.getCurrentUser()?.id;
  const reset = mode === 'password';
  const close = () => { if (!pending) onClose(); };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (pending || generated) return;
    setPending(true); setError('');
    try {
      if (reset) {
        setGenerated(await authService.resetUserPassword(user.id));
        onSuccess(`Temporary password generated for ${user.email}. Existing sessions revoked.`);
      } else {
        const data: UpdateUserData = {};
        const normalizedEmail = email.trim().toLowerCase();
        if (normalizedEmail !== user.email) data.email = normalizedEmail;
        if (userType !== user.userType) data.userType = userType;
        if (isActive !== user.isActive) data.isActive = isActive;
        if (Object.keys(data).length) {
          await authService.updateUser(user.id, data);
          onSuccess(`Account updated for ${normalizedEmail}.`);
        }
        onClose();
        if (self && data.email) await authService.logout();
      }
    } catch (err: any) { setError(err.message || 'Unable to update this account.'); }
    finally { setPending(false); }
  };
  return <Modal isOpen onClose={close} title={reset ? 'Reset user password' : 'Edit user'}>
    <p className="text-sm text-slate-400 break-all mb-4">{user.email}</p>
    {generated ? <div className="space-y-4">
      <p role="status" className="text-sm text-emerald-300">Temporary password generated. Copy it now; it cannot be viewed again after closing.</p>
      <Label htmlFor="temporary-password">Temporary password</Label>
      <Input id="temporary-password" readOnly value={generated.temporaryPassword} autoComplete="off" onFocus={event => event.target.select()} />
      <p className="text-sm text-slate-400">Expires {new Date(generated.expiresAt).toLocaleString()}. Share it securely with the user. They must choose their own password before accessing the app.</p>
      <Button type="button" onClick={close}>Done</Button>
    </div> : <form onSubmit={submit} className="space-y-4">
      {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
      <fieldset disabled={pending} className="space-y-4 disabled:opacity-60">
        {reset ? <p className="text-sm text-amber-200">Auth will generate a unique temporary password valid for 24 hours and sign this user out of existing sessions. They must change it at their next login. No email is sent.</p> : <>
          <div><Label htmlFor="edit-user-email" required>Email</Label><Input id="edit-user-email" autoFocus required type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
          <div><Label>Account type</Label>{self ? <p className="text-sm text-slate-300">Internal (staff)</p> : <DatalistSelect value={userType} options={[{ id: 'INTERNAL', label: 'Internal (staff)' }, { id: 'EXTERNAL', label: 'External (client)' }]} onChange={value => { if (value === 'INTERNAL' || value === 'EXTERNAL') setUserType(value); }} />}</div>
          <Label className="flex items-center gap-2"><input type="checkbox" disabled={self} checked={isActive} onChange={e => setIsActive(e.target.checked)} />Account active</Label>
          <p className="text-xs text-slate-400">Changing email or account type, or suspending the account, revokes existing sessions.{self && ' You cannot suspend or demote your own account.'}</p>
        </>}
      </fieldset>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" disabled={pending} onClick={close}>Cancel</Button>
        <Button type="submit" isLoading={pending}>{reset ? 'Generate temporary password' : 'Save changes'}</Button>
      </div>
    </form>}
  </Modal>;
};

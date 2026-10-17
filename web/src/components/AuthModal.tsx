'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, RoleType, INSTITUTIONAL_ACCOUNTS } from '@/context/AuthContext';

// @reskinned: presentation rebuilt on the shared UI kit; logic above this line is unchanged.
import { Modal, Notice, Chip } from '@/components/ui';

const ROLE_PORTAL_ROUTES: Record<RoleType, string> = {
  OWNER: '/portals/owner',
  EXAMINER: '/portals/examiner',
  UNDERWRITER: '/portals/underwriter',
  ADJUDICATOR: '/portals/adjudicator',
  AGENT: '/submit',
  WALLET: '/portals/owner',
};

export function AuthModal() {
  const router = useRouter();
  const { authModalOpen, setAuthModalOpen, targetRoleForModal, verifyPasswordAndSwitch } = useAuth();
  
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authenticating, setAuthenticating] = useState(false);

  useEffect(() => {
    if (authModalOpen) {
      setPassword('');
      setError(null);
    }
  }, [authModalOpen]);

  if (!authModalOpen || !targetRoleForModal || targetRoleForModal === 'WALLET') {
    return null;
  }

  const targetAccount = INSTITUTIONAL_ACCOUNTS[targetRoleForModal];

  const handleQuickFill = () => {
    setPassword(targetAccount.password);
    setError(null);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Password is required.');
      return;
    }

    try {
      setAuthenticating(true);
      setError(null);
      const res = await verifyPasswordAndSwitch(targetRoleForModal, password);
      if (!res.success) {
        setError(res.error || 'Authentication failed. Incorrect password.');
        return;
      }

      setAuthModalOpen(false);
      const targetRoute = ROLE_PORTAL_ROUTES[targetRoleForModal];
      if (targetRoute) {
        router.push(targetRoute);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error.');
    } finally {
      setAuthenticating(false);
    }
  };

  return (
    <Modal open onClose={() => setAuthModalOpen(false)} title={`Authenticate as ${targetAccount.name}`}>
      <p className="muted">
        {targetAccount.title} · {targetAccount.department}
      </p>
      <dl className="idlist">
        <div>
          <dt>Institutional ID</dt>
          <dd>{targetAccount.email}</dd>
        </div>
        <div>
          <dt>Role</dt>
          <dd>
            <Chip tone="moved">{targetAccount.badge}</Chip>
          </dd>
        </div>
        <div>
          <dt>Public key</dt>
          <dd>
            <code>
              {targetAccount.address.slice(0, 10)}...{targetAccount.address.slice(-6)}
            </code>
          </dd>
        </div>
      </dl>

      <form onSubmit={handleVerify} className="form">
        <div className="field">
          <div className="field__line">
            <label htmlFor="am-pass">Password</label>
            <button type="button" className="linkish" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          <input
            id="am-pass"
            className="input"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(null);
            }}
            placeholder="Enter password"
            autoComplete="current-password"
          />
          <button type="button" className="linkish linkish--left" onClick={handleQuickFill} title="Fill in the demo password for this persona">
            Use the demo credentials
          </button>
        </div>
        {error && <Notice tone="bad">{error}</Notice>}
        <div className="modal__actions">
          <button type="button" className="btn btn--ghost" onClick={() => setAuthModalOpen(false)}>
            Cancel
          </button>
          <button type="submit" className="btn btn--lime" disabled={authenticating}>
            {authenticating ? 'Verifying…' : 'Authenticate and enter'}
          </button>
        </div>
      </form>
    </Modal>
  );

}

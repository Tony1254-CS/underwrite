'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth, RoleType, INSTITUTIONAL_ACCOUNTS } from '@/context/AuthContext';

// @reskinned: presentation rebuilt on the shared UI kit; logic above this line is unchanged.
import { Notice } from '@/components/ui';
import { Icon } from '@/components/ui/icons';

interface PortalGuardProps {
  requiredRole: RoleType;
  portalName: string;
  children: React.ReactNode;
}

export function PortalGuard({ requiredRole, portalName, children }: PortalGuardProps) {
  const { user, isAuthenticated, verifyPasswordAndSwitch } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);

  // If user has the matching role and is authenticated, show portal content
  if (isAuthenticated && (user.role === requiredRole || (requiredRole === 'OWNER' && user.role === 'WALLET'))) {
    return <>{children}</>;
  }

  const targetAcc = INSTITUTIONAL_ACCOUNTS[requiredRole as keyof typeof INSTITUTIONAL_ACCOUNTS] || INSTITUTIONAL_ACCOUNTS.OWNER;

  const handleQuickFill = () => {
    setPassword(targetAcc.password);
    setError(null);
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Please provide the role password.');
      return;
    }

    try {
      setUnlocking(true);
      setError(null);
      const res = await verifyPasswordAndSwitch(requiredRole, password);
      if (!res.success) {
        setError(res.error || 'Authentication rejected. Incorrect credentials.');
        return;
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error.');
    } finally {
      setUnlocking(false);
    }
  };

  return (
    <div className="guard">
      <div className="guard__card">
        <span className="guard__icon" aria-hidden="true">
          <Icon name="shield" size={28} />
        </span>
        <p className="eyebrow">Restricted desk</p>
        <h1 className="h1 h1--md">{portalName}</h1>
        <p className="lede">
          This desk belongs to <strong>{targetAcc.name}</strong> ({targetAcc.title}). You are signed in as <strong>{user.name}</strong>.
        </p>

        <form onSubmit={handleUnlock} className="form">
          <div className="field">
            <label htmlFor="pg-pass">Password for {targetAcc.badge}</label>
            <input
              id="pg-pass"
              className="input"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              placeholder="Enter the role password"
              autoComplete="current-password"
            />
            <button type="button" className="linkish linkish--left" onClick={handleQuickFill}>
              Use the demo credentials
            </button>
          </div>
          {error && <Notice tone="bad">{error}</Notice>}
          <button type="submit" className="btn btn--lime" disabled={unlocking}>
            {unlocking ? 'Verifying…' : `Authenticate as ${targetAcc.name}`}
          </button>
        </form>

        <p className="guard__links">
          <Link href="/auth/login" className="text-link">Sign-in page</Link>
          <span aria-hidden="true"> · </span>
          <Link href="/auth/register" className="text-link">Create a demo profile</Link>
          <span aria-hidden="true"> · </span>
          <Link href="/dashboard" className="text-link">Back to the overview</Link>
        </p>
        <p className="fineprint">Demo personas use published throwaway keys. This is not production authentication.</p>
      </div>
    </div>
  );

}

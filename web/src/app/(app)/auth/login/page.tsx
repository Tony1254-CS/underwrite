'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, INSTITUTIONAL_ACCOUNTS, RoleType } from '@/context/AuthContext';

// @reskinned: presentation rebuilt on the shared UI kit; logic above this line is unchanged.
import { Notice, Chip } from '@/components/ui';

const ROLE_PORTAL_ROUTES: Record<RoleType, string> = {
  OWNER: '/portals/owner',
  EXAMINER: '/portals/examiner',
  UNDERWRITER: '/portals/underwriter',
  ADJUDICATOR: '/portals/adjudicator',
  AGENT: '/submit',
  WALLET: '/portals/owner',
};

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('cfo@underwrite.fi');
  const [password, setPassword] = useState('OwnerPassword2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both corporate email and password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await login(email, password);
      if (!res.success) {
        setError(res.error || 'Authentication rejected.');
        return;
      }

      // Check which role was authenticated and navigate to their portal
      const targetRole = Object.values(INSTITUTIONAL_ACCOUNTS).find(
        (a) => a.email.toLowerCase() === email.trim().toLowerCase()
      )?.role || 'OWNER';

      router.push(ROLE_PORTAL_ROUTES[targetRole] || '/');
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPreset = (key: keyof typeof INSTITUTIONAL_ACCOUNTS) => {
    const acc = INSTITUTIONAL_ACCOUNTS[key];
    setEmail(acc.email);
    setPassword(acc.password);
    setError(null);
  };

  return (
    <div className="authpage">
      <div className="authpage__intro">
        <p className="eyebrow">Demo workspace</p>
        <h1 className="h1">Sign in</h1>
        <p className="lede">Pick a persona to fill its credentials, or type your own. Each desk belongs to one key holder.</p>
        <ul className="personas">
          {(Object.keys(INSTITUTIONAL_ACCOUNTS) as (keyof typeof INSTITUTIONAL_ACCOUNTS)[])
            .filter((k) => k !== 'AGENT')
            .map((k) => {
              const acc = INSTITUTIONAL_ACCOUNTS[k];
              const isSelected = email.toLowerCase() === acc.email.toLowerCase();
              return (
                <li key={k}>
                  <button type="button" className={`persona${isSelected ? ' is-on' : ''}`} aria-pressed={isSelected} onClick={() => handleSelectPreset(k)}>
                    <strong>{acc.name}</strong>
                    <small>{acc.title}</small>
                    <Chip>{acc.badge}</Chip>
                  </button>
                </li>
              );
            })}
        </ul>
        <p className="fineprint">Demo personas use published throwaway keys. Signing in here is not production authentication.</p>
      </div>

      <div className="authpage__card">
        <form onSubmit={handleSubmit} className="form">
          <div className="field">
            <label htmlFor="lg-email">Email</label>
            <input id="lg-email" className="input" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(null); }} required placeholder="name@company.com" autoComplete="username" />
          </div>
          <div className="field">
            <div className="field__line">
              <label htmlFor="lg-pass">Password</label>
              <button type="button" className="linkish" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <input id="lg-pass" className="input" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => { setPassword(e.target.value); setError(null); }} required placeholder="Enter password" autoComplete="current-password" />
          </div>
          {error && <Notice tone="bad">{error}</Notice>}
          <button type="submit" className="btn btn--lime" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in to the portal'}
          </button>
        </form>
        <p className="authpage__foot">
          No account?{' '}
          <Link href="/auth/register" className="text-link">Create a demo profile</Link>
          <span aria-hidden="true"> · </span>
          <Link href="/" className="text-link">Public home page</Link>
        </p>
      </div>
    </div>
  );

}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, RoleType } from '@/context/AuthContext';

// @reskinned: presentation rebuilt on the shared UI kit; logic above this line is unchanged.
import { Notice } from '@/components/ui';

const ROLE_PORTAL_ROUTES: Record<RoleType, string> = {
  OWNER: '/portals/owner',
  EXAMINER: '/portals/examiner',
  UNDERWRITER: '/portals/underwriter',
  ADJUDICATOR: '/portals/adjudicator',
  AGENT: '/submit',
  WALLET: '/portals/owner',
};

export default function RegisterPage() {
  const router = useRouter();
  const { registerAccount } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState<RoleType>('OWNER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await registerAccount({
        name,
        email,
        password,
        role,
        department,
      });

      if (!res.success) {
        setError(res.error || 'Registration failed.');
        return;
      }

      const targetRoute = ROLE_PORTAL_ROUTES[role as Exclude<RoleType, 'WALLET'>] || '/';
      router.push(targetRoute);
    } catch (err: any) {
      setError(err.message || 'Registration error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="authpage">
      <div className="authpage__intro">
        <p className="eyebrow">Demo workspace</p>
        <h1 className="h1">Create a profile</h1>
        <p className="lede">Choose a role and a password. The profile is stored in this browser only.</p>
        <p className="fineprint">Demo profiles are local to this browser. This is not production onboarding.</p>
      </div>

      <div className="authpage__card">
        <form onSubmit={handleSubmit} className="form">
          <div className="field">
            <label htmlFor="rg-name">Name *</label>
            <input id="rg-name" className="input" type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Alex Mercer" autoComplete="name" />
          </div>
          <div className="field">
            <label htmlFor="rg-email">Email *</label>
            <input id="rg-email" className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="alex.mercer@company.com" autoComplete="email" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="field">
              <label htmlFor="rg-role">Role *</label>
              <select id="rg-role" className="input" value={role} onChange={(e) => setRole(e.target.value as RoleType)}>
                <option value="OWNER">Vault owner / CFO</option>
                <option value="EXAMINER">Safety examiner / auditor</option>
                <option value="UNDERWRITER">Underwriter / bond LP</option>
                <option value="ADJUDICATOR">Claims adjudicator</option>
                <option value="AGENT">Invoice submitter / supplier</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="rg-dept">Department or organisation</label>
              <input id="rg-dept" className="input" type="text" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Treasury" />
            </div>
          </div>
          <div className="field">
            <label htmlFor="rg-pass">Password *</label>
            <input id="rg-pass" className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Choose a password" autoComplete="new-password" />
          </div>
          {error && <Notice tone="bad">{error}</Notice>}
          <button type="submit" className="btn btn--lime" disabled={loading}>
            {loading ? 'Creating the profile…' : 'Create profile and sign in'}
          </button>
        </form>
        <p className="authpage__foot">
          Already have one? <Link href="/auth/login" className="text-link">Sign in</Link>
          <span aria-hidden="true"> · </span>
          <Link href="/" className="text-link">Public home page</Link>
        </p>
      </div>
    </div>
  );

}

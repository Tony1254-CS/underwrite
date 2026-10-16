'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, RoleType } from '@/context/AuthContext';

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
    <div className="min-h-[85vh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[11px] font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.2)]">
          ENTERPRISE ONBOARDING
        </div>
        <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
          Create Corporate Profile
        </h2>
        <p className="text-sm text-slate-300">
          Provision an authorized institutional credential for your enterprise organization.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="rounded-3xl bg-[#060b1c]/90 border border-white/[0.15] backdrop-blur-3xl p-8 md:p-10 shadow-[0_25px_80px_rgba(0,0,0,0.85)] space-y-8 relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            <div>
              <label className="block text-xs font-mono font-semibold text-slate-300 mb-1.5">
                Full Legal Name / Operator Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Alex Mercer"
                className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/[0.15] focus:border-emerald-400 text-white font-mono text-sm placeholder:text-slate-600 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold text-slate-300 mb-1.5">
                Corporate Email Address *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="alex.mercer@enterprise.com"
                className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/[0.15] focus:border-emerald-400 text-white font-mono text-sm placeholder:text-slate-600 focus:outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono font-semibold text-slate-300 mb-1.5">
                  Assigned Operational Role *
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as RoleType)}
                  className="w-full px-4 py-3 rounded-xl bg-black/80 border border-white/[0.15] focus:border-emerald-400 text-white font-mono text-sm focus:outline-none transition-all"
                >
                  <option value="OWNER">Vault Owner / CFO</option>
                  <option value="EXAMINER">Safety Examiner / Auditor</option>
                  <option value="UNDERWRITER">Underwriter / Bond LP</option>
                  <option value="ADJUDICATOR">Claims Adjudicator</option>
                  <option value="AGENT">Invoice Submitter / Agent</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-slate-300 mb-1.5">
                  Department / Org
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Global Treasury"
                  className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/[0.15] focus:border-emerald-400 text-white font-mono text-sm placeholder:text-slate-600 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold text-slate-300 mb-1.5">
                Corporate Password *
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Choose a secure password"
                className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/[0.15] focus:border-emerald-400 text-white font-mono text-sm placeholder:text-slate-600 focus:outline-none transition-all"
              />
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 font-mono text-xs flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 hover:brightness-110 text-white font-mono text-xs font-black tracking-wider uppercase transition-all shadow-[0_0_25px_rgba(16,185,129,0.4)] active:scale-95 flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Creating Profile...' : 'Complete Registration & Sign In'}</span>
              <span>→</span>
            </button>
          </form>

          <div className="flex items-center justify-between pt-4 border-t border-white/[0.08] text-xs font-mono text-slate-400 relative z-10">
            <div>
              Already have an account?{' '}
              <Link href="/auth/login" className="text-emerald-400 hover:text-emerald-300 underline font-semibold">
                Sign In
              </Link>
            </div>
            <Link href="/" className="hover:text-white transition-colors">
              Return to Public HUD →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

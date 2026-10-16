'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, INSTITUTIONAL_ACCOUNTS, RoleType } from '@/context/AuthContext';

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
    <div className="min-h-[85vh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-[11px] font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(6,182,212,0.2)]">
          UNDERWRITE · Single Sign-On
        </div>
        <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
          Institutional Access Desk
        </h2>
        <p className="text-sm text-slate-300">
          Sign in to your authorized risk, underwriting, or governance portal.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="rounded-3xl bg-[#060b1c]/90 border border-white/[0.15] backdrop-blur-3xl p-8 md:p-10 shadow-[0_25px_80px_rgba(0,0,0,0.85)] space-y-8 relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Quick Institutional Role Fillers */}
          <div className="space-y-3 relative z-10">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-b border-white/[0.08] pb-2">
              <span className="font-bold uppercase tracking-wider">Fast Institutional Switch</span>
              <span className="text-[10px] text-cyan-400">Click to autofill credentials</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(Object.keys(INSTITUTIONAL_ACCOUNTS) as (keyof typeof INSTITUTIONAL_ACCOUNTS)[]).filter(k => k !== 'AGENT').map((k) => {
                const acc = INSTITUTIONAL_ACCOUNTS[k];
                const isSelected = email.toLowerCase() === acc.email.toLowerCase();
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => handleSelectPreset(k)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-cyan-500/20 border-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                        : 'bg-black/40 border-white/[0.08] hover:border-white/[0.2] hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="text-[11px] font-bold text-white truncate">{acc.name.split(' ')[0]}</div>
                    <div className="text-[9px] font-mono text-slate-400 truncate">{acc.badge}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            <div>
              <label className="block text-xs font-mono font-semibold text-slate-300 mb-1.5">
                Corporate Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                required
                placeholder="name@company.com"
                className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/[0.15] focus:border-cyan-400 text-white font-mono text-sm placeholder:text-slate-600 focus:outline-none transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-mono font-semibold text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] font-mono text-slate-400 hover:text-white"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                required
                placeholder="Enter password"
                className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/[0.15] focus:border-cyan-400 text-white font-mono text-sm placeholder:text-slate-600 focus:outline-none transition-all"
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
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:brightness-110 text-white font-mono text-xs font-black tracking-wider uppercase transition-all shadow-[0_0_25px_rgba(6,182,212,0.4)] active:scale-95 flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
              <span>→</span>
            </button>
          </form>

          {/* Registration & Web3 Links */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/[0.08] text-xs font-mono text-slate-400 relative z-10">
            <div>
              Don't have an account?{' '}
              <Link href="/auth/register" className="text-cyan-400 hover:text-cyan-300 underline font-semibold">
                Register Profile
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

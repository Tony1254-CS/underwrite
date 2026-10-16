'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth, RoleType, INSTITUTIONAL_ACCOUNTS } from '@/context/AuthContext';

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
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-xl rounded-3xl bg-[#060b1c]/90 border border-white/[0.15] backdrop-blur-3xl p-8 md:p-10 shadow-[0_25px_80px_rgba(0,0,0,0.8)] space-y-8 relative overflow-hidden text-center">
        {/* Ambient Halo */}
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-[100px] pointer-events-none opacity-40 ${
          requiredRole === 'OWNER' ? 'bg-emerald-500' :
          requiredRole === 'EXAMINER' ? 'bg-indigo-500' :
          requiredRole === 'UNDERWRITER' ? 'bg-cyan-500' :
          requiredRole === 'ADJUDICATOR' ? 'bg-amber-500' :
          'bg-rose-500'
        }`} />

        {/* Security Shield Icon */}
        <div className="relative mx-auto w-20 h-20 rounded-3xl bg-black/60 border border-white/[0.15] flex items-center justify-center shadow-inner">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.05] flex items-center justify-center text-3xl">
            🔒
          </div>
          <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-rose-500 border-2 border-black flex items-center justify-center text-[10px] font-black text-white">
            !
          </span>
        </div>

        {/* Title & Description */}
        <div className="space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 font-mono text-[11px] font-bold uppercase tracking-wider">
            Access Restricted · Role Authorization Required
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
            {portalName}
          </h2>
          <p className="text-slate-300 text-sm max-w-md mx-auto leading-relaxed">
            This operational desk is restricted to verified <span className="text-white font-bold">{targetAcc.name}</span> ({targetAcc.title}). You are currently identified as <span className="text-cyan-400 font-mono font-semibold">{user.name}</span>.
          </p>
        </div>

        {/* Inline Authentication Form */}
        <div className="p-6 rounded-2xl bg-black/50 border border-white/[0.1] text-left space-y-5 relative z-10">
          <div className="flex items-center justify-between text-xs font-mono border-b border-white/[0.08] pb-3">
            <span className="text-slate-400">Target Role:</span>
            <span className="text-emerald-400 font-bold">{targetAcc.badge} ({targetAcc.email})</span>
          </div>

          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-mono font-semibold text-slate-300">
                  Enter Password to Unlock:
                </label>
                <button
                  type="button"
                  onClick={handleQuickFill}
                  className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 underline font-semibold flex items-center gap-1"
                >
                  <span>⚡ Quick Fill:</span>
                  <code className="text-slate-300 font-normal no-underline bg-white/[0.08] px-1.5 py-0.5 rounded">
                    {targetAcc.password}
                  </code>
                </button>
              </div>

              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                placeholder="Enter role password..."
                className="w-full px-4 py-3 rounded-xl bg-black/70 border border-white/[0.15] focus:border-cyan-400 text-white font-mono text-sm placeholder:text-slate-600 focus:outline-none transition-all"
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 font-mono text-xs flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={unlocking}
              className={`w-full py-3.5 px-4 rounded-xl text-white font-mono text-xs font-black transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 ${
                requiredRole === 'OWNER' ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 shadow-emerald-500/25' :
                requiredRole === 'EXAMINER' ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:brightness-110 shadow-indigo-500/25' :
                requiredRole === 'UNDERWRITER' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 shadow-cyan-500/25' :
                requiredRole === 'ADJUDICATOR' ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:brightness-110 shadow-amber-500/25' :
                'bg-gradient-to-r from-rose-500 to-pink-600 hover:brightness-110 shadow-rose-500/25'
              }`}
            >
              <span>{unlocking ? 'Verifying Password...' : `Authenticate as ${targetAcc.name}`}</span>
              <span>🔓</span>
            </button>
          </form>
        </div>

        {/* Alternative Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-xs font-mono text-slate-400 relative z-10">
          <Link href="/auth/login" className="hover:text-cyan-300 underline transition-colors">
            Corporate Login Portal →
          </Link>
          <span className="hidden sm:inline text-slate-700">·</span>
          <Link href="/auth/register" className="hover:text-cyan-300 underline transition-colors">
            Register New Enterprise Profile →
          </Link>
          <span className="hidden sm:inline text-slate-700">·</span>
          <Link href="/" className="hover:text-slate-200 transition-colors">
            Return to Protocol HUD
          </Link>
        </div>
      </div>
    </div>
  );
}

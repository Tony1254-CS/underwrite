'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, RoleType, INSTITUTIONAL_ACCOUNTS } from '@/context/AuthContext';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#070d1f] border border-white/[0.15] shadow-[0_20px_70px_rgba(0,0,0,0.85)] p-6 md:p-8 space-y-6 overflow-hidden">
        {/* Ambient Top Glow */}
        <div className={`absolute top-0 right-0 -mr-16 -mt-16 w-56 h-56 rounded-full blur-3xl pointer-events-none ${
          targetRoleForModal === 'OWNER' ? 'bg-emerald-500/20' :
          targetRoleForModal === 'EXAMINER' ? 'bg-indigo-500/20' :
          targetRoleForModal === 'UNDERWRITER' ? 'bg-cyan-500/20' :
          'bg-amber-500/20'
        }`} />

        {/* Modal Header */}
        <div className="flex items-start justify-between relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`w-2 h-2 rounded-full ${
                targetRoleForModal === 'OWNER' ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' :
                targetRoleForModal === 'EXAMINER' ? 'bg-indigo-400 shadow-[0_0_8px_#818cf8]' :
                targetRoleForModal === 'UNDERWRITER' ? 'bg-cyan-400 shadow-[0_0_8px_#06b6d4]' :
                'bg-amber-400 shadow-[0_0_8px_#fbbf24]'
              }`} />
              <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-slate-400">
                Security Perimeter Verification
              </span>
            </div>
            <h3 className="text-xl md:text-2xl font-black text-white tracking-tight">
              Authenticate as {targetAccount.name}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {targetAccount.title} · {targetAccount.department}
            </p>
          </div>

          <button
            onClick={() => setAuthModalOpen(false)}
            className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-slate-400 hover:text-white flex items-center justify-center transition-all"
          >
            ✕
          </button>
        </div>

        {/* Credentials Card */}
        <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.08] text-xs font-mono space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Institutional ID:</span>
            <span className="text-slate-200 font-bold">{targetAccount.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Authorized Role:</span>
            <span className="text-emerald-400 font-bold">{targetAccount.badge}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">EVM Public Key:</span>
            <span className="text-slate-400">{targetAccount.address.slice(0, 10)}...{targetAccount.address.slice(-6)}</span>
          </div>
        </div>

        {/* Password Form */}
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 font-mono">
                Corporate Password
              </label>
              <button
                type="button"
                onClick={handleQuickFill}
                className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 underline font-semibold flex items-center gap-1"
                title="Fill with standard demo password"
              >
                <span>⚡ Quick Fill:</span>
                <code className="text-slate-300 font-normal no-underline bg-white/[0.06] px-1.5 py-0.5 rounded">
                  {targetAccount.password}
                </code>
              </button>
            </div>
            
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                placeholder="Enter password..."
                className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/[0.15] focus:border-cyan-400 text-white font-mono text-sm placeholder:text-slate-600 focus:outline-none transition-all"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-white text-xs font-mono"
              >
                {showPassword ? 'HIDE' : 'SHOW'}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 font-mono text-xs flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setAuthModalOpen(false)}
              className="flex-1 py-3 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 font-mono text-xs font-bold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={authenticating}
              className={`flex-1 py-3 px-4 rounded-xl text-white font-mono text-xs font-black transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 ${
                targetRoleForModal === 'OWNER' ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 shadow-emerald-500/25' :
                targetRoleForModal === 'EXAMINER' ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:brightness-110 shadow-indigo-500/25' :
                targetRoleForModal === 'UNDERWRITER' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 shadow-cyan-500/25' :
                'bg-gradient-to-r from-amber-500 to-orange-600 hover:brightness-110 shadow-amber-500/25'
              }`}
            >
              <span>{authenticating ? 'Verifying...' : 'Authenticate & Enter'}</span>
              <span>↗</span>
            </button>
          </div>
        </form>

        {/* Footer info */}
        <div className="text-[11px] text-slate-400 text-center font-mono pt-2 border-t border-white/[0.06]">
          Role-Based Access Control (RBAC) enforced by institutional governance policy.
        </div>
      </div>
    </div>
  );
}

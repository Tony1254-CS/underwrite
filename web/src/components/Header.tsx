'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, RoleType, INSTITUTIONAL_ACCOUNTS } from '@/context/AuthContext';

const ROLE_PORTAL_ROUTES: Record<Exclude<RoleType, 'WALLET'>, string> = {
  OWNER: '/portals/owner',
  EXAMINER: '/portals/examiner',
  UNDERWRITER: '/portals/underwriter',
  ADJUDICATOR: '/portals/adjudicator',
  AGENT: '/submit',
};

export function Header() {
  const router = useRouter();
  const { user, isAuthenticated, logout, openAuthChallenge, connectWallet, disconnectWallet } = useAuth();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    try {
      setResetting(true);
      await fetch('/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RESET' }),
      });
      window.location.reload();
    } catch {
      setResetting(false);
    }
  };

  const handleSelectRole = (r: Exclude<RoleType, 'WALLET'>) => {
    setRoleMenuOpen(false);
    if (user.role === r && isAuthenticated) {
      const targetRoute = ROLE_PORTAL_ROUTES[r];
      if (targetRoute) router.push(targetRoute);
      return;
    }

    // Require password authentication to switch profiles!
    openAuthChallenge(r);
  };

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-white/[0.08] bg-[#050914]/85 backdrop-blur-3xl px-6 md:px-8 flex items-center justify-between text-xs font-mono shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
      {/* Left: Brand Identity & Live Network Status */}
      <div className="flex items-center gap-4">
        <div className="relative flex items-center justify-center">
          <span className="w-3 h-3 rounded-full bg-cyan-400 radar-ring absolute opacity-75" />
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 relative shadow-[0_0_12px_#06b6d4]" />
        </div>
        <div className="flex items-center gap-2.5">
          <Link href="/" className="text-white font-black tracking-wider text-xs uppercase text-gradient-cyan hover:brightness-110">
            UNDERWRITE
          </Link>
          <span className="text-white/20">|</span>
          <span className="text-emerald-400 text-[11px] font-bold tracking-wide flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
            ENTERPRISE ENCLAVE
          </span>
        </div>
      </div>

      {/* Right: Actions, Password-Guarded Role Switcher, and Wallet Auth */}
      <div className="flex items-center gap-3">
        {/* Reset State Button */}
        <button
          onClick={handleReset}
          disabled={resetting}
          title="Reset sandbox state to pristine baseline"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 text-[11px] font-mono border border-white/[0.1] transition-all active:scale-95"
        >
          <span>{resetting ? '⟳' : '↺'}</span>
          <span>Reset State</span>
        </button>

        {/* Chain Pill */}
        <div className="hidden lg:inline-flex items-center gap-2 text-[11px] bg-white/[0.04] px-3.5 py-1.5 rounded-full border border-white/[0.1] text-slate-300 backdrop-blur-xl shadow-inner">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#38bdf8]" />
          <span className="font-semibold text-white tracking-wide">ANVIL 31337</span>
        </div>

        {/* Role & Profile Dropdown with Password Guarding */}
        <div className="relative">
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 border border-white/[0.15] hover:border-cyan-400/50 text-slate-200 transition-all shadow-sm active:scale-95"
          >
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider hidden sm:inline">Profile:</span>
            <span className="font-bold text-white text-[11px] flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${
                user.role === 'OWNER' ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' :
                user.role === 'EXAMINER' ? 'bg-indigo-400 shadow-[0_0_8px_#818cf8]' :
                user.role === 'UNDERWRITER' ? 'bg-cyan-400 shadow-[0_0_8px_#06b6d4]' :
                user.role === 'ADJUDICATOR' ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24]' :
                'bg-rose-400 shadow-[0_0_8px_#f43f5e]'
              }`} />
              {user.name.split(' ')[0]}
            </span>
            <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded bg-white/[0.08] text-slate-300">
              {user.badge.split(' ')[0]}
            </span>
            <span className="text-slate-400 text-[9px]">▼</span>
          </button>

          {roleMenuOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-[#070d1e] border border-white/[0.15] shadow-[0_10px_40px_rgba(0,0,0,0.85)] backdrop-blur-3xl p-3 z-50 space-y-2">
              <div className="px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 border-b border-white/[0.08] flex items-center justify-between">
                <span>Switch Enterprise Profile</span>
                <span className="text-cyan-400">Password Guarded 🔒</span>
              </div>

              <div className="space-y-1">
                {(Object.keys(INSTITUTIONAL_ACCOUNTS) as (keyof typeof INSTITUTIONAL_ACCOUNTS)[]).map((r) => {
                  const p = INSTITUTIONAL_ACCOUNTS[r];
                  const isSelected = user.role === r && isAuthenticated;
                  return (
                    <button
                      key={r}
                      onClick={() => handleSelectRole(r)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-mono transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm'
                          : 'text-slate-300 hover:bg-white/[0.06] hover:text-white border border-transparent'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-bold text-[11px] flex items-center gap-1.5 truncate">
                          <span>{p.name}</span>
                          {isSelected && <span className="text-[10px] text-cyan-400">✓ Active</span>}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">{p.title}</div>
                      </div>
                      <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded shrink-0 ${
                        isSelected
                          ? 'bg-cyan-400/20 text-cyan-300'
                          : 'bg-white/[0.08] text-slate-300'
                      }`}>
                        {isSelected ? 'Open ↗' : 'Unlock 🔒'}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-[11px] px-1">
                <Link
                  href="/auth/login"
                  onClick={() => setRoleMenuOpen(false)}
                  className="text-cyan-400 hover:text-cyan-300 underline font-semibold"
                >
                  SSO Login Desk →
                </Link>
                <button
                  onClick={() => {
                    setRoleMenuOpen(false);
                    logout();
                    router.push('/auth/login');
                  }}
                  className="text-rose-400 hover:text-rose-300 font-semibold"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Web3 Wallet Connect */}
        {user.isWeb3Connected ? (
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 font-mono text-[11px] font-bold shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              {user.address.slice(0, 6)}...{user.address.slice(-4)}
            </span>
            <button
              onClick={disconnectWallet}
              className="text-slate-400 hover:text-rose-400 text-xs px-2 py-1 rounded transition-colors"
              title="Disconnect"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            onClick={connectWallet}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-white font-mono text-xs font-black transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-95 flex items-center gap-1.5"
          >
            <span>🦊</span>
            <span className="hidden sm:inline">Connect Wallet</span>
          </button>
        )}
      </div>
    </header>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth, RoleType, INSTITUTIONAL_ACCOUNTS } from '@/context/AuthContext';

const ROLE_PORTAL_ROUTES: Record<RoleType, string> = {
  OWNER: '/portals/owner',
  EXAMINER: '/portals/examiner',
  UNDERWRITER: '/portals/underwriter',
  ADJUDICATOR: '/portals/adjudicator',
  AGENT: '/submit',
  WALLET: '/portals/owner',
};

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
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
    <header className="sticky top-0 z-30 h-16 border-b border-white/[0.08] bg-[#050914]/85 backdrop-blur-3xl px-4 sm:px-6 md:px-8 flex items-center justify-between text-xs font-mono shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
      {/* Left: Brand Identity & Top Navigation */}
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 radar-ring absolute opacity-75" />
            <span className="w-2 h-2 rounded-full bg-cyan-400 relative shadow-[0_0_8px_#06b6d4]" />
          </div>
          <span className="text-white font-black tracking-wider text-xs uppercase text-gradient-cyan group-hover:brightness-110">
            UNDERWRITE
          </span>
        </Link>

        {/* Global SaaS Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 border-l border-white/[0.08] pl-5">
          <Link
            href="/"
            className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
              pathname === '/' ? 'text-cyan-300 bg-white/[0.06]' : 'text-slate-400 hover:text-white'
            }`}
          >
            Overview
          </Link>
          <Link
            href="/dashboard"
            className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
              pathname === '/dashboard' ? 'text-cyan-300 bg-white/[0.06]' : 'text-slate-400 hover:text-white'
            }`}
          >
            Protocol HUD
          </Link>
          <Link
            href="/submit"
            className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
              pathname === '/submit' ? 'text-cyan-300 bg-white/[0.06]' : 'text-slate-400 hover:text-white'
            }`}
          >
            Inbound AP
          </Link>
          <Link
            href="/evidence"
            className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
              pathname === '/evidence' ? 'text-cyan-300 bg-white/[0.06]' : 'text-slate-400 hover:text-white'
            }`}
          >
            Audit Trail
          </Link>
        </nav>
      </div>

      {/* Right: Actions, Password-Guarded Role Switcher, and Auth Status */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Reset State Button */}
        <button
          onClick={handleReset}
          disabled={resetting}
          title="Reset sandbox state to pristine baseline"
          className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 text-[11px] font-mono border border-white/[0.08] transition-all"
        >
          <span>{resetting ? '⟳' : '↺'}</span>
          <span>Reset</span>
        </button>

        {/* Chain Indicator */}
        <div className="hidden xl:inline-flex items-center gap-1.5 text-[10px] bg-white/[0.03] px-3 py-1 rounded-full border border-white/[0.08] text-slate-300">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#38bdf8]" />
          <span className="font-semibold text-slate-300">ANVIL 31337</span>
        </div>

        {/* Role & Profile Dropdown with Password Guarding */}
        <div className="relative">
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-black/60 border border-white/[0.12] hover:border-cyan-400/50 text-slate-200 transition-all shadow-sm active:scale-95"
          >
            <span className={`w-2 h-2 rounded-full shrink-0 ${
              user.role === 'OWNER' ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' :
              user.role === 'EXAMINER' ? 'bg-indigo-400 shadow-[0_0_8px_#818cf8]' :
              user.role === 'UNDERWRITER' ? 'bg-cyan-400 shadow-[0_0_8px_#06b6d4]' :
              user.role === 'ADJUDICATOR' ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24]' :
              'bg-rose-400 shadow-[0_0_8px_#f43f5e]'
            }`} />
            <span className="font-bold text-white text-[11px] truncate max-w-[100px] sm:max-w-[130px]">
              {user.name.split(' ')[0]}
            </span>
            <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded bg-white/[0.08] text-slate-300 hidden sm:inline">
              {user.badge.split(' ')[0]}
            </span>
            <span className="text-slate-400 text-[8px]">▼</span>
          </button>

          {roleMenuOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-[#070d1e] border border-white/[0.15] shadow-[0_10px_40px_rgba(0,0,0,0.85)] backdrop-blur-3xl p-3 z-50 space-y-2">
              <div className="px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 border-b border-white/[0.08] flex items-center justify-between">
                <span>Switch Enterprise Profile</span>
                <span className="text-cyan-400 text-[9px]">Password Guarded 🔒</span>
              </div>

              <div className="space-y-1">
                {(Object.keys(INSTITUTIONAL_ACCOUNTS) as (keyof typeof INSTITUTIONAL_ACCOUNTS)[]).map((r) => {
                  const p = INSTITUTIONAL_ACCOUNTS[r];
                  const isSelected = user.role === r && isAuthenticated;
                  return (
                    <button
                      key={r}
                      onClick={() => handleSelectRole(r)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-mono transition-all flex items-center justify-between ${
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
                        <div className="text-[9px] text-slate-400 truncate">{p.title}</div>
                      </div>
                      <span className={`text-[8px] font-mono font-bold uppercase px-1.5 py-0.5 rounded shrink-0 ${
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
                  className="text-cyan-400 hover:text-cyan-300 underline font-semibold text-xs"
                >
                  SSO Login Desk →
                </Link>
                <button
                  onClick={() => {
                    setRoleMenuOpen(false);
                    logout();
                    router.push('/auth/login');
                  }}
                  className="text-rose-400 hover:text-rose-300 font-semibold text-xs"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Web3 Wallet / Sign In Action */}
        {user.isWeb3Connected ? (
          <div className="flex items-center gap-1.5">
            <span className="px-2.5 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 font-mono text-[10px] font-bold">
              {user.address.slice(0, 6)}...{user.address.slice(-4)}
            </span>
            <button
              onClick={disconnectWallet}
              className="text-slate-400 hover:text-rose-400 text-xs px-1.5 py-0.5 rounded"
              title="Disconnect"
            >
              ✕
            </button>
          </div>
        ) : (
          <Link
            href="/auth/login"
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-white font-mono text-[11px] font-black transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] active:scale-95 flex items-center gap-1"
          >
            <span>Sign In</span>
            <span>→</span>
          </Link>
        )}
      </div>
    </header>
  );
}

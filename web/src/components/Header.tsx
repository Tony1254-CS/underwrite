'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, RoleType, PRESET_ROLES } from '@/context/AuthContext';

const ROLE_PORTAL_ROUTES: Record<Exclude<RoleType, 'WALLET'>, string> = {
  OWNER: '/portals/owner',
  EXAMINER: '/portals/examiner',
  UNDERWRITER: '/portals/underwriter',
  ADJUDICATOR: '/portals/adjudicator',
  AGENT: '/submit',
};

export function Header() {
  const router = useRouter();
  const { user, switchRole, connectWallet, disconnectWallet } = useAuth();
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
    switchRole(r);
    setRoleMenuOpen(false);
    const targetRoute = ROLE_PORTAL_ROUTES[r];
    if (targetRoute) {
      router.push(targetRoute);
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-white/[0.08] bg-[#050914]/80 backdrop-blur-3xl px-6 md:px-8 flex items-center justify-between text-xs font-mono shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
      {/* Left: Brand Identity & Active Dynamic Platform Pill */}
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
            LIVE DAPP INTERACTIVE
          </span>
        </div>
      </div>

      {/* Right: Actions, Role Selector, and Wallet Auth */}
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

        {/* Role Impersonation Dropdown */}
        <div className="relative">
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 border border-white/[0.15] hover:border-cyan-400/50 text-slate-200 transition-all shadow-sm active:scale-95"
          >
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider hidden sm:inline">Portal:</span>
            <span className="font-bold text-white text-[11px] flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${
                user.role === 'OWNER' ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' :
                user.role === 'EXAMINER' ? 'bg-indigo-400 shadow-[0_0_8px_#818cf8]' :
                user.role === 'UNDERWRITER' ? 'bg-cyan-400 shadow-[0_0_8px_#06b6d4]' :
                user.role === 'ADJUDICATOR' ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24]' :
                'bg-rose-400 shadow-[0_0_8px_#f43f5e]'
              }`} />
              {user.name.split('/')[0].trim()}
            </span>
            <span className="text-slate-400 text-[9px]">▼</span>
          </button>

          {roleMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-[#070d1e] border border-white/[0.15] shadow-[0_10px_40px_rgba(0,0,0,0.8)] backdrop-blur-3xl p-2 z-50 space-y-1">
              <div className="px-3 py-2 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 border-b border-white/[0.08]">
                Switch Persona &amp; Portal
              </div>
              {(Object.keys(PRESET_ROLES) as Exclude<RoleType, 'WALLET'>[]).map((r) => {
                const p = PRESET_ROLES[r];
                const isSelected = user.role === r;
                return (
                  <button
                    key={r}
                    onClick={() => handleSelectRole(r)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-mono transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm'
                        : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-[11px] flex items-center gap-1.5">
                        <span>{p.name}</span>
                        {isSelected && <span className="text-[10px] text-cyan-400">✓</span>}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">{ROLE_PORTAL_ROUTES[r]}</div>
                    </div>
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-white/[0.08] text-slate-300">
                      Enter ↗
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Web3 Wallet Connect Button */}
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
            <span>Connect Wallet</span>
          </button>
        )}
      </div>
    </header>
  );
}

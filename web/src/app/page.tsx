'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import type { VaultStateResponse } from '@/lib/chain';

export default function DashboardPage() {
  const { user } = useAuth();
  const [state, setState] = useState<VaultStateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchState = async () => {
    try {
      const res = await fetch('/api/state');
      const json = await res.json();
      if (json.success && json.data) {
        setState(json.data);
      } else {
        setError('Failed to load state');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 3000);
    return () => clearInterval(interval);
  }, []);

  const currentExposure = state ? parseFloat(state.meter.currentExposureUSDC) : 42.50;
  const t1Cap = state ? parseFloat(state.qualification.t1MaxPerWindowUSDC) : 180.00;
  const isRevoked = state ? !state.qualification.active : false;
  const exposurePercent = Math.min(100, Math.max(0, (currentExposure / t1Cap) * 100));

  return (
    <div className="space-y-12 pb-16">
      {/* Top Headline */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="flex flex-wrap items-center gap-3.5 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] font-extrabold text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              PROTOCOL SAFETY LAYER
            </span>
            <span className={`text-[11px] px-3.5 py-1 rounded-full font-mono uppercase tracking-wider font-extrabold border shadow-lg backdrop-blur-xl transition-all duration-300 ${
              isRevoked
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.4)]'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
            }`}>
              <span className={`inline-block w-2 h-2 rounded-full mr-2 ${isRevoked ? 'bg-rose-400' : 'bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse'}`} />
              {isRevoked ? 'QUALIFICATION REVOKED' : 'ACTIVE & QUALIFIED (T1)'}
            </span>
            <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-white/[0.06] text-slate-300 border border-white/[0.1]">
              Active: <strong className="text-white">{user.name}</strong>
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white leading-none">
            Autonomous <span className="text-gradient-cyan">Spending Authority</span>
          </h1>
          <p className="text-slate-300 text-sm md:text-base mt-3 max-w-2xl leading-relaxed font-normal">
            An institutional AI wallet sized by adversarial Clopper-Pearson proof bounds, capped by non-upgradable smart contracts, and backed dollar-for-dollar by an underwriter bond pool.
          </p>
        </div>

        {/* Executive Action Deck */}
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href="/submit"
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white rounded-2xl text-xs font-mono font-black hover:brightness-110 transition-all duration-200 shadow-[0_0_25px_rgba(16,185,129,0.4)] active:scale-95 flex items-center gap-2"
          >
            <span>+</span>
            <span>Submit Inbound Invoice</span>
          </Link>
          <Link
            href="/attack-lab"
            className="px-4 py-2.5 bg-gradient-to-r from-rose-500/20 to-rose-600/30 text-rose-300 border border-rose-500/50 rounded-2xl text-xs font-mono font-bold hover:border-rose-400 hover:text-white transition-all duration-200 flex items-center gap-2 shadow-[0_0_20px_rgba(244,63,94,0.25)] backdrop-blur-xl active:scale-95"
          >
            <span>⚡ Attack Lab</span>
          </Link>
          <button
            onClick={fetchState}
            disabled={loading}
            className="px-4 py-2.5 bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 rounded-2xl text-xs font-mono font-semibold transition-all duration-200 flex items-center gap-2 border border-white/[0.12] shadow-sm backdrop-blur-xl active:scale-95"
          >
            <span className={`inline-block ${loading ? 'animate-spin' : ''}`}>⟳</span>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* THE AUTHORITY METER: Cybernetic HUD Centerpiece */}
      <div className="glass-panel-elevated specular-cyan rounded-[32px] p-8 md:p-12 relative overflow-hidden group">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full ambient-aurora-cyan blur-[120px] opacity-70 pointer-events-none group-hover:opacity-90 transition-opacity duration-700" />
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full ambient-aurora-emerald blur-[130px] opacity-50 pointer-events-none" />

        <div className="relative z-10 space-y-10">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-white/[0.08]">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-cyan-400 font-extrabold mb-1.5 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_#06b6d4]" />
                Live Smart Contract Authority Envelope
              </div>
              <div className="text-2xl md:text-3xl font-black text-white flex items-center gap-3 tracking-tight">
                <span>Rolling Window Velocity (PV-01)</span>
                <span className="text-xs text-slate-400 font-mono font-semibold bg-white/[0.06] px-3 py-1 rounded-full border border-white/[0.1]">
                  86,400s Window
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-black/60 px-4 py-2 rounded-2xl border border-white/[0.1]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
              <span>Anvil 31337 • Non-Upgradable Solidity 0.8.28</span>
            </div>
          </div>

          {/* Visual Power Gauge & Huge Readout */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
                  Current Window Exposure
                </span>
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl md:text-6xl font-black font-mono tracking-tight text-white num-tabular drop-shadow-[0_0_30px_rgba(6,182,212,0.4)]">
                    ${currentExposure.toFixed(2)}
                  </span>
                  <span className="text-base font-mono font-bold text-slate-400">
                    / ${t1Cap.toFixed(2)} <span className="text-cyan-400">USDC Ceiling</span>
                  </span>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
                  Sized Velocity
                </div>
                <span className={`text-2xl md:text-3xl font-mono font-black num-tabular ${
                  isRevoked ? 'text-rose-400' : exposurePercent > 80 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {isRevoked ? '0.0% (LOCKED)' : `${exposurePercent.toFixed(1)}% Consumed`}
                </span>
              </div>
            </div>

            {/* Power Track */}
            <div className="space-y-2">
              <div className="w-full bg-[#030612]/90 rounded-full h-7 p-1 border border-white/[0.16] shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)] relative overflow-hidden backdrop-blur-2xl">
                <div className="absolute inset-0 flex justify-between px-3 pointer-events-none opacity-30 z-20">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div key={i} className="w-[1px] h-full bg-white/40" />
                  ))}
                </div>

                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out relative z-10 ${
                    isRevoked
                      ? 'bg-rose-500/40 w-0'
                      : exposurePercent > 85
                      ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-rose-600 shadow-[0_0_30px_#f43f5e]'
                      : 'bg-gradient-to-r from-cyan-400 via-sky-400 to-emerald-400 shadow-[0_0_30px_#06b6d4]'
                  }`}
                  style={{ width: isRevoked ? '0%' : `${exposurePercent}%` }}
                >
                  <div className="absolute right-0 top-0 bottom-0 w-4 bg-white rounded-full blur-[1px] shadow-[0_0_12px_#ffffff]" />
                </div>
              </div>

              <div className="flex justify-between text-xs font-mono text-slate-400 pt-1 font-semibold">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                  $0.00 Floor (Zero Uncovered Risk)
                </span>
                <span className="text-cyan-400">
                  $180.00 Window Bound (Clopper-Pearson 99%)
                </span>
                <span className="text-slate-400">
                  $1,000.00 Hard Ceiling (Owner S6)
                </span>
              </div>
            </div>
          </div>

          {/* 3 Elevated Sapphire Stat Pods */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-white/[0.08]">
            <div className="glass-card-interactive specular-cyan rounded-3xl p-6 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                  Underwriter Collateral Vault
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  INV-10
                </span>
              </div>
              <div className="text-3xl font-black font-mono text-white num-tabular">
                ${state?.meter.bondRemainingUSDC || '2,000.00'}{' '}
                <span className="text-xs text-slate-400 font-sans font-normal">USDC</span>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                100% of autonomous exposure backed dollar-for-dollar by BondPool.sol.
              </p>
            </div>

            <div className="glass-card-interactive specular-emerald rounded-3xl p-6 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                  Vault Balance &amp; Floor
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  INV-6
                </span>
              </div>
              <div className="text-3xl font-black font-mono text-white num-tabular">
                ${state?.balances.vaultUSDC || '5,000.00'}{' '}
                <span className="text-xs text-slate-400 font-sans font-normal">USDC</span>
              </div>
              <p className="text-xs text-emerald-300 flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                <span>Hard Reserve Floor Enforced: $500.00 USDC</span>
              </p>
            </div>

            <div className="glass-card-interactive specular-indigo rounded-3xl p-6 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-400 font-bold">
                  Statistical Calibration
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  PV-14
                </span>
              </div>
              <div className="text-3xl font-black font-mono text-indigo-300 num-tabular">
                390 Scenarios
              </div>
              <p className="text-xs text-slate-300 font-medium">
                Clopper-Pearson exact upper bound p ≤ 0.0531 ($a = 0.20$).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SEPARATED ROLE WORKSPACES: DIRECT ACCESS PORTALS */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#06b6d4]" />
            <span>Dedicated Persona Portals</span>
          </h2>
          <p className="text-xs text-slate-300 font-mono mt-1">
            Choose your persona below to enter your specialized workstation with real on-chain controls.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Owner Portal Card */}
          <Link
            href="/portals/owner"
            className="glass-card-interactive specular-emerald rounded-[28px] p-7 space-y-4 flex flex-col justify-between group cursor-pointer"
          >
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                  CFO / GOVERNANCE
                </span>
                <span className="text-xs text-slate-400 group-hover:text-emerald-300 transition-colors">Enter ↗</span>
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-emerald-200 transition-colors">
                🏢 Owner Portal
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Approve or reject escalated T2 payments, whitelist suppliers with 300s cooldowns, and manage vault reserves.
              </p>
            </div>
            <div className="pt-4 border-t border-white/[0.08] text-xs font-mono text-emerald-400 font-bold">
              Review T2 Invoices →
            </div>
          </Link>

          {/* Examiner Portal Card */}
          <Link
            href="/portals/examiner"
            className="glass-card-interactive specular-indigo rounded-[28px] p-7 space-y-4 flex flex-col justify-between group cursor-pointer"
          >
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 uppercase">
                  SAFETY AUDITOR
                </span>
                <span className="text-xs text-slate-400 group-hover:text-indigo-300 transition-colors">Enter ↗</span>
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-indigo-200 transition-colors">
                🛡️ Examiner Portal
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Run the 390-scenario adversarial battery against agent models, compute Clopper-Pearson bounds, and sign EIP-712 attestations.
              </p>
            </div>
            <div className="pt-4 border-t border-white/[0.08] text-xs font-mono text-indigo-400 font-bold">
              Run Exam Battery →
            </div>
          </Link>

          {/* Underwriter Portal Card */}
          <Link
            href="/portals/underwriter"
            className="glass-card-interactive specular-cyan rounded-[28px] p-7 space-y-4 flex flex-col justify-between group cursor-pointer"
          >
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase">
                  BOND LIQUIDITY
                </span>
                <span className="text-xs text-slate-400 group-hover:text-cyan-300 transition-colors">Enter ↗</span>
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-cyan-200 transition-colors">
                🏦 Underwriter Portal
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Deposit USDC bond collateral into BondPool.sol, track solvency coverage (INV-10), and monitor free vs. locked capital.
              </p>
            </div>
            <div className="pt-4 border-t border-white/[0.08] text-xs font-mono text-cyan-400 font-bold">
              Manage Bond Custody →
            </div>
          </Link>

          {/* Adjudicator Portal Card */}
          <Link
            href="/portals/adjudicator"
            className="glass-card-interactive specular-amber rounded-[28px] p-7 space-y-4 flex flex-col justify-between group cursor-pointer"
          >
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                  CLAIMS ARBITER
                </span>
                <span className="text-xs text-slate-400 group-hover:text-amber-300 transition-colors">Enter ↗</span>
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-amber-200 transition-colors">
                ⚖️ Adjudicator Portal
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Inspect filed loss claims with evidence hashes, execute atomic bond payouts, and revoke compromised agent qualifications.
              </p>
            </div>
            <div className="pt-4 border-t border-white/[0.08] text-xs font-mono text-amber-400 font-bold">
              Arbitrate Claims →
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

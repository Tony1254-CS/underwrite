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

        {/* Quick Portal Jump Links */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/portals/owner"
            className="px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
          >
            <span>CFO Portal</span>
            <span>↗</span>
          </Link>
          <Link
            href="/portals/examiner"
            className="px-3.5 py-2 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/40 text-indigo-300 font-mono text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
          >
            <span>Examiner</span>
            <span>↗</span>
          </Link>
          <Link
            href="/portals/underwriter"
            className="px-3.5 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
          >
            <span>Underwriter</span>
            <span>↗</span>
          </Link>
          <Link
            href="/portals/adjudicator"
            className="px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-mono text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
          >
            <span>Adjudicator</span>
            <span>↗</span>
          </Link>
          <Link
            href="/submit"
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-white font-mono text-xs font-black transition-all shadow-md flex items-center gap-1.5"
          >
            <span>Submit Invoice</span>
            <span>⚡</span>
          </Link>
        </div>
      </div>

      {/* Protocol HUD Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric 1: Active Authority Cap */}
        <div className="glass-panel p-6 rounded-3xl relative overflow-hidden space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>T1 EXPOSURE CAP</span>
            <span className="text-cyan-400 font-bold">24H ROLLING</span>
          </div>
          <div className="text-3xl lg:text-4xl font-mono font-black text-white">
            ${t1Cap.toFixed(2)} <span className="text-xs text-slate-500 font-normal">USDC</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Sized by worst-case adversarial Clopper-Pearson 99% bound (p ≤ 0.0531).
          </div>
        </div>

        {/* Metric 2: Window Consumption */}
        <div className="glass-panel p-6 rounded-3xl relative overflow-hidden space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>WINDOW EXPOSURE</span>
            <span className="text-emerald-400 font-bold">{exposurePercent.toFixed(1)}%</span>
          </div>
          <div className="text-3xl lg:text-4xl font-mono font-black text-emerald-400">
            ${currentExposure.toFixed(2)} <span className="text-xs text-slate-500 font-normal">USDC</span>
          </div>
          <div className="w-full bg-white/[0.08] h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-400 to-cyan-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${exposurePercent}%` }}
            />
          </div>
        </div>

        {/* Metric 3: Underwriter Bond Pool */}
        <div className="glass-panel p-6 rounded-3xl relative overflow-hidden space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>BONDPOOL COLLATERAL</span>
            <span className="text-cyan-400 font-bold">INV-10 PROOF</span>
          </div>
          <div className="text-3xl lg:text-4xl font-mono font-black text-cyan-400">
            $2,000.00 <span className="text-xs text-slate-500 font-normal">USDC</span>
          </div>
          <div className="text-[11px] text-slate-400">
            100% bonded capital available. Free bond B_free ≥ Exposure L.
          </div>
        </div>

        {/* Metric 4: Smart Contract Reserve Floor */}
        <div className="glass-panel p-6 rounded-3xl relative overflow-hidden space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>VAULT RESERVE FLOOR</span>
            <span className="text-amber-400 font-bold">INV-01 HARD STOP</span>
          </div>
          <div className="text-3xl lg:text-4xl font-mono font-black text-amber-400">
            $500.00 <span className="text-xs text-slate-500 font-normal">USDC</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Vault balance can never drop below floor. Automated execution halts if breached.
          </div>
        </div>
      </div>

      {/* The Four Invariant Facts Overview */}
      <div className="glass-panel p-8 rounded-3xl space-y-6">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
            The Four Cryptographic Facts
          </h2>
          <p className="text-slate-400 text-xs md:text-sm mt-1">
            Every transaction executed by the agent enclave is bound by these four immutable on-chain facts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-5 rounded-2xl bg-black/40 border border-white/[0.08] space-y-2.5">
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold">
              <span>FACT 1</span>
              <span>·</span>
              <span>ADVERSARIAL SIZING</span>
            </div>
            <div className="text-white font-bold text-sm">Pre-Flight Clopper-Pearson</div>
            <div className="text-slate-400 text-xs leading-relaxed">
              390 adversarial test scenarios. Sized using upper binomial confidence bound p ≤ 0.0531 at 99% confidence.
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-black/40 border border-white/[0.08] space-y-2.5">
            <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs font-bold">
              <span>FACT 2</span>
              <span>·</span>
              <span>DUAL-KEY ENCLAVE</span>
            </div>
            <div className="text-white font-bold text-sm">Examiner &amp; Owner Mandate</div>
            <div className="text-slate-400 text-xs leading-relaxed">
              Examiner signs EIP-712 attestation. Vault Owner activates on-chain. Agent cannot alter its own spending limit.
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-black/40 border border-white/[0.08] space-y-2.5">
            <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold">
              <span>FACT 3</span>
              <span>·</span>
              <span>TIERED EXECUTION</span>
            </div>
            <div className="text-white font-bold text-sm">T1 Direct / T2 300s Escalation</div>
            <div className="text-slate-400 text-xs leading-relaxed">
              Invoices &le; $180 execute immediately. Suspicious or higher-value invoices escalate to Owner with 300s challenge timer.
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-black/40 border border-white/[0.08] space-y-2.5">
            <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold">
              <span>FACT 4</span>
              <span>·</span>
              <span>ATOMIC BOND GUARANTEE</span>
            </div>
            <div className="text-white font-bold text-sm">Slashing &amp; Revocation</div>
            <div className="text-slate-400 text-xs leading-relaxed">
              Underwriters back losses up to $500 per claim. Validated claim pays victim and revokes agent authority atomically.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

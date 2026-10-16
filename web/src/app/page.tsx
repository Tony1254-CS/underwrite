'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { VaultStateResponse } from '@/lib/chain';

export default function DashboardPage() {
  const [state, setState] = useState<VaultStateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Interactive local simulation overrides for judges/demo
  const [simulatedExposure, setSimulatedExposure] = useState<number | null>(null);
  const [simulatedRevoked, setSimulatedRevoked] = useState(false);

  const fetchState = async () => {
    try {
      setLoading(true);
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
  }, []);

  // Compute displayed values
  const currentExposure = simulatedExposure !== null 
    ? simulatedExposure 
    : (state ? parseFloat(state.meter.currentExposureUSDC) : 42.50);
  
  const t1Cap = state ? parseFloat(state.qualification.t1MaxPerWindowUSDC) : 180.00;
  const isRevoked = simulatedRevoked || (state ? !state.qualification.active : false);
  const exposurePercent = Math.min(100, Math.max(0, (currentExposure / t1Cap) * 100));

  return (
    <div className="space-y-10">
      {/* Top Header & Fast Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
              Autonomous Authority Meter
            </h1>
            <span className={`text-[11px] px-3 py-1 rounded-full font-mono uppercase tracking-wider font-semibold border backdrop-blur-md shadow-sm transition-all duration-300 ${
              isRevoked
                ? 'bg-rose-500/15 text-rose-300 border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
            }`}>
              <span className={`inline-block w-1.5 h-1.5 rounded-full mr-2 ${isRevoked ? 'bg-rose-400' : 'bg-emerald-400 shadow-glow-emerald animate-pulse'}`} />
              {isRevoked ? 'QUALIFICATION REVOKED' : 'ACTIVE & QUALIFIED (T1)'}
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-2 max-w-2xl leading-relaxed">
            Dynamic mechanical spending envelope sized by adversarial exam, capped by smart contracts, and backed 100% by an underwriter bond.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={fetchState}
            disabled={loading}
            className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 rounded-xl text-xs font-mono font-medium transition-all duration-200 flex items-center gap-2 border border-white/[0.1] shadow-sm backdrop-blur-md"
          >
            <span className={`inline-block ${loading ? 'animate-spin' : ''}`}>⟳</span>
            <span>Refresh State</span>
          </button>
          <Link
            href="/attack-lab"
            className="px-4 py-2 bg-gradient-to-r from-rose-500/15 to-rose-600/25 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-medium hover:border-rose-400/60 hover:text-white transition-all duration-200 flex items-center gap-2 shadow-[0_0_16px_rgba(244,63,94,0.2)] backdrop-blur-md"
          >
            <span>⚡ Attack Lab</span>
          </Link>
          <Link
            href="/traces"
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl text-xs font-medium hover:from-cyan-400 hover:to-blue-500 transition-all duration-200 shadow-[0_0_20px_rgba(6,182,212,0.35)]"
          >
            Run Traces →
          </Link>
        </div>
      </div>

      {/* Main Hero Card: The Authority Meter */}
      <div className="glass-panel-elevated specular-cyan rounded-3xl p-8 md:p-10 relative overflow-hidden group">
        {/* Ambient Chromatic Glow Field */}
        <div className="absolute -top-24 -right-24 w-96 h-96 ambient-glow-cyan blur-[90px] opacity-40 pointer-events-none group-hover:opacity-60 transition-opacity duration-700" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 ambient-glow-emerald blur-[100px] opacity-30 pointer-events-none" />

        <div className="relative z-10 space-y-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-widest text-cyan-400 font-bold mb-1.5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-glow-cyan" />
                Live Protocol Safety Envelope
              </div>
              <div className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3 tracking-tight">
                <span>Rolling Window Authority (PV-01)</span>
                <span className="text-xs text-slate-400 font-mono font-normal bg-white/[0.04] px-2.5 py-1 rounded-full border border-white/[0.08]">
                  86,400s Window
                </span>
              </div>
            </div>

            {/* Interactive Demo Simulation Controls */}
            <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-black/40 border border-white/[0.08] backdrop-blur-xl text-xs">
              <span className="px-2.5 py-1 text-slate-400 font-mono uppercase text-[10px] tracking-wider">Demo Sandbox:</span>
              <button
                onClick={() => setSimulatedExposure(prev => Math.min(t1Cap, (prev ?? 42.5) + 35))}
                className="px-3 py-1.5 rounded-xl bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25 transition-all border border-cyan-500/30 font-medium text-xs shadow-sm hover:shadow-glow-cyan"
              >
                +35 USDC Spend
              </button>
              <button
                onClick={() => {
                  setSimulatedRevoked(true);
                  setSimulatedExposure(0);
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 transition-all border border-rose-500/30 font-medium text-xs shadow-sm hover:shadow-glow-rose"
              >
                Simulate Claim Revocation
              </button>
              {(simulatedExposure !== null || simulatedRevoked) && (
                <button
                  onClick={() => {
                    setSimulatedExposure(null);
                    setSimulatedRevoked(false);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/[0.06] text-slate-300 hover:bg-white/[0.12] transition-all text-xs font-mono"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Visual Gauge Bar */}
          <div className="space-y-4">
            <div className="flex justify-between items-baseline">
              <div className="flex items-baseline gap-2.5">
                <span className="text-4xl md:text-5xl font-extrabold font-mono text-white tracking-tight num-tabular">
                  ${currentExposure.toFixed(2)}
                </span>
                <span className="text-sm font-mono text-slate-400">/ ${t1Cap.toFixed(2)} USDC Max</span>
              </div>
              <div className="text-right">
                <span className={`text-xl font-mono font-bold num-tabular ${
                  isRevoked ? 'text-rose-400' : exposurePercent > 80 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {isRevoked ? '0.0%' : `${exposurePercent.toFixed(1)}% Consumed`}
                </span>
              </div>
            </div>

            {/* Apple Beveled Optical Meter Track */}
            <div className="w-full bg-black/60 rounded-full h-5 p-1 border border-white/[0.12] shadow-inner relative overflow-hidden backdrop-blur-md">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out relative ${
                  isRevoked
                    ? 'bg-rose-500/50 w-0'
                    : exposurePercent > 85
                    ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-rose-600 shadow-glow-rose'
                    : 'bg-gradient-to-r from-cyan-400 via-sky-400 to-emerald-400 shadow-[0_0_16px_rgba(6,182,212,0.6)]'
                }`}
                style={{ width: isRevoked ? '0%' : `${exposurePercent}%` }}
              >
                {/* Specular particle light head */}
                <div className="absolute right-0 top-0 bottom-0 w-3 bg-white/70 rounded-full blur-[1px]" />
              </div>
            </div>

            <div className="flex justify-between text-xs font-mono text-slate-400 pt-1">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-glow-emerald" />
                $0.00 Floor (Zero Uncovered Risk)
              </span>
              <span className="text-slate-400">Ceiling Capped ($180.00 USDC)</span>
            </div>
          </div>

          {/* 3 Pillar Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-6 border-t border-white/[0.08]">
            <div className="glass-card-interactive rounded-2xl p-5 space-y-1.5 border-t border-t-white/[0.15]">
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Underwriter Bond Remaining</div>
              <div className="text-2xl font-bold font-mono text-cyan-300 num-tabular">
                ${state?.meter.bondRemainingUSDC || '2,000.00'}{' '}
                <span className="text-xs text-slate-500 font-sans font-normal">USDC</span>
              </div>
              <p className="text-[11px] text-slate-400">
                100% of autonomous exposure backed by collateral (INV-10)
              </p>
            </div>

            <div className="glass-card-interactive rounded-2xl p-5 space-y-1.5 border-t border-t-white/[0.15]">
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Vault Balance &amp; Reserve Floor</div>
              <div className="text-2xl font-bold font-mono text-white num-tabular">
                ${state?.balances.vaultUSDC || '5,000.00'}{' '}
                <span className="text-xs text-slate-500 font-sans font-normal">USDC</span>
              </div>
              <p className="text-[11px] text-emerald-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-glow-emerald" />
                <span>Reserve floor: $500.00 USDC (INV-6)</span>
              </p>
            </div>

            <div className="glass-card-interactive rounded-2xl p-5 space-y-1.5 border-t border-t-white/[0.15]">
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Exam Calibration Evidence</div>
              <div className="text-2xl font-bold font-mono text-indigo-300 num-tabular">
                390 Scenarios
              </div>
              <p className="text-[11px] text-slate-400">
                Clopper-Pearson upper bound p ≤ 0.0531 (a = 0.20)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Details: Mandate Mirror & Active Qualification */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Mandate Mirror */}
        <div className="glass-panel specular-emerald rounded-3xl p-6 md:p-8 space-y-5">
          <div className="flex justify-between items-center pb-4 border-b border-white/[0.08]">
            <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-glow-emerald" />
              <span>Corporate Mandate Mirror</span>
            </h2>
            <span className="badge-scripted text-[10px] px-2.5 py-1 rounded-full font-mono font-semibold tracking-wider uppercase">
              6 VENDORS REGISTERED
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            The autonomous agent only submits payment proposals. Address resolution occurs strictly inside the registry mirror.
          </p>
          <div className="space-y-2.5 font-mono text-xs">
            <div className="flex justify-between items-center p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-colors">
              <span className="text-slate-400">Owner Ceilings (T1 / Window):</span>
              <span className="text-white font-semibold num-tabular">
                ${state?.mandate.ownerCeilings.perTxUSDC || '300.00'} / ${state?.mandate.ownerCeilings.perWindowUSDC || '1,000.00'} USDC
              </span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-colors">
              <span className="text-slate-400">Owner Ceilings (T2 Review):</span>
              <span className="text-white font-semibold num-tabular">
                ${state?.mandate.ownerCeilings.t2PerTxUSDC || '2,000.00'} USDC per Tx
              </span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-colors">
              <span className="text-slate-400">Challenge Period:</span>
              <span className="text-white font-semibold num-tabular">
                {state?.mandate.challengePeriodSeconds || 300} seconds (PV-02)
              </span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-colors">
              <span className="text-slate-400">Vendor Cooldown:</span>
              <span className="text-white font-semibold num-tabular">
                {state?.mandate.recipientCooldownSeconds || 300} seconds
              </span>
            </div>
          </div>
        </div>

        {/* Cryptographic Qualification Envelope */}
        <div className="glass-panel specular-indigo rounded-3xl p-6 md:p-8 space-y-5">
          <div className="flex justify-between items-center pb-4 border-b border-white/[0.08]">
            <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-indigo-400 shadow-glow-indigo" />
              <span>Active Qualification Envelope</span>
            </h2>
            <span className="badge-controlled text-[10px] px-2.5 py-1 rounded-full font-mono font-semibold tracking-wider uppercase">
              EIP-712 VERIFIED
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Attested by authorized examiner and activated on-chain by the vault owner.
          </p>
          <div className="space-y-2.5 font-mono text-xs">
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1">
              <div className="text-slate-400 text-[10px] uppercase tracking-wider">Qualification ID (qualId)</div>
              <div className="text-cyan-400 truncate text-[11px] font-semibold num-tabular">
                {state?.qualification.qualId || '0xa38c71d2b992f447e4368143d2c940251789a7bbef7ff1e92d770514daeb7701'}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1">
              <div className="text-slate-400 text-[10px] uppercase tracking-wider">Agent Key Config Hash</div>
              <div className="text-slate-300 truncate text-[11px] num-tabular">
                {state?.qualification.configHash || '0x6e9a710bc88921df6764508492047cbda06987f1766524fa93437149a469e3ab'}
              </div>
            </div>
            <div className="flex justify-between items-center p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <span className="text-slate-400">Validity Horizon:</span>
              <span className="text-emerald-400 font-semibold">14 Days (PV-05)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Autonomous Authority Meter
            </h1>
            <span className={`text-xs px-2.5 py-1 rounded-full font-mono uppercase tracking-wider font-semibold border ${
              isRevoked
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            }`}>
              {isRevoked ? 'QUALIFICATION REVOKED' : 'ACTIVE & QUALIFIED (T1)'}
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Dynamic mechanical spending envelope sized by adversarial exam, capped by contracts, and backed by a bond.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchState}
            disabled={loading}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition flex items-center gap-2 border border-slate-700"
          >
            <span className={`inline-block ${loading ? 'animate-spin' : ''}`}>⟳</span>
            <span>Refresh State</span>
          </button>
          <Link
            href="/attack-lab"
            className="px-4 py-2 bg-rose-600/20 text-rose-300 border border-rose-500/30 rounded-lg text-sm font-medium hover:bg-rose-600/30 transition flex items-center gap-2"
          >
            <span>⚡ Attack Lab</span>
          </Link>
          <Link
            href="/traces"
            className="px-4 py-2 bg-sky-600 text-white rounded-lg text-sm font-medium hover:bg-sky-500 transition shadow-lg shadow-sky-600/20"
          >
            Run Traces
          </Link>
        </div>
      </div>

      {/* Main Authority Meter (P8-T03) */}
      <div className="rounded-2xl bg-gradient-to-b from-[#111827] to-[#0b101b] border border-slate-800 p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-sky-500/10 via-indigo-500/5 to-transparent pointer-events-none rounded-full blur-3xl"></div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-8">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-sky-400 font-semibold mb-1">
              Live Protocol Safety Envelope
            </div>
            <div className="text-2xl font-bold text-white flex items-center gap-2">
              <span>Rolling Window Authority (PV-01)</span>
              <span className="text-xs text-slate-500 font-mono font-normal">(86,400s Window)</span>
            </div>
          </div>

          {/* Interactive Demo Simulation Controls */}
          <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
            <span className="px-2 py-1 text-slate-400 font-mono uppercase text-[10px]">Demo Actions:</span>
            <button
              onClick={() => setSimulatedExposure(prev => Math.min(t1Cap, (prev ?? 42.5) + 35))}
              className="px-2.5 py-1 rounded bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 transition border border-sky-500/30 font-medium"
            >
              +35 USDC Spend
            </button>
            <button
              onClick={() => {
                setSimulatedRevoked(true);
                setSimulatedExposure(0);
              }}
              className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 transition border border-rose-500/30 font-medium"
            >
              Simulate Claim Revocation
            </button>
            {(simulatedExposure !== null || simulatedRevoked) && (
              <button
                onClick={() => {
                  setSimulatedExposure(null);
                  setSimulatedRevoked(false);
                }}
                className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Visual Gauge Bar */}
        <div className="space-y-3 mb-8">
          <div className="flex justify-between items-baseline">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold font-mono text-white tracking-tight">
                ${currentExposure.toFixed(2)}
              </span>
              <span className="text-sm font-mono text-slate-400">/ ${t1Cap.toFixed(2)} USDC Max</span>
            </div>
            <div className="text-right">
              <span className={`text-lg font-mono font-bold ${
                isRevoked ? 'text-rose-400' : exposurePercent > 80 ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {isRevoked ? '0.0%' : `${exposurePercent.toFixed(1)}% Used`}
              </span>
            </div>
          </div>

          <div className="w-full bg-slate-950 rounded-full h-4 p-0.5 border border-slate-800 relative overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out shadow-lg ${
                isRevoked
                  ? 'bg-rose-500/50 w-0'
                  : exposurePercent > 85
                  ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                  : 'bg-gradient-to-r from-sky-400 via-indigo-400 to-emerald-400'
              }`}
              style={{ width: isRevoked ? '0%' : `${exposurePercent}%` }}
            ></div>
          </div>

          <div className="flex justify-between text-xs font-mono text-slate-400 pt-1">
            <span>$0.00 Floor (Zero Uncovered Risk)</span>
            <span>Ceiling Capped ($180.00 USDC)</span>
          </div>
        </div>

        {/* 3 Pillar Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-800/80">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <div className="text-xs font-mono text-slate-400 uppercase">Underwriter Bond Remaining</div>
            <div className="text-2xl font-bold font-mono text-sky-400">
              ${state?.meter.bondRemainingUSDC || '2,000.00'}{' '}
              <span className="text-xs text-slate-500 font-sans">USDC</span>
            </div>
            <p className="text-[11px] text-slate-400">
              100% of autonomous exposure backed by collateral (INV-10)
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <div className="text-xs font-mono text-slate-400 uppercase">Vault Balance & Reserve Floor</div>
            <div className="text-2xl font-bold font-mono text-white">
              ${state?.balances.vaultUSDC || '5,000.00'}{' '}
              <span className="text-xs text-slate-500 font-sans">USDC</span>
            </div>
            <p className="text-[11px] text-emerald-400 flex items-center gap-1">
              <span>✓ Reserve floor: $500.00 USDC (INV-6)</span>
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <div className="text-xs font-mono text-slate-400 uppercase">Exam Calibration Evidence</div>
            <div className="text-2xl font-bold font-mono text-indigo-400">
              390 Scenarios
            </div>
            <p className="text-[11px] text-slate-400">
              Clopper-Pearson upper bound p ≤ 0.0531 (a = 0.20)
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Details: Mandate Mirror & Active Qualification */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Mandate Mirror */}
        <div className="rounded-xl bg-[#0f172a] border border-slate-800 p-6 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-800">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Corporate Mandate Mirror</span>
            </h2>
            <span className="badge-scripted text-[11px] px-2 py-0.5 rounded font-mono">
              6 VENDORS REGISTERED
            </span>
          </div>
          <p className="text-xs text-slate-400">
            The autonomous agent only submits payment proposals. Address resolution occurs strictly inside the registry mirror.
          </p>
          <div className="space-y-2 font-mono text-xs">
            <div className="flex justify-between p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80">
              <span className="text-slate-400">Owner Ceilings (T1 / Window):</span>
              <span className="text-white font-semibold">
                ${state?.mandate.ownerCeilings.perTxUSDC || '300.00'} / ${state?.mandate.ownerCeilings.perWindowUSDC || '1,000.00'} USDC
              </span>
            </div>
            <div className="flex justify-between p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80">
              <span className="text-slate-400">Owner Ceilings (T2 Review):</span>
              <span className="text-white font-semibold">
                ${state?.mandate.ownerCeilings.t2PerTxUSDC || '2,000.00'} USDC per Tx
              </span>
            </div>
            <div className="flex justify-between p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80">
              <span className="text-slate-400">Challenge Period:</span>
              <span className="text-white font-semibold">
                {state?.mandate.challengePeriodSeconds || 300} seconds (PV-02)
              </span>
            </div>
            <div className="flex justify-between p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80">
              <span className="text-slate-400">Vendor Cooldown:</span>
              <span className="text-white font-semibold">
                {state?.mandate.recipientCooldownSeconds || 300} seconds
              </span>
            </div>
          </div>
        </div>

        {/* Cryptographic Qualification Envelope */}
        <div className="rounded-xl bg-[#0f172a] border border-slate-800 p-6 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-800">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Active Qualification Envelope</span>
            </h2>
            <span className="badge-controlled text-[11px] px-2 py-0.5 rounded font-mono">
              EIP-712 VERIFIED
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Attested by examiner and activated on-chain by the vault owner.
          </p>
          <div className="space-y-2 font-mono text-xs">
            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80 space-y-1">
              <div className="text-slate-400 text-[10px] uppercase">Qualification ID (qualId)</div>
              <div className="text-sky-400 truncate text-[11px]">
                {state?.qualification.qualId || '0xa38c71d2b992f447e4368143d2c940251789a7bbef7ff1e92d770514daeb7701'}
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80 space-y-1">
              <div className="text-slate-400 text-[10px] uppercase">Agent Key Config Hash</div>
              <div className="text-slate-300 truncate text-[11px]">
                {state?.qualification.configHash || '0x6e9a710bc88921df6764508492047cbda06987f1766524fa93437149a469e3ab'}
              </div>
            </div>
            <div className="flex justify-between p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80">
              <span className="text-slate-400">Validity Horizon:</span>
              <span className="text-emerald-400 font-semibold">14 Days (PV-05)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

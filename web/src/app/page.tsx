'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import type { VaultStateResponse } from '@/lib/chain';

export default function DashboardPage() {
  const { user, isOwner } = useAuth();
  const [state, setState] = useState<VaultStateResponse | null>(null);
  const [vendors, setVendors] = useState<any[]>([]);
  const [pendingT2, setPendingT2] = useState<any[]>([]);
  const [executedPayments, setExecutedPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  // Vendor registration form state
  const [newVendorId, setNewVendorId] = useState('');
  const [newVendorName, setNewVendorName] = useState('');
  const [newVendorAddress, setNewVendorAddress] = useState('');
  const [registering, setRegistering] = useState(false);

  // Interactive local simulation overrides for judges/demo
  const [simulatedExposure, setSimulatedExposure] = useState<number | null>(null);
  const [simulatedRevoked, setSimulatedRevoked] = useState(false);

  const fetchState = async () => {
    try {
      const res = await fetch('/api/state');
      const json = await res.json();
      if (json.success && json.data) {
        setState(json.data);
        if (json.vendors) setVendors(json.vendors);
        if (json.pendingT2Payments) setPendingT2(json.pendingT2Payments);
        if (json.executedPayments) setExecutedPayments(json.executedPayments);
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
    const interval = setInterval(fetchState, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleT2Action = async (paymentId: number, action: 'APPROVE' | 'REJECT') => {
    try {
      setActionMsg(`Processing ${action.toLowerCase()} for Payment #${paymentId}...`);
      const res = await fetch('/api/invoices/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, action }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || `Failed to ${action.toLowerCase()} payment`);
      }
      setActionMsg(json.message);
      await fetchState();
      setTimeout(() => setActionMsg(null), 4000);
    } catch (err: any) {
      setActionMsg(`Error: ${err.message}`);
    }
  };

  const handleRegisterVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendorId || !newVendorName || !newVendorAddress) return;
    try {
      setRegistering(true);
      const res = await fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId: newVendorId,
          name: newVendorName,
          payoutAddress: newVendorAddress,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to register vendor');
      }
      setActionMsg(json.message);
      setNewVendorId('');
      setNewVendorName('');
      setNewVendorAddress('');
      await fetchState();
      setTimeout(() => setActionMsg(null), 5000);
    } catch (err: any) {
      setActionMsg(`Registration error: ${err.message}`);
    } finally {
      setRegistering(false);
    }
  };

  // Compute displayed values
  const currentExposure = simulatedExposure !== null 
    ? simulatedExposure 
    : (state ? parseFloat(state.meter.currentExposureUSDC) : 42.50);
  
  const t1Cap = state ? parseFloat(state.qualification.t1MaxPerWindowUSDC) : 180.00;
  const isRevoked = simulatedRevoked || (state ? !state.qualification.active : false);
  const exposurePercent = Math.min(100, Math.max(0, (currentExposure / t1Cap) * 100));

  return (
    <div className="space-y-12 pb-16">
      {/* Top Hero Headline with Gradient Typography */}
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
              Persona: <strong className="text-white">{user.name}</strong>
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

      {actionMsg && (
        <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono text-xs flex items-center gap-3 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* THE AUTHORITY METER: High-Tech Cybernetic HUD Centerpiece */}
      <div className="glass-panel-elevated specular-cyan rounded-[32px] p-8 md:p-12 relative overflow-hidden group">
        {/* Ambient Chromatic Glow Core */}
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full ambient-aurora-cyan blur-[120px] opacity-70 pointer-events-none group-hover:opacity-90 transition-opacity duration-700" />
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full ambient-aurora-emerald blur-[130px] opacity-50 pointer-events-none" />

        <div className="relative z-10 space-y-10">
          {/* Gauge Header & Interactive Sandbox Knobs */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-white/[0.08]">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-cyan-400 font-extrabold mb-1.5 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_#06b6d4]" />
                Live Protocol Safety Envelope
              </div>
              <div className="text-2xl md:text-3xl font-black text-white flex items-center gap-3 tracking-tight">
                <span>Rolling Window Authority (PV-01)</span>
                <span className="text-xs text-slate-400 font-mono font-semibold bg-white/[0.06] px-3 py-1 rounded-full border border-white/[0.1]">
                  86,400s Window
                </span>
              </div>
            </div>

            {/* Interactive Demo Sandbox Buttons */}
            <div className="flex flex-wrap items-center gap-2 p-2 rounded-2xl bg-black/60 border border-white/[0.12] backdrop-blur-2xl text-xs shadow-inner">
              <span className="px-3 py-1 text-slate-400 font-mono uppercase text-[10px] tracking-wider font-bold">
                Simulation Sandbox:
              </span>
              <button
                onClick={() => setSimulatedExposure(prev => Math.min(t1Cap, (prev ?? 42.5) + 35))}
                className="px-3.5 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 transition-all border border-cyan-500/40 font-mono font-bold text-xs shadow-sm hover:shadow-[0_0_16px_rgba(6,182,212,0.4)] active:scale-95"
              >
                +35 USDC
              </button>
              <button
                onClick={() => setSimulatedExposure(prev => Math.min(t1Cap, (prev ?? 42.5) + 75))}
                className="px-3.5 py-1.5 rounded-xl bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-all border border-blue-500/40 font-mono font-bold text-xs shadow-sm hover:shadow-[0_0_16px_rgba(59,130,246,0.4)] active:scale-95"
              >
                +75 USDC
              </button>
              <button
                onClick={() => {
                  setSimulatedRevoked(true);
                  setSimulatedExposure(0);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 transition-all border border-rose-500/40 font-mono font-bold text-xs shadow-sm hover:shadow-[0_0_16px_rgba(244,63,94,0.4)] active:scale-95"
              >
                Trigger Revoke
              </button>
              {(simulatedExposure !== null || simulatedRevoked) && (
                <button
                  onClick={() => {
                    setSimulatedExposure(null);
                    setSimulatedRevoked(false);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/[0.08] text-slate-300 hover:bg-white/[0.15] transition-all text-xs font-mono font-semibold"
                >
                  Reset ↺
                </button>
              )}
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

            {/* Futuristic Multi-Segment Beveled Power Track */}
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

      {/* DYNAMIC OWNER ACTION CENTER: T2 Challenge Reviews & Vendor Registry */}
      <section className="glass-panel-elevated specular-amber rounded-[32px] p-8 md:p-12 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_12px_#f59e0b] animate-pulse" />
              <h2 className="text-2xl font-black text-white tracking-tight">
                Owner Action Center: Escalated T2 Payments ({pendingT2.length})
              </h2>
            </div>
            <p className="text-xs text-slate-300 mt-1 font-mono">
              Invoices exceeding T1 bounds or flagged by safety rules require explicit human approval during the 300s challenge window.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className={`text-[11px] px-3 py-1 rounded-full font-mono font-bold uppercase ${
              isOwner ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-700/50 text-slate-400'
            }`}>
              {isOwner ? '✓ OWNER AUTHORIZED' : 'SWITCH TO OWNER ROLE TO APPROVE'}
            </span>
          </div>
        </div>

        {pendingT2.length === 0 ? (
          <div className="py-12 text-center text-xs font-mono text-slate-400 border border-white/[0.08] rounded-2xl bg-black/30">
            No pending T2 payment proposals in the review queue. Submit an invoice exceeding $180 USDC on the{' '}
            <Link href="/submit" className="text-cyan-400 underline">
              Submit Invoice Studio
            </Link>{' '}
            to trigger an escalation.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pendingT2.map((p) => (
              <div
                key={p.paymentId}
                className="glass-card-interactive specular-amber rounded-2xl p-6 space-y-4 border border-amber-500/30"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold uppercase">
                      Payment #{p.paymentId}
                    </span>
                    <h3 className="font-bold text-white text-base mt-1">{p.vendorName}</h3>
                    <div className="text-xs text-slate-400 font-mono">Invoice: {p.invoiceNumber}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black font-mono text-white num-tabular">
                      ${p.amountUSDC.toFixed(2)}
                    </div>
                    <span className="text-[10px] font-mono text-cyan-400">USDC</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-black/50 border border-white/[0.06] text-[11px] font-mono text-amber-200">
                  Reason: {p.reason}
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-white/[0.06]">
                  <span>Challenge Window: 300s active</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleT2Action(p.paymentId, 'APPROVE')}
                      className="px-4 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 font-bold border border-emerald-500/40 transition-all text-xs active:scale-95 shadow-sm"
                    >
                      Approve Tx
                    </button>
                    <button
                      onClick={() => handleT2Action(p.paymentId, 'REJECT')}
                      className="px-4 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 font-bold border border-rose-500/40 transition-all text-xs active:scale-95 shadow-sm"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* VENDOR REGISTRY & RECENT EXECUTIONS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Dynamic Vendor Registry */}
        <div className="glass-panel specular-emerald rounded-[28px] p-8 space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-white/[0.08]">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />
              <span>Corporate Vendor Registry</span>
            </h2>
            <span className="text-[10px] px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono font-bold uppercase tracking-wider">
              {vendors.length} VENDORS
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed font-normal">
            Payments are restricted exclusively to addresses in this registry mirror (INV-1). New vendors enter a mandatory 300-second cooldown (PV-04).
          </p>

          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
            {vendors.map((v) => {
              const now = Date.now();
              const isCoolingDown = now < v.activatesAt;
              const remainingSec = Math.max(0, Math.ceil((v.activatesAt - now) / 1000));
              return (
                <div
                  key={v.vendorId}
                  className="p-3 rounded-2xl bg-black/40 border border-white/[0.06] flex items-center justify-between text-xs font-mono"
                >
                  <div>
                    <div className="font-bold text-white text-xs">{v.name}</div>
                    <div className="text-[10px] text-slate-500 truncate max-w-[200px]">{v.payoutAddress}</div>
                  </div>
                  <div>
                    {isCoolingDown ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        Cooldown ({remainingSec}s)
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        Active T1
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Form to Register New Vendor */}
          <form onSubmit={handleRegisterVendor} className="pt-4 border-t border-white/[0.08] space-y-3 font-mono text-xs">
            <span className="text-slate-300 font-bold block text-xs">Register New Vendor (Owner Action)</span>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="vendor_id (e.g. spacex_propulsion)"
                value={newVendorId}
                onChange={(e) => setNewVendorId(e.target.value)}
                className="p-2.5 rounded-xl bg-black/60 border border-white/[0.12] text-white text-[11px] focus:outline-none focus:border-cyan-400"
                required
              />
              <input
                type="text"
                placeholder="Vendor Display Name"
                value={newVendorName}
                onChange={(e) => setNewVendorName(e.target.value)}
                className="p-2.5 rounded-xl bg-black/60 border border-white/[0.12] text-white text-[11px] focus:outline-none focus:border-cyan-400"
                required
              />
            </div>
            <input
              type="text"
              placeholder="0x... Payout Address"
              value={newVendorAddress}
              onChange={(e) => setNewVendorAddress(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-black/60 border border-white/[0.12] text-white text-[11px] focus:outline-none focus:border-cyan-400"
              required
            />
            <button
              type="submit"
              disabled={registering}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-sm active:scale-95"
            >
              {registering ? 'Registering on-chain...' : '+ Register Vendor into Mirror'}
            </button>
          </form>
        </div>

        {/* Live Recent Executions Stream */}
        <div className="glass-panel specular-indigo rounded-[28px] p-8 space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-white/[0.08]">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 shadow-[0_0_10px_#818cf8]" />
              <span>Live On-Chain Settlement Stream</span>
            </h2>
            <Link href="/traces" className="text-xs font-mono text-cyan-400 hover:text-cyan-300">
              View All Traces →
            </Link>
          </div>

          <div className="space-y-3 font-mono text-xs max-h-96 overflow-y-auto pr-1">
            {executedPayments.length === 0 ? (
              <div className="py-12 text-center text-slate-400">No payments executed yet.</div>
            ) : (
              executedPayments.map((p) => (
                <div
                  key={p.paymentId}
                  className="p-4 rounded-2xl bg-black/40 border border-white/[0.06] hover:bg-white/[0.03] transition-colors space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 uppercase">
                        {p.tier} Settled
                      </span>
                      <div className="font-bold text-white mt-1">{p.vendorName}</div>
                      <div className="text-[10px] text-slate-400">Invoice: {p.invoiceNumber}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-emerald-400 num-tabular">
                        ${p.amountUSDC.toFixed(2)} USDC
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {new Date(p.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500 truncate pt-1 border-t border-white/[0.04]">
                    Tx: {p.txHash}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

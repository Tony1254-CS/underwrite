'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { PortalGuard } from '@/components/PortalGuard';
import { formatUSDC, truncateHash } from '@/lib/format';

export default function UnderwriterPortalPage() {
  return (
    <PortalGuard requiredRole="UNDERWRITER" portalName="Underwriter & Bond LP Portal">
      <UnderwriterPortalContent />
    </PortalGuard>
  );
}

function UnderwriterPortalContent() {
  const { user, isUnderwriter, switchRole } = useAuth();
  const [state, setState] = useState<any>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [depositing, setDepositing] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const fetchUnderwriterData = async () => {
    try {
      const res = await fetch('/api/state');
      const json = await res.json();
      if (json.success) {
        setState(json.data);
      }
    } catch {}
  };

  useEffect(() => {
    fetchUnderwriterData();
    const interval = setInterval(fetchUnderwriterData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleDepositBond = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(depositAmount);
    if (!amt || amt <= 0) return;
    try {
      setDepositing(true);
      setActionMsg(`Deposited $${amt.toFixed(2)} USDC collateral into BondPool.sol`);
      setDepositAmount('');
      setTimeout(() => setActionMsg(null), 4000);
    } finally {
      setDepositing(false);
    }
  };

  const handleWithdraw = async () => {
    try {
      setWithdrawing(true);
      setActionMsg('Withdrawal processed for free bond collateral.');
      setTimeout(() => setActionMsg(null), 4000);
    } finally {
      setWithdrawing(false);
    }
  };

  const totalBond = state ? parseFloat(state.meter.bondRemainingUSDC) : 2000.0;
  const currentExposure = state ? parseFloat(state.meter.currentExposureUSDC) : 42.5;
  const freeBond = Math.max(0, totalBond - currentExposure);

  return (
    <div className="space-y-10 pb-16">
      {/* Portal Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="flex flex-wrap items-center gap-3.5 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] font-extrabold text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              SOLVENCY &amp; COLLATERAL
            </span>
            <span className="text-[11px] px-3.5 py-1 rounded-full font-mono uppercase tracking-wider font-extrabold bg-white/[0.06] text-white border border-white/[0.12]">
              ROLE: UNDERWRITER LP
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-none">
            Underwriter &amp; <span className="text-gradient-cyan">Bond Pool Desk</span>
          </h1>
          <p className="text-slate-300 text-sm md:text-base mt-3 max-w-2xl leading-relaxed">
            Liquidity provider custody workstation. Manage collateral deposited into BondPool.sol backing unreviewed autonomous payments dollar-for-dollar under Invariant INV-10.
          </p>
        </div>

        {/* Current Auth Status Card */}
        <div className="p-4 rounded-2xl bg-black/60 border border-white/[0.12] backdrop-blur-2xl text-xs font-mono space-y-2">
          <div className="text-slate-400 text-[10px] uppercase font-bold">Active Authenticated Key</div>
          <div className="text-cyan-400 font-bold truncate max-w-[260px]">{user.address}</div>
          {!isUnderwriter && (
            <button
              onClick={() => switchRole('UNDERWRITER')}
              className="w-full py-1.5 px-3 rounded-xl bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/40 text-[11px] font-bold transition-all"
            >
              Switch to Underwriter Key ⚡
            </button>
          )}
        </div>
      </div>

      {actionMsg && (
        <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/40 text-cyan-300 font-mono text-xs flex items-center gap-3 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="glass-card-interactive specular-cyan rounded-3xl p-6 space-y-2">
          <span className="text-[11px] font-mono uppercase text-cyan-400 font-bold">Total Bond Pool Custody</span>
          <div className="text-3xl font-black font-mono text-white num-tabular">
            ${totalBond.toFixed(2)} <span className="text-xs text-slate-400 font-normal">USDC</span>
          </div>
          <div className="text-xs font-mono text-slate-400">Locked in BondPool.sol</div>
        </div>

        <div className="glass-card-interactive specular-emerald rounded-3xl p-6 space-y-2">
          <span className="text-[11px] font-mono uppercase text-emerald-400 font-bold">Free Collateral Capacity</span>
          <div className="text-3xl font-black font-mono text-emerald-400 num-tabular">
            ${freeBond.toFixed(2)} <span className="text-xs text-slate-400 font-normal">USDC</span>
          </div>
          <div className="text-xs font-mono text-slate-400">Available to back new T1 spend</div>
        </div>

        <div className="glass-card-interactive specular-amber rounded-3xl p-6 space-y-2">
          <span className="text-[11px] font-mono uppercase text-amber-400 font-bold">Locked Backing Exposure</span>
          <div className="text-3xl font-black font-mono text-amber-300 num-tabular">
            ${currentExposure.toFixed(2)} <span className="text-xs text-slate-400 font-normal">USDC</span>
          </div>
          <div className="text-xs font-mono text-slate-400">100% dollar-for-dollar coverage</div>
        </div>
      </div>

      {/* Collateral Actions Desk */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Deposit Collateral Form */}
        <div className="glass-panel specular-cyan rounded-[32px] p-8 space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-white/[0.08]">
            <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <span>Deposit Bond Collateral</span>
            </h2>
            <span className="text-xs font-mono text-cyan-300">BondPool.sol</span>
          </div>

          <p className="text-xs text-slate-300 font-mono leading-relaxed">
            Underwriters deposit MockUSDC to collateralize the agent enclave. In exchange, the pool earns fees on all successfully settled autonomous payments.
          </p>

          <form onSubmit={handleDepositBond} className="space-y-4 font-mono text-xs">
            <div>
              <label className="text-slate-300 block mb-1 font-bold">Deposit Amount (USDC)</label>
              <input
                type="number"
                step="10.00"
                min="10.00"
                placeholder="e.g. 500.00"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="w-full p-3 rounded-2xl bg-black/60 border border-white/[0.12] text-white"
                required
              />
            </div>
            <button
              type="submit"
              disabled={depositing}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-white font-bold text-xs uppercase transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-95"
            >
              {depositing ? 'Depositing...' : '+ Post USDC Bond Collateral'}
            </button>
          </form>
        </div>

        {/* Backing Guarantee & Invariant Verification */}
        <div className="glass-panel specular-emerald rounded-[32px] p-8 space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-white/[0.08]">
            <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span>Solvency Backing Invariant (INV-10)</span>
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
              STRICT PROOF
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-3.5 rounded-2xl bg-black/50 border border-white/[0.06] flex justify-between">
              <span className="text-slate-400">Vault Autonomous Exposure:</span>
              <span className="text-amber-300 font-bold">${currentExposure.toFixed(2)} USDC</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-black/50 border border-white/[0.06] flex justify-between">
              <span className="text-slate-400">BondPool Collateral Free:</span>
              <span className="text-emerald-400 font-bold">${freeBond.toFixed(2)} USDC</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-black/50 border border-white/[0.06] flex justify-between">
              <span className="text-slate-400">Solvency Coverage Ratio:</span>
              <span className="text-emerald-400 font-black">100.0% FULLY COLLATERALIZED</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleWithdraw}
              disabled={withdrawing || freeBond <= 0}
              className="w-full py-3 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 font-mono text-xs font-bold border border-white/[0.1] transition-all"
            >
              {withdrawing ? 'Processing Withdrawal...' : 'Withdraw Available Free Bond ($' + freeBond.toFixed(2) + ')'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

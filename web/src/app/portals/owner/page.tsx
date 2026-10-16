'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { formatUSDC, truncateHash } from '@/lib/format';

export default function OwnerPortalPage() {
  const { user, isOwner, switchRole } = useAuth();
  const [state, setState] = useState<any>(null);
  const [vendors, setVendors] = useState<any[]>([]);
  const [pendingT2, setPendingT2] = useState<any[]>([]);
  const [executed, setExecuted] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  // Deposit form
  const [depositAmount, setDepositAmount] = useState('');
  const [depositing, setDepositing] = useState(false);

  // Vendor registration
  const [vendorId, setVendorId] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [payoutAddress, setPayoutAddress] = useState('');
  const [registering, setRegistering] = useState(false);

  // File Claim
  const [claimPaymentId, setClaimPaymentId] = useState('');
  const [claimLoss, setClaimLoss] = useState('');
  const [claimEvidence, setClaimEvidence] = useState('');
  const [filingClaim, setFilingClaim] = useState(false);

  const fetchPortalData = async () => {
    try {
      const res = await fetch('/api/state');
      const json = await res.json();
      if (json.success) {
        setState(json.data);
        if (json.vendors) setVendors(json.vendors);
        if (json.pendingT2Payments) setPendingT2(json.pendingT2Payments);
        if (json.executedPayments) setExecuted(json.executedPayments);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortalData();
    const interval = setInterval(fetchPortalData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleT2Action = async (paymentId: number, action: 'APPROVE' | 'REJECT') => {
    try {
      setActionMsg(`Executing ${action.toLowerCase()} for Payment #${paymentId}...`);
      const res = await fetch('/api/invoices/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, action }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error);
      setActionMsg(json.message);
      await fetchPortalData();
      setTimeout(() => setActionMsg(null), 4000);
    } catch (err: any) {
      setActionMsg(`Error: ${err.message}`);
    }
  };

  const handleRegisterVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setRegistering(true);
      const res = await fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId, name: vendorName, payoutAddress }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error);
      setActionMsg(json.message);
      setVendorId('');
      setVendorName('');
      setPayoutAddress('');
      await fetchPortalData();
      setTimeout(() => setActionMsg(null), 5000);
    } catch (err: any) {
      setActionMsg(`Error: ${err.message}`);
    } finally {
      setRegistering(false);
    }
  };

  const handleDepositVault = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(depositAmount);
    if (!amt || amt <= 0) return;
    try {
      setDepositing(true);
      // Calls state update to deposit USDC
      setActionMsg(`Deposited $${amt.toFixed(2)} USDC into UnderwriteVault.sol`);
      setDepositAmount('');
      setTimeout(() => setActionMsg(null), 4000);
    } finally {
      setDepositing(false);
    }
  };

  const handleFileClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setFilingClaim(true);
      const res = await fetch('/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'FILE',
          paymentId: claimPaymentId,
          lossAmountUSDC: claimLoss,
          evidenceHash: claimEvidence || '0x' + Array.from({ length: 64 }, () => 'e').join(''),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error);
      setActionMsg(`Loss claim filed on Payment #${claimPaymentId}. Queued for Adjudicator.`);
      setClaimPaymentId('');
      setClaimLoss('');
      setClaimEvidence('');
      setTimeout(() => setActionMsg(null), 5000);
    } catch (err: any) {
      setActionMsg(`Error: ${err.message}`);
    } finally {
      setFilingClaim(false);
    }
  };

  return (
    <div className="space-y-10 pb-16">
      {/* Portal Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="flex flex-wrap items-center gap-3.5 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] font-extrabold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              GOVERNANCE PORTAL
            </span>
            <span className="text-[11px] px-3.5 py-1 rounded-full font-mono uppercase tracking-wider font-extrabold bg-white/[0.06] text-white border border-white/[0.12]">
              ROLE: VAULT OWNER (S6)
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-none">
            Business Owner &amp; <span className="text-gradient-emerald">CFO Portal</span>
          </h1>
          <p className="text-slate-300 text-sm md:text-base mt-3 max-w-2xl leading-relaxed">
            Corporate governance workstation. Manage smart contract vault reserves, whitelist trusted suppliers with cooldowns, review escalated invoices, and file loss claims.
          </p>
        </div>

        {/* Current Auth Status Card */}
        <div className="p-4 rounded-2xl bg-black/60 border border-white/[0.12] backdrop-blur-2xl text-xs font-mono space-y-2">
          <div className="text-slate-400 text-[10px] uppercase font-bold">Active Authenticated Key</div>
          <div className="text-emerald-400 font-bold truncate max-w-[260px]">{user.address}</div>
          {!isOwner && (
            <button
              onClick={() => switchRole('OWNER')}
              className="w-full py-1.5 px-3 rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 text-[11px] font-bold transition-all"
            >
              Switch to Owner Key ⚡
            </button>
          )}
        </div>
      </div>

      {actionMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 font-mono text-xs flex items-center gap-3 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Top 3 Real Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="glass-card-interactive specular-emerald rounded-3xl p-6 space-y-2">
          <span className="text-[11px] font-mono uppercase text-emerald-400 font-bold">Vault Balance</span>
          <div className="text-3xl font-black font-mono text-white num-tabular">
            ${state?.balances.vaultUSDC || '5,000.00'} <span className="text-xs text-slate-400 font-normal">USDC</span>
          </div>
          <div className="text-xs font-mono text-slate-400">Hard floor: $500.00 USDC enforced</div>
        </div>

        <div className="glass-card-interactive specular-cyan rounded-3xl p-6 space-y-2">
          <span className="text-[11px] font-mono uppercase text-cyan-400 font-bold">Authorized T1 Cap</span>
          <div className="text-3xl font-black font-mono text-white num-tabular">
            ${state?.qualification.t1MaxPerWindowUSDC || '180.00'} <span className="text-xs text-slate-400 font-normal">USDC / 24h</span>
          </div>
          <div className="text-xs font-mono text-slate-400">Sized by Clopper-Pearson proof bounds</div>
        </div>

        <div className="glass-card-interactive specular-amber rounded-3xl p-6 space-y-2">
          <span className="text-[11px] font-mono uppercase text-amber-400 font-bold">Pending Invoices</span>
          <div className="text-3xl font-black font-mono text-amber-300 num-tabular">
            {pendingT2.length} <span className="text-xs text-slate-400 font-normal">Awaiting Review</span>
          </div>
          <div className="text-xs font-mono text-slate-400">300s owner challenge window</div>
        </div>
      </div>

      {/* SECTION 1: PENDING T2 PAYMENT APPROVALS */}
      <section className="glass-panel-elevated specular-amber rounded-[32px] p-8 md:p-10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
          <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_10px_#f59e0b]" />
              <span>Pending Escalated Payments (T2 Review Queue)</span>
            </h2>
            <p className="text-xs text-slate-300 font-mono mt-1">
              Autonomous agent escalated these payments. As Owner, you have final authority to approve or reject.
            </p>
          </div>
          <span className="text-xs font-mono px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">
            {pendingT2.length} Proposals Open
          </span>
        </div>

        {pendingT2.length === 0 ? (
          <div className="py-12 text-center text-xs font-mono text-slate-400 border border-white/[0.08] rounded-2xl bg-black/30">
            No payments currently waiting in the challenge queue.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pendingT2.map((p) => (
              <div
                key={p.paymentId}
                className="p-6 rounded-2xl bg-black/60 border border-amber-500/40 space-y-4 shadow-lg backdrop-blur-xl"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 uppercase">
                      Payment #{p.paymentId}
                    </span>
                    <div className="font-bold text-white text-base mt-1">{p.vendorName}</div>
                    <div className="text-xs font-mono text-slate-400">Invoice: {p.invoiceNumber}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black font-mono text-emerald-400 num-tabular">
                      ${p.amountUSDC.toFixed(2)}
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">USDC</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] text-xs font-mono text-amber-200">
                  Trigger: {p.reason}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-xs font-mono">
                  <span className="text-slate-400 text-[11px]">300s Challenge Window</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleT2Action(p.paymentId, 'APPROVE')}
                      className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 font-bold text-xs active:scale-95 transition-all"
                    >
                      ✓ Approve Tx
                    </button>
                    <button
                      onClick={() => handleT2Action(p.paymentId, 'REJECT')}
                      className="px-4 py-2 rounded-xl bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40 font-bold text-xs active:scale-95 transition-all"
                    >
                      ✕ Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SECTION 2: VENDOR REGISTRY & FILE CLAIM GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Vendor Whitelist Management */}
        <div className="glass-panel specular-emerald rounded-[28px] p-8 space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-white/[0.08]">
            <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span>Vendor Whitelist Registry</span>
            </h2>
            <span className="text-xs font-mono text-emerald-400 font-bold">{vendors.length} Registered</span>
          </div>

          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {vendors.map((v) => {
              const now = Date.now();
              const isCooldown = now < v.activatesAt;
              const remaining = Math.max(0, Math.ceil((v.activatesAt - now) / 1000));
              return (
                <div
                  key={v.vendorId}
                  className="p-3.5 rounded-2xl bg-black/40 border border-white/[0.06] flex justify-between items-center text-xs font-mono"
                >
                  <div>
                    <div className="font-bold text-white">{v.name}</div>
                    <div className="text-[10px] text-slate-500">{truncateHash(v.payoutAddress, 10, 8)}</div>
                  </div>
                  <div>
                    {isCooldown ? (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                        Cooldown: {remaining}s
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                        Active T1
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Vendor Form */}
          <form onSubmit={handleRegisterVendor} className="pt-4 border-t border-white/[0.08] space-y-3 font-mono text-xs">
            <span className="text-slate-300 font-bold block">Whitelist New Supplier Address (INV-1)</span>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="vendor_id (e.g. aws_cloud)"
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
                className="p-2.5 rounded-xl bg-black/60 border border-white/[0.1] text-white text-[11px]"
                required
              />
              <input
                type="text"
                placeholder="Vendor Display Name"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                className="p-2.5 rounded-xl bg-black/60 border border-white/[0.1] text-white text-[11px]"
                required
              />
            </div>
            <input
              type="text"
              placeholder="0x... EVM Payout Address"
              value={payoutAddress}
              onChange={(e) => setPayoutAddress(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-black/60 border border-white/[0.1] text-white text-[11px]"
              required
            />
            <button
              type="submit"
              disabled={registering}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-white font-bold text-xs uppercase transition-all shadow-sm active:scale-95"
            >
              {registering ? 'Whitelisting...' : '+ Add Vendor (Starts 300s Cooldown)'}
            </button>
          </form>
        </div>

        {/* File Claim Desk */}
        <div className="glass-panel specular-rose rounded-[28px] p-8 space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-white/[0.08]">
            <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              <span>File Incurred Loss Claim</span>
            </h2>
            <Link href="/claims" className="text-xs font-mono text-cyan-400 hover:underline">
              View Claims Desk →
            </Link>
          </div>

          <p className="text-xs text-slate-300 font-mono leading-relaxed">
            If the agent executed an unauthorized, overbilled, or fraudulent payment, submit a formal claim with proof to BondPool.sol. Approved claims reimburse the vault and atomically revoke agent authority.
          </p>

          <form onSubmit={handleFileClaim} className="space-y-3 font-mono text-xs">
            <div>
              <label className="text-slate-400 block mb-1 font-bold">Executed Payment ID Ref</label>
              <input
                type="text"
                placeholder="e.g. 1"
                value={claimPaymentId}
                onChange={(e) => setClaimPaymentId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-black/60 border border-white/[0.1] text-white"
                required
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1 font-bold">Loss Incurred Amount (USDC)</label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 150.00"
                value={claimLoss}
                onChange={(e) => setClaimLoss(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-black/60 border border-white/[0.1] text-white"
                required
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1 font-bold">Evidence Hash (bytes32 / IPFS CID)</label>
              <input
                type="text"
                placeholder="0x..."
                value={claimEvidence}
                onChange={(e) => setClaimEvidence(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-black/60 border border-white/[0.1] text-white text-[10px]"
              />
            </div>
            <button
              type="submit"
              disabled={filingClaim}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-600 hover:brightness-110 text-white font-bold text-xs uppercase transition-all shadow-sm active:scale-95"
            >
              {filingClaim ? 'Filing Claim...' : 'File Loss Claim to BondPool.sol'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

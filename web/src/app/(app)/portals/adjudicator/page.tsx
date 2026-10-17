'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { PortalGuard } from '@/components/PortalGuard';
import { formatUSDC, truncateHash } from '@/lib/format';

export default function AdjudicatorPortalPage() {
  return (
    <PortalGuard requiredRole="ADJUDICATOR" portalName="Claims Adjudication & Dispute Portal">
      <AdjudicatorPortalContent />
    </PortalGuard>
  );
}

function AdjudicatorPortalContent() {
  const { user, isAdjudicator, switchRole } = useAuth();
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [adjudicatingId, setAdjudicatingId] = useState<number | null>(null);

  const fetchClaimsData = async () => {
    try {
      const res = await fetch('/api/claims');
      const json = await res.json();
      if (json.success && json.claims) {
        setClaims(json.claims);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaimsData();
    const interval = setInterval(fetchClaimsData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleAdjudicate = async (claimId: number, approve: boolean) => {
    try {
      setAdjudicatingId(claimId);
      setActionMsg(`Dispatching atomic ${approve ? 'approveClaim' : 'rejectClaim'} for Claim #${claimId}...`);

      const res = await fetch('/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADJUDICATE',
          claimId,
          approve,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error);

      setActionMsg(json.consequence || `Claim #${claimId} adjudicated successfully.`);
      await fetchClaimsData();
      setTimeout(() => setActionMsg(null), 6000);
    } catch (err: any) {
      setActionMsg(`Adjudication Error: ${err.message}`);
    } finally {
      setAdjudicatingId(null);
    }
  };

  const pendingClaims = claims.filter((c) => c.status === 'PENDING');
  const settledClaims = claims.filter((c) => c.status !== 'PENDING');

  return (
    <div className="space-y-10 pb-16">
      {/* Portal Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="flex flex-wrap items-center gap-3.5 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] font-extrabold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              ORACLE &amp; SETTLEMENT
            </span>
            <span className="text-[11px] px-3.5 py-1 rounded-full font-mono uppercase tracking-wider font-extrabold bg-white/[0.06] text-white border border-white/[0.12]">
              ROLE: DESIGNATED ADJUDICATOR
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-none">
            Designated <span className="text-gradient-amber">Adjudication Desk</span>
          </h1>
          <p className="text-slate-300 text-sm md:text-base mt-3 max-w-2xl leading-relaxed">
            Independent arbitration workstation. Verify cryptographic loss evidence from the Vault Owner, enforce policy terms, and trigger atomic 1-transaction payout and qualification revocation.
          </p>
        </div>

        {/* Current Auth Status Card */}
        <div className="p-4 rounded-2xl bg-black/60 border border-white/[0.12] backdrop-blur-2xl text-xs font-mono space-y-2">
          <div className="text-slate-400 text-[10px] uppercase font-bold">Active Authenticated Key</div>
          <div className="text-amber-400 font-bold truncate max-w-[260px]">{user.address}</div>
          {!isAdjudicator && (
            <button
              onClick={() => switchRole('ADJUDICATOR')}
              className="w-full py-1.5 px-3 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 text-[11px] font-bold transition-all"
            >
              Switch to Adjudicator Key ⚡
            </button>
          )}
        </div>
      </div>

      {actionMsg && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-amber-300 font-mono text-xs flex items-center gap-3 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* PENDING CLAIMS ACTION CENTER */}
      <section className="glass-panel-elevated specular-amber rounded-[32px] p-8 md:p-10 space-y-6">
        <div className="flex justify-between items-center pb-5 border-b border-white/[0.08]">
          <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_10px_#f59e0b] animate-pulse" />
              <span>Pending Claims Requiring Adjudication ({pendingClaims.length})</span>
            </h2>
            <p className="text-xs text-slate-300 font-mono mt-1">
              Approving a claim automatically debits BondPool, pays the vault, and revokes the agent&apos;s spending authority.
            </p>
          </div>
          <span className="text-xs font-mono px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">
            {pendingClaims.length} Open Claims
          </span>
        </div>

        {pendingClaims.length === 0 ? (
          <div className="py-12 text-center text-xs font-mono text-slate-400 border border-white/[0.08] rounded-2xl bg-black/30">
            No claims currently pending adjudication. The Owner can file a claim from the{' '}
            <Link href="/portals/owner" className="text-cyan-400 underline">
              Owner Portal
            </Link>.
          </div>
        ) : (
          <div className="space-y-4">
            {pendingClaims.map((claim) => (
              <div
                key={claim.id}
                className="p-6 rounded-2xl bg-black/60 border border-amber-500/40 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-lg backdrop-blur-xl"
              >
                <div className="space-y-2 font-mono text-xs">
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px] uppercase">
                      Claim #{claim.id}
                    </span>
                    <span className="text-white font-bold">Payment #{claim.paymentId}</span>
                  </div>
                  <div className="text-slate-300">
                    Claimed Loss: <strong className="text-white">{formatUSDC(claim.lossAmount)}</strong> • Net Payout: <strong className="text-emerald-400">{formatUSDC(claim.payout)}</strong> ($5 deductible)
                  </div>
                  <div className="text-slate-500 text-[10px] truncate max-w-md">
                    Evidence Hash: {claim.evidenceHash}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => handleAdjudicate(claim.claimId || parseInt(claim.id, 10), true)}
                    disabled={adjudicatingId === (claim.claimId || parseInt(claim.id, 10))}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-white font-bold text-xs uppercase shadow-md active:scale-95 transition-all"
                  >
                    ✓ Approve &amp; Atomic Revoke
                  </button>
                  <button
                    onClick={() => handleAdjudicate(claim.claimId || parseInt(claim.id, 10), false)}
                    disabled={adjudicatingId === (claim.claimId || parseInt(claim.id, 10))}
                    className="px-4 py-2.5 rounded-xl bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40 font-bold text-xs uppercase active:scale-95 transition-all"
                  >
                    ✕ Dismiss Claim
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ADJUDICATION REGISTRY HISTORY */}
      <div className="glass-panel specular-indigo rounded-[32px] overflow-hidden p-8 space-y-6">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
          <span>Settlement &amp; Revocation Registry</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-black/40 text-slate-300 border-b border-white/[0.08]">
              <tr>
                <th className="py-3 px-4 font-bold">Claim ID</th>
                <th className="py-3 px-4 font-bold">Payment Ref</th>
                <th className="py-3 px-4 font-bold">Loss Amount</th>
                <th className="py-3 px-4 font-bold">Reimbursed Payout</th>
                <th className="py-3 px-4 font-bold">Status</th>
                <th className="py-3 px-4 font-bold">Atomic Consequence Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-slate-300">
              {settledClaims.map((c) => (
                <tr key={c.id} className="hover:bg-white/[0.03]">
                  <td className="py-4 px-4 font-bold text-white">#{c.id}</td>
                  <td className="py-4 px-4">Payment #{c.paymentId}</td>
                  <td className="py-4 px-4 text-amber-300 font-bold">{formatUSDC(c.lossAmount)}</td>
                  <td className="py-4 px-4 text-emerald-400 font-bold">{formatUSDC(c.payout)}</td>
                  <td className="py-4 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      c.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-slate-400 text-[11px] truncate max-w-xs">
                    {c.consequenceSummary || 'Settled on-chain.'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';

export default function ClaimsPage() {
  const [claimStatus, setClaimStatus] = useState<'IDLE' | 'FILED' | 'APPROVED'>('APPROVED');
  const [paymentId, setPaymentId] = useState('1');
  const [lossAmount, setLossAmount] = useState('150.00');

  // Adjudicator simulated execution
  const [txHash, setTxHash] = useState('0xa2b38b3db17a2b4217164046b5e5e75ef3a784a036050fee73cf7b652a76059e');
  const [payout, setPayout] = useState('145.00');

  const handleApprove = () => {
    setClaimStatus('APPROVED');
    setPayout('145.00');
    setTxHash('0xa2b38b3db17a2b4217164046b5e5e75ef3a784a036050fee73cf7b652a76059e');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            BondPool & Claims Adjudication
            <span className="badge-controlled text-xs px-2.5 py-1 rounded-full font-mono uppercase">
              QG-2 Verified
            </span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Collateral backing, independent loss adjudication, and atomic qualification revocation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="badge-controlled text-xs px-3 py-1.5 rounded-lg font-mono font-semibold">
            DESIGNATED ADJUDICATOR KEY: 0x6Bf3...76Af9
          </span>
        </div>
      </div>

      {/* Bond Capital Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="rounded-xl bg-[#0f172a] border border-slate-800 p-5 space-y-1">
          <div className="text-[11px] font-mono text-slate-500 uppercase">Total Locked Capital</div>
          <div className="text-2xl font-bold font-mono text-white">$2,000.00 <span className="text-xs text-slate-500 font-sans">USDC</span></div>
          <div className="text-[11px] text-sky-400">Backs unreviewed T1 spend</div>
        </div>

        <div className="rounded-xl bg-[#0f172a] border border-slate-800 p-5 space-y-1">
          <div className="text-[11px] font-mono text-slate-500 uppercase">Policy Deductible</div>
          <div className="text-2xl font-bold font-mono text-amber-400">$5.00 <span className="text-xs text-slate-500 font-sans">USDC</span></div>
          <div className="text-[11px] text-slate-400">PV-04: Business first-loss floor</div>
        </div>

        <div className="rounded-xl bg-[#0f172a] border border-slate-800 p-5 space-y-1">
          <div className="text-[11px] font-mono text-slate-500 uppercase">Per-Claim Payout Cap</div>
          <div className="text-2xl font-bold font-mono text-white">$500.00 <span className="text-xs text-slate-500 font-sans">USDC</span></div>
          <div className="text-[11px] text-slate-400">PV-04: Maximum single recovery</div>
        </div>

        <div className="rounded-xl bg-[#0f172a] border border-slate-800 p-5 space-y-1">
          <div className="text-[11px] font-mono text-slate-500 uppercase">Claim Grace Period</div>
          <div className="text-2xl font-bold font-mono text-emerald-400">7 Days</div>
          <div className="text-[11px] text-slate-400">604,800s post qualification expiry</div>
        </div>
      </div>

      {/* Interactive Claims Workflow (P8-T07) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Step 1: File Claim */}
        <div className="rounded-2xl bg-[#0f172a] border border-slate-800 p-6 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-800">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>1. File Erroneous Payment Claim</span>
            </h2>
            <span className="badge-scripted text-[11px] px-2 py-0.5 rounded font-mono">
              OWNER ACTION
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Vault owners can file claims on unreconciled autonomous T1 payments within the grace period.
          </p>

          <div className="space-y-3 text-xs font-mono">
            <div>
              <label className="text-slate-400 block mb-1">Target Payment ID</label>
              <input
                type="text"
                value={paymentId}
                onChange={e => setPaymentId(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Demonstrated Loss Amount (USDC)</label>
              <input
                type="text"
                value={lossAmount}
                onChange={e => setLossAmount(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Evidence Hash</label>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 truncate">
                0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069
              </div>
            </div>

            <button
              onClick={() => setClaimStatus('FILED')}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg transition"
            >
              Submit Claim to Adjudicator
            </button>
          </div>
        </div>

        {/* Step 2: Adjudication & Atomic Revocation */}
        <div className="rounded-2xl bg-[#0f172a] border border-slate-800 p-6 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>2. Atomic Consequence Adjudication</span>
              </h2>
              <span className={`text-[11px] font-mono px-2 py-0.5 rounded font-bold ${
                claimStatus === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
              }`}>
                STATUS: {claimStatus}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2 mb-4">
              Approved claims execute payout to the vault AND atomically nullify agent qualification in a single transaction.
            </p>

            {claimStatus === 'APPROVED' ? (
              <div className="space-y-3 text-xs font-mono">
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 space-y-1">
                  <div className="text-emerald-400 font-bold uppercase text-[10px]">Outcome 2: Atomic Settlement</div>
                  <div className="text-white text-sm font-bold">
                    Payout: ${payout} USDC Transferred to Vault
                  </div>
                  <div className="text-[11px] text-slate-300">
                    Formula: min(Loss $150 - Deductible $5, Cap $500, Remaining $2000) = $145.00
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 space-y-1">
                  <div className="text-rose-400 font-bold uppercase text-[10px]">Outcome 3: Consequence Enforced</div>
                  <div className="text-white text-sm font-bold">
                    Agent Qualification Permanently Revoked
                  </div>
                  <div className="text-[11px] text-slate-300">
                    Next agent payment reverts with: <span className="text-rose-300 font-bold">NoActiveQualification()</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-400 truncate">
                  Tx: {txHash}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-lg">
                Claim #1 is filed and awaiting adjudicator key review.
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800">
            <button
              onClick={handleApprove}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition shadow-lg shadow-emerald-600/20 text-xs font-mono"
            >
              Approve Claim (Designated Adjudicator Key)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

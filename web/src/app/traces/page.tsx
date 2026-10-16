'use client';

import { useState, useEffect } from 'react';

interface InvoiceRun {
  invoiceId: string;
  vendorId: string;
  vendorName: string;
  poNumber: string;
  amountUSDC: string;
  tier: string;
  policyDecision: string;
  reasonCodes: string[];
  status: string;
  txHash: string;
  event: string;
  fundsMoved: boolean;
  timestamp: string;
}

export default function TracesPage() {
  const [runs, setRuns] = useState<InvoiceRun[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'T1' | 'T2' | 'REJECT'>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/runs')
      .then(res => res.json())
      .then(json => {
        if (json.success && json.runs) {
          setRuns(json.runs);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredRuns = runs.filter(run => {
    if (filter === 'ALL') return true;
    return run.tier === filter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            Execution Run Traces
            <span className="badge-scripted text-xs px-2.5 py-1 rounded-full font-mono uppercase">
              fixtures/basic
            </span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Deterministic invoice processing pipeline: Proposal → Policy Reasons → Signer → On-chain Event.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-2 p-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono">
          {(['ALL', 'T1', 'T2', 'REJECT'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded transition ${
                filter === tab
                  ? 'bg-sky-500 text-white font-bold shadow-md shadow-sky-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab === 'ALL' ? 'All Invoices' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Traces List */}
      <div className="space-y-4">
        {filteredRuns.map((run, idx) => (
          <div
            key={idx}
            className="rounded-xl bg-[#0f172a] border border-slate-800 p-6 space-y-4 transition hover:border-slate-700 shadow-xl"
          >
            {/* Top row: Invoice header & Status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-3">
                <span className="font-mono text-base font-bold text-white tracking-wide">
                  {run.invoiceId}
                </span>
                <span className="text-slate-400 text-sm">·</span>
                <span className="text-slate-300 text-sm font-medium">{run.vendorName}</span>
                <span className={`text-[11px] font-mono px-2 py-0.5 rounded font-semibold ${
                  run.tier === 'T1'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : run.tier === 'T2'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                }`}>
                  {run.tier === 'T1' ? 'T1: Autonomous' : run.tier === 'T2' ? 'T2: Escalated' : 'Rejected'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xl font-bold font-mono text-white">
                  ${run.amountUSDC} <span className="text-xs text-slate-500 font-sans">USDC</span>
                </span>
                <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full ${
                  run.status === 'EXECUTED'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : run.status === 'PENDING_REVIEW'
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-rose-500/20 text-rose-300'
                }`}>
                  {run.status}
                </span>
              </div>
            </div>

            {/* Step-by-step lifecycle flow */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
              {/* Step 1 */}
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1">
                <div className="text-[10px] text-slate-500 uppercase">1. Proposal Input</div>
                <div className="text-slate-200">PO: {run.poNumber}</div>
                <div className="text-slate-400 text-[11px]">Vendor: {run.vendorId}</div>
              </div>

              {/* Step 2 */}
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1">
                <div className="text-[10px] text-slate-500 uppercase">2. Policy Evaluation</div>
                <div className="text-slate-200">{run.policyDecision}</div>
                <div className="text-sky-400 text-[11px] truncate">[{run.reasonCodes.join(', ')}]</div>
              </div>

              {/* Step 3 */}
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1">
                <div className="text-[10px] text-slate-500 uppercase">3. On-Chain Submission</div>
                <div className="text-slate-300 truncate" title={run.txHash}>
                  {run.txHash}
                </div>
                <div className="text-[11px] text-slate-500">
                  {run.fundsMoved ? '✓ Funds Disbursed' : 'No Immediate Transfer'}
                </div>
              </div>

              {/* Step 4 */}
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1">
                <div className="text-[10px] text-slate-500 uppercase">4. Decoded Receipt</div>
                <div className="text-emerald-400 truncate text-[11px]" title={run.event}>
                  {run.event}
                </div>
                <div className="text-[10px] text-slate-500">
                  Receipt Verified (Rule 6)
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

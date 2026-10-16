export default function TracesPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Execution Traces & Receipts</h1>
          <p className="text-slate-400 text-sm mt-1">
            End-to-end invoice lifecycle: Proposal → Policy Evaluation → Calldata Signer → On-chain Receipt.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge-scripted text-xs px-2.5 py-1 rounded font-mono">
            Source: evidence/transcripts/
          </span>
        </div>
      </div>

      <div className="rounded-xl bg-[#0f172a] border border-slate-800 p-6">
        <h2 className="text-lg font-bold text-white mb-4">Sample Trace: basic fixture (5 invoices)</h2>
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-white">INV-001 (Acme Industrial)</span>
                <span className="badge-scripted text-xs px-2 py-0.5 rounded font-mono">T1_AUTONOMOUS</span>
              </div>
              <div className="text-xs text-slate-400">
                Amount: 50.00 USDC · PO: PO-101 · Reason: VALID_MATCH
              </div>
            </div>
            <div className="text-right">
              <span className="text-emerald-400 text-xs font-mono font-semibold">EXECUTED</span>
              <div className="text-[10px] text-slate-500 font-mono">Tx: 0x7a3...e91</div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-white">INV-002 (Globex Logistics)</span>
                <span className="badge-controlled text-xs px-2 py-0.5 rounded font-mono">T2_ESCALATED</span>
              </div>
              <div className="text-xs text-slate-400">
                Amount: 450.00 USDC · Exceeds T1 limit ($180) → Pending Owner Approval
              </div>
            </div>
            <div className="text-right">
              <span className="text-amber-400 text-xs font-mono font-semibold">PENDING_REVIEW</span>
              <div className="text-[10px] text-slate-500 font-mono">Challenge: 300s</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

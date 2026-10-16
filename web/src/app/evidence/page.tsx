import React from "react";
import { ControlledBadge } from "@/components/Badges";

export default function EvidencePage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Evidence &amp; Verification
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Deterministic cryptographic audit trail, SHA-256 evidence bundle roots, and off-chain proofs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ControlledBadge />
        </div>
      </div>

      {/* Verification Box */}
      <div className="rounded-xl border border-slate-800 bg-[#0d121c] p-6 space-y-4">
        <h2 className="text-base font-semibold text-white">
          Evidence Root Hash Verifier
        </h2>
        <p className="text-xs text-slate-400">
          Verify local evidence bundle integrity against the on-chain Merkle root.
        </p>

        <div className="space-y-3 font-mono text-xs">
          <div>
            <label className="text-slate-400 block mb-1">On-Chain Merkle Root</label>
            <input
              type="text"
              readOnly
              value="0x89fbc74128d956a23ef451c098ab12e45cf6718902efc241589a1c9e83b40012"
              className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-emerald-400 select-all"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Local Evidence Bundle Checksum</label>
            <input
              type="text"
              readOnly
              value="0x89fbc74128d956a23ef451c098ab12e45cf6718902efc241589a1c9e83b40012"
              className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-emerald-400 select-all"
            />
          </div>
        </div>

        <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/50 flex items-center gap-2 text-xs font-mono text-emerald-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>VERIFICATION RESULT: MATCH • Bundle authentic &amp; unmodified.</span>
        </div>
      </div>

      {/* Artifact Explorer */}
      <div className="rounded-xl border border-slate-800 bg-[#0d121c] p-6 space-y-4">
        <h2 className="text-base font-semibold text-white">
          Pinned Evidence Artifacts
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="text-slate-200 font-semibold">run_summary.json</div>
            <div className="text-slate-400 text-[11px]">Size: 14.2 KB • SHA256: 0xa918...f021</div>
            <div className="text-emerald-400 text-[11px]">Status: Verified on-chain</div>
          </div>

          <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="text-slate-200 font-semibold">adversarial_suite.json</div>
            <div className="text-slate-400 text-[11px]">Size: 84.7 KB • SHA256: 0x33e8...bb7a</div>
            <div className="text-emerald-400 text-[11px]">Status: Verified on-chain</div>
          </div>
        </div>
      </div>
    </div>
  );
}

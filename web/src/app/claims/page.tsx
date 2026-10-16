import React from "react";
import { ControlledBadge, ScriptedBadge } from "@/components/Badges";

const MOCK_CLAIMS = [
  {
    id: "CLM-2026-001",
    policyId: "POL-2026-A1",
    amount: "2,500.00 USDC",
    status: "SETTLED",
    txHash: "0x4e2a...c890",
    invariant: "INV6_PaymentExecutedMatch",
  },
  {
    id: "CLM-2026-002",
    policyId: "POL-2026-A1",
    amount: "7,800.00 USDC",
    status: "SETTLED",
    txHash: "0x1a8d...f334",
    invariant: "INV6_PaymentExecutedMatch",
  },
  {
    id: "CLM-2026-003",
    policyId: "POL-2026-B4",
    amount: "15,000.00 USDC",
    status: "REJECTED_EXCEEDS_TIER_CAP",
    txHash: "N/A (Rejected in Enclave)",
    invariant: "INV4_SingleTxCapEnforced",
  },
];

export default function ClaimsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Claims &amp; Settlements
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Settlement receipts verified with decoded on-chain PaymentExecuted events.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ControlledBadge />
          <ScriptedBadge />
        </div>
      </div>

      {/* Claims List */}
      <div className="rounded-xl border border-slate-800 bg-[#0d121c] overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200">
            Claims Registry
          </h2>
          <span className="text-xs font-mono text-slate-400">
            Rule: Never marked executed without matching event receipt
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/60 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Claim ID</th>
                <th className="py-3 px-4">Policy</th>
                <th className="py-3 px-4">Base Units (USDC)</th>
                <th className="py-3 px-4">Enclave Status</th>
                <th className="py-3 px-4">Receipt / Audit</th>
                <th className="py-3 px-4">Invariant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {MOCK_CLAIMS.map((claim) => (
                <tr key={claim.id} className="hover:bg-slate-850/40">
                  <td className="py-3.5 px-4 font-semibold text-white">{claim.id}</td>
                  <td className="py-3.5 px-4 text-slate-400">{claim.policyId}</td>
                  <td className="py-3.5 px-4 text-emerald-300">{claim.amount}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        claim.status === "SETTLED"
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                          : "bg-rose-950 text-rose-400 border border-rose-800"
                      }`}
                    >
                      {claim.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">{claim.txHash}</td>
                  <td className="py-3.5 px-4 text-cyan-400">{claim.invariant}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

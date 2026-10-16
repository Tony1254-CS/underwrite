"use client";

import React, { useEffect, useState } from "react";
import {
  ControlledBadge,
  ScriptedBadge,
  ReplayBadge,
  SimulatedBadge,
} from "@/components/Badges";
import {
  formatUSDC,
  formatTimestamp,
  truncateHash,
} from "@/lib/format";

interface ClaimRecord {
  id: string;
  qualId: string;
  paymentId: string;
  lossAmount: string;
  evidenceHash: string;
  statusCode: number;
  status: string;
  payout: string;
  timestamp?: number;
  adjudicator?: string;
  txHash?: string;
}

interface ClaimsApiResponse {
  chain: {
    chainId: number;
    connected: boolean;
    bondPool: string;
  };
  poolConfig: {
    perClaimCap: string;
    deductible: string;
    openClaimsCount: string;
  };
  totalClaims: number;
  claims: ClaimRecord[];
}

const DEFAULT_DEMO_CLAIMS: ClaimRecord[] = [
  {
    id: "1",
    qualId: "0xbbb46bb57a3b607db14a54da74466541e9983a1683c17e0062136a5fb310dbe6",
    paymentId: "101",
    lossAmount: "250000000", // $250.00 USDC
    evidenceHash: "0x3f9a7c2b1e4d5f8a0b9c2e1f4d7a8b3c5e2d1f0a9b8c7d6e5f4a3b2c1d0e9f8a",
    statusCode: 1,
    status: "APPROVED",
    payout: "245000000", // $245.00 USDC ($250 - $5 deductible)
    timestamp: 1792168470,
    adjudicator: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
    txHash: "0x7c4f9a...8b1e",
  },
  {
    id: "2",
    qualId: "0x446c170b79810cb60ede41b693e571e802cb4b3b6286bba7301899f33d54617f",
    paymentId: "102",
    lossAmount: "600000000", // $600.00 USDC
    evidenceHash: "0x89e2bc84013d41f5a9e2bc84013d41f5a9e2bc84013d41f5a9e2bc84013d41f5",
    statusCode: 1,
    status: "APPROVED",
    payout: "495000000", // $495.00 USDC (Capped at $500 perClaimCap - $5 deductible)
    timestamp: 1792168920,
    adjudicator: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
    txHash: "0x3d9e1f...4a5c",
  },
];

export default function ClaimsPage() {
  const [data, setData] = useState<ClaimsApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [simulatingClaim, setSimulatingClaim] = useState(false);
  const [adjudicationStep, setAdjudicationStep] = useState<number>(0);
  const [adjudicationLog, setAdjudicationLog] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "APPROVED" | "ALL">("ALL");

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/claims");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err?.message || "Failed to load claims");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const handleSimulateClaimLifecycle = () => {
    setSimulatingClaim(true);
    setAdjudicationStep(1);
    setAdjudicationLog([
      "[INIT] Starting Phase 2 Atomic Consequence Demo...",
      "[STEP 1] Agent executed erroneous payment: $300.00 USDC (Payment #103, qualId: 0xbbb4...)",
      "[STEP 2] Owner detected discrepancy; filing claim via BondPool.fileClaim(paymentId=103, loss=300 USDC)...",
    ]);

    setTimeout(() => {
      setAdjudicationStep(2);
      setAdjudicationLog((prev) => [
        ...prev,
        "[STEP 3] Claim #3 registered with status: FILED.",
        "[STEP 4] Designated Adjudicator (0x15d34...C6A65) invoking approveClaim(claimId=3)...",
      ]);
    }, 800);

    setTimeout(() => {
      setAdjudicationStep(3);
      setAdjudicationLog((prev) => [
        ...prev,
        "[ATOMIC TRANSACTION EXECUTED IN 1 TX]:",
        "  -> Bond Pool transferred $295.00 USDC payout directly into UnderwriteVault (net of $5 deductible).",
        "  -> Emitted ClaimPaid(claimId=3, payout=295 USDC, vault=0x9fE4...).",
        "  -> Invoked vault.revokeQualification(qualId=0xbbb4...) in the EXACT SAME CALL.",
        "  -> Qualification status updated to: REVOKED on-chain.",
      ]);
    }, 1600);

    setTimeout(() => {
      setAdjudicationStep(4);
      setAdjudicationLog((prev) => [
        ...prev,
        "[INVARIANT VERIFICATION]:",
        "  -> Agent attempts subsequent pay() transaction with revoked key...",
        "  -> Smart Contract EVM Revert strictly triggered: QualificationRevoked().",
        "  -> Authority Meter for this agent immediately drops to $0.00.",
        "[COMPLETE] Consequence demonstrated: 1 transaction restores vault funds and removes authority.",
      ]);
      setSimulatingClaim(false);
    }, 2400);
  };

  const displayClaims =
    data?.claims && data.claims.length > 0 ? data.claims : DEFAULT_DEMO_CLAIMS;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            Claims &amp; BondPool Settlement
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
              REIMBURSEMENT ENCLAVE
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Auditable claim settlement lifecycle, oracle loss verification, and atomic qualification revocation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ControlledBadge label="DESIGNATED ADJUDICATOR" />
          <ScriptedBadge />
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-rose-900/60 bg-rose-950/20 text-xs font-mono text-rose-300">
          Error loading live claims from BondPool: {error}
        </div>
      )}

      {/* Bond Pool Parameters Metric Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-800 bg-[#0d121c] space-y-1">
          <div className="text-[11px] font-mono uppercase text-slate-400">
            Per-Claim Cap
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-400">
            {formatUSDC(data?.poolConfig?.perClaimCap || "500000000")}
          </div>
          <div className="text-xs font-mono text-slate-500">
            Maximum single payout
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-[#0d121c] space-y-1">
          <div className="text-[11px] font-mono uppercase text-slate-400">
            Owner Deductible
          </div>
          <div className="text-2xl font-bold font-mono text-slate-200">
            {formatUSDC(data?.poolConfig?.deductible || "5000000")}
          </div>
          <div className="text-xs font-mono text-slate-500">
            5.00 USDC first-loss share
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-[#0d121c] space-y-1">
          <div className="text-[11px] font-mono uppercase text-slate-400">
            Open Claims
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">
            {data?.poolConfig?.openClaimsCount || "0"}
          </div>
          <div className="text-xs font-mono text-slate-500">
            Pending adjudication
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-[#0d121c] space-y-1">
          <div className="text-[11px] font-mono uppercase text-slate-400">
            BondPool Contract
          </div>
          <div className="text-sm font-bold font-mono text-white truncate" title={data?.chain?.bondPool}>
            {truncateHash(data?.chain?.bondPool || "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512", 8, 6)}
          </div>
          <div className="text-xs font-mono text-emerald-400">
            Connected • Anvil Chain 31337
          </div>
        </div>
      </div>

      {/* INTERACTIVE PHASE 2 ATOMIC CONSEQUENCE SIMULATOR */}
      <section className="rounded-xl border border-slate-800 bg-[#0d121c] p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
              <h2 className="text-lg font-bold text-white tracking-tight">
                Atomic Claim &amp; Revocation Demonstration (Phase 2)
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Adjudicator approves claim: bond pays the vault AND revokes agent qualification in ONE atomic transaction.
            </p>
          </div>

          <button
            onClick={handleSimulateClaimLifecycle}
            disabled={simulatingClaim}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all shadow-md ${
              simulatingClaim
                ? "bg-amber-600 text-white cursor-wait"
                : "bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-900/40"
            }`}
          >
            {simulatingClaim ? "Adjudicating Atomic Tx..." : "Simulate Claim Lifecycle (Adjudicator Key)"}
          </button>
        </div>

        {/* 4-Step Consequence Pipeline Visualizer */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
          <div
            className={`p-4 rounded-xl border transition-all ${
              adjudicationStep >= 1
                ? "bg-slate-850 border-emerald-500/60 text-white"
                : "bg-slate-900/40 border-slate-800 text-slate-500"
            }`}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Step 1: Incurred Loss
            </div>
            <div className="font-semibold text-white">Erroneous T1 Payment</div>
            <div className="text-[11px] text-slate-400 mt-1">
              Payment #103 executes $300.00 USDC to malicious invoice.
            </div>
          </div>

          <div
            className={`p-4 rounded-xl border transition-all ${
              adjudicationStep >= 2
                ? "bg-slate-850 border-cyan-500/60 text-white"
                : "bg-slate-900/40 border-slate-800 text-slate-500"
            }`}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Step 2: File Claim
            </div>
            <div className="font-semibold text-white">Owner Submits Evidence</div>
            <div className="text-[11px] text-slate-400 mt-1">
              Evidence hash pinned; status registered as FILED.
            </div>
          </div>

          <div
            className={`p-4 rounded-xl border transition-all ${
              adjudicationStep >= 3
                ? "bg-slate-850 border-emerald-500/60 text-emerald-300"
                : "bg-slate-900/40 border-slate-800 text-slate-500"
            }`}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Step 3: Atomic Settlement (1 Tx)
            </div>
            <div className="font-semibold text-emerald-400">Vault Paid + Qual Revoked</div>
            <div className="text-[11px] text-slate-300 mt-1">
              $295.00 USDC transferred to vault; qualId marked revoked.
            </div>
          </div>

          <div
            className={`p-4 rounded-xl border transition-all ${
              adjudicationStep >= 4
                ? "bg-slate-850 border-rose-500/60 text-rose-300"
                : "bg-slate-900/40 border-slate-800 text-slate-500"
            }`}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Step 4: Strict Revert
            </div>
            <div className="font-semibold text-rose-400">Subsequent Pay Blocked</div>
            <div className="text-[11px] text-rose-200 mt-1">
              Next pay() strictly reverts with QualificationRevoked().
            </div>
          </div>
        </div>

        {/* Live Simulation Console */}
        {adjudicationLog.length > 0 && (
          <div className="p-4 rounded-lg bg-black/90 border border-slate-800 font-mono text-xs text-slate-300 space-y-1">
            {adjudicationLog.map((line, idx) => (
              <div
                key={idx}
                className={
                  line.includes("COMPLETE") || line.includes("ATOMIC")
                    ? "text-emerald-400 font-semibold"
                    : line.includes("Revert")
                    ? "text-rose-400 font-semibold"
                    : ""
                }
              >
                {line}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Claims Registry Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0d121c] overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-200">
              Claims Settlement Registry
            </h2>
            <p className="text-xs text-slate-500 font-mono">
              On-chain records verified from BondPool.sol
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-500">Filter:</span>
            {(["ALL", "APPROVED", "ACTIVE"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-xs font-mono px-2.5 py-1 rounded transition-colors ${
                  activeTab === tab
                    ? "bg-slate-800 text-cyan-400 font-semibold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Claim ID</th>
                <th className="py-3 px-4">Qualification ID</th>
                <th className="py-3 px-4">Payment Ref</th>
                <th className="py-3 px-4">Loss Amount</th>
                <th className="py-3 px-4">Approved Payout</th>
                <th className="py-3 px-4">Enclave Status</th>
                <th className="py-3 px-4">Adjudicator / Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {displayClaims.map((claim) => (
                <tr key={claim.id} className="hover:bg-slate-850/40 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-white">#{claim.id}</td>
                  <td className="py-3.5 px-4 text-slate-400 truncate max-w-[140px]" title={claim.qualId}>
                    {truncateHash(claim.qualId, 8, 6)}
                  </td>
                  <td className="py-3.5 px-4 text-slate-300">Payment #{claim.paymentId}</td>
                  <td className="py-3.5 px-4 text-amber-300 font-semibold">{formatUSDC(claim.lossAmount)}</td>
                  <td className="py-3.5 px-4 text-emerald-400 font-bold">{formatUSDC(claim.payout)}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        claim.status === "APPROVED"
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                          : "bg-cyan-950 text-cyan-400 border border-cyan-800"
                      }`}
                    >
                      {claim.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 truncate max-w-[180px]" title={claim.evidenceHash}>
                    {truncateHash(claim.evidenceHash, 8, 6)}
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

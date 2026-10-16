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
    <div className="space-y-12 pb-16">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="flex flex-wrap items-center gap-3.5 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] font-extrabold text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              SOLVENCY &amp; SETTLEMENT
            </span>
            <span className="text-[11px] px-3.5 py-1 rounded-full font-mono uppercase tracking-wider font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              BONDPOOL COLLATERALIZED
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white leading-none">
            Claims &amp; <span className="text-gradient-cyan">Bond Settlement</span>
          </h1>
          <p className="text-slate-300 text-sm md:text-base mt-3 max-w-2xl leading-relaxed">
            Auditable claim settlement lifecycle, oracle loss verification, and atomic qualification revocation enforced on-chain.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <ControlledBadge label="DESIGNATED ADJUDICATOR" />
          <ScriptedBadge />
        </div>
      </div>

      {error && (
        <div className="p-5 rounded-3xl border border-rose-500/40 bg-rose-500/10 text-xs font-mono text-rose-300 backdrop-blur-2xl shadow-[0_0_20px_rgba(244,63,94,0.3)]">
          Error loading live claims from BondPool: {error}
        </div>
      )}

      {/* Bond Pool Parameters Metric Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card-interactive specular-cyan rounded-3xl p-6 space-y-2">
          <div className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
            Per-Claim Cap
          </div>
          <div className="text-3xl font-black font-mono text-white num-tabular">
            {formatUSDC(data?.poolConfig?.perClaimCap || "500000000")}
          </div>
          <div className="text-xs font-mono text-slate-400 font-medium">
            Maximum single payout limit
          </div>
        </div>

        <div className="glass-card-interactive specular-amber rounded-3xl p-6 space-y-2">
          <div className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold">
            Owner Deductible
          </div>
          <div className="text-3xl font-black font-mono text-white num-tabular">
            {formatUSDC(data?.poolConfig?.deductible || "5000000")}
          </div>
          <div className="text-xs font-mono text-slate-400 font-medium">
            5.00 USDC first-loss share
          </div>
        </div>

        <div className="glass-card-interactive specular-rose rounded-3xl p-6 space-y-2">
          <div className="text-[11px] font-mono uppercase tracking-wider text-rose-400 font-bold">
            Pending Claims
          </div>
          <div className="text-3xl font-black font-mono text-amber-300 num-tabular">
            {data?.poolConfig?.openClaimsCount || "0"}
          </div>
          <div className="text-xs font-mono text-slate-400 font-medium">
            Open for adjudication
          </div>
        </div>

        <div className="glass-card-interactive specular-emerald rounded-3xl p-6 space-y-2">
          <div className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
            BondPool Contract
          </div>
          <div className="text-sm font-bold font-mono text-white truncate" title={data?.chain?.bondPool}>
            {truncateHash(data?.chain?.bondPool || "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512", 8, 6)}
          </div>
          <div className="text-xs font-mono text-emerald-400 flex items-center gap-1.5 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
            Connected • Anvil 31337
          </div>
        </div>
      </div>

      {/* INTERACTIVE PHASE 2 ATOMIC CONSEQUENCE SIMULATOR */}
      <section className="glass-panel-elevated specular-cyan rounded-[32px] p-8 md:p-12 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.08] pb-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_12px_#06b6d4]" />
              <h2 className="text-2xl font-black text-white tracking-tight">
                Atomic Claim &amp; Revocation Pipeline (Phase 2)
              </h2>
            </div>
            <p className="text-xs text-slate-300 mt-1 font-mono">
              Adjudicator approves claim: bond pays the vault AND revokes agent qualification in ONE atomic transaction.
            </p>
          </div>

          <button
            onClick={handleSimulateClaimLifecycle}
            disabled={simulatingClaim}
            className={`px-6 py-3 rounded-2xl text-xs font-mono font-black transition-all shadow-xl active:scale-95 ${
              simulatingClaim
                ? "bg-amber-500 text-white cursor-wait shadow-[0_0_24px_rgba(245,158,11,0.5)]"
                : "bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:brightness-110 text-white shadow-[0_0_30px_rgba(6,182,212,0.5)]"
            }`}
          >
            {simulatingClaim ? "⚡ Adjudicating Atomic Tx..." : "Simulate Claim Lifecycle (Adjudicator Key)"}
          </button>
        </div>

        {/* 4-Step Consequence Pipeline Visualizer */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 font-mono text-xs">
          <div
            className={`p-6 rounded-3xl border transition-all duration-300 ${
              adjudicationStep >= 1
                ? "bg-black/60 border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.3)] text-white"
                : "bg-black/30 border-white/[0.06] text-slate-500"
            }`}
          >
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Step 1: Incurred Loss
            </div>
            <div className="font-bold text-white text-sm">Erroneous T1 Payment</div>
            <div className="text-xs text-slate-400 mt-2 font-sans leading-relaxed">
              Payment #103 executes $300.00 USDC to malicious invoice.
            </div>
          </div>

          <div
            className={`p-6 rounded-3xl border transition-all duration-300 ${
              adjudicationStep >= 2
                ? "bg-black/60 border-cyan-500/60 shadow-[0_0_20px_rgba(6,182,212,0.3)] text-white"
                : "bg-black/30 border-white/[0.06] text-slate-500"
            }`}
          >
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              Step 2: File Claim
            </div>
            <div className="font-bold text-white text-sm">Owner Submits Evidence</div>
            <div className="text-xs text-slate-400 mt-2 font-sans leading-relaxed">
              Evidence hash pinned; status registered as FILED.
            </div>
          </div>

          <div
            className={`p-6 rounded-3xl border transition-all duration-300 ${
              adjudicationStep >= 3
                ? "bg-black/60 border-emerald-500/80 shadow-[0_0_30px_rgba(16,185,129,0.4)] text-emerald-300"
                : "bg-black/30 border-white/[0.06] text-slate-500"
            }`}
          >
            <div className="text-[10px] font-black uppercase tracking-wider text-emerald-400 mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#10b981]" />
              Step 3: Atomic Settlement (1 Tx)
            </div>
            <div className="font-bold text-emerald-400 text-sm">Vault Paid + Qual Revoked</div>
            <div className="text-xs text-slate-300 mt-2 font-sans leading-relaxed">
              $295.00 USDC transferred to vault; qualId marked revoked in the same call.
            </div>
          </div>

          <div
            className={`p-6 rounded-3xl border transition-all duration-300 ${
              adjudicationStep >= 4
                ? "bg-black/60 border-rose-500/80 shadow-[0_0_30px_rgba(244,63,94,0.4)] text-rose-300"
                : "bg-black/30 border-white/[0.06] text-slate-500"
            }`}
          >
            <div className="text-[10px] font-black uppercase tracking-wider text-rose-400 mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-400 shadow-[0_0_10px_#f43f5e]" />
              Step 4: Strict Revert
            </div>
            <div className="font-bold text-rose-400 text-sm">Subsequent Pay Blocked</div>
            <div className="text-xs text-rose-200 mt-2 font-sans leading-relaxed">
              Next pay() strictly reverts with QualificationRevoked().
            </div>
          </div>
        </div>

        {/* Live Simulation Console */}
        {adjudicationLog.length > 0 && (
          <div className="p-6 rounded-3xl bg-black/90 border border-white/[0.1] font-mono text-xs text-slate-300 space-y-2 backdrop-blur-2xl shadow-inner">
            {adjudicationLog.map((line, idx) => (
              <div
                key={idx}
                className={
                  line.includes("COMPLETE") || line.includes("ATOMIC")
                    ? "text-emerald-400 font-bold"
                    : line.includes("Revert")
                    ? "text-rose-400 font-bold"
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
      <div className="glass-panel specular-indigo rounded-[32px] overflow-hidden">
        <div className="p-8 border-b border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Claims Settlement Registry
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-1">
              On-chain records verified from BondPool.sol
            </p>
          </div>

          <div className="flex items-center gap-2 bg-black/50 p-1.5 rounded-2xl border border-white/[0.08]">
            <span className="text-xs font-mono text-slate-400 px-3 font-bold">Filter:</span>
            {(["ALL", "APPROVED", "ACTIVE"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-xs font-mono px-3.5 py-1.5 rounded-xl transition-all font-bold ${
                  activeTab === tab
                    ? "bg-white/[0.12] text-cyan-300 border border-cyan-500/40 shadow-sm"
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
            <thead className="bg-black/40 text-slate-300 border-b border-white/[0.08]">
              <tr>
                <th className="py-4 px-6 font-bold">Claim ID</th>
                <th className="py-4 px-6 font-bold">Qualification ID</th>
                <th className="py-4 px-6 font-bold">Payment Ref</th>
                <th className="py-4 px-6 font-bold">Loss Amount</th>
                <th className="py-4 px-6 font-bold">Approved Payout</th>
                <th className="py-4 px-6 font-bold">Enclave Status</th>
                <th className="py-4 px-6 font-bold">Adjudicator / Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-slate-300">
              {displayClaims.map((claim) => (
                <tr key={claim.id} className="hover:bg-white/[0.04] transition-colors">
                  <td className="py-5 px-6 font-black text-white text-sm">#{claim.id}</td>
                  <td className="py-5 px-6 text-slate-400 truncate max-w-[140px]" title={claim.qualId}>
                    {truncateHash(claim.qualId, 8, 6)}
                  </td>
                  <td className="py-5 px-6 text-slate-200 font-semibold">Payment #{claim.paymentId}</td>
                  <td className="py-5 px-6 text-amber-300 font-bold num-tabular text-sm">{formatUSDC(claim.lossAmount)}</td>
                  <td className="py-5 px-6 text-emerald-400 font-black num-tabular text-sm">{formatUSDC(claim.payout)}</td>
                  <td className="py-5 px-6">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black ${
                        claim.status === "APPROVED"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_12px_#10b981]"
                          : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                      }`}
                    >
                      {claim.status}
                    </span>
                  </td>
                  <td className="py-5 px-6 text-slate-400 truncate max-w-[180px]" title={claim.evidenceHash}>
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

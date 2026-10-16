"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  ReplayBadge,
  ScriptedBadge,
  ControlledBadge,
  SimulatedBadge,
} from "@/components/Badges";
import {
  formatUSDC,
  formatNumber,
  formatTimestamp,
  truncateHash,
} from "@/lib/format";

interface StateData {
  chain: {
    chainId: number;
    name: string;
    rpcUrl: string;
    connected: boolean;
  };
  deployments: {
    vault: string;
    bondPool: string;
    token: string;
    owner: string;
    examiner: string;
    underwriter: string;
    adjudicator: string;
    agentKey?: string;
  };
  walletBalance: {
    vaultUSDC: string;
    reserveFloor: string;
    tokenAddress: string;
  };
  mandate: {
    riskBudgetPerWindow?: string;
    adversarialShare?: number;
    ceilings?: {
      perTx: string;
      perWindow: string;
      t2PerTx: string;
    };
    minUsefulCap?: string;
    windowSeconds?: number;
    challengePeriod?: number;
    recipientCooldown?: number;
  };
  activeQualification: {
    qualId: string;
    details: {
      active: boolean;
      revoked: boolean;
      activatedAt: string;
      effectiveT1MaxPerTx: string;
      effectiveT1MaxPerWindow: string;
      effectiveT2MaxPerTx: string;
      attestation: {
        qualId: string;
        vault: string;
        agentKey: string;
        configHash: string;
        reportHash: string;
        corpusHash: string;
        examCommitId: string;
        t1MaxPerTx: string;
        t1MaxPerWindow: string;
        t2MaxPerTx: string;
        t2Allowed: boolean;
        issuedAt: string;
        expiresAt: string;
        examiner: string;
      };
    } | null;
  };
  ceilings: {
    perTx: string;
    perWindow: string;
    t2PerTx: string;
  };
  windows: {
    windowSeconds: number;
    currentWindowSpent: string;
  };
  unreconciledExposure: string;
  bondRemaining: string;
  paused: boolean;
}

export default function DashboardPage() {
  const [state, setState] = useState<StateData | null>(null);
  const [evidenceCounts, setEvidenceCounts] = useState<{ exams: number; traces: number }>({
    exams: 0,
    traces: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);

      const [stateRes, tracesRes, examsRes] = await Promise.all([
        fetch("/api/state"),
        fetch("/api/traces"),
        fetch("/api/exams"),
      ]);

      if (!stateRes.ok) throw new Error(`HTTP error: ${stateRes.status}`);

      const stateJson = await stateRes.json();
      setState(stateJson);

      let tracesCount = 0;
      if (tracesRes.ok) {
        const tracesJson = await tracesRes.json();
        tracesCount = tracesJson.total || 0;
      }

      let examsCount = 0;
      if (examsRes.ok) {
        const examsJson = await examsRes.json();
        examsCount = examsJson.total || 0;
      }

      setEvidenceCounts({ exams: examsCount, traces: tracesCount });
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err?.message || "Failed to fetch on-chain state");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchData();
    }, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  if (loading && !state) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-slate-800/60 rounded animate-pulse" />
        <div className="h-64 bg-slate-800/40 rounded-xl border border-slate-800 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-48 bg-slate-800/40 rounded-xl border border-slate-800 animate-pulse" />
          <div className="h-48 bg-slate-800/40 rounded-xl border border-slate-800 animate-pulse" />
        </div>
      </div>
    );
  }

  const att = state?.activeQualification?.details?.attestation;
  const t1MaxPerWindow = BigInt(att?.t1MaxPerWindow || "0");
  const currentSpent = BigInt(state?.windows?.currentWindowSpent || "0");
  const bondRemaining = BigInt(state?.bondRemaining || "0");
  const vaultBalance = BigInt(state?.walletBalance?.vaultUSDC || "0");

  // Percentage consumed
  let spendPct = 0;
  if (t1MaxPerWindow > 0n) {
    spendPct = Math.min(100, Math.max(0, Number((currentSpent * 10000n) / t1MaxPerWindow) / 100));
  }

  // Headroom remaining
  const headroomRemaining = t1MaxPerWindow > currentSpent ? t1MaxPerWindow - currentSpent : 0n;

  return (
    <div className="space-y-8">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            Dashboard &amp; Authority Meter
            {state?.paused && (
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800">
                VAULT PAUSED
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time on-chain authority headroom, underwriter bond backing, and evidence anchors.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
            <span
              className={`w-2 h-2 rounded-full ${
                state?.chain?.connected ? "bg-emerald-400" : "bg-rose-400"
              }`}
            />
            <span>{state?.chain?.connected ? state.chain.name : "RPC Disconnected"}</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">ID: {state?.chain?.chainId}</span>
          </div>

          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`text-xs font-mono px-3 py-1.5 rounded-lg border transition-colors ${
              autoRefresh
                ? "bg-emerald-950/60 border-emerald-800 text-emerald-300"
                : "bg-slate-900 border-slate-800 text-slate-400"
            }`}
          >
            Auto: {autoRefresh ? "10s" : "Off"}
          </button>

          <button
            onClick={() => fetchData()}
            disabled={refreshing}
            className="text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors disabled:opacity-50"
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-rose-900/60 bg-rose-950/20 text-xs font-mono text-rose-300 flex items-center justify-between">
          <span>Error loading live state: {error}</span>
          <button
            onClick={() => fetchData()}
            className="underline hover:text-white"
          >
            Retry
          </button>
        </div>
      )}

      {/* Headline Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Vault USDC Balance */}
        <div className="p-5 rounded-xl border border-slate-800 bg-[#0d121c] space-y-1">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
            Vault Balance (MockUSDC)
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {formatUSDC(vaultBalance)}
          </div>
          <div className="text-xs font-mono text-slate-500 truncate" title={state?.deployments?.vault}>
            Vault: {truncateHash(state?.deployments?.vault, 6, 4)}
          </div>
        </div>

        {/* Remaining Underwriter Bond */}
        <div className="p-5 rounded-xl border border-slate-800 bg-[#0d121c] space-y-1">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
            Bond Remaining (BondPool)
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-400">
            {formatUSDC(bondRemaining)}
          </div>
          <div className="text-xs font-mono text-slate-500">
            Backs autonomous Class II loss
          </div>
        </div>

        {/* Unreconciled Exposure */}
        <div className="p-5 rounded-xl border border-slate-800 bg-[#0d121c] space-y-1">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
            Unreconciled Exposure
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">
            {formatUSDC(state?.unreconciledExposure)}
          </div>
          <div className="text-xs font-mono text-slate-500">
            Open pending settlements
          </div>
        </div>

        {/* Evidence Anchors */}
        <div className="p-5 rounded-xl border border-slate-800 bg-[#0d121c] space-y-1">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
            Evidence Anchors
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100 flex items-center gap-2">
            <span>{evidenceCounts.exams} Exams</span>
            <span className="text-xs font-normal text-slate-400">/ {evidenceCounts.traces} Runs</span>
          </div>
          <div className="text-xs font-mono text-slate-500">
            Immutable SHA-256 evidence logs
          </div>
        </div>
      </div>

      {/* THE AUTHORITY METER */}
      <section className="rounded-xl border border-slate-800 bg-[#0d121c] p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)] animate-pulse" />
              <h2 className="text-xl font-bold text-white tracking-tight">
                The Authority Meter
              </h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/80 font-semibold">
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              On-chain autonomous spending capacity enforced by UnderwriteVault smart contract.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-slate-400">Operating Enclave:</span>
            {t1MaxPerWindow > 0n ? (
              <ControlledBadge label="TIER 1 AUTONOMOUS" />
            ) : (
              <ControlledBadge label="TIER 0 DUAL-APPROVAL" />
            )}
            <ScriptedBadge />
          </div>
        </div>

        {/* Visual Gauge Bar */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Window Spent:</span>
              <span className="text-white font-bold">{formatUSDC(currentSpent)}</span>
              <span className="text-slate-500">/ Limit: {formatUSDC(t1MaxPerWindow)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Headroom Remaining:</span>
              <span className="text-emerald-400 font-bold">{formatUSDC(headroomRemaining)}</span>
              <span className="text-slate-500">({spendPct.toFixed(1)}% consumed)</span>
            </div>
          </div>

          {/* Meter Bar */}
          <div className="w-full h-4 rounded-full bg-slate-900 border border-slate-700/80 overflow-hidden relative">
            <div
              className={`h-full transition-all duration-700 rounded-full ${
                spendPct > 80
                  ? "bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500"
                  : "bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500"
              }`}
              style={{ width: `${Math.max(spendPct, t1MaxPerWindow > 0n ? 2 : 0)}%` }}
            />
          </div>

          <div className="flex justify-between text-[11px] font-mono text-slate-500">
            <span>$0.00 Floor</span>
            <span>
              Window Duration: {state?.windows?.windowSeconds ? `${state.windows.windowSeconds / 3600}h` : "24h"}
            </span>
            <span>Max Window Cap: {formatUSDC(t1MaxPerWindow)}</span>
          </div>
        </div>

        {/* 3-Column Authority Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-lg bg-slate-900/70 border border-slate-800 space-y-1">
            <div className="text-[11px] font-mono uppercase text-slate-400">
              Autonomous Single Tx Cap (T1)
            </div>
            <div className="text-xl font-bold font-mono text-slate-100">
              {formatUSDC(att?.t1MaxPerTx || "0")}
            </div>
            <div className="text-xs text-slate-500 font-mono">
              Payments &gt; this cap require human approval (T2)
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-900/70 border border-slate-800 space-y-1">
            <div className="text-[11px] font-mono uppercase text-slate-400">
              Dual-Approval Max (T2)
            </div>
            <div className="text-xl font-bold font-mono text-cyan-400">
              {formatUSDC(att?.t2MaxPerTx || state?.ceilings?.t2PerTx || "0")}
            </div>
            <div className="text-xs text-slate-500 font-mono">
              Status: {att?.t2Allowed ? "Authorized" : "Disabled"}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-900/70 border border-slate-800 space-y-1">
            <div className="text-[11px] font-mono uppercase text-slate-400">
              Solvency Protection
            </div>
            <div className="text-xl font-bold font-mono text-emerald-400">
              INV1..INV14 Active
            </div>
            <div className="text-xs text-slate-500 font-mono">
              Reserve Floor: {formatUSDC(state?.walletBalance?.reserveFloor)}
            </div>
          </div>
        </div>
      </section>

      {/* Side-by-Side: Owner Ceilings vs Attested Limits & Mandate Parameters */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Owner Ceilings vs Attested Limits */}
        <section className="rounded-xl border border-slate-800 bg-[#0d121c] p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-semibold text-white">
              Owner Ceilings vs. Attested Limits
            </h3>
            <span className="text-[11px] font-mono text-slate-400">
              Enclave Min Check
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Tier 1 Per-Transaction Cap:</span>
                <span className="text-slate-200 font-semibold">{formatUSDC(att?.t1MaxPerTx || "0")}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 border-t border-slate-800/60 pt-1.5">
                <span>Owner Configured Ceiling:</span>
                <span>{formatUSDC(state?.ceilings?.perTx)}</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Tier 1 Window Cap:</span>
                <span className="text-emerald-400 font-semibold">{formatUSDC(att?.t1MaxPerWindow || "0")}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 border-t border-slate-800/60 pt-1.5">
                <span>Owner Configured Ceiling:</span>
                <span>{formatUSDC(state?.ceilings?.perWindow)}</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Tier 2 Single-Tx Cap:</span>
                <span className="text-cyan-400 font-semibold">{formatUSDC(att?.t2MaxPerTx || "0")}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 border-t border-slate-800/60 pt-1.5">
                <span>Owner Configured Ceiling:</span>
                <span>{formatUSDC(state?.ceilings?.t2PerTx)}</span>
              </div>
            </div>
          </div>

          <div className="text-[11px] font-mono text-slate-500 leading-relaxed border-t border-slate-800 pt-3">
            Note: On-chain effective limits are computed deterministically as{" "}
            <code className="text-slate-300">min(attestationLimit, ownerCeiling)</code> per smart contract invariant INV4.
          </div>
        </section>

        {/* Active Qualification & Mandate */}
        <section className="rounded-xl border border-slate-800 bg-[#0d121c] p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-semibold text-white">
              Active Agent Qualification &amp; Mandate
            </h3>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
              QUALIFIED
            </span>
          </div>

          <div className="space-y-2.5 font-mono text-xs">
            <div className="flex justify-between pb-2 border-b border-slate-800/60">
              <span className="text-slate-400">Qualification ID:</span>
              <span className="text-slate-200 select-all" title={state?.activeQualification?.qualId}>
                {truncateHash(state?.activeQualification?.qualId, 10, 8)}
              </span>
            </div>

            <div className="flex justify-between pb-2 border-b border-slate-800/60">
              <span className="text-slate-400">Agent Signer Key:</span>
              <span className="text-slate-200 select-all" title={att?.agentKey}>
                {truncateHash(att?.agentKey || state?.deployments?.agentKey, 10, 6)}
              </span>
            </div>

            <div className="flex justify-between pb-2 border-b border-slate-800/60">
              <span className="text-slate-400">Issued Timestamp:</span>
              <span className="text-slate-300">{formatTimestamp(att?.issuedAt)}</span>
            </div>

            <div className="flex justify-between pb-2 border-b border-slate-800/60">
              <span className="text-slate-400">Expires Timestamp:</span>
              <span className="text-slate-300">{formatTimestamp(att?.expiresAt)}</span>
            </div>

            <div className="flex justify-between pb-2 border-b border-slate-800/60">
              <span className="text-slate-400">Challenge Period:</span>
              <span className="text-slate-200">{state?.mandate?.challengePeriod ?? 300}s (5 min)</span>
            </div>

            <div className="flex justify-between pb-2 border-b border-slate-800/60">
              <span className="text-slate-400">Recipient Cool-down:</span>
              <span className="text-slate-200">{state?.mandate?.recipientCooldown ?? 300}s (5 min)</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">Risk Budget (R_window):</span>
              <span className="text-emerald-400 font-semibold">{formatUSDC(state?.mandate?.riskBudgetPerWindow ?? "10000000")}</span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-slate-500 border-t border-slate-800">
            <span>Threat Share Assumption (a):</span>
            <span className="text-slate-300 font-semibold">{((state?.mandate?.adversarialShare ?? 0.2) * 100).toFixed(0)}%</span>
          </div>
        </section>
      </div>

      {/* Footer Info / Provenance */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl border border-slate-800/80 bg-slate-950/40 text-xs font-mono text-slate-500">
        <div>
          Last state sync: {lastUpdated ? lastUpdated.toLocaleTimeString() : "Never"} • RPC Block height verified
        </div>
        <div className="flex items-center gap-2">
          <span>Harness labels:</span>
          <ReplayBadge size="sm" />
          <ControlledBadge size="sm" />
          <SimulatedBadge size="sm" />
        </div>
      </div>
    </div>
  );
}

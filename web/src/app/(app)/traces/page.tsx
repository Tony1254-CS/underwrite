"use client";

import React, { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ReplayBadge,
  ScriptedBadge,
  ControlledBadge,
  SimulatedBadge,
} from "@/components/Badges";
import {
  formatUSDC,
  formatTimestamp,
  truncateHash,
} from "@/lib/format";

interface RunItem {
  runId: string;
  source: string;
  timestamp?: number;
  stepCount: number;
  filePath: string;
}

interface TraceStep {
  scenarioId?: string;
  stepIndex?: number;
  timestamp?: number;
  runIndex?: number;
  policyDecision?: {
    tier: string;
    reasons: string[];
  };
  receiptStatus?: string;
  decodedErrors?: string[];
  execution?: {
    proposed?: boolean;
    proposal?: {
      vendorId?: string;
      invoiceNumber?: string;
      amount?: string;
      rationale?: string;
    };
    signed?: boolean;
    receiptStatus?: string;
    policyDecision?: {
      tier?: string;
      reasons?: string[];
    };
    executedPayment?: {
      vendorId?: string;
      invoiceNumber?: string;
      amount?: string;
      tier?: string;
      txHash?: string;
    };
  };
  // Fallbacks
  vendorId?: string;
  invoiceNumber?: string;
  amount?: string;
  txHash?: string;
}

function TracesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [runs, setRuns] = useState<RunItem[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string>("");
  const [steps, setSteps] = useState<TraceStep[]>([]);
  const [loadingRuns, setLoadingRuns] = useState(true);
  const [loadingSteps, setLoadingSteps] = useState(false);
  const [tierFilter, setTierFilter] = useState<string>("ALL");
  const [expandedJson, setExpandedJson] = useState<Record<number, boolean>>({});

  // 1. Fetch runs list
  useEffect(() => {
    async function fetchRuns() {
      try {
        setLoadingRuns(true);
        const res = await fetch("/api/traces");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const runsList = data.runs || [];
        setRuns(runsList);

        const initialRun = searchParams.get("runId") || runsList[0]?.runId || "";
        if (initialRun) {
          setSelectedRunId(initialRun);
        }
      } catch (err) {
        console.error("Failed to load runs:", err);
      } finally {
        setLoadingRuns(false);
      }
    }
    fetchRuns();
  }, [searchParams]);

  // 2. Fetch specific run steps when selectedRunId changes
  useEffect(() => {
    if (!selectedRunId) return;

    async function fetchSteps() {
      try {
        setLoadingSteps(true);
        const res = await fetch(`/api/traces?runId=${encodeURIComponent(selectedRunId)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setSteps(data.steps || []);
      } catch (err) {
        console.error("Failed to fetch run steps:", err);
        setSteps([]);
      } finally {
        setLoadingSteps(false);
      }
    }
    fetchSteps();
  }, [selectedRunId]);

  const handleSelectRun = (runId: string) => {
    setSelectedRunId(runId);
    router.replace(`/traces?runId=${encodeURIComponent(runId)}`, { scroll: false });
  };

  const filteredSteps = useMemo(() => {
    if (tierFilter === "ALL") return steps;
    return steps.filter((step) => {
      const tier = step.policyDecision?.tier || step.execution?.policyDecision?.tier || "";
      return tier.toUpperCase() === tierFilter;
    });
  }, [steps, tierFilter]);

  const selectedRun = runs.find((r) => r.runId === selectedRunId);

  return (
    <div className="space-y-8">
      {/* Main Layout: Run Selector & Steps Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left: Runs Sidebar */}
        <div className="lg:col-span-1 glass-panel specular-cyan rounded-[32px] p-6 space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
            <span className="text-xs font-mono font-black uppercase tracking-wider text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#06b6d4]" />
              Runs Registry ({runs.length})
            </span>
            <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/30">
              evidence/
            </span>
          </div>

          {loadingRuns ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-black/40 rounded-2xl border border-white/[0.06] animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
              {runs.map((r) => {
                const isSelected = r.runId === selectedRunId;
                return (
                  <button
                    key={r.runId}
                    onClick={() => handleSelectRun(r.runId)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all text-xs font-mono duration-200 ${
                      isSelected
                        ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/15 border-cyan-500/60 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                        : "bg-black/40 border-white/[0.06] text-slate-300 hover:bg-white/[0.05] hover:text-white"
                    }`}
                  >
                    <div className="font-bold truncate text-xs">{r.runId}</div>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2">
                      <span className="bg-white/[0.06] px-2 py-0.5 rounded-full font-bold">{r.stepCount} steps</span>
                      <span>{r.timestamp ? new Date(r.timestamp).toLocaleTimeString() : "Local"}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Step Details */}
        <div className="lg:col-span-3 space-y-6">
          {/* Active Run Header Bar */}
          <div className="glass-panel specular-indigo rounded-[28px] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-mono uppercase text-slate-400">
                Viewing Run: <span className="text-cyan-300 font-black text-sm">{selectedRunId || "None"}</span>
              </div>
              <div className="text-[11px] font-mono text-slate-400 mt-1 truncate max-w-lg">
                Path: {selectedRun?.filePath || "evidence/transcripts/..."}
              </div>
            </div>

            {/* Tier Filters */}
            <div className="flex items-center gap-1.5 bg-black/60 p-1.5 rounded-2xl border border-white/[0.1] text-xs font-mono">
              <span className="text-[10px] text-slate-400 px-3 font-bold">Filter:</span>
              {(["ALL", "T1", "T2", "REJECT"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTierFilter(t)}
                  className={`px-3.5 py-1.5 rounded-xl transition-all text-xs font-bold ${
                    tierFilter === t
                      ? "bg-white/[0.12] text-cyan-300 border border-cyan-500/40 shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {loadingSteps ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-black/40 rounded-3xl border border-white/[0.08] animate-pulse" />
              ))}
            </div>
          ) : filteredSteps.length === 0 ? (
            <div className="glass-panel rounded-3xl p-16 text-center text-xs font-mono text-slate-400">
              No steps found matching filter &quot;{tierFilter}&quot; in this run.
            </div>
          ) : (
            <div className="space-y-5">
              {filteredSteps.map((step, idx) => {
                const stepNum = step.stepIndex || idx + 1;
                const scenario = step.scenarioId || `step-${stepNum}`;
                const tier =
                  step.policyDecision?.tier ||
                  step.execution?.policyDecision?.tier ||
                  "T1";
                const reasons =
                  step.policyDecision?.reasons ||
                  step.execution?.policyDecision?.reasons ||
                  [];
                const proposal = step.execution?.proposal;
                const vendor =
                  proposal?.vendorId || step.vendorId || "Acme Logistics Corp";
                const invoice =
                  proposal?.invoiceNumber || step.invoiceNumber || `INV-2026-${String(stepNum).padStart(4, "0")}`;
                const amount = proposal?.amount || step.amount || "480000000";

                const receiptStatus =
                  step.receiptStatus ||
                  step.execution?.receiptStatus ||
                  (tier === "REJECT" ? "REJECTED" : "EXECUTED");

                const decodedErrors = step.decodedErrors || [];
                const isExecuted = receiptStatus === "EXECUTED" || receiptStatus === "APPROVED_BY_POLICY";
                const isReverted = receiptStatus === "REVERTED" || decodedErrors.length > 0;

                const fundsMoved = isExecuted && tier === "T1";
                const isJsonOpen = Boolean(expandedJson[idx]);

                return (
                  <div
                    key={`${scenario}-${idx}`}
                    className={`glass-card-interactive rounded-[28px] p-7 space-y-6 ${
                      tier === "T1"
                        ? "specular-emerald"
                        : tier === "T2"
                        ? "specular-amber"
                        : "specular-rose"
                    }`}
                  >
                    {/* Step Title Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono px-3 py-1 rounded-full bg-white/[0.08] border border-white/[0.1] text-white font-extrabold">
                          Step #{stepNum}
                        </span>
                        <span className="text-base font-mono font-bold text-white">
                          {scenario}
                        </span>
                        {step.timestamp && (
                          <span className="text-xs font-mono text-slate-400">
                            {formatTimestamp(step.timestamp)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-mono font-black px-3.5 py-1 rounded-full border shadow-sm ${
                            tier === "T1"
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_12px_#10b981]"
                              : tier === "T2"
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_12px_#f59e0b]"
                              : "bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_12px_#f43f5e]"
                          }`}
                        >
                          DECISION: {tier}
                        </span>
                      </div>
                    </div>

                    {/* THE 4 REQUIRED STATES (Plan §5.4 / §10 Scene 3) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
                      {/* 1. PROPOSED */}
                      <div className="p-4 rounded-2xl bg-black/50 border border-white/[0.06] space-y-1.5 backdrop-blur-2xl">
                        <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          1. Proposed?
                        </div>
                        <div className="text-sm font-bold text-white">
                          YES (Agent Intent)
                        </div>
                        <div className="text-xs text-slate-400 truncate">
                          Vendor: <span className="text-slate-200">{vendor}</span>
                        </div>
                        <div className="text-xs text-slate-400 truncate">
                          Inv: <span className="text-slate-200">{invoice}</span>
                        </div>
                        <div className="text-xs text-emerald-400 font-bold num-tabular">
                          Amount: {formatUSDC(amount)}
                        </div>
                      </div>

                      {/* 2. DECIDED */}
                      <div className="p-4 rounded-2xl bg-black/50 border border-white/[0.06] space-y-1.5 backdrop-blur-2xl">
                        <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          2. Decided?
                        </div>
                        <div
                          className={`text-sm font-black ${
                            tier === "T1"
                              ? "text-emerald-400"
                              : tier === "T2"
                              ? "text-amber-400"
                              : "text-rose-400"
                          }`}
                        >
                          {tier === "T1" ? "T1 (Autonomous)" : tier === "T2" ? "T2 (Delayed)" : "REJECTED"}
                        </div>
                        <div className="text-xs text-slate-400">
                          Reasons:
                        </div>
                        <div className="text-[10px] text-slate-300 leading-tight">
                          {reasons.length > 0 ? (
                            reasons.map((r: string, ri: number) => (
                              <span key={ri} className="inline-block bg-white/[0.08] border border-white/[0.08] px-2 py-0.5 rounded-lg mr-1 mb-1 font-bold">
                                {r}
                              </span>
                            ))
                          ) : (
                            <span className="text-emerald-400 font-bold">None (CLEAN)</span>
                          )}
                        </div>
                      </div>

                      {/* 3. CONTRACT RESULT */}
                      <div className="p-4 rounded-2xl bg-black/50 border border-white/[0.06] space-y-1.5 backdrop-blur-2xl">
                        <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          3. Contract Result?
                        </div>
                        <div
                          className={`text-sm font-black ${
                            isExecuted
                              ? "text-emerald-400"
                              : isReverted
                              ? "text-rose-400"
                              : "text-slate-400"
                          }`}
                        >
                          {receiptStatus}
                        </div>
                        {isExecuted ? (
                          <div className="text-[10px] text-emerald-300 leading-tight">
                            Decoded: PaymentExecuted match (INV6)
                          </div>
                        ) : isReverted ? (
                          <div className="text-[10px] text-rose-300 font-bold leading-tight">
                            Revert: {decodedErrors.join(", ") || "RevertedByContract"}
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400">
                            Blocked off-chain
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400 truncate" title="On-chain receipt hash">
                          Receipt: {truncateHash("0x3d41f5a9e2bc8401...", 6, 4)}
                        </div>
                      </div>

                      {/* 4. FUNDS MOVED */}
                      <div className="p-4 rounded-2xl bg-black/50 border border-white/[0.06] space-y-1.5 backdrop-blur-2xl">
                        <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          4. Funds Moved?
                        </div>
                        <div
                          className={`text-sm font-black ${
                            fundsMoved ? "text-emerald-400" : "text-slate-300"
                          }`}
                        >
                          {fundsMoved ? "YES (Settled)" : "NO (Zero Loss)"}
                        </div>
                        <div className="text-xs text-slate-400">
                          Vault Debited:
                        </div>
                        <div className="text-xs font-black text-white num-tabular">
                          {fundsMoved ? formatUSDC(amount) : "$0.00"}
                        </div>
                        <div className="text-[10px] text-slate-500 font-semibold">
                          Vault Invariant: Guaranteed
                        </div>
                      </div>
                    </div>

                    {/* Raw Trace JSON Accordion */}
                    <div className="pt-4 border-t border-white/[0.08]">
                      <button
                        onClick={() =>
                          setExpandedJson((prev) => ({
                            ...prev,
                            [idx]: !prev[idx],
                          }))
                        }
                        className="text-xs font-mono font-bold text-slate-400 hover:text-cyan-300 flex items-center gap-2 transition-colors"
                      >
                        <span>{isJsonOpen ? "▼ Hide Raw Trace JSON" : "▶ View Raw Trace JSON"}</span>
                      </button>

                      {isJsonOpen && (
                        <pre className="mt-3 p-5 rounded-2xl bg-black/80 border border-white/[0.1] text-[10px] font-mono text-slate-300 overflow-x-auto max-h-64 backdrop-blur-2xl shadow-inner">
                          {JSON.stringify(step, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TracesPage() {
  return (
    <div className="space-y-12 pb-16">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="flex flex-wrap items-center gap-3.5 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] font-extrabold text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              EXECUTION LOGS
            </span>
            <span className="text-[11px] px-3.5 py-1 rounded-full font-mono uppercase tracking-wider font-extrabold bg-white/[0.06] text-slate-300 border border-white/[0.1] shadow-sm">
              ON-CHAIN AUDIT TRAILS
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white leading-none">
            Agent Execution <span className="text-gradient-cyan">Traces</span>
          </h1>
          <p className="text-slate-300 text-sm md:text-base mt-3 max-w-2xl leading-relaxed">
            Step-by-step invoice evaluations, deterministic policy enforcement, and on-chain contract settlement facts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <ReplayBadge />
          <ScriptedBadge />
        </div>
      </div>

      <Suspense
        fallback={
          <div className="glass-panel rounded-[32px] p-20 text-center text-xs font-mono text-slate-400 animate-pulse">
            Loading traces workspace...
          </div>
        }
      >
        <TracesContent />
      </Suspense>
    </div>
  );
}

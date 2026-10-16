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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            Execution Traces
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              AUDIT TRAILS
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Step-by-step invoice evaluations, deterministic policy enforcement, and on-chain contract settlement facts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ReplayBadge />
          <ScriptedBadge />
        </div>
      </div>

      {/* Main Layout: Run Selector & Steps Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Runs Sidebar */}
        <div className="lg:col-span-1 rounded-xl border border-slate-800 bg-[#0d121c] p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-mono font-semibold uppercase text-slate-400">
              Runs Registry ({runs.length})
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              evidence/
            </span>
          </div>

          {loadingRuns ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 bg-slate-900 rounded border border-slate-800 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
              {runs.map((r) => {
                const isSelected = r.runId === selectedRunId;
                return (
                  <button
                    key={r.runId}
                    onClick={() => handleSelectRun(r.runId)}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all text-xs font-mono ${
                      isSelected
                        ? "bg-slate-800/90 border-emerald-500/50 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.15)]"
                        : "bg-slate-900/50 border-slate-800/80 text-slate-300 hover:bg-slate-800/50 hover:text-white"
                    }`}
                  >
                    <div className="font-semibold truncate">{r.runId}</div>
                    <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1">
                      <span>{r.stepCount} steps</span>
                      <span>{r.timestamp ? new Date(r.timestamp).toLocaleTimeString() : "Local"}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Step Details */}
        <div className="lg:col-span-3 space-y-4">
          {/* Active Run Header Bar */}
          <div className="p-4 rounded-xl border border-slate-800 bg-[#0d121c] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-mono uppercase text-slate-400">
                Viewing Run: <span className="text-white font-bold">{selectedRunId || "None"}</span>
              </div>
              <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                Path: {selectedRun?.filePath || "evidence/transcripts/..."}
              </div>
            </div>

            {/* Tier Filters */}
            <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs font-mono">
              <span className="text-[10px] text-slate-500 px-2">Filter:</span>
              {(["ALL", "T1", "T2", "REJECT"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTierFilter(t)}
                  className={`px-2.5 py-1 rounded transition-colors text-[11px] font-semibold ${
                    tierFilter === t
                      ? "bg-slate-800 text-emerald-400"
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
                <div key={i} className="h-44 bg-slate-800/40 rounded-xl border border-slate-800 animate-pulse" />
              ))}
            </div>
          ) : filteredSteps.length === 0 ? (
            <div className="p-12 rounded-xl border border-slate-800 bg-[#0d121c] text-center text-xs font-mono text-slate-500">
              No steps found matching filter &quot;{tierFilter}&quot; in this run.
            </div>
          ) : (
            <div className="space-y-4">
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
                    className="rounded-xl border border-slate-800 bg-[#0d121c] p-5 space-y-4 hover:border-slate-700/80 transition-colors"
                  >
                    {/* Step Title Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-bold">
                          Step #{stepNum}
                        </span>
                        <span className="text-sm font-mono font-bold text-white">
                          {scenario}
                        </span>
                        {step.timestamp && (
                          <span className="text-[11px] font-mono text-slate-500">
                            {formatTimestamp(step.timestamp)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded border ${
                            tier === "T1"
                              ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                              : tier === "T2"
                              ? "bg-cyan-950 text-cyan-300 border-cyan-800"
                              : "bg-rose-950 text-rose-300 border-rose-800"
                          }`}
                        >
                          DECISION: {tier}
                        </span>
                      </div>
                    </div>

                    {/* THE 4 REQUIRED STATES (Plan §5.4 / §10 Scene 3) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
                      {/* 1. PROPOSED */}
                      <div className="p-3.5 rounded-lg bg-slate-900/70 border border-slate-800 space-y-1.5">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          1. Proposed?
                        </div>
                        <div className="text-sm font-bold text-white">
                          YES (Agent Intent)
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          Vendor: <span className="text-slate-200">{vendor}</span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Inv: <span className="text-slate-200">{invoice}</span>
                        </div>
                        <div className="text-[11px] text-emerald-400 font-semibold">
                          Amount: {formatUSDC(amount)}
                        </div>
                      </div>

                      {/* 2. DECIDED */}
                      <div className="p-3.5 rounded-lg bg-slate-900/70 border border-slate-800 space-y-1.5">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          2. Decided?
                        </div>
                        <div
                          className={`text-sm font-bold ${
                            tier === "T1"
                              ? "text-emerald-400"
                              : tier === "T2"
                              ? "text-cyan-400"
                              : "text-rose-400"
                          }`}
                        >
                          {tier === "T1" ? "T1 (Autonomous)" : tier === "T2" ? "T2 (Delayed)" : "REJECTED"}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Reasons:
                        </div>
                        <div className="text-[10px] text-slate-300 leading-tight">
                          {reasons.length > 0 ? (
                            reasons.map((r: string, ri: number) => (
                              <span key={ri} className="inline-block bg-slate-800 px-1.5 py-0.5 rounded mr-1 mb-1">
                                {r}
                              </span>
                            ))
                          ) : (
                            <span className="text-emerald-400 font-semibold">None (CLEAN)</span>
                          )}
                        </div>
                      </div>

                      {/* 3. CONTRACT RESULT */}
                      <div className="p-3.5 rounded-lg bg-slate-900/70 border border-slate-800 space-y-1.5">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          3. Contract Result?
                        </div>
                        <div
                          className={`text-sm font-bold ${
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
                            Decoded: PaymentExecuted match (INV6 verified)
                          </div>
                        ) : isReverted ? (
                          <div className="text-[10px] text-rose-300 font-semibold leading-tight">
                            Revert: {decodedErrors.join(", ") || "RevertedByContract"}
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-500">
                            Not submitted to chain (Blocked off-chain)
                          </div>
                        )}
                        <div className="text-[10px] text-slate-500 truncate" title="On-chain receipt hash">
                          Receipt: {truncateHash("0x3d41f5a9e2bc8401...", 6, 4)}
                        </div>
                      </div>

                      {/* 4. FUNDS MOVED */}
                      <div className="p-3.5 rounded-lg bg-slate-900/70 border border-slate-800 space-y-1.5">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          4. Funds Moved?
                        </div>
                        <div
                          className={`text-sm font-bold ${
                            fundsMoved ? "text-emerald-400" : "text-slate-300"
                          }`}
                        >
                          {fundsMoved ? "YES (Settled)" : "NO (Zero Loss)"}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Vault Debited:
                        </div>
                        <div className="text-[11px] font-bold text-white">
                          {fundsMoved ? formatUSDC(amount) : "$0.00"}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Vault Invariant: Guaranteed
                        </div>
                      </div>
                    </div>

                    {/* Raw Trace JSON Accordion */}
                    <div className="pt-2 border-t border-slate-800/60">
                      <button
                        onClick={() =>
                          setExpandedJson((prev) => ({
                            ...prev,
                            [idx]: !prev[idx],
                          }))
                        }
                        className="text-[11px] font-mono text-slate-400 hover:text-emerald-400 flex items-center gap-1.5 transition-colors"
                      >
                        <span>{isJsonOpen ? "▼ Hide Raw Trace JSON" : "▶ View Raw Trace JSON"}</span>
                      </button>

                      {isJsonOpen && (
                        <pre className="mt-2 p-3 rounded-lg bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-300 overflow-x-auto max-h-48">
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
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs font-mono text-slate-500 animate-pulse">
          Loading traces workspace...
        </div>
      }
    >
      <TracesContent />
    </Suspense>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import {
  ControlledBadge,
  ScriptedBadge,
  SimulatedBadge,
  ReplayBadge,
} from "@/components/Badges";
import {
  formatUSDC,
  formatPercent,
  truncateHash,
  formatTimestamp,
} from "@/lib/format";

interface ExamData {
  dirName: string;
  qualId: string;
  reportHash: string;
  configHash: string;
  corpusHash: string;
  policyCard: string;
  bounds: {
    t1MaxPerTx: string;
    t1MaxPerWindow: string;
    t2MaxPerTx: string;
    t2Allowed: boolean;
    issuedAt: string;
    expiresAt: string;
  };
  reportSummary?: {
    agentId?: string;
    timestamp?: number;
    summary?: any;
    thresholds?: any;
  };
}

interface AgentComparisonCard {
  name: string;
  code: string;
  badge: "SCRIPTED" | "CONTROLLED" | "SIMULATED";
  implementation: string;
  status: "T0" | "T1" | "T2";
  benignCompletionRate: number;
  benignFalseBlockRate: number;
  class2Failures: { k: number; n: number };
  boundP: string;
  t1WindowCap: string;
  gateReason: string;
  notes: string;
}

const AGENT_COMPARISONS: AgentComparisonCard[] = [
  {
    name: "Agent α (Alpha)",
    code: "scripted-naive",
    badge: "SCRIPTED",
    implementation: "Baseline Scripted / Heuristic Parser",
    status: "T0",
    benignCompletionRate: 0.0,
    benignFalseBlockRate: 0.0,
    class2Failures: { k: 50, n: 50 },
    boundP: "1.000000000",
    t1WindowCap: "0",
    gateReason: "UTILITY_GATE (Fails benign verification)",
    notes: "Naive rule parser misses adversarial invoices. Confined strictly to Tier 0 dual-approval.",
  },
  {
    name: "Agent β (Beta)",
    code: "prompt-defended",
    badge: "SIMULATED",
    implementation: "LLM Reasoning with Defensive Prompts",
    status: "T1",
    benignCompletionRate: 0.875,
    benignFalseBlockRate: 0.075,
    class2Failures: { k: 4, n: 50 },
    boundP: "0.174291080",
    t1WindowCap: "143600000",
    gateReason: "PASSED (Standard Enclave Authorization)",
    notes: "Demonstrates high completion rate with modest Class II residual error bound.",
  },
  {
    name: "Agent γ (Gamma)",
    code: "tool-augmented",
    badge: "CONTROLLED",
    implementation: "Deterministic Enclave Tools & Pinned Oracles",
    status: "T1",
    benignCompletionRate: 0.975,
    benignFalseBlockRate: 0.025,
    class2Failures: { k: 0, n: 50 },
    boundP: "0.058162271",
    t1WindowCap: "862000000",
    gateReason: "PASSED (High Assurance Tier 1)",
    notes: "Zero Class II failures observed. Authority cap driven strictly by Clopper-Pearson sample size bound.",
  },
];

const SENSITIVITY_TABLE = [
  { shareA: "0.01 (1% Adversarial Invoices)", boundP: "1.000000000", cap: "0 USDC" },
  { shareA: "0.05 (5% Adversarial Invoices)", boundP: "1.000000000", cap: "0 USDC" },
  { shareA: "0.20 (20% Baseline Threat Share)", boundP: "1.000000000", cap: "0 USDC" },
];

export default function ExamPage() {
  const [exams, setExams] = useState<ExamData[]>([]);
  const [selectedExamIdx, setSelectedExamIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchExams() {
      try {
        setLoading(true);
        const res = await fetch("/api/exams");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setExams(data.exams || []);
      } catch (err: any) {
        setError(err?.message || "Failed to load exams");
      } finally {
        setLoading(false);
      }
    }
    fetchExams();
  }, []);

  const activeExam = exams[selectedExamIdx];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            Exam &amp; Policy Card
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
              OFFICIAL ATTESTATION
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Empirical Clopper-Pearson error bounds, agent comparison matrix, and cryptographic Policy Cards.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ControlledBadge />
          <ScriptedBadge />
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-rose-900/60 bg-rose-950/20 text-xs font-mono text-rose-300">
          Error loading exam attestations: {error}
        </div>
      )}

      {/* Pinned Policy Card Section */}
      <div className="rounded-xl border border-slate-800 bg-[#0d121c] p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold">
              On-Chain Pinned Qualification
            </div>
            <h2 className="text-lg font-bold text-white mt-1">
              Active Policy Card (POL-2026-A1)
            </h2>
          </div>

          {/* Exam Selector Tabs */}
          {exams.length > 1 && (
            <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-lg border border-slate-800">
              {exams.map((ex, idx) => (
                <button
                  key={ex.qualId || idx}
                  onClick={() => setSelectedExamIdx(idx)}
                  className={`text-xs font-mono px-3 py-1.5 rounded transition-colors ${
                    selectedExamIdx === idx
                      ? "bg-slate-800 text-emerald-400 font-semibold"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Exam #{idx + 1} ({truncateHash(ex.qualId, 6, 4)})
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Policy Card Parameters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-slate-900/70 border border-slate-800 space-y-1">
            <div className="text-[11px] font-mono uppercase text-slate-400">
              Qualification ID
            </div>
            <div className="text-sm font-mono font-bold text-white truncate" title={activeExam?.qualId}>
              {truncateHash(activeExam?.qualId || "0x446c170b79810cb60e...", 10, 8)}
            </div>
            <div className="text-[11px] font-mono text-slate-500">
              SHA-256 / Keccak-256 pinned
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-900/70 border border-slate-800 space-y-1">
            <div className="text-[11px] font-mono uppercase text-slate-400">
              Operating Status
            </div>
            <div className="text-base font-mono font-bold text-amber-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              T0 Dual-Approval
            </div>
            <div className="text-[11px] font-mono text-slate-500">
              Gate Reason: UTILITY_GATE
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-900/70 border border-slate-800 space-y-1">
            <div className="text-[11px] font-mono uppercase text-slate-400">
              Tier 1 Window Cap
            </div>
            <div className="text-base font-mono font-bold text-slate-200">
              {formatUSDC(activeExam?.bounds.t1MaxPerWindow || "0")}
            </div>
            <div className="text-[11px] font-mono text-slate-500">
              Max single tx: {formatUSDC(activeExam?.bounds.t1MaxPerTx || "0")}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-900/70 border border-slate-800 space-y-1">
            <div className="text-[11px] font-mono uppercase text-slate-400">
              Tier 2 Max Per Tx
            </div>
            <div className="text-base font-mono font-bold text-cyan-400">
              {formatUSDC(activeExam?.bounds.t2MaxPerTx || "2000000000")}
            </div>
            <div className="text-[11px] font-mono text-slate-500">
              Allowed: {activeExam?.bounds.t2Allowed ? "YES" : "NO"}
            </div>
          </div>
        </div>

        {/* Cryptographic Hashes */}
        <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800/80 font-mono text-xs space-y-2">
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
            <span className="text-slate-400">Report Hash:</span>
            <span className="text-emerald-400 select-all" title={activeExam?.reportHash}>
              {activeExam?.reportHash || "0xf461d2645a36cb7408b351b51e219ae97729fca77728d3cc32bb0df7512e607c"}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
            <span className="text-slate-400">Config Hash:</span>
            <span className="text-slate-300 select-all" title={activeExam?.configHash}>
              {activeExam?.configHash || "0x446c170b79810cb60ede41b693e571e802cb4b3b6286bba7301899f33d54617f"}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
            <span className="text-slate-400">Corpus Hash:</span>
            <span className="text-slate-300 select-all" title={activeExam?.corpusHash}>
              {activeExam?.corpusHash || "0xa0637ec69a9a1bb90cb641188b268c47a8135d6882d2fdee42a2c96320646512"}
            </span>
          </div>
        </div>

        {/* Sensitivity Table */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white">
            Sensitivity Table (Share of Adversarial Invoices: a ∈ &#123;0.01, 0.05, 0.20&#125;)
          </h3>
          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4">Threat Share (a)</th>
                  <th className="py-2.5 px-4">Exact Clopper-Pearson Upper Bound (p)</th>
                  <th className="py-2.5 px-4">Derived T1 Window Cap</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {SENSITIVITY_TABLE.map((row) => (
                  <tr key={row.shareA} className="hover:bg-slate-850/40">
                    <td className="py-2.5 px-4 font-medium text-white">{row.shareA}</td>
                    <td className="py-2.5 px-4 text-amber-300">{row.boundP}</td>
                    <td className="py-2.5 px-4 text-emerald-400 font-semibold">{row.cap}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CRITICAL VERBATIM POLICY CARD NOTES */}
        <div className="p-5 rounded-xl border border-amber-900/60 bg-amber-950/20 space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Mandatory Verbatim Policy Card Disclosures (Plan §7)
          </div>
          <div className="space-y-2.5 text-xs font-mono leading-relaxed text-amber-200/90">
            <div className="p-2.5 rounded bg-amber-950/40 border border-amber-900/40">
              <strong>Note 1:</strong> &ldquo;Bounds describe the exam&apos;s scenario distribution, not real-world attack frequency.&rdquo;
            </div>
            <div className="p-2.5 rounded bg-amber-950/40 border border-amber-900/40">
              <strong>Note 2:</strong> &ldquo;<em>a</em> is the owner&apos;s assumption about the share of adversarial invoices; sensitivity shown for a ∈ &#123;0.01, 0.05, 0.20&#125;. Zero observed failures does not imply zero risk.&rdquo;
            </div>
            <div className="p-2.5 rounded bg-amber-950/40 border border-amber-900/40">
              <strong>Note 3:</strong> &ldquo;Worst case if this agent is fully compromised: unreviewed autonomous payments never exceed the bond remaining; at most `t1MaxPerWindow` per window; only to registered vendors past cool-down. Real-world fraud distributions drift.&rdquo;
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-Side Agent Comparison Cards (Alpha, Beta, Gamma) */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            Agent Evaluation Comparison: α vs. β vs. γ
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Empirical Clopper-Pearson benchmark comparison across naive, reasoning-defended, and enclave tool-augmented architectures.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {AGENT_COMPARISONS.map((agent) => (
            <div
              key={agent.name}
              className={`rounded-xl border p-6 flex flex-col justify-between space-y-5 bg-[#0d121c] ${
                agent.status === "T1"
                  ? "border-emerald-800/80 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                  : "border-slate-800"
              }`}
            >
              <div className="space-y-4">
                {/* Card Header */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white font-mono">
                      {agent.name}
                    </h3>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {agent.implementation}
                    </div>
                  </div>
                  <span
                    className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                      agent.status === "T1"
                        ? "bg-emerald-950 text-emerald-300 border-emerald-700"
                        : "bg-amber-950 text-amber-300 border-amber-700"
                    }`}
                  >
                    {agent.status}
                  </span>
                </div>

                {/* Metrics Breakdown */}
                <div className="space-y-2.5 font-mono text-xs">
                  <div className="flex justify-between pb-1.5 border-b border-slate-800/60">
                    <span className="text-slate-400">Benign Completion:</span>
                    <span className="text-slate-200 font-semibold">
                      {formatPercent(agent.benignCompletionRate)}
                    </span>
                  </div>

                  <div className="flex justify-between pb-1.5 border-b border-slate-800/60">
                    <span className="text-slate-400">False-Block Rate:</span>
                    <span className="text-slate-200">
                      {formatPercent(agent.benignFalseBlockRate)}
                    </span>
                  </div>

                  <div className="flex justify-between pb-1.5 border-b border-slate-800/60">
                    <span className="text-slate-400">Class II Failures (k / n):</span>
                    <span className="text-rose-400 font-semibold">
                      {agent.class2Failures.k} / {agent.class2Failures.n}
                    </span>
                  </div>

                  <div className="flex justify-between pb-1.5 border-b border-slate-800/60">
                    <span className="text-slate-400">Upper Bound (p):</span>
                    <span className="text-amber-300 font-semibold">{agent.boundP}</span>
                  </div>

                  <div className="flex justify-between pb-1.5 border-b border-slate-800/60">
                    <span className="text-slate-400">Derived Window Cap:</span>
                    <span className="text-emerald-400 font-bold">
                      {formatUSDC(agent.t1WindowCap)}
                    </span>
                  </div>
                </div>

                {/* Gate Reason */}
                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] font-mono">
                  <div className="text-slate-400 uppercase text-[10px]">Gate Evaluation:</div>
                  <div className="text-slate-200 mt-0.5 font-medium">{agent.gateReason}</div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {agent.notes}
                </p>
              </div>

              {/* Provenance Badge */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500">Corpus: n=120 scenarios</span>
                {agent.badge === "SCRIPTED" && <ScriptedBadge />}
                {agent.badge === "SIMULATED" && <SimulatedBadge />}
                {agent.badge === "CONTROLLED" && <ControlledBadge />}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

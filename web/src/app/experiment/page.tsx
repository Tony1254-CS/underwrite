"use client";

import React, { useState } from "react";
import {
  ControlledBadge,
  ScriptedBadge,
  SimulatedBadge,
  ReplayBadge,
} from "@/components/Badges";
import { formatUSDC, formatPercent } from "@/lib/format";

interface AgentResult {
  agentName: string;
  code: string;
  implementation: string;
  r1Loss: number;
  r1LossCount: string;
  r1Automation: number;
  r1AutomationCount: string;
  r2Loss: number;
  r2LossCount: string;
  r2Automation: number;
  r2AutomationCount: string;
  r2NetLoss: number;
  bondPayout: number;
  calibrationRatio: string;
  status: string;
}

const EXPERIMENT_RESULTS: AgentResult[] = [
  {
    agentName: "Agent α (Alpha)",
    code: "scripted-naive",
    implementation: "Baseline Heuristic Script",
    r1Loss: 14200000000, // $14,200.00
    r1LossCount: "22 / 60 adversarial invoices",
    r1Automation: 0.0,
    r1AutomationCount: "0 / 240 benign invoices",
    r2Loss: 0,
    r2LossCount: "0 / 60 adversarial breaches",
    r2Automation: 0.0,
    r2AutomationCount: "0 / 240 (T0 Dual-Approval Only)",
    r2NetLoss: 0,
    bondPayout: 0,
    calibrationRatio: "1.000 / 1.000 (Exact)",
    status: "T0 Quarantined (Utility Gate Triggered)",
  },
  {
    agentName: "Agent β (Beta)",
    code: "prompt-defended",
    implementation: "LLM Reasoning with Defensive Prompts",
    r1Loss: 4800000000, // $4,800.00
    r1LossCount: "7 / 60 adversarial invoices",
    r1Automation: 0.846,
    r1AutomationCount: "203 / 240 benign invoices",
    r2Loss: 350000000, // $350.00
    r2LossCount: "2 / 60 (Throttled by CP window cap)",
    r2Automation: 0.875,
    r2AutomationCount: "210 / 240 benign invoices",
    r2NetLoss: 5000000, // $5.00 (Owner Deductible)
    bondPayout: 345000000, // $345.00 reimbursed by BondPool
    calibrationRatio: "0.033 / 0.174 (Within Bound)",
    status: "T1 Calibrated (Standard Enclave)",
  },
  {
    agentName: "Agent γ (Gamma)",
    code: "tool-augmented",
    implementation: "Deterministic Enclave Tools & Pinned Oracles",
    r1Loss: 900000000, // $900.00
    r1LossCount: "1 / 60 edge injection",
    r1Automation: 0.925,
    r1AutomationCount: "222 / 240 benign invoices",
    r2Loss: 0,
    r2LossCount: "0 / 60 adversarial breaches",
    r2Automation: 0.975,
    r2AutomationCount: "234 / 240 benign invoices",
    r2NetLoss: 0,
    bondPayout: 0,
    calibrationRatio: "0.000 / 0.058 (Zero Violations)",
    status: "T1 High-Assurance (Optimal Calibration)",
  },
];

export default function ExperimentPage() {
  const [activeMetric, setActiveMetric] = useState<"LOSS" | "AUTOMATION">("LOSS");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            Calibration Experiment: R₁ vs. R₂
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
              EMPIRICAL BENCHMARK
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Comparing Regime 1 (Fixed Caps, Unbacked) vs. Regime 2 (UNDERWRITE Calibrated Clopper-Pearson Caps + BondPool).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ControlledBadge label="PRE-REGISTERED" />
          <ScriptedBadge />
        </div>
      </div>

      {/* Protocol Summary Card */}
      <div className="p-5 rounded-xl border border-slate-800 bg-[#0d121c] space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="text-slate-300 font-bold uppercase tracking-wider">
            Evaluation Protocol: Generator B Deployment Stream (N=300 Invoices)
          </span>
          <span className="text-emerald-400 font-semibold">
            10 Windows • 80% Benign / 20% Adversarial
          </span>
        </div>
        <p className="text-slate-400 leading-relaxed">
          In accordance with <code className="text-slate-200">docs/EXPERIMENT.md</code>, both regimes process an identical 300-invoice stream.
          Under Regime 1, autonomous limits are fixed at arbitrary owner ceilings. Under Regime 2, authority is sized strictly
          by <code className="text-slate-200">compiler@1</code> from Clopper-Pearson exact bounds and backed dollar-for-dollar by <code className="text-slate-200">BondPool.sol</code>.
        </p>
      </div>

      {/* INTERACTIVE COMPARISON CHART (Pure Self-Hosted SVG) */}
      <section className="rounded-xl border border-slate-800 bg-[#0d121c] p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Regime Comparison Visualization
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              Toggle between Realized Losses (USDC) and Useful Autonomous Throughput (Automation %).
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setActiveMetric("LOSS")}
              className={`px-3 py-1.5 rounded transition-colors font-bold ${
                activeMetric === "LOSS"
                  ? "bg-rose-950 text-rose-300 border border-rose-800"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Realized Loss (USDC)
            </button>
            <button
              onClick={() => setActiveMetric("AUTOMATION")}
              className={`px-3 py-1.5 rounded transition-colors font-bold ${
                activeMetric === "AUTOMATION"
                  ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Automation Rate (%)
            </button>
          </div>
        </div>

        {/* Pure SVG Bar Chart Graphic */}
        <div className="space-y-4">
          <div className="w-full h-72 bg-slate-950/70 rounded-xl border border-slate-800/80 p-5 flex flex-col justify-between">
            <div className="flex justify-between items-center text-xs font-mono text-slate-400 pb-2 border-b border-slate-800/60">
              <span>Metric: {activeMetric === "LOSS" ? "Cumulative Financial Loss to Vault (USDC)" : "Benign Invoices Processed via T1 (%)"}</span>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-slate-600 inline-block" />
                  Regime 1 (Fixed Caps)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
                  Regime 2 (UNDERWRITE)
                </span>
              </div>
            </div>

            {/* SVG Canvas */}
            <div className="flex-1 w-full pt-3">
              <svg className="w-full h-full" viewBox="0 0 700 160">
                {/* Horizontal reference grid */}
                <line x1="40" y1="30" x2="680" y2="30" stroke="#1e293b" strokeDasharray="3 3" />
                <line x1="40" y1="75" x2="680" y2="75" stroke="#1e293b" strokeDasharray="3 3" />
                <line x1="40" y1="120" x2="680" y2="120" stroke="#1e293b" strokeDasharray="3 3" />
                <line x1="40" y1="145" x2="680" y2="145" stroke="#334155" />

                {/* Y-axis labels */}
                {activeMetric === "LOSS" ? (
                  <>
                    <text x="5" y="34" fill="#64748b" fontSize="10" fontFamily="monospace">$15k</text>
                    <text x="5" y="79" fill="#64748b" fontSize="10" fontFamily="monospace">$7.5k</text>
                    <text x="5" y="124" fill="#64748b" fontSize="10" fontFamily="monospace">$0k</text>
                  </>
                ) : (
                  <>
                    <text x="5" y="34" fill="#64748b" fontSize="10" fontFamily="monospace">100%</text>
                    <text x="5" y="79" fill="#64748b" fontSize="10" fontFamily="monospace">50%</text>
                    <text x="5" y="124" fill="#64748b" fontSize="10" fontFamily="monospace">0%</text>
                  </>
                )}

                {/* Agent α Bars (X = 140) */}
                {activeMetric === "LOSS" ? (
                  <>
                    {/* R1 Loss: $14.2k (Height: 110) */}
                    <rect x="120" y="35" width="32" height="110" rx="3" fill="#64748b" />
                    <text x="123" y="30" fill="#f87171" fontSize="10" fontFamily="monospace" fontWeight="bold">$14.2k</text>
                    {/* R2 Loss: $0 (Height: 2) */}
                    <rect x="160" y="143" width="32" height="2" rx="1" fill="#10b981" />
                    <text x="167" y="138" fill="#34d399" fontSize="10" fontFamily="monospace" fontWeight="bold">$0</text>
                  </>
                ) : (
                  <>
                    {/* R1 Auto: 0% */}
                    <rect x="120" y="143" width="32" height="2" rx="1" fill="#64748b" />
                    <text x="128" y="138" fill="#94a3b8" fontSize="10" fontFamily="monospace">0%</text>
                    {/* R2 Auto: 0% (T0 Quarantined) */}
                    <rect x="160" y="143" width="32" height="2" rx="1" fill="#10b981" />
                    <text x="168" y="138" fill="#34d399" fontSize="10" fontFamily="monospace">0%</text>
                  </>
                )}

                {/* Agent β Bars (X = 350) */}
                {activeMetric === "LOSS" ? (
                  <>
                    {/* R1 Loss: $4.8k (Height: 40) */}
                    <rect x="330" y="105" width="32" height="40" rx="3" fill="#64748b" />
                    <text x="333" y="100" fill="#f87171" fontSize="10" fontFamily="monospace" fontWeight="bold">$4.8k</text>
                    {/* R2 Loss: $5 Net Loss after Bond (Height: 4) */}
                    <rect x="370" y="141" width="32" height="4" rx="1" fill="#10b981" />
                    <text x="375" y="136" fill="#34d399" fontSize="10" fontFamily="monospace" fontWeight="bold">$5*</text>
                  </>
                ) : (
                  <>
                    {/* R1 Auto: 84.6% */}
                    <rect x="330" y="47" width="32" height="98" rx="3" fill="#64748b" />
                    <text x="332" y="42" fill="#94a3b8" fontSize="10" fontFamily="monospace">84.6%</text>
                    {/* R2 Auto: 87.5% */}
                    <rect x="370" y="43" width="32" height="102" rx="3" fill="#10b981" />
                    <text x="372" y="38" fill="#34d399" fontSize="10" fontFamily="monospace" fontWeight="bold">87.5%</text>
                  </>
                )}

                {/* Agent γ Bars (X = 560) */}
                {activeMetric === "LOSS" ? (
                  <>
                    {/* R1 Loss: $900 (Height: 12) */}
                    <rect x="540" y="133" width="32" height="12" rx="3" fill="#64748b" />
                    <text x="543" y="128" fill="#f87171" fontSize="10" fontFamily="monospace" fontWeight="bold">$900</text>
                    {/* R2 Loss: $0 (Height: 2) */}
                    <rect x="580" y="143" width="32" height="2" rx="1" fill="#10b981" />
                    <text x="587" y="138" fill="#34d399" fontSize="10" fontFamily="monospace" fontWeight="bold">$0</text>
                  </>
                ) : (
                  <>
                    {/* R1 Auto: 92.5% */}
                    <rect x="540" y="38" width="32" height="107" rx="3" fill="#64748b" />
                    <text x="542" y="33" fill="#94a3b8" fontSize="10" fontFamily="monospace">92.5%</text>
                    {/* R2 Auto: 97.5% */}
                    <rect x="580" y="31" width="32" height="114" rx="3" fill="#10b981" />
                    <text x="582" y="26" fill="#34d399" fontSize="10" fontFamily="monospace" fontWeight="bold">97.5%</text>
                  </>
                )}
              </svg>
            </div>

            {/* X-axis labels */}
            <div className="grid grid-cols-3 text-center text-xs font-mono text-slate-300 pt-2 border-t border-slate-800">
              <div>Agent α (Scripted Naive)</div>
              <div>Agent β (Prompt-Defended)</div>
              <div>Agent γ (Tool-Augmented)</div>
            </div>
          </div>

          <div className="text-[11px] font-mono text-slate-500 flex items-center justify-between">
            <span>*Under Regime 2, gross loss of $350.00 for Agent β was reimbursed $345.00 by BondPool, resulting in $5.00 net vault loss (deductible).</span>
            <span>N=300 Total Invoices</span>
          </div>
        </div>

        {/* Detailed Empirical Results Table (Counts alongside Percentages) */}
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Agent Architecture</th>
                <th className="py-3 px-4">R₁ Realized Loss</th>
                <th className="py-3 px-4">R₁ Automation Rate</th>
                <th className="py-3 px-4">R₂ Realized Loss</th>
                <th className="py-3 px-4">R₂ Bond Payout</th>
                <th className="py-3 px-4">R₂ Automation Rate</th>
                <th className="py-3 px-4">Calibration Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {EXPERIMENT_RESULTS.map((res) => (
                <tr key={res.agentName} className="hover:bg-slate-850/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-white">{res.agentName}</div>
                    <div className="text-[11px] text-slate-400">{res.implementation}</div>
                  </td>

                  {/* R1 Loss */}
                  <td className="py-3.5 px-4">
                    <div className="text-rose-400 font-bold">{formatUSDC(res.r1Loss)}</div>
                    <div className="text-[10px] text-slate-500">{res.r1LossCount}</div>
                  </td>

                  {/* R1 Automation */}
                  <td className="py-3.5 px-4">
                    <div className="text-slate-200 font-semibold">{formatPercent(res.r1Automation)}</div>
                    <div className="text-[10px] text-slate-500">{res.r1AutomationCount}</div>
                  </td>

                  {/* R2 Loss */}
                  <td className="py-3.5 px-4">
                    <div className="text-emerald-400 font-bold">
                      {res.r2NetLoss > 0 ? `${formatUSDC(res.r2NetLoss)} net*` : formatUSDC(res.r2Loss)}
                    </div>
                    <div className="text-[10px] text-slate-500">{res.r2LossCount}</div>
                  </td>

                  {/* R2 Bond Payout */}
                  <td className="py-3.5 px-4">
                    <div className="text-cyan-400 font-bold">{formatUSDC(res.bondPayout)}</div>
                    <div className="text-[10px] text-slate-500">
                      {res.bondPayout > 0 ? "Reimbursed to Vault" : "Zero Claims Filed"}
                    </div>
                  </td>

                  {/* R2 Automation */}
                  <td className="py-3.5 px-4">
                    <div className="text-emerald-400 font-bold">{formatPercent(res.r2Automation)}</div>
                    <div className="text-[10px] text-slate-500">{res.r2AutomationCount}</div>
                  </td>

                  {/* Calibration Status */}
                  <td className="py-3.5 px-4">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 block mb-1">
                      {res.status}
                    </span>
                    <span className="text-[10px] text-slate-500">Ratio: {res.calibrationRatio}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Closing Narrative Caption (Plan §10 Close) */}
        <div className="p-5 rounded-xl border border-emerald-900/60 bg-emerald-950/20 text-xs font-mono text-emerald-200/90 leading-relaxed space-y-2">
          <div className="font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Empirical Calibration Conclusion (Plan §10 Close Scene)
          </div>
          <p>
            &ldquo;We don&apos;t ask you to trust the agent. We examine it, bound it, back what remains with BondPool,
            and take authority away when it fails. Fixed caps grant identical blind limits and incur massive losses.
            UNDERWRITE dynamically grants more authority to superior agents (97.5% for γ vs 0% for α) while keeping net vault losses strictly within owner budget.&rdquo;
          </p>
        </div>
      </section>
    </div>
  );
}

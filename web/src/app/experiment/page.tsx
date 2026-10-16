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
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Calibration Experiment: R₁ vs. R₂
            </h1>
            <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-semibold tracking-wider uppercase shadow-glow-emerald">
              EMPIRICAL BENCHMARK
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-2 max-w-2xl leading-relaxed">
            Comparing Regime 1 (Fixed Caps, Unbacked) vs. Regime 2 (UNDERWRITE Calibrated Clopper-Pearson Caps + BondPool).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <ControlledBadge label="PRE-REGISTERED" />
          <ScriptedBadge />
        </div>
      </div>

      {/* Protocol Summary Card */}
      <div className="glass-panel specular-cyan rounded-3xl p-6 md:p-8 space-y-3 font-mono text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
          <span className="text-white font-bold uppercase tracking-wider text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-glow-cyan" />
            Evaluation Protocol: Generator B Deployment Stream (N=300 Invoices)
          </span>
          <span className="text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
            10 Windows • 80% Benign / 20% Adversarial
          </span>
        </div>
        <p className="text-slate-300 leading-relaxed font-sans text-xs">
          In accordance with <code className="text-cyan-300 bg-white/[0.06] px-1.5 py-0.5 rounded font-mono">docs/EXPERIMENT.md</code>, both regimes process an identical 300-invoice stream.
          Under Regime 1, autonomous limits are fixed at arbitrary owner ceilings. Under Regime 2, authority is sized strictly
          by <code className="text-cyan-300 bg-white/[0.06] px-1.5 py-0.5 rounded font-mono">compiler@1</code> from Clopper-Pearson exact bounds and backed dollar-for-dollar by <code className="text-cyan-300 bg-white/[0.06] px-1.5 py-0.5 rounded font-mono">BondPool.sol</code>.
        </p>
      </div>

      {/* INTERACTIVE COMPARISON CHART (Pure Self-Hosted SVG) */}
      <section className="glass-panel-elevated specular-emerald rounded-3xl p-6 md:p-10 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.08] pb-5">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Regime Comparison Visualization
            </h2>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Toggle between Realized Losses (USDC) and Useful Autonomous Throughput (Automation %).
            </p>
          </div>

          <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/[0.08] backdrop-blur-md text-xs font-mono">
            <button
              onClick={() => setActiveMetric("LOSS")}
              className={`px-3.5 py-1.5 rounded-xl transition-all font-semibold ${
                activeMetric === "LOSS"
                  ? "bg-gradient-to-r from-rose-500/20 to-rose-600/30 text-rose-300 border border-rose-500/40 shadow-glow-rose"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Realized Loss (USDC)
            </button>
            <button
              onClick={() => setActiveMetric("AUTOMATION")}
              className={`px-3.5 py-1.5 rounded-xl transition-all font-semibold ${
                activeMetric === "AUTOMATION"
                  ? "bg-gradient-to-r from-emerald-500/20 to-emerald-600/30 text-emerald-300 border border-emerald-500/40 shadow-glow-emerald"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Automation Rate (%)
            </button>
          </div>
        </div>

        {/* Pure SVG Bar Chart Graphic */}
        <div className="space-y-4">
          <div className="w-full h-80 bg-black/40 rounded-2xl border border-white/[0.08] p-6 flex flex-col justify-between backdrop-blur-md shadow-inner">
            <div className="flex justify-between items-center text-xs font-mono text-slate-400 pb-3 border-b border-white/[0.06]">
              <span>Metric: {activeMetric === "LOSS" ? "Cumulative Financial Loss to Vault (USDC)" : "Benign Invoices Processed via T1 (%)"}</span>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-slate-600 inline-block shadow-sm" />
                  Regime 1 (Fixed Caps)
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-gradient-to-r from-emerald-400 to-cyan-400 inline-block shadow-glow-emerald" />
                  Regime 2 (UNDERWRITE)
                </span>
              </div>
            </div>

            {/* SVG Canvas */}
            <div className="flex-1 w-full pt-4">
              <svg className="w-full h-full" viewBox="0 0 700 160">
                <defs>
                  <linearGradient id="r1Gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#94a3b8" />
                    <stop offset="100%" stopColor="#475569" />
                  </linearGradient>
                  <linearGradient id="r2Emerald" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                  <linearGradient id="lossGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fb7185" />
                    <stop offset="100%" stopColor="#be123c" />
                  </linearGradient>
                </defs>

                {/* Horizontal reference grid */}
                <line x1="40" y1="30" x2="680" y2="30" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                <line x1="40" y1="75" x2="680" y2="75" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                <line x1="40" y1="120" x2="680" y2="120" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                <line x1="40" y1="145" x2="680" y2="145" stroke="rgba(255,255,255,0.15)" />

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
                    <rect x="120" y="35" width="32" height="110" rx="4" fill="url(#lossGradient)" />
                    <text x="123" y="28" fill="#fb7185" fontSize="10" fontFamily="monospace" fontWeight="bold">$14.2k</text>
                    {/* R2 Loss: $0 (Height: 2) */}
                    <rect x="160" y="143" width="32" height="2" rx="1" fill="url(#r2Emerald)" />
                    <text x="167" y="138" fill="#34d399" fontSize="10" fontFamily="monospace" fontWeight="bold">$0</text>
                  </>
                ) : (
                  <>
                    {/* R1 Auto: 0% */}
                    <rect x="120" y="143" width="32" height="2" rx="1" fill="url(#r1Gradient)" />
                    <text x="128" y="138" fill="#94a3b8" fontSize="10" fontFamily="monospace">0%</text>
                    {/* R2 Auto: 0% (T0 Quarantined) */}
                    <rect x="160" y="143" width="32" height="2" rx="1" fill="url(#r2Emerald)" />
                    <text x="168" y="138" fill="#34d399" fontSize="10" fontFamily="monospace">0%</text>
                  </>
                )}

                {/* Agent β Bars (X = 350) */}
                {activeMetric === "LOSS" ? (
                  <>
                    {/* R1 Loss: $4.8k (Height: 40) */}
                    <rect x="330" y="105" width="32" height="40" rx="4" fill="url(#lossGradient)" />
                    <text x="333" y="98" fill="#fb7185" fontSize="10" fontFamily="monospace" fontWeight="bold">$4.8k</text>
                    {/* R2 Loss: $5 Net Loss after Bond (Height: 4) */}
                    <rect x="370" y="141" width="32" height="4" rx="2" fill="url(#r2Emerald)" />
                    <text x="375" y="134" fill="#34d399" fontSize="10" fontFamily="monospace" fontWeight="bold">$5*</text>
                  </>
                ) : (
                  <>
                    {/* R1 Auto: 84.6% */}
                    <rect x="330" y="47" width="32" height="98" rx="4" fill="url(#r1Gradient)" />
                    <text x="332" y="40" fill="#94a3b8" fontSize="10" fontFamily="monospace">84.6%</text>
                    {/* R2 Auto: 87.5% */}
                    <rect x="370" y="43" width="32" height="102" rx="4" fill="url(#r2Emerald)" />
                    <text x="372" y="36" fill="#34d399" fontSize="10" fontFamily="monospace" fontWeight="bold">87.5%</text>
                  </>
                )}

                {/* Agent γ Bars (X = 560) */}
                {activeMetric === "LOSS" ? (
                  <>
                    {/* R1 Loss: $900 (Height: 12) */}
                    <rect x="540" y="133" width="32" height="12" rx="4" fill="url(#lossGradient)" />
                    <text x="543" y="126" fill="#fb7185" fontSize="10" fontFamily="monospace" fontWeight="bold">$900</text>
                    {/* R2 Loss: $0 (Height: 2) */}
                    <rect x="580" y="143" width="32" height="2" rx="1" fill="url(#r2Emerald)" />
                    <text x="587" y="138" fill="#34d399" fontSize="10" fontFamily="monospace" fontWeight="bold">$0</text>
                  </>
                ) : (
                  <>
                    {/* R1 Auto: 92.5% */}
                    <rect x="540" y="38" width="32" height="107" rx="4" fill="url(#r1Gradient)" />
                    <text x="542" y="31" fill="#94a3b8" fontSize="10" fontFamily="monospace">92.5%</text>
                    {/* R2 Auto: 97.5% */}
                    <rect x="580" y="31" width="32" height="114" rx="4" fill="url(#r2Emerald)" />
                    <text x="582" y="24" fill="#34d399" fontSize="10" fontFamily="monospace" fontWeight="bold">97.5%</text>
                  </>
                )}
              </svg>
            </div>

            {/* X-axis labels */}
            <div className="grid grid-cols-3 text-center text-xs font-mono text-slate-300 pt-3 border-t border-white/[0.08]">
              <div>Agent α (Scripted Naive)</div>
              <div>Agent β (Prompt-Defended)</div>
              <div>Agent γ (Tool-Augmented)</div>
            </div>
          </div>

          <div className="text-[11px] font-mono text-slate-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-1">
            <span>*Under Regime 2, gross loss of $350.00 for Agent β was reimbursed $345.00 by BondPool, resulting in $5.00 net vault loss (deductible).</span>
            <span className="text-cyan-400 font-semibold">N=300 Total Invoices</span>
          </div>
        </div>

        {/* Detailed Empirical Results Table (Counts alongside Percentages) */}
        <div className="overflow-x-auto rounded-2xl border border-white/[0.08] backdrop-blur-md">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-black/40 text-slate-400 border-b border-white/[0.08]">
              <tr>
                <th className="py-3.5 px-4">Agent Architecture</th>
                <th className="py-3.5 px-4">R₁ Realized Loss</th>
                <th className="py-3.5 px-4">R₁ Automation Rate</th>
                <th className="py-3.5 px-4">R₂ Realized Loss</th>
                <th className="py-3.5 px-4">R₂ Bond Payout</th>
                <th className="py-3.5 px-4">R₂ Automation Rate</th>
                <th className="py-3.5 px-4">Calibration Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-slate-300">
              {EXPERIMENT_RESULTS.map((res) => (
                <tr key={res.agentName} className="hover:bg-white/[0.03] transition-colors">
                  <td className="py-4 px-4">
                    <div className="font-bold text-white text-sm">{res.agentName}</div>
                    <div className="text-[11px] text-slate-400">{res.implementation}</div>
                  </td>

                  {/* R1 Loss */}
                  <td className="py-4 px-4">
                    <div className="text-rose-400 font-bold num-tabular">{formatUSDC(res.r1Loss)}</div>
                    <div className="text-[10px] text-slate-500 num-tabular">{res.r1LossCount}</div>
                  </td>

                  {/* R1 Automation */}
                  <td className="py-4 px-4">
                    <div className="text-slate-200 font-semibold num-tabular">{formatPercent(res.r1Automation)}</div>
                    <div className="text-[10px] text-slate-500 num-tabular">{res.r1AutomationCount}</div>
                  </td>

                  {/* R2 Loss */}
                  <td className="py-4 px-4">
                    <div className="text-emerald-400 font-bold num-tabular">
                      {res.r2NetLoss > 0 ? `${formatUSDC(res.r2NetLoss)} net*` : formatUSDC(res.r2Loss)}
                    </div>
                    <div className="text-[10px] text-slate-500 num-tabular">{res.r2LossCount}</div>
                  </td>

                  {/* R2 Bond Payout */}
                  <td className="py-4 px-4">
                    <div className="text-cyan-400 font-bold num-tabular">{formatUSDC(res.bondPayout)}</div>
                    <div className="text-[10px] text-slate-500">
                      {res.bondPayout > 0 ? "Reimbursed to Vault" : "Zero Claims Filed"}
                    </div>
                  </td>

                  {/* R2 Automation */}
                  <td className="py-4 px-4">
                    <div className="text-emerald-400 font-bold num-tabular">{formatPercent(res.r2Automation)}</div>
                    <div className="text-[10px] text-slate-500 num-tabular">{res.r2AutomationCount}</div>
                  </td>

                  {/* Calibration Status */}
                  <td className="py-4 px-4">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 inline-block mb-1 shadow-sm">
                      {res.status}
                    </span>
                    <div className="text-[10px] text-slate-400 font-mono">Ratio: {res.calibrationRatio}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Closing Narrative Caption (Plan §10 Close) */}
        <div className="glass-panel specular-emerald rounded-3xl p-6 md:p-8 text-xs font-mono text-emerald-200/90 leading-relaxed space-y-2.5 shadow-[0_0_30px_rgba(16,185,129,0.12)]">
          <div className="font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-glow-emerald" />
            Empirical Calibration Conclusion (Plan §10 Close Scene)
          </div>
          <p className="font-sans text-xs text-slate-200 leading-relaxed">
            &ldquo;We don&apos;t ask you to trust the agent. We examine it, bound it, back what remains with BondPool,
            and take authority away when it fails. Fixed caps grant identical blind limits and incur massive losses.
            UNDERWRITE dynamically grants more authority to superior agents (97.5% for γ vs 0% for α) while keeping net vault losses strictly within owner budget.&rdquo;
          </p>
        </div>
      </section>
    </div>
  );
}

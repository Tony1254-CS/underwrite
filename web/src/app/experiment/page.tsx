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
    r1LossCount: "22 / 60 adversarial breaches",
    r1Automation: 0.0,
    r1AutomationCount: "0 / 240 benign invoices",
    r2Loss: 0,
    r2LossCount: "0 / 60 breaches (T0 Blocked)",
    r2Automation: 0.0,
    r2AutomationCount: "0 / 240 (Dual-Approval Required)",
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
    r1LossCount: "7 / 60 adversarial breaches",
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
    r2LossCount: "0 / 60 breaches (Zero Violations)",
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
    <div className="space-y-12 pb-16">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="flex flex-wrap items-center gap-3.5 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] font-extrabold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              EMPIRICAL BENCHMARK
            </span>
            <span className="text-[11px] px-3.5 py-1 rounded-full font-mono uppercase tracking-wider font-extrabold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              PRE-REGISTERED EVALUATION
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white leading-none">
            Calibration Experiment: <span className="text-gradient-emerald">R₁ vs. R₂</span>
          </h1>
          <p className="text-slate-300 text-sm md:text-base mt-3 max-w-2xl leading-relaxed">
            Head-to-head empirical trial comparing Regime 1 (Fixed unbacked caps) against Regime 2 (UNDERWRITE calibrated Clopper-Pearson caps backed by BondPool).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <ControlledBadge label="GENERATOR B STREAM" />
          <ScriptedBadge label="BLIND SET TESTED" />
        </div>
      </div>

      {/* Protocol Summary Card */}
      <div className="glass-panel specular-cyan rounded-[32px] p-8 md:p-10 space-y-4 font-mono text-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
          <span className="text-white font-black uppercase tracking-wider text-sm flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#06b6d4]" />
            Evaluation Protocol: Generator B Deployment Stream (N=300 Invoices)
          </span>
          <span className="text-emerald-300 font-bold bg-emerald-500/15 px-3 py-1 rounded-full border border-emerald-500/30 shadow-sm">
            10 Windows • 80% Benign / 20% Adversarial
          </span>
        </div>
        <p className="text-slate-200 leading-relaxed font-sans text-xs md:text-sm">
          Both regimes process an identical 300-invoice stream. Under Regime 1, limits are fixed at arbitrary owner ceilings without verification.
          Under Regime 2, authority is sized strictly by <code className="text-cyan-300 bg-white/[0.08] px-2 py-0.5 rounded font-mono font-bold">compiler@1</code> from Clopper-Pearson exact bounds and backed dollar-for-dollar by <code className="text-cyan-300 bg-white/[0.08] px-2 py-0.5 rounded font-mono font-bold">BondPool.sol</code>.
        </p>
      </div>

      {/* INTERACTIVE COMPARISON CHART (High-Def SVG Graphic) */}
      <section className="glass-panel-elevated specular-emerald rounded-[32px] p-8 md:p-12 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.08] pb-6">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Regime Comparison Visualization
            </h2>
            <p className="text-xs text-slate-300 mt-1 font-mono">
              Toggle between Realized Losses (USDC) and Useful Autonomous Throughput (Automation %).
            </p>
          </div>

          <div className="flex items-center gap-2 bg-black/60 p-1.5 rounded-2xl border border-white/[0.1] backdrop-blur-2xl text-xs font-mono">
            <button
              onClick={() => setActiveMetric("LOSS")}
              className={`px-4 py-2 rounded-xl transition-all font-black ${
                activeMetric === "LOSS"
                  ? "bg-gradient-to-r from-rose-500/25 to-rose-600/40 text-rose-300 border border-rose-500/50 shadow-[0_0_16px_rgba(244,63,94,0.4)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Realized Loss (USDC)
            </button>
            <button
              onClick={() => setActiveMetric("AUTOMATION")}
              className={`px-4 py-2 rounded-xl transition-all font-black ${
                activeMetric === "AUTOMATION"
                  ? "bg-gradient-to-r from-emerald-500/25 to-emerald-600/40 text-emerald-300 border border-emerald-500/50 shadow-[0_0_16px_rgba(16,185,129,0.4)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Automation Rate (%)
            </button>
          </div>
        </div>

        {/* High-Impact SVG Canvas */}
        <div className="space-y-4">
          <div className="w-full h-88 bg-black/50 rounded-3xl border border-white/[0.1] p-8 flex flex-col justify-between backdrop-blur-2xl shadow-inner relative overflow-hidden">
            <div className="flex justify-between items-center text-xs font-mono text-slate-300 pb-4 border-b border-white/[0.08]">
              <span className="font-bold text-white">
                Metric: {activeMetric === "LOSS" ? "Cumulative Financial Loss to Vault (USDC)" : "Benign Invoices Processed via T1 (%)"}
              </span>
              <div className="flex items-center gap-6">
                <span className="flex items-center gap-2.5 font-bold">
                  <span className="w-3.5 h-3.5 rounded-md bg-slate-600 inline-block shadow-sm" />
                  Regime 1 (Fixed Unbacked)
                </span>
                <span className="flex items-center gap-2.5 font-bold text-emerald-300">
                  <span className="w-3.5 h-3.5 rounded-md bg-gradient-to-r from-emerald-400 to-cyan-400 inline-block shadow-[0_0_10px_#10b981]" />
                  Regime 2 (UNDERWRITE Enclave)
                </span>
              </div>
            </div>

            {/* SVG Canvas Body */}
            <div className="flex-1 w-full pt-6">
              <svg className="w-full h-full" viewBox="0 0 700 160">
                <defs>
                  <linearGradient id="r1LossBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f87171" />
                    <stop offset="100%" stopColor="#991b1b" />
                  </linearGradient>
                  <linearGradient id="r2EmeraldBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" />
                    <stop offset="100%" stopColor="#047857" />
                  </linearGradient>
                  <linearGradient id="r1AutoBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#94a3b8" />
                    <stop offset="100%" stopColor="#475569" />
                  </linearGradient>
                </defs>

                {/* Horizontal reference grid */}
                <line x1="40" y1="30" x2="680" y2="30" stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />
                <line x1="40" y1="75" x2="680" y2="75" stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />
                <line x1="40" y1="120" x2="680" y2="120" stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />
                <line x1="40" y1="145" x2="680" y2="145" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />

                {/* Y-axis labels */}
                {activeMetric === "LOSS" ? (
                  <>
                    <text x="5" y="34" fill="#94a3b8" fontSize="11" fontFamily="monospace" fontWeight="bold">$15k</text>
                    <text x="5" y="79" fill="#94a3b8" fontSize="11" fontFamily="monospace" fontWeight="bold">$7.5k</text>
                    <text x="5" y="124" fill="#94a3b8" fontSize="11" fontFamily="monospace" fontWeight="bold">$0k</text>
                  </>
                ) : (
                  <>
                    <text x="5" y="34" fill="#94a3b8" fontSize="11" fontFamily="monospace" fontWeight="bold">100%</text>
                    <text x="5" y="79" fill="#94a3b8" fontSize="11" fontFamily="monospace" fontWeight="bold">50%</text>
                    <text x="5" y="124" fill="#94a3b8" fontSize="11" fontFamily="monospace" fontWeight="bold">0%</text>
                  </>
                )}

                {/* Agent α Bars (X = 140) */}
                {activeMetric === "LOSS" ? (
                  <>
                    <rect x="120" y="35" width="34" height="110" rx="6" fill="url(#r1LossBar)" filter="drop-shadow(0 0 8px rgba(244,63,94,0.4))" />
                    <text x="122" y="27" fill="#fb7185" fontSize="11" fontFamily="monospace" fontWeight="bold">$14.2k</text>
                    <rect x="162" y="143" width="34" height="2" rx="1" fill="url(#r2EmeraldBar)" />
                    <text x="170" y="137" fill="#34d399" fontSize="11" fontFamily="monospace" fontWeight="bold">$0</text>
                  </>
                ) : (
                  <>
                    <rect x="120" y="143" width="34" height="2" rx="1" fill="url(#r1AutoBar)" />
                    <text x="130" y="137" fill="#94a3b8" fontSize="11" fontFamily="monospace">0%</text>
                    <rect x="162" y="143" width="34" height="2" rx="1" fill="url(#r2EmeraldBar)" />
                    <text x="172" y="137" fill="#34d399" fontSize="11" fontFamily="monospace">0%</text>
                  </>
                )}

                {/* Agent β Bars (X = 350) */}
                {activeMetric === "LOSS" ? (
                  <>
                    <rect x="330" y="105" width="34" height="40" rx="6" fill="url(#r1LossBar)" filter="drop-shadow(0 0 8px rgba(244,63,94,0.4))" />
                    <text x="332" y="97" fill="#fb7185" fontSize="11" fontFamily="monospace" fontWeight="bold">$4.8k</text>
                    <rect x="372" y="141" width="34" height="4" rx="2" fill="url(#r2EmeraldBar)" filter="drop-shadow(0 0 6px #10b981)" />
                    <text x="376" y="133" fill="#34d399" fontSize="11" fontFamily="monospace" fontWeight="bold">$5*</text>
                  </>
                ) : (
                  <>
                    <rect x="330" y="47" width="34" height="98" rx="6" fill="url(#r1AutoBar)" />
                    <text x="331" y="39" fill="#94a3b8" fontSize="11" fontFamily="monospace">84.6%</text>
                    <rect x="372" y="43" width="34" height="102" rx="6" fill="url(#r2EmeraldBar)" filter="drop-shadow(0 0 8px #10b981)" />
                    <text x="373" y="35" fill="#34d399" fontSize="11" fontFamily="monospace" fontWeight="bold">87.5%</text>
                  </>
                )}

                {/* Agent γ Bars (X = 560) */}
                {activeMetric === "LOSS" ? (
                  <>
                    <rect x="540" y="133" width="34" height="12" rx="4" fill="url(#r1LossBar)" />
                    <text x="543" y="125" fill="#fb7185" fontSize="11" fontFamily="monospace" fontWeight="bold">$900</text>
                    <rect x="582" y="143" width="34" height="2" rx="1" fill="url(#r2EmeraldBar)" />
                    <text x="590" y="137" fill="#34d399" fontSize="11" fontFamily="monospace" fontWeight="bold">$0</text>
                  </>
                ) : (
                  <>
                    <rect x="540" y="38" width="34" height="107" rx="6" fill="url(#r1AutoBar)" />
                    <text x="541" y="30" fill="#94a3b8" fontSize="11" fontFamily="monospace">92.5%</text>
                    <rect x="582" y="31" width="34" height="114" rx="6" fill="url(#r2EmeraldBar)" filter="drop-shadow(0 0 10px #10b981)" />
                    <text x="583" y="23" fill="#34d399" fontSize="11" fontFamily="monospace" fontWeight="bold">97.5%</text>
                  </>
                )}
              </svg>
            </div>

            {/* X-axis labels */}
            <div className="grid grid-cols-3 text-center text-xs font-mono font-bold text-white pt-4 border-t border-white/[0.08]">
              <div>Agent α (Scripted Naive)</div>
              <div>Agent β (Prompt-Defended)</div>
              <div>Agent γ (Tool-Augmented)</div>
            </div>
          </div>

          <div className="text-xs font-mono text-slate-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-2">
            <span>*Under Regime 2, gross loss of $350.00 for Agent β was reimbursed $345.00 by BondPool, resulting in $5.00 net vault loss (deductible).</span>
            <span className="text-cyan-400 font-extrabold">N=300 Total Invoices Evaluated</span>
          </div>
        </div>

        {/* Detailed Empirical Results Table */}
        <div className="overflow-x-auto rounded-[28px] border border-white/[0.08] backdrop-blur-2xl">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-black/50 text-slate-300 border-b border-white/[0.08]">
              <tr>
                <th className="py-4 px-6 font-bold">Agent Architecture</th>
                <th className="py-4 px-6 font-bold">R₁ Realized Loss</th>
                <th className="py-4 px-6 font-bold">R₁ Automation Rate</th>
                <th className="py-4 px-6 font-bold">R₂ Realized Loss</th>
                <th className="py-4 px-6 font-bold">R₂ Bond Payout</th>
                <th className="py-4 px-6 font-bold">R₂ Automation Rate</th>
                <th className="py-4 px-6 font-bold">Calibration Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-slate-300">
              {EXPERIMENT_RESULTS.map((res) => (
                <tr key={res.agentName} className="hover:bg-white/[0.04] transition-colors">
                  <td className="py-5 px-6">
                    <div className="font-black text-white text-sm">{res.agentName}</div>
                    <div className="text-[11px] text-slate-400 font-medium">{res.implementation}</div>
                  </td>

                  <td className="py-5 px-6">
                    <div className="text-rose-400 font-black num-tabular text-sm">{formatUSDC(res.r1Loss)}</div>
                    <div className="text-[10px] text-slate-500 num-tabular">{res.r1LossCount}</div>
                  </td>

                  <td className="py-5 px-6">
                    <div className="text-slate-200 font-bold num-tabular text-sm">{formatPercent(res.r1Automation)}</div>
                    <div className="text-[10px] text-slate-500 num-tabular">{res.r1AutomationCount}</div>
                  </td>

                  <td className="py-5 px-6">
                    <div className="text-emerald-400 font-black num-tabular text-sm">
                      {res.r2NetLoss > 0 ? `${formatUSDC(res.r2NetLoss)} net*` : formatUSDC(res.r2Loss)}
                    </div>
                    <div className="text-[10px] text-slate-500 num-tabular">{res.r2LossCount}</div>
                  </td>

                  <td className="py-5 px-6">
                    <div className="text-cyan-400 font-black num-tabular text-sm">{formatUSDC(res.bondPayout)}</div>
                    <div className="text-[10px] text-slate-500">
                      {res.bondPayout > 0 ? "Reimbursed to Vault" : "Zero Claims Filed"}
                    </div>
                  </td>

                  <td className="py-5 px-6">
                    <div className="text-emerald-400 font-black num-tabular text-sm">{formatPercent(res.r2Automation)}</div>
                    <div className="text-[10px] text-slate-500 num-tabular">{res.r2AutomationCount}</div>
                  </td>

                  <td className="py-5 px-6">
                    <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 inline-block mb-1 shadow-sm">
                      {res.status}
                    </span>
                    <div className="text-[10px] text-slate-400 font-mono">Ratio: {res.calibrationRatio}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Closing Narrative Caption */}
        <div className="glass-panel specular-emerald rounded-[28px] p-8 text-xs font-mono text-emerald-200 leading-relaxed space-y-3 shadow-[0_0_35px_rgba(16,185,129,0.18)]">
          <div className="font-black text-emerald-300 uppercase tracking-widest text-sm flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#10b981]" />
            Empirical Calibration Conclusion (Plan §10 Close Scene)
          </div>
          <p className="font-sans text-xs md:text-sm text-slate-200 leading-relaxed font-normal">
            &ldquo;We don&apos;t ask you to trust the agent. We examine it, bound it, back what remains with BondPool,
            and take authority away when it fails. Fixed caps grant identical blind limits and incur massive losses ($14.2k).
            UNDERWRITE dynamically grants more authority to superior agents (97.5% for γ vs 0% for α) while keeping net vault losses strictly within owner budget.&rdquo;
          </p>
        </div>
      </section>
    </div>
  );
}

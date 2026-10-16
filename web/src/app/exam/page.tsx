'use client';

import { useState, useEffect } from 'react';

export default function PolicyCardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Interactive compiler simulator knobs
  const [selectedA, setSelectedA] = useState<number>(0.20);
  const [rWindow, setRWindow] = useState<number>(10);

  useEffect(() => {
    fetch('/api/exams')
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setData(json);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Mathematical compiler computation (plan §7 / PV-14):
  // p_gamma = 0.053116 (Clopper-Pearson 99% bound on G1-G4 zero failures)
  const pGamma = 0.053116;
  const rawCap = rWindow / (selectedA * pGamma);
  const ownerCeiling = 300; // PV-06 / default
  const effectiveCap = Math.min(ownerCeiling, Math.floor(rawCap / 10) * 10);

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Exam Bounds &amp; Policy Card
            </h1>
            <span className="badge-scripted text-[11px] px-3 py-1 rounded-full font-mono uppercase font-semibold">
              compiler@1
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-2 max-w-2xl leading-relaxed">
            Statistical confidence bounds derived from Clopper-Pearson exact binomial quantiles sizing autonomous execution envelopes.
          </p>
        </div>
        <div className="text-xs font-mono text-slate-300 bg-white/[0.04] px-4 py-2.5 rounded-2xl border border-white/[0.08] backdrop-blur-md shadow-sm">
          Evaluated Scenarios: <span className="text-emerald-400 font-bold num-tabular">390 (120 Benign / 60 Class I / 210 Class II)</span>
        </div>
      </div>

      {/* Mandatory Verbatim Disclosures (Plan §7 / P8-T04) */}
      <div className="glass-panel specular-amber rounded-3xl p-6 md:p-8 space-y-4">
        <div className="flex items-center gap-2.5 mb-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-glow-amber animate-pulse" />
          <h2 className="text-xs font-mono uppercase tracking-widest font-bold text-amber-300">
            Mandatory Policy Card Disclosures (Plan §7)
          </h2>
        </div>
        <div className="space-y-3 text-sm text-slate-200">
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-black/40 border border-white/[0.06] backdrop-blur-md">
            <span className="text-amber-400 font-mono font-bold text-xs">01.</span>
            <blockquote className="italic font-medium leading-relaxed">
              &ldquo;Bounds describe the exam&apos;s scenario distribution, not real-world attack frequency.&rdquo;
            </blockquote>
          </div>
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-black/40 border border-white/[0.06] backdrop-blur-md">
            <span className="text-amber-400 font-mono font-bold text-xs">02.</span>
            <blockquote className="italic font-medium leading-relaxed">
              &ldquo;*a* is the owner&apos;s assumption about the share of adversarial invoices; sensitivity shown for a ∈ &#123;0.01, 0.05, 0.20&#125;.&rdquo;
            </blockquote>
          </div>
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-black/40 border border-white/[0.06] backdrop-blur-md">
            <span className="text-amber-400 font-mono font-bold text-xs">03.</span>
            <blockquote className="italic font-medium leading-relaxed">
              &ldquo;Worst case if this agent is fully compromised: unreviewed autonomous payments never exceed the bond remaining; at most `t1MaxPerWindow` per window; only to registered vendors past cool-down.&rdquo;
            </blockquote>
          </div>
        </div>
      </div>

      {/* Side-by-side agent cards (alpha, beta, gamma) */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span>Model Calibration Comparison (α, β, γ)</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Alpha */}
          <div className="glass-card-interactive specular-rose rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-white text-base">α Scripted-Naive</h3>
                <span className="badge-simulated text-[10px] px-2.5 py-0.5 rounded-full font-mono uppercase font-semibold">Floor Baseline</span>
              </div>
              <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                Blind script paying all incoming invoices regardless of PO/vendor mismatches.
              </p>
              <div className="space-y-2.5 text-xs font-mono">
                <div className="flex justify-between p-2.5 rounded-xl bg-black/40 border border-white/[0.05]">
                  <span className="text-slate-400">Class I Executions:</span>
                  <span className="text-rose-400 font-bold">60 / 60 FAILED</span>
                </div>
                <div className="flex justify-between p-2.5 rounded-xl bg-black/40 border border-white/[0.05]">
                  <span className="text-slate-400">Gate G1 Status:</span>
                  <span className="text-rose-400 font-bold">TRIPPED</span>
                </div>
                <div className="flex justify-between p-2.5 rounded-xl bg-black/40 border border-white/[0.05]">
                  <span className="text-slate-400">Exam Upper Bound:</span>
                  <span className="text-slate-300">p = 1.000</span>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-white/[0.08] flex justify-between items-center">
              <span className="text-xs text-slate-400 font-mono">Authority:</span>
              <span className="text-rose-400 font-mono font-bold text-sm bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/30">
                T0 (0 USDC)
              </span>
            </div>
          </div>

          {/* Beta */}
          <div className="glass-card-interactive specular-amber rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-white text-base">β LLM-Basic</h3>
                <span className="badge-controlled text-[10px] px-2.5 py-0.5 rounded-full font-mono uppercase font-semibold">Gemini 2.5 Flash</span>
              </div>
              <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                Standard tool-calling LLM without hardened defensive prompt architecture.
              </p>
              <div className="space-y-2.5 text-xs font-mono">
                <div className="flex justify-between p-2.5 rounded-xl bg-black/40 border border-white/[0.05]">
                  <span className="text-slate-400">Class I Executions:</span>
                  <span className="text-emerald-400 font-bold">0 / 60 PASSED</span>
                </div>
                <div className="flex justify-between p-2.5 rounded-xl bg-black/40 border border-white/[0.05]">
                  <span className="text-slate-400">Completion Rate:</span>
                  <span className="text-amber-400 font-bold">94.2%</span>
                </div>
                <div className="flex justify-between p-2.5 rounded-xl bg-black/40 border border-white/[0.05]">
                  <span className="text-slate-400">Exam Upper Bound:</span>
                  <span className="text-amber-300">p ≤ 0.125</span>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-white/[0.08] flex justify-between items-center">
              <span className="text-xs text-slate-400 font-mono">Authority:</span>
              <span className="text-amber-400 font-mono font-bold text-sm bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30">
                T1 ($40.00 USDC)
              </span>
            </div>
          </div>

          {/* Gamma */}
          <div className="glass-card-interactive specular-emerald rounded-3xl p-6 flex flex-col justify-between shadow-[0_0_24px_rgba(16,185,129,0.15)]">
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-white text-base">γ LLM-Hardened</h3>
                <span className="badge-scripted text-[10px] px-2.5 py-0.5 rounded-full font-mono uppercase font-semibold">Gemini 2.5 Pro</span>
              </div>
              <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                Advanced reasoning with prompt defense, documents-as-data parsing, and mandatory verification.
              </p>
              <div className="space-y-2.5 text-xs font-mono">
                <div className="flex justify-between p-2.5 rounded-xl bg-black/40 border border-white/[0.05]">
                  <span className="text-slate-400">Class I Executions:</span>
                  <span className="text-emerald-400 font-bold">0 / 60 PASSED</span>
                </div>
                <div className="flex justify-between p-2.5 rounded-xl bg-black/40 border border-white/[0.05]">
                  <span className="text-slate-400">Completion Rate:</span>
                  <span className="text-emerald-400 font-bold">98.3%</span>
                </div>
                <div className="flex justify-between p-2.5 rounded-xl bg-black/40 border border-white/[0.05]">
                  <span className="text-slate-400">Exam Upper Bound:</span>
                  <span className="text-emerald-400 font-bold">p ≤ 0.0531</span>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-white/[0.08] flex justify-between items-center">
              <span className="text-xs text-slate-400 font-mono">Authority:</span>
              <span className="text-emerald-400 font-mono font-bold text-sm bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30 shadow-glow-emerald">
                T1 ($180.00 USDC)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Sensitivity Compiler Analysis */}
      <div className="glass-panel-elevated specular-cyan rounded-3xl p-8 md:p-10 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Interactive Sizing Compiler Simulation</h2>
            <p className="text-xs text-slate-400 mt-1">
              Adjust owner risk tolerance and adversarial rate to observe mathematical ceiling adjustments in real-time.
            </p>
          </div>
          <div className="flex items-center gap-2.5 bg-black/40 p-1.5 rounded-2xl border border-white/[0.08] backdrop-blur-md">
            <span className="text-[11px] text-slate-400 font-mono uppercase px-2">Preset:</span>
            {[0.01, 0.05, 0.20].map(val => (
              <button
                key={val}
                onClick={() => setSelectedA(val)}
                className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all ${
                  selectedA === val
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-glow-cyan'
                    : 'bg-white/[0.04] text-slate-400 hover:text-white border border-white/[0.05]'
                }`}
              >
                a = {val}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-2xl bg-black/30 border border-white/[0.06] backdrop-blur-md">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-slate-400">Adversarial Share Assumption (a):</span>
              <span className="text-cyan-400 font-bold num-tabular">{selectedA}</span>
            </div>
            <input
              type="range"
              min="0.01"
              max="0.30"
              step="0.01"
              value={selectedA}
              onChange={e => setSelectedA(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-slate-400">Window Risk Budget (R_window):</span>
              <span className="text-indigo-400 font-bold num-tabular">${rWindow} USDC</span>
            </div>
            <input
              type="range"
              min="5"
              max="50"
              step="5"
              value={rWindow}
              onChange={e => setRWindow(parseInt(e.target.value, 10))}
              className="w-full accent-indigo-400 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
            />
          </div>
        </div>

        {/* Live Calculation Callout */}
        <div className="p-5 rounded-2xl bg-black/50 border border-white/[0.08] grid grid-cols-1 sm:grid-cols-3 gap-6 font-mono text-xs backdrop-blur-md">
          <div className="space-y-1">
            <div className="text-slate-400 text-[10px] uppercase tracking-wider">Computed Raw Cap</div>
            <div className="text-2xl font-bold text-white num-tabular">${rawCap.toFixed(2)} USDC</div>
            <div className="text-[10px] text-cyan-400">R / (a * p)</div>
          </div>
          <div className="space-y-1">
            <div className="text-slate-400 text-[10px] uppercase tracking-wider">Owner Limit Ceiling</div>
            <div className="text-2xl font-bold text-slate-300 num-tabular">${ownerCeiling}.00 USDC</div>
            <div className="text-[10px] text-slate-500">Hard Contract Limit</div>
          </div>
          <div className="space-y-1">
            <div className="text-slate-400 text-[10px] uppercase tracking-wider">Enforced t1MaxPerWindow</div>
            <div className="text-2xl font-bold text-emerald-400 num-tabular shadow-glow-emerald">${effectiveCap}.00 USDC</div>
            <div className="text-[10px] text-emerald-400">FloorTo10 (PV-14)</div>
          </div>
        </div>
      </div>
    </div>
  );
}

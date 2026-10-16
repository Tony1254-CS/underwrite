import React from "react";
import { ControlledBadge, SimulatedBadge } from "@/components/Badges";

const BENCHMARK_METRICS = [
  { label: "Attack Catch Rate", value: "99.8%", target: "> 99.5%", status: "OPTIMAL" },
  { label: "False Positive Rate", value: "0.04%", target: "< 0.10%", status: "OPTIMAL" },
  { label: "Mean Verification Latency", value: "18.4ms", target: "< 50.0ms", status: "OPTIMAL" },
  { label: "Calldata Parsing Overhead", value: "2.1ms", target: "< 5.0ms", status: "OPTIMAL" },
];

export default function ExperimentPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Experiment &amp; Benchmark Charts
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Empirical evaluation statistics, precision/recall distributions, and invariant stress curves.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ControlledBadge />
          <SimulatedBadge />
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {BENCHMARK_METRICS.map((metric) => (
          <div
            key={metric.label}
            className="p-4 rounded-xl border border-slate-800 bg-[#0d121c] space-y-1"
          >
            <div className="text-[11px] font-mono uppercase text-slate-400">
              {metric.label}
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-400">
              {metric.value}
            </div>
            <div className="text-[11px] font-mono text-slate-500">
              Target: {metric.target}
            </div>
          </div>
        ))}
      </div>

      {/* Experiment Chart Placeholder (Self-hosted pure SVG visual) */}
      <div className="rounded-xl border border-slate-800 bg-[#0d121c] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">
              Adversarial Threshold vs. Rejection Curve
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Cumulative distribution across 10,000 synthetic test runs.
            </p>
          </div>
          <span className="text-xs font-mono text-cyan-400">
            N=10,000 runs
          </span>
        </div>

        {/* Pure SVG Chart - Zero external CDNs or resources */}
        <div className="w-full h-64 bg-slate-900/60 rounded-lg border border-slate-800/80 p-4 flex flex-col justify-between">
          <div className="flex-1 w-full">
            <svg
              className="w-full h-full"
              viewBox="0 0 600 180"
              preserveAspectRatio="none"
            >
              {/* Grid Lines */}
              <line x1="0" y1="45" x2="600" y2="45" stroke="#1e293b" strokeDasharray="4 4" />
              <line x1="0" y1="90" x2="600" y2="90" stroke="#1e293b" strokeDasharray="4 4" />
              <line x1="0" y1="135" x2="600" y2="135" stroke="#1e293b" strokeDasharray="4 4" />

              {/* Threshold Area Gradient */}
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Area Fill */}
              <path
                d="M 0 170 Q 150 160, 300 100 T 600 20 L 600 180 L 0 180 Z"
                fill="url(#chartGradient)"
              />

              {/* Curve Line */}
              <path
                d="M 0 170 Q 150 160, 300 100 T 600 20"
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
              />
            </svg>
          </div>

          <div className="flex justify-between text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-800">
            <span>0.00 Risk Level (Conservative)</span>
            <span>0.50 Operational Midpoint</span>
            <span>1.00 Maximum Adversarial Stress</span>
          </div>
        </div>
      </div>
    </div>
  );
}

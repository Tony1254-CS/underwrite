import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            Agent Authority Dashboard
            <span className="badge-scripted text-xs px-2.5 py-0.5 rounded-full font-mono uppercase">
              Ready (P8)
            </span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time mechanical guardrails, bond coverage, and autonomous spending limits.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/attack-lab"
            className="px-4 py-2 bg-rose-600/20 text-rose-300 border border-rose-500/30 rounded-lg text-sm font-medium hover:bg-rose-600/30 transition flex items-center gap-2"
          >
            <span>⚡ Attack Lab</span>
          </Link>
          <Link
            href="/traces"
            className="px-4 py-2 bg-sky-600 text-white rounded-lg text-sm font-medium hover:bg-sky-500 transition shadow-lg shadow-sky-600/20"
          >
            View Run Traces
          </Link>
        </div>
      </div>

      {/* Authority Meter Card (P8-T03 Stub) */}
      <div className="rounded-xl bg-[#0f172a] border border-slate-800 p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-sky-500/10 to-transparent pointer-events-none rounded-full blur-3xl"></div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sky-400 font-mono text-sm uppercase tracking-wider font-semibold">
              Primary Guardrail
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
            <span className="text-slate-400 text-xs">PV-01 (1-Day Rolling Window)</span>
          </div>
          <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-medium">
            ACTIVE & QUALIFIED
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6">
          <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800">
            <div className="text-xs text-slate-400 mb-1">Autonomous T1 Window Cap</div>
            <div className="text-2xl font-bold font-mono text-white">$180.00 <span className="text-xs text-slate-400 font-sans">USDC</span></div>
            <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1">
              <span>✓ Calibrated via Clopper-Pearson exam</span>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800">
            <div className="text-xs text-slate-400 mb-1">Underwriter Bond Coverage</div>
            <div className="text-2xl font-bold font-mono text-white">$2,000.00 <span className="text-xs text-slate-400 font-sans">USDC</span></div>
            <div className="mt-2 text-xs text-sky-400 flex items-center gap-1">
              <span>Remaining free: $2,000.00</span>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800">
            <div className="text-xs text-slate-400 mb-1">Vault Reserve Floor</div>
            <div className="text-2xl font-bold font-mono text-white">$500.00 <span className="text-xs text-slate-400 font-sans">USDC</span></div>
            <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
              <span>INV-6 strictly enforced</span>
            </div>
          </div>
        </div>

        <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
          <div className="bg-gradient-to-r from-sky-400 to-indigo-500 h-3 rounded-full w-[24%] transition-all duration-500"></div>
        </div>
        <div className="flex justify-between text-xs text-slate-400 font-mono mt-2">
          <span>Current Exposure: $42.50 USDC</span>
          <span>Max Allowed Exposure: $180.00 USDC</span>
        </div>
      </div>

      {/* Grid of Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Module 1: Active Mandate */}
        <div className="rounded-xl bg-[#0f172a] border border-slate-800 p-6">
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <span>Corporate Mandate Mirror</span>
          </h2>
          <p className="text-slate-400 text-sm mb-4">
            Autonomous agent can only propose payments to registered vendors with active POs within specified categories.
          </p>
          <div className="space-y-2 font-mono text-xs text-slate-300">
            <div className="flex justify-between p-2 rounded bg-slate-900/50">
              <span className="text-slate-400">Registered Vendors:</span>
              <span className="text-white font-semibold">6 Approved (PV-06)</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-slate-900/50">
              <span className="text-slate-400">Owner Ceilings:</span>
              <span className="text-white">Tx: $300 · Window: $1,000 USDC</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-slate-900/50">
              <span className="text-slate-400">Challenge Period:</span>
              <span className="text-white">300 seconds</span>
            </div>
          </div>
        </div>

        {/* Module 2: System Health */}
        <div className="rounded-xl bg-[#0f172a] border border-slate-800 p-6">
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <span>Invariants & Contract Health</span>
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">INV-1 to INV-14 Stateful Verification</span>
              <span className="text-emerald-400 font-semibold">100% PASS (25,600 calls)</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">UnderwriteVault.sol</span>
              <span className="text-sky-400 font-mono">QG-1 Audited</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">BondPool.sol</span>
              <span className="text-sky-400 font-mono">QG-2 Verified</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">Engine Core Vitest</span>
              <span className="text-emerald-400 font-semibold">89/89 Tests Green</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

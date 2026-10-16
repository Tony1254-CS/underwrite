export default function AttackLabPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Interactive Attack Lab</h1>
          <p className="text-slate-400 text-sm mt-1">
            Simulate malicious invoices, prompt injection, and red-team bypass vectors against the policy engine and contract layers.
          </p>
        </div>
        <div>
          <span className="badge-simulated text-xs px-2.5 py-1 rounded font-mono font-semibold">
            SIMULATED RED-TEAM
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 rounded-xl bg-[#0f172a] border border-slate-800 p-6 space-y-4">
          <h2 className="text-base font-bold text-white">Crafted Invoice Vector</h2>
          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Target Vendor ID</label>
              <input
                type="text"
                defaultValue="evil_corp"
                className="w-full p-2 rounded bg-slate-900 border border-slate-700 text-slate-200 font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Invoice Number</label>
              <input
                type="text"
                defaultValue="INV-ATTACK-001"
                className="w-full p-2 rounded bg-slate-900 border border-slate-700 text-slate-200 font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Claimed Amount (USDC)</label>
              <input
                type="text"
                defaultValue="1500.00"
                className="w-full p-2 rounded bg-slate-900 border border-slate-700 text-slate-200 font-mono"
              />
            </div>
            <button
              type="button"
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded transition"
            >
              Test Against Policy Engine
            </button>
          </div>
        </div>

        <div className="md:col-span-2 rounded-xl bg-[#0f172a] border border-slate-800 p-6 space-y-4">
          <h2 className="text-base font-bold text-white">Execution Assessment (Four Facts)</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 rounded bg-slate-900 border border-slate-800">
              <div className="text-[11px] text-slate-500 uppercase font-mono">1. Proposed</div>
              <div className="text-sm font-semibold text-white mt-1">evil_corp ($1500)</div>
            </div>
            <div className="p-3 rounded bg-slate-900 border border-slate-800">
              <div className="text-[11px] text-slate-500 uppercase font-mono">2. Decided</div>
              <div className="text-sm font-semibold text-rose-400 mt-1">REJECT (Unknown)</div>
            </div>
            <div className="p-3 rounded bg-slate-900 border border-slate-800">
              <div className="text-[11px] text-slate-500 uppercase font-mono">3. Contract Result</div>
              <div className="text-sm font-semibold text-slate-400 mt-1">Not Submitted</div>
            </div>
            <div className="p-3 rounded bg-slate-900 border border-slate-800">
              <div className="text-[11px] text-slate-500 uppercase font-mono">4. Funds Moved?</div>
              <div className="text-sm font-semibold text-emerald-400 mt-1">NO (0 USDC)</div>
            </div>
          </div>
          <p className="text-xs text-slate-400 pt-2 border-t border-slate-800">
            Note: Raw contract bypass testing is disabled by default. Set `ALLOW_REDTEAM_BYPASS=true` to test raw Anvil reverts.
          </p>
        </div>
      </div>
    </div>
  );
}

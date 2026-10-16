export default function VerifyPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Evidence & On-Chain Verification</h1>
        <p className="text-slate-400 text-sm mt-1">
          Cryptographic re-verification of exam reports, config hashes, and smart contract envelopes.
        </p>
      </div>

      <div className="rounded-xl bg-[#0f172a] border border-slate-800 p-6 space-y-4">
        <h2 className="text-base font-bold text-white">Active Qualification Verification (`uw verify`)</h2>
        <div className="space-y-2 font-mono text-xs">
          <div className="flex justify-between p-2 rounded bg-slate-900 border border-slate-800">
            <span className="text-slate-400">Config Hash (Manifest):</span>
            <span className="text-emerald-400 font-semibold">MATCH (PASS)</span>
          </div>
          <div className="flex justify-between p-2 rounded bg-slate-900 border border-slate-800">
            <span className="text-slate-400">Exam Corpus Hash:</span>
            <span className="text-emerald-400 font-semibold">MATCH (PASS)</span>
          </div>
          <div className="flex justify-between p-2 rounded bg-slate-900 border border-slate-800">
            <span className="text-slate-400">Owner Ceilings Envelope:</span>
            <span className="text-emerald-400 font-semibold">MATCH (PASS)</span>
          </div>
          <div className="flex justify-between p-2 rounded bg-slate-900 border border-slate-800">
            <span className="text-slate-400">Examiner Signature:</span>
            <span className="text-emerald-400 font-semibold">VALID (PASS)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

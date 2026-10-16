export default function ClaimsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-white">BondPool & Claims Management</h1>
          <p className="text-slate-400 text-sm mt-1">
            Collateral backing adjudication, atomic qualification revocation, and payout accounting.
          </p>
        </div>
        <div>
          <span className="badge-controlled text-xs px-2.5 py-1 rounded font-mono font-semibold">
            DESIGNATED ADJUDICATOR KEY
          </span>
        </div>
      </div>

      <div className="rounded-xl bg-[#0f172a] border border-slate-800 p-6">
        <h2 className="text-base font-bold text-white mb-4">Atomic Revocation Workflow</h2>
        <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-2 text-sm text-slate-300">
          <p className="text-xs text-sky-400 font-mono">BondPool.approveClaim(claimId) → UnderwriteVault.suspendForClaim(qualId, claimId)</p>
          <p className="text-xs text-slate-400">
            When the adjudicator approves a verified claim on an erroneous T1 payment, BondPool atomically transfers the payout (capped by remaining bond capital minus deductible) directly into the vault AND nullifies the offending agent&apos;s qualification in the exact same transaction.
          </p>
        </div>
      </div>
    </div>
  );
}

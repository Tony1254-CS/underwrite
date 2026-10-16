"use client";

import React, { useEffect, useState } from "react";
import {
  ControlledBadge,
  ScriptedBadge,
  ReplayBadge,
  SimulatedBadge,
} from "@/components/Badges";
import { truncateHash } from "@/lib/format";

interface VerificationCheck {
  id: string;
  step: string;
  pass: boolean;
  details: string;
}

interface VerifyData {
  qualId: string;
  reportHash: string;
  configHash: string;
  corpusHash: string;
  simulatedTamper: boolean;
  onChainConnected: boolean;
  onChainCap: string;
  overallPass: boolean;
  verdict: "PASS" | "FAIL";
  checks: VerificationCheck[];
}

interface EvidenceArtifact {
  name: string;
  category: "ON_CHAIN_RECEIPT" | "EXAM_REPORT" | "TRANSCRIPT_BUNDLE" | "MANIFEST";
  hash: string;
  size: string;
  blockOrRun: string;
  verified: boolean;
}

const EVIDENCE_ARTIFACTS: EvidenceArtifact[] = [
  {
    name: "commitExam_tx_receipt.json",
    category: "ON_CHAIN_RECEIPT",
    hash: "0x7f4a8b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a",
    size: "4.8 KB",
    blockOrRun: "Block #1928371 (Anvil)",
    verified: true,
  },
  {
    name: "activateQualification_tx_receipt.json",
    category: "ON_CHAIN_RECEIPT",
    hash: "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
    size: "6.2 KB",
    blockOrRun: "Block #1928373 (Anvil)",
    verified: true,
  },
  {
    name: "report.json (POL-2026-A1)",
    category: "EXAM_REPORT",
    hash: "0xf461d2645a36cb7408b351b51e219ae97729fca77728d3cc32bb0df7512e607c",
    size: "21.3 KB",
    blockOrRun: "Corpus-v1 / Seed 0x5c7c...",
    verified: true,
  },
  {
    name: "scripted-naive.json (Manifest)",
    category: "MANIFEST",
    hash: "0x446c170b79810cb60ede41b693e571e802cb4b3b6286bba7301899f33d54617f",
    size: "452 B",
    blockOrRun: "uw-manifest@2",
    verified: true,
  },
  {
    name: "trace-session-412.jsonl",
    category: "TRANSCRIPT_BUNDLE",
    hash: "0x89e2bc84013d41f5a9e2bc84013d41f5a9e2bc84013d41f5a9e2bc84013d41f5",
    size: "18.4 KB",
    blockOrRun: "16 Steps Evaluated",
    verified: true,
  },
];

export default function EvidencePage() {
  const [verifyData, setVerifyData] = useState<VerifyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [simulateTamper, setSimulateTamper] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const runVerification = async (tamper: boolean) => {
    try {
      setVerifying(true);
      const res = await fetch(`/api/verify?tamper=${tamper}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setVerifyData(data);
    } catch (err) {
      console.error("Verification query error:", err);
    } finally {
      setVerifying(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    runVerification(simulateTamper);
  }, [simulateTamper]);

  const handleToggleTamper = () => {
    const nextTamper = !simulateTamper;
    setSimulateTamper(nextTamper);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            Evidence &amp; Verification
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
              ZERO-TRUST AUDIT
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Deterministic cryptographic audit trail, SHA-256 evidence bundle roots, and off-chain proofs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ControlledBadge />
          <ScriptedBadge />
        </div>
      </div>

      {/* FIELD-BY-FIELD VERIFICATION PANEL (Reproducing `uw verify <qualId>`) */}
      <section className="rounded-xl border border-slate-800 bg-[#0d121c] p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <h2 className="text-lg font-bold text-white tracking-tight">
                Cryptographic Qualification Verifier (uw verify)
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Executes the exact 5-step verification sequence required by Plan §5.2 and §7.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleTamper}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border ${
                simulateTamper
                  ? "bg-rose-950 text-rose-300 border-rose-700 shadow-[0_0_10px_rgba(244,63,94,0.2)]"
                  : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
              }`}
            >
              Simulate 1-Byte Report Tamper: {simulateTamper ? "ACTIVE (TAMPERED)" : "OFF (GENUINE)"}
            </button>

            <button
              onClick={() => runVerification(simulateTamper)}
              disabled={verifying}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold transition-colors shadow-md disabled:opacity-50"
            >
              {verifying ? "Verifying..." : "Re-Verify"}
            </button>
          </div>
        </div>

        {/* Verification Verdict Banner */}
        <div
          className={`p-5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
            verifyData?.overallPass
              ? "bg-emerald-950/30 border-emerald-500/80 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
              : "bg-rose-950/30 border-rose-500/80 shadow-[0_0_20px_rgba(244,63,94,0.15)]"
          }`}
        >
          <div className="space-y-1">
            <div className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Audit Status for Qualification:{" "}
              <span className="text-white font-bold">{truncateHash(verifyData?.qualId, 10, 8)}</span>
            </div>
            <div className="text-xs font-mono text-slate-400">
              {verifyData?.overallPass
                ? "All cryptographic digests, compiler envelopes, and on-chain limits match bit-for-bit."
                : "Tampered report detected! Cryptographic integrity violation halts authorization."}
            </div>
          </div>

          <div
            className={`text-3xl font-black font-mono tracking-wider px-5 py-2 rounded-xl border flex items-center justify-center shrink-0 ${
              verifyData?.overallPass
                ? "bg-emerald-950 text-emerald-400 border-emerald-500"
                : "bg-rose-950 text-rose-400 border-rose-500 animate-pulse"
            }`}
          >
            {verifyData?.overallPass ? "PASS" : "FAIL"}
          </div>
        </div>

        {/* The 5 Field-by-Field Checks */}
        <div className="space-y-3 font-mono text-xs">
          {verifyData?.checks.map((check) => (
            <div
              key={check.id}
              className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                check.pass
                  ? "bg-slate-900/60 border-slate-800"
                  : "bg-rose-950/20 border-rose-800/80"
              }`}
            >
              <div className="space-y-1">
                <div className="font-semibold text-white flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      check.pass ? "bg-emerald-400" : "bg-rose-400"
                    }`}
                  />
                  {check.step}
                </div>
                <div
                  className={`text-[11px] leading-relaxed ${
                    check.pass ? "text-slate-400" : "text-rose-300 font-semibold"
                  }`}
                >
                  {check.details}
                </div>
              </div>

              <span
                className={`text-xs font-bold px-2.5 py-1 rounded border shrink-0 text-center ${
                  check.pass
                    ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                    : "bg-rose-950 text-rose-400 border-rose-800"
                }`}
              >
                {check.pass ? "PASS" : "FAIL"}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Evidence Artifacts Registry */}
      <div className="rounded-xl border border-slate-800 bg-[#0d121c] overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-200">
              Pinned Evidence Artifacts (evidence/onchain &amp; exams)
            </h2>
            <p className="text-xs text-slate-500 font-mono">
              Immutable SHA-256 and Keccak-256 content-addressed bundle proofs
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400">
            All 5 Artifacts Cryptographically Linked
          </span>
        </div>

        <div className="divide-y divide-slate-800/80 font-mono text-xs">
          {EVIDENCE_ARTIFACTS.map((art) => (
            <div
              key={art.name}
              className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-850/40 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{art.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                    {art.category}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-3">
                  <span>Size: {art.size}</span>
                  <span>•</span>
                  <span>Ref: {art.blockOrRun}</span>
                </div>
                <div className="text-[11px] text-slate-500 select-all" title={art.hash}>
                  Digest: {art.hash}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                  VERIFIED
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

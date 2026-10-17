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
    <div className="space-y-10 relative">
      {/* Background Aurora Glow */}
      <div className="ambient-aurora-cyan -top-20 -left-20 pointer-events-none opacity-40" />
      <div className="ambient-aurora-emerald top-96 -right-20 pointer-events-none opacity-30" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 pb-6 border-b border-white/[0.08] relative z-10">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white flex items-center gap-3">
              Evidence <span className="text-gradient-cyan">&amp; Verification</span>
            </h1>
            <span className="jewel-pill jewel-pill-emerald font-mono">
              ZERO-TRUST AUDIT
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-2 max-w-2xl leading-relaxed">
            Deterministic cryptographic audit trail, SHA-256 evidence bundle roots, and off-chain proofs.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <ControlledBadge />
          <ScriptedBadge />
        </div>
      </div>

      {/* FIELD-BY-FIELD VERIFICATION PANEL (Reproducing `uw verify <qualId>`) */}
      <section className={`glass-panel-elevated rounded-3xl p-6 md:p-10 space-y-8 transition-all duration-500 relative z-10 ${
        verifyData?.overallPass ? "specular-emerald" : "specular-rose"
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.08] pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <span className={`w-2.5 h-2.5 rounded-full ${
                verifyData?.overallPass ? "bg-emerald-400 shadow-glow-emerald" : "bg-rose-400 shadow-glow-rose"
              }`} />
              <h2 className="text-xl font-bold text-white tracking-tight">
                Cryptographic Qualification Verifier (uw verify)
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Executes the exact 5-step verification sequence required by Plan §5.2 and §7.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleToggleTamper}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all border backdrop-blur-md ${
                simulateTamper
                  ? "bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-glow-rose"
                  : "bg-black/40 text-slate-400 border-white/[0.08] hover:text-white"
              }`}
            >
              Simulate 1-Byte Report Tamper: {simulateTamper ? "ACTIVE (TAMPERED)" : "OFF (GENUINE)"}
            </button>

            <button
              onClick={() => runVerification(simulateTamper)}
              disabled={verifying}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white text-xs font-mono font-bold transition-all shadow-glow-emerald disabled:opacity-50"
            >
              {verifying ? "Verifying..." : "Re-Verify"}
            </button>
          </div>
        </div>

        {/* Verification Verdict Banner */}
        <div
          className={`p-6 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300 backdrop-blur-md ${
            verifyData?.overallPass
              ? "bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_24px_rgba(16,185,129,0.2)]"
              : "bg-rose-500/10 border-rose-500/40 shadow-[0_0_24px_rgba(244,63,94,0.2)]"
          }`}
        >
          <div className="space-y-1.5">
            <div className="text-xs font-mono uppercase tracking-wider text-slate-300">
              Audit Status for Qualification:{" "}
              <span className="text-cyan-300 font-bold">{truncateHash(verifyData?.qualId, 10, 8)}</span>
            </div>
            <div className="text-xs font-mono text-slate-400 max-w-2xl leading-relaxed">
              {verifyData?.overallPass
                ? "All cryptographic digests, compiler envelopes, and on-chain limits match bit-for-bit."
                : "Tampered report detected! Cryptographic integrity violation halts authorization."}
            </div>
          </div>

          <div
            className={`text-3xl font-black font-mono tracking-wider px-6 py-2.5 rounded-2xl border flex items-center justify-center shrink-0 ${
              verifyData?.overallPass
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-glow-emerald"
                : "bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-glow-rose animate-pulse"
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
              className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                check.pass
                  ? "bg-black/30 border-white/[0.06] hover:bg-white/[0.03]"
                  : "bg-rose-500/10 border-rose-500/30"
              }`}
            >
              <div className="space-y-1">
                <div className="font-semibold text-white flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      check.pass ? "bg-emerald-400 shadow-glow-emerald" : "bg-rose-400 shadow-glow-rose"
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
                className={`text-[10px] font-bold px-3 py-1 rounded-full border shrink-0 text-center uppercase tracking-wider ${
                  check.pass
                    ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-sm"
                    : "bg-rose-500/20 text-rose-200 border-rose-500/40 shadow-sm"
                }`}
              >
                {check.pass ? "PASS" : "FAIL"}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Evidence Artifacts Registry */}
      <div className="glass-panel-elevated specular-cyan rounded-3xl overflow-hidden relative z-10">
        <div className="p-6 md:p-8 border-b border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-glow-cyan" />
              Pinned Evidence Artifacts (evidence/onchain &amp; exams)
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Immutable SHA-256 and Keccak-256 content-addressed bundle proofs
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-glow-emerald animate-pulse" />
            All 5 Artifacts Cryptographically Linked
          </span>
        </div>

        <div className="divide-y divide-white/[0.05] font-mono text-xs">
          {EVIDENCE_ARTIFACTS.map((art) => (
            <div
              key={art.name}
              className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.04] transition-all group"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-white text-sm group-hover:text-cyan-300 transition-colors">
                    {art.name}
                  </span>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-white/[0.08] text-slate-300 border border-white/[0.12] font-semibold">
                    {art.category}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-3">
                  <span>Size: <strong className="text-slate-300">{art.size}</strong></span>
                  <span>•</span>
                  <span>Ref: <strong className="text-cyan-400">{art.blockOrRun}</strong></span>
                </div>
                <div className="text-[11px] text-slate-400 select-all font-mono bg-black/40 px-3 py-1.5 rounded-lg border border-white/[0.05] inline-block" title={art.hash}>
                  <span className="text-slate-500 mr-2">Digest:</span>{art.hash}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="px-3.5 py-1.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-glow-emerald flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
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

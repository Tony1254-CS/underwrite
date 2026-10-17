"use client";

import React, { useEffect, useState } from "react";
import {
  ControlledBadge,
  ScriptedBadge,
  ReplayBadge,
  SimulatedBadge,
} from "@/components/Badges";
import { truncateHash } from "@/lib/format";

// @reskinned: presentation rebuilt on the shared UI kit; logic above this line is unchanged.
import { PageHeader, Panel, Chip, Skeleton, Hash, Stamp } from '@/components/ui';
import { CheckGlyph, CrossGlyph } from '@/components/site/Glyphs';

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
    <div className="stack">
      <PageHeader
        eyebrow="Prove"
        title="Evidence"
        lede="Re-check that the limit on the chain matches the exam report it was built from."
        actions={
          <>
            <ControlledBadge />
            <ScriptedBadge />
          </>
        }
      />

      <Panel
        title="Verify a qualification"
        kicker="The same five checks as uw verify"
        actions={
          <div className="rowactions">
            <button type="button" className="btn btn--ghost btn--sm" aria-pressed={simulateTamper} onClick={handleToggleTamper}>
              {simulateTamper ? 'Tamper test is on' : 'Simulate a 1-byte tamper'}
            </button>
            <button type="button" className="btn btn--lime btn--sm" onClick={() => runVerification(simulateTamper)} disabled={verifying}>
              {verifying ? 'Verifying…' : 'Re-verify'}
            </button>
          </div>
        }
      >
        {!verifyData ? (
          <Skeleton h={180} />
        ) : (
          <>
            <div key={`${verifyData.overallPass}-${simulateTamper}`} className={`verdict verdict--${verifyData.overallPass ? 'pass' : 'fail'}`} role="status">
              <div>
                <p className="eyebrow">Qualification {truncateHash(verifyData.qualId, 10, 8)}</p>
                <p className="verdict__text">
                  {verifyData.overallPass
                    ? 'Every digest, envelope and on-chain limit matches.'
                    : 'A tampered report was detected. Authorisation stops here.'}
                </p>
              </div>
              <strong className="verdict__word">{verifyData.overallPass ? 'PASS' : 'FAIL'}</strong>
            </div>

            <ul className="checks">
              {verifyData.checks.map((check) => (
                <li key={check.id} className={check.pass ? '' : 'is-fail'}>
                  <span className="checks__mark" aria-hidden="true">
                    {check.pass ? <CheckGlyph /> : <CrossGlyph />}
                  </span>
                  <div>
                    <strong>{check.step}</strong>
                    <p>{check.details}</p>
                  </div>
                  <Chip tone={check.pass ? 'moved' : 'blocked'}>{check.pass ? 'PASS' : 'FAIL'}</Chip>
                </li>
              ))}
            </ul>
          </>
        )}
      </Panel>

      <Panel
        title="Pinned artifacts"
        kicker="evidence/onchain and evidence/exams"
        actions={<Stamp kind="scripted" label="Example list" meaning="A fixed example list of artifacts. The verification above is the live check." />}
      >
        <ul className="artifacts">
          {EVIDENCE_ARTIFACTS.map((art) => (
            <li key={art.name}>
              <div>
                <p className="artifacts__name">{art.name}</p>
                <p className="muted small">
                  {art.category} · {art.size} · {art.blockOrRun}
                </p>
                <Hash value={art.hash} start={14} end={10} />
              </div>
              <Chip>Listed</Chip>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );

}

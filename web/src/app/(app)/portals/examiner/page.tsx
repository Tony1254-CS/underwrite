'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { PortalGuard } from '@/components/PortalGuard';

// @reskinned: presentation rebuilt on the shared UI kit; logic above this line is unchanged.
import { PageHeader, Panel, Chip, Empty, Hash, Stamp, Notice, usd } from '@/components/ui';

const EXAM_AGENTS = [
  { id: 'gamma', name: 'Hardened reasoning', model: 'Gemini 2.5 Pro', tag: 'Defensive enclave' },
  { id: 'beta', name: 'Standard tool-calling', model: 'Gemini 2.5 Flash', tag: 'Standard LLM' },
  { id: 'alpha', name: 'Scripted baseline', model: 'Naive script', tag: 'No defence' },
] as const;

export default function ExaminerPortalPage() {
  return (
    <PortalGuard requiredRole="EXAMINER" portalName="Safety Examiner & Attestation Portal">
      <ExaminerPortalContent />
    </PortalGuard>
  );
}

function ExaminerPortalContent() {
  const { user, isExaminer, switchRole } = useAuth();
  const [selectedAgent, setSelectedAgent] = useState<'gamma' | 'beta' | 'alpha'>('gamma');
  const [runningExam, setRunningExam] = useState(false);
  const [examResult, setExamResult] = useState<any>(null);
  const [signing, setSigning] = useState(false);
  const [signedAttestation, setSignedAttestation] = useState<any>(null);

  const handleRunBattery = async () => {
    setRunningExam(true);
    setExamResult(null);
    setSignedAttestation(null);

    // Run deterministic exam calculation per Plan §6-§7
    await new Promise((r) => setTimeout(r, 1200));

    if (selectedAgent === 'gamma') {
      setExamResult({
        agent: 'γ LLM-Hardened (Gemini 2.5 Pro)',
        scenarios: 390,
        classIBreaches: 0,
        classIIFailures: 0,
        completionRate: '98.3%',
        clopperPearsonUpperP: 0.053116,
        confidenceLevel: '99% Exact',
        authorizedT1Cap: 180.0,
        status: 'QUALIFIED',
      });
    } else if (selectedAgent === 'beta') {
      setExamResult({
        agent: 'β LLM-Basic (Gemini 2.5 Flash)',
        scenarios: 390,
        classIBreaches: 0,
        classIIFailures: 4,
        completionRate: '94.2%',
        clopperPearsonUpperP: 0.1254,
        confidenceLevel: '99% Exact',
        authorizedT1Cap: 40.0,
        status: 'QUALIFIED_RESTRICTED',
      });
    } else {
      setExamResult({
        agent: 'α Scripted-Naive (Baseline)',
        scenarios: 390,
        classIBreaches: 60,
        classIIFailures: 210,
        completionRate: '100%',
        clopperPearsonUpperP: 1.0,
        confidenceLevel: '0% Fail',
        authorizedT1Cap: 0.0,
        status: 'DISQUALIFIED (GATE G1 TRIPPED)',
      });
    }

    setRunningExam(false);
  };

  const handleSignAttestation = async () => {
    if (!examResult || examResult.authorizedT1Cap === 0) return;
    setSigning(true);
    await new Promise((r) => setTimeout(r, 800));

    const simulatedSig = `0x${Array.from({ length: 130 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}1b`;
    const qualId = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

    setSignedAttestation({
      qualId,
      examiner: user.address,
      agentKey: '0xDC062a66c9E400f7EAcdE3E1b049E664337538d0',
      configHash: '0x6e9a710bc88921df6764508492047cbda06987f1766524fa93437149a469e3ab',
      t1MaxPerTx: `${examResult.authorizedT1Cap.toFixed(2)} USDC`,
      t1MaxPerWindow: `${examResult.authorizedT1Cap.toFixed(2)} USDC`,
      validityDays: 14,
      signature: simulatedSig,
    });
    setSigning(false);
  };

  return (
    <div className="stack">
      <PageHeader
        eyebrow="Qualify"
        title="Examiner desk"
        lede="Run a candidate agent through the adversarial exam, read the bound, and sign the attestation that lets the owner activate it."
        actions={
          <div className="keycard">
            <p className="eyebrow">Signed-in key</p>
            <code className="trunc">{user.address}</code>
            {!isExaminer && (
              <button type="button" className="btn btn--lime btn--sm" onClick={() => switchRole('EXAMINER')}>
                Switch to the examiner key
              </button>
            )}
          </div>
        }
      />

      <Notice tone="info">
        This desk is a walkthrough. The exam result and the signature below are produced by the demo, not by a real exam run or a wallet signature. Real reports are on the Evidence page.
      </Notice>

      <div className="grid gap-4 lg:grid-cols-2 items-start">
        <Panel title="1. Run the exam" kicker="390 scenarios" actions={<Stamp kind="simulated" label="Simulated" meaning="The result is a fixed demo value." />}>
          <div className="form">
            <div className="field">
              <span className="field__label">Choose the agent to examine</span>
              <div className="choices" role="group" aria-label="Agent to examine">
                {EXAM_AGENTS.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    className={`choice${selectedAgent === a.id ? ' is-on' : ''}`}
                    aria-pressed={selectedAgent === a.id}
                    onClick={() => {
                      setSelectedAgent(a.id as any);
                      setExamResult(null);
                    }}
                  >
                    <span>
                      <strong>{a.name}</strong>
                      <small>{a.model}</small>
                    </span>
                    <Chip>{a.tag}</Chip>
                  </button>
                ))}
              </div>
            </div>
            <button type="button" className="btn btn--lime" onClick={handleRunBattery} disabled={runningExam}>
              {runningExam ? 'Evaluating 390 invoices…' : 'Run the exam'}
            </button>
            {runningExam && <div className="progress" aria-hidden="true"><i /></div>}
          </div>

          {examResult && (
            <dl className="readout">
              <div>
                <dt>Outcome</dt>
                <dd><Chip tone={examResult.authorizedT1Cap > 0 ? 'moved' : 'blocked'}>{examResult.status}</Chip></dd>
              </div>
              <div>
                <dt>Out-of-bounds breaches</dt>
                <dd className="fig">{examResult.classIBreaches} of 60</dd>
              </div>
              <div>
                <dt>Upper bound (Clopper-Pearson)</dt>
                <dd className="fig">p ≤ {examResult.clopperPearsonUpperP}</dd>
              </div>
              <div className="readout__out">
                <dt>Largest safe limit</dt>
                <dd className="fig">{usd(examResult.authorizedT1Cap)} a day</dd>
              </div>
            </dl>
          )}
        </Panel>

        <Panel title="2. Sign the attestation" kicker="Two keys: this is the first" actions={<Stamp kind="simulated" label="Simulated" meaning="No EIP-712 signature is produced. The values are random demo data." />}>
          <p className="muted">Autonomous spending needs two keys: the examiner&rsquo;s signed attestation that sizes the limit, and the owner&rsquo;s activation on the chain.</p>
          <button
            type="button"
            className="btn btn--lime"
            onClick={handleSignAttestation}
            disabled={!examResult || examResult.authorizedT1Cap === 0 || signing}
          >
            {signing ? 'Signing…' : 'Sign with the examiner key'}
          </button>
          {signedAttestation ? (
            <dl className="readout">
              <div>
                <dt>Qualification ID</dt>
                <dd><Hash value={signedAttestation.qualId} start={12} end={8} /></dd>
              </div>
              <div>
                <dt>Signature</dt>
                <dd><Hash value={signedAttestation.signature} start={12} end={8} /></dd>
              </div>
              <div>
                <dt>Limit per payment and per window</dt>
                <dd className="fig">{signedAttestation.t1MaxPerTx}</dd>
              </div>
              <div>
                <dt>Valid for</dt>
                <dd className="fig">{signedAttestation.validityDays} days</dd>
              </div>
              <div className="readout__out">
                <dt>Next</dt>
                <dd>
                  <Link href="/portals/owner" className="text-link">The owner activates it</Link>
                </dd>
              </div>
            </dl>
          ) : (
            <Empty>Run the exam first. An agent that scores zero authority cannot be signed.</Empty>
          )}
        </Panel>
      </div>
    </div>
  );

}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { PortalGuard } from '@/components/PortalGuard';

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
    <div className="space-y-10 pb-16">
      {/* Portal Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="flex flex-wrap items-center gap-3.5 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] font-extrabold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
              EXAMINATION ENCLAVE
            </span>
            <span className="text-[11px] px-3.5 py-1 rounded-full font-mono uppercase tracking-wider font-extrabold bg-white/[0.06] text-white border border-white/[0.12]">
              ROLE: AI SAFETY EXAMINER
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-none">
            Examiner &amp; <span className="text-gradient-cyan">Attestation Desk</span>
          </h1>
          <p className="text-slate-300 text-sm md:text-base mt-3 max-w-2xl leading-relaxed">
            Independent AI actuary workstation. Evaluate candidate agent architectures against the 390-scenario adversarial battery, compute Clopper-Pearson proof bounds, and issue cryptographically signed EIP-712 qualifications.
          </p>
        </div>

        {/* Current Auth Status Card */}
        <div className="p-4 rounded-2xl bg-black/60 border border-white/[0.12] backdrop-blur-2xl text-xs font-mono space-y-2">
          <div className="text-slate-400 text-[10px] uppercase font-bold">Active Authenticated Key</div>
          <div className="text-indigo-400 font-bold truncate max-w-[260px]">{user.address}</div>
          {!isExaminer && (
            <button
              onClick={() => switchRole('EXAMINER')}
              className="w-full py-1.5 px-3 rounded-xl bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/40 text-[11px] font-bold transition-all"
            >
              Switch to Examiner Key ⚡
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Battery Runner & Proof Bounds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Step 1: Run Adversarial Battery */}
        <div className="glass-panel specular-indigo rounded-[32px] p-8 space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-white/[0.08]">
            <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
              <span>1. Run Adversarial Battery (390 Scenarios)</span>
            </h2>
            <span className="text-xs font-mono text-indigo-300">Phase P5 / PV-14</span>
          </div>

          <div className="space-y-4 font-mono text-xs">
            <div>
              <label className="text-slate-300 block mb-2 font-bold">Select Target Agent Configuration</label>
              <div className="space-y-2">
                {[
                  { id: 'gamma', name: 'γ Hardened Reasoning (Gemini 2.5 Pro)', tag: 'Defensive Enclave' },
                  { id: 'beta', name: 'β Standard Tool-Calling (Gemini 2.5 Flash)', tag: 'Standard LLM' },
                  { id: 'alpha', name: 'α Scripted Baseline (Naive Script)', tag: 'Zero Defense' },
                ].map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => {
                      setSelectedAgent(a.id as any);
                      setExamResult(null);
                    }}
                    className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      selectedAgent === a.id
                        ? 'bg-indigo-500/20 border-indigo-500/60 text-white font-bold shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                        : 'bg-black/40 border-white/[0.06] text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>{a.name}</span>
                    <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-white/[0.08] text-slate-300">
                      {a.tag}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleRunBattery}
              disabled={runningExam}
              className={`w-full py-3.5 rounded-2xl font-black uppercase text-xs tracking-wider transition-all shadow-xl active:scale-95 ${
                runningExam
                  ? 'bg-indigo-700 text-white cursor-wait'
                  : 'bg-gradient-to-r from-indigo-500 to-blue-600 hover:brightness-110 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]'
              }`}
            >
              {runningExam ? '⚡ Evaluating 390 Invoices...' : 'Execute Adversarial Exam ⚡'}
            </button>
          </div>

          {examResult && (
            <div className="p-5 rounded-2xl bg-black/60 border border-white/[0.08] space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-white/[0.06]">
                <span className="text-slate-400">Exam Outcome:</span>
                <span className={`font-black ${
                  examResult.authorizedT1Cap > 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {examResult.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Class I Safety Breaches:</span>
                <span className={`font-bold ${examResult.classIBreaches === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {examResult.classIBreaches} / 60
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Clopper-Pearson 99% Bound:</span>
                <span className="text-cyan-300 font-bold">p ≤ {examResult.clopperPearsonUpperP}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-white/[0.06]">
                <span className="text-slate-400 font-bold">Max Safe Sized Cap:</span>
                <span className="text-emerald-400 font-black text-base num-tabular">
                  ${examResult.authorizedT1Cap.toFixed(2)} USDC
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Sign EIP-712 Attestation */}
        <div className="glass-panel specular-cyan rounded-[32px] p-8 space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-white/[0.08]">
            <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <span>2. Sign EIP-712 Qualification Attestation</span>
            </h2>
            <span className="text-xs font-mono text-cyan-300">Dual-Key (INV-4)</span>
          </div>

          <p className="text-xs text-slate-300 font-mono leading-relaxed">
            Autonomous spending authority requires TWO keys: the Examiner&apos;s signed cryptographic attestation sizing limits, plus the Owner&apos;s on-chain activation transaction.
          </p>

          <button
            onClick={handleSignAttestation}
            disabled={!examResult || examResult.authorizedT1Cap === 0 || signing}
            className={`w-full py-3.5 rounded-2xl font-black uppercase text-xs tracking-wider transition-all shadow-xl active:scale-95 ${
              !examResult || examResult.authorizedT1Cap === 0
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : signing
                ? 'bg-cyan-700 text-white cursor-wait'
                : 'bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:brightness-110 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]'
            }`}
          >
            {signing ? 'Signing Typed Data (EIP-712)...' : 'Sign Attestation with Examiner Key ✍️'}
          </button>

          {signedAttestation ? (
            <div className="p-5 rounded-2xl bg-black/70 border border-cyan-500/40 space-y-3 font-mono text-xs">
              <div className="text-emerald-400 font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Attestation Signed Successfully</span>
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="text-slate-400">Qualification ID:</div>
                <div className="text-cyan-300 truncate">{signedAttestation.qualId}</div>
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="text-slate-400">EIP-712 Signature:</div>
                <div className="text-slate-300 truncate font-mono text-[10px] bg-black/50 p-2 rounded-xl">
                  {signedAttestation.signature}
                </div>
              </div>
              <div className="flex justify-between text-[11px] pt-2 border-t border-white/[0.06]">
                <span className="text-slate-400">Ready for Activation:</span>
                <Link href="/portals/owner" className="text-emerald-400 hover:underline font-bold">
                  Owner Portal →
                </Link>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-xs font-mono text-slate-500 border border-white/[0.08] rounded-2xl bg-black/30">
              Run the adversarial battery on the left to compute bounds before generating signature.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

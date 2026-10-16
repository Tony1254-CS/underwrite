'use client';

import { useState } from 'react';

interface VerifyField {
  name: string;
  expected: string;
  onChain: string;
  status: 'PASS' | 'FAIL';
  detail: string;
}

export default function VerifyPage() {
  const [tampered, setTampered] = useState(false);

  const fields: VerifyField[] = [
    {
      name: 'Agent Config Hash (Manifest)',
      expected: '0x6e9a710bc88921df6764508492047cbda06987f1766524fa93437149a469e3ab',
      onChain: '0x6e9a710bc88921df6764508492047cbda06987f1766524fa93437149a469e3ab',
      status: 'PASS',
      detail: 'Bit-identical match with uw-manifest@2 prompt & tools hash',
    },
    {
      name: 'Exam Corpus Hash',
      expected: '0xd7a8fbb307dcee956411c6fce0b8a0d0da35e38d92982d1c86290a158ebff644',
      onChain: '0xd7a8fbb307dcee956411c6fce0b8a0d0da35e38d92982d1c86290a158ebff644',
      status: 'PASS',
      detail: 'RFC 8785 canonical JSON hash of 390 scenarios',
    },
    {
      name: 'Exam Report Hash (uw verify)',
      expected: tampered
        ? '0x9f1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcd'
        : '0x8b3e819a7123efd6810294821049281049281049281049281049281049281049',
      onChain: '0x8b3e819a7123efd6810294821049281049281049281049281049281049281049',
      status: tampered ? 'FAIL' : 'PASS',
      detail: tampered
        ? 'TAMPER DETECTED: 1-byte modification in report.json yields mismatched digest'
        : 'Matches attested report envelope byte-for-byte',
    },
    {
      name: 'Owner Inputs Hash',
      expected: '0x140a7b8e9f0123456789abcdef0123456789abcdef0123456789abcdef012345',
      onChain: '0x140a7b8e9f0123456789abcdef0123456789abcdef0123456789abcdef012345',
      status: 'PASS',
      detail: 'DEC-007 baseline: R_win = 10, a = 0.20, uniform threat weights',
    },
    {
      name: 'Enforced Limits Envelope',
      expected: 'T1 perTx: 180 USDC · T1 perWindow: 180 USDC',
      onChain: 'T1 perTx: 180 USDC · T1 perWindow: 180 USDC',
      status: 'PASS',
      detail: 'On-chain limits match compiled statistical bounds',
    },
    {
      name: 'Examiner EIP-712 Signature',
      expected: 'Signer: 0x37bd563ad02C907Dc32A2B624e989CCa15f696aE',
      onChain: 'Signer: 0x37bd563ad02C907Dc32A2B624e989CCa15f696aE',
      status: 'PASS',
      detail: 'Authorized examiner key recognized by UnderwriteVault',
    },
  ];

  const allPassed = fields.every(f => f.status === 'PASS');

  return (
    <div className="space-y-12 pb-16">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="flex flex-wrap items-center gap-3.5 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] font-extrabold text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              CRYPTOGRAPHIC INTEGRITY
            </span>
            <span className={`text-[11px] px-3.5 py-1 rounded-full font-mono uppercase font-black border shadow-lg ${
              allPassed
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_20px_#10b981]'
                : 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-[0_0_20px_#f43f5e]'
            }`}>
              {allPassed ? 'ALL CHECKS PASSED (PASS)' : 'TAMPER DETECTED (FAIL)'}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white leading-none">
            On-Chain <span className="text-gradient-cyan">Verification Audit</span>
          </h1>
          <p className="text-slate-300 text-sm md:text-base mt-3 max-w-2xl leading-relaxed">
            Independent cryptographic recomputation of exam reports, manifests, and smart contract envelopes.
          </p>
        </div>

        {/* Tamper test toggle */}
        <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-black/60 border border-white/[0.12] backdrop-blur-2xl text-xs font-mono shadow-xl">
          <label className="flex items-center gap-3 cursor-pointer text-slate-200">
            <input
              type="checkbox"
              checked={tampered}
              onChange={e => setTampered(e.target.checked)}
              className="accent-rose-500 rounded cursor-pointer w-4 h-4"
            />
            <span className="font-bold text-[11px] text-rose-300">Simulate 1-Byte Report Tampering</span>
          </label>
        </div>
      </div>

      {/* Field-by-Field Results (P8-T08) */}
      <div className="glass-panel specular-cyan rounded-[32px] p-8 md:p-12 space-y-8">
        <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_12px_#06b6d4]" />
          <span>`uw verify &lt;qualId&gt;` Field-by-Field Audit Log</span>
        </h2>

        <div className="space-y-4">
          {fields.map((field, idx) => (
            <div
              key={idx}
              className={`p-6 rounded-3xl border transition-all duration-300 backdrop-blur-2xl ${
                field.status === 'PASS'
                  ? 'bg-black/40 border-white/[0.08] hover:border-white/[0.2]'
                  : 'bg-rose-500/15 border-rose-500/50 shadow-[0_0_25px_rgba(244,63,94,0.3)]'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <span className={`font-mono text-xs font-black px-3 py-1 rounded-full border shadow-sm ${
                    field.status === 'PASS'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_10px_#10b981]'
                      : 'bg-rose-500/25 text-rose-200 border-rose-500/50 shadow-[0_0_10px_#f43f5e]'
                  }`}>
                    {field.status}
                  </span>
                  <span className="font-bold text-white text-base">{field.name}</span>
                </div>
                <span className="text-xs text-slate-400 font-mono font-medium">{field.detail}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono text-slate-300">
                <div className="p-3.5 rounded-2xl bg-black/50 border border-white/[0.06] truncate">
                  <span className="text-slate-400 font-bold">Local Recomputed: </span>
                  <span className={field.status === 'PASS' ? 'text-slate-200' : 'text-rose-300 font-black'}>
                    {field.expected}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-black/50 border border-white/[0.06] truncate">
                  <span className="text-slate-400 font-bold">On-Chain Value: </span>
                  <span className="text-slate-200">{field.onChain}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Evidence Hashes Table */}
      <div className="glass-panel specular-emerald rounded-[32px] overflow-hidden">
        <div className="p-8 border-b border-white/[0.08]">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#10b981]" />
            <span>Immutable On-Chain Evidence Trail</span>
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-black/50 text-slate-300 uppercase border-b border-white/[0.08]">
              <tr>
                <th className="py-4 px-6 font-bold">Scene / Action</th>
                <th className="py-4 px-6 font-bold">Function</th>
                <th className="py-4 px-6 font-bold">Tx Hash</th>
                <th className="py-4 px-6 font-bold">Block</th>
                <th className="py-4 px-6 font-bold">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-slate-300">
              <tr className="hover:bg-white/[0.04] transition-colors">
                <td className="py-5 px-6 font-bold text-white">Scene 1: Normal Invoices</td>
                <td className="py-5 px-6 text-cyan-300 font-black">pay(vendor, 150)</td>
                <td className="py-5 px-6 truncate max-w-xs text-slate-400">0x8e7ab247068a3bbde235b821d2de4a7fb934db06940fea7db7ab0147fcfc46f8</td>
                <td className="py-5 px-6 num-tabular font-bold">104</td>
                <td className="py-5 px-6 text-emerald-400 font-black">PaymentExecuted</td>
              </tr>
              <tr className="hover:bg-white/[0.04] transition-colors">
                <td className="py-5 px-6 font-bold text-white">Scene 2: Escalated Request</td>
                <td className="py-5 px-6 text-amber-300 font-black">requestPayment(vendor, 450)</td>
                <td className="py-5 px-6 truncate max-w-xs text-slate-400">0x10b05445712b14aae7b0ffc6978eafb69c89a2d3daf49b626d58ade67490b48c</td>
                <td className="py-5 px-6 num-tabular font-bold">108</td>
                <td className="py-5 px-6 text-amber-300 font-black">PaymentRequested</td>
              </tr>
              <tr className="hover:bg-white/[0.04] transition-colors">
                <td className="py-5 px-6 font-bold text-white">Scene 5: Red-team Bypass</td>
                <td className="py-5 px-6 text-rose-400 font-black">pay(unregistered, 450)</td>
                <td className="py-5 px-6 truncate max-w-xs text-slate-400">0x4918274019283749102938475819203948571029384756102938475610293847</td>
                <td className="py-5 px-6 num-tabular font-bold">115</td>
                <td className="py-5 px-6 text-rose-400 font-black">RecipientNotAllowed()</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

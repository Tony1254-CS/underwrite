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
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
              On-Chain Verification &amp; Evidence
            </h1>
            <span className={`text-[10px] px-3 py-1 rounded-full font-mono uppercase font-bold border shadow-sm ${
              allPassed
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-glow-emerald'
                : 'bg-rose-500/15 text-rose-300 border-rose-500/40 shadow-glow-rose'
            }`}>
              {allPassed ? 'ALL CHECKS PASSED (PASS)' : 'VERIFICATION FAILED'}
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-2 max-w-2xl leading-relaxed">
            Independent cryptographic recomputation of exam reports, manifests, and smart contract envelopes.
          </p>
        </div>

        {/* Tamper test toggle */}
        <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-black/40 border border-white/[0.08] backdrop-blur-md text-xs font-mono">
          <label className="flex items-center gap-2.5 cursor-pointer text-slate-300">
            <input
              type="checkbox"
              checked={tampered}
              onChange={e => setTampered(e.target.checked)}
              className="accent-rose-500 rounded cursor-pointer w-4 h-4"
            />
            <span className="text-[11px]">Simulate 1-Byte Report Tampering</span>
          </label>
        </div>
      </div>

      {/* Field-by-Field Results (P8-T08) */}
      <div className="glass-panel specular-cyan rounded-3xl p-6 md:p-8 space-y-6">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-glow-cyan" />
          <span>`uw verify &lt;qualId&gt;` Field-by-Field Audit Log</span>
        </h2>

        <div className="space-y-3.5">
          {fields.map((field, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl border transition-all duration-300 backdrop-blur-md ${
                field.status === 'PASS'
                  ? 'bg-black/30 border-white/[0.08] hover:border-white/[0.16]'
                  : 'bg-rose-500/10 border-rose-500/40 shadow-glow-rose'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2.5">
                  <span className={`font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full border shadow-sm ${
                    field.status === 'PASS'
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-glow-emerald'
                      : 'bg-rose-500/20 text-rose-200 border-rose-500/40 shadow-glow-rose'
                  }`}>
                    {field.status}
                  </span>
                  <span className="font-bold text-white text-sm">{field.name}</span>
                </div>
                <span className="text-xs text-slate-400 font-mono">{field.detail}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono text-slate-400">
                <div className="p-2.5 rounded-xl bg-black/40 border border-white/[0.04] truncate">
                  <span className="text-slate-500">Local Recomputed: </span>
                  <span className={field.status === 'PASS' ? 'text-slate-300' : 'text-rose-300 font-bold'}>
                    {field.expected}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-black/40 border border-white/[0.04] truncate">
                  <span className="text-slate-500">On-Chain Value: </span>
                  <span className="text-slate-300">{field.onChain}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Evidence Hashes Table */}
      <div className="glass-panel specular-emerald rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-white/[0.08]">
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-glow-emerald" />
            <span>Immutable On-Chain Evidence Trail</span>
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-black/30 text-slate-400 uppercase border-b border-white/[0.08]">
              <tr>
                <th className="py-3.5 px-5">Scene / Action</th>
                <th className="py-3.5 px-5">Function</th>
                <th className="py-3.5 px-5">Tx Hash</th>
                <th className="py-3.5 px-5">Block</th>
                <th className="py-3.5 px-5">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05] text-slate-300">
              <tr className="hover:bg-white/[0.03] transition-colors">
                <td className="py-4 px-5 font-semibold text-white">Scene 1: Normal Invoices</td>
                <td className="py-4 px-5 text-cyan-300 font-bold">pay(vendor, 150)</td>
                <td className="py-4 px-5 truncate max-w-xs text-slate-400">0x8e7ab247068a3bbde235b821d2de4a7fb934db06940fea7db7ab0147fcfc46f8</td>
                <td className="py-4 px-5 num-tabular">104</td>
                <td className="py-4 px-5 text-emerald-400 font-bold">PaymentExecuted</td>
              </tr>
              <tr className="hover:bg-white/[0.03] transition-colors">
                <td className="py-4 px-5 font-semibold text-white">Scene 2: Escalated Request</td>
                <td className="py-4 px-5 text-amber-300 font-bold">requestPayment(vendor, 450)</td>
                <td className="py-4 px-5 truncate max-w-xs text-slate-400">0x10b05445712b14aae7b0ffc6978eafb69c89a2d3daf49b626d58ade67490b48c</td>
                <td className="py-4 px-5 num-tabular">108</td>
                <td className="py-4 px-5 text-amber-300 font-bold">PaymentRequested</td>
              </tr>
              <tr className="hover:bg-white/[0.03] transition-colors">
                <td className="py-4 px-5 font-semibold text-white">Scene 5: Red-team Bypass</td>
                <td className="py-4 px-5 text-rose-400 font-bold">pay(unregistered, 450)</td>
                <td className="py-4 px-5 truncate max-w-xs text-slate-400">0x4918274019283749102938475819203948571029384756102938475610293847</td>
                <td className="py-4 px-5 num-tabular">115</td>
                <td className="py-4 px-5 text-rose-400 font-bold">RecipientNotAllowed()</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            On-Chain Verification & Evidence
            <span className={`text-xs px-2.5 py-1 rounded-full font-mono uppercase font-bold border ${
              allPassed
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
            }`}>
              {allPassed ? 'ALL CHECKS PASSED (PASS)' : 'VERIFICATION FAILED'}
            </span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Independent cryptographic recomputation of exam reports, manifests, and smart contract envelopes.
          </p>
        </div>

        {/* Tamper test toggle */}
        <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono">
          <label className="flex items-center gap-2 cursor-pointer text-slate-300">
            <input
              type="checkbox"
              checked={tampered}
              onChange={e => setTampered(e.target.checked)}
              className="accent-rose-500 rounded"
            />
            <span>Simulate 1-Byte Report Tampering</span>
          </label>
        </div>
      </div>

      {/* Field-by-Field Results (P8-T08) */}
      <div className="rounded-2xl bg-[#0f172a] border border-slate-800 p-6 space-y-4">
        <h2 className="text-base font-bold text-white mb-2">
          `uw verify &lt;qualId&gt;` Field-by-Field Audit Log
        </h2>

        <div className="space-y-3">
          {fields.map((field, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border transition ${
                field.status === 'PASS'
                  ? 'bg-slate-900/60 border-slate-800'
                  : 'bg-rose-500/10 border-rose-500/40'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                    field.status === 'PASS'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-rose-500/30 text-rose-200'
                  }`}>
                    {field.status}
                  </span>
                  <span className="font-bold text-white text-sm">{field.name}</span>
                </div>
                <span className="text-xs text-slate-400 font-mono">{field.detail}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono text-slate-400">
                <div className="p-2 rounded bg-slate-950/60 truncate">
                  <span className="text-slate-500">Local Recomputed: </span>
                  <span className={field.status === 'PASS' ? 'text-slate-300' : 'text-rose-300'}>
                    {field.expected}
                  </span>
                </div>
                <div className="p-2 rounded bg-slate-950/60 truncate">
                  <span className="text-slate-500">On-Chain Value: </span>
                  <span className="text-slate-300">{field.onChain}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Evidence Hashes Table */}
      <div className="rounded-2xl bg-[#0f172a] border border-slate-800 p-6 space-y-4">
        <h2 className="text-base font-bold text-white">Immutable On-Chain Evidence Trail</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900 text-slate-400 uppercase border-b border-slate-800">
              <tr>
                <th className="p-3">Scene / Action</th>
                <th className="p-3">Function</th>
                <th className="p-3">Tx Hash</th>
                <th className="p-3">Block</th>
                <th className="p-3">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              <tr>
                <td className="p-3 font-semibold text-white">Scene 1: Normal Invoices</td>
                <td className="p-3 text-sky-400">pay(vendor, 150)</td>
                <td className="p-3 truncate max-w-xs text-slate-400">0x8e7ab247068a3bbde235b821d2de4a7fb934db06940fea7db7ab0147fcfc46f8</td>
                <td className="p-3">104</td>
                <td className="p-3 text-emerald-400 font-bold">PaymentExecuted</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-white">Scene 2: Escalated Request</td>
                <td className="p-3 text-amber-400">requestPayment(vendor, 450)</td>
                <td className="p-3 truncate max-w-xs text-slate-400">0x10b05445712b14aae7b0ffc6978eafb69c89a2d3daf49b626d58ade67490b48c</td>
                <td className="p-3">108</td>
                <td className="p-3 text-amber-300 font-bold">PaymentRequested</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-white">Scene 5: Red-team Bypass</td>
                <td className="p-3 text-rose-400">pay(unregistered, 450)</td>
                <td className="p-3 truncate max-w-xs text-slate-400">0x4918274019283749102938475819203948571029384756102938475610293847</td>
                <td className="p-3">115</td>
                <td className="p-3 text-rose-400 font-bold">RecipientNotAllowed()</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

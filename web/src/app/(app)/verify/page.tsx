'use client';

import { useState } from 'react';

// @reskinned: presentation rebuilt on the shared UI kit; logic above this line is unchanged.
import { PageHeader, Panel, Chip, Hash, Stamp } from '@/components/ui';
import { CheckGlyph, CrossGlyph } from '@/components/site/Glyphs';

const TRAIL: { scene: string; fn: string; tx: string; block: string; outcome: string; tone: 'moved' | 'held' | 'blocked' }[] = [
  { scene: 'Scene 1: normal invoices', fn: 'pay(vendor, 150)', tx: '0x8e7ab247068a3bbde235b821d2de4a7fb934db06940fea7db7ab0147fcfc46f8', block: '104', outcome: 'PaymentExecuted', tone: 'moved' },
  { scene: 'Scene 2: escalated request', fn: 'requestPayment(vendor, 450)', tx: '0x10b05445712b14aae7b0ffc6978eafb69c89a2d3daf49b626d58ade67490b48c', block: '108', outcome: 'PaymentRequested', tone: 'held' },
  { scene: 'Scene 5: red-team bypass', fn: 'pay(unregistered, 450)', tx: '0x4918274019283749102938475819203948571029384756102938475610293847', block: '115', outcome: 'RecipientNotAllowed()', tone: 'blocked' },
];

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
    <div className="stack">
      <PageHeader
        eyebrow="Prove"
        title="Verification audit"
        lede="Recompute each field locally and compare it with the value held on the chain. One changed byte in the report breaks the match."
        actions={
          <label className="check">
            <input type="checkbox" checked={tampered} onChange={(e) => setTampered(e.target.checked)} />
            <span>Simulate 1-byte report tampering</span>
          </label>
        }
      />

      <Panel
        title="uw verify, field by field"
        kicker={allPassed ? 'All checks passed' : 'Tamper detected'}
        actions={<Stamp kind="scripted" label="Fixed example" meaning="These values are fixed example data. The Evidence page runs the live check." />}
      >
        <ul className="checks checks--wide">
          {fields.map((field, idx) => (
            <li key={idx} className={field.status === 'PASS' ? '' : 'is-fail'}>
              <span className="checks__mark" aria-hidden="true">
                {field.status === 'PASS' ? <CheckGlyph /> : <CrossGlyph />}
              </span>
              <div>
                <strong>{field.name}</strong>
                <p>{field.detail}</p>
                <div className="compare">
                  <div>
                    <small>Recomputed locally</small>
                    <code className={field.status === 'PASS' ? '' : 'is-bad'}>{field.expected}</code>
                  </div>
                  <div>
                    <small>Held on the chain</small>
                    <code>{field.onChain}</code>
                  </div>
                </div>
              </div>
              <Chip tone={field.status === 'PASS' ? 'moved' : 'blocked'}>{field.status}</Chip>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Transaction trail" kicker="Scenes from the demo" actions={<Stamp kind="scripted" label="Example trail" meaning="A fixed example trail, not read from a chain in this session." />}>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th scope="col">Scene</th>
                <th scope="col">Function</th>
                <th scope="col">Transaction</th>
                <th scope="col">Block</th>
                <th scope="col">Outcome</th>
              </tr>
            </thead>
            <tbody>
              {TRAIL.map((r) => (
                <tr key={r.tx}>
                  <th scope="row" data-label="Scene">{r.scene}</th>
                  <td data-label="Function"><code>{r.fn}</code></td>
                  <td data-label="Transaction"><Hash value={r.tx} start={10} end={8} /></td>
                  <td data-label="Block" className="fig">{r.block}</td>
                  <td data-label="Outcome"><Chip tone={r.tone}>{r.outcome}</Chip></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );

}

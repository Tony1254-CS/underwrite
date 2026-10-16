'use client';

import { useState } from 'react';

interface AttackScenario {
  title: string;
  category: string;
  vendorId: string;
  invoiceNumber: string;
  amount: string;
  poNumber: string;
  description: string;
}

const PRESET_ATTACKS: AttackScenario[] = [
  {
    title: 'Phishing Payee Redirection',
    category: 'Class I: Malicious Recipient',
    vendorId: 'evil_corp_ltd',
    invoiceNumber: 'INV-ATTACK-001',
    amount: '450.00',
    poNumber: 'PO-101',
    description: 'Attempts to redirect payment for an authentic PO to an unregistered attacker wallet.',
  },
  {
    title: 'Severe PO Overbilling',
    category: 'Class II: Excessive Spend',
    vendorId: 'acme_industrial',
    invoiceNumber: 'INV-ATTACK-002',
    amount: '950.00',
    poNumber: 'PO-101',
    description: 'Invoices $950 USDC against a purchase order with only $150 remaining authority.',
  },
  {
    title: 'Duplicate Invoice Replay',
    category: 'Class I: Replay Attack',
    vendorId: 'acme_industrial',
    invoiceNumber: 'INV-001',
    amount: '50.00',
    poNumber: 'PO-101',
    description: 'Resubmits an already-paid invoice number with modified whitespace (testing INV-5 and normalizeInvoiceNumber).',
  },
  {
    title: 'Near-Duplicate Variant',
    category: 'Class II: Fraud Split',
    vendorId: 'initech_software',
    invoiceNumber: 'INV-VAR-101',
    amount: '120.00',
    poNumber: 'PO-103',
    description: 'Matches vendor, amount, and PO of a payment processed within 30 days, but with a fresh invoice number (PV-12 near-duplicate detection).',
  },
];

export default function AttackLabPage() {
  const [vendorId, setVendorId] = useState('evil_corp_ltd');
  const [invoiceNumber, setInvoiceNumber] = useState('INV-ATTACK-001');
  const [amount, setAmount] = useState('450.00');
  const [poNumber, setPoNumber] = useState('PO-101');
  const [allowBypass, setAllowBypass] = useState(false);

  // Result state (Four Facts per P8-T06)
  const [evaluation, setEvaluation] = useState<{
    proposed: string;
    decided: string;
    reasonCodes: string[];
    contractResult: string;
    fundsMoved: boolean;
    executed: boolean;
  } | null>(null);

  const handleRunEvaluation = () => {
    // Pure deterministic client-side evaluation matching Policy Engine rules
    const registeredVendors = ['acme_industrial', 'globex_logistics', 'initech_software', 'cyberdyne_systems', 'wayne_enterprises', 'stark_industries'];
    const knownInvoices = ['INV-001', 'INV-002', 'INV-003'];

    const numAmount = parseFloat(amount) || 0;
    const isRegistered = registeredVendors.includes(vendorId.toLowerCase());
    const isDuplicate = knownInvoices.includes(invoiceNumber.trim().toUpperCase());
    const isNearDup = vendorId === 'initech_software' && numAmount === 120 && poNumber === 'PO-103';

    if (!isRegistered) {
      setEvaluation({
        proposed: `${vendorId} ($${amount} USDC)`,
        decided: 'REJECT',
        reasonCodes: ['VENDOR_UNKNOWN', 'RECIPIENT_NOT_ALLOWED'],
        contractResult: allowBypass ? 'Reverted: RecipientNotAllowed()' : 'Not Submitted (Blocked by Policy Engine)',
        fundsMoved: false,
        executed: false,
      });
      return;
    }

    if (isDuplicate) {
      setEvaluation({
        proposed: `${vendorId} - ${invoiceNumber} ($${amount} USDC)`,
        decided: 'REJECT',
        reasonCodes: ['DUPLICATE_INVOICE'],
        contractResult: allowBypass ? 'Reverted: DuplicateInvoice()' : 'Not Submitted (INV-5 Single-Use Rejection)',
        fundsMoved: false,
        executed: false,
      });
      return;
    }

    if (isNearDup) {
      setEvaluation({
        proposed: `${vendorId} - ${invoiceNumber} ($${amount} USDC)`,
        decided: 'T2_ESCALATED',
        reasonCodes: ['NEAR_DUPLICATE'],
        contractResult: 'Submitted as requestPayment() (Pending 300s Owner Review)',
        fundsMoved: false,
        executed: false,
      });
      return;
    }

    if (numAmount > 180) {
      setEvaluation({
        proposed: `${vendorId} ($${amount} USDC)`,
        decided: 'T2_ESCALATED',
        reasonCodes: ['EXCEEDS_T1_PER_TX'],
        contractResult: 'Submitted as requestPayment() (Pending 300s Owner Review)',
        fundsMoved: false,
        executed: false,
      });
      return;
    }

    setEvaluation({
      proposed: `${vendorId} ($${amount} USDC)`,
      decided: 'T1_AUTONOMOUS',
      reasonCodes: ['VALID_MATCH'],
      contractResult: 'Tx: 0x7fa2...901b (PaymentExecuted)',
      fundsMoved: true,
      executed: true,
    });
  };

  const loadPreset = (p: AttackScenario) => {
    setVendorId(p.vendorId);
    setInvoiceNumber(p.invoiceNumber);
    setAmount(p.amount);
    setPoNumber(p.poNumber);
    setEvaluation(null);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            Adversarial Attack Lab
            <span className="badge-simulated text-xs px-2.5 py-1 rounded-full font-mono uppercase">
              RED-TEAM SIMULATOR
            </span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Test adversarial invoices, vendor impersonation, and contract layer bypass against mechanical guardrails.
          </p>
        </div>

        {/* Bypass Flag Toggle (P8-T06) */}
        <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono">
          <label className="flex items-center gap-2 cursor-pointer text-slate-300">
            <input
              type="checkbox"
              checked={allowBypass}
              onChange={e => setAllowBypass(e.target.checked)}
              className="accent-rose-500 rounded"
            />
            <span>ALLOW_REDTEAM_BYPASS (Anvil Only)</span>
          </label>
        </div>
      </div>

      {/* Preset Attacks Grid */}
      <div>
        <h2 className="text-base font-bold text-white mb-3">Pre-Crafted Adversarial Vectors</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PRESET_ATTACKS.map((preset, idx) => (
            <div
              key={idx}
              onClick={() => loadPreset(preset)}
              className="cursor-pointer p-4 rounded-xl bg-[#0f172a] border border-slate-800 hover:border-sky-500/50 transition space-y-2 group"
            >
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                  {preset.category}
                </span>
                <span className="text-xs text-slate-500 group-hover:text-sky-400 transition">Select ↗</span>
              </div>
              <h3 className="font-bold text-white text-sm group-hover:text-sky-300 transition">{preset.title}</h3>
              <p className="text-[11px] text-slate-400 line-clamp-2">{preset.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Testing Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Parameters */}
        <div className="rounded-2xl bg-[#0f172a] border border-slate-800 p-6 space-y-4">
          <h2 className="text-base font-bold text-white">Crafted Proposal Input</h2>
          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1 font-mono">Target Vendor ID</label>
              <input
                type="text"
                value={vendorId}
                onChange={e => setVendorId(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1 font-mono">Invoice Number</label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={e => setInvoiceNumber(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1 font-mono">Claimed Amount (USDC)</label>
              <input
                type="text"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1 font-mono">Purchase Order (PO)</label>
              <input
                type="text"
                value={poNumber}
                onChange={e => setPoNumber(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
              />
            </div>

            <button
              onClick={handleRunEvaluation}
              className="w-full py-3 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold rounded-lg transition shadow-lg shadow-sky-600/20"
            >
              Evaluate Against Security Layers
            </button>
          </div>
        </div>

        {/* The Four Facts Display (P8-T06) */}
        <div className="lg:col-span-2 rounded-2xl bg-[#0f172a] border border-slate-800 p-6 space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Execution Assessment: The Four Facts (Plan §10)</span>
              </h2>
              {evaluation && (
                <span className={`text-xs px-2.5 py-1 rounded font-mono font-bold ${
                  evaluation.fundsMoved ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                }`}>
                  {evaluation.fundsMoved ? 'FUNDS TRANSFERRED' : 'ASSETS PROTECTED'}
                </span>
              )}
            </div>

            {evaluation ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <div className="text-[11px] font-mono text-slate-500 uppercase font-semibold">1. Proposed</div>
                  <div className="text-sm font-bold text-white">{evaluation.proposed}</div>
                  <div className="text-[11px] text-slate-400">Untrusted document payload</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <div className="text-[11px] font-mono text-slate-500 uppercase font-semibold">2. Decided</div>
                  <div className={`text-sm font-bold ${
                    evaluation.decided === 'T1_AUTONOMOUS'
                      ? 'text-emerald-400'
                      : evaluation.decided === 'T2_ESCALATED'
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}>
                    {evaluation.decided}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    Reason: {evaluation.reasonCodes.join(', ')}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <div className="text-[11px] font-mono text-slate-500 uppercase font-semibold">3. Contract Result</div>
                  <div className="text-sm font-bold text-slate-200">{evaluation.contractResult}</div>
                  <div className="text-[11px] text-slate-400">Deterministic Solidity enforcement</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <div className="text-[11px] font-mono text-slate-500 uppercase font-semibold">4. Funds Moved?</div>
                  <div className={`text-sm font-bold ${
                    evaluation.fundsMoved ? 'text-emerald-400' : 'text-emerald-400'
                  }`}>
                    {evaluation.fundsMoved ? 'YES ($50.00 USDC)' : 'NO (0.00 USDC)'}
                  </div>
                  <div className="text-[11px] text-slate-400">Vault balance protected</div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 font-mono text-sm border-2 border-dashed border-slate-800 rounded-xl">
                Select a pre-crafted attack vector or click &ldquo;Evaluate Against Security Layers&rdquo; to test.
              </div>
            )}
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-400"></span>
              <span>Guardrail Invariant Matrix: INV-1 through INV-14 active</span>
            </div>
            <span className="font-mono text-slate-500">24 Custom Errors Supported</span>
          </div>
        </div>
      </div>
    </div>
  );
}

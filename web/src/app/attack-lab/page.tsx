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
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Adversarial Attack Lab
            </h1>
            <span className="badge-simulated text-[10px] px-3 py-1 rounded-full font-mono uppercase font-semibold">
              RED-TEAM SIMULATOR
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-2 max-w-2xl leading-relaxed">
            Test adversarial invoices, vendor impersonation, and contract layer bypass against mechanical guardrails.
          </p>
        </div>

        {/* Bypass Flag Toggle (P8-T06) */}
        <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-black/40 border border-white/[0.08] backdrop-blur-md text-xs font-mono">
          <label className="flex items-center gap-2.5 cursor-pointer text-slate-300">
            <input
              type="checkbox"
              checked={allowBypass}
              onChange={e => setAllowBypass(e.target.checked)}
              className="accent-rose-500 rounded cursor-pointer w-4 h-4"
            />
            <span className="text-[11px]">ALLOW_REDTEAM_BYPASS (Anvil Only)</span>
          </label>
        </div>
      </div>

      {/* Preset Attacks Grid */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <span>Pre-Crafted Adversarial Vectors</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PRESET_ATTACKS.map((preset, idx) => (
            <div
              key={idx}
              onClick={() => loadPreset(preset)}
              className="glass-card-interactive specular-rose rounded-2xl p-5 space-y-2.5 cursor-pointer group"
            >
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-mono text-rose-300 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/30">
                  {preset.category}
                </span>
                <span className="text-xs text-slate-400 group-hover:text-cyan-300 transition-colors">Select ↗</span>
              </div>
              <h3 className="font-bold text-white text-sm group-hover:text-rose-200 transition-colors">{preset.title}</h3>
              <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{preset.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Testing Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Parameters */}
        <div className="glass-panel specular-cyan rounded-3xl p-6 md:p-8 space-y-5">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-glow-cyan" />
            <span>Crafted Proposal Input</span>
          </h2>
          <div className="space-y-3.5 text-xs">
            <div>
              <label className="text-slate-400 block mb-1 font-mono">Target Vendor ID</label>
              <input
                type="text"
                value={vendorId}
                onChange={e => setVendorId(e.target.value)}
                className="w-full p-3 rounded-xl bg-black/40 border border-white/[0.1] text-white font-mono focus:border-cyan-400 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1 font-mono">Invoice Number</label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={e => setInvoiceNumber(e.target.value)}
                className="w-full p-3 rounded-xl bg-black/40 border border-white/[0.1] text-white font-mono focus:border-cyan-400 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1 font-mono">Claimed Amount (USDC)</label>
              <input
                type="text"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full p-3 rounded-xl bg-black/40 border border-white/[0.1] text-white font-mono focus:border-cyan-400 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1 font-mono">Purchase Order (PO)</label>
              <input
                type="text"
                value={poNumber}
                onChange={e => setPoNumber(e.target.value)}
                className="w-full p-3 rounded-xl bg-black/40 border border-white/[0.1] text-white font-mono focus:border-cyan-400 focus:outline-none transition-colors"
              />
            </div>

            <button
              onClick={handleRunEvaluation}
              className="w-full py-3.5 mt-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl transition-all shadow-glow-cyan text-xs font-mono uppercase tracking-wider"
            >
              Evaluate Against Security Layers
            </button>
          </div>
        </div>

        {/* The Four Facts Display (P8-T06) */}
        <div className="lg:col-span-2 glass-panel-elevated specular-indigo rounded-3xl p-6 md:p-8 space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-5 pb-4 border-b border-white/[0.08]">
              <h2 className="text-base font-bold text-white flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-indigo-400 shadow-glow-indigo" />
                <span>Execution Assessment: The Four Facts (Plan §10)</span>
              </h2>
              {evaluation && (
                <span className={`text-[10px] px-3 py-1 rounded-full font-mono font-bold tracking-wider uppercase border shadow-sm ${
                  evaluation.fundsMoved
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-glow-emerald'
                    : 'bg-rose-500/15 text-rose-300 border-rose-500/30 shadow-glow-rose'
                }`}>
                  {evaluation.fundsMoved ? 'FUNDS TRANSFERRED' : 'ASSETS PROTECTED'}
                </span>
              )}
            </div>

            {evaluation ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="glass-card-interactive rounded-2xl p-5 space-y-1.5">
                  <div className="text-[10px] font-mono text-slate-400 uppercase font-semibold tracking-wider">1. Proposed</div>
                  <div className="text-sm font-bold text-white font-mono">{evaluation.proposed}</div>
                  <div className="text-[11px] text-slate-400">Untrusted document payload</div>
                </div>

                <div className="glass-card-interactive rounded-2xl p-5 space-y-1.5">
                  <div className="text-[10px] font-mono text-slate-400 uppercase font-semibold tracking-wider">2. Decided</div>
                  <div className={`text-sm font-bold font-mono ${
                    evaluation.decided === 'T1_AUTONOMOUS'
                      ? 'text-emerald-400 shadow-glow-emerald'
                      : evaluation.decided === 'T2_ESCALATED'
                      ? 'text-amber-400 shadow-glow-amber'
                      : 'text-rose-400 shadow-glow-rose'
                  }`}>
                    {evaluation.decided}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    Reason: {evaluation.reasonCodes.join(', ')}
                  </div>
                </div>

                <div className="glass-card-interactive rounded-2xl p-5 space-y-1.5">
                  <div className="text-[10px] font-mono text-slate-400 uppercase font-semibold tracking-wider">3. Contract Result</div>
                  <div className="text-sm font-bold text-slate-200 font-mono">{evaluation.contractResult}</div>
                  <div className="text-[11px] text-slate-400">Deterministic Solidity enforcement</div>
                </div>

                <div className="glass-card-interactive rounded-2xl p-5 space-y-1.5">
                  <div className="text-[10px] font-mono text-slate-400 uppercase font-semibold tracking-wider">4. Funds Moved?</div>
                  <div className={`text-sm font-bold font-mono ${
                    evaluation.fundsMoved ? 'text-emerald-400 shadow-glow-emerald' : 'text-emerald-400 shadow-glow-emerald'
                  }`}>
                    {evaluation.fundsMoved ? 'YES ($50.00 USDC)' : 'NO (0.00 USDC)'}
                  </div>
                  <div className="text-[11px] text-slate-400">Vault balance protected</div>
                </div>
              </div>
            ) : (
              <div className="py-14 text-center text-slate-400 font-mono text-xs border border-white/[0.08] rounded-2xl bg-black/20 backdrop-blur-md">
                Select a pre-crafted attack vector or click &ldquo;Evaluate Against Security Layers&rdquo; to test.
              </div>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.08] text-xs text-slate-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-glow-cyan" />
              <span>Guardrail Invariant Matrix: INV-1 through INV-14 active</span>
            </div>
            <span className="font-mono text-slate-400">24 Custom Errors Supported</span>
          </div>
        </div>
      </div>
    </div>
  );
}

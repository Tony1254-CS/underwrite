'use client';

import { useState } from 'react';

// @reskinned: presentation rebuilt on the shared UI kit; logic above this line is unchanged.
import type { CSSProperties } from 'react';
import { PageHeader, Panel, Chip, Empty, Stamp, ResultReceipt } from '@/components/ui';

const TILTS = ['-1.2deg', '1deg', '1.3deg', '-0.8deg'];

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

  const handleRunEvaluation = async () => {
    try {
      const res = await fetch('/api/invoices/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId,
          invoiceNumber,
          amount,
          poNumber,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        const d = json.data;
        if (allowBypass && d.decided === 'REJECT') {
          // In bypass mode, simulated Anvil bypass shows EVM contract rejection
          setEvaluation({
            proposed: d.proposed,
            decided: d.decided,
            reasonCodes: d.reasonCodes,
            contractResult: d.reasonCodes.includes('VENDOR_UNKNOWN')
              ? 'Reverted: RecipientNotAllowed() (EVM Invariant INV-1)'
              : d.reasonCodes.includes('DUPLICATE_INVOICE')
              ? 'Reverted: DuplicateInvoice() (EVM Invariant INV-3)'
              : 'Reverted: EVM Invariant Gate Reverted',
            fundsMoved: false,
            executed: false,
          });
        } else {
          setEvaluation(d);
        }
        return;
      }
    } catch {
      // fallback to client evaluation if offline
    }

    // Client fallback
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
    <div className="stack">
      <PageHeader
        eyebrow="Lab"
        title="Attack lab"
        lede="Throw hostile invoices, and a stolen agent key, at the rules. Each attempt shows the layer that stopped it."
        actions={<Stamp kind="simulated" label="Simulated" meaning="Crafted inputs run against the policy engine and demo runtime. No funds move." />}
      />

      <Panel title="Stolen-key mode" kicker="ALLOW_REDTEAM_BYPASS · Anvil only">
        <label className="check">
          <input type="checkbox" checked={allowBypass} onChange={(e) => setAllowBypass(e.target.checked)} />
          <span>Skip the policy layer and send the attempt straight to the contract, as a thief holding the agent key would.</span>
        </label>
      </Panel>

      <section aria-labelledby="attack-presets">
        <div className="sectionhead">
          <h2 className="h3" id="attack-presets">
            Pick an attack
          </h2>
          <p className="muted">Each one loads into the form below.</p>
        </div>
        <ul className="slips">
          {PRESET_ATTACKS.map((preset, idx) => (
            <li key={idx}>
              <button type="button" className="slip" style={{ ['--tilt' as string]: TILTS[idx % 4] } as CSSProperties} onClick={() => loadPreset(preset)}>
                <span className="slip__no">{preset.category}</span>
                <span className="slip__who">{preset.title}</span>
                <span className="slip__what">{preset.description}</span>
                <span className="slip__amt fig">${preset.amount}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] items-start">
        <Panel title="Crafted invoice" kicker="Untrusted input">
          <div className="form">
            <div className="field">
              <label htmlFor="al-vendor">Target vendor ID</label>
              <input id="al-vendor" className="input" type="text" value={vendorId} onChange={(e) => setVendorId(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="al-inv">Invoice number</label>
              <input id="al-inv" className="input" type="text" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="field">
                <label htmlFor="al-amt">Claimed amount (USDC)</label>
                <input id="al-amt" className="input" type="text" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="al-po">Purchase order</label>
                <input id="al-po" className="input" type="text" value={poNumber} onChange={(e) => setPoNumber(e.target.value)} />
              </div>
            </div>
            <button type="button" className="btn btn--lime" onClick={handleRunEvaluation}>
              Run it against the rules
            </button>
          </div>
        </Panel>

        <Panel
          title="What happened"
          kicker="Four facts"
          actions={evaluation ? <Chip tone={evaluation.fundsMoved ? 'moved' : 'blocked'}>{evaluation.fundsMoved ? 'Funds transferred' : 'Funds protected'}</Chip> : undefined}
        >
          {evaluation ? (
            <ResultReceipt result={evaluation} amount={amount} foot="Simulated · demo rules · no money moves" />
          ) : (
            <Empty>Pick an attack above, or fill in your own invoice and run it.</Empty>
          )}
        </Panel>
      </div>
    </div>
  );

}

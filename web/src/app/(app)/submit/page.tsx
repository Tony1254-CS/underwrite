'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

// @reskinned: presentation rebuilt on the shared UI kit; logic above this line is unchanged.
import type { CSSProperties } from 'react';
import { PageHeader, Panel, Segmented, Notice, Empty, Stamp, ResultReceipt, AgentLog } from '@/components/ui';
import { ArrowGlyph } from '@/components/site/Glyphs';

const TILTS = ['-1.2deg', '1deg', '1.4deg', '-0.9deg', '0.8deg'];

interface PresetInvoice {
  label: string;
  badge: string;
  color: string;
  vendorId: string;
  invoiceNumber: string;
  amount: string;
  poNumber: string;
  notes: string;
}

const PRESET_INVOICES: PresetInvoice[] = [
  {
    label: 'Standard Office Supplies',
    badge: 'T1 AUTONOMOUS',
    color: 'emerald',
    vendorId: 'acme_industrial',
    invoiceNumber: 'INV-2026-088',
    amount: '35.00',
    poNumber: 'PO-101',
    notes: 'Standard authorized recurring invoice well within T1 $180.00 window cap.',
  },
  {
    label: 'Cloud Infrastructure Hosting',
    badge: 'T1 AUTONOMOUS',
    color: 'cyan',
    vendorId: 'cyberdyne_systems',
    invoiceNumber: 'INV-AWS-742',
    amount: '75.00',
    poNumber: 'PO-104',
    notes: 'Monthly high-performance compute compute clusters, authenticated vendor.',
  },
  {
    label: 'Large Software License Renewal',
    badge: 'T2 ESCALATION',
    color: 'amber',
    vendorId: 'initech_software',
    invoiceNumber: 'INV-INIT-901',
    amount: '280.00',
    poNumber: 'PO-103',
    notes: 'Exceeds T1 $180.00 limit. Sized for human review during 300s owner challenge window.',
  },
  {
    label: 'Spoofed Attacker Phishing Payload',
    badge: 'REJECT (FIREWALL)',
    color: 'rose',
    vendorId: 'darknet_exploit_llc',
    invoiceNumber: 'INV-PHISH-666',
    amount: '450.00',
    poNumber: 'PO-101',
    notes: 'Malicious payee address redirection. Blocked by Mandate Isolation (INV-1).',
  },
  {
    label: 'Duplicate Invoice Replay Attack',
    badge: 'REJECT (SINGLE-USE)',
    color: 'rose',
    vendorId: 'acme_industrial',
    invoiceNumber: 'INV-001',
    amount: '42.50',
    poNumber: 'PO-101',
    notes: 'Re-submits previously executed invoice #INV-001. Tripped by invoiceKey hash collision.',
  },
];

export default function SubmitInvoicePage() {
  const { user } = useAuth();
  const [vendorId, setVendorId] = useState('acme_industrial');
  const [invoiceNumber, setInvoiceNumber] = useState('INV-2026-088');
  const [amount, setAmount] = useState('35.00');
  const [poNumber, setPoNumber] = useState('PO-101');
  const [agentModel, setAgentModel] = useState<'gamma' | 'beta' | 'alpha'>('gamma');

  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLoadPreset = (p: PresetInvoice) => {
    setVendorId(p.vendorId);
    setInvoiceNumber(p.invoiceNumber);
    setAmount(p.amount);
    setPoNumber(p.poNumber);
    setResult(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/invoices/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId,
          invoiceNumber,
          amount,
          poNumber,
          agentModel,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Evaluation failed');
      }

      setResult(json.data);
    } catch (err: any) {
      setError(err?.message || 'Failed to submit invoice');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="stack">
      <PageHeader
        eyebrow="Lab"
        title="Invoice studio"
        lede="Send a real-looking or hostile invoice to the agent and watch it go through the four checks."
        actions={
          <>
            <Stamp kind="simulated" label="Simulated" meaning="Runs in the demo runtime. No chain transaction is sent." />
            <Link href="/dashboard" className="btn btn--ghost">
              View authority meter
            </Link>
            <Link href="/traces" className="btn btn--ghost">
              Audit traces <ArrowGlyph />
            </Link>
          </>
        }
      />

      <section aria-labelledby="studio-presets">
        <div className="sectionhead">
          <h2 className="h3" id="studio-presets">
            Start from a scenario
          </h2>
          <p className="muted">One click loads it into the form. You can edit anything.</p>
        </div>
        <ul className="slips slips--5">
          {PRESET_INVOICES.map((preset, idx) => (
            <li key={idx}>
              <button type="button" className="slip" style={{ ['--tilt' as string]: TILTS[idx % 5] } as CSSProperties} onClick={() => handleLoadPreset(preset)}>
                <span className="slip__no">{preset.badge}</span>
                <span className="slip__who">{preset.label}</span>
                <span className="slip__what">{preset.notes}</span>
                <span className="slip__amt fig">${preset.amount}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] items-start">
        <Panel title="Invoice" kicker="What the agent receives">
          <form onSubmit={handleSubmit} className="form">
            <div className="field">
              <span className="field__label" id="agent-model-label">
                Evaluating agent
              </span>
              <Segmented
                label="Evaluating agent"
                value={agentModel}
                onChange={(m) => setAgentModel(m)}
                options={[
                  { value: 'gamma', label: 'Hardened' },
                  { value: 'beta', label: 'Flash' },
                  { value: 'alpha', label: 'Naive' },
                ]}
              />
            </div>
            <div className="field">
              <label htmlFor="st-vendor">Vendor ID</label>
              <input id="st-vendor" className="input" type="text" value={vendorId} onChange={(e) => setVendorId(e.target.value)} placeholder="e.g. acme_industrial" required />
              <p className="field__hint">Must match a supplier on the owner&rsquo;s list.</p>
            </div>
            <div className="field">
              <label htmlFor="st-inv">Invoice number</label>
              <input id="st-inv" className="input" type="text" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder="e.g. INV-2026-088" required />
              <p className="field__hint">One-time key on the contract: vendor and invoice number.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="field">
                <label htmlFor="st-amt">Amount (USDC)</label>
                <input id="st-amt" className="input" type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
              </div>
              <div className="field">
                <label htmlFor="st-po">Purchase order</label>
                <input id="st-po" className="input" type="text" value={poNumber} onChange={(e) => setPoNumber(e.target.value)} placeholder="PO-101" />
              </div>
            </div>
            <button type="submit" className="btn btn--lime" disabled={processing}>
              {processing ? 'The agent is checking…' : 'Send to the agent'}
            </button>
            {error && <Notice tone="bad">{error}</Notice>}
          </form>
        </Panel>

        <Panel title="What happened" kicker="Four facts" actions={<span className="muted small">As {user.name}</span>}>
          {processing && <AgentLog lines={['Reading the invoice…', 'Asking the policy rules…', 'Asking the vault contract…']} />}
          {!processing && result ? (
            <ResultReceipt result={result} amount={amount} foot="Simulated · demo rules · no money moves" />
          ) : (
            !processing && <Empty>Pick a scenario or fill in the form, then send it to the agent.</Empty>
          )}
          {!processing && result?.decided === 'T2_ESCALATED' && (
            <p className="after">
              <Link href="/portals/owner" className="text-link">
                Open the owner inbox to approve or veto it
              </Link>
            </p>
          )}
        </Panel>
      </div>

      <p className="muted small">
        Connected as <strong>{user.name}</strong>.{' '}
        <Link href="/dashboard" className="text-link">
          Check the live authority meter
        </Link>
      </p>
    </div>
  );

}

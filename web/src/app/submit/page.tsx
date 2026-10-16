'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

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
    <div className="space-y-12 pb-16">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="flex flex-wrap items-center gap-3.5 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] font-extrabold text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              LIVE INVOICE STUDIO
            </span>
            <span className="text-[11px] px-3.5 py-1 rounded-full font-mono uppercase tracking-wider font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              INTERACTIVE PIPELINE
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white leading-none">
            Inbound <span className="text-gradient-cyan">Invoice Studio</span>
          </h1>
          <p className="text-slate-300 text-sm md:text-base mt-3 max-w-2xl leading-relaxed">
            Submit genuine or adversarial invoices directly into the live autonomous AP pipeline. The AI agent evaluates the invoice against corporate mandates and executes on-chain within contract bounds.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="px-4 py-2.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 text-xs font-mono font-semibold border border-white/[0.1] transition-all"
          >
            ← View Authority Meter
          </Link>
          <Link
            href="/traces"
            className="px-4 py-2.5 rounded-2xl bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 text-xs font-mono font-bold border border-cyan-500/40 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)]"
          >
            Audit Traces →
          </Link>
        </div>
      </div>

      {/* Preset Invoices Carousel / Picker */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#06b6d4]" />
            <span>Select a Preset Scenario or Craft Custom Payload</span>
          </h2>
          <span className="text-xs font-mono text-slate-400">1-Click Load</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {PRESET_INVOICES.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handleLoadPreset(preset)}
              className="text-left p-4 rounded-2xl bg-black/40 border border-white/[0.08] hover:border-cyan-400/50 hover:bg-white/[0.04] transition-all duration-200 space-y-2 group active:scale-95 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className={`text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded-full border ${
                    preset.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                    preset.color === 'cyan' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' :
                    preset.color === 'amber' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                    'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  }`}>
                    {preset.badge}
                  </span>
                  <span className="text-[10px] text-slate-400 group-hover:text-cyan-300 font-mono font-bold">
                    ${preset.amount}
                  </span>
                </div>
                <div className="font-bold text-white text-xs group-hover:text-cyan-200 transition-colors">
                  {preset.label}
                </div>
              </div>
              <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                {preset.notes}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Main Studio Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Input Form */}
        <div className="glass-panel specular-cyan rounded-[32px] p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
            <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#06b6d4]" />
              <span>Invoice Specifications</span>
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.08] text-slate-300">
              Payload Form
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
            {/* Agent Intelligence Selector */}
            <div>
              <label className="text-slate-300 block mb-1.5 font-bold">Evaluator Agent Model</label>
              <div className="grid grid-cols-3 gap-2">
                {(['gamma', 'beta', 'alpha'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setAgentModel(m)}
                    className={`py-2 px-2.5 rounded-xl border text-center font-mono font-bold transition-all text-[11px] ${
                      agentModel === m
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                        : 'bg-black/50 text-slate-400 border-white/[0.08] hover:text-white'
                    }`}
                  >
                    {m === 'gamma' ? 'γ Hardened' : m === 'beta' ? 'β Flash' : 'α Naive'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-slate-300 block mb-1.5 font-bold">Target Vendor ID</label>
              <input
                type="text"
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
                placeholder="e.g. acme_industrial"
                className="w-full p-3 rounded-2xl bg-black/60 border border-white/[0.12] text-white font-mono focus:border-cyan-400 focus:outline-none transition-colors"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Must match registered vendor in Owner registry mirror
              </span>
            </div>

            <div>
              <label className="text-slate-300 block mb-1.5 font-bold">Invoice Identifier Number</label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="e.g. INV-2026-088"
                className="w-full p-3 rounded-2xl bg-black/60 border border-white/[0.12] text-white font-mono focus:border-cyan-400 focus:outline-none transition-colors"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Single-use on-chain key: (vendorId, invoiceNumber)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 block mb-1.5 font-bold">Amount (USDC)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-black/60 border border-white/[0.12] text-white font-mono focus:border-cyan-400 focus:outline-none transition-colors"
                  required
                />
              </div>
              <div>
                <label className="text-slate-300 block mb-1.5 font-bold">Purchase Order (PO)</label>
                <input
                  type="text"
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  placeholder="PO-101"
                  className="w-full p-3 rounded-2xl bg-black/60 border border-white/[0.12] text-white font-mono focus:border-cyan-400 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={processing}
              className={`w-full py-4 mt-4 rounded-2xl text-xs font-mono font-black uppercase tracking-wider transition-all shadow-xl active:scale-95 ${
                processing
                  ? 'bg-cyan-700 text-white cursor-wait'
                  : 'bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:brightness-110 text-white shadow-[0_0_25px_rgba(6,182,212,0.4)]'
              }`}
            >
              {processing ? '⚡ Running Autonomous Engine...' : 'Submit & Execute Autonomous Pipeline ⚡'}
            </button>
          </form>

          {error && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs font-mono">
              Error: {error}
            </div>
          )}
        </div>

        {/* Right: Real-time Execution Four Facts Display */}
        <div className="lg:col-span-2 glass-panel-elevated specular-indigo rounded-[32px] p-8 md:p-10 space-y-8 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-indigo-400 shadow-[0_0_12px_#818cf8]" />
                  <span>Execution Outcome: The Four Facts (Plan §10)</span>
                </h2>
                <p className="text-xs text-slate-300 mt-1 font-mono">
                  Autonomous agent decision and deterministic EVM smart contract consequence
                </p>
              </div>

              {result && (
                <span className={`text-[11px] px-3.5 py-1 rounded-full font-mono font-black tracking-wider uppercase border shadow-lg ${
                  result.fundsMoved
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_15px_#10b981]'
                    : result.decided === 'T2_ESCALATED'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_15px_#f59e0b]'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_15px_#f43f5e]'
                }`}>
                  {result.fundsMoved
                    ? 'PAYMENT EXECUTED'
                    : result.decided === 'T2_ESCALATED'
                    ? 'QUEUED FOR OWNER REVIEW'
                    : 'BLOCKED & PROTECTED'}
                </span>
              )}
            </div>

            {result ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 font-mono pt-6">
                {/* 1. Proposed */}
                <div className="glass-card-interactive rounded-2xl p-6 space-y-2">
                  <div className="text-[10px] text-slate-400 uppercase font-black tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    1. Proposed
                  </div>
                  <div className="text-base font-bold text-white truncate">{result.proposed}</div>
                  <div className="text-xs text-slate-400">Untrusted inbound document input</div>
                </div>

                {/* 2. Decided */}
                <div className="glass-card-interactive rounded-2xl p-6 space-y-2">
                  <div className="text-[10px] text-slate-400 uppercase font-black tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    2. Decided
                  </div>
                  <div className={`text-base font-black ${
                    result.decided === 'T1_AUTONOMOUS'
                      ? 'text-emerald-400 drop-shadow-[0_0_10px_#10b981]'
                      : result.decided === 'T2_ESCALATED'
                      ? 'text-amber-400 drop-shadow-[0_0_10px_#f59e0b]'
                      : 'text-rose-400 drop-shadow-[0_0_10px_#f43f5e]'
                  }`}>
                    {result.decided}
                  </div>
                  <div className="text-xs text-slate-300">
                    Reasons: {result.reasonCodes.join(', ')}
                  </div>
                </div>

                {/* 3. Contract Result */}
                <div className="glass-card-interactive rounded-2xl p-6 space-y-2">
                  <div className="text-[10px] text-slate-400 uppercase font-black tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    3. Contract Result
                  </div>
                  <div className="text-sm font-bold text-slate-100 truncate" title={result.contractResult}>
                    {result.contractResult}
                  </div>
                  <div className="text-xs text-slate-400">
                    {result.txHash ? `Tx: ${result.txHash.slice(0, 16)}...` : 'Deterministic off-chain drop'}
                  </div>
                </div>

                {/* 4. Funds Moved */}
                <div className="glass-card-interactive rounded-2xl p-6 space-y-2">
                  <div className="text-[10px] text-slate-400 uppercase font-black tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    4. Funds Moved?
                  </div>
                  <div className={`text-base font-black ${
                    result.fundsMoved ? 'text-emerald-400' : 'text-slate-300'
                  }`}>
                    {result.fundsMoved ? `YES ($${amount} USDC)` : 'NO ($0.00 USDC)'}
                  </div>
                  <div className="text-xs text-slate-400">
                    {result.fundsMoved ? 'Debited from UnderwriteVault.sol' : 'Vault capital strictly guaranteed'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-24 text-center text-slate-400 font-mono text-sm border border-white/[0.08] rounded-3xl bg-black/30 backdrop-blur-2xl">
                Choose a preset scenario on top or fill in the invoice parameters and click &ldquo;Submit &amp; Execute Autonomous Pipeline&rdquo;.
              </div>
            )}
          </div>

          {/* Quick Context Footer */}
          <div className="p-5 rounded-2xl bg-black/60 border border-white/[0.08] text-xs font-mono text-slate-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 backdrop-blur-2xl">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#06b6d4]" />
              <span>Connected as: <strong className="text-white">{user.name}</strong></span>
            </div>
            <Link href="/" className="text-cyan-400 hover:text-cyan-300 font-bold">
              Check Live Authority Meter →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

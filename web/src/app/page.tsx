'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="space-y-20 pb-20">
      {/* 1. Hero Section */}
      <section className="relative pt-6 md:pt-12 pb-16 text-center max-w-5xl mx-auto space-y-8">
        {/* Glow Halo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-cyan-500/20 via-blue-500/15 to-emerald-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />

        {/* Eyebrow Badge */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono text-xs font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(6,182,212,0.25)]">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#38bdf8] animate-pulse" />
          <span>The World's First Insured AI Payment Authority</span>
        </div>

        {/* Main Pitch Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.08]">
          Autonomous Enterprise Payments.{' '}
          <span className="text-gradient-cyan">Zero Rogue Spending Risk.</span>
        </h1>

        {/* Pitch Subtitle */}
        <p className="text-slate-300 text-base sm:text-lg md:text-xl max-w-3xl mx-auto leading-relaxed font-normal">
          Empower AI agents to inspect, verify, and settle accounts payable autonomously. Spending limits are <span className="text-white font-semibold">sized by adversarial exams</span>, capped by non-upgradable smart contracts, and <span className="text-emerald-400 font-semibold">backed 100% by an on-chain underwriter bond pool</span>.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/auth/login"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:brightness-110 text-white font-mono text-sm font-black tracking-wider uppercase transition-all shadow-[0_0_30px_rgba(6,182,212,0.4)] active:scale-95 flex items-center justify-center gap-2.5"
          >
            <span>Launch Enterprise Workspace</span>
            <span>→</span>
          </Link>

          <Link
            href="/submit"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 hover:text-white font-mono text-sm font-bold border border-white/[0.15] transition-all backdrop-blur-xl flex items-center justify-center gap-2"
          >
            <span>Test Inbound Invoice Pipeline</span>
            <span>⚡</span>
          </Link>

          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-black/40 hover:bg-black/60 text-slate-300 hover:text-cyan-300 font-mono text-sm font-semibold border border-white/[0.08] transition-all flex items-center justify-center gap-2"
          >
            <span>Protocol HUD</span>
            <span>↗</span>
          </Link>
        </div>

        {/* Proof Strip */}
        <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
          <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.08] backdrop-blur-xl">
            <div className="text-[10px] font-mono uppercase text-slate-500 font-bold">Adversarial Battery</div>
            <div className="text-xl font-mono font-black text-white mt-1">390 Scenarios</div>
            <div className="text-[11px] text-cyan-400 mt-0.5">15 attack families tested</div>
          </div>
          <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.08] backdrop-blur-xl">
            <div className="text-[10px] font-mono uppercase text-slate-500 font-bold">Clopper-Pearson Bound</div>
            <div className="text-xl font-mono font-black text-indigo-400 mt-1">p ≤ 0.0531</div>
            <div className="text-[11px] text-slate-400 mt-0.5">99% confidence upper limit</div>
          </div>
          <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.08] backdrop-blur-xl">
            <div className="text-[10px] font-mono uppercase text-slate-500 font-bold">Underwriter Collateral</div>
            <div className="text-xl font-mono font-black text-emerald-400 mt-1">$2,000.00 USDC</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Solvency proof B_free ≥ L</div>
          </div>
          <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.08] backdrop-blur-xl">
            <div className="text-[10px] font-mono uppercase text-slate-500 font-bold">Theft Loss Default</div>
            <div className="text-xl font-mono font-black text-cyan-400 mt-1">0.00%</div>
            <div className="text-[11px] text-slate-400 mt-0.5">100% atomic recovery</div>
          </div>
        </div>
      </section>

      {/* 2. The Problem vs Solution (Why Enterprises Buy This) */}
      <section className="glass-panel p-8 md:p-12 rounded-3xl space-y-10">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-[11px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
            The Enterprise Autonomous AP Bottleneck
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
            Why CFOs Refuse to Give AI Agents Bank Accounts
          </h2>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            Autonomous LLM agents are remarkable at reading PDFs and matching purchase orders, but giving an agent raw private keys or unbounded credit cards is corporate negligence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Without UNDERWRITE */}
          <div className="p-6 md:p-8 rounded-2xl bg-rose-500/[0.04] border border-rose-500/20 space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-sm">
                ✕
              </span>
              <h3 className="text-lg font-bold text-rose-300">Unbounded AI Payment Agent (Current Status Quo)</h3>
            </div>
            <ul className="space-y-3 text-xs md:text-sm text-slate-300 font-sans">
              <li className="flex items-start gap-2.5">
                <span className="text-rose-400 font-bold shrink-0">⚠️</span>
                <span><strong>Prompt Injection Vulnerability:</strong> Hidden white text in invoice PDFs triggers rogue wire transfers to attacker wallets.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-rose-400 font-bold shrink-0">⚠️</span>
                <span><strong>Hallucinatory Overspending:</strong> Agent pays duplicated invoices or pays unapproved vendors without limit controls.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-rose-400 font-bold shrink-0">⚠️</span>
                <span><strong>Total Loss Absorption:</strong> When an agent errs, treasury absorbs 100% of the loss. Nobody underwrites the AI.</span>
              </li>
            </ul>
          </div>

          {/* With UNDERWRITE */}
          <div className="p-6 md:p-8 rounded-2xl bg-emerald-500/[0.04] border border-emerald-500/30 space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                ✓
              </span>
              <h3 className="text-lg font-bold text-emerald-300">UNDERWRITE Protocol Architecture</h3>
            </div>
            <ul className="space-y-3 text-xs md:text-sm text-slate-300 font-sans">
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-400 font-bold shrink-0">🛡️</span>
                <span><strong>Mathematical Pre-Flight Bounds:</strong> Sized by 390 adversarial attacks. The agent literally cannot exceed its verified Clopper-Pearson spending cap.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-400 font-bold shrink-0">🔒</span>
                <span><strong>On-Chain Policy Guardrails:</strong> Dual-key mandate, 300s supplier cooldown, and 24h rolling velocity enforce zero-trust limits in bytecode.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-400 font-bold shrink-0">💰</span>
                <span><strong>Insured by Underwriting BondPool:</strong> Independent capital syndicates back the agent. Losses trigger automatic victim payouts and instant on-chain revocation.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 3. The 5 Dedicated Workspaces (Enterprise Portals) */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-[11px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
            Role-Based Access Control
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
            Institutional Role Desks
          </h2>
          <p className="text-slate-300 text-sm">
            Each enterprise stakeholder operates inside a dedicated, password-authenticated workstation with live on-chain governance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {/* Owner Desk */}
          <Link
            href="/portals/owner"
            className="glass-card-interactive p-6 rounded-3xl space-y-4 border border-white/[0.08] hover:border-emerald-500/50 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-300 group-hover:scale-105 transition-transform">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6H2.25m0 0H3m-1 0h1m16.5 0h.75a.75.75 0 01.75.75v.75m0 0H21m1 0h-1m-16.5 0h15m-15 0v10.5m15-10.5v10.5m-15 0h15" />
              </svg>
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">Treasury &amp; Governance</div>
              <h3 className="text-base font-bold text-white mt-1 group-hover:text-emerald-300 transition-colors">Owner &amp; CFO Portal</h3>
              <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                Vault liquidity custody, pending T2 escalation challenge reviews (Approve/Reject), and supplier cooldown whitelisting.
              </p>
            </div>
            <div className="pt-2 flex items-center text-xs font-mono font-bold text-emerald-400 group-hover:translate-x-1 transition-transform">
              Enter Workspace →
            </div>
          </Link>

          {/* Vendor & Supplier Desk */}
          <Link
            href="/portals/vendor"
            className="glass-card-interactive p-6 rounded-3xl space-y-4 border border-white/[0.08] hover:border-rose-500/50 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-300 group-hover:scale-105 transition-transform">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
              </svg>
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-rose-400 font-bold">Accounts Payable AP</div>
              <h3 className="text-base font-bold text-white mt-1 group-hover:text-rose-300 transition-colors">Vendor &amp; Supplier Desk</h3>
              <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                Itemized invoice submission, 5-stage automated pipeline, instant T1 autonomous settlement, and live status tracking.
              </p>
            </div>
            <div className="pt-2 flex items-center text-xs font-mono font-bold text-rose-400 group-hover:translate-x-1 transition-transform">
              Enter Workspace →
            </div>
          </Link>

          {/* Examiner Desk */}
          <Link
            href="/portals/examiner"
            className="glass-card-interactive p-6 rounded-3xl space-y-4 border border-white/[0.08] hover:border-indigo-500/50 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-300 group-hover:scale-105 transition-transform">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-bold">Risk &amp; Alignment</div>
              <h3 className="text-base font-bold text-white mt-1 group-hover:text-indigo-300 transition-colors">Safety Examiner Desk</h3>
              <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                Run 390 adversarial scenarios, compute Clopper-Pearson 99% exact bounds, and issue EIP-712 cryptographic attestations.
              </p>
            </div>
            <div className="pt-2 flex items-center text-xs font-mono font-bold text-indigo-400 group-hover:translate-x-1 transition-transform">
              Enter Workspace →
            </div>
          </Link>

          {/* Underwriter Desk */}
          <Link
            href="/portals/underwriter"
            className="glass-card-interactive p-6 rounded-3xl space-y-4 border border-white/[0.08] hover:border-cyan-500/50 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-300 group-hover:scale-105 transition-transform">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">Capital Syndicate</div>
              <h3 className="text-base font-bold text-white mt-1 group-hover:text-cyan-300 transition-colors">Underwriter Bond Desk</h3>
              <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                Deposit and withdraw bond collateral in BondPool.sol, earn underwriting fees, and audit Solvency Invariant INV-10.
              </p>
            </div>
            <div className="pt-2 flex items-center text-xs font-mono font-bold text-cyan-400 group-hover:translate-x-1 transition-transform">
              Enter Workspace →
            </div>
          </Link>

          {/* Adjudicator Desk */}
          <Link
            href="/portals/adjudicator"
            className="glass-card-interactive p-6 rounded-3xl space-y-4 border border-white/[0.08] hover:border-amber-500/50 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300 group-hover:scale-105 transition-transform">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">Disputes &amp; Slashing</div>
              <h3 className="text-base font-bold text-white mt-1 group-hover:text-amber-300 transition-colors">Claims Adjudication Desk</h3>
              <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                Verify loss evidence hashes, execute atomic bond payouts to victims, and trigger on-chain qualification revocation.
              </p>
            </div>
            <div className="pt-2 flex items-center text-xs font-mono font-bold text-amber-400 group-hover:translate-x-1 transition-transform">
              Enter Workspace →
            </div>
          </Link>
        </div>
      </section>

      {/* 4. Commercial Monetization & Enterprise Pilot Tiers */}
      <section className="glass-panel p-8 md:p-12 rounded-3xl space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
            Commercial Model &amp; Revenue
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
            How UNDERWRITE Earns Money
          </h2>
          <p className="text-slate-300 text-sm">
            We generate revenue through transaction underwriting fees (0.15%) and enterprise risk attestation licensing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Plan 1: Developer */}
          <div className="p-6 rounded-3xl bg-black/40 border border-white/[0.08] space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="text-xs font-mono text-slate-400 uppercase font-bold">Developer Sandbox</div>
              <div className="text-3xl font-mono font-black text-white">$0 <span className="text-xs text-slate-500 font-normal">/ testnet</span></div>
              <p className="text-xs text-slate-400 leading-relaxed">
                For AI engineers testing agent payment capabilities on local Anvil or Base Sepolia.
              </p>
              <ul className="space-y-2 text-xs text-slate-300 font-mono">
                <li>✓ 390-scenario test battery</li>
                <li>✓ Local Clopper-Pearson calculator</li>
                <li>✓ StubBondPool simulation</li>
                <li>✓ Full open-source contracts</li>
              </ul>
            </div>
            <Link
              href="/submit"
              className="w-full py-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-white font-mono text-xs font-bold transition-all text-center block"
            >
              Test Inbound Invoices
            </Link>
          </div>

          {/* Plan 2: Enterprise Pilot */}
          <div className="p-6 rounded-3xl bg-gradient-to-b from-cyan-500/10 to-transparent border border-cyan-500/40 space-y-6 relative overflow-hidden flex flex-col justify-between shadow-[0_0_40px_rgba(6,182,212,0.15)]">
            <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-cyan-400/20 text-cyan-300 text-[10px] font-mono font-bold uppercase">
              Popular
            </div>
            <div className="space-y-4">
              <div className="text-xs font-mono text-cyan-400 uppercase font-bold">Enterprise AP Pilot</div>
              <div className="text-3xl font-mono font-black text-white">$4,990 <span className="text-xs text-slate-400 font-normal">/ mo + 0.15% vol</span></div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Turnkey autonomous AP pipeline for mid-market CFOs automating $100K–$1M/mo in vendor spend.
              </p>
              <ul className="space-y-2 text-xs text-slate-200 font-mono">
                <li>✓ Dedicated EIP-712 Agent Enclave</li>
                <li>✓ Automated 300s supplier cooldowns</li>
                <li>✓ $50,000 Underwriting Bond Pool allocation</li>
                <li>✓ Real-time T2 escalation webhooks</li>
              </ul>
            </div>
            <Link
              href="/auth/register"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-white font-mono text-xs font-black transition-all text-center block shadow-lg"
            >
              Start Enterprise Pilot
            </Link>
          </div>

          {/* Plan 3: Institutional Syndicate */}
          <div className="p-6 rounded-3xl bg-black/40 border border-white/[0.08] space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="text-xs font-mono text-slate-400 uppercase font-bold">Institutional Syndicate</div>
              <div className="text-3xl font-mono font-black text-white">Custom <span className="text-xs text-slate-500 font-normal">volume</span></div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Custom capital syndicates and custom risk weights for Fortune 500 treasuries and global supply chains.
              </p>
              <ul className="space-y-2 text-xs text-slate-300 font-mono">
                <li>✓ Custom attack generator integration</li>
                <li>✓ Multi-million dollar private bond pools</li>
                <li>✓ Multi-chain deployment (Base, Arbitrum, Mainnet)</li>
                <li>✓ 24/7 designated legal adjudicator SLA</li>
              </ul>
            </div>
            <Link
              href="/auth/login"
              className="w-full py-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-white font-mono text-xs font-bold transition-all text-center block"
            >
              Sign In as Custodian
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

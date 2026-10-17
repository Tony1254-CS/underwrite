'use client';

import { useState, useEffect } from 'react';

// @reskinned: presentation rebuilt on the shared UI kit; logic above this line is unchanged.
import { PageHeader, Panel, Segmented, Chip, Stamp, usd } from '@/components/ui';

const AGENTS = [
  {
    key: 'alpha',
    name: 'Scripted-naive',
    badge: 'Floor baseline',
    text: 'A blind script that pays every invoice without checking. It trips the safety gate.',
    rows: [
      ['Out-of-bounds invoices', '60 of 60 failed'],
      ['Gate G1', 'Tripped'],
      ['Exam upper bound', 'p = 1.000'],
    ],
    grant: 'T0 · $0',
    tone: 'blocked' as const,
  },
  {
    key: 'beta',
    name: 'LLM, basic',
    badge: 'Gemini 2.5 Flash',
    text: 'A standard tool-calling model without a hardened defensive prompt.',
    rows: [
      ['Out-of-bounds invoices', '0 of 60 got through'],
      ['Completion rate', '94.2%'],
      ['Exam upper bound', 'p ≤ 0.125'],
    ],
    grant: 'T1 · $40.00',
    tone: 'held' as const,
  },
  {
    key: 'gamma',
    name: 'LLM, hardened',
    badge: 'Gemini 2.5 Pro',
    text: 'Reasoning with prompt defence, documents-as-data parsing and an invariant check.',
    rows: [
      ['Out-of-bounds invoices', '0 of 60 got through'],
      ['Completion rate', '98.3%'],
      ['Exam upper bound', 'p ≤ 0.0531'],
    ],
    grant: 'T1 · $180.00',
    tone: 'moved' as const,
  },
];

export default function PolicyCardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Interactive compiler simulator knobs
  const [selectedA, setSelectedA] = useState<number>(0.20);
  const [rWindow, setRWindow] = useState<number>(10);

  useEffect(() => {
    fetch('/api/exams')
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setData(json);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Mathematical compiler computation (plan §7 / PV-14):
  // p_gamma = 0.053116 (Clopper-Pearson 99% bound on G1-G4 zero failures)
  const pGamma = 0.053116;
  const rawCap = rWindow / (selectedA * pGamma);
  const ownerCeiling = 300; // PV-06 / default
  const effectiveCap = Math.min(ownerCeiling, Math.floor(rawCap / 10) * 10);

  return (
    <div className="stack">
      <PageHeader
        eyebrow="Qualify"
        title="Policy card"
        lede="How an exam result becomes a spending limit, and the limit each agent was given."
        actions={<Stamp kind="scripted" label="Scripted demo values" meaning="The three agent cards below are fixed demo values. Recorded exam reports are on the Evidence page." />}
      />

      <Panel title="Read this first" kicker="Printed on every policy card">
        <div className="grid gap-4 md:grid-cols-3">
          <blockquote className="quote">
            <p>Bounds describe the exam&rsquo;s scenario distribution, not real-world attack frequency.</p>
          </blockquote>
          <blockquote className="quote">
            <p>
              <em>a</em> is the owner&rsquo;s assumption about the share of adversarial invoices; sensitivity shown for <em>a</em> &isin; {'{'}0.01, 0.05, 0.20{'}'}.
            </p>
          </blockquote>
          <blockquote className="quote">
            <p>
              Worst case if this agent is fully compromised: unreviewed autonomous payments never exceed the bond remaining; at most <code>t1MaxPerWindow</code> per window; only to registered vendors past cool-down.
            </p>
          </blockquote>
        </div>
      </Panel>

      <div>
        <div className="sectionhead">
          <h2 className="h3">Three agents, one exam</h2>
          <p className="muted">Evaluated on the same fixed stream: 390 scenarios (120 benign, 60 out-of-bounds, 210 wrong-but-permitted).</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {AGENTS.map((a) => (
            <article key={a.key} className={`agentcard agentcard--${a.tone}`}>
              <header>
                <h3>{a.name}</h3>
                <Chip tone="neutral">{a.badge}</Chip>
              </header>
              <p className="agentcard__text">{a.text}</p>
              <dl>
                {a.rows.map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd className="fig">{v}</dd>
                  </div>
                ))}
              </dl>
              <footer>
                <span>Granted authority</span>
                <Chip tone={a.tone}>{a.grant}</Chip>
              </footer>
            </article>
          ))}
        </div>
      </div>

      <Panel
        title="What if the assumptions change?"
        kicker="Sizing compiler"
        actions={<Stamp kind="controlled" label="What-if" meaning="You choose the inputs. Nothing is saved or sent." />}
      >
        <div className="grid gap-6 md:grid-cols-2">
          <div className="form">
            <div className="field">
              <label htmlFor="a-range">Share of adversarial invoices (a)</label>
              <input id="a-range" type="range" min="0.01" max="0.30" step="0.01" value={selectedA} onChange={(e) => setSelectedA(parseFloat(e.target.value))} />
              <div className="field__row">
                <Segmented
                  label="Presets for a"
                  value={String(selectedA)}
                  onChange={(v) => setSelectedA(parseFloat(v))}
                  options={[
                    { value: '0.01', label: '0.01' },
                    { value: '0.05', label: '0.05' },
                    { value: '0.2', label: '0.20' },
                  ]}
                />
                <input aria-label="a, typed" className="input input--sm" type="number" min="0.01" max="0.30" step="0.01" value={selectedA} onChange={(e) => setSelectedA(Math.min(0.3, Math.max(0.01, parseFloat(e.target.value) || 0.01)))} />
              </div>
            </div>
            <div className="field">
              <label htmlFor="r-range">Risk budget per window (R)</label>
              <input id="r-range" type="range" min="5" max="50" step="5" value={rWindow} onChange={(e) => setRWindow(parseInt(e.target.value, 10))} />
              <div className="field__row">
                <span className="fig">{usd(rWindow)}</span>
                <input aria-label="R, typed" className="input input--sm" type="number" min="5" max="50" step="5" value={rWindow} onChange={(e) => setRWindow(Math.min(50, Math.max(5, parseInt(e.target.value, 10) || 5)))} />
              </div>
            </div>
          </div>

          <div className="calc">
            <div>
              <p className="calc__k">Raw cap</p>
              <p className="calc__v fig">{usd(rawCap)}</p>
              <p className="calc__s">R ÷ (a × p), with p fixed at 0.0531</p>
            </div>
            <div>
              <p className="calc__k">Owner ceiling</p>
              <p className="calc__v fig">{usd(ownerCeiling)}</p>
              <p className="calc__s">A hard limit in the contract</p>
            </div>
            <div className="calc__out">
              <p className="calc__k">Enforced per window</p>
              <p className="calc__v fig">{usd(effectiveCap)}</p>
              <p className="calc__s">Rounded down to the nearest $10</p>
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );

}

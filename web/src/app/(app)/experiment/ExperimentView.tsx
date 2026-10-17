"use client";

import React, { useState } from "react";
import { formatUSDC } from "@/lib/format";
import { ControlledBadge, ScriptedBadge } from "@/components/Badges";
import { Chip, PageHeader, Panel, Segmented, Stamp } from "@/components/ui";

export interface ExperimentCell {
  agent: "alpha" | "beta" | "gamma";
  regime: "R0" | "R1" | "R2";
  automationRate: number;
  automatedCount: number;
  benignTotal: number;
  reviewBurden: number;
  classIExecuted: number;
  classIILoss: string;
  bondPayout: string;
  netLoss: string;
}

export interface HypothesisRow {
  key: string;
  title: string;
  ok: boolean;
  yes: string;
  no: string;
  text: string;
}

const AGENT_NAME = { alpha: "Naive script", beta: "Basic LLM", gamma: "Hardened LLM" } as const;
const REGIME = {
  R0: { name: "R0 · Raw wallet", blurb: "No limits" },
  R1: { name: "R1 · Fixed caps", blurb: "Caps, no exam" },
  R2: { name: "R2 · UNDERWRITE", blurb: "Exam-sized limits and a bond" },
} as const;

const W = 720;
const H = 280;
const PAD = { l: 8, r: 8, t: 26, b: 34 };

export function ExperimentView({
  streamSize,
  benignTotal,
  classITotal,
  classIITotal,
  sourcePath,
  cells,
  hypotheses,
  agents,
  regimes,
}: {
  streamSize: number;
  benignTotal: number;
  classITotal: number;
  classIITotal: number;
  sourcePath: string;
  cells: ExperimentCell[];
  hypotheses: HypothesisRow[];
  agents: ("alpha" | "beta" | "gamma")[];
  regimes: ("R0" | "R1" | "R2")[];
}) {
  const [metric, setMetric] = useState<"LOSS" | "AUTOMATION">("LOSS");
  const at = (a: string, r: string) => cells.find((c) => c.agent === a && c.regime === r)!;

  const losses = cells.map((c) => Number(BigInt(c.netLoss)) / 1e6);
  const maxLoss = Math.max(...losses, 1);
  const logScale = (v: number) => Math.log10(1 + v) / Math.log10(1 + maxLoss);
  const innerH = H - PAD.t - PAD.b;
  const groupW = (W - PAD.l - PAD.r) / agents.length;
  const barW = Math.min(46, (groupW - 40) / regimes.length);

  const value = (c: ExperimentCell) => (metric === "LOSS" ? logScale(Number(BigInt(c.netLoss)) / 1e6) : c.automationRate);
  const label = (c: ExperimentCell) => (metric === "LOSS" ? formatUSDC(c.netLoss).replace(/\.00$/, "") : `${(c.automationRate * 100).toFixed(1)}%`);

  return (
    <div className="stack">
      <PageHeader
        eyebrow="Prove"
        title="Experiment"
        lede="One pre-registered stream of invoices, run through three agents under three control regimes. These are the recorded results."
        actions={
          <>
            <ControlledBadge label="GENERATOR B STREAM" />
            <ScriptedBadge label="BLIND SET TESTED" />
          </>
        }
      />

      <Panel
        title="The protocol"
        kicker="Fixed before the runs"
        actions={<Stamp kind="recorded" meaning={`Read from ${sourcePath}`} />}
      >
        <p>
          <strong className="fig">{streamSize} invoices</strong>: {benignTotal} benign, {classITotal} out-of-bounds attempts and {classIITotal} wrong-but-permitted. Every regime sees the same stream. R0 has no limits, R1 has fixed caps and no exam, and R2 is UNDERWRITE: exam-sized limits backed by the bond.
        </p>
        <p className="fineprint">Generator B and the blind red-team set were written by the same team (DEC-023), so they are not independent. Bounds describe the exam, not real attack frequency.</p>
      </Panel>

      <Panel
        title="Regimes compared"
        kicker={metric === "LOSS" ? "Net loss, log scale" : "Benign invoices the agent paid on its own"}
        actions={
          <Segmented
            label="Metric"
            value={metric}
            onChange={setMetric}
            options={[
              { value: "LOSS", label: "Net loss (USDC)" },
              { value: "AUTOMATION", label: "Automation (%)" },
            ]}
          />
        }
      >
        <ul className="regime-key" aria-label="Regimes">
          {regimes.map((r) => (
            <li key={r}>
              <svg width="22" height="12" aria-hidden="true">
                <rect x="1" y="1" width="20" height="10" rx="2" className={`swatch swatch--${r.toLowerCase()}`} fill={r === "R0" ? "url(#hatch)" : undefined} />
              </svg>
              <span>
                <strong>{REGIME[r].name}</strong>, {REGIME[r].blurb.toLowerCase()}
              </span>
            </li>
          ))}
        </ul>

        <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Bar chart of ${metric === "LOSS" ? "net loss" : "automation rate"} for each agent and regime. The same numbers are in the table below.`}>
          <defs>
            <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="6" height="6" className="hatch-bg" />
              <line x1="0" y1="0" x2="0" y2="6" className="hatch-line" strokeWidth="3" />
            </pattern>
          </defs>
          <line x1={PAD.l} x2={W - PAD.r} y1={H - PAD.b} y2={H - PAD.b} className="chart__axis" />
          {agents.map((a, gi) => {
            const gx = PAD.l + gi * groupW + (groupW - barW * regimes.length - 8 * (regimes.length - 1)) / 2;
            return (
              <g key={a}>
                {regimes.map((r, ri) => {
                  const c = at(a, r);
                  // rounded: Math.log10 can differ in the last digit between the server and the browser
                  const h = Math.max(2, Math.round(value(c) * innerH * 100) / 100);
                  const x = gx + ri * (barW + 8);
                  const y = H - PAD.b - h;
                  return (
                    <g key={r}>
                      <rect x={x} y={y} width={barW} height={h} className={`chartbar chartbar--${r.toLowerCase()}`} style={{ animationDelay: `${(gi * 3 + ri) * 70}ms` }} fill={r === "R0" ? "url(#hatch)" : undefined} />
                      <text x={x + barW / 2} y={y - 6} textAnchor="middle" className="chart__val">
                        {label(c)}
                      </text>
                    </g>
                  );
                })}
                <text x={PAD.l + gi * groupW + groupW / 2} y={H - 10} textAnchor="middle" className="chart__cat">
                  {AGENT_NAME[a]}
                </text>
              </g>
            );
          })}
        </svg>
        <p className="muted small">
          {metric === "LOSS" ? "Bar height is logarithmic so $5 and $38,700 fit on one scale. The exact figure is printed on each bar." : "Share of the benign invoices each agent paid without a person."}
        </p>
      </Panel>

      <Panel title="All nine results" kicker="Counts and rates together">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th scope="col">Agent</th>
                <th scope="col">Regime</th>
                <th scope="col">Pays on its own</th>
                <th scope="col">Out-of-bounds executed</th>
                <th scope="col">Net loss</th>
                <th scope="col">Bond repaid</th>
                <th scope="col">Left for review</th>
              </tr>
            </thead>
            <tbody>
              {agents.flatMap((a) =>
                regimes.map((r) => {
                  const c = at(a, r);
                  return (
                    <tr key={`${a}-${r}`}>
                      <th scope="row" data-label="Agent">{AGENT_NAME[a]}</th>
                      <td data-label="Regime">{REGIME[r].name}</td>
                      <td data-label="Pays on its own" className="fig">
                        {(c.automationRate * 100).toFixed(1)}% <small>{c.automatedCount} of {c.benignTotal}</small>
                      </td>
                      <td data-label="Out-of-bounds executed" className="fig">{c.classIExecuted}</td>
                      <td data-label="Net loss" className="fig">{formatUSDC(c.netLoss)}</td>
                      <td data-label="Bond repaid" className="fig">{BigInt(c.bondPayout) > 0n ? formatUSDC(c.bondPayout) : '—'}</td>
                      <td data-label="Left for review" className="fig">{c.reviewBurden} of {streamSize}</td>
                    </tr>
                  );
                }),
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Hypotheses" kicker="Stated before the runs">
        <ul className="hyps">
          {hypotheses.map((h) => (
            <li key={h.key}>
              <Chip tone={h.ok ? "moved" : "blocked"}>{h.ok ? h.yes : h.no}</Chip>
              <div>
                <strong>{h.title}.</strong> {h.text}
              </div>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

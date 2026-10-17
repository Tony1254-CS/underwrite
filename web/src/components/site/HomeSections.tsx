import React from "react";
import Link from "next/link";
import { formatUSDC } from "@/lib/format";
import { getCell, type SiteEvidence } from "@/lib/siteEvidence";
import { ArrowGlyph } from "./Glyphs";
import { CopyButton } from "./CopyButton";
import { Desk } from "./Desk";
import { Stamp } from "./Stamp";

/** "$38,700" / "$0" / "$5": whole dollars read better at poster size. */
const short = (base: bigint) => formatUSDC(base).replace(/\.00$/, "");

/* ------------------------------------------------------------------ hero */

export function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="wrap">
        <h1 id="hero-title" className="hero__title">
          <span>Your AI clerk</span>{" "}
          <span>
            starts at <span className="hl">$0</span>.
          </span>
        </h1>

        <div className="hero__grid">
          <div className="hero__copy">
            <p className="hero__lede">
              It earns a spending limit by passing a test. A contract enforces it. A bond covers its mistakes.
            </p>
            <div className="cta-row">
              <Link href="/dashboard" className="btn btn--lime">
                Open the demo <ArrowGlyph />
              </Link>
              <a href="#proof" className="text-link">
                See the proof
              </a>
            </div>
          </div>
          <Desk />
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------- steps */

const EXAM_CELLS = Array.from({ length: 21 }, (_, i) => i);
const HOSTILE_CELLS = new Set([3, 9, 10, 17]);

export function Steps({ evidence }: { evidence: SiteEvidence | null }) {
  const g = evidence ? getCell(evidence, "gamma", "R2") : null;
  const repaid = g && g.classIILoss > 0n ? Number((g.bondPayout * 1000n) / g.classIILoss) / 1000 : 0;

  return (
    <section id="how" className="sec" aria-labelledby="how-title">
      <div className="wrap">
        <h2 id="how-title" className="h2" data-reveal>
          Earned, not typed in.
        </h2>

        <ol className="steps">
          <li className="step step--ink" data-reveal>
            <span className="step__no fig" aria-hidden="true">
              1
            </span>
            <h3>Test it.</h3>
            <p>It sits an exam of normal and hostile invoices.</p>
            <div className="exam" aria-hidden="true">
              {EXAM_CELLS.map((i) => (
                <i key={i} className={HOSTILE_CELLS.has(i) ? "is-hostile" : ""} />
              ))}
            </div>
          </li>

          <li className="step step--lime" data-reveal>
            <span className="step__no fig" aria-hidden="true">
              2
            </span>
            <h3>Bound it.</h3>
            <p>The score sets its limit. A contract enforces it, even if the agent is hacked.</p>
            <div className="capbar" aria-hidden="true">
              <div className="capbar__track">
                <i data-grow data-f="1" style={{ ["--f" as string]: 1 } as React.CSSProperties} />
              </div>
              <div className="capbar__ends">
                <span>$0</span>
                <span>the cap</span>
              </div>
            </div>
          </li>

          <li className="step step--paper" data-reveal>
            <span className="step__no fig" aria-hidden="true">
              3
            </span>
            <h3>Back what remains.</h3>
            <p>A bond repays what slips through, and cancels the limit in the same step.</p>
            {g ? (
              <div className="backbar">
                <div className="backbar__row">
                  <span>Lost</span>
                  <b className="fig">{short(g.classIILoss)}</b>
                </div>
                <div className="backbar__track" aria-hidden="true">
                  <i data-grow data-f="1" style={{ ["--f" as string]: 1 } as React.CSSProperties} />
                </div>
                <div className="backbar__row">
                  <span>Repaid by the bond</span>
                  <b className="fig">{short(g.bondPayout)}</b>
                </div>
                <div className="backbar__track backbar__track--ok" aria-hidden="true">
                  <i data-grow data-f={String(repaid)} style={{ ["--f" as string]: repaid } as React.CSSProperties} />
                </div>
              </div>
            ) : null}
          </li>
        </ol>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------- proof */

export function Proof({ evidence }: { evidence: SiteEvidence | null }) {
  if (!evidence) {
    return (
      <section id="proof" className="sec" aria-labelledby="proof-title">
        <div className="wrap">
          <h2 id="proof-title" className="h2">
            The proof
          </h2>
          <p className="proof__src">
            <Stamp kind="notrun" label="Not recorded" meaning="The experiment summary could not be read, so no figures are shown." />
            <span>The recorded results could not be read.</span>
          </p>
        </div>
      </section>
    );
  }

  const alphaNone = getCell(evidence, "alpha", "R0");
  const alphaWith = getCell(evidence, "alpha", "R2");
  const gammaNone = getCell(evidence, "gamma", "R0");
  const gammaWith = getCell(evidence, "gamma", "R2");

  return (
    <section id="proof" className="sec sec--proof" aria-labelledby="proof-title">
      <div className="wrap">
        <h2 id="proof-title" className="h2" data-reveal>
          Same {evidence.streamSize} invoices. Same script.
        </h2>

        <div className="versus" data-reveal>
          <div className="versus__a">
            <p className="versus__k">No limits</p>
            <p className="versus__n fig">{short(alphaNone.netLoss)}</p>
            <p className="versus__d">lost</p>
          </div>
          <div className="versus__b">
            <p className="versus__k">With UNDERWRITE</p>
            <p className="versus__n fig">{short(alphaWith.netLoss)}</p>
            <p className="versus__d">lost</p>
          </div>
        </div>

        <p className="proof__line" data-reveal>
          The naive script is the worst case. The best agent went from {short(gammaNone.netLoss)} to{" "}
          {short(gammaWith.netLoss)}.
        </p>
        <p className="proof__line proof__line--dim" data-reveal>
          The price: with limits, the best agent pays {gammaWith.automatedCount} of {gammaWith.benignTotal} real invoices on
          its own. The rest wait for you.
        </p>

        <p className="proof__src">
          <Stamp kind="recorded" meaning={`Read from ${evidence.sourcePath}`} />
          <Link href="/experiment" className="text-link">
            All nine results
          </Link>
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------- run */

export function RunIt() {
  return (
    <section id="run" className="run" aria-labelledby="run-title">
      <div className="wrap run__inner">
        <div>
          <h2 id="run-title" className="h2 run__title">
            See it run.
          </h2>
          <Link href="/dashboard" className="btn btn--ink">
            Open the demo <ArrowGlyph />
          </Link>
        </div>
        <div className="run__cmds">
          <p className="run__lead">Or run it yourself:</p>
          {["pnpm install", "pnpm demo:local"].map((c) => (
            <div key={c} className="cmd">
              <code>
                <span aria-hidden="true">$ </span>
                {c}
              </code>
              <CopyButton text={c} />
            </div>
          ))}
          <p className="run__note">Local chain. No keys. No internet.</p>
        </div>
      </div>
    </section>
  );
}

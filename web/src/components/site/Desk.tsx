"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  DAILY_LIMIT,
  SLIPS,
  STAGES,
  dollars,
  evaluate,
  type NodeState,
  type Outcome,
  type Slip,
} from "@/lib/deskModel";
import { CheckGlyph, ClockGlyph, CrossGlyph } from "./Glyphs";
import { Stamp } from "./Stamp";

const STEP_MS = 300;
const IDLE: NodeState[] = ["idle", "idle", "idle", "idle"];
const TILT = ["-1.6deg", "1.2deg", "1.4deg", "-1deg"];

type GsapModule = typeof import("gsap")["default"];

/**
 * The desk. Tap an invoice and it runs the four checks the real product runs: agent, policy,
 * contract, funds. It stops where the first "no" happens, then prints a receipt.
 *
 * Nothing is sent anywhere. State lives in this component only. GSAP animates the receipt
 * (loaded after first paint; with reduced motion everything simply appears).
 */
export function Desk() {
  const [paid, setPaid] = useState<ReadonlySet<string>>(new Set());
  const [limitLeft, setLimitLeft] = useState<bigint>(DAILY_LIMIT);
  const [current, setCurrent] = useState<{ slip: Slip; outcome: Outcome } | null>(null);
  const [nodes, setNodes] = useState<NodeState[]>(IDLE);
  const [printed, setPrinted] = useState(false);
  const [live, setLive] = useState("");

  const timers = useRef<number[]>([]);
  const receipt = useRef<HTMLDivElement>(null);
  const pipeRef = useRef<HTMLOListElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const gsapRef = useRef<GsapModule | null>(null);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduced.current) {
      import("gsap").then((m) => {
        gsapRef.current = m.default;
      });
    }
    return () => timers.current.forEach(window.clearTimeout);
  }, []);

  /** On a phone or a short laptop the checks and the receipt sit below the fold: bring them into view. */
  const ensureVisible = (el: HTMLElement | null) => {
    if (!el) return;
    const r = el.getBoundingClientRect();
    const header = 72;
    if (r.top >= header && r.bottom <= window.innerHeight - 8) return;
    el.scrollIntoView({
      block: r.height > window.innerHeight - header - 24 ? "start" : "center",
      behavior: reduced.current ? "auto" : "smooth",
    });
  };

  const clearTimers = () => {
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
  };

  const press = useCallback(
    (slip: Slip) => {
      clearTimers();
      const outcome = evaluate(slip, paid, limitLeft);
      setCurrent({ slip, outcome });
      setPrinted(false);
      setLive("");
      ensureVisible(pipeRef.current);

      const finish = () => {
        setNodes(outcome.nodes);
        setPrinted(true);
        window.setTimeout(() => ensureVisible(rightRef.current), 60);
        if (outcome.verdict === "paid") {
          setPaid((p) => new Set(p).add(slip.id));
          setLimitLeft(outcome.limitLeftAfter);
        }
        const verdict = { paid: "Paid", held: "Held for you", blocked: "Blocked" }[outcome.verdict];
        setLive(`${verdict}. ${outcome.why} Limit left today ${dollars(outcome.limitLeftAfter)}.`);
      };

      if (reduced.current) {
        finish();
        return;
      }

      // Walk the invoice down the stages, stopping at the first one that is not "pass".
      setNodes(IDLE);
      let t = 0;
      for (let i = 0; i < outcome.nodes.length; i++) {
        const state = outcome.nodes[i];
        if (state === "idle") break;
        timers.current.push(
          window.setTimeout(() => setNodes((n) => n.map((s, j) => (j === i ? "run" : s))), t),
          window.setTimeout(() => setNodes((n) => n.map((s, j) => (j === i ? state : s))), t + STEP_MS - 70),
        );
        t += STEP_MS;
        if (state !== "pass") break;
      }
      timers.current.push(window.setTimeout(finish, t + 40));
    },
    [paid, limitLeft],
  );

  const reset = () => {
    clearTimers();
    setPaid(new Set());
    setLimitLeft(DAILY_LIMIT);
    setCurrent(null);
    setNodes(IDLE);
    setPrinted(false);
    setLive("Start over. Limit back to $180.00.");
  };

  // Print the receipt: paper feeds out, rows settle, the stamp lands.
  useEffect(() => {
    const g = gsapRef.current;
    const el = receipt.current;
    if (!printed || !g || !el || reduced.current) return;
    const rows = el.querySelectorAll(".rcp-row");
    const stamp = el.querySelector(".rcp-stamp");
    g.killTweensOf([el, rows, stamp]);
    g.fromTo(el, { clipPath: "inset(0 0 100% 0)", y: -18 }, { clipPath: "inset(0 0 0% 0)", y: 0, duration: 0.7, ease: "power2.out", clearProps: "clipPath,transform" });
    g.fromTo(rows, { opacity: 0, y: -6 }, { opacity: 1, y: 0, duration: 0.3, stagger: 0.09, delay: 0.12, ease: "power1.out" });
    g.fromTo(stamp, { opacity: 0, scale: 1.7, rotate: -14 }, { opacity: 1, scale: 1, rotate: -7, duration: 0.3, delay: 0.62, ease: "back.out(2.2)" });
  }, [printed, current]);

  const verdictWord = current ? { paid: "PAID", held: "HELD", blocked: "BLOCKED" }[current.outcome.verdict] : "";
  const used = Number(DAILY_LIMIT - limitLeft) / Number(DAILY_LIMIT);

  return (
    <div className="desk" id="try">
      <div className="desk__head">
        <p className="desk__title">Try it. Tap an invoice.</p>
        <div className="desk__meta">
          <Stamp kind="simulated" label="Simulated" meaning="Demo rules. Nothing here is sent anywhere and no money moves." />
          <button type="button" className="linkish" onClick={reset} disabled={!current && paid.size === 0}>
            Start over
          </button>
        </div>
      </div>

      <div className="desk__grid">
        <div className="desk__left">
          <ul className="tray" aria-label="Invoices">
            {SLIPS.map((s, i) => {
              const isPaid = paid.has(s.id);
              const active = current?.slip.id === s.id;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    className="slip"
                    data-paid={isPaid}
                    data-active={active}
                    style={{ ["--tilt" as string]: TILT[i], ["--i" as string]: i } as React.CSSProperties}
                    onClick={() => press(s)}
                  >
                    <span className="slip__no">{s.invoiceNo}</span>
                    <span className="slip__who">{s.supplier}</span>
                    <span className="slip__what">{s.what}</span>
                    <span className="slip__amt fig">{dollars(s.amount)}</span>
                    {isPaid && <span className="sr-only">. Already paid. Pressing again tests a duplicate.</span>}
                    {isPaid && (
                      <span className="slip__paid" aria-hidden="true">
                        PAID
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          <ol className="pipe" aria-label="The four checks" ref={pipeRef}>
            {STAGES.map((label, i) => (
              <li key={label} className="pipe__node" data-state={nodes[i]}>
                <span className="pipe__dot" aria-hidden="true">
                  {nodes[i] === "pass" && <CheckGlyph />}
                  {nodes[i] === "stop" && <CrossGlyph />}
                  {nodes[i] === "wait" && <ClockGlyph />}
                </span>
                <span className="pipe__label">{label}</span>
              </li>
            ))}
          </ol>

          <div className="limit">
            <div className="limit__row">
              <span>Limit left today</span>
              <span className="fig">
                <strong>{dollars(limitLeft)}</strong> of {dollars(DAILY_LIMIT)}
              </span>
            </div>
            <div className="limit__track" aria-hidden="true">
              <i style={{ ["--f" as string]: 1 - used } as React.CSSProperties} />
            </div>
          </div>
        </div>

        <div className="desk__right" ref={rightRef}>
          {current && printed ? (
            <div className="rcp" ref={receipt} data-verdict={current.outcome.verdict}>
              <div className="rcp__head">
                <strong>UNDERWRITE</strong>
                <span>AP agent receipt</span>
              </div>
              <p className="rcp__inv">
                {current.slip.invoiceNo} · {current.slip.supplier} · {dollars(current.slip.amount)}
              </p>
              <dl className="rcp__facts">
                <div className="rcp-row">
                  <dt>1 Proposed</dt>
                  <dd>
                    Pay {current.slip.supplier} {dollars(current.slip.amount)}
                  </dd>
                </div>
                <div className="rcp-row">
                  <dt>2 Decided</dt>
                  <dd>
                    {current.outcome.decided}
                    {current.outcome.code && <span className="rcp__code">{current.outcome.code}</span>}
                  </dd>
                </div>
                <div className="rcp-row">
                  <dt>3 Contract</dt>
                  <dd>{current.outcome.contract}</dd>
                </div>
                <div className="rcp-row">
                  <dt>4 Funds</dt>
                  <dd>{current.outcome.funds}</dd>
                </div>
              </dl>
              <p className="rcp__why">{current.outcome.why}</p>
              <div className="rcp-stamp" data-verdict={current.outcome.verdict}>
                {verdictWord}
              </div>
              <p className="rcp__sim">Simulated · demo rules · no money moves</p>
              <div className="rcp__edge" aria-hidden="true" />
            </div>
          ) : (
            <div className="rcp rcp--empty" aria-hidden={current ? undefined : "true"}>
              <p>{current ? "Checking…" : "Your receipt prints here."}</p>
            </div>
          )}
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {live}
      </p>
    </div>
  );
}

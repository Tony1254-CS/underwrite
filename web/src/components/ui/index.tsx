"use client";

/**
 * Shared building blocks for the workspace pages (the "(app)" route group).
 * Presentation only: none of these touch the API, the auth context or any page logic.
 * Motion is CSS first; the receipt print uses GSAP, loaded lazily and skipped for
 * prefers-reduced-motion. Every status carries a word or a mark, never colour alone.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { CheckGlyph, ClockGlyph, CrossGlyph } from "@/components/site/Glyphs";
import { Stamp } from "@/components/site/Stamp";
import { truncateHash } from "@/lib/format";

export { Stamp };

/* --------------------------------------------------------------- tiny helpers */

export const usd = (n: number | string | undefined | null) => {
  const v = typeof n === "string" ? parseFloat(n.replace(/,/g, "")) : n ?? 0;
  return `$${(Number.isFinite(v) ? (v as number) : 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

let gsapPromise: Promise<typeof import("gsap")["default"]> | null = null;
export const loadGsap = () => (gsapPromise ??= import("gsap").then((m) => m.default));
export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Keys that appeared since the last render, for a short highlight on live tables. */
export function useNewKeys(keys: (string | number)[], ms = 2400): Set<string> {
  const seen = useRef<Set<string> | null>(null);
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const sig = keys.join("|");
  useEffect(() => {
    const now = new Set(keys.map(String));
    if (seen.current === null) {
      seen.current = now; // first load: nothing is "new"
      return;
    }
    const added = [...now].filter((k) => !seen.current!.has(k));
    seen.current = now;
    if (added.length === 0) return;
    setFresh(new Set(added));
    const t = window.setTimeout(() => setFresh(new Set()), ms);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);
  return fresh;
}

/** Increases each time a different object arrives, so a receipt can re-print for a new result. */
export function useIdentityKey(value: unknown): number {
  const last = useRef<unknown>(value);
  const n = useRef(0);
  if (last.current !== value) {
    last.current = value;
    n.current += 1;
  }
  return n.current;
}

/* ------------------------------------------------------------------- layout */

export function PageHeader({
  eyebrow,
  title,
  lede,
  actions,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  lede?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="pagehead">
      <div className="pagehead__main">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="h1">{title}</h1>
        {lede && <p className="lede">{lede}</p>}
      </div>
      {actions && <div className="pagehead__side">{actions}</div>}
    </header>
  );
}

export function Panel({
  title,
  kicker,
  actions,
  tone,
  className = "",
  id,
  children,
}: {
  title?: React.ReactNode;
  kicker?: React.ReactNode;
  actions?: React.ReactNode;
  tone?: "ink" | "lime" | "flat";
  className?: string;
  id?: string;
  children?: React.ReactNode;
}) {
  return (
    <section id={id} className={`panel${tone ? ` panel--${tone}` : ""} ${className}`} data-reveal>
      {(title || actions) && (
        <header className="panel__head">
          <div>
            {kicker && <p className="panel__kicker">{kicker}</p>}
            {title && <h2 className="panel__title">{title}</h2>}
          </div>
          {actions && <div className="panel__actions">{actions}</div>}
        </header>
      )}
      <div className="panel__body">{children}</div>
    </section>
  );
}

export function Stat({
  label,
  value,
  unit,
  sub,
  tone,
  fill,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  unit?: string;
  sub?: React.ReactNode;
  tone?: "ink" | "lime";
  /** 0 to 1: draws a thin gauge under the figure */
  fill?: number;
}) {
  return (
    <div className={`stat${tone ? ` stat--${tone}` : ""}`} data-reveal>
      <p className="stat__k">{label}</p>
      <p className="stat__v fig">
        {value}
        {unit && <span className="stat__u"> {unit}</span>}
      </p>
      {fill !== undefined && (
        <div className="gaugebar" aria-hidden="true">
          <i data-grow data-f={String(Math.max(0, Math.min(1, fill)))} style={{ ["--f" as string]: Math.max(0, Math.min(1, fill)) } as React.CSSProperties} />
        </div>
      )}
      {sub && <p className="stat__sub">{sub}</p>}
    </div>
  );
}

export function Chip({
  tone = "neutral",
  dot,
  children,
}: {
  tone?: "neutral" | "moved" | "held" | "blocked" | "lime" | "ink";
  dot?: boolean;
  children: React.ReactNode;
}) {
  return (
    <span className={`chip chip--${tone}`}>
      {dot && <span className="chip__dot" aria-hidden="true" />}
      {children}
    </span>
  );
}

/** Tier tag: T1 / T2 / T3 with the word beside it. */
export function TierTag({ tier }: { tier: string }) {
  const t = tier.toUpperCase();
  if (t === "T1") return <Chip tone="moved"><CheckGlyph /> T1 · pays automatically</Chip>;
  if (t === "T2") return <Chip tone="held"><ClockGlyph /> T2 · waits for owner</Chip>;
  if (t === "T3" || t === "REJECT") return <Chip tone="blocked"><CrossGlyph /> T3 · blocked</Chip>;
  return <Chip>{tier}</Chip>;
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="empty">{children}</div>;
}

export function Skeleton({ w = "100%", h = 18 }: { w?: string | number; h?: number }) {
  return <span className="skel" style={{ width: w, height: h }} aria-hidden="true" />;
}

export function Notice({
  tone = "info",
  children,
}: {
  tone?: "info" | "ok" | "bad" | "warn";
  children: React.ReactNode;
}) {
  return (
    <div className={`notice notice--${tone}`} role={tone === "bad" ? "alert" : "status"}>
      <span className="notice__dot" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: React.ReactNode }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Hash({ value, start = 8, end = 6 }: { value?: string | null; start?: number; end?: number }) {
  const [done, setDone] = useState(false);
  if (!value) return <span className="muted">Not recorded</span>;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setDone(true);
      window.setTimeout(() => setDone(false), 1400);
    } catch {
      /* clipboard unavailable: the full value is in the title */
    }
  };
  return (
    <span className="hash" title={value}>
      <code>{truncateHash(value, start, end)}</code>
      <button type="button" className="hash__copy" onClick={copy} aria-label={`Copy ${value}`}>
        {done ? "Copied" : "Copy"}
      </button>
    </span>
  );
}

/** A live clock to a deadline (challenge windows, cooldowns). Text updates each second. */
export function Countdown({ until, total = 300_000 }: { until: number; total?: number }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  if (now === null) return <span className="countdown fig">–:––</span>;
  const left = Math.max(0, until - now);
  const m = Math.floor(left / 60000);
  const s = Math.floor((left % 60000) / 1000);
  return (
    <span className={`countdown${left === 0 ? " is-done" : ""}`}>
      <span className="fig">
        {m}:{String(s).padStart(2, "0")}
      </span>
      <span className="countdown__bar" aria-hidden="true">
        <i style={{ ["--f" as string]: Math.min(1, left / total) } as React.CSSProperties} />
      </span>
      {left === 0 && <span className="sr-only">window ended</span>}
    </span>
  );
}

/* ------------------------------------------------------------------ the checks */

export type NodeState = "idle" | "run" | "pass" | "wait" | "stop";

export function Pipeline({
  stages,
  states,
  label = "Checks",
}: {
  stages: readonly string[];
  states: NodeState[];
  label?: string;
}) {
  return (
    <ol className="pipe" aria-label={label} style={{ ["--n" as string]: stages.length } as React.CSSProperties}>
      {stages.map((s, i) => (
        <li key={s} className="pipe__node" data-state={states[i] ?? "idle"}>
          <span className="pipe__dot" aria-hidden="true">
            {states[i] === "pass" && <CheckGlyph />}
            {states[i] === "stop" && <CrossGlyph />}
            {states[i] === "wait" && <ClockGlyph />}
          </span>
          <span className="pipe__label">{s}</span>
        </li>
      ))}
    </ol>
  );
}

/* --------------------------------------------------------------- receipt (4 facts) */

export interface Facts {
  /** changes whenever a new result arrives, so the receipt prints again */
  id: string | number;
  verdict: "paid" | "held" | "blocked";
  proposed: React.ReactNode;
  decided: React.ReactNode;
  contract: React.ReactNode;
  funds: React.ReactNode;
  why?: React.ReactNode;
  /** small mono line at the bottom, e.g. "Simulated · demo rules" */
  foot?: React.ReactNode;
  title?: string;
}

const VERDICT_WORD = { paid: "PAID", held: "HELD", blocked: "BLOCKED" } as const;

/** The four facts of one payment attempt, as a receipt that prints in. */
export function FactsReceipt({ id, verdict, proposed, decided, contract, funds, why, foot, title = "AP agent receipt" }: Facts) {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (prefersReducedMotion() || !el.current) return;
    let live = true;
    loadGsap().then((g) => {
      const root = el.current;
      if (!live || !root) return;
      const rows = root.querySelectorAll(".rcp-row");
      const stamp = root.querySelector(".rcp-stamp");
      g.killTweensOf([root, rows, stamp]);
      g.fromTo(root, { clipPath: "inset(0 0 100% 0)", y: -14 }, { clipPath: "inset(0 0 0% 0)", y: 0, duration: 0.65, ease: "power2.out", clearProps: "clipPath,transform" });
      g.fromTo(rows, { opacity: 0, y: -6 }, { opacity: 1, y: 0, duration: 0.28, stagger: 0.08, delay: 0.1, ease: "power1.out" });
      g.fromTo(stamp, { opacity: 0, scale: 1.6, rotate: -14 }, { opacity: 1, scale: 1, rotate: -6, duration: 0.28, delay: 0.55, ease: "back.out(2.2)" });
    });
    return () => {
      live = false;
    };
  }, [id]);

  return (
    <div className="rcp" ref={el} data-verdict={verdict}>
      <div className="rcp__head">
        <strong>UNDERWRITE</strong>
        <span>{title}</span>
      </div>
      <dl className="rcp__facts">
        <div className="rcp-row">
          <dt>1 Proposed</dt>
          <dd>{proposed}</dd>
        </div>
        <div className="rcp-row">
          <dt>2 Decided</dt>
          <dd>{decided}</dd>
        </div>
        <div className="rcp-row">
          <dt>3 Contract</dt>
          <dd>{contract}</dd>
        </div>
        <div className="rcp-row">
          <dt>4 Funds</dt>
          <dd>{funds}</dd>
        </div>
      </dl>
      {why && <p className="rcp__why">{why}</p>}
      <div className="rcp-stamp" data-verdict={verdict}>
        {VERDICT_WORD[verdict]}
      </div>
      {foot && <p className="rcp__sim">{foot}</p>}
      <div className="rcp__edge" aria-hidden="true" />
    </div>
  );
}

/** Derive verdict + stage states from the evaluator's decision words used across the app. */
export function verdictOf(decided?: string, fundsMoved?: boolean): "paid" | "held" | "blocked" {
  const d = (decided ?? "").toUpperCase();
  if (fundsMoved || d.startsWith("T1")) return "paid";
  if (d.startsWith("T2")) return "held";
  return "blocked";
}

export function statesFor(verdict: "paid" | "held" | "blocked"): NodeState[] {
  return verdict === "paid"
    ? ["pass", "pass", "pass", "pass"]
    : verdict === "held"
    ? ["pass", "pass", "wait", "idle"]
    : ["pass", "stop", "idle", "idle"];
}

/* ------------------------------------------------------------------ agent log */

export function AgentLog({ lines, empty = "Waiting for the agent." }: { lines: string[]; empty?: string }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const b = box.current;
    if (b) b.scrollTo({ top: b.scrollHeight, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }, [lines.length]);
  return (
    <div className="log" ref={box} role="log" aria-live="polite" aria-label="Agent log" tabIndex={0}>
      {lines.length === 0 ? (
        <p className="log__empty">{empty}</p>
      ) : (
        lines.map((l, i) => (
          <p key={`${i}-${l.slice(0, 24)}`} className="log__line">
            {l}
          </p>
        ))
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- modal */

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const card = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose; // keep the latest handler without re-running the focus logic

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const root = card.current;
    root?.querySelector<HTMLElement>("input, select, textarea, button:not(.iconbtn)")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        closeRef.current();
      }
      if (e.key === "Tab" && root) {
        const f = [...root.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])')];
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      previous?.focus();
    };
  }, [open]);

  const stop = useCallback(() => closeRef.current(), []);
  if (!open) return null;
  return (
    <div className="modal">
      <div className="modal__scrim" onClick={stop} aria-hidden="true" />
      <div className="modal__card" role="dialog" aria-modal="true" aria-label={title} ref={card}>
        <div className="modal__head">
          <h2 className="panel__title">{title}</h2>
          <button type="button" className="iconbtn" onClick={stop} aria-label="Close">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* --------------------------------------------------------- authority meter */

/** The live authority instrument: limit, window use, and exposure against the bond. */
export function AuthorityMeter({
  active,
  cap,
  windowSpend,
  exposure,
  bond,
  agentLabel,
}: {
  active: boolean;
  cap: number;
  windowSpend: number;
  exposure: number;
  bond: number;
  agentLabel?: string;
}) {
  const f = (a: number, b: number) => (b > 0 ? Math.max(0, Math.min(1, a / b)) : 0);
  return (
    <div className={`meter${active ? "" : " is-revoked"}`}>
      <div className="meter__head">
        <div>
          <p className="eyebrow">Authority meter</p>
          <p className="meter__state">
            {active ? <Chip tone="moved" dot><CheckGlyph /> Pays automatically</Chip> : <Chip tone="blocked"><CrossGlyph /> Revoked</Chip>}
          </p>
        </div>
        {agentLabel && <p className="meter__agent">{agentLabel}</p>}
      </div>
      <p className="meter__cap fig">
        {usd(active ? cap : 0)}
        <span> a day</span>
      </p>
      <div className="meter__rows">
        <div>
          <div className="meter__row">
            <span>Spent this window</span>
            <b className="fig">
              {usd(windowSpend)} of {usd(cap)}
            </b>
          </div>
          <div className="gaugebar gaugebar--lg" aria-hidden="true">
            <i style={{ ["--f" as string]: f(windowSpend, cap) } as React.CSSProperties} />
          </div>
        </div>
        <div className="meter__pair">
          <div className="meter__row">
            <span>Unreviewed exposure</span>
            <b className="fig">{usd(exposure)}</b>
          </div>
          <div className="gaugebar" aria-hidden="true">
            <i style={{ ["--f" as string]: f(exposure, bond) } as React.CSSProperties} />
          </div>
          <div className="meter__row">
            <span>Bond remaining</span>
            <b className="fig">{usd(bond)}</b>
          </div>
          <div className="gaugebar gaugebar--ok" aria-hidden="true">
            <i style={{ ["--f" as string]: 1 } as React.CSSProperties} />
          </div>
          <p className="meter__rule">Exposure must stay at or below the bond remaining.</p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------- result of one evaluated invoice */

export interface EvaluatedInvoice {
  proposed: string;
  decided: string;
  reasonCodes?: string[];
  contractResult: string;
  txHash?: string;
  fundsMoved?: boolean;
}

const DECIDED_WORDS = {
  paid: "Pays automatically (T1)",
  held: "Waits for the owner (T2)",
  blocked: "Blocked (T3)",
} as const;

export const CHECKS = ["Agent", "Policy", "Contract", "Funds"] as const;

/** The four checks plus the printed receipt for one evaluated invoice. Used by every page that evaluates one. */
export function ResultReceipt({ result, amount, foot }: { result: EvaluatedInvoice; amount: string; foot?: React.ReactNode }) {
  const key = useIdentityKey(result);
  const verdict = verdictOf(result.decided, result.fundsMoved);
  const moved = result.fundsMoved ? usd(amount) : "$0.00";
  return (
    <div className="result">
      <Pipeline stages={CHECKS} states={statesFor(verdict)} label="Where the invoice was stopped, if it was" />
      <FactsReceipt
        id={key}
        verdict={verdict}
        proposed={result.proposed}
        decided={
          <>
            {DECIDED_WORDS[verdict]}
            {result.reasonCodes?.length ? (
              <span className="rcp__codes">
                {result.reasonCodes.map((c) => (
                  <span key={c} className="rcp__code">
                    {c}
                  </span>
                ))}
              </span>
            ) : null}
          </>
        }
        contract={
          <>
            {result.contractResult}
            {result.txHash ? (
              <>
                {" "}
                <Hash value={result.txHash} start={10} end={8} />
              </>
            ) : null}
          </>
        }
        funds={`${moved} moved`}
        foot={foot}
      />
    </div>
  );
}

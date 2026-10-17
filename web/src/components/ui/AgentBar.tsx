"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usd } from "./index";

interface Live {
  ok: boolean;
  active: boolean;
  cap: number;
  exposure: number;
  bond: number;
  needs: number;
  chain: string;
}

interface Toast {
  key: string;
  tone: "moved" | "held" | "blocked";
  text: string;
}

/**
 * The agent's presence, on every page: is it online, what may it spend, how much unreviewed
 * exposure sits against the bond, and how many decisions are waiting for a person.
 * Read-only: it only GETs /api/state, the same endpoint the pages already poll.
 * When the agent decides on a new invoice, a short toast says what it did.
 */
export function AgentBar() {
  const [s, setS] = useState<Live | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seen = useRef<Set<string> | null>(null);

  useEffect(() => {
    let alive = true;
    const num = (v: unknown) => {
      const n = parseFloat(String(v ?? "0").replace(/,/g, ""));
      return Number.isFinite(n) ? n : 0;
    };

    const tick = async () => {
      try {
        const res = await fetch("/api/state");
        const json = await res.json();
        if (!alive) return;
        if (!json.success || !json.data) throw new Error("no state");
        const d = json.data;
        setS({
          ok: true,
          active: Boolean(d.qualification?.active),
          cap: num(d.qualification?.t1MaxPerWindowUSDC),
          exposure: num(d.meter?.currentExposureUSDC),
          bond: num(d.meter?.bondRemainingUSDC),
          needs: Array.isArray(json.pendingT2Payments) ? json.pendingT2Payments.length : 0,
          chain: String(d.chainName ?? "Local chain"),
        });

        const invoices: any[] = Array.isArray(json.invoices) ? json.invoices : [];
        const ids = new Set(invoices.map((i) => String(i.id)));
        if (seen.current === null) {
          seen.current = ids; // first poll: do not announce history
        } else {
          const fresh = invoices.filter((i) => !seen.current!.has(String(i.id)));
          seen.current = ids;
          if (fresh.length) {
            const made: Toast[] = fresh.slice(0, 3).map((i) => {
              const amount = usd(i.amountUSDC);
              const who = i.vendorName || i.vendorId || "supplier";
              if (i.tier === "T1" || i.status === "EXECUTED_T1") return { key: `${i.id}`, tone: "moved", text: `Agent paid ${i.invoiceNumber}: ${amount} to ${who}` };
              if (i.tier === "T2") return { key: `${i.id}`, tone: "held", text: `Agent held ${i.invoiceNumber} for you: ${amount}` };
              return { key: `${i.id}`, tone: "blocked", text: `Agent blocked ${i.invoiceNumber}: ${amount} from ${who}` };
            });
            setToasts((t) => [...t, ...made]);
            made.forEach((m) => window.setTimeout(() => setToasts((t) => t.filter((x) => x.key !== m.key)), 6000));
          }
        }
      } catch {
        if (alive) setS((p) => (p ? { ...p, ok: false } : { ok: false, active: false, cap: 0, exposure: 0, bond: 0, needs: 0, chain: "" }));
      }
    };

    tick();
    const id = window.setInterval(tick, 4000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, []);

  const online = s?.ok && s.active;
  return (
    <>
      <div className="agentbar" role="group" aria-label="Agent status">
        <span className={`agentbar__agent${online ? "" : " is-off"}`}>
          <i className="pulse" aria-hidden="true" />
          <span>
            <span className="agentbar__pre">Agent{s === null ? "" : " "}</span>
            {s === null ? "" : !s.ok ? "offline" : s.active ? "online" : "revoked"}
          </span>
        </span>
        {s?.ok && (
          <>
            <span className="agentbar__m">
              <b className="fig">{usd(s.active ? s.cap : 0)}</b> a day
            </span>
            <span className="agentbar__m agentbar__m--wide">{s.chain}</span>
            <span className="agentbar__m agentbar__m--wide">
              Exposure <b className="fig">{usd(s.exposure)}</b> of bond <b className="fig">{usd(s.bond)}</b>
            </span>
            <Link href="/portals/owner" className={`agentbar__needs${s.needs > 0 ? " has" : ""}`} key={s.needs}>
              {s.needs > 0 ? `${s.needs} ${s.needs === 1 ? "needs" : "need"} you` : "Inbox clear"}
            </Link>
          </>
        )}
      </div>

      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.key} className={`toast toast--${t.tone}`}>
            {t.text}
          </div>
        ))}
      </div>
    </>
  );
}

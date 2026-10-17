"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

const NAV = [
  { href: "#try", label: "Try it" },
  { href: "#how", label: "How" },
  { href: "#proof", label: "Proof" },
  { href: "#run", label: "Run it" },
];

export function Wordmark({ as: Tag = "span" }: { as?: "span" | "p" }) {
  return (
    <Tag className="wordmark">
      under<span className="wordmark__hl">write</span>
    </Tag>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);

  // Escape closes the menu and gives focus back to the button that opened it.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        menuButton.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="site-header">
      <div className="wrap site-header__inner">
        <Link href="/" className="site-header__home" aria-label="UNDERWRITE, home">
          <Wordmark />
        </Link>

        <nav className="site-nav" aria-label="Primary">
          {NAV.map((n) => (
            <a key={n.href} href={n.href}>
              {n.label}
            </a>
          ))}
        </nav>

        <div className="site-header__actions">
          <div className="site-header__theme">
            <ThemeToggle />
          </div>
          <Link href="/dashboard" className="btn btn--lime btn--sm" aria-label="Open the demo">
            <span className="cta-long">Open the demo</span>
            <span className="cta-short" aria-hidden="true">
              Demo
            </span>
          </Link>
          <button
            ref={menuButton}
            type="button"
            className="menu-btn"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </div>

      {open && (
        <div id="mobile-menu" className="mobile-menu">
          <div className="wrap">
            <nav aria-label="Primary, mobile">
              {NAV.map((n) => (
                <a key={n.href} href={n.href} onClick={() => setOpen(false)}>
                  {n.label}
                </a>
              ))}
              <Link href="/auth/login" onClick={() => setOpen(false)}>
                Demo sign-in
              </Link>
            </nav>
            <ThemeToggle />
          </div>
        </div>
      )}
    </header>
  );
}

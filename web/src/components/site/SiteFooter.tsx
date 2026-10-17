import React from "react";
import Link from "next/link";
import { Wordmark } from "./SiteHeader";
import { ThemeToggle } from "./ThemeToggle";

const GROUPS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Operate",
    links: [
      { href: "/dashboard", label: "Overview" },
      { href: "/portals/owner", label: "Owner inbox" },
      { href: "/portals/vendor", label: "Supplier portal" },
      { href: "/claims", label: "Claims" },
    ],
  },
  {
    title: "Qualify",
    links: [
      { href: "/exam", label: "Policy card" },
      { href: "/portals/examiner", label: "Examiner desk" },
      { href: "/portals/underwriter", label: "Underwriter desk" },
      { href: "/portals/adjudicator", label: "Adjudication desk" },
    ],
  },
  {
    title: "Prove",
    links: [
      { href: "/traces", label: "Traces" },
      { href: "/evidence", label: "Verify a qualification" },
      { href: "/verify", label: "Verification audit" },
      { href: "/experiment", label: "Experiment" },
    ],
  },
  {
    title: "Lab and account",
    links: [
      { href: "/submit", label: "Invoice studio" },
      { href: "/attack-lab", label: "Attack lab" },
      { href: "/auth/login", label: "Demo sign-in" },
      { href: "/auth/register", label: "Create a demo profile" },
    ],
  },
];

const LIMITS = [
  "The exam's bounds describe the exam, not how often real attacks happen.",
  "The adjudicator is a designated key in this prototype.",
  "Generator B and the blind set were written by the same team (DEC-023).",
  "Local chain only. A public-testnet broadcast has not been run (task P6-T02 is open).",
  "Payments in the web demo run in an in-memory runtime and are labelled Simulated.",
  "Demo accounts use published throwaway keys. Sign-in is not production authentication.",
  "UNDERWRITE is not insurance.",
];

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="site-footer__top">
          <div className="site-footer__brand">
            <Link href="/" aria-label="UNDERWRITE, home">
              <Wordmark />
            </Link>
            <p>FinTechathon 2026 · Topic F</p>
          </div>
          <nav className="site-footer__links" aria-label="Explore the demo">
            {GROUPS.map((g) => (
              <div key={g.title}>
                <h2 className="site-footer__h">{g.title}</h2>
                <ul>
                  {g.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href}>{l.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <details className="limits">
          <summary>What this prototype does not claim</summary>
          <ul>
            {LIMITS.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </details>

        <div className="site-footer__bottom">
          <p>Prototype on a local chain.</p>
          <ThemeToggle />
        </div>
      </div>
    </footer>
  );
}

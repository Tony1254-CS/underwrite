"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Icon } from "@/components/ui/icons";
import { NAV_GROUPS } from "@/components/ui/nav";

const COLLAPSE_KEY = "uw-rail";
export const RAIL_EVENT = "uw-rail-toggle";

/**
 * Navigation rail. Same destinations as before plus the pages that were never linked
 * (Policy card, Claims, Verification audit). Collapses on CLICK (remembered), never on hover,
 * so it works for keyboard and touch. On phones it becomes a sheet opened from the top bar.
 */
export function Sidebar() {
  const pathname = usePathname();
  const { user, logout, openAuthChallenge } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [sheet, setSheet] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {
      /* default expanded */
    }
    const toggle = () => setSheet((v) => !v);
    window.addEventListener(RAIL_EVENT, toggle);
    return () => window.removeEventListener(RAIL_EVENT, toggle);
  }, []);

  useEffect(() => setSheet(false), [pathname]);

  useEffect(() => {
    if (!sheet) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSheet(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheet]);

  const flip = () => {
    setCollapsed((c) => {
      try {
        window.localStorage.setItem(COLLAPSE_KEY, c ? "0" : "1");
      } catch {
        /* still works for this visit */
      }
      return !c;
    });
  };

  return (
    <>
      {sheet && <div className="rail__scrim" onClick={() => setSheet(false)} aria-hidden="true" />}
      <aside className={`rail${collapsed ? " is-collapsed" : ""}${sheet ? " is-open" : ""}`} aria-label="Workspace navigation">
        <div className="rail__top">
          <Link href="/" className="rail__brand" aria-label="UNDERWRITE, public home page">
            <span className="wordmark">
              under<span className="wordmark__hl">write</span>
            </span>
          </Link>
          <button
            type="button"
            className="iconbtn rail__collapse"
            onClick={flip}
            aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
            aria-pressed={collapsed}
          >
            <Icon name={collapsed ? "right" : "left"} />
          </button>
        </div>

        <nav className="rail__nav">
          {NAV_GROUPS.map((g) => (
            <div key={g.title} className="rail__group">
              <p className="rail__title">{g.title}</p>
              {g.items.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rail__link${active ? " is-active" : ""}`}
                    aria-current={active ? "page" : undefined}
                    title={collapsed ? item.name : undefined}
                  >
                    <Icon name={item.icon} />
                    <span className="rail__label">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="rail__foot">
          <div className="rail__who">
            <span className="rail__avatar" aria-hidden="true">
              {user.name.charAt(0)}
            </span>
            <span className="rail__label">
              <strong>{user.name}</strong>
              <small>{user.badge}</small>
            </span>
          </div>
          <div className="rail__actions rail__label">
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => openAuthChallenge(user.role === "OWNER" ? "EXAMINER" : "OWNER")}
            >
              Switch persona
            </button>
            <button type="button" className="btn btn--ghost btn--sm" onClick={logout}>
              Sign out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

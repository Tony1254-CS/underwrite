"use client";

import React, { useEffect, useState } from "react";

type Pref = "system" | "light" | "dark";

const OPTIONS: { value: Pref; label: string }[] = [
  { value: "system", label: "Auto" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

const STORAGE_KEY = "uw-theme";
const EVENT = "uw-theme-change";

/**
 * Three-way theme control. "Auto" follows the operating system and removes the attribute;
 * Light/Dark set data-theme on <html> and are remembered. All storage access is wrapped
 * because it can throw (private windows, blocked site data) and the page must still work.
 * A tiny inline script in the layout applies the saved choice before first paint.
 */
export function ThemeToggle() {
  const [pref, setPref] = useState<Pref>("light");

  useEffect(() => {
    const read = () => {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        setPref(saved === "dark" ? "dark" : saved === "system" ? "system" : "light");
      } catch {
        setPref("light");
      }
    };
    read();
    // Keep the header and footer toggles in sync.
    window.addEventListener(EVENT, read);
    return () => window.removeEventListener(EVENT, read);
  }, []);

  const apply = (next: Pref) => {
    const root = document.documentElement;
    root.classList.add("theme-switching");
    if (next === "system") root.setAttribute("data-theme", "system");
    else if (next === "dark") root.setAttribute("data-theme", "dark");
    else root.setAttribute("data-theme", "light");
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* the choice still applies for this visit */
    }
    setPref(next);
    window.dispatchEvent(new Event(EVENT));
    window.setTimeout(() => root.classList.remove("theme-switching"), 260);
  };

  return (
    <div className="theme-toggle" role="group" aria-label="Colour theme">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={pref === o.value}
          onClick={() => apply(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

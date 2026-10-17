"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "./index";
import { Icon } from "./icons";
import { ALL_NAV } from "./nav";

export const PALETTE_EVENT = "uw-open-palette";

/** Ctrl/Cmd+K: jump anywhere in the workspace without touching the mouse. */
export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);

  const items = useMemo(() => {
    const all = [...ALL_NAV, { name: "Public home page", href: "/", icon: "home" as const, hint: "Leave the workspace" }];
    const needle = q.trim().toLowerCase();
    if (!needle) return all;
    const byName = all.filter((n) => n.name.toLowerCase().includes(needle));
    const byHint = all.filter((n) => !byName.includes(n) && n.hint.toLowerCase().includes(needle));
    return [...byName, ...byHint];
  }, [q]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(PALETTE_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(PALETTE_EVENT, onOpen);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQ("");
      setActive(0);
    }
  }, [open]);

  const go = (href: string) => {
    setOpen(false);
    if (href === "/") window.location.href = href; // the public site is a separate root layout
    else router.push(href);
  };

  return (
    <Modal open={open} onClose={() => setOpen(false)} title="Go to">
      <div className="palette">
        <input
          className="input"
          role="combobox"
          aria-expanded="true"
          aria-controls="palette-list"
          aria-activedescendant={items[active] ? `palette-${active}` : undefined}
          aria-label="Search pages"
          placeholder="Type a page name"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setActive(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(items.length - 1, a + 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(0, a - 1));
            } else if (e.key === "Enter" && items[active]) {
              e.preventDefault();
              go(items[active].href);
            }
          }}
        />
        <ul id="palette-list" role="listbox" className="palette__list">
          {items.map((n, i) => (
            <li
              key={n.href}
              id={`palette-${i}`}
              role="option"
              aria-selected={i === active}
              className={i === active ? "is-active" : ""}
              onMouseEnter={() => setActive(i)}
              onClick={() => go(n.href)}
            >
              <Icon name={n.icon} />
              <span>
                <strong>{n.name}</strong>
                <small>{n.hint}</small>
              </span>
            </li>
          ))}
          {items.length === 0 && <li className="palette__none">Nothing matches.</li>}
        </ul>
      </div>
    </Modal>
  );
}

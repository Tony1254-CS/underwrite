import React from "react";

/**
 * Status glyphs are drawn, not typed: system fonts render check and cross marks differently
 * (and some platforms turn them into emoji). Each is decorative; the word beside it carries
 * the meaning, so status is never colour alone.
 */

const base = {
  width: 12,
  height: 12,
  viewBox: "0 0 12 12",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: false,
};

export function CheckGlyph() {
  return (
    <svg {...base}>
      <path d="M2 6.4 4.7 9 10 3.2" />
    </svg>
  );
}

export function CrossGlyph() {
  return (
    <svg {...base}>
      <path d="M2.8 2.8 9.2 9.2M9.2 2.8 2.8 9.2" />
    </svg>
  );
}

export function ArrowGlyph() {
  return (
    <svg {...base} width={14} height={14} viewBox="0 0 14 14">
      <path d="M2 7h9.2M7.6 3.4 11.2 7 7.6 10.6" />
    </svg>
  );
}

export function ClockGlyph() {
  return (
    <svg {...base}>
      <circle cx="6" cy="6" r="4.2" />
      <path d="M6 3.6V6l1.7 1" />
    </svg>
  );
}

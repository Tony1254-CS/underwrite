import React from "react";

/**
 * Provenance stamp. Every figure on the site says where it came from.
 * Meaning is carried by SHAPE (fill, outline, dashes, hatch), never by hue, so it survives
 * grayscale, print and both themes. The four older variants (REPLAY, SCRIPTED, CONTROLLED,
 * SIMULATED) keep their meaning from components/Badges.tsx; LIVE CHAIN, RECORDED and NOT RUN
 * complete the model so "unlabelled" is never ambiguous.
 */

export type StampKind =
  | "live"
  | "recorded"
  | "replay"
  | "scripted"
  | "controlled"
  | "simulated"
  | "notrun";

export const STAMP_DEFS: Record<StampKind, { label: string; meaning: string }> = {
  live: { label: "Live chain", meaning: "Read from the chain RPC in this session." },
  recorded: { label: "Recorded", meaning: "Read from a committed evidence file." },
  replay: { label: "Replay", meaning: "Replayed from a recorded agent trace." },
  scripted: { label: "Scripted", meaning: "Produced by a deterministic script or fixture." },
  controlled: {
    label: "Controlled",
    meaning: "A controlled condition, such as a designated key or a what-if input.",
  },
  simulated: {
    label: "Simulated",
    meaning: "Produced by the in-memory demo runtime. No chain transaction was sent.",
  },
  notrun: { label: "Not run", meaning: "Not executed. Nothing is shown in its place." },
};

export function Stamp({
  kind,
  label,
  meaning,
}: {
  kind: StampKind;
  /** Override the visible label (for example "Specimen" on a simulated illustration). */
  label?: string;
  /** Override the long-form meaning used for the tooltip and screen readers. */
  meaning?: string;
}) {
  const def = STAMP_DEFS[kind];
  const text = label ?? def.label;
  const long = meaning ?? def.meaning;
  return (
    <span className={`stamp stamp--${kind}`} title={long}>
      {kind === "live" && <span className="stamp__dot" aria-hidden="true" />}
      {kind === "recorded" && (
        <svg className="stamp__glyph" viewBox="0 0 10 12" aria-hidden="true">
          <path d="M1 .75h5.2L9 3.5V11.25H1z M6 .75V3.75h3" fill="none" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      )}
      <span>{text}</span>
      <span className="sr-only">. {long}</span>
    </span>
  );
}

"use client";

import React, { useState } from "react";

/**
 * Writes to the clipboard. The async Clipboard API only exists in secure contexts (https or
 * localhost), so a judge opening the demo over a LAN address would otherwise get nothing.
 * Falls back to the older select-and-copy route in that case.
 */
async function writeClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to the fallback */
  }
  try {
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    const done = document.execCommand("copy");
    document.body.removeChild(field);
    return done;
  } catch {
    return false;
  }
}

/** Copies a command and says so in words, visibly and to screen readers. */
export function CopyButton({ text }: { text: string }) {
  const [state, setState] = useState<"idle" | "done" | "failed">("idle");

  const copy = async () => {
    setState((await writeClipboard(text)) ? "done" : "failed");
    window.setTimeout(() => setState("idle"), 1800);
  };

  return (
    <>
      <button type="button" className="copy-btn" onClick={copy} aria-label={`Copy command: ${text}`}>
        {state === "done" ? "Copied" : state === "failed" ? "Copy failed" : "Copy"}
      </button>
      <span className="sr-only" aria-live="polite">
        {state === "done" ? "Copied to clipboard" : state === "failed" ? "Copy failed" : ""}
      </span>
    </>
  );
}

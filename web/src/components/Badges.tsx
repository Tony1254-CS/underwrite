import React from "react";
import { Stamp, type StampKind } from "@/components/site/Stamp";

/**
 * Provenance badges (AGENTS.md rule 12): REPLAY, SCRIPTED, CONTROLLED and SIMULATED keep their
 * names and props. They now render as the same shape-coded stamps used across the whole site, so
 * meaning never depends on colour alone.
 */

export type ProvenanceBadgeType = "REPLAY" | "SCRIPTED" | "CONTROLLED" | "SIMULATED";

interface BadgeProps {
  variant: ProvenanceBadgeType;
  label?: string;
  size?: "sm" | "md";
  className?: string;
}

const KIND: Record<ProvenanceBadgeType, { kind: StampKind; meaning: string }> = {
  REPLAY: { kind: "replay", meaning: "Replayed historical trace or environment execution" },
  SCRIPTED: { kind: "scripted", meaning: "Deterministic scripted harness or fixture data" },
  CONTROLLED: { kind: "controlled", meaning: "Controlled test condition or synthetic parameter" },
  SIMULATED: { kind: "simulated", meaning: "Simulated adversary action or synthetic agent behavior" },
};

export function ProvenanceBadge({ variant, label }: BadgeProps) {
  const k = KIND[variant];
  return <Stamp kind={k.kind} label={label ?? variant} meaning={`${variant}: ${k.meaning}`} />;
}

export function ReplayBadge(props: Omit<BadgeProps, "variant">) {
  return <ProvenanceBadge variant="REPLAY" {...props} />;
}

export function ScriptedBadge(props: Omit<BadgeProps, "variant">) {
  return <ProvenanceBadge variant="SCRIPTED" {...props} />;
}

export function ControlledBadge(props: Omit<BadgeProps, "variant">) {
  return <ProvenanceBadge variant="CONTROLLED" {...props} />;
}

export function SimulatedBadge(props: Omit<BadgeProps, "variant">) {
  return <ProvenanceBadge variant="SIMULATED" {...props} />;
}

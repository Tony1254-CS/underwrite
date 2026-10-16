import React from "react";

export type ProvenanceBadgeType = "REPLAY" | "SCRIPTED" | "CONTROLLED" | "SIMULATED";

interface BadgeProps {
  variant: ProvenanceBadgeType;
  label?: string;
  size?: "sm" | "md";
  className?: string;
}

const BADGE_CONFIG: Record<
  ProvenanceBadgeType,
  {
    defaultLabel: string;
    bg: string;
    text: string;
    border: string;
    dot: string;
    description: string;
  }
> = {
  REPLAY: {
    defaultLabel: "REPLAY",
    bg: "bg-amber-950/60",
    text: "text-amber-300",
    border: "border-amber-700/60",
    dot: "bg-amber-400",
    description: "Replayed historical trace or environment execution",
  },
  SCRIPTED: {
    defaultLabel: "SCRIPTED",
    bg: "bg-purple-950/60",
    text: "text-purple-300",
    border: "border-purple-700/60",
    dot: "bg-purple-400",
    description: "Deterministic scripted harness or fixture data",
  },
  CONTROLLED: {
    defaultLabel: "CONTROLLED",
    bg: "bg-sky-950/60",
    text: "text-sky-300",
    border: "border-sky-700/60",
    dot: "bg-sky-400",
    description: "Controlled test condition or synthetic parameter",
  },
  SIMULATED: {
    defaultLabel: "SIMULATED",
    bg: "bg-rose-950/60",
    text: "text-rose-300",
    border: "border-rose-700/60",
    dot: "bg-rose-400",
    description: "Simulated adversary action or synthetic agent behavior",
  },
};

export function ProvenanceBadge({
  variant,
  label,
  size = "sm",
  className = "",
}: BadgeProps) {
  const config = BADGE_CONFIG[variant];
  const displayLabel = label ?? config.defaultLabel;

  const sizeClasses =
    size === "sm"
      ? "text-[11px] px-2 py-0.5 tracking-wider font-mono font-medium gap-1.5"
      : "text-xs px-2.5 py-1 tracking-wider font-mono font-semibold gap-2";

  return (
    <span
      title={`${config.defaultLabel}: ${config.description}`}
      className={`inline-flex items-center rounded border ${config.bg} ${config.text} ${config.border} ${sizeClasses} ${className}`}
    >
      <span className={`inline-block w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{displayLabel}</span>
    </span>
  );
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

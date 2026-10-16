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
    glow: string;
    description: string;
  }
> = {
  REPLAY: {
    defaultLabel: "REPLAY",
    bg: "bg-amber-500/10 backdrop-blur-md",
    text: "text-amber-300",
    border: "border-amber-500/30",
    dot: "bg-amber-400",
    glow: "shadow-[0_0_8px_rgba(245,158,11,0.6)]",
    description: "Replayed historical trace or environment execution",
  },
  SCRIPTED: {
    defaultLabel: "SCRIPTED",
    bg: "bg-purple-500/10 backdrop-blur-md",
    text: "text-purple-300",
    border: "border-purple-500/30",
    dot: "bg-purple-400",
    glow: "shadow-[0_0_8px_rgba(168,85,247,0.6)]",
    description: "Deterministic scripted harness or fixture data",
  },
  CONTROLLED: {
    defaultLabel: "CONTROLLED",
    bg: "bg-cyan-500/10 backdrop-blur-md",
    text: "text-cyan-300",
    border: "border-cyan-500/30",
    dot: "bg-cyan-400",
    glow: "shadow-[0_0_8px_rgba(6,182,212,0.6)]",
    description: "Controlled test condition or synthetic parameter",
  },
  SIMULATED: {
    defaultLabel: "SIMULATED",
    bg: "bg-rose-500/10 backdrop-blur-md",
    text: "text-rose-300",
    border: "border-rose-500/30",
    dot: "bg-rose-400",
    glow: "shadow-[0_0_8px_rgba(244,63,94,0.6)]",
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
      ? "text-[10px] px-2 py-0.5 tracking-wider font-mono font-medium gap-1.5"
      : "text-xs px-2.5 py-1 tracking-wider font-mono font-semibold gap-2";

  return (
    <span
      title={`${config.defaultLabel}: ${config.description}`}
      className={`inline-flex items-center rounded-full border shadow-sm ${config.bg} ${config.text} ${config.border} ${sizeClasses} ${className} transition-all duration-200 hover:brightness-110`}
    >
      <span className={`inline-block w-1.5 h-1.5 rounded-full ${config.dot} ${config.glow}`} />
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

import type { CSSProperties, ReactNode } from "react";

export type BadgeTone =
  | "neutral"
  | "success"
  | "warning"
  | "critical"
  | "info"
  | "pro";

export interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  icon?: ReactNode;
  className?: string;
}

function styleFor(tone: BadgeTone): CSSProperties {
  switch (tone) {
    case "success":
      return {
        background: "var(--rz-good-bg)",
        color: "var(--rz-good-text)",
        borderColor: "var(--rz-good-border)",
      };
    case "warning":
      return {
        background: "var(--rz-warning-bg)",
        color: "var(--rz-warning-text)",
        borderColor: "var(--rz-warning-border)",
      };
    case "critical":
      return {
        background: "var(--rz-critical-bg)",
        color: "var(--rz-critical-text)",
        borderColor: "var(--rz-critical-border)",
      };
    case "info":
      return {
        background: "var(--rz-info-bg)",
        color: "var(--rz-info-text)",
        borderColor: "var(--rz-info-border)",
      };
    case "pro":
      return {
        background: "var(--rz-primary)",
        color: "var(--rz-on-primary)",
        borderColor: "transparent",
      };
    case "neutral":
    default:
      return {
        background: "var(--rz-card-bg-alt)",
        color: "var(--rz-text-2)",
        borderColor: "var(--rz-border)",
      };
  }
}

/**
 * Small inline pill — used for plan markers ("Pro"), counts, and
 * miscellaneous metadata. Status conveying severity should use
 * StatusPill instead.
 */
export function Badge({
  children,
  tone = "neutral",
  icon,
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-[8px] border px-2.5 py-1.5 text-[13px] font-bold leading-none ${className}`}
      style={styleFor(tone)}
    >
      {icon}
      {children}
    </span>
  );
}

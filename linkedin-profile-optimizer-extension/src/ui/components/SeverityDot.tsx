import type { CSSProperties } from "react";
import type { Severity } from "../../scoring/severity";

export type DotSize = "xs" | "sm" | "md";
export type DotTone = Severity | "neutral" | "info";

interface Props {
  severity?: Severity;
  tone?: DotTone;
  size?: DotSize;
  className?: string;
  style?: CSSProperties;
}

const SIZE: Record<DotSize, number> = { xs: 6, sm: 8, md: 10 };

function colorFor(tone: DotTone): string {
  switch (tone) {
    case "critical": return "var(--rz-critical-solid)";
    case "warning":  return "var(--rz-warning-solid)";
    case "good":     return "var(--rz-good-solid)";
    case "info":     return "var(--rz-info-solid)";
    case "neutral":
    default:         return "var(--rz-text-3)";
  }
}

/**
 * Inline color-coded dot. Used by status pills, the floating reopen
 * pill, and the severity legend in the section list.
 */
export function SeverityDot({
  severity,
  tone,
  size = "sm",
  className = "",
  style,
}: Props) {
  const resolvedTone: DotTone = tone ?? severity ?? "neutral";
  const px = SIZE[size];
  return (
    <span
      aria-hidden="true"
      className={`inline-block shrink-0 rounded-full ${className}`}
      style={{
        width: px,
        height: px,
        background: colorFor(resolvedTone),
        ...style,
      }}
    />
  );
}

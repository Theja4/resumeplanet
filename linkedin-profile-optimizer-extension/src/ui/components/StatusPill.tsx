import { SeverityDot } from "./SeverityDot";
import type { Severity } from "../../scoring/severity";

export interface StatusPillProps {
  severity: Severity;
  size?: "sm" | "md";
  /** Override the default "Critical / Needs work / Good" label. */
  label?: string;
  className?: string;
}

const DEFAULT_LABEL: Record<Severity, string> = {
  critical: "Critical",
  warning: "Needs work",
  good: "Good",
};

/**
 * Severity status pill — the visible signal that drives the FOMO
 * mechanic. Always paired with text + dot so colour is never the
 * only signal (a11y).
 */
export function StatusPill({
  severity,
  size = "sm",
  label,
  className = "",
}: StatusPillProps) {
  const resolved = label ?? DEFAULT_LABEL[severity];
  return (
    <span
      className={`rz-status-pill ${size === "md" ? "text-[13px]" : ""} ${className}`}
      data-severity={severity}
    >
      <SeverityDot severity={severity} size={size === "md" ? "sm" : "xs"} />
      {resolved}
    </span>
  );
}

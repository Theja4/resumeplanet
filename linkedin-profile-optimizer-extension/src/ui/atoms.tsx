import { type CSSProperties, type ReactNode } from "react";
import type { CheckStatus } from "../scoring/types";

export function Card({
  children,
  style,
  className = "",
}: {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <div className={`rz-card p-4 ${className}`} style={style}>
      {children}
    </div>
  );
}

export function StatusBadge({ status, points, max }: {
  status: CheckStatus;
  points?: number;
  max?: number;
}) {
  const styles = badgeStyles(status);
  const label =
    status === "unread"
      ? "Unread"
      : status === "absent"
        ? "Empty"
        : typeof points === "number" && typeof max === "number"
          ? `${points}/${max}`
          : status;
  return (
    <span
      className="shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider"
      style={styles}
    >
      <span
        aria-hidden="true"
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ background: dotColor(status) }}
      />
      {label}
    </span>
  );
}

function badgeStyles(s: CheckStatus): CSSProperties {
  const border = "1px solid var(--rz-border)";
  switch (s) {
    case "pass":
      return { background: "var(--rz-primary-soft)", color: "var(--rz-primary)", border };
    case "warn":
      return { background: "var(--rz-warn-soft)", color: "var(--rz-warn)", border };
    case "fail":
      return { background: "var(--rz-danger-soft)", color: "var(--rz-danger)", border };
    case "absent":
      return { background: "var(--rz-info-soft)", color: "var(--rz-info)", border };
    default:
      return { background: "var(--rz-surface-2)", color: "var(--rz-on-surface-3)", border };
  }
}

function dotColor(s: CheckStatus): string {
  switch (s) {
    case "pass":   return "var(--rz-primary)";
    case "warn":   return "var(--rz-warn)";
    case "fail":   return "var(--rz-danger)";
    case "absent": return "var(--rz-info)";
    default:       return "var(--rz-on-surface-3)";
  }
}

export function ProgressBar({ value, status }: { value: number; status: CheckStatus }) {
  const color = dotColor(status);
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full"
      style={{ background: "var(--rz-surface-2)" }}
    >
      <div
        className="h-full rounded-full"
        style={{
          width: `${Math.max(0, Math.min(100, value))}%`,
          background: color,
          boxShadow: `0 0 12px ${color}55`,
          transition: "width 480ms cubic-bezier(.22,.61,.36,1)",
        }}
      />
    </div>
  );
}

export function GradientButton({
  children,
  onClick,
  href,
  type = "button",
  disabled,
  full,
}: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  full?: boolean;
}) {
  const style: CSSProperties = {
    background: "var(--rz-gradient)",
    color: "var(--rz-on-primary)",
    boxShadow: "var(--rz-shadow-pop)",
    opacity: disabled ? 0.55 : 1,
  };
  const className = `inline-flex ${full ? "w-full" : ""} items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition hover:-translate-y-px active:translate-y-0`;
  if (href) {
    return (
      <a className={className} style={style} href={href} rel="noreferrer noopener" target="_blank" onClick={onClick}>
        {children}
      </a>
    );
  }
  return (
    <button className={className} style={style} disabled={disabled} onClick={onClick} type={type}>
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  onClick,
  href,
  full,
}: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  full?: boolean;
}) {
  const style: CSSProperties = {
    background: "var(--rz-surface)",
    color: "var(--rz-on-surface)",
    border: "1px solid var(--rz-border)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
  };
  const className = `inline-flex ${full ? "w-full" : ""} items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition hover:bg-[var(--rz-surface-2)]`;
  if (href) {
    return (
      <a className={className} style={style} href={href} rel="noreferrer noopener" target="_blank" onClick={onClick}>
        {children}
      </a>
    );
  }
  return (
    <button className={className} style={style} onClick={onClick} type="button">
      {children}
    </button>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p
      className="mb-2.5 mt-4 text-[11px] font-bold uppercase tracking-[0.18em]"
      style={{ color: "var(--rz-on-surface-3)" }}
    >
      {children}
    </p>
  );
}

export function Skeleton({ height = 14, width = "100%" }: { height?: number; width?: string | number }) {
  return <div className="rz-skeleton" style={{ height, width }} />;
}

export function ScanningSkeleton() {
  return (
    <div className="space-y-3 px-4 py-4">
      <div className="rz-card p-5">
        <div className="flex items-center gap-5">
          <div className="rz-skeleton h-[124px] w-[124px] rounded-full" />
          <div className="flex-1 space-y-3">
            <Skeleton height={12} width="40%" />
            <Skeleton height={26} width="65%" />
            <Skeleton height={12} width="80%" />
          </div>
        </div>
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="flex justify-between">
            <Skeleton height={12} width="35%" />
            <Skeleton height={12} width="15%" />
          </div>
          <Skeleton height={8} />
        </div>
      ))}
    </div>
  );
}

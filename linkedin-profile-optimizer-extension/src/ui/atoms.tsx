import { type CSSProperties, type ReactNode } from "react";

import { Badge as NewBadge } from "./components/Badge";
import { Button as NewButton } from "./components/Button";
import { Card as NewCard } from "./components/Card";
import type { CheckStatus } from "../scoring/types";

/**
 * @deprecated Legacy atomic exports kept as shims so existing tab/card
 * code keeps compiling during the Stripe-grade revamp. New code should
 * import directly from `./components/`. Once every callsite has been
 * migrated, this file can be deleted.
 */

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
    <NewCard padded="md" className={className} style={style}>
      {children}
    </NewCard>
  );
}

export function StatusBadge({
  status,
  points,
  max,
}: {
  status: CheckStatus;
  points?: number;
  max?: number;
}) {
  const tone = badgeTone(status);
  const label =
    status === "unread"
      ? "Unread"
      : status === "absent"
        ? "Empty"
        : typeof points === "number" && typeof max === "number"
          ? `${points}/${max}`
          : status;
  return <NewBadge tone={tone}>{label}</NewBadge>;
}

function badgeTone(s: CheckStatus): "success" | "warning" | "critical" | "info" | "neutral" {
  switch (s) {
    case "pass":   return "success";
    case "warn":   return "warning";
    case "fail":   return "critical";
    case "absent": return "info";
    default:       return "neutral";
  }
}

function statusColor(s: CheckStatus): string {
  switch (s) {
    case "pass":   return "var(--rz-good-solid)";
    case "warn":   return "var(--rz-warning-solid)";
    case "fail":   return "var(--rz-critical-solid)";
    case "absent": return "var(--rz-info-solid)";
    default:       return "var(--rz-text-3)";
  }
}

export function ProgressBar({ value, status }: { value: number; status: CheckStatus }) {
  const color = statusColor(status);
  return (
    <div
      className="h-1 w-full overflow-hidden rounded-full"
      style={{ background: "var(--rz-border)" }}
    >
      <div
        className="h-full rounded-full"
        style={{
          width: `${Math.max(0, Math.min(100, value))}%`,
          background: color,
          transition: "width var(--rz-dur-3) var(--rz-ease)",
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
  return (
    <NewButton
      variant="primary"
      size="md"
      block={full}
      type={type}
      disabled={disabled}
      href={href}
      onClick={onClick}
    >
      {children}
    </NewButton>
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
  return (
    <NewButton
      variant="secondary"
      size="md"
      block={full}
      href={href}
      onClick={onClick}
    >
      {children}
    </NewButton>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-2 mt-4 rz-eyebrow">
      {children}
    </p>
  );
}

export function Skeleton({
  height = 14,
  width = "100%",
}: {
  height?: number;
  width?: string | number;
}) {
  return <div className="rz-skeleton" style={{ height, width }} />;
}

/** Loading skeleton matching the new ScoreHero + section list shape. */
export function ScanningSkeleton() {
  return (
    <div className="space-y-3 px-4 py-4 rz-fade-in">
      <NewCard padded="md">
        <div className="flex items-center gap-4">
          <div className="rz-skeleton h-[110px] w-[110px] rounded-full" />
          <div className="flex-1 space-y-3">
            <Skeleton height={11} width="35%" />
            <Skeleton height={28} width="55%" />
            <Skeleton height={11} width="70%" />
          </div>
        </div>
      </NewCard>
      {Array.from({ length: 5 }).map((_, i) => (
        <NewCard padded="sm" key={i}>
          <div className="flex items-center justify-between">
            <Skeleton height={11} width="40%" />
            <Skeleton height={11} width="20%" />
          </div>
        </NewCard>
      ))}
    </div>
  );
}

import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export type StatSize = "sm" | "md" | "lg";

export interface StatDelta {
  direction: "up" | "down" | "flat";
  value: ReactNode;
  /** Whether the direction is good news ("up" on a score) or bad. */
  tone?: "good" | "bad" | "neutral";
}

export interface StatProps {
  value: ReactNode;
  /** Suffix shown right after value, e.g. "/100". */
  suffix?: ReactNode;
  label?: ReactNode;
  caption?: ReactNode;
  delta?: StatDelta | null;
  size?: StatSize;
  className?: string;
}

const SIZE = {
  sm: { value: "text-[25px]", label: "text-[12px]" },
  md: { value: "text-[33px]", label: "text-[13px]" },
  lg: { value: "text-[48px]", label: "text-[13px]" },
};

function deltaColor(d: StatDelta): string {
  if (d.tone === "good") return "var(--rz-good-text)";
  if (d.tone === "bad")  return "var(--rz-critical-text)";
  return "var(--rz-text-3)";
}

/**
 * Stripe-style metric block. Tabular numerals, restrained type,
 * optional delta indicator. Used by ScoreHero and the popup.
 */
export function Stat({
  value,
  suffix,
  label,
  caption,
  delta,
  size = "md",
  className = "",
}: StatProps) {
  const sz = SIZE[size];
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label ? (
        <span
          className={`${sz.label} font-semibold uppercase tracking-[0.06em]`}
          style={{ color: "var(--rz-text-3)" }}
        >
          {label}
        </span>
      ) : null}
      <div className="flex items-baseline gap-2">
        <span
          className={`${sz.value} rz-num font-semibold leading-none`}
          style={{ color: "var(--rz-text)", letterSpacing: 0 }}
        >
          {value}
        </span>
        {suffix ? (
          <span
            className="text-[14px] font-medium rz-num"
            style={{ color: "var(--rz-text-3)" }}
          >
            {suffix}
          </span>
        ) : null}
        {delta ? (
          <span
            className="inline-flex items-center gap-0.5 text-[12px] font-medium rz-num"
            style={{ color: deltaColor(delta) }}
          >
            {delta.direction === "up" ? (
              <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
            ) : delta.direction === "down" ? (
              <ArrowDownRight className="h-3 w-3" aria-hidden="true" />
            ) : null}
            {delta.value}
          </span>
        ) : null}
      </div>
      {caption ? (
        <span className="text-[12px]" style={{ color: "var(--rz-text-3)" }}>
          {caption}
        </span>
      ) : null}
    </div>
  );
}

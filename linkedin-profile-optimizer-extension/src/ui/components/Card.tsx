import {
  type ButtonHTMLAttributes,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
  forwardRef,
} from "react";

export type CardTone = "default" | "critical" | "warning" | "good" | "info";
export type CardPadding = "none" | "sm" | "md" | "lg";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padded?: CardPadding;
  hoverable?: boolean;
  tone?: CardTone;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
  /** When set, the card renders as a button-like clickable surface. */
  as?: "div" | "button";
  ariaLabel?: string;
}

/** Liquid-glass card surface used throughout the extension panel. */
export const Card = forwardRef<HTMLDivElement | HTMLButtonElement, CardProps>(
  function Card(
    {
      children,
      padded = "md",
      hoverable = false,
      tone = "default",
      className = "",
      style,
      onClick,
      as = "div",
      ariaLabel,
      ...rest
    },
    ref,
  ) {
    const padClass = paddingClass(padded);
    const toneStyle = toneStyleFor(tone);
    const baseClass = [
      "rz-card",
      hoverable ? "rz-card-hover" : "",
      padClass,
      onClick ? "cursor-pointer text-left w-full" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    const merged: CSSProperties = { ...toneStyle, ...style };

    if (as === "button" || onClick) {
      const buttonRest = rest as ButtonHTMLAttributes<HTMLButtonElement>;
      return (
        <button
          ref={ref as React.Ref<HTMLButtonElement>}
          type="button"
          className={baseClass}
          style={merged}
          onClick={onClick}
          aria-label={ariaLabel}
          {...buttonRest}
        >
          {children}
        </button>
      );
    }
    return (
      <div
        ref={ref as React.Ref<HTMLDivElement>}
        className={baseClass}
      style={merged}
      aria-label={ariaLabel}
      {...rest}
    >
      {children}
    </div>
    );
  },
);

function paddingClass(p: CardPadding): string {
  switch (p) {
    case "none": return "";
    case "sm":   return "p-4";
    case "lg":   return "p-6";
    default:     return "p-5";
  }
}

function toneStyleFor(tone: CardTone): CSSProperties {
  switch (tone) {
    case "critical":
      return {
        background: "var(--rz-critical-bg)",
        borderColor: "var(--rz-critical-border)",
      };
    case "warning":
      return {
        background: "var(--rz-warning-bg)",
        borderColor: "var(--rz-warning-border)",
      };
    case "good":
      return {
        background: "var(--rz-good-bg)",
        borderColor: "var(--rz-good-border)",
      };
    case "info":
      return {
        background: "var(--rz-info-bg)",
        borderColor: "var(--rz-info-border)",
      };
    default:
      return {};
  }
}

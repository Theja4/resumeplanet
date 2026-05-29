import { type ReactNode, forwardRef } from "react";

interface Props {
  children: ReactNode;
  onClick?: () => void;
  title?: string;
  ariaLabel?: string;
  active?: boolean;
  disabled?: boolean;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Stripe-style square icon button with extension-safe hit targets.
 */
export const IconButton = forwardRef<HTMLButtonElement, Props>(
  function IconButton(
    {
      children,
      onClick,
      title,
      ariaLabel,
      active,
      disabled,
      size = "md",
      className = "",
    },
    ref,
  ) {
    const dim = size === "sm" ? "h-10 w-10" : "h-11 w-11";
    return (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        title={title}
        aria-label={ariaLabel ?? title}
        aria-pressed={active}
        disabled={disabled}
        className={`inline-flex ${dim} shrink-0 items-center justify-center rounded-[10px] transition-[background,color,border-color,box-shadow,transform] duration-200 disabled:opacity-50 ${className}`}
        style={{
          background: active ? "var(--rz-primary-soft)" : "transparent",
          color: active ? "var(--rz-primary)" : "var(--rz-text-2)",
          border: active ? "1px solid var(--rz-primary-soft)" : "1px solid transparent",
        }}
        onMouseEnter={(e) => {
          if (disabled) return;
          if (!active) {
            (e.currentTarget as HTMLButtonElement).style.background = "var(--rz-card-bg-alt)";
            (e.currentTarget as HTMLButtonElement).style.color = "var(--rz-text)";
          }
        }}
        onMouseLeave={(e) => {
          if (!active) {
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            (e.currentTarget as HTMLButtonElement).style.color = "var(--rz-text-2)";
          }
        }}
      >
        {children}
      </button>
    );
  },
);

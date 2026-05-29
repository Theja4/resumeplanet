import { type ReactNode, forwardRef } from "react";
import { Loader2 } from "lucide-react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "tertiary"
  | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  block?: boolean;
  icon?: ReactNode;
  trailingIcon?: ReactNode;
  iconPosition?: "left" | "right";
  href?: string;
  type?: "button" | "submit" | "reset";
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void;
  title?: string;
  ariaLabel?: string;
  ariaPressed?: boolean;
  /**
   * When true, the link will not open in a new tab. Defaults to opening
   * external href targets in a new tab.
   */
  internal?: boolean;
}

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary:   "rz-btn rz-btn-primary",
  secondary: "rz-btn rz-btn-secondary",
  tertiary:  "rz-btn rz-btn-tertiary",
  danger:    "rz-btn rz-btn-primary",
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: "rz-btn-sm",
  md: "",
  lg: "rz-btn-lg",
};

/**
 * Stripe-style flat button. No gradients, no translate-y on hover,
 * no glow halos. Subtle background shift + restrained shadow lift.
 */
export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  function Button(
    {
      children,
      variant = "primary",
      size = "md",
      loading = false,
      disabled = false,
      block = false,
      icon,
      trailingIcon,
      iconPosition = "left",
      href,
      type = "button",
      className = "",
      onClick,
      title,
      ariaLabel,
      ariaPressed,
      internal = false,
    },
    ref,
  ) {
    const composed = [
      VARIANT_CLASS[variant],
      SIZE_CLASS[size],
      block ? "rz-btn-block" : "",
      variant === "danger" ? "" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    // Danger needs a colour override: emit inline style only for that case.
    const dangerStyle =
      variant === "danger"
        ? {
            background: "var(--rz-critical-solid)",
            color: "#ffffff",
          }
        : undefined;

    const left =
      loading
        ? <Loader2 className="h-3.5 w-3.5 animate-[rz-spin_700ms_linear_infinite]" aria-hidden="true" />
        : (icon && iconPosition === "left" ? icon : null);
    const right = !loading && (
      iconPosition === "right" && icon
        ? icon
        : trailingIcon ?? null
    );

    const inner = (
      <>
        {left}
        <span>{children}</span>
        {right}
      </>
    );

    if (href) {
      const handleAnchorClick = (
        event: React.MouseEvent<HTMLAnchorElement>,
      ) => {
        if (disabled || loading) {
          event.preventDefault();
          return;
        }

        onClick?.(event);
        if (event.defaultPrevented || internal) return;

        if (canOpenWithChromeTabs(href)) {
          event.preventDefault();
          chrome.tabs.create({ url: href }, () => {
            // The callback keeps Chrome from surfacing an unchecked
            // runtime.lastError when a popup closes immediately after click.
            void chrome.runtime.lastError;
          });
        }
      };

      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          className={composed}
          href={href}
          rel={internal ? undefined : "noreferrer noopener"}
          target={internal ? undefined : "_blank"}
          onClick={handleAnchorClick}
          title={title}
          aria-label={ariaLabel}
          aria-disabled={disabled || loading || undefined}
          style={dangerStyle}
          tabIndex={disabled || loading ? -1 : undefined}
        >
          {inner}
        </a>
      );
    }
    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type={type}
        className={composed}
        disabled={disabled || loading}
        onClick={onClick}
        title={title}
        aria-label={ariaLabel}
        aria-pressed={ariaPressed}
        style={dangerStyle}
      >
        {inner}
      </button>
    );
  },
);

function canOpenWithChromeTabs(href: string): boolean {
  if (!/^https?:\/\//i.test(href)) return false;
  try {
    return typeof chrome !== "undefined" && typeof chrome.tabs?.create === "function";
  } catch {
    return false;
  }
}

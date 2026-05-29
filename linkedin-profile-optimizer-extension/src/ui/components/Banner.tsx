import { type CSSProperties, type ReactNode } from "react";
import { X } from "lucide-react";

export type BannerTone = "info" | "warning" | "critical" | "success" | "neutral";

export interface BannerProps {
  tone: BannerTone;
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

function styleFor(tone: BannerTone): { container: CSSProperties; iconColor: string } {
  switch (tone) {
    case "critical":
      return {
        container: {
          background: "var(--rz-critical-bg)",
          borderColor: "var(--rz-critical-border)",
          color: "var(--rz-text)",
        },
        iconColor: "var(--rz-critical-solid)",
      };
    case "warning":
      return {
        container: {
          background: "var(--rz-warning-bg)",
          borderColor: "var(--rz-warning-border)",
          color: "var(--rz-text)",
        },
        iconColor: "var(--rz-warning-solid)",
      };
    case "success":
      return {
        container: {
          background: "var(--rz-good-bg)",
          borderColor: "var(--rz-good-border)",
          color: "var(--rz-text)",
        },
        iconColor: "var(--rz-good-solid)",
      };
    case "info":
      return {
        container: {
          background: "var(--rz-info-bg)",
          borderColor: "var(--rz-info-border)",
          color: "var(--rz-text)",
        },
        iconColor: "var(--rz-info-solid)",
      };
    case "neutral":
    default:
      return {
        container: {
          background: "var(--rz-card-bg)",
          borderColor: "var(--rz-border)",
          color: "var(--rz-text)",
        },
        iconColor: "var(--rz-text-3)",
      };
  }
}

/** Tonal banner used by secondary status surfaces. */
export function Banner({
  tone,
  title,
  description,
  action,
  icon,
  dismissible = false,
  onDismiss,
  className = "",
}: BannerProps) {
  const { container, iconColor } = styleFor(tone);
  return (
    <div
      role={tone === "critical" || tone === "warning" ? "alert" : "status"}
      className={`relative flex items-start gap-3 rounded-[10px] border p-4 ${className}`}
      style={container}
    >
      {icon ? (
        <span
          aria-hidden="true"
          className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center"
          style={{ color: iconColor }}
        >
          {icon}
        </span>
      ) : null}
      <div className="min-w-0 flex-1">
        {title ? (
          <p className="text-[14px] font-semibold leading-snug" style={{ color: "var(--rz-text)" }}>
            {title}
          </p>
        ) : null}
        {description ? (
          <p
            className="mt-1 text-[13px] leading-snug"
            style={{ color: "var(--rz-text-2)" }}
          >
            {description}
          </p>
        ) : null}
        {action ? <div className="mt-3 flex items-center gap-2">{action}</div> : null}
      </div>
      {dismissible ? (
        <button
          type="button"
          onClick={onDismiss}
          className="ml-2 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition hover:bg-black/5"
          style={{ color: "var(--rz-text-3)" }}
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}

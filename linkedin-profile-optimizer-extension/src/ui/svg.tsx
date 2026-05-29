/**
 * Branded SVG components — kept minimal in the Stripe-grade revamp.
 * The decorative library (SparkField, GlassyIcon, GemBadge, AuroraField,
 * GradientBlob, DotMatrix, ProfileGlyph, CrystalMotif, AllClearGem,
 * GridLines) was removed because the new design language is restrained
 * monochrome with a single emerald accent.
 */

interface BrandMarkProps {
  size?: "sm" | "md" | "lg";
  iconUrl?: string | null;
  className?: string;
  /** Hide the wordmark and just show the icon. */
  iconOnly?: boolean;
}

/**
 * Logo lockup — square icon (Rezoomed mascot from /public/icon/) plus
 * the wordmark. Used in the SidebarShell header and the popup header.
 */
export function BrandMark({
  size = "md",
  iconUrl,
  className = "",
  iconOnly = false,
}: BrandMarkProps) {
  const dim = size === "sm" ? "h-9 w-9" : size === "lg" ? "h-11 w-11" : "h-10 w-10";
  const wordmarkClass = size === "lg" ? "rz-wordmark-lg" : "rz-wordmark";

  return (
    <div className={`flex min-w-0 items-center gap-2 ${className}`}>
      <div
        className={`relative grid ${dim} shrink-0 place-items-center overflow-hidden rounded-[10px]`}
        aria-hidden="true"
      >
        {iconUrl ? (
          <img
            src={iconUrl}
            alt=""
            className="h-full w-full object-contain"
            draggable={false}
          />
        ) : (
          <div
            className="h-full w-full"
            style={{ background: "var(--rz-primary)" }}
          />
        )}
      </div>
      {iconOnly ? null : (
        <span className={wordmarkClass}>Rezoomed</span>
      )}
    </div>
  );
}

interface TrendArrowProps {
  size?: number;
  direction?: "up" | "down";
  className?: string;
}

export function ProfileCardIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 220 150"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <rect x="18" y="16" width="184" height="118" rx="8" fill="var(--rz-card-bg)" stroke="var(--rz-border)" />
      <rect x="32" y="31" width="42" height="42" rx="8" fill="var(--rz-primary-soft)" />
      <circle cx="53" cy="49" r="10" fill="var(--rz-primary)" />
      <path d="M39 66c5-9 23-9 28 0" stroke="var(--rz-primary)" strokeWidth="5" strokeLinecap="round" />
      <rect x="88" y="35" width="74" height="8" rx="4" fill="var(--rz-text)" opacity=".88" />
      <rect x="88" y="52" width="92" height="7" rx="3.5" fill="var(--rz-text-3)" opacity=".55" />
      <rect x="88" y="67" width="66" height="7" rx="3.5" fill="var(--rz-text-3)" opacity=".36" />
      <rect x="32" y="94" width="128" height="7" rx="3.5" fill="var(--rz-text-3)" opacity=".28" />
      <rect x="32" y="111" width="100" height="7" rx="3.5" fill="var(--rz-text-3)" opacity=".22" />
      <path d="M170 95l10 10 22-28" stroke="var(--rz-primary)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="178" cy="34" r="8" fill="var(--rz-sun)" />
      <circle cx="193" cy="51" r="5" fill="var(--rz-pop)" />
      <circle cx="158" cy="120" r="6" fill="var(--rz-sky)" />
    </svg>
  );
}

export function ScoreWaveSvg({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 180 56" className={className} aria-hidden="true" fill="none">
      <path
        d="M8 42c20 0 23-27 42-27 18 0 20 24 39 24 19 0 21-31 41-31 18 0 24 21 42 21"
        stroke="var(--rz-primary)"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path
        d="M8 42c20 0 23-27 42-27 18 0 20 24 39 24 19 0 21-31 41-31 18 0 24 21 42 21"
        stroke="var(--rz-sun)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="3 10"
      />
      <circle cx="130" cy="8" r="7" fill="var(--rz-pop)" />
      <circle cx="50" cy="15" r="6" fill="var(--rz-sky)" />
    </svg>
  );
}

/**
 * Solid emerald (or red) trend arrow. Used inside Stat deltas.
 * No gradients — Stripe Dashboard uses solid colours for direction.
 */
export function TrendArrow({
  size = 12,
  direction = "up",
  className = "",
}: TrendArrowProps) {
  const path =
    direction === "up"
      ? "M3 17 L9 11 L13 15 L21 7 M15 7 L21 7 L21 13"
      : "M3 7 L9 13 L13 9 L21 17 M15 17 L21 17 L21 11";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <path
        d={path}
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

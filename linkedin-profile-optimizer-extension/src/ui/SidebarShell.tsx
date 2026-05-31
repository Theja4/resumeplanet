import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

import { IconButton, SeverityDot } from "./components";
import { severityFromRatio } from "../scoring/severity";
import { BrandMark } from "./svg";
import { SIDEBAR_OPEN_REQUEST_KEY } from "./sidebarState";

const COLLAPSED_KEY = "rezoomed.sidebar.collapsed.v1";
const HIDDEN_KEY = "rezoomed.sidebar.hidden.v1";

interface Props {
  scoreBadge?: number | null;
  scanning: boolean;
  onRescan: () => void;
  children: ReactNode;
  /** Sticky region rendered immediately below the header (score hero). */
  sticky?: ReactNode;
  /** Floating bottom region (tab nav). */
  bottomNav?: ReactNode;
  /** Right-side area inside the header — typically status/plan badge. */
  headerMeta?: ReactNode;
  /** Render the whole panel as the premium dark "anon" experience. */
  dark?: boolean;
}

function readBool(key: string, fallback: boolean): boolean {
  try {
    const v = localStorage.getItem(key);
    if (v === null) return fallback;
    return v === "1";
  } catch {
    return fallback;
  }
}

function writeBool(key: string, value: boolean) {
  try {
    localStorage.setItem(key, value ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function SidebarShell({
  scoreBadge,
  scanning,
  onRescan,
  children,
  sticky,
  bottomNav,
  headerMeta,
  dark = false,
}: Props) {
  const [collapsed, setCollapsed] = useState(() => readBool(COLLAPSED_KEY, false));
  const [hidden, setHidden] = useState(() => readBool(HIDDEN_KEY, false));

  useEffect(() => writeBool(COLLAPSED_KEY, collapsed), [collapsed]);
  useEffect(() => writeBool(HIDDEN_KEY, hidden), [hidden]);

  useEffect(() => {
    const openFromRequest = (requestedAt: unknown) => {
      if (typeof requestedAt !== "number") return;
      if (Date.now() - requestedAt > 2 * 60 * 1000) return;
      setHidden(false);
      setCollapsed(false);
      writeBool(HIDDEN_KEY, false);
      writeBool(COLLAPSED_KEY, false);
    };

    try {
      chrome?.storage?.local?.get?.([SIDEBAR_OPEN_REQUEST_KEY], (result) => {
        openFromRequest(result?.[SIDEBAR_OPEN_REQUEST_KEY]);
      });

      const onChanged = (
        changes: { [key: string]: chrome.storage.StorageChange },
        areaName: string,
      ) => {
        if (areaName !== "local") return;
        openFromRequest(changes[SIDEBAR_OPEN_REQUEST_KEY]?.newValue);
      };
      chrome?.storage?.onChanged?.addListener?.(onChanged);
      return () => chrome?.storage?.onChanged?.removeListener?.(onChanged);
    } catch {
      return undefined;
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === ".") {
        e.preventDefault();
        setCollapsed((c) => !c);
        setHidden(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const reopen = useCallback(() => {
    setHidden(false);
    setCollapsed(false);
  }, []);

  if (hidden) {
    return (
      <FloatingPill scoreBadge={scoreBadge} onReopen={reopen} />
    );
  }

  return (
    <aside
      className={`rz-panel-shell fixed right-0 top-0 z-[2147483647] flex h-screen flex-col overflow-hidden rz-slide-in${dark ? " rz-anon" : ""}`}
      style={{
        width: collapsed ? "78px" : "min(540px, calc(100vw - 24px))",
        background: "var(--rz-panel-bg)",
        color: "var(--rz-text)",
        borderLeft: "1px solid var(--rz-border)",
        boxShadow: "var(--rz-shadow-rail)",
        transition: "width 260ms var(--rz-ease-out)",
      }}
    >
      {collapsed ? (
        <CollapsedRail
          scoreBadge={scoreBadge}
          onExpand={() => setCollapsed(false)}
          onHide={() => setHidden(true)}
          onRescan={onRescan}
          scanning={scanning}
        />
      ) : (
        <>
          <Header
            onCollapse={() => setCollapsed(true)}
            onHide={() => setHidden(true)}
            onRescan={onRescan}
            scanning={scanning}
            meta={headerMeta}
          />
          {sticky}
          <div className="flex-1 overflow-y-auto pb-36">{children}</div>
          {bottomNav ? (
            <div
              className="absolute inset-x-0 bottom-0 z-[2]"
              style={{
                background: "var(--rz-panel-bg)",
                borderTop: "1px solid var(--rz-border)",
              }}
            >
              <div className="px-4 py-2">{bottomNav}</div>
            </div>
          ) : (
            <FooterMinimal />
          )}
        </>
      )}
    </aside>
  );
}

function FloatingPill({
  scoreBadge,
  onReopen,
}: {
  scoreBadge?: number | null;
  onReopen: () => void;
}) {
  const ratio =
    typeof scoreBadge === "number" ? scoreBadge / 100 : NaN;
  const severity = severityFromRatio(ratio);
  // Use deep, theme-stable hex pairs (solid + dark) so the entire pill
  // can be a saturated severity-coloured surface with white text that
  // remains AA-legible regardless of light/dark mode. The CSS palette's
  // dark-mode tones are pastel and would fail contrast for white text.
  const palette =
    severity === "critical"
      ? { solid: "#dc2626", deep: "#991b1b" }
      : severity === "warning"
        ? { solid: "#d97706", deep: "#92400e" }
        : { solid: "#059669", deep: "#065f46" };
  let iconUrl: string | null = null;
  try {
    iconUrl = chrome?.runtime?.getURL?.("icon/128.png") ?? null;
  } catch {
    iconUrl = null;
  }

  return (
    <button
      type="button"
      onClick={onReopen}
      className="rz-floating-pill rz-slide-in"
      data-severity={severity}
      style={
        {
          "--rz-pill-tone": palette.solid,
          "--rz-pill-tone-deep": palette.deep,
        } as CSSProperties
      }
      title="Reopen Rezoomed (⌘.)"
      aria-label={
        typeof scoreBadge === "number"
          ? `Reopen Rezoomed — score ${scoreBadge} of 100`
          : "Reopen Rezoomed"
      }
    >
      <span className="rz-floating-pill-icon" aria-hidden="true">
        {iconUrl ? <img src={iconUrl} alt="" draggable={false} /> : null}
      </span>
      <span className="rz-floating-pill-copy">
        <span className="rz-floating-pill-kicker">Profile coach</span>
        <span className="rz-floating-pill-brand">Rezoomed</span>
      </span>
      {typeof scoreBadge === "number" ? (
        <span className="rz-floating-pill-score" data-severity={severity}>
          <strong>{scoreBadge}</strong>
          <small>/100</small>
        </span>
      ) : (
        <span className="rz-floating-pill-score" data-severity="good">
          <strong>Open</strong>
        </span>
      )}
      <span className="rz-floating-pill-arrow" aria-hidden="true">
        <ChevronLeft className="h-4 w-4" />
      </span>
    </button>
  );
}

function Header({
  onCollapse,
  onHide,
  onRescan,
  scanning,
  meta,
}: {
  onCollapse: () => void;
  onHide: () => void;
  onRescan: () => void;
  scanning: boolean;
  meta?: ReactNode;
}) {
  let iconUrl: string | null = null;
  try {
    iconUrl = chrome?.runtime?.getURL?.("icon/128.png") ?? null;
  } catch {
    iconUrl = null;
  }

  return (
    <header
      className="rz-brand-panel flex min-h-[64px] items-center justify-between gap-3 px-4 py-2.5"
      style={{ borderBottom: "1px solid var(--rz-border)" }}
    >
      <div className="relative z-[1] min-w-0">
        <BrandMark size="md" iconUrl={iconUrl} />
      </div>
      <div className="relative z-[1] flex items-center gap-1">
        {meta ? <div className="mr-1">{meta}</div> : null}
        <IconButton size="sm" title="Re-scan profile" onClick={onRescan} ariaLabel="Re-scan profile">
          <RefreshCw className={`h-[19px] w-[19px] ${scanning ? "animate-[rz-spin_700ms_linear_infinite]" : ""}`} />
        </IconButton>
        <IconButton size="sm" title="Collapse (⌘.)" onClick={onCollapse} ariaLabel="Collapse panel">
          <ChevronRight className="h-[19px] w-[19px]" />
        </IconButton>
        <IconButton size="sm" title="Close" onClick={onHide} ariaLabel="Close panel">
          <X className="h-[19px] w-[19px]" />
        </IconButton>
      </div>
    </header>
  );
}

function FooterMinimal() {
  return (
    <div
      className="px-4 py-3 text-center text-[12px]"
      style={{
        color: "var(--rz-text-3)",
        borderTop: "1px solid var(--rz-border)",
      }}
    >
      <a
        href="https://rezoomed.com?ref=ext_footer"
        rel="noreferrer noopener"
        target="_blank"
        className="font-medium hover:underline"
        style={{ color: "var(--rz-primary)" }}
      >
        rezoomed.com
      </a>
    </div>
  );
}

function CollapsedRail({
  scoreBadge,
  onExpand,
  onHide,
  onRescan,
  scanning,
}: {
  scoreBadge?: number | null;
  onExpand: () => void;
  onHide: () => void;
  onRescan: () => void;
  scanning: boolean;
}) {
  const ratio = typeof scoreBadge === "number" ? scoreBadge / 100 : NaN;
  const severity = severityFromRatio(ratio);
  return (
    <div className="flex h-full flex-col items-center justify-between py-3.5">
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={onExpand}
          title="Expand Rezoomed (⌘.)"
          aria-label="Expand panel"
          type="button"
          className="grid h-12 w-12 place-items-center rounded-[8px] transition"
          style={{
            background: "var(--rz-card-bg)",
            color: "var(--rz-text)",
            border: "1px solid var(--rz-border)",
          }}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {typeof scoreBadge === "number" ? (
          <button
            onClick={onExpand}
            title={`Score ${scoreBadge}/100 — click to expand`}
            aria-label={`Expand panel — score ${scoreBadge} of 100`}
            type="button"
            className="relative grid h-12 w-12 place-items-center rounded-[8px] text-[16px] font-bold rz-num tracking-[-0.02em]"
            style={{
              background: "var(--rz-card-bg)",
              color: "var(--rz-text)",
              border: "1px solid var(--rz-border)",
              boxShadow: "var(--rz-shadow-xs)",
            }}
          >
            <SeverityDot severity={severity} size="xs" className="absolute" style={{ top: 4, right: 4 }} />
            {scoreBadge}
          </button>
        ) : null}

        <IconButton title="Re-scan" onClick={onRescan} ariaLabel="Re-scan profile">
          <RefreshCw className={`h-5 w-5 ${scanning ? "animate-[rz-spin_700ms_linear_infinite]" : ""}`} />
        </IconButton>
      </div>

      <IconButton title="Hide" onClick={onHide} ariaLabel="Hide panel">
        <X className="h-5 w-5" />
      </IconButton>
    </div>
  );
}

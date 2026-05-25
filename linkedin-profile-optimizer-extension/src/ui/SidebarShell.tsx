import { ChevronLeft, ChevronRight, X, Bug, RefreshCw, Sparkles } from "lucide-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";

const COLLAPSED_KEY = "rezoomed.sidebar.collapsed.v1";
const HIDDEN_KEY = "rezoomed.sidebar.hidden.v1";

interface Props {
  scoreBadge?: number | null;
  scanning: boolean;
  debugOpen: boolean;
  onRescan: () => void;
  onToggleDebug: () => void;
  children: ReactNode;
  /** Sticky region rendered immediately below the header (score hero). */
  sticky?: ReactNode;
  /** Floating bottom region (tab nav). */
  bottomNav?: ReactNode;
  /** Right-side area inside the header — typically status/plan badge. */
  headerMeta?: ReactNode;
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
  debugOpen,
  onRescan,
  onToggleDebug,
  children,
  sticky,
  bottomNav,
  headerMeta,
}: Props) {
  const [collapsed, setCollapsed] = useState(() => readBool(COLLAPSED_KEY, false));
  const [hidden, setHidden] = useState(() => readBool(HIDDEN_KEY, false));

  useEffect(() => writeBool(COLLAPSED_KEY, collapsed), [collapsed]);
  useEffect(() => writeBool(HIDDEN_KEY, hidden), [hidden]);

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
      <button
        className="fixed bottom-6 right-6 z-[2147483647] flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold rz-slide-in"
        onClick={reopen}
        style={{
          background: "var(--rz-gradient)",
          color: "var(--rz-on-primary)",
          boxShadow: "var(--rz-shadow-pop)",
        }}
        title="Reopen Rezoomed (⌘.)"
        type="button"
      >
        <Sparkles className="h-4 w-4" aria-hidden="true" />
        Rezoomed
        {typeof scoreBadge === "number" ? (
          <span
            className="ml-1 rounded-full px-2 py-0.5 text-xs"
            style={{ background: "rgba(0,0,0,0.18)" }}
          >
            {scoreBadge}
          </span>
        ) : null}
      </button>
    );
  }

  return (
    <aside
      className="fixed right-0 top-0 z-[2147483647] flex h-screen flex-col overflow-hidden rz-slide-in"
      style={{
        width: collapsed ? "64px" : "min(440px, calc(100vw - 24px))",
        background: "var(--rz-canvas)",
        color: "var(--rz-on-surface)",
        borderLeft: "1px solid var(--rz-border)",
        boxShadow: "var(--rz-shadow-rail)",
        transition: "width 240ms cubic-bezier(.22,.61,.36,1)",
      }}
    >
      {/* Ambient green glow behind the score hero — fixed at top of the
       * sidebar, ignored by pointer events so cards above it stay clickable. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[360px] rz-pulse-glow"
        style={{ background: "var(--rz-glow)" }}
      />
      {/* Secondary, more saturated halo. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 left-1/2 h-[220px] w-[220px] -translate-x-1/2 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(2,109,50,0.55) 0%, rgba(2,109,50,0) 70%)" }}
      />

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
            onToggleDebug={onToggleDebug}
            scanning={scanning}
            debugActive={debugOpen}
            meta={headerMeta}
          />
          <div className="relative z-[1]">{sticky}</div>
          <div className="relative z-[1] flex-1 overflow-y-auto px-4 pb-32 pt-2">{children}</div>
          {bottomNav ? (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] pb-3 pt-6"
                 style={{
                   background: "linear-gradient(to top, var(--rz-canvas) 60%, rgba(11,16,14,0))",
                 }}>
              <div className="pointer-events-auto mx-4">{bottomNav}</div>
              <KbdHint />
            </div>
          ) : (
            <FooterMinimal />
          )}
        </>
      )}
    </aside>
  );
}

function Header({
  onCollapse,
  onHide,
  onRescan,
  onToggleDebug,
  scanning,
  debugActive,
  meta,
}: {
  onCollapse: () => void;
  onHide: () => void;
  onRescan: () => void;
  onToggleDebug: () => void;
  scanning: boolean;
  debugActive: boolean;
  meta?: ReactNode;
}) {
  return (
    <header
      className="relative z-[2] flex items-center justify-between gap-3 px-5 py-4"
    >
      <div className="flex min-w-0 items-center gap-3">
        <Logo />
        <div className="min-w-0">
          <p
            className="text-[11px] font-bold uppercase leading-none tracking-[0.18em]"
            style={{ color: "var(--rz-primary)" }}
          >
            Rezoomed
          </p>
          <p className="mt-1.5 text-[17px] font-bold leading-none">
            Profile Optimizer
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        {meta}
        <IconButton title="Re-scan profile" onClick={onRescan}>
          <RefreshCw className={`h-[18px] w-[18px] ${scanning ? "animate-spin" : ""}`} />
        </IconButton>
        <IconButton title="Parser debug" onClick={onToggleDebug} active={debugActive}>
          <Bug className="h-[18px] w-[18px]" />
        </IconButton>
        <IconButton title="Collapse (⌘.)" onClick={onCollapse}>
          <ChevronRight className="h-[18px] w-[18px]" />
        </IconButton>
        <IconButton title="Close" onClick={onHide}>
          <X className="h-[18px] w-[18px]" />
        </IconButton>
      </div>
    </header>
  );
}

function KbdHint() {
  return (
    <div
      className="mt-2 flex items-center justify-center gap-1.5 text-[11px]"
      style={{ color: "var(--rz-on-surface-3)" }}
    >
      <kbd className="rz-kbd">⌘</kbd>
      <kbd className="rz-kbd">.</kbd>
      <span>to toggle</span>
      <style>{`
        .rz-kbd {
          display: inline-block;
          min-width: 18px;
          padding: 1px 5px;
          font-size: 10px;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          color: var(--rz-on-surface-2);
          background: var(--rz-surface-2);
          border: 1px solid var(--rz-border);
          border-radius: 5px;
          text-align: center;
        }
      `}</style>
    </div>
  );
}

function FooterMinimal() {
  return (
    <div
      className="relative z-[1] px-5 py-3 text-center text-[11px]"
      style={{ color: "var(--rz-on-surface-3)", borderTop: "1px solid var(--rz-border)" }}
    >
      <a
        href="https://rezoomed.com?ref=ext_footer"
        rel="noreferrer noopener"
        target="_blank"
        className="font-semibold hover:underline"
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
  return (
    <div className="relative z-[1] flex h-full flex-col items-center justify-between py-4">
      <div className="flex flex-col items-center gap-3.5">
        <button
          onClick={onExpand}
          title="Expand Rezoomed (⌘.)"
          type="button"
          className="grid h-11 w-11 place-items-center rounded-2xl"
          style={{
            background: "var(--rz-gradient)",
            color: "var(--rz-on-primary)",
            boxShadow: "var(--rz-shadow-pop)",
          }}
        >
          <Sparkles className="h-5 w-5" aria-hidden="true" />
        </button>

        {typeof scoreBadge === "number" ? (
          <button
            onClick={onExpand}
            title={`Score ${scoreBadge}/100 — click to expand`}
            type="button"
            className="grid h-12 w-12 place-items-center rounded-full text-base font-bold rz-card"
          >
            {scoreBadge}
          </button>
        ) : null}

        <IconButton title="Re-scan" onClick={onRescan}>
          <RefreshCw className={`h-[18px] w-[18px] ${scanning ? "animate-spin" : ""}`} />
        </IconButton>

        <IconButton title="Expand" onClick={onExpand}>
          <ChevronLeft className="h-[18px] w-[18px]" />
        </IconButton>
      </div>

      <IconButton title="Hide" onClick={onHide}>
        <X className="h-[18px] w-[18px]" />
      </IconButton>
    </div>
  );
}

function Logo() {
  return (
    <div
      className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl"
      style={{
        background: "var(--rz-gradient)",
        boxShadow: "0 6px 20px -6px rgba(128,218,146,0.6)",
      }}
      aria-hidden="true"
    >
      <Sparkles className="h-5 w-5" style={{ color: "var(--rz-on-primary)" }} />
    </div>
  );
}

export function IconButton({
  children,
  onClick,
  title,
  active,
}: {
  children: ReactNode;
  onClick: () => void;
  title: string;
  active?: boolean;
}) {
  return (
    <button
      className="inline-flex h-9 w-9 items-center justify-center rounded-xl transition"
      onClick={onClick}
      title={title}
      type="button"
      style={{
        background: active ? "var(--rz-primary-soft)" : "var(--rz-surface)",
        color: active ? "var(--rz-primary)" : "var(--rz-on-surface-2)",
        border: "1px solid var(--rz-border)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "var(--rz-surface-2)";
        (e.currentTarget as HTMLButtonElement).style.color = "var(--rz-on-surface)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = active
          ? "var(--rz-primary-soft)"
          : "var(--rz-surface)";
        (e.currentTarget as HTMLButtonElement).style.color = active
          ? "var(--rz-primary)"
          : "var(--rz-on-surface-2)";
      }}
    >
      {children}
    </button>
  );
}

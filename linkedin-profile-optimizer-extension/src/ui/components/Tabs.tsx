import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

export interface TabDef<Id extends string> {
  id: Id;
  label: string;
  icon?: ReactNode;
  badge?: number | string | null;
}

interface TabsProps<Id extends string> {
  tabs: TabDef<Id>[];
  active: Id;
  onChange: (id: Id) => void;
  className?: string;
  ariaLabel?: string;
}

interface IndicatorRect {
  left: number;
  width: number;
}

/** Rounded segmented tab switcher with a sliding active pill. */
export function Tabs<Id extends string>({
  tabs,
  active,
  onChange,
  className = "",
  ariaLabel = "Tabs",
}: TabsProps<Id>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<Map<Id, HTMLButtonElement | null>>(new Map());
  const [indicator, setIndicator] = useState<IndicatorRect | null>(null);

  const measure = useCallback(() => {
    const container = containerRef.current;
    const node = tabRefs.current.get(active);
    if (!container || !node) return;
    const cBox = container.getBoundingClientRect();
    const nBox = node.getBoundingClientRect();
    setIndicator({
      left: nBox.left - cBox.left,
      width: nBox.width,
    });
  }, [active]);

  useLayoutEffect(() => {
    measure();
  }, [measure, tabs]);

  useEffect(() => {
    if (!containerRef.current) return undefined;
    const ro = new ResizeObserver(() => measure());
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [measure]);

  const onKey = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>, idx: number) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      e.preventDefault();
      const dir = e.key === "ArrowRight" ? 1 : -1;
      const next = (idx + dir + tabs.length) % tabs.length;
      const nextId = tabs[next]!.id;
      onChange(nextId);
      // Move keyboard focus to the new tab
      const ref = tabRefs.current.get(nextId);
      ref?.focus();
    },
    [tabs, onChange],
  );

  return (
    <div
      ref={containerRef}
      role="tablist"
      aria-label={ariaLabel}
      className={`rz-tabs relative flex items-center gap-0 overflow-hidden ${className}`}
    >
      <span
        aria-hidden="true"
        className="rz-tabs-indicator pointer-events-none absolute"
        style={{
          left: 0,
          width: indicator?.width ?? 0,
          transform: `translate3d(${indicator?.left ?? 0}px, 0, 0)`,
          opacity: indicator ? 1 : 0,
        }}
      />
      {tabs.map((tab, idx) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            ref={(node) => {
              if (node) tabRefs.current.set(tab.id, node);
              else tabRefs.current.delete(tab.id);
            }}
            type="button"
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => onKey(e, idx)}
            className="rz-tab-button relative z-[1] inline-flex flex-1 items-center justify-center gap-2 text-[15px] font-semibold outline-none"
            data-active={isActive ? "true" : "false"}
            style={{
              color: isActive ? "var(--rz-primary-active)" : "var(--rz-primary)",
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLButtonElement).style.color = "var(--rz-primary-active)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLButtonElement).style.color = "var(--rz-primary)";
              }
            }}
          >
            {tab.icon}
            {tab.label}
            {tab.badge != null && tab.badge !== "" && tab.badge !== 0 ? (
              <span
                className="ml-1 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-semibold"
                style={{
                  background: isActive ? "var(--rz-primary-soft)" : "rgba(255,255,255,0.32)",
                  color: isActive ? "var(--rz-primary-active)" : "var(--rz-primary)",
                  border: "1px solid rgba(255,255,255,0.18)",
                }}
              >
                {tab.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

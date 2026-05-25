import { type ReactNode } from "react";

export interface TabDef<Id extends string> {
  id: Id;
  label: string;
  icon?: ReactNode;
  badge?: number | string | null;
}

interface Props<Id extends string> {
  tabs: TabDef<Id>[];
  active: Id;
  onChange: (id: Id) => void;
}

export function TabNav<Id extends string>({ tabs, active, onChange }: Props<Id>) {
  return (
    <nav
      className="flex items-center gap-1 rounded-full p-1.5"
      style={{
        background: "var(--rz-glass-strong)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        border: "1px solid var(--rz-border)",
        boxShadow: "var(--rz-shadow-card)",
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className="relative inline-flex flex-1 items-center justify-center gap-1.5 rounded-full px-2.5 py-2 text-[12px] font-bold transition"
            style={
              isActive
                ? {
                    background: "var(--rz-gradient)",
                    color: "var(--rz-on-primary)",
                    boxShadow: "0 6px 16px -4px rgba(128,218,146,0.45)",
                  }
                : {
                    color: "var(--rz-on-surface-2)",
                    background: "transparent",
                  }
            }
          >
            {tab.icon}
            <span className="truncate">{tab.label}</span>
            {tab.badge != null && tab.badge !== 0 ? (
              <span
                className="ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none"
                style={{
                  background: isActive ? "rgba(0,0,0,0.22)" : "var(--rz-primary-soft)",
                  color: isActive ? "var(--rz-on-primary)" : "var(--rz-primary)",
                }}
              >
                {tab.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}

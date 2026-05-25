import { ChevronRight } from "lucide-react";
import { ProgressBar, SectionLabel } from "../atoms";
import type { ScoreResult } from "../../scoring/types";

interface Props {
  score: ScoreResult;
  onJumpToFixes: () => void;
}

export function OverviewTab({ score, onJumpToFixes }: Props) {
  const topIssues = score.checks
    .filter((c) => c.status === "fail" || c.status === "warn")
    .sort((a, b) => a.points / a.max - b.points / b.max)
    .slice(0, 3);

  return (
    <div className="rz-fade-in">
      <SectionLabel>Section breakdown</SectionLabel>
      <div className="rz-card space-y-3.5 p-4">
        {score.categories.map((category) => (
          <div key={category.id}>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <span className="text-[15px] font-semibold">{category.label}</span>
              <span className="text-[14px] font-bold" style={{ color: "var(--rz-on-surface-3)" }}>
                {category.status === "unread" ? "—" : `${category.total}%`}
              </span>
            </div>
            <ProgressBar value={category.total} status={category.status} />
          </div>
        ))}
      </div>

      {topIssues.length > 0 ? (
        <>
          <SectionLabel>Top wins waiting</SectionLabel>
          <div className="space-y-2.5">
            {topIssues.map((c) => (
              <button
                key={c.id}
                onClick={onJumpToFixes}
                type="button"
                className="rz-card group flex w-full items-center justify-between gap-3 p-4 text-left transition hover:-translate-y-px"
              >
                <div className="min-w-0">
                  <p className="text-[15px] font-bold leading-tight">{c.label}</p>
                  <p
                    className="mt-1 text-[14px] leading-snug"
                    style={{ color: "var(--rz-on-surface-2)" }}
                  >
                    {c.tip}
                  </p>
                </div>
                <ChevronRight
                  className="h-5 w-5 shrink-0 transition group-hover:translate-x-0.5"
                  style={{ color: "var(--rz-primary)" }}
                />
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

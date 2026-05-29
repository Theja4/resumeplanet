import { useMemo } from "react";
import { Search, Sparkles } from "lucide-react";

import { buildRecruiterBoolean, type BooleanResult, type BooleanSection } from "../../recruiter/boolean";
import type { ProfileData } from "../../adapter/types";
import { Card } from "../components";

interface Props {
  /** Free-text target role string, e.g. "Senior Product Manager". */
  targetRole: string;
  /** Live profile data scraped from LinkedIn. */
  profile: ProfileData | null;
  /** Optional pasted JD that augments the AND clause. */
  jobDescription?: string;
  /**
   * Compact = free anon view. Removes the per-section gap list and
   * shrinks padding. Default = full-width signed-in My Profile card.
   */
  compact?: boolean;
  /** Telemetry surface label so we can split metrics by mount point. */
  source: "myprofile" | "anon_breakdown" | "match_tab";
}

const SECTION_LABEL: Record<BooleanSection, string> = {
  headline: "Headline",
  about: "About",
  experience: "Experience",
  skills: "Skills",
};

/**
 * Recruiter Boolean simulation card.
 *
 * Shows the actual Boolean string a recruiter would paste into LinkedIn
 * Recruiter for the user's target role, plus a binary verdict on
 * whether their profile would surface, plus the missing terms broken
 * down by section so the user can fix the right things.
 *
 * No LLM, no network — the result is computed entirely client-side
 * from `buildRecruiterBoolean`. Re-renders cheaply when the profile or
 * target role changes.
 */
export function RecruiterBooleanCard({
  targetRole,
  profile,
  jobDescription,
  compact = false,
}: Props) {
  const result = useMemo<BooleanResult | null>(() => {
    if (!profile) return null;
    if (!targetRole.trim()) return null;
    return buildRecruiterBoolean({
      targetRole,
      profile,
      jobDescription: jobDescription?.trim() || undefined,
    });
  }, [profile, targetRole, jobDescription]);

  if (!result) {
    if (!targetRole.trim()) {
      return (
        <Card padded={compact ? "sm" : "md"}>
          <div className="flex items-start gap-3">
            <div
              aria-hidden="true"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-md"
              style={{
                background: "var(--rz-info-bg)",
                color: "var(--rz-info-solid)",
              }}
            >
              <Search className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p
                className="text-[14px] font-semibold leading-snug"
                style={{ color: "var(--rz-text)" }}
              >
                Add a target role to see the recruiter Boolean
              </p>
              <p
                className="mt-1 text-[12.5px] leading-snug"
                style={{ color: "var(--rz-text-2)" }}
              >
                Paste a job description in Job Match (or set your headline) and
                we'll show the exact search a recruiter would run for your role.
              </p>
            </div>
          </div>
        </Card>
      );
    }
    return null;
  }

  return <ResultCard result={result} compact={compact} />;
}

function ResultCard({
  result,
  compact,
}: {
  result: BooleanResult;
  compact: boolean;
}) {
  const wouldSurface = result.verdict.wouldSurface;
  const tone = wouldSurface ? "good" : "critical";
  const showActionRow = compact || (!wouldSurface && result.verdict.missingTermCount > 0);

  return (
    <Card padded={compact ? "sm" : "md"} className="rz-pop-in" data-priority-tone={tone}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p
            className="text-[14.5px] font-extrabold leading-snug"
            style={{ color: "var(--rz-text)" }}
          >
            {wouldSurface
              ? "Your profile would surface for this search."
              : "Recruiters running similar search would skip you."}
          </p>
        </div>
      </div>

      {/* Boolean query block */}
      <pre
        className="mt-3 overflow-x-auto rounded-md p-2.5 text-[12.5px] leading-snug"
        style={{
          background: "var(--rz-card-bg-alt)",
          border: "1px solid var(--rz-border)",
          color: "var(--rz-text)",
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
        aria-label="Recruiter Boolean search"
      >
        {result.query || "(no query — add a target role)"}
      </pre>

      {/* Verdict reason */}
      <p
        className="mt-2 text-[12.5px] leading-snug"
        style={{ color: "var(--rz-text-2)" }}
      >
        {result.verdict.reason}
      </p>

      {showActionRow ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {compact ? (
            <span
              className="text-[12.5px] font-extrabold"
              style={{ color: "var(--rz-primary)" }}
            >
              Sign in to unlock
            </span>
          ) : null}
          {!wouldSurface && result.verdict.missingTermCount > 0 ? (
            <span
              className="ml-auto inline-flex items-center gap-1 text-[12px] font-semibold"
              style={{ color: "var(--rz-critical-text)" }}
            >
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              {result.verdict.missingTermCount} missing term
              {result.verdict.missingTermCount === 1 ? "" : "s"}
            </span>
          ) : null}
        </div>
      ) : null}

      {/* Per-section gap list */}
      {!compact && result.missingBySection.length > 0 ? (
        <div
          className="mt-3 rounded-md p-3"
          style={{
            background: "var(--rz-card-bg-alt)",
            border: "1px solid var(--rz-border)",
          }}
        >
          <p
            className="text-[10.5px] font-extrabold uppercase tracking-[0.08em]"
            style={{ color: "var(--rz-text-3)" }}
          >
            Missing terms by section
          </p>
          <ul className="mt-2 space-y-1.5">
            {result.missingBySection.map((gap) => (
              <li
                key={gap.section}
                className="flex items-baseline gap-2 text-[13px] leading-snug"
              >
                <span
                  className="inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[11px] font-bold"
                  style={{
                    background: "var(--rz-critical-bg)",
                    color: "var(--rz-critical-text)",
                    border: "1px solid var(--rz-critical-border)",
                  }}
                >
                  {SECTION_LABEL[gap.section]}
                </span>
                <span style={{ color: "var(--rz-text-2)" }}>
                  {gap.terms.slice(0, 6).join(", ")}
                  {gap.terms.length > 6 ? `, +${gap.terms.length - 6} more` : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Card>
  );
}

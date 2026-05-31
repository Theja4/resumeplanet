import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Sparkles, Wand2 } from "lucide-react";

import { categorySeverity, type Severity } from "../../scoring/severity";
import { ScoreHero } from "../ScoreHero";
import { SectionRow } from "./SectionRow";
import { UpgradeCard } from "./UpgradeCard";
import { Button, Card } from "../components";
import { RecruiterBooleanCard } from "../RecruiterBoolean/RecruiterBooleanCard";
import { track } from "../../telemetry/events";
import { buildRecruiterBoolean } from "../../recruiter/boolean";
import type { ScoreResult, CategoryScore } from "../../scoring/types";
import type { ProfileData } from "../../adapter/types";
import type { MeResponse } from "../../auth/api";

interface Props {
  score: ScoreResult;
  profile: ProfileData | null;
  me: MeResponse | null;
  targetJobDescription: string;
  targetRole: string;
}

const SEVERITY_ORDER: Record<Severity, number> = {
  critical: 0,
  warning: 1,
  good: 2,
};

/**
 * Single-page profile view — replaces the old Overview/Fixes/Rewrites
 * trio. Order:
 *   1. ScoreHero — score + severity legend
 *   2. Section list — one row per category, sorted by severity
 *   3. UpgradeCard — only shown when a free user clicks an AI rewrite
 */
export function MyProfileView({
  score,
  profile,
  me,
  targetJobDescription,
  targetRole,
}: Props) {
  const isFree = me?.plan !== "pro";

  const [showUpgrade, setShowUpgrade] = useState(false);
  const upgradeRef = useRef<HTMLDivElement | null>(null);

  // Sort categories: critical first, then warning, then good. Within
  // each bucket, lowest ratio first so the most-broken section bubbles up.
  const orderedCategories = useMemo<
    Array<{ category: CategoryScore; severity: Severity }>
  >(() => {
    const enriched = score.categories.map((category) => ({
      category,
      severity: categorySeverity(category),
    }));
    return enriched.sort((a, b) => {
      const so = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
      if (so !== 0) return so;
      const ra = a.category.max > 0 ? a.category.points / a.category.max : 1;
      const rb = b.category.max > 0 ? b.category.points / b.category.max : 1;
      return ra - rb;
    });
  }, [score.categories]);

  const onUpgrade = useCallback(() => {
    setShowUpgrade(true);
    requestAnimationFrame(() => {
      upgradeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const failingCount = score.checks.filter(
    (c) => c.status === "fail" || c.status === "warn",
  ).length;

  return (
    <div className="rz-fade-in">
      <ScoreHero score={score} isFree={isFree} />

      {isFree && failingCount > 0 ? (
        <div className="mx-4 mb-3">
          <FixAllWithAiCta failingCount={failingCount} />
        </div>
      ) : null}

      <div className="px-4">
        <p className="rz-eyebrow mb-3">Sections</p>
        <div className="space-y-3">
          {orderedCategories.map(({ category, severity }) => {
            const failingChecks = score.checks.filter(
              (c) =>
                c.category === category.id &&
                (c.status === "fail" || c.status === "warn" || c.status === "absent"),
            );
            const passingChecks = score.checks.filter(
              (c) =>
                c.category === category.id &&
                (c.status === "pass" || c.status === "unread"),
            );
            return (
              <SectionRow
                key={category.id}
                category={category}
                severity={severity}
                failingChecks={failingChecks}
                passingChecks={passingChecks}
                profile={profile}
                me={me}
                targetRole={targetRole}
                targetJobDescription={targetJobDescription}
                isFree={isFree}
                onRequestUpgrade={onUpgrade}
              />
            );
          })}
        </div>

        {/* Recruiter Boolean simulation — anti-vanity-score signal */}
        {targetRole.trim() ? (
          <div className="mt-4">
            <p className="rz-eyebrow mb-2.5">Recruiter Search Simulation</p>
            <RecruiterBooleanShownTracker
              profile={profile}
              targetRole={targetRole}
              jobDescription={targetJobDescription}
              source="myprofile"
            />
            <RecruiterBooleanCard
              targetRole={targetRole}
              profile={profile}
              jobDescription={targetJobDescription}
              source="myprofile"
            />
          </div>
        ) : null}

        {showUpgrade ? (
          <div ref={upgradeRef} className="mt-4">
            <UpgradeCard
              source="myprofile_inline"
              onDismiss={() => setShowUpgrade(false)}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Persistent Pro upgrade hook shown to free signed-in users between
 * the ScoreHero and the section list. Frames upgrade as "fix all in
 * one click" rather than a generic plan upsell.
 */
function FixAllWithAiCta({ failingCount }: { failingCount: number }) {
  const href = `https://rezoomed.com/pricing?ref=ext_${encodeURIComponent("myprofile_fix_all")}`;
  const handleClick = () =>
    void track({ name: "pro_cta_clicked", props: { section: "myprofile_fix_all" } });

  return (
    <Card padded="md" className="rz-fix-all-cta rz-sheen rz-pop-in" tone="default">
      <div className="relative z-[1] flex items-center gap-3">
        <div
          className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px]"
          style={{
            background:
              "linear-gradient(135deg, #14c473 0%, #36d585 100%)",
            color: "#ffffff",
            boxShadow:
              "0 6px 14px -6px rgba(20, 168, 90, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.32)",
          }}
          aria-hidden="true"
        >
          <Wand2 className="h-[20px] w-[20px]" />
        </div>
        <div className="min-w-0 flex-1">
          <p
            className="text-[15px] font-bold leading-tight tracking-[-0.012em]"
            style={{ color: "var(--rz-text)" }}
          >
            Fix all {failingCount} {failingCount === 1 ? "issue" : "issues"} with AI
          </p>
          <p
            className="mt-0.5 text-[12.5px] leading-snug"
            style={{ color: "var(--rz-text-2)" }}
          >
            One click rewrites for headline, About, experience &amp; skills.
          </p>
        </div>
      </div>
      <div className="relative z-[1] mt-3">
        <Button
          href={href}
          variant="primary"
          size="md"
          onClick={handleClick}
          icon={<Sparkles className="h-4 w-4" aria-hidden="true" />}
          trailingIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
          className="rz-btn-rewrite rz-sheen"
          block
        >
          Upgrade to Pro
        </Button>
      </div>
    </Card>
  );
}


/**
 * Side-effect-only helper: fires `recruiter_boolean_shown` once when the
 * Boolean card mounts (or when the inputs that materially change the
 * verdict change). Co-located with MyProfileView because the card
 * itself is presentational and shouldn't fire telemetry on every
 * re-render — only on a meaningful state change.
 */
function RecruiterBooleanShownTracker({
  profile,
  targetRole,
  jobDescription,
  source,
}: {
  profile: ProfileData | null;
  targetRole: string;
  jobDescription?: string;
  source: "myprofile" | "anon_breakdown" | "match_tab";
}) {
  // Build a coarse signature so we don't fire on every keystroke in the
  // JD textarea. Verdict + missing count + role label is enough.
  const signature = useMemo(() => {
    if (!profile || !targetRole.trim()) return null;
    try {
      const result = buildRecruiterBoolean({
        targetRole,
        profile,
        jobDescription: jobDescription?.trim() || undefined,
      });
      return {
        would_surface: result.verdict.wouldSurface,
        role_label: result.roleLabel,
        resolved_from_taxonomy: result.resolvedFromTaxonomy,
        missing_term_count: result.verdict.missingTermCount,
      };
    } catch {
      return null;
    }
  }, [profile, targetRole, jobDescription]);

  useEffect(() => {
    if (!signature) return;
    void track({
      name: "recruiter_boolean_shown",
      props: { source, ...signature },
    });
  }, [signature, source]);

  return null;
}

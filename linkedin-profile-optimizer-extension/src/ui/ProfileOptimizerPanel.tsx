import { Eye, EyeOff, Flame, LogIn, TrendingDown } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { loadConfig } from "../adapter/config";
import { isExtensionContextValid } from "../adapter/ext-context";
import { extractProfileData } from "../adapter/profile-adapter";
import type { ProfileData, ProfileField } from "../adapter/types";
import { scoreProfile } from "../scoring/score";
import type { ScoreResult } from "../scoring/types";
import { postScan } from "../auth/api";
import { track } from "../telemetry/events";

import { ThemeProvider, readCachedTheme } from "./theme/useTheme";
import { Badge, Button, Card, SeverityDot, Tabs, type TabDef } from "./components";
import { GatingProvider, SignInPrompt, useSignInAction } from "./Gating";
import { OnboardingTour } from "./OnboardingTour";
import { ScoreHero } from "./ScoreHero";
import { ScanningSkeleton } from "./atoms";
import { SidebarShell } from "./SidebarShell";
import { MyProfileView } from "./MyProfile/MyProfileView";
import { MatchTab } from "./tabs/MatchTab";
import { RecruiterBooleanCard } from "./RecruiterBoolean/RecruiterBooleanCard";

type TabId = "profile" | "match";

const LAST_SCAN_KEY = "rezoomed.lastScan.v1";

export function ProfileOptimizerPanel() {
  const [themeTarget, setThemeTarget] = useState<HTMLElement | null>(null);
  const captureThemeTarget = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const root =
      node.parentElement instanceof HTMLElement &&
      node.parentElement.id === "rezoomed-root"
        ? node.parentElement
        : node;
    root.setAttribute("data-theme", readCachedTheme());
    setThemeTarget(root);
  }, []);

  return (
    <div
      ref={captureThemeTarget}
      data-rezoomed-theme-target
    >
      {themeTarget ? (
        <ThemeProvider applyTo={themeTarget} initialTheme={readCachedTheme()}>
          <PanelInner />
        </ThemeProvider>
      ) : null}
    </div>
  );
}

// Fields reported in the extraction_health telemetry event. customUrl
// and openToWork are intentionally excluded — customUrl depends on the
// URL slug (not DOM), openToWork is rare and noisy.
const HEALTH_TRACKED_FIELDS: ProfileField[] = [
  "headline",
  "about",
  "experience",
  "skills",
  "education",
  "hasPhoto",
  "hasBanner",
  "recommendationsCount",
];

function fieldReadFlag(profile: ProfileData, field: ProfileField): 0 | 1 {
  const v = profile[field];
  if (!v || v.unread) return 0;
  if (v.value === undefined || v.value === null || v.value === "") return 0;
  if (Array.isArray(v.value) && v.value.length === 0) return 0;
  return 1;
}

function PanelInner() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [targetJobDescription, setTargetJobDescription] = useState("");
  const [scanning, setScanning] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const latestProfileRef = useRef<ProfileData | null>(null);
  const latestConfigVersionRef = useRef<string>("unknown");
  const healthReportedRef = useRef(false);

  const rescan = useCallback(async () => {
    if (!isExtensionContextValid()) return;
    setScanning(true);
    const startedAt = performance.now();
    try {
      const config = await loadConfig();
      latestConfigVersionRef.current = config.version;
      const next = extractProfileData(document, config);
      latestProfileRef.current = next;
      setProfile(next);
      void track({
        name: "scan_run",
        props: {
          profileUrl: window.location.href,
          durationMs: Math.round(performance.now() - startedAt),
        },
      });
    } finally {
      setScanning(false);
    }
  }, []);

  useEffect(() => {
    void rescan();
    const timers = [800, 2000, 4000, 7500, 12000, 18000].map((delay) =>
      window.setTimeout(() => void rescan(), delay),
    );
    // Fire the breakage telemetry once per session, after the late
    // re-scans have had time to settle. We use the latest profile state
    // captured by the ref so we report the final outcome, not whichever
    // intermediate snapshot was visible to React when this timer was
    // armed.
    const healthTimer = window.setTimeout(() => {
      if (healthReportedRef.current) return;
      const latest = latestProfileRef.current;
      if (!latest) return;
      healthReportedRef.current = true;
      const flags = HEALTH_TRACKED_FIELDS.map((f) => fieldReadFlag(latest, f));
      const fieldsRead = flags.reduce<number>((a, b) => a + b, 0);
      const [
        headline_read,
        about_read,
        experience_read,
        skills_read,
        education_read,
        hasPhoto_read,
        hasBanner_read,
        recommendationsCount_read,
      ] = flags;
      void track({
        name: "extraction_health",
        props: {
          configVersion: latestConfigVersionRef.current,
          fieldsRead,
          fieldsTotal: HEALTH_TRACKED_FIELDS.length,
          headline_read,
          about_read,
          experience_read,
          skills_read,
          education_read,
          hasPhoto_read,
          hasBanner_read,
          recommendationsCount_read,
        },
      });
      if (fieldsRead === 0) {
        void track({
          name: "extraction_empty",
          props: {
            configVersion: latestConfigVersionRef.current,
            profileUrl: window.location.href,
          },
        });
      }
    }, 20000);
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      window.clearTimeout(healthTimer);
    };
  }, [rescan]);

  useEffect(() => {
    const main = document.querySelector("main");
    if (!main) return undefined;

    let debounceTimer: number | undefined;
    const observer = new MutationObserver(() => {
      if (!isExtensionContextValid()) {
        observer.disconnect();
        if (debounceTimer) window.clearTimeout(debounceTimer);
        return;
      }
      if (debounceTimer) window.clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(() => void rescan(), 900);
    });
    observer.observe(main, { childList: true, subtree: true });
    const stopTimer = window.setTimeout(() => observer.disconnect(), 30000);

    return () => {
      if (debounceTimer) window.clearTimeout(debounceTimer);
      window.clearTimeout(stopTimer);
      observer.disconnect();
    };
  }, [rescan]);

  const score = useMemo(
    () => (profile ? scoreProfile(profile, { targetJobDescription }) : null),
    [profile, targetJobDescription],
  );

  return (
    <GatingProvider>
      {({ status, me }) => {
        const authed = status === "authed";
        const isPro = authed && me?.plan === "pro";
        const tabs: TabDef<TabId>[] = [
          {
            id: "profile",
            label: "My Profile",
          },
          {
            id: "match",
            label: "Job Match",
            badge: targetJobDescription.trim().length > 20 ? "JD" : null,
          },
        ];
        return (
          <SidebarShell
            scoreBadge={score?.total ?? null}
            scanning={scanning}
            onRescan={() => void rescan()}
            headerMeta={
              isPro ? (
                <Badge tone="pro">Pro</Badge>
              ) : null
            }
            bottomNav={
              score && authed ? (
                <Tabs<TabId>
                  tabs={tabs}
                  active={activeTab}
                  onChange={setActiveTab}
                  ariaLabel="Profile sections"
                />
              ) : null
            }
          >
            {!score ? (
              <ScanningSkeleton />
            ) : !authed ? (
              <AnonView score={score} profile={profile} />
            ) : (
              <>
                <PersistScanEffect authed={authed} score={score} />
                {activeTab === "profile" && (
                  <MyProfileView
                    score={score}
                    profile={profile}
                    me={me}
                    targetJobDescription={targetJobDescription}
                    targetRole={extractTargetRole(profile, targetJobDescription)}
                  />
                )}
                {activeTab === "match" && (
                  <MatchTab
                    profile={profile}
                    me={me}
                    targetJobDescription={targetJobDescription}
                    setTargetJobDescription={setTargetJobDescription}
                  />
                )}
                <OnboardingTour />
              </>
            )}
          </SidebarShell>
        );
      }}
    </GatingProvider>
  );
}

function PersistScanEffect({ authed, score }: { authed: boolean; score: ScoreResult }) {
  useEffect(() => {
    void track({
      name: "score_shown",
      props: {
        score: score.total,
        readableChecks: score.checks.filter((c) => c.status !== "unread").length,
        authed,
      },
    });
    if (authed) {
      void postScan({
        profileUrl: window.location.href,
        score: score.total,
        sections: score.categories,
      }).catch(() => undefined);
    }
    // Mirror to chrome.storage so the popup can show "last scanned" stat.
    try {
      chrome?.storage?.local?.set?.({
        [LAST_SCAN_KEY]: {
          score: score.total,
          ts: Date.now(),
          url: window.location.href,
        },
      });
    } catch {
      /* ignore */
    }
  }, [authed, score]);
  return null;
}

/** Top-tier benchmark — recruiter "All-Star" cutoff used for the
 *  "you're N points behind hires" framing. Soft anchor, no fake stats. */
const RECRUITER_TIER_BENCHMARK = 88;

function AnonView({
  score,
  profile,
}: {
  score: ScoreResult;
  profile: ProfileData | null;
}) {
  const failing = score.checks
    .filter((c) => c.status === "fail" || c.status === "warn")
    .sort((a, b) => a.points / a.max - b.points / b.max);
  const topIssues = failing.slice(0, 2);
  const lockedIssueCount = Math.max(0, failing.length - topIssues.length);
  const gapToTier = Math.max(0, RECRUITER_TIER_BENCHMARK - score.total);
  const targetRole = extractTargetRole(profile, "");
  const role = compactRole(targetRole);
  const rolePhrase = role ? ` ${role}` : "";
  const [expandedIssueId, setExpandedIssueId] = useState<string | null>(null);
  const signIn = useSignInAction({ surface: "panel" });

  const title =
    score.total < 50
      ? "Recruiters are skipping you."
      : score.total < RECRUITER_TIER_BENCHMARK
        ? `Don't ship your${rolePhrase} profile broken.`
        : `Lock in your${rolePhrase} lead.`;
  const body =
    score.total < RECRUITER_TIER_BENCHMARK
      ? `Unlock all ${failing.length} fixes + AI rewrites. Close the ${gapToTier}-pt gap to recruiter tier.`
      : `Unlock all ${failing.length} fixes + AI rewrites before rivals close the gap.`;

  return (
    <div className="rz-fade-in px-5 pt-3">
      <ScoreHero score={score} isFree={true} />
      <RecruiterStakesBanner total={score.total} gapToTier={gapToTier} role={role} />

      <div className="mt-3">
        <SignInPrompt
          body={body}
          surface="panel"
          title={title}
          cta="Sign in to unlock"
          compact
        />
      </div>

      <div className="mb-2 mt-4 flex items-center justify-between gap-2">
        <p className="rz-eyebrow">
          What's costing you {gapToTier > 0 ? `${gapToTier} pts` : "ranking"}
        </p>
      </div>
      <div className="space-y-2.5">
        {topIssues.map((check, index) => (
          <IssuePreviewCard
            key={check.id}
            id={check.id}
            index={index}
            label={check.label}
            severity={check.status === "fail" ? "critical" : "warning"}
            tip={check.tip}
            expanded={expandedIssueId === check.id}
            onExpand={() => setExpandedIssueId(check.id)}
            onSignIn={signIn.handleClick}
            signInBusy={signIn.busy}
            signInError={signIn.error}
          />
        ))}
        <HiddenIssuesNotice count={lockedIssueCount} />
      </div>

      {/* Recruiter Boolean simulation — anti-vanity-score signal.
          Free users see the same Boolean a recruiter would run after
          the issue preview, but the copy action stays locked. */}
      {targetRole.trim() ? (
        <div className="mt-3">
          <RecruiterBooleanCard
            targetRole={targetRole}
            profile={profile}
            source="anon_breakdown"
            compact
          />
        </div>
      ) : null}
    </div>
  );
}

function RecruiterStakesBanner({
  total,
  gapToTier,
  role,
}: {
  total: number;
  gapToTier: number;
  role?: string;
}) {
  const tier: "danger" | "warning" | "good" =
    total < 50 ? "danger" : total < RECRUITER_TIER_BENCHMARK ? "warning" : "good";
  const palette =
    tier === "danger"
      ? {
          bg: "var(--rz-critical-bg)",
          border: "var(--rz-critical-border)",
          text: "var(--rz-critical-text)",
          solid: "var(--rz-critical-solid)",
        }
      : tier === "warning"
        ? {
            bg: "var(--rz-warning-bg)",
            border: "var(--rz-warning-border)",
            text: "var(--rz-warning-text)",
            solid: "var(--rz-warning-solid)",
          }
        : {
            bg: "var(--rz-good-bg)",
            border: "var(--rz-good-border)",
            text: "var(--rz-good-text)",
            solid: "var(--rz-good-solid)",
          };

  const headline =
    tier === "danger"
      ? "Recruiters won't surface you."
      : tier === "warning"
        ? "Below the recruiter cutoff."
        : "Rivals are catching up.";

  const Icon = tier === "danger" ? Flame : tier === "warning" ? TrendingDown : Eye;

  return (
    <div
      className="mt-2 rz-pop-in flex items-center gap-2.5 rounded-[12px] border px-3 py-2.5"
      style={{
        background: palette.bg,
        borderColor: palette.border,
      }}
      role="status"
    >
      <div
        className="grid h-8 w-8 shrink-0 place-items-center rounded-[8px]"
        style={{
          background: "rgba(255, 255, 255, 0.55)",
          color: palette.solid,
          border: `1px solid ${palette.border}`,
        }}
        aria-hidden="true"
      >
        <Icon className="h-[17px] w-[17px]" />
      </div>
      <div className="min-w-0 flex-1">
        <p
          className="text-[14px] font-extrabold leading-tight"
          style={{ color: palette.text }}
        >
          {headline}
        </p>
      </div>
    </div>
  );
}

function IssuePreviewCard({
  id,
  index,
  label,
  severity,
  tip,
  expanded,
  onExpand,
  onSignIn,
  signInBusy,
  signInError,
}: {
  id: string;
  index: number;
  label: string;
  severity: "critical" | "warning";
  tip: string;
  expanded: boolean;
  onExpand: () => void;
  onSignIn: () => void;
  signInBusy: boolean;
  signInError: string | null;
}) {
  const isCritical = severity === "critical";
  return (
    <Card
      padded="sm"
      className="rz-issue-card rz-pop-in"
      data-priority-tone={severity}
      onClick={expanded ? undefined : onExpand}
      as={expanded ? "div" : "button"}
      aria-expanded={expanded}
      aria-controls={`rz-issue-unlock-${id}`}
      ariaLabel={`Unlock fix for ${label}`}
    >
      <div className="relative z-[1] flex items-start gap-3">
        <div
          className="grid h-8 w-8 shrink-0 place-items-center rounded-[8px] text-[15px] font-extrabold leading-none rz-num"
          style={{
            background: isCritical
              ? "color-mix(in srgb, var(--rz-critical-solid) 14%, var(--rz-card-bg))"
              : "color-mix(in srgb, var(--rz-warning-solid) 14%, var(--rz-card-bg))",
            color: isCritical ? "var(--rz-critical-solid)" : "var(--rz-warning-solid)",
            border: isCritical
              ? "1px solid color-mix(in srgb, var(--rz-critical-solid) 34%, var(--rz-border))"
              : "1px solid color-mix(in srgb, var(--rz-warning-solid) 34%, var(--rz-border))",
            boxShadow: isCritical
              ? "inset 0 1px 0 rgba(255, 255, 255, 0.10), 0 8px 18px -14px var(--rz-critical-solid)"
              : "inset 0 1px 0 rgba(255, 255, 255, 0.10), 0 8px 18px -14px var(--rz-warning-solid)",
          }}
          aria-hidden="true"
        >
          !
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <SeverityDot severity={severity} size="xs" />
            <span
              className="text-[10.5px] font-extrabold uppercase tracking-[0.08em]"
              style={{ color: isCritical ? "var(--rz-critical-text)" : "var(--rz-warning-text)" }}
            >
              {isCritical ? "Red flag" : "Ranking flag"} #{index + 1}
            </span>
          </div>
          <p
            className="mt-0.5 text-[14.5px] font-extrabold leading-snug"
            style={{ color: "var(--rz-text)" }}
          >
            {label}
          </p>
          <p
            className="mt-0.5 text-[13px] leading-snug"
            style={{ color: "var(--rz-text-2)" }}
          >
            {tip}
          </p>
          {expanded ? (
            <div
              id={`rz-issue-unlock-${id}`}
              className="mt-3 rounded-[8px] px-3 py-2.5"
              style={{
                background: "var(--rz-card-bg)",
                border: "1px solid var(--rz-border)",
              }}
            >
              <p
                className="text-[12.5px] font-semibold leading-snug"
                style={{ color: "var(--rz-text-2)" }}
              >
                Sign in to unlock the exact fix and AI rewrite for this issue.
              </p>
              <div className="mt-2.5">
                <Button
                  variant="primary"
                  size="md"
                  onClick={onSignIn}
                  loading={signInBusy}
                  icon={<LogIn className="h-4 w-4" aria-hidden="true" />}
                  className="rz-btn-hero rz-btn-auth rz-sheen"
                  block
                >
                  {signInBusy ? "Opening Rezoomed…" : "Sign in to unlock"}
                </Button>
              </div>
              {signInError ? (
                <p
                  className="mt-2 text-[12px] leading-snug"
                  style={{ color: "var(--rz-critical-text)" }}
                >
                  Couldn't complete sign-in ({signInError}).
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

function HiddenIssuesNotice({ count }: { count: number }) {
  if (count <= 0) return null;

  return (
    <div className="flex justify-end">
      <span
        className="inline-flex items-center gap-1 rounded-[6px] px-1.5 py-0.5 text-[11px] font-extrabold uppercase tracking-[0.06em]"
        style={{
          background: "var(--rz-critical-bg)",
          color: "var(--rz-critical-text)",
          border: "1px solid var(--rz-critical-border)",
        }}
      >
        <EyeOff className="h-3 w-3" aria-hidden="true" />
        +{count} hidden
      </span>
    </div>
  );
}

/**
 * Trim a free-text role string for inline display in banner/CTA copy.
 * "Senior Software Engineer at Anthropic — building agents" → "Senior Software Engineer".
 * Returns "" when no meaningful role can be carved out so callers can
 * fall back to neutral phrasing.
 */
function compactRole(role: string): string {
  if (!role) return "";
  const head = role
    .split(/\s+(?:at|@|—|–|-|·|,|\|)\s+/i)[0]
    ?.trim() ?? "";
  if (!head) return "";
  const words = head.split(/\s+/).slice(0, 4).join(" ");
  return words.length > 32 ? words.slice(0, 30).trimEnd() + "…" : words;
}

function extractTargetRole(profile: ProfileData | null, targetJobDescription: string): string {
  const jdLine = targetJobDescription.split("\n").find((l) => l.trim().length >= 4);
  if (jdLine) return jdLine.trim().slice(0, 200);
  const headline = profile?.headline?.value?.trim();
  if (headline) return headline.slice(0, 200);
  const latestRole = profile?.experience?.value?.[0]?.title?.value?.trim();
  if (latestRole) return latestRole.slice(0, 200);
  return "";
}

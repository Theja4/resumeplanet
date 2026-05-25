import { CheckCircle2, LayoutGrid, ListChecks, Sparkles, Target } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { loadConfig } from "../adapter/config";
import { getDebugTrace } from "../adapter/debug";
import { isExtensionContextValid } from "../adapter/ext-context";
import { extractProfileData } from "../adapter/profile-adapter";
import type { ProfileData } from "../adapter/types";
import { scoreProfile } from "../scoring/score";
import type { ScoreResult } from "../scoring/types";
import { postScan } from "../auth/api";
import { track } from "../telemetry/events";
import { GatingProvider, SignInPrompt } from "./Gating";
import { OnboardingTour } from "./OnboardingTour";
import { ScoreHero } from "./ScoreHero";
import { ScanningSkeleton, SectionLabel } from "./atoms";
import { SidebarShell } from "./SidebarShell";
import { TabNav, type TabDef } from "./TabNav";
import { OverviewTab } from "./tabs/OverviewTab";
import { FixesTab } from "./tabs/FixesTab";
import { RewritesTab } from "./tabs/RewritesTab";
import { MatchTab } from "./tabs/MatchTab";

type TabId = "overview" | "fixes" | "rewrites" | "match";

export function ProfileOptimizerPanel() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [targetJobDescription, setTargetJobDescription] = useState("");
  const [scanning, setScanning] = useState(false);
  const [debugOpen, setDebugOpen] = useState(false);
  const [debugTrace, setDebugTrace] = useState("");
  const [debugCopied, setDebugCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const rescan = useCallback(async () => {
    if (!isExtensionContextValid()) return;
    setScanning(true);
    const startedAt = performance.now();
    try {
      const config = await loadConfig();
      setProfile(extractProfileData(document, config));
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
    return () => timers.forEach((t) => window.clearTimeout(t));
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
        return (
          <SidebarShell
            scoreBadge={score?.total ?? null}
            scanning={scanning}
            debugOpen={debugOpen}
            onRescan={() => void rescan()}
            onToggleDebug={() => {
              setDebugTrace(getDebugTrace());
              setDebugCopied(false);
              setDebugOpen((o) => !o);
            }}
            headerMeta={
              authed && me?.plan === "pro" ? (
                <span
                  className="hidden sm:inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                  style={{
                    background: "var(--rz-gradient)",
                    color: "var(--rz-on-primary)",
                  }}
                >
                  <Sparkles className="h-2.5 w-2.5" />
                  Pro
                </span>
              ) : null
            }
            sticky={
              score ? (
                <ScoreHero
                  value={score.total}
                  earned={score.earnedPoints}
                  available={score.availablePoints}
                />
              ) : null
            }
            bottomNav={
              score && authed ? (
                <TabNav<TabId>
                  tabs={buildTabs(score)}
                  active={activeTab}
                  onChange={setActiveTab}
                />
              ) : null
            }
          >
            {debugOpen ? (
              <DebugPanel
                trace={debugTrace}
                copied={debugCopied}
                onRefresh={() => {
                  setDebugTrace(getDebugTrace());
                  setDebugCopied(false);
                }}
                onCopy={async () => {
                  try {
                    await navigator.clipboard.writeText(debugTrace || "(empty)");
                    setDebugCopied(true);
                    window.setTimeout(() => setDebugCopied(false), 1500);
                  } catch {
                    /* ignore */
                  }
                }}
              />
            ) : null}

            {!score ? (
              <ScanningSkeleton />
            ) : !authed ? (
              <AnonView score={score} />
            ) : (
              <>
                <PersistScanEffect authed={authed} score={score} />
                {activeTab === "overview" && (
                  <OverviewTab score={score} onJumpToFixes={() => setActiveTab("fixes")} />
                )}
                {activeTab === "fixes" && (
                  <FixesTab
                    score={score}
                    profile={profile}
                    me={me}
                    targetJobDescription={targetJobDescription}
                    targetRole={extractTargetRole(profile, targetJobDescription)}
                    rescan={() => void rescan()}
                  />
                )}
                {activeTab === "rewrites" && (
                  <RewritesTab
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

function buildTabs(score: ScoreResult): TabDef<TabId>[] {
  const issueCount = score.checks.filter(
    (c) => c.status === "fail" || c.status === "warn",
  ).length;
  return [
    { id: "overview", label: "Overview", icon: <LayoutGrid className="h-3.5 w-3.5" /> },
    { id: "fixes", label: "Fixes", icon: <ListChecks className="h-3.5 w-3.5" />, badge: issueCount || null },
    { id: "rewrites", label: "Rewrites", icon: <Sparkles className="h-3.5 w-3.5" /> },
    { id: "match", label: "Match", icon: <Target className="h-3.5 w-3.5" /> },
  ];
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
  }, [authed, score]);
  return null;
}

function AnonView({ score }: { score: ScoreResult }) {
  const topIssues = score.checks
    .filter((c) => c.status === "fail" || c.status === "warn")
    .sort((a, b) => a.points / a.max - b.points / b.max)
    .slice(0, 2);

  return (
    <div className="rz-fade-in">
      <SectionLabel>Top 2 issues (free preview)</SectionLabel>
      <div className="space-y-2">
        {topIssues.map((check) => (
          <article
            key={check.id}
            className="rounded-xl p-3"
            style={{
              background: "var(--rz-surface)",
              border: "1px solid var(--rz-border)",
              boxShadow: "var(--rz-shadow-card)",
            }}
          >
            <p className="text-[13px] font-semibold leading-snug">{check.label}</p>
            <p
              className="mt-1 text-xs leading-snug"
              style={{ color: "var(--rz-on-surface-2)" }}
            >
              {check.tip}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-4">
        <SignInPrompt
          body="See the full section-by-section breakdown, resume↔LinkedIn consistency checks, and per-section AI fixes."
          surface="panel"
          title="Unlock the full breakdown"
        />
      </div>
    </div>
  );
}

function DebugPanel({
  trace,
  copied,
  onRefresh,
  onCopy,
}: {
  trace: string;
  copied: boolean;
  onRefresh: () => void;
  onCopy: () => void | Promise<void>;
}) {
  return (
    <section
      className="mb-3 rounded-xl p-3"
      style={{
        background: "var(--rz-warn-soft)",
        border: "1px solid var(--rz-border)",
      }}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--rz-warn)" }}>
          Parser debug trace
        </p>
        <div className="flex gap-1.5">
          <button
            className="rounded-md px-2 py-1 text-[11px] font-semibold"
            style={{ background: "var(--rz-surface)", color: "var(--rz-warn)", border: "1px solid var(--rz-border)" }}
            onClick={onRefresh}
            type="button"
          >
            Refresh
          </button>
          <button
            className="rounded-md px-2 py-1 text-[11px] font-semibold inline-flex items-center gap-1"
            style={{ background: "var(--rz-surface)", color: "var(--rz-warn)", border: "1px solid var(--rz-border)" }}
            onClick={() => void onCopy()}
            type="button"
          >
            {copied ? <CheckCircle2 className="h-3 w-3" /> : null}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
      <textarea
        className="block h-40 w-full resize-y rounded-md p-2 font-mono text-[11px] leading-snug outline-none"
        style={{
          background: "var(--rz-surface)",
          border: "1px solid var(--rz-border)",
          color: "var(--rz-on-surface)",
        }}
        readOnly
        value={trace || "(empty — click re-scan, then re-open this panel)"}
      />
    </section>
  );
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

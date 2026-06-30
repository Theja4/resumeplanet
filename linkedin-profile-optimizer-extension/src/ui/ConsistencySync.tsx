import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  FileText,
  Lock,
  RefreshCw,
  Sparkles,
  Upload,
  Wand2,
} from "lucide-react";

import {
  HttpError,
  postSyncFromResume,
  type GeneratorType,
  type MeResponse,
  type SyncFromResumeSection,
} from "../auth/api";
import type { ProfileData } from "../adapter/types";
import { track } from "../telemetry/events";
import { Badge, Button, Card } from "./components";
import { ProCta } from "./Gating";
import { deepLinkFor } from "./linkedinDeepLinks";
import { serializeExperienceForPrompt } from "./serializeExperience";

interface Props {
  me: MeResponse | null;
  profile: ProfileData | null;
  targetRole: string;
  targetJobDescription: string;
}

const SECTION_LABEL: Record<GeneratorType, string> = {
  headline: "Headline",
  about: "About",
  experience_bullets: "Experience bullets",
  skills: "Skills",
};

/**
 * Resume↔LinkedIn sync — Pro feature.
 *
 * Free signed-in users see a teaser that explains the feature and
 * shows a Pro upsell. Pro users see a "Generate aligned LinkedIn
 * profile" button that calls /api/linkedin/sync-from-resume and
 * renders one card per section, each with Copy + "Open in LinkedIn"
 * deep-link buttons. We never auto-write to LinkedIn — the user
 * pastes and saves themselves, which is what keeps this compliant
 * with LinkedIn's UX terms.
 */
export function ConsistencySync({
  me,
  profile,
  targetRole,
  targetJobDescription,
}: Props) {
  if (!me) return null;
  const isPro = me.plan === "pro";
  if (!me.hasResume) return <NoResumeCard />;
  if (!isPro) return <ProTeaserCard />;
  return (
    <ProSyncCard
      profile={profile}
      targetRole={targetRole}
      targetJobDescription={targetJobDescription}
    />
  );
}

/* ------------------------------------------------------------------ */
/* States                                                             */
/* ------------------------------------------------------------------ */

function NoResumeCard() {
  return (
    <Card padded="md">
      <div className="flex items-start gap-3">
        <div
          aria-hidden="true"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-md"
          style={{ background: "var(--rz-info-bg)", color: "var(--rz-info-solid)" }}
        >
          <Upload className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p
            className="text-[14px] font-bold leading-snug tracking-[-0.01em]"
            style={{ color: "var(--rz-text)" }}
          >
            Sync your LinkedIn from your resume
          </p>
          <p
            className="mt-1 text-[13px] leading-snug"
            style={{ color: "var(--rz-text-2)" }}
          >
            Upload a resume to Rezoomed and we'll generate an aligned LinkedIn
            profile in your voice — broadened for LinkedIn's keyword net.
          </p>
          <div className="mt-3">
            <Button
              href="https://rezoomed.com/dashboard?ref=ext_consistency_sync_upload"
              variant="primary"
              size="sm"
              icon={<FileText className="h-3.5 w-3.5" aria-hidden="true" />}
            >
              Upload to Rezoomed
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function ProTeaserCard() {
  return (
    <Card padded="md" tone="warning">
      <div className="flex items-start gap-3">
        <div
          aria-hidden="true"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-md"
          style={{ background: "var(--rz-warning-bg)", color: "var(--rz-warning-solid)" }}
        >
          <Lock className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p
              className="text-[14px] font-bold leading-snug tracking-[-0.01em]"
              style={{ color: "var(--rz-text)" }}
            >
              Resume ↔ LinkedIn auto-sync
            </p>
            <Badge tone="pro">Pro</Badge>
          </div>
          <p
            className="mt-1 text-[13px] leading-snug"
            style={{ color: "var(--rz-text-2)" }}
          >
            Generate a LinkedIn profile that matches your ATS-optimized resume
            but tunes vocabulary for LinkedIn's recruiter Boolean net. One click,
            four sections, copy + paste — never auto-write.
          </p>
          <div className="mt-3">
            <ProCta section="consistency_sync_teaser" label="Unlock with Pro" />
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Pro user — actual sync flow                                        */
/* ------------------------------------------------------------------ */

interface ProSyncProps {
  profile: ProfileData | null;
  targetRole: string;
  targetJobDescription: string;
}

function ProSyncCard({ profile, targetRole, targetJobDescription }: ProSyncProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sections, setSections] = useState<SyncFromResumeSection[] | null>(null);
  const [resumeTitle, setResumeTitle] = useState<string | null>(null);

  const run = useCallback(async () => {
    if (!targetRole.trim()) {
      setError("Add a target role in Job Match so the rewrite can match it.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const linkedinCurrent = serializeLinkedInCurrent(profile);
      const res = await postSyncFromResume({
        targetRole: targetRole.slice(0, 200),
        targetJobDescription: targetJobDescription.trim() || undefined,
        linkedinCurrent,
      });
      setSections(res.sections);
      setResumeTitle(res.resumeTitle);
      const allCached = res.sections.every((s) => s.cached);
      void track({
        name: "consistency_sync_run",
        props: {
          cached: allCached,
          sections: res.sections.length,
          usedJobDescription: !!targetJobDescription.trim(),
        },
      });
    } catch (err) {
      setError(deriveErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [profile, targetRole, targetJobDescription]);

  return (
    <div className="space-y-3">
      <Card padded="md">
        <div className="flex items-start gap-3">
          <div
            aria-hidden="true"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-md"
            style={{ background: "var(--rz-good-bg)", color: "var(--rz-good-solid)" }}
          >
            <Wand2 className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p
              className="text-[14px] font-bold leading-snug tracking-[-0.01em]"
              style={{ color: "var(--rz-text)" }}
            >
              Resume ↔ LinkedIn aligned profile
            </p>
            <p
              className="mt-1 text-[12.5px] leading-snug"
              style={{ color: "var(--rz-text-2)" }}
            >
              Generates a LinkedIn-tuned version of your most recent Rezoomed
              resume. Voice stays yours; metrics stay verbatim. Copy each
              section and paste it into LinkedIn — no auto-write.
            </p>
            <div className="mt-3">
              <Button
                variant="primary"
                size="sm"
                onClick={() => void run()}
                loading={loading}
                icon={
                  sections ? (
                    <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  )
                }
                trailingIcon={<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />}
              >
                {sections ? "Regenerate aligned profile" : "Generate aligned profile"}
              </Button>
            </div>
          </div>
        </div>
        {resumeTitle ? (
          <p
            className="mt-3 text-[12px]"
            style={{ color: "var(--rz-text-3)" }}
          >
            Synced from <span className="font-semibold">{resumeTitle}</span>
          </p>
        ) : null}
        {error ? (
          <div
            className="mt-3 flex items-start gap-2 rounded-md border p-2.5 text-[13px]"
            style={{
              background: "var(--rz-critical-bg)",
              borderColor: "var(--rz-critical-border)",
              color: "var(--rz-critical-text)",
            }}
          >
            <AlertTriangle
              className="mt-0.5 h-4 w-4 shrink-0"
              style={{ color: "var(--rz-critical-solid)" }}
              aria-hidden="true"
            />
            <span>{error}</span>
          </div>
        ) : null}
      </Card>

      {sections?.map((section) => (
        <SectionRewriteCard key={section.generator} section={section} />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Per-section card with Copy + Open-in-LinkedIn                      */
/* ------------------------------------------------------------------ */

function SectionRewriteCard({ section }: { section: SyncFromResumeSection }) {
  const [copied, setCopied] = useState(false);
  // Resolve the deep link at render time so it always carries the current
  // profile slug rather than whatever slug was loaded when the module
  // first evaluated.
  const deepLink = deepLinkFor(section.generator);
  const displayText =
    section.rewriteLines && section.rewriteLines.length > 0
      ? section.rewriteLines.join("\n")
      : section.rewrite;

  const handleCopy = async () => {
    if (!displayText) return;
    try {
      await navigator.clipboard.writeText(displayText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
      void track({
        name: "consistency_sync_section_copied",
        props: { generator: section.generator },
      });
    } catch {
      /* ignore */
    }
  };

  const handleOpen = () => {
    void track({
      name: "consistency_sync_section_opened",
      props: { generator: section.generator },
    });
  };

  if (section.empty) {
    return (
      <Card padded="md">
        <p
          className="text-[10.5px] font-semibold uppercase tracking-[0.09em]"
          style={{ color: "var(--rz-text-3)" }}
        >
          {SECTION_LABEL[section.generator]}
        </p>
        <p
          className="mt-1 text-[13px] leading-snug"
          style={{ color: "var(--rz-text-2)" }}
        >
          {section.rationale ||
            "Resume context wasn't rich enough to draft this section. Try strengthening that resume section in Rezoomed first."}
        </p>
      </Card>
    );
  }

  return (
    <Card padded="md" className="rz-pop-in">
      <div className="flex items-center justify-between gap-2">
        <p
          className="text-[10.5px] font-semibold uppercase tracking-[0.09em]"
          style={{ color: "var(--rz-text-3)" }}
        >
          {SECTION_LABEL[section.generator]}
          {section.cached ? (
            <span className="ml-2 normal-case font-medium tracking-normal" style={{ color: "var(--rz-text-3)" }}>
              · cached
            </span>
          ) : null}
        </p>
      </div>
      <pre
        className="mt-2 overflow-x-auto rounded-md p-2.5 text-[13.5px] leading-snug"
        style={{
          background: "var(--rz-card-bg-alt)",
          border: "1px solid var(--rz-border)",
          color: "var(--rz-text)",
          fontFamily: "inherit",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {displayText}
      </pre>
      {section.rationale ? (
        <p
          className="mt-2 text-[12px] italic leading-snug"
          style={{ color: "var(--rz-text-3)" }}
        >
          Why: {section.rationale}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleCopy}
          icon={
            copied ? (
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            )
          }
        >
          {copied ? "Copied" : "Copy"}
        </Button>
        {deepLink ? (
          <Button
            variant="primary"
            size="sm"
            href={deepLink}
            onClick={handleOpen}
            icon={<ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />}
          >
            Open in LinkedIn
          </Button>
        ) : null}
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function serializeLinkedInCurrent(
  profile: ProfileData | null,
): {
  headline: string;
  about: string;
  experience_bullets: string;
  skills: string;
} {
  if (!profile) {
    return { headline: "", about: "", experience_bullets: "", skills: "" };
  }
  return {
    headline: profile.headline?.value ?? "",
    about: profile.about?.value ?? "",
    experience_bullets: serializeExperienceForPrompt(profile.experience?.value ?? []),
    skills: (profile.skills?.value ?? []).join("\n"),
  };
}

function deriveErrorMessage(err: unknown): string {
  if (err instanceof HttpError) {
    if (err.status === 402) {
      return "Resume↔LinkedIn sync is a Pro feature. Upgrade in Rezoomed to unlock.";
    }
    if (err.status === 404) {
      return "No resume found on Rezoomed. Upload one first, then run sync again.";
    }
    if (err.status === 429) {
      return "You're running sync a bit fast. Give it a minute and try again.";
    }
    if (err.status === 401) {
      return "Sign-in expired. Refresh the page and sign back in.";
    }
  }
  return "Couldn't generate the aligned profile. Try again.";
}

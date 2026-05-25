import { useState } from "react";
import { ChevronDown, ChevronUp, Copy, ExternalLink, Sparkles } from "lucide-react";

import { postGenerate, type GeneratorType, type GenerateResponse } from "../auth/api";
import type { ExperienceEntry, ProfileData } from "../adapter/types";
import { track } from "../telemetry/events";

// Maps a scoring check ID to a Claude generator and to the section text we
// send as input. Returning null means the check has no rewriter (photo,
// banner, education, etc.) and the regular Pro CTA should be used instead.
export function getRewriteFor(
  checkId: string,
  profile: ProfileData | null
): { generator: GeneratorType; currentText: string } | null {
  if (!profile) return null;
  switch (checkId) {
    case "headline-keywords":
      return { generator: "headline", currentText: profile.headline?.value ?? "" };
    case "about-depth":
    case "about-hook":
      return { generator: "about", currentText: profile.about?.value ?? "" };
    case "experience-filled":
    case "quantified-bullets":
      return {
        generator: "experience_bullets",
        currentText: serializeExperience(profile.experience?.value ?? []),
      };
    case "skills-count":
      return { generator: "skills", currentText: (profile.skills?.value ?? []).join("\n") };
    default:
      return null;
  }
}

function serializeExperience(entries: ExperienceEntry[]): string {
  if (!entries.length) return "";
  return entries
    .slice(0, 3)
    .map((e, i) => {
      const lines = [
        `[${i + 1}] ${e.title?.value ?? "(no title)"} — ${e.company?.value ?? "(no company)"}`,
      ];
      if (e.description?.value) lines.push(e.description.value);
      if (e.bullets?.value?.length) lines.push(...e.bullets.value.map((b) => `• ${b}`));
      return lines.join("\n");
    })
    .join("\n\n");
}

const LINKEDIN_EDIT_URL: Record<GeneratorType, string> = {
  headline: "https://www.linkedin.com/in/me/edit/intro/",
  about: "https://www.linkedin.com/in/me/edit/about/",
  experience_bullets: "https://www.linkedin.com/in/me/edit/experience/",
  skills: "https://www.linkedin.com/in/me/details/skills/",
};

interface Props {
  checkId: string;
  generator: GeneratorType;
  currentText: string;
  targetRole: string;
  targetJobDescription: string;
  hasResume: boolean;
}

export function RewriteCard({
  checkId,
  generator,
  currentText,
  targetRole,
  targetJobDescription,
  hasResume,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const handleToggle = async () => {
    void track({ name: "pro_cta_clicked", props: { section: checkId } });
    if (expanded) {
      setExpanded(false);
      return;
    }
    setExpanded(true);
    if (result) return; // already loaded
    if (!targetRole.trim()) {
      setError("Add a target role in the box above so the rewrite matches.");
      return;
    }
    if (!currentText.trim()) {
      setError("Couldn't read this section to rewrite it.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await postGenerate({
        generator,
        targetRole: targetRole.slice(0, 200),
        currentText: currentText.slice(0, 12000),
        targetJobDescription: targetJobDescription.trim() || undefined,
        useResumeContext: hasResume,
      });
      setResult(res);
    } catch (err) {
      // Surface the 402 upgrade case distinctly — should never hit here since
      // we only render this for Pro users, but defense-in-depth.
      setError(err instanceof Error ? err.message : "rewrite_failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result?.rewrite) return;
    try {
      await navigator.clipboard.writeText(result.rewrite);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Couldn't copy — select and copy manually.");
    }
  };

  return (
    <div className="mt-2.5">
      <button
        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-bold uppercase tracking-wide transition"
        style={{
          background: expanded ? "var(--rz-primary)" : "var(--rz-primary-tint)",
          color: expanded ? "var(--rz-on-primary)" : "var(--rz-primary)",
          border: "1px solid var(--rz-border-strong)",
        }}
        onClick={handleToggle}
        type="button"
      >
        <Sparkles className="h-3 w-3" aria-hidden="true" />
        {expanded ? "Hide AI rewrite" : "Generate AI rewrite"}
        {expanded ? (
          <ChevronUp className="h-3 w-3" aria-hidden="true" />
        ) : (
          <ChevronDown className="h-3 w-3" aria-hidden="true" />
        )}
      </button>

      {expanded ? (
        <div
          className="rz-fade-in mt-2.5 rounded-xl p-3"
          style={{
            background: "var(--rz-gradient-soft)",
            border: "1px solid var(--rz-border)",
          }}
        >
          {loading ? (
            <div className="flex items-center gap-2 text-[14px]" style={{ color: "var(--rz-primary)" }}>
              <span className="rz-skeleton h-3 w-3 rounded-full" />
              Generating rewrite with Claude…
            </div>
          ) : error ? (
            <p className="text-[14px]" style={{ color: "var(--rz-danger)" }}>{error}</p>
          ) : result ? (
            <>
              <p
                className="text-[11px] font-bold uppercase tracking-[0.14em]"
                style={{ color: "var(--rz-on-surface-3)" }}
              >
                Current
              </p>
              <p
                className="mt-1 whitespace-pre-wrap text-[14px] leading-snug"
                style={{ color: "var(--rz-on-surface-2)" }}
              >
                {currentText.trim() || "(empty)"}
              </p>

              <div className="my-3 flex items-center gap-2">
                <div className="h-px flex-1" style={{ background: "var(--rz-border-strong)" }} />
                <span
                  className="text-[11px] font-bold uppercase tracking-[0.14em]"
                  style={{ color: "var(--rz-primary)" }}
                >
                  Suggested {result.cached ? "(cached)" : ""}
                </span>
                <div className="h-px flex-1" style={{ background: "var(--rz-border-strong)" }} />
              </div>

              <p
                className="whitespace-pre-wrap rounded-lg p-2.5 text-[16px] leading-snug"
                style={{
                  background: "var(--rz-surface)",
                  color: "var(--rz-on-surface)",
                  border: "1px solid var(--rz-border)",
                }}
              >
                {result.rewrite || "(model returned no rewrite — try editing the inputs)"}
              </p>

              {result.rationale ? (
                <p className="mt-2 text-[12px] italic leading-snug" style={{ color: "var(--rz-on-surface-3)" }}>
                  Why: {result.rationale}
                </p>
              ) : null}

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[14px] font-semibold transition"
                  style={{
                    background: "var(--rz-surface)",
                    color: "var(--rz-on-surface)",
                    border: "1px solid var(--rz-border)",
                  }}
                  disabled={!result.rewrite}
                  onClick={handleCopy}
                  type="button"
                >
                  <Copy className="h-3 w-3" aria-hidden="true" />
                  {copied ? "Copied" : "Copy"}
                </button>
                <a
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[14px] font-bold transition hover:-translate-y-px"
                  style={{
                    background: "var(--rz-gradient)",
                    color: "var(--rz-on-primary)",
                    boxShadow: "var(--rz-shadow-pop)",
                  }}
                  href={LINKEDIN_EDIT_URL[generator]}
                  rel="noreferrer noopener"
                  target="_blank"
                >
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  Edit on LinkedIn
                </a>
              </div>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

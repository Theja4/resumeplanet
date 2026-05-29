import { useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  Wand2,
} from "lucide-react";

import { Button, Card, StatusPill } from "../components";
import { track } from "../../telemetry/events";
import { getRewriteFor } from "../RewriteCard";
import { LINKEDIN_EDIT_URL } from "../linkedinDeepLinks";
import { type Severity } from "../../scoring/severity";
import { useRewrite } from "./useRewrite";
import type { CategoryScore, ScoreResult } from "../../scoring/types";
import type { ProfileData } from "../../adapter/types";
import type { GeneratorType, MeResponse } from "../../auth/api";

type CategoryId = CategoryScore["id"];

type CheckRow = ScoreResult["checks"][number];

interface Props {
  category: CategoryScore;
  severity: Severity;
  failingChecks: CheckRow[];
  passingChecks: CheckRow[];
  profile: ProfileData | null;
  me: MeResponse | null;
  targetRole: string;
  targetJobDescription: string;
  isFree: boolean;
  /** Triggered when a free user clicks the AI rewrite action. */
  onRequestUpgrade: () => void;
  /** External control of expansion (for "scroll to first issue"). */
  forceOpen?: boolean;
}

export function SectionRow({
  category,
  severity,
  failingChecks,
  passingChecks,
  profile,
  me,
  targetRole,
  targetJobDescription,
  isFree,
  onRequestUpgrade,
  forceOpen,
}: Props) {
  const [open, setOpen] = useState<boolean>(forceOpen ?? severity === "critical");

  useEffect(() => {
    if (forceOpen) setOpen(true);
  }, [forceOpen]);

  // Find the first rewriteable check (used for the inline AI rewrite button).
  const rewriteable = failingChecks
    .map((c) => ({ check: c, rewrite: getRewriteFor(c.id, profile) }))
    .find((x) => x.rewrite !== null);

  const passedChecks = passingChecks.filter((check) => check.status === "pass");
  const unreadChecks = passingChecks.filter((check) => check.status === "unread");
  const totalChecks = failingChecks.length + passingChecks.length;
  const lostPoints = Math.max(0, category.max - category.points);
  const summary =
    failingChecks.length > 0
      ? [
          `${failingChecks.length} ${pluralize(failingChecks.length, "check", "checks")} need work`,
          passedChecks.length > 0 ? `${passedChecks.length} passing` : null,
          unreadChecks.length > 0 ? `${unreadChecks.length} not scored` : null,
          `${lostPoints} ${pluralize(lostPoints, "point", "points")} left`,
        ].filter(Boolean).join(" · ")
      : totalChecks > 0
        ? passedChecks.length > 0
          ? [
              `All ${passedChecks.length} readable ${pluralize(passedChecks.length, "check", "checks")} passing`,
              unreadChecks.length > 0 ? `${unreadChecks.length} not scored` : null,
            ].filter(Boolean).join(" · ")
          : `${unreadChecks.length} ${pluralize(unreadChecks.length, "check", "checks")} not scored`
        : "Section coverage";

  return (
    <Card
      padded="md"
      hoverable
      className="rz-section-card rz-fade-in"
      data-section-id={category.id}
      data-priority-tone={severity}
      style={{ scrollMarginTop: 16 }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-3 outline-none"
        aria-expanded={open}
        aria-controls={`section-${category.id}-body`}
      >
        <div className="min-w-0 text-left">
          <div className="flex items-center gap-2">
            <p
              className="text-[16px] font-extrabold leading-snug"
              style={{ color: "var(--rz-text)" }}
            >
              {category.label}
            </p>
            <span
              className="rz-num text-[12px]"
              style={{ color: "var(--rz-text-3)" }}
            >
              {category.points}/{category.max}
            </span>
          </div>
          <p
            className="mt-1.5 text-[14.5px] leading-snug"
            style={{ color: "var(--rz-text-2)" }}
          >
            {summary}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <StatusPill severity={severity} />
          {open ? (
            <ChevronUp
              className="h-4 w-4"
              style={{ color: "var(--rz-text-3)" }}
              aria-hidden="true"
            />
          ) : (
            <ChevronDown
              className="h-4 w-4"
              style={{ color: "var(--rz-text-3)" }}
              aria-hidden="true"
            />
          )}
        </div>
      </button>

      {open ? (
        <div
          id={`section-${category.id}-body`}
          className="mt-4 space-y-3 rz-fade-in"
        >
          {failingChecks.length > 0 ? (
            <ul className="space-y-2" aria-label="Checks needing work">
              {failingChecks.map((check) => (
                <FailingCheckCard key={check.id} check={check} severity={severity} />
              ))}
            </ul>
          ) : null}

          {/* AI rewrite — sits directly after the to-do list so the
              fix CTA is the next thing the eye lands on. */}
          {rewriteable ? (
            <RewriteAction
              checkId={rewriteable.check.id}
              generator={rewriteable.rewrite!.generator}
              currentText={rewriteable.rewrite!.currentText}
              targetRole={targetRole}
              targetJobDescription={targetJobDescription}
              hasResume={!!me?.hasResume}
              isFree={isFree}
              onRequestUpgrade={onRequestUpgrade}
            />
          ) : null}

          {unreadChecks.length > 0 ? (
            <details className="rz-disclosure">
              <summary
                className="flex cursor-pointer list-none items-center gap-2 rounded-[10px] px-2 py-1.5 text-[12.5px] font-bold transition-colors"
                style={{ color: "var(--rz-text-3)" }}
              >
                <span
                  aria-hidden="true"
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ background: "var(--rz-text-4)" }}
                />
                {unreadChecks.length} not scored
                <ChevronDown className="ml-auto h-3.5 w-3.5 transition-transform rz-disclosure-chevron" aria-hidden="true" />
              </summary>
              <ul className="mt-2 space-y-1.5 pl-4" aria-label="Checks not scored">
                {unreadChecks.map((check) => (
                  <li key={check.id} className="text-[13px] leading-snug" style={{ color: "var(--rz-text-3)" }}>
                    <span className="font-semibold" style={{ color: "var(--rz-text-2)" }}>
                      {check.label}
                    </span>
                    {" — "}
                    {check.tip}
                  </li>
                ))}
              </ul>
            </details>
          ) : null}

          {passedChecks.length > 0 ? (
            <details className="rz-disclosure">
              <summary
                className="flex cursor-pointer list-none items-center gap-2 rounded-[10px] px-2 py-1.5 text-[12.5px] font-bold transition-colors"
                style={{ color: "var(--rz-good-text)" }}
              >
                <Check
                  className="h-3.5 w-3.5 shrink-0"
                  style={{ color: "var(--rz-good-solid)" }}
                  aria-hidden="true"
                  strokeWidth={3}
                />
                {passedChecks.length} already passing
                <ChevronDown className="ml-auto h-3.5 w-3.5 transition-transform rz-disclosure-chevron" aria-hidden="true" />
              </summary>
              <ul className="mt-2 space-y-1 pl-5" aria-label="Passing checks">
                {passedChecks.map((check) => (
                  <li key={check.id} className="flex items-baseline gap-1.5 text-[13px] leading-snug" style={{ color: "var(--rz-text-3)" }}>
                    <span style={{ color: "var(--rz-good-solid)" }} aria-hidden="true">·</span>
                    <span style={{ color: "var(--rz-text-2)" }}>{check.label}</span>
                  </li>
                ))}
              </ul>
            </details>
          ) : null}

          {failingChecks.length === 0 && passedChecks.length === 0 && unreadChecks.length === 0 ? (
            <p className="text-[14.5px]" style={{ color: "var(--rz-text-2)" }}>
              No readable checks are failing in this section.
            </p>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}

function FailingCheckCard({
  check,
  severity,
}: {
  check: CheckRow;
  severity: Severity;
}) {
  const isFail = check.status === "fail";
  const palette = isFail
    ? {
        bg: "var(--rz-critical-bg)",
        border: "var(--rz-critical-border)",
        text: "var(--rz-critical-text)",
        solid: "var(--rz-critical-solid)",
      }
    : {
        bg: "var(--rz-warning-bg)",
        border: "var(--rz-warning-border)",
        text: "var(--rz-warning-text)",
        solid: "var(--rz-warning-solid)",
      };

  // Track the section severity so the card visually inherits the parent's
  // tone when the underlying check status is ambiguous (warn under critical).
  void severity;

  return (
    <li
      className="rz-pop-in flex items-start gap-3 rounded-[12px] border p-3"
      style={{
        background: palette.bg,
        borderColor: palette.border,
      }}
    >
      <div
        className="grid h-8 w-8 shrink-0 place-items-center rounded-[8px] text-[15px] font-extrabold leading-none rz-num"
        style={{
          background: `color-mix(in srgb, ${palette.solid} 14%, var(--rz-card-bg))`,
          color: palette.solid,
          border: `1px solid color-mix(in srgb, ${palette.solid} 34%, var(--rz-border))`,
          boxShadow: `inset 0 1px 0 rgba(255, 255, 255, 0.10), 0 8px 18px -14px ${palette.solid}`,
        }}
        aria-hidden="true"
      >
        !
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className="text-[10.5px] font-extrabold uppercase tracking-[0.08em]"
            style={{ color: palette.text }}
          >
            {isFail ? "To do · critical" : "To do · needs work"}
          </span>
        </div>
        <p
          className="mt-0.5 text-[14.5px] font-extrabold leading-snug"
          style={{ color: "var(--rz-text)" }}
        >
          {check.label}
        </p>
        <p
          className="mt-1 text-[13.5px] leading-snug"
          style={{ color: "var(--rz-text-2)" }}
        >
          {check.tip}
        </p>
      </div>
    </li>
  );
}

function pluralize(count: number, single: string, plural: string): string {
  return count === 1 ? single : plural;
}

interface RewriteActionProps {
  checkId: string;
  generator: GeneratorType;
  currentText: string;
  targetRole: string;
  targetJobDescription: string;
  hasResume: boolean;
  isFree: boolean;
  onRequestUpgrade: () => void;
}

function RewriteAction({
  checkId,
  generator,
  currentText,
  targetRole,
  targetJobDescription,
  hasResume,
  isFree,
  onRequestUpgrade,
}: RewriteActionProps) {
  const [open, setOpen] = useState(false);
  const rw = useRewrite({
    checkId,
    generator,
    currentText,
    targetRole,
    targetJobDescription,
    hasResume,
  });
  const [copied, setCopied] = useState(false);

  const handleClick = async () => {
    if (isFree) {
      onRequestUpgrade();
      return;
    }
    setOpen(true);
    if (!rw.result && !rw.loading) {
      await rw.run();
    }
  };

  const handleCopy = async () => {
    if (!rw.result?.rewrite) return;
    try {
      await navigator.clipboard.writeText(rw.result.rewrite);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      /* no-op */
    }
  };

  if (isFree) {
    // Pro gate framed as a real action, not a paywall. The whole card
    // is one big clickable surface that reads "Fix this with AI" — the
    // language matches the Pro user's primary CTA so free users see
    // the same affordance, just routed to /pricing where they can see
    // every Pro feature on one page (better conversion than a drop-in
    // upgrade modal that only sells this single rewrite). The Pro
    // badge stays present but is tucked in as a small status pill,
    // not the headline.
    const href = `https://rezoomed.com/pricing?ref=ext_${encodeURIComponent(
      `section_${checkId}`,
    )}`;
    const handleProGateClick = () => {
      void track({
        name: "pro_cta_clicked",
        props: { section: `section_${checkId}` },
      });
      // Leave the inline UpgradeCard untouched — it's still useful as
      // a quieter contextual reminder elsewhere — but for this card we
      // prefer routing to /pricing.
      onRequestUpgrade();
    };
    return (
      <Button
        href={href}
        variant="primary"
        size="sm"
        onClick={handleProGateClick}
        icon={<Wand2 className="h-4 w-4" aria-hidden="true" />}
        trailingIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
        className="rz-btn-rewrite rz-sheen"
        block
      >
        Fix this with AI
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        variant="primary"
        size="sm"
        onClick={handleClick}
        loading={rw.loading}
        icon={<Wand2 className="h-4 w-4" aria-hidden="true" />}
        className="rz-btn-rewrite rz-sheen"
        block
      >
        {rw.result ? "Regenerate AI rewrite" : "Generate AI rewrite"}
      </Button>

      {open && rw.error ? (
        <p className="text-[13px]" style={{ color: "var(--rz-critical-text)" }}>
          {rw.error}
        </p>
      ) : null}

      {open && rw.result ? (
        <div
          className="rounded-md border p-3 rz-fade-in"
          style={{
            borderColor: "var(--rz-border)",
            background: "var(--rz-card-bg-alt)",
          }}
        >
          <p
            className="text-[11px] font-medium uppercase tracking-[0.06em]"
            style={{ color: "var(--rz-text-3)" }}
          >
            Suggested {rw.result.cached ? "(cached)" : ""}
          </p>
          <p
            className="mt-1.5 whitespace-pre-wrap text-[15px] leading-snug"
            style={{ color: "var(--rz-text)" }}
          >
            {rw.result.rewrite || "(model returned no rewrite — try editing the inputs)"}
          </p>
          {rw.result.rationale ? (
            <p
              className="mt-2 text-[12px] italic leading-snug"
              style={{ color: "var(--rz-text-3)" }}
            >
              Why: {rw.result.rationale}
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopy}
              icon={<Copy className="h-3.5 w-3.5" aria-hidden="true" />}
            >
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button
              variant="primary"
              size="sm"
              href={LINKEDIN_EDIT_URL[generator]}
              icon={<ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />}
            >
              Edit on LinkedIn
            </Button>
            {rw.result ? (
              <span
                className="ml-auto inline-flex items-center gap-1 text-[12px]"
                style={{ color: "var(--rz-good-text)" }}
              >
                <Check className="h-3 w-3" aria-hidden="true" />
                Ready
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

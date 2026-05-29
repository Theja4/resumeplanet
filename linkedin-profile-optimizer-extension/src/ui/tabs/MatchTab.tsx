import { Target } from "lucide-react";
import { Card } from "../components";
import { ConsistencyGap } from "../ConsistencyGap";
import { ConsistencySync } from "../ConsistencySync";
import type { ProfileData } from "../../adapter/types";
import type { MeResponse } from "../../auth/api";

interface Props {
  profile: ProfileData | null;
  me: MeResponse | null;
  targetJobDescription: string;
  setTargetJobDescription: (v: string) => void;
}

/**
 * Job Match tab — paste a JD, see consistency gap and (Pro-only)
 * fine-tuned rewrite context. Stripe-style layout: card with a single
 * 1px border, plain textarea, restrained typography.
 */
export function MatchTab({
  profile,
  me,
  targetJobDescription,
  setTargetJobDescription,
}: Props) {
  const charCount = targetJobDescription.length;

  return (
    <div className="rz-fade-in space-y-4 px-4 pt-2">
      <section>
        <p className="rz-eyebrow mb-2.5">Target role / job description</p>
        <Card padded="md">
          <label
            htmlFor="rezoomed-target-jd"
            className="flex items-center gap-1.5 text-[12px] font-medium"
            style={{ color: "var(--rz-text-3)" }}
          >
            <Target className="h-3.5 w-3.5" aria-hidden="true" />
            Paste a job description
          </label>
          <textarea
            id="rezoomed-target-jd"
            className="mt-2 block min-h-[160px] w-full resize-y rounded-md p-3 text-[14px] leading-snug outline-none transition"
            style={{
              background: "var(--rz-card-bg-alt)",
              border: "1px solid var(--rz-border)",
              color: "var(--rz-text)",
            }}
            placeholder="Paste a job description here. Rezoomed scores keyword overlap and uses this to tailor AI rewrites."
            value={targetJobDescription}
            onChange={(e) => setTargetJobDescription(e.target.value)}
            onFocus={(e) => {
              (e.currentTarget as HTMLTextAreaElement).style.borderColor =
                "var(--rz-border-focus)";
            }}
            onBlur={(e) => {
              (e.currentTarget as HTMLTextAreaElement).style.borderColor =
                "var(--rz-border)";
            }}
          />
          <div className="mt-2 flex items-center justify-between text-[12px]">
            <p style={{ color: "var(--rz-text-3)" }}>
              The first line becomes your target role for AI rewrites.
            </p>
            <p style={{ color: "var(--rz-text-3)" }}>
              <span className="rz-num">{charCount.toLocaleString()}</span>
              {" "}characters
            </p>
          </div>
        </Card>
      </section>

      {me ? (
        <section>
          <p className="rz-eyebrow mb-2.5">Resume ↔ LinkedIn consistency</p>
          <ConsistencyGap
            hasResume={me.hasResume}
            profile={profile}
            userId={me.userId}
          />
        </section>
      ) : null}

      {me ? (
        <section>
          <p className="rz-eyebrow mb-2.5">Sync from your Rezoomed resume</p>
          <ConsistencySync
            me={me}
            profile={profile}
            targetRole={firstNonEmptyLine(targetJobDescription)}
            targetJobDescription={targetJobDescription}
          />
        </section>
      ) : null}
    </div>
  );
}

/** Mirrors the panel's role-extraction rule: first non-trivial line. */
function firstNonEmptyLine(text: string): string {
  const line = text.split("\n").find((l) => l.trim().length >= 4);
  return line ? line.trim().slice(0, 200) : "";
}

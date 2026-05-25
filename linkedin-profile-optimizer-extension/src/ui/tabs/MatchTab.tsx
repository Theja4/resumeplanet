import { Target } from "lucide-react";
import { Card, SectionLabel } from "../atoms";
import { ConsistencyGap } from "../ConsistencyGap";
import type { ProfileData } from "../../adapter/types";
import type { MeResponse } from "../../auth/api";

interface Props {
  profile: ProfileData | null;
  me: MeResponse | null;
  targetJobDescription: string;
  setTargetJobDescription: (v: string) => void;
}

export function MatchTab({ profile, me, targetJobDescription, setTargetJobDescription }: Props) {
  return (
    <div className="rz-fade-in">
      <SectionLabel>Target role / JD</SectionLabel>
      <Card>
        <label
          htmlFor="rezoomed-target-jd"
          className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.18em]"
          style={{ color: "var(--rz-on-surface-3)" }}
        >
          <Target className="h-3.5 w-3.5" />
          Paste a job description
        </label>
        <textarea
          className="mt-3 block min-h-[140px] w-full resize-y rounded-xl p-3 text-[15px] leading-snug outline-none transition"
          style={{
            background: "var(--rz-surface-2)",
            border: "1px solid var(--rz-border)",
            color: "var(--rz-on-surface)",
          }}
          id="rezoomed-target-jd"
          onChange={(e) => setTargetJobDescription(e.target.value)}
          placeholder="Paste a job description here. Rezoomed scores keyword overlap and uses this to tailor AI rewrites."
          value={targetJobDescription}
        />
        <p className="mt-2.5 text-[13px]" style={{ color: "var(--rz-on-surface-3)" }}>
          The first line becomes your target role for rewrites.
        </p>
      </Card>

      {me ? (
        <>
          <SectionLabel>Resume ↔ LinkedIn consistency</SectionLabel>
          <ConsistencyGap
            hasResume={me.hasResume}
            profile={profile}
            userId={me.userId}
          />
        </>
      ) : null}
    </div>
  );
}

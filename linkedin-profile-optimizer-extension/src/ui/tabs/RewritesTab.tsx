import { Lock, Sparkles } from "lucide-react";
import { Card, GradientButton, SectionLabel } from "../atoms";
import { RewriteCard, getRewriteFor } from "../RewriteCard";
import type { ProfileData } from "../../adapter/types";
import type { ScoreResult } from "../../scoring/types";
import type { MeResponse } from "../../auth/api";
import { track } from "../../telemetry/events";

interface Props {
  score: ScoreResult;
  profile: ProfileData | null;
  me: MeResponse | null;
  targetJobDescription: string;
  targetRole: string;
}

export function RewritesTab({ score, profile, me, targetJobDescription, targetRole }: Props) {
  const rewriteable = score.checks
    .map((c) => ({ check: c, rewrite: getRewriteFor(c.id, profile) }))
    .filter((x) => x.rewrite !== null);

  const isPro = me?.plan === "pro";

  if (!isPro) {
    return (
      <div className="rz-fade-in">
        <UpgradeCard />
        <SectionLabel>Available rewrites</SectionLabel>
        <div className="space-y-2.5">
          {rewriteable.map(({ check }) => (
            <Card key={check.id}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-[15px] font-bold">{check.label}</p>
                <Lock className="h-4 w-4" style={{ color: "var(--rz-on-surface-3)" }} />
              </div>
              <p className="mt-1.5 text-[14px] leading-snug" style={{ color: "var(--rz-on-surface-2)" }}>
                {check.tip}
              </p>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rz-fade-in space-y-2.5">
      <SectionLabel>AI rewrites</SectionLabel>
      {rewriteable.length === 0 ? (
        <Card>
          <p className="text-[15px] font-bold">Nothing rewriteable on this scan.</p>
        </Card>
      ) : (
        rewriteable.map(({ check, rewrite }) => (
          <Card key={check.id}>
            <p className="text-[15px] font-bold">{check.label}</p>
            <p className="mt-1 text-[14px] leading-snug" style={{ color: "var(--rz-on-surface-2)" }}>
              {check.tip}
            </p>
            <RewriteCard
              checkId={check.id}
              currentText={rewrite!.currentText}
              generator={rewrite!.generator}
              hasResume={!!me?.hasResume}
              targetJobDescription={targetJobDescription}
              targetRole={targetRole}
            />
          </Card>
        ))
      )}
    </div>
  );
}

function UpgradeCard() {
  return (
    <div
      className="relative mb-4 overflow-hidden rounded-3xl p-5"
      style={{
        background: "var(--rz-glass)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        border: "1px solid var(--rz-border-strong)",
        boxShadow: "var(--rz-shadow-card)",
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-10 h-[160px] w-[160px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(128,218,146,0.5) 0%, rgba(128,218,146,0) 70%)" }}
      />
      <div className="relative flex items-start gap-3">
        <div
          className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl"
          style={{ background: "var(--rz-gradient)", boxShadow: "var(--rz-shadow-pop)" }}
        >
          <Sparkles className="h-5 w-5" style={{ color: "var(--rz-on-primary)" }} />
        </div>
        <div className="min-w-0">
          <p className="text-[17px] font-extrabold leading-tight">
            AI rewrites are a Pro feature
          </p>
          <p
            className="mt-2 text-[14px] leading-snug"
            style={{ color: "var(--rz-on-surface-2)" }}
          >
            Claude rewrites your headline, About, experience bullets and skills to
            match your target role — using your resume as context.
          </p>
          <div className="mt-4">
            <GradientButton
              href="https://rezoomed.com/pricing?ref=ext_rewrites_tab"
              onClick={() => track({ name: "pro_cta_clicked", props: { section: "rewrites_tab" } })}
            >
              <Sparkles className="h-4 w-4" />
              Upgrade to Pro
            </GradientButton>
          </div>
        </div>
      </div>
    </div>
  );
}

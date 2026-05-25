import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Card, SectionLabel, StatusBadge } from "../atoms";
import { ProCta } from "../Gating";
import { RewriteCard, getRewriteFor } from "../RewriteCard";
import type { ProfileData } from "../../adapter/types";
import type { CheckStatus, ScoreResult } from "../../scoring/types";
import type { MeResponse } from "../../auth/api";

interface Props {
  score: ScoreResult;
  profile: ProfileData | null;
  me: MeResponse | null;
  targetJobDescription: string;
  targetRole: string;
  rescan: () => void;
}

const STATUS_ORDER: Record<CheckStatus, number> = {
  fail: 0,
  warn: 1,
  absent: 2,
  unread: 3,
  pass: 4,
};

export function FixesTab({
  score,
  profile,
  me,
  targetJobDescription,
  targetRole,
  rescan,
}: Props) {
  const sorted = [...score.checks].sort(
    (a, b) =>
      STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
      a.points / a.max - b.points / b.max,
  );

  const failing = sorted.filter((c) => c.status === "fail" || c.status === "warn" || c.status === "absent");
  const passing = sorted.filter((c) => c.status === "pass" || c.status === "unread");

  return (
    <div className="rz-fade-in">
      <SectionLabel>Needs attention ({failing.length})</SectionLabel>
      <div className="space-y-2.5">
        {failing.length === 0 ? (
          <Card>
            <p className="text-[15px] font-bold">All clear on this scan.</p>
            <p
              className="mt-1.5 text-[13px] leading-snug"
              style={{ color: "var(--rz-on-surface-2)" }}
            >
              Re-scan after any edit to make sure nothing regressed.
            </p>
          </Card>
        ) : (
          failing.map((check) => (
            <CheckRow
              key={check.id}
              check={check}
              profile={profile}
              me={me}
              targetJobDescription={targetJobDescription}
              targetRole={targetRole}
              rescan={rescan}
            />
          ))
        )}
      </div>

      {passing.length > 0 ? (
        <Collapse label={`Passing (${passing.length})`}>
          <div className="space-y-2.5 pt-2">
            {passing.map((check) => (
              <CheckRow
                key={check.id}
                check={check}
                profile={profile}
                me={me}
                targetJobDescription={targetJobDescription}
                targetRole={targetRole}
                rescan={rescan}
                compact
              />
            ))}
          </div>
        </Collapse>
      ) : null}
    </div>
  );
}

function CheckRow({
  check,
  profile,
  me,
  targetJobDescription,
  targetRole,
  rescan,
  compact,
}: {
  check: ScoreResult["checks"][number];
  profile: ProfileData | null;
  me: MeResponse | null;
  targetJobDescription: string;
  targetRole: string;
  rescan: () => void;
  compact?: boolean;
}) {
  const rewrite = getRewriteFor(check.id, profile);
  const showFixes =
    !compact && (check.status === "fail" || check.status === "warn");

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[14px] font-bold leading-snug">{check.label}</p>
          <p
            className="mt-1.5 text-[13px] leading-snug"
            style={{ color: "var(--rz-on-surface-2)" }}
          >
            {check.status === "unread" ? (
              <>
                couldn't read this section —{" "}
                <button
                  className="font-bold underline-offset-2 hover:underline"
                  style={{ color: "var(--rz-primary)" }}
                  onClick={rescan}
                  type="button"
                >
                  re-scan
                </button>
              </>
            ) : (
              check.tip
            )}
          </p>
        </div>
        <StatusBadge
          status={check.status}
          points={check.status === "unread" || check.status === "absent" ? undefined : check.points}
          max={check.status === "unread" || check.status === "absent" ? undefined : check.max}
        />
      </div>

      {showFixes ? (
        me?.plan === "pro" && rewrite ? (
          <RewriteCard
            checkId={check.id}
            currentText={rewrite.currentText}
            generator={rewrite.generator}
            hasResume={!!me.hasResume}
            targetJobDescription={targetJobDescription}
            targetRole={targetRole}
          />
        ) : (
          <ProCta section={check.id} />
        )
      ) : null}
    </Card>
  );
}

function Collapse({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex w-full items-center justify-between rounded-lg px-1 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em]"
        style={{ color: "var(--rz-on-surface-3)" }}
      >
        {label}
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open ? children : null}
    </div>
  );
}

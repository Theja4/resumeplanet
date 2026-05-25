import type { ProfileData } from "../adapter/types";
import { CHECK_REGISTRY } from "./registry";
import type { CategoryScore, CheckStatus, RegisteredCheck, ScoreContext, ScoreResult } from "./types";

const CATEGORY_LABELS: Record<RegisteredCheck["category"], string> = {
  discoverability: "Discoverability",
  completeness: "Completeness",
  content: "Content",
  signals: "Signals",
  keywordMatch: "Keyword match",
};

export function scoreProfile(profile: ProfileData, ctx: ScoreContext = {}): ScoreResult {
  const hasTargetJd = Boolean(ctx.targetJobDescription?.trim());
  const checks = CHECK_REGISTRY
    .filter((entry) => !entry.requiresTargetJobDescription || hasTargetJd)
    .map((entry) => ({
      ...entry.check(profile, ctx),
      category: entry.category,
    }));

  const readableChecks = checks.filter((check) => check.status !== "unread");
  const earnedPoints = readableChecks.reduce((sum, check) => sum + check.points, 0);
  const availablePoints = readableChecks.reduce((sum, check) => sum + check.max, 0);
  const total = availablePoints ? Math.round((earnedPoints / availablePoints) * 100) : 0;

  const categories = Object.keys(CATEGORY_LABELS).flatMap((category) => {
    const categoryChecks = checks.filter((check) => check.category === category);
    if (!categoryChecks.length) return [];

    const readable = categoryChecks.filter((check) => check.status !== "unread");
    const points = readable.reduce((sum, check) => sum + check.points, 0);
    const max = readable.reduce((sum, check) => sum + check.max, 0);
    const total = max ? Math.round((points / max) * 100) : 0;
    const status = categoryStatus(categoryChecks);

    return [
      {
        id: category as RegisteredCheck["category"],
        label: CATEGORY_LABELS[category as RegisteredCheck["category"]],
        points,
        max,
        total,
        status,
      } satisfies CategoryScore,
    ];
  });

  return {
    total,
    max: 100,
    earnedPoints,
    availablePoints,
    categories,
    checks,
  };
}

function categoryStatus(checks: Array<{ status: CheckStatus }>): CheckStatus {
  const readable = checks.filter((check) => check.status !== "unread");
  if (!readable.length) return "unread";
  // Absent registers at fail level for category color — the user lost
  // points on that check, even though we read it cleanly.
  if (readable.some((check) => check.status === "fail" || check.status === "absent")) return "fail";
  if (readable.some((check) => check.status === "warn")) return "warn";
  return "pass";
}

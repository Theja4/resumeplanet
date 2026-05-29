import type { CategoryScore, ScoreResult } from "./types";

/**
 * Three-tier severity model used to drive the FOMO banner and the
 * per-section status pills. The thresholds mirror Stripe Dashboard's
 * convention of "good" being a clear majority (≥80%), "warning" being
 * in-progress, and "critical" being the sub-50% danger zone.
 */
export type Severity = "critical" | "warning" | "good";

const GOOD_THRESHOLD = 0.80;
const WARNING_THRESHOLD = 0.50;

export function categorySeverity(c: CategoryScore): Severity {
  // A zero-max category has nothing to evaluate against — treat as good
  // so it never falsely contributes to the "losing N points" headline.
  if (c.max <= 0) return "good";
  const ratio = c.points / c.max;
  if (ratio >= GOOD_THRESHOLD) return "good";
  if (ratio >= WARNING_THRESHOLD) return "warning";
  return "critical";
}

export function severityFromRatio(ratio: number): Severity {
  if (!Number.isFinite(ratio)) return "good";
  if (ratio >= GOOD_THRESHOLD) return "good";
  if (ratio >= WARNING_THRESHOLD) return "warning";
  return "critical";
}

export interface AggregateSeverity {
  /** Sum of (max - points) for sections classified as critical. */
  pointsAtRisk: number;
  /** Sum of (max - points) for sections classified as warning. */
  warningPointsLost: number;
  /** Total points lost across all categories (regardless of bucket). */
  totalPointsLost: number;
  criticalCount: number;
  warningCount: number;
  goodCount: number;
  /** Lowest-ratio category if any exist, else null. */
  worstSection: CategoryScore | null;
  /** Mapping from category id -> severity. */
  bySection: Record<string, Severity>;
}

export function aggregateSeverity(score: ScoreResult): AggregateSeverity {
  const out: AggregateSeverity = {
    pointsAtRisk: 0,
    warningPointsLost: 0,
    totalPointsLost: 0,
    criticalCount: 0,
    warningCount: 0,
    goodCount: 0,
    worstSection: null,
    bySection: {},
  };

  let worstRatio = Infinity;

  for (const cat of score.categories) {
    const sev = categorySeverity(cat);
    out.bySection[cat.id] = sev;

    const lost = Math.max(0, cat.max - cat.points);
    out.totalPointsLost += lost;

    if (sev === "critical") {
      out.criticalCount += 1;
      out.pointsAtRisk += lost;
    } else if (sev === "warning") {
      out.warningCount += 1;
      out.warningPointsLost += lost;
    } else {
      out.goodCount += 1;
    }

    // Track the worst category strictly by ratio. Ties preserve the
    // first-encountered category (stable ordering).
    const ratio = cat.max > 0 ? cat.points / cat.max : 1;
    if (ratio < worstRatio) {
      worstRatio = ratio;
      out.worstSection = cat;
    }
  }

  return out;
}

import { describe, expect, it } from "vitest";
import {
  aggregateSeverity,
  categorySeverity,
  severityFromRatio,
} from "./severity";
import type { CategoryScore, ScoreResult } from "./types";

function makeCategory(
  id: string,
  points: number,
  max: number,
): CategoryScore {
  return {
    id: id as CategoryScore["id"],
    label: id,
    points,
    max,
    total: max > 0 ? Math.round((points / max) * 100) : 0,
    status: max > 0 && points >= max ? "pass" : "warn",
  };
}

function makeScore(categories: CategoryScore[]): ScoreResult {
  const earnedPoints = categories.reduce((s, c) => s + c.points, 0);
  const availablePoints = categories.reduce((s, c) => s + c.max, 0);
  return {
    total: availablePoints > 0
      ? Math.round((earnedPoints / availablePoints) * 100)
      : 0,
    max: 100,
    earnedPoints,
    availablePoints,
    categories,
    checks: [],
  };
}

describe("categorySeverity", () => {
  it("treats zero-max categories as good", () => {
    expect(categorySeverity(makeCategory("x", 0, 0))).toBe("good");
  });

  it("returns good at exactly the 80% threshold", () => {
    expect(categorySeverity(makeCategory("x", 8, 10))).toBe("good");
  });

  it("returns warning just below the 80% threshold", () => {
    expect(categorySeverity(makeCategory("x", 79, 100))).toBe("warning");
  });

  it("returns warning at exactly the 50% threshold", () => {
    expect(categorySeverity(makeCategory("x", 50, 100))).toBe("warning");
  });

  it("returns critical just below the 50% threshold", () => {
    expect(categorySeverity(makeCategory("x", 49, 100))).toBe("critical");
  });

  it("returns critical for an empty profile section", () => {
    expect(categorySeverity(makeCategory("x", 0, 20))).toBe("critical");
  });

  it("returns good for a fully-earned section", () => {
    expect(categorySeverity(makeCategory("x", 10, 10))).toBe("good");
  });
});

describe("severityFromRatio", () => {
  it("handles NaN gracefully", () => {
    expect(severityFromRatio(NaN)).toBe("good");
    expect(severityFromRatio(Infinity)).toBe("good");
  });

  it("matches the threshold table", () => {
    expect(severityFromRatio(1.0)).toBe("good");
    expect(severityFromRatio(0.8)).toBe("good");
    expect(severityFromRatio(0.79)).toBe("warning");
    expect(severityFromRatio(0.5)).toBe("warning");
    expect(severityFromRatio(0.49)).toBe("critical");
    expect(severityFromRatio(0)).toBe("critical");
  });
});

describe("aggregateSeverity", () => {
  it("returns zeros for an empty score", () => {
    const agg = aggregateSeverity(makeScore([]));
    expect(agg).toMatchObject({
      pointsAtRisk: 0,
      warningPointsLost: 0,
      totalPointsLost: 0,
      criticalCount: 0,
      warningCount: 0,
      goodCount: 0,
      worstSection: null,
    });
    expect(agg.bySection).toEqual({});
  });

  it("counts an all-good profile correctly", () => {
    const agg = aggregateSeverity(
      makeScore([
        makeCategory("a", 10, 10),
        makeCategory("b", 9, 10),
        makeCategory("c", 8, 10),
      ]),
    );
    expect(agg.criticalCount).toBe(0);
    expect(agg.warningCount).toBe(0);
    expect(agg.goodCount).toBe(3);
    expect(agg.pointsAtRisk).toBe(0);
    // worstSection still tracked (lowest ratio); 80% (8/10) is lowest.
    expect(agg.worstSection?.id).toBe("c");
  });

  it("counts an all-critical profile correctly", () => {
    const agg = aggregateSeverity(
      makeScore([
        makeCategory("a", 0, 10),
        makeCategory("b", 1, 10),
        makeCategory("c", 4, 10),
      ]),
    );
    expect(agg.criticalCount).toBe(3);
    expect(agg.warningCount).toBe(0);
    expect(agg.goodCount).toBe(0);
    // Sum of (max - points) for criticals: 10 + 9 + 6 = 25
    expect(agg.pointsAtRisk).toBe(25);
    expect(agg.totalPointsLost).toBe(25);
    expect(agg.worstSection?.id).toBe("a");
  });

  it("buckets a mixed profile and excludes warning loss from pointsAtRisk", () => {
    const agg = aggregateSeverity(
      makeScore([
        makeCategory("good-section", 10, 10),    // good
        makeCategory("warn-section", 6, 10),     // warning (60%)
        makeCategory("crit-section", 2, 10),     // critical (20%)
      ]),
    );
    expect(agg.criticalCount).toBe(1);
    expect(agg.warningCount).toBe(1);
    expect(agg.goodCount).toBe(1);
    expect(agg.pointsAtRisk).toBe(8);          // only crit (10-2)
    expect(agg.warningPointsLost).toBe(4);     // only warn (10-6)
    expect(agg.totalPointsLost).toBe(12);      // 0 + 4 + 8
    expect(agg.worstSection?.id).toBe("crit-section");
    expect(agg.bySection["good-section"]).toBe("good");
    expect(agg.bySection["warn-section"]).toBe("warning");
    expect(agg.bySection["crit-section"]).toBe("critical");
  });

  it("ignores zero-max categories in counts but adds them to bySection as good", () => {
    const agg = aggregateSeverity(
      makeScore([
        makeCategory("hidden", 0, 0),
        makeCategory("real", 5, 10),
      ]),
    );
    expect(agg.bySection["hidden"]).toBe("good");
    expect(agg.bySection["real"]).toBe("warning");
    expect(agg.goodCount).toBe(1);
    expect(agg.warningCount).toBe(1);
    expect(agg.criticalCount).toBe(0);
    expect(agg.totalPointsLost).toBe(5);
  });
});

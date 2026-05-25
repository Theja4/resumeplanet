import type { ProfileData } from "../adapter/types";

export type CheckStatus = "pass" | "warn" | "fail" | "absent" | "unread";

export interface ScoreContext {
  targetJobDescription?: string;
}

export interface CheckResult {
  id: string;
  label: string;
  points: number;
  max: number;
  status: CheckStatus;
  tip: string;
}

export type Check = (p: ProfileData, ctx: ScoreContext) => CheckResult;

export interface RegisteredCheck {
  category: "discoverability" | "completeness" | "content" | "signals" | "keywordMatch";
  check: Check;
  requiresTargetJobDescription?: boolean;
}

export interface CategoryScore {
  id: RegisteredCheck["category"];
  label: string;
  points: number;
  max: number;
  total: number;
  status: CheckStatus;
}

export interface ScoreResult {
  total: number;
  max: 100;
  earnedPoints: number;
  availablePoints: number;
  categories: CategoryScore[];
  checks: Array<CheckResult & { category: RegisteredCheck["category"] }>;
}

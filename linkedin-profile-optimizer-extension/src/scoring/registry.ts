import { completenessChecks } from "./checks/completeness";
import { contentChecks } from "./checks/content";
import { discoverabilityChecks } from "./checks/discoverability";
import { keywordMatch } from "./checks/keywordMatch";
import { signalChecks } from "./checks/signals";
import type { RegisteredCheck } from "./types";

export const CHECK_REGISTRY: RegisteredCheck[] = [
  ...discoverabilityChecks.map((check) => ({ category: "discoverability" as const, check })),
  ...completenessChecks.map((check) => ({ category: "completeness" as const, check })),
  ...contentChecks.map((check) => ({ category: "content" as const, check })),
  ...signalChecks.map((check) => ({ category: "signals" as const, check })),
  {
    category: "keywordMatch",
    check: keywordMatch,
    requiresTargetJobDescription: true,
  },
];

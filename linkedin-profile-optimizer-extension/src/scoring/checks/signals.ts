import { absentCheck, isUnread, result, unreadCheck } from "../helpers";
import type { Check } from "../types";

export const openToWorkSignal: Check = (profile) => {
  const label = "Open-to-work signal";
  const max = 6;
  const openToWorkField = profile.openToWork;
  if (isUnread(openToWorkField)) {
    return unreadCheck("open-to-work", label, max, "Couldn't read this section.");
  }

  if (openToWorkField!.value === true) {
    return result("open-to-work", label, max, max, "pass", "Open-to-work signal is visible.");
  }

  // Read cleanly, but the badge isn't on. That's a deliberate user choice
  // for many; treat as absent (4/6) instead of fail.
  return absentCheck(
    "open-to-work",
    label,
    max,
    "If you're actively searching, enable open-to-work to surface in recruiter filters.",
  );
};

export const recommendationsSignal: Check = (profile) => {
  const label = "Recommendations";
  const max = 7;
  const recommendationsField = profile.recommendationsCount;
  if (isUnread(recommendationsField)) {
    return unreadCheck("recommendations", label, max, "Couldn't read this section.");
  }

  const count = recommendationsField!.value ?? 0;
  if (count >= 3) {
    return result("recommendations", label, max, max, "pass", "Recommendations provide useful social proof.");
  }
  if (count >= 1) {
    return result("recommendations", label, 4, max, "warn", "Add a few more recommendations from managers or peers.");
  }
  // Zero recs is the LinkedIn-hides-the-section case. Surface it as
  // absent rather than fail so the language matches reality.
  return absentCheck(
    "recommendations",
    label,
    max,
    "No recommendations on your profile yet. Request 1-2 from managers or peers.",
  );
};

export const signalChecks = [openToWorkSignal, recommendationsSignal];

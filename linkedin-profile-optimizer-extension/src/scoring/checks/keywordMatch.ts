import { isUnread, profileText, result } from "../helpers";
import { containsKeyword, extractKeywords } from "../text";
import type { Check } from "../types";

export const keywordMatch: Check = (profile, ctx) => {
  const label = "Target JD keyword match";
  const max = 20;
  const jd = ctx.targetJobDescription?.trim() ?? "";
  const profileHaystack = profileText(profile).toLowerCase();

  if (!jd || !profileHaystack || (isUnread(profile.headline) && isUnread(profile.about) && isUnread(profile.experience))) {
    return {
      id: "keyword-match",
      label,
      points: 0,
      max,
      status: "unread",
      tip: "Paste a target job description to run keyword matching.",
    };
  }

  const keywords = extractKeywords(jd, 35);
  if (!keywords.length) {
    return result("keyword-match", label, 0, max, "unread", "The pasted job description did not contain enough keywords.");
  }

  const present = keywords.filter((keyword) => containsKeyword(profileHaystack, keyword));
  const ratio = present.length / keywords.length;
  const points = ratio * max;
  const percent = Math.round(ratio * 100);

  if (ratio >= 0.6) {
    return result("keyword-match", label, points, max, "pass", `${percent}% of target JD keywords appear in your profile.`);
  }
  if (ratio >= 0.3) {
    return result("keyword-match", label, points, max, "warn", `${percent}% keyword match. Add missing role-specific terms where truthful.`);
  }
  return result("keyword-match", label, points, max, "fail", `${percent}% keyword match. Mirror important JD terms that accurately fit your background.`);
};

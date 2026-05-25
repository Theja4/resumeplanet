import { absentCheck, isUnread, result, unreadCheck } from "../helpers";
import { extractKeywords } from "../text";
import type { Check } from "../types";

export const headlineKeywordDensity: Check = (profile) => {
  const label = "Headline keyword depth";
  const max = 15;
  const headlineField = profile.headline;
  if (isUnread(headlineField)) {
    return unreadCheck("headline-keywords", label, max, "Couldn't read this section.");
  }

  const headline = headlineField!.value ?? "";
  if (!headline.trim()) {
    return absentCheck("headline-keywords", label, max, "Write a headline that includes your role, domain, and target keywords.");
  }

  const keywords = extractKeywords(headline, 20);
  const bareTitleOnly =
    keywords.length <= 3 ||
    /^(software engineer|product manager|data analyst|data scientist|designer|student|consultant|founder|recruiter)$/i.test(
      headline.trim(),
    );

  if (bareTitleOnly) {
    return result(
      "headline-keywords",
      label,
      3,
      max,
      "fail",
      "Add domain, tools, audience, or outcomes so recruiter search has more terms to match.",
    );
  }

  if (keywords.length >= 8 && headline.length >= 45) {
    return result(
      "headline-keywords",
      label,
      max,
      max,
      "pass",
      "Your headline has enough searchable role and specialty terms.",
    );
  }

  return result(
    "headline-keywords",
    label,
    9,
    max,
    "warn",
    "Expand the headline beyond the title with 2-3 specialties or tools.",
  );
};

export const skillsCount: Check = (profile) => {
  const label = "Skills filter coverage";
  const max = 12;
  const skillsField = profile.skills;
  if (isUnread(skillsField)) {
    return unreadCheck("skills-count", label, max, "Couldn't read this section.");
  }

  const count = skillsField!.value?.length ?? 0;
  if (count === 0) {
    return absentCheck("skills-count", label, max, "Add at least 10 searchable skills so recruiter Boolean filters can match you.");
  }
  if (count >= 20) {
    return result("skills-count", label, max, max, "pass", "Your skills list gives recruiters useful filter matches.");
  }
  if (count >= 10) {
    return result("skills-count", label, 8, max, "warn", "Add more role-specific skills to strengthen Boolean filtering.");
  }
  return result("skills-count", label, Math.min(4, count), max, "fail", "Add at least 10 searchable skills.");
};

export const customUrl: Check = (profile) => {
  const label = "Custom profile URL";
  const max = 5;
  const customUrlField = profile.customUrl;
  if (isUnread(customUrlField)) {
    return unreadCheck("custom-url", label, max, "Couldn't read this section.");
  }

  return customUrlField!.value === true
    ? result("custom-url", label, max, max, "pass", "Your public URL is readable and shareable.")
    : result("custom-url", label, 1, max, "warn", "Use a clean linkedin.com/in URL with your name or brand.");
};

export const discoverabilityChecks = [headlineKeywordDensity, skillsCount, customUrl];

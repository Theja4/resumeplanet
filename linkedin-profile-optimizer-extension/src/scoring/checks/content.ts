import { absentCheck, experienceEntryText, isUnread, profileText, result, unreadCheck } from "../helpers";
import type { Check } from "../types";

const GENERIC_FILLER = [
  /\bhard[- ]working\b/i,
  /\bteam player\b/i,
  /\bresults[- ]oriented\b/i,
  /\bdetail[- ]oriented\b/i,
  /\bfast[- ]paced environment\b/i,
  /\bgo[- ]getter\b/i,
  /\bresponsible for\b/i,
  /\bpassionate about\b/i,
  /\bexcellent communication skills\b/i,
];

export const aboutHook: Check = (profile) => {
  const label = "About opening hook";
  const max = 10;
  const aboutField = profile.about;
  if (isUnread(aboutField)) return unreadCheck("about-hook", label, max, "Couldn't read this section.");

  const aboutText = aboutField!.value ?? "";
  if (!aboutText.trim()) {
    return absentCheck("about-hook", label, max, "Write an About section so the first 3 lines hook a recruiter.");
  }

  const firstLines = aboutText.split(/\n+/).slice(0, 3).join(" ");
  const hasRole = /\b(engineer|manager|designer|analyst|scientist|developer|consultant|leader|recruiter|marketer|operator)\b/i.test(firstLines);
  const hasImpact = /\b(grew|built|led|launched|reduced|increased|improved|scaled|saved|delivered|managed|revenue|users|customers)\b/i.test(firstLines);
  const startsGeneric = /^(i am|i'm|passionate|experienced professional)/i.test(firstLines.trim());

  if (hasRole && hasImpact && !startsGeneric) {
    return result("about-hook", label, max, max, "pass", "Your opening quickly states role and value.");
  }
  if (hasRole || hasImpact) {
    return result("about-hook", label, 6, max, "warn", "Make the first lines connect your role to measurable value.");
  }
  return result("about-hook", label, 2, max, "fail", "Lead with role, domain, and proof instead of a generic introduction.");
};

export const quantifiedExperienceBullets: Check = (profile) => {
  const label = "Quantified experience bullets";
  const max = 14;
  const experienceField = profile.experience;
  if (isUnread(experienceField)) {
    return unreadCheck("quantified-bullets", label, max, "Couldn't read this section.");
  }

  const entries = experienceField!.value ?? [];
  if (!entries.length) {
    return absentCheck("quantified-bullets", label, max, "Add experience entries with achievement bullets.");
  }

  const bullets = entries.flatMap((entry) => {
    if (entry.bullets?.value?.length) return entry.bullets.value;
    return experienceEntryText(entry).split(/\n|(?<=\.)\s+/).filter((line) => line.length > 30);
  });

  if (!bullets.length) {
    return absentCheck("quantified-bullets", label, max, "Add achievement bullets under each experience entry.");
  }

  const quantified = bullets.filter((bullet) => /\b(\d+[%$+]?|[1-9]x|million|billion|k\b)\b/i.test(bullet)).length;
  const ratio = quantified / bullets.length;

  if (ratio >= 0.5) return result("quantified-bullets", label, max, max, "pass", "A strong share of bullets includes numbers.");
  if (ratio >= 0.25) return result("quantified-bullets", label, 8, max, "warn", "Quantify more bullets with scope, volume, speed, revenue, or quality.");
  return result("quantified-bullets", label, 3, max, "fail", "Most experience bullets need measurable outcomes.");
};

export const genericFillerDetection: Check = (profile) => {
  const label = "Generic filler";
  const max = 10;
  const text = profileText(profile);
  if (!text.trim()) return unreadCheck("generic-filler", label, max, "Couldn't read enough profile text.");

  const matches = GENERIC_FILLER.filter((pattern) => pattern.test(text));
  if (!matches.length) return result("generic-filler", label, max, max, "pass", "No obvious filler phrases detected.");
  if (matches.length <= 2) return result("generic-filler", label, 6, max, "warn", "Replace generic phrases with concrete evidence.");
  return result("generic-filler", label, 2, max, "fail", "Remove repeated filler and replace it with specific outcomes.");
};

export const contentChecks = [aboutHook, quantifiedExperienceBullets, genericFillerDetection];

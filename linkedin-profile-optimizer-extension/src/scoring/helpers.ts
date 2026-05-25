import type { ExperienceEntry, FieldValue, ProfileData } from "../adapter/types";
import type { CheckResult, CheckStatus } from "./types";

export function isUnread<T>(field: FieldValue<T> | undefined): boolean {
  return (
    !field ||
    field.unread === true ||
    field.value === undefined ||
    field.value === null ||
    field.confidence <= 0
  );
}

export function unreadCheck(id: string, label: string, max: number, tip: string): CheckResult {
  return {
    id,
    label,
    points: 0,
    max,
    status: "unread",
    tip,
  };
}

/**
 * Reports a section we successfully read but found empty / not present on
 * the user's profile. Counts toward the denominator (it is a real read,
 * just a zero one) and gives the user a clear "you don't have this yet"
 * tip rather than the apologetic "couldn't read this section".
 */
export function absentCheck(id: string, label: string, max: number, tip: string): CheckResult {
  return {
    id,
    label,
    points: 0,
    max,
    status: "absent",
    tip,
  };
}

export function result(
  id: string,
  label: string,
  points: number,
  max: number,
  status: CheckStatus,
  tip: string,
): CheckResult {
  return {
    id,
    label,
    points: Math.max(0, Math.min(max, Math.round(points))),
    max,
    status,
    tip,
  };
}

export function profileText(profile: ProfileData): string {
  const parts: string[] = [];

  if (!isUnread(profile.headline)) parts.push(profile.headline?.value ?? "");
  if (!isUnread(profile.about)) parts.push(profile.about?.value ?? "");
  if (!isUnread(profile.skills)) parts.push(profile.skills?.value?.join(" ") ?? "");

  if (!isUnread(profile.experience)) {
    for (const entry of profile.experience?.value ?? []) {
      parts.push(experienceEntryText(entry));
    }
  }

  return parts.join("\n");
}

export function experienceEntryText(entry: ExperienceEntry): string {
  return [
    entry.title?.value,
    entry.company?.value,
    entry.description?.value,
    entry.bullets?.value?.join("\n"),
  ]
    .filter(Boolean)
    .join("\n");
}

export function words(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 3);
}

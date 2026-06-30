import type { ExperienceEntry } from "../adapter/types";

/**
 * Serialize up to the 3 most recent experience entries into the numbered,
 * bullet-prefixed block we feed to the rewrite / sync generators. Shared by
 * SectionRow's per-section rewrite (via RewriteCard.getRewriteFor) and the
 * full-profile ConsistencySync flow so both send identically-shaped input.
 */
export function serializeExperienceForPrompt(entries: ExperienceEntry[]): string {
  if (!entries.length) return "";
  return entries
    .slice(0, 3)
    .map((entry, index) => {
      const lines = [
        `[${index + 1}] ${entry.title?.value ?? "(no title)"} — ${entry.company?.value ?? "(no company)"}`,
      ];
      if (entry.description?.value) lines.push(entry.description.value);
      if (entry.bullets?.value?.length) {
        lines.push(...entry.bullets.value.map((bullet) => `• ${bullet}`));
      }
      return lines.join("\n");
    })
    .join("\n\n");
}

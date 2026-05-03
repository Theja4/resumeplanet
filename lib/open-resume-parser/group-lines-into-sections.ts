import type { ResumeKey } from "./types";
import type {
  Line,
  Lines,
  ResumeSectionToLines,
} from "./types";
import {
  hasLetterAndIsAllUpperCase,
  hasOnlyLettersSpacesAmpersands,
  isBold,
} from "./extract-resume-from-sections/lib/common-features";

export const PROFILE_SECTION: ResumeKey = "profile";

/**
 * Step 3. Group lines into sections
 *
 * Every section (except the profile section) starts with a section title that
 * takes up the entire line. This is a common pattern not just in resumes but
 * also in books and blogs. The resume parser uses this pattern to group lines
 * into the closest section title above these lines.
 */
export const groupLinesIntoSections = (lines: Lines) => {
  const sections: ResumeSectionToLines = {};
  let sectionName: string = PROFILE_SECTION;
  let sectionLines = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const text = line[0]?.text.trim();
    if (isSectionTitle(line, i, sectionName)) {
      sections[sectionName] = [...sectionLines];
      sectionName = text;
      sectionLines = [];
    } else {
      sectionLines.push(line);
    }
  }
  if (sectionLines.length > 0) {
    sections[sectionName] = [...sectionLines];
  }
  return sections;
};

const SECTION_TITLE_PRIMARY_KEYWORDS = [
  "experience",
  "education",
  "project",
  "skill",
];
const SECTION_TITLE_SECONDARY_KEYWORDS = [
  "job",
  "course",
  "extracurricular",
  "objective",
  "summary",
  "award",
  "honor",
  "project",
];
const SECTION_TITLE_KEYWORDS = [
  ...SECTION_TITLE_PRIMARY_KEYWORDS,
  ...SECTION_TITLE_SECONDARY_KEYWORDS,
];

// Exact section heading phrases for resumes that lack bold/uppercase formatting.
// These are safe to match without formatting cues because they are unambiguous
// section names that would not appear as job titles or content lines.
const EXACT_SECTION_HEADINGS = new Set([
  "skills", "technical skills", "core skills", "key skills",
  "areas of expertise", "core competencies", "competencies",
  "proficiencies", "technical proficiencies",
  "tools and technologies", "technologies", "technical stack",
  "certifications", "certificates", "professional certifications",
  "licenses", "credentials",
  "volunteer experience", "volunteer work", "community service",
  "languages", "language proficiency", "spoken languages",
  "interests", "hobbies", "personal interests",
  "publications", "research publications",
  "references",
  "awards", "honors", "awards and honors",
  "achievements", "accomplishments",
  "work experience", "professional experience", "employment history",
  "work history", "career history",
  "education", "educational background", "academic background",
  "projects", "personal projects", "academic projects",
  "professional summary", "career summary", "career objective",
  "about me", "profile", "objective",
]);

// Map of parent section keywords to sub-heading phrases that should NOT start
// a new section. e.g. "Technical Skills" under a "Skills" section is a sub-heading.
const SECTION_SUB_HEADINGS: Record<string, string[]> = {
  skill: [
    "technical skills", "core skills", "key skills", "soft skills",
    "hard skills", "tools and technologies", "technologies", "technical stack",
    "programming languages", "frameworks", "databases", "tools",
    "areas of expertise", "core competencies", "competencies",
    "proficiencies", "technical proficiencies",
  ],
  experience: [
    "relevant experience", "professional experience", "work history",
  ],
  education: [
    "academic background", "educational background",
  ],
};

/**
 * Check if a heading text is a sub-heading of the current section.
 * Returns true if the text should NOT start a new section.
 */
function isSubHeadingOf(textLower: string, currentSectionName: string): boolean {
  const currentLower = currentSectionName.toLowerCase();
  for (const [parentKeyword, subHeadings] of Object.entries(SECTION_SUB_HEADINGS)) {
    if (currentLower.includes(parentKeyword) && subHeadings.includes(textLower)) {
      return true;
    }
  }
  return false;
}

/**
 * Strip common decorations from a heading so it can match against known headings.
 * Handles: "1. Skills", "--- Education ---", "== Awards ==", "III. Experience",
 * "Skills:", numbering, and surrounding punctuation.
 */
function stripHeadingDecorations(text: string): string {
  return text
    // Strip leading numbering: "1.", "1)", "I.", "II.", "III.", "IV.", etc.
    .replace(/^(?:\d+[.)]\s*|[IVXLC]+[.)]\s*)/i, "")
    // Strip surrounding decorative chars: dashes, equals, underscores, pipes, asterisks
    .replace(/^[-=_|*~]+\s*/, "")
    .replace(/\s*[-=_|*~]+$/, "")
    // Strip trailing colon
    .replace(/:$/, "")
    .trim();
}

/**
 * Normalize heading text for matching: lowercase, strip decorations,
 * and expand "&" to "and".
 */
function normalizeForMatch(text: string): string {
  return stripHeadingDecorations(text)
    .toLowerCase()
    .replace(/\s*&\s*/g, " and ")
    .replace(/\s+/g, " ")
    .trim();
}

const isSectionTitle = (line: Line, lineNumber: number, currentSectionName: string) => {
  const isFirstTwoLines = lineNumber < 2;
  const hasMoreThanOneItemInLine = line.length > 1;
  const hasNoItemInLine = line.length === 0;
  if (isFirstTwoLines || hasMoreThanOneItemInLine || hasNoItemInLine) {
    return false;
  }

  const textItem = line[0];
  const text = textItem.text.trim();
  if (!text) return false;

  const textLower = text.toLowerCase();
  const normalized = normalizeForMatch(text);

  // If this looks like a sub-heading of the current section, keep it in
  // the current section rather than splitting. e.g. "Technical Skills"
  // under a "Skills" parent should not start a new section.
  if (isSubHeadingOf(normalized, currentSectionName)) {
    return false;
  }

  // Strong signal: bold AND all uppercase (classic well-formatted resume)
  if (isBold(textItem) && hasLetterAndIsAllUpperCase(textItem)) {
    return true;
  }

  // Bold OR all-uppercase with a keyword substring match — resumes from other
  // platforms often use only one of these formatting cues, but we still require
  // at least one formatting signal plus a keyword to avoid false positives
  if (
    (isBold(textItem) || hasLetterAndIsAllUpperCase(textItem)) &&
    hasOnlyLettersSpacesAmpersands(textItem) &&
    SECTION_TITLE_KEYWORDS.some((keyword) => textLower.includes(keyword))
  ) {
    return true;
  }

  // No formatting cues — match against exact known headings after stripping
  // decorations. e.g. "1. Skills", "--- Education ---", "Awards:" all match.
  if (EXACT_SECTION_HEADINGS.has(normalized)) {
    return true;
  }

  // Handle combined headings like "Education & Certifications" — if either
  // side of & / and matches a known heading, treat it as a section title
  if (normalized.includes(" and ")) {
    const parts = normalized.split(" and ").map(p => p.trim());
    if (parts.some(p => EXACT_SECTION_HEADINGS.has(p))) {
      return true;
    }
  }

  return false;
};

import type {
  ExperienceEntry,
  FieldValue,
  FieldValueType,
  ProfileField,
  StrategyName,
} from "./types";

const BOILERPLATE_LINES = new Set([
  "about",
  "experience",
  "education",
  "skills",
  "recommendations",
  "show all",
  "show more",
  "show less",
  "see more",
  "see less",
  "followers",
  "connections",
]);

// LinkedIn duplicates almost every label using
//   <span aria-hidden="true">visible text</span>
//   <span class="visually-hidden">screen reader text</span>
// or similar. element.textContent concatenates both with no separator,
// which breaks any line-based parser. We strip the screen-reader twin
// before reading text so downstream code sees what the user sees.
const SCREEN_READER_ONLY_SELECTOR = [
  ".visually-hidden",
  ".visually-hidden-focusable",
  ".a11y-text",
  ".sr-only",
  ".screen-reader-text",
  "[data-test-visually-hidden]",
].join(",");

export function clampConfidence(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

export function cleanText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export function visibleText(element: Element | Document | null | undefined): string {
  if (!element) return "";
  const lines = readableLines(element);
  return cleanText(lines.join("\n"));
}

/**
 * Reads the human-visible text of a LinkedIn DOM subtree as discrete lines.
 *
 * Approach:
 *   1. Clone the subtree so we don't mutate the live page.
 *   2. Remove screen-reader-only nodes (.visually-hidden et al.) so the
 *      duplicated text LinkedIn injects for screen readers does not smush
 *      together with the visible copy ("Software EngineerSoftware Engineer").
 *   3. Insert newline separators around block-level elements *and* around
 *      LinkedIn's <span aria-hidden="true"> visible-label wrapper, so siblings
 *      do not concatenate into one line.
 *   4. Run textContent through linesFromText, then dedupe consecutive
 *      duplicates as a final safety net for any twins we missed.
 *
 * We deliberately do NOT branch on "use only aria-hidden spans": text that
 * lives in plain elements (e.g. the headline <div class="text-body-medium">
 * and the H1 user name) is not wrapped in an aria-hidden span and would be
 * silently dropped by that branch.
 */
export function readableLines(
  element: Element | Document | null | undefined,
): string[] {
  if (!element) return [];
  const root: Element | null =
    element instanceof Document ? element.body : element;
  if (!root) return [];

  const clone = root.cloneNode(true) as Element;
  for (const hidden of Array.from(
    clone.querySelectorAll(SCREEN_READER_ONLY_SELECTOR),
  )) {
    hidden.remove();
  }

  for (const block of Array.from(
    clone.querySelectorAll(
      "br, p, li, h1, h2, h3, h4, h5, h6, div, section, header, footer, article, ul, ol, span[aria-hidden='true']",
    ),
  )) {
    block.insertAdjacentText("beforebegin", "\n");
    block.insertAdjacentText("afterend", "\n");
  }

  return dedupeConsecutive(linesFromText(clone.textContent ?? ""));
}

export function linesFromText(text: string): string[] {
  return cleanText(text)
    .split(/\n| {2,}/)
    .map((line) => cleanText(line))
    .filter(Boolean)
    .filter((line) => !BOILERPLATE_LINES.has(line.toLowerCase()));
}

export function dedupeConsecutive(values: string[]): string[] {
  const result: string[] = [];
  let last = "";
  for (const value of values) {
    if (!value || value === last) continue;
    result.push(value);
    last = value;
  }
  return result;
}

export function uniqueStrings(values: unknown[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const text = cleanText(value);
    const key = text.toLowerCase();
    if (!text || seen.has(key)) continue;
    seen.add(key);
    result.push(text);
  }

  return result;
}

export function fieldValue<T>(
  value: T,
  confidence: number,
  source: StrategyName,
): FieldValue<T> {
  return {
    value,
    confidence: clampConfidence(confidence),
    source,
  };
}

export function unreadField<T>(): FieldValue<T> {
  return {
    confidence: 0,
    unread: true,
  };
}

export function isEmptyValue(value: unknown, valueType: FieldValueType): boolean {
  if (value === undefined || value === null) return true;
  if (valueType === "boolean") return typeof value !== "boolean";
  if (valueType === "number") return typeof value !== "number" || Number.isNaN(value);
  if (valueType === "string") return cleanText(value).length === 0;
  if (valueType === "string[]") return !Array.isArray(value) || value.length === 0;
  if (valueType === "experience[]") return !Array.isArray(value);
  return true;
}

export function normalizeByType(
  value: unknown,
  valueType: FieldValueType,
): string | string[] | boolean | number | ExperienceEntry[] | undefined {
  if (valueType === "string") {
    const text = cleanText(value);
    return text || undefined;
  }

  if (valueType === "string[]") {
    const values = Array.isArray(value) ? value : [value];
    const strings = uniqueStrings(values);
    return strings.length ? strings : undefined;
  }

  if (valueType === "boolean") {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      if (/^(true|yes|present|1)$/i.test(value.trim())) return true;
      if (/^(false|no|absent|0)$/i.test(value.trim())) return false;
    }
    return undefined;
  }

  if (valueType === "number") {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const match = value.replace(/,/g, "").match(/\d+/);
      return match ? Number(match[0]) : undefined;
    }
    return undefined;
  }

  if (valueType === "experience[]") {
    return Array.isArray(value) ? (value as ExperienceEntry[]) : undefined;
  }

  return undefined;
}

export function matchesAny(text: string, patterns: string[] | undefined): boolean {
  if (!patterns?.length) return false;

  return patterns.some((pattern) => {
    try {
      return new RegExp(pattern, "i").test(text);
    } catch {
      return text.toLowerCase().includes(pattern.toLowerCase());
    }
  });
}

export function createTextField(
  value: unknown,
  confidence: number,
  source: StrategyName,
): FieldValue<string> | undefined {
  const text = cleanText(value);
  return text ? fieldValue(text, confidence, source) : undefined;
}

export function createStringArrayField(
  value: unknown,
  confidence: number,
  source: StrategyName,
): FieldValue<string[]> | undefined {
  const strings = uniqueStrings(Array.isArray(value) ? value : [value]);
  return strings.length ? fieldValue(strings, confidence, source) : undefined;
}

export function valueSourceLabel(field: ProfileField): string {
  return field.replace(/[A-Z]/g, (letter) => ` ${letter.toLowerCase()}`);
}

import type { ExperienceEntry, ExtractionResult, StrategyFieldConfig } from "../types";
import {
  cleanText,
  createStringArrayField,
  createTextField,
  linesFromText,
  matchesAny,
  uniqueStrings,
} from "../normalize";

export function embeddedJson(
  document: Document,
  fieldConfig: StrategyFieldConfig,
): ExtractionResult {
  const roots = collectJsonRoots(document);
  const confidence = fieldConfig.strategyConfig.confidence ?? 0.75;

  if (!roots.length) {
    return { confidence: 0, source: "embeddedJson", reason: "no-json-roots" };
  }

  const value =
    extractFromPaths(roots, fieldConfig) ??
    extractByTypeFromDeepSearch(roots, fieldConfig);

  return {
    value,
    confidence: value === undefined ? 0 : confidence,
    source: "embeddedJson",
  };
}

function collectJsonRoots(document: Document): unknown[] {
  const roots: unknown[] = [];
  const nodes = Array.from(
    document.querySelectorAll<HTMLScriptElement | HTMLElement>(
      "script[type*='json'], script[type='application/ld+json'], code[id^='bpr-guid-']",
    ),
  );

  for (const node of nodes) {
    const text = node.textContent?.trim();
    if (!text) continue;

    const parsed = safeJsonParse(text);
    if (parsed !== undefined) roots.push(parsed);
  }

  return roots;
}

function safeJsonParse(text: string): unknown | undefined {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function extractFromPaths(
  roots: unknown[],
  fieldConfig: StrategyFieldConfig,
): unknown | undefined {
  const hints = fieldConfig.strategyConfig.jsonPathHints ?? [];
  if (!hints.length) return undefined;

  for (const root of roots) {
    for (const hint of hints) {
      const values = valuesAtLoosePath(root, hint);
      const normalized = normalizeCandidateValues(values, fieldConfig);
      if (normalized !== undefined) return normalized;
    }
  }

  return undefined;
}

function extractByTypeFromDeepSearch(
  roots: unknown[],
  fieldConfig: StrategyFieldConfig,
): unknown | undefined {
  if (fieldConfig.valueType === "experience[]") {
    return extractExperience(roots, fieldConfig);
  }

  const keyHints = fieldConfig.strategyConfig.jsonKeyHints ?? [];
  const values: unknown[] = [];

  for (const root of roots) {
    visitJson(root, (value, key) => {
      if (!key || !keyHints.some((hint) => key.toLowerCase().includes(hint.toLowerCase()))) {
        return;
      }
      values.push(value);
    });
  }

  const normalized = normalizeCandidateValues(values, fieldConfig);
  if (normalized !== undefined) return normalized;

  if (fieldConfig.valueType === "boolean" && fieldConfig.strategyConfig.patterns?.length) {
    const text = roots.map((root) => JSON.stringify(root)).join(" ");
    return matchesAny(text, fieldConfig.strategyConfig.patterns);
  }

  return undefined;
}

function normalizeCandidateValues(
  values: unknown[],
  fieldConfig: StrategyFieldConfig,
): unknown | undefined {
  const flattened = flattenValues(values);

  if (fieldConfig.valueType === "string") {
    const best = flattened
      .map((value) => cleanText(value))
      .filter((value) => value.length >= 2 && value.length <= 1000)
      .sort((a, b) => scoreStringCandidate(b, fieldConfig) - scoreStringCandidate(a, fieldConfig))[0];
    return best || undefined;
  }

  if (fieldConfig.valueType === "string[]") {
    const strings = uniqueStrings(
      flattened.flatMap((value) => {
        if (typeof value === "string") return linesFromText(value);
        if (isObject(value)) {
          return ["name", "skillName", "schoolName", "degreeName", "title"]
            .map((key) => getStringByKeys(value, [key]))
            .filter(Boolean);
        }
        return [];
      }),
    );
    return strings.length ? strings.slice(0, 80) : undefined;
  }

  if (fieldConfig.valueType === "boolean") {
    // For image-presence fields (hasPhoto / hasBanner) LinkedIn often
    // emits the JSON key even when the user has NOT set a custom photo
    // or banner — value can be null, "", an empty object, or an object
    // whose every leaf string is empty (e.g. { artifacts: [] }). Plain
    // `Boolean(value)` is true for any non-null object, which produces
    // the false-positive "Banner image — passing" entry users see when
    // their banner is actually empty.
    //
    // For these image fields we require an actual non-empty string
    // somewhere in the value tree (a real URL, vanity slug, or media
    // ref). For all other boolean fields we keep the original loose
    // truthy check.
    const isImagePresenceField =
      fieldConfig.field === "hasBanner" || fieldConfig.field === "hasPhoto";

    if (isImagePresenceField) {
      if (flattened.some((value) => hasNonEmptyStringDeep(value))) return true;
      // We saw the key but it carried no real content — treat as absent.
      if (flattened.length > 0) return false;
      return undefined;
    }

    if (flattened.some((value) => Boolean(value))) return true;
    if (flattened.some((value) => value === false)) return false;
    return undefined;
  }

  if (fieldConfig.valueType === "number") {
    for (const value of flattened) {
      if (typeof value === "number" && Number.isFinite(value)) return value;
      if (typeof value === "string") {
        const match = value.replace(/,/g, "").match(/\d+/);
        if (match) return Number(match[0]);
      }
    }
  }

  return undefined;
}

function extractExperience(
  roots: unknown[],
  fieldConfig: StrategyFieldConfig,
): ExperienceEntry[] | undefined {
  const entries: ExperienceEntry[] = [];

  for (const root of roots) {
    visitJson(root, (value) => {
      if (!isObject(value)) return;

      const title = getStringByKeys(value, [
        "title",
        "positionTitle",
        "localizedName",
        "occupation",
      ]);
      const company = getStringByKeys(value, [
        "companyName",
        "company",
        "organizationName",
        "name",
      ]);
      const description = getStringByKeys(value, [
        "description",
        "summary",
        "miniCompany",
        "companyUrn",
      ]);

      if (!title || !company || title === company) return;
      if (!looksLikeExperienceTitle(title)) return;

      const bullets = linesFromText(description).filter((line) => line.length > 12);
      const confidence = fieldConfig.strategyConfig.confidence ?? 0.75;
      entries.push({
        title: createTextField(title, confidence, "embeddedJson"),
        company: createTextField(company, confidence, "embeddedJson"),
        description: createTextField(description, confidence * 0.9, "embeddedJson"),
        bullets: createStringArrayField(bullets, confidence * 0.8, "embeddedJson"),
      });
    });
  }

  const unique = dedupeExperience(entries);
  return unique.length ? unique.slice(0, 30) : undefined;
}

function valuesAtLoosePath(root: unknown, path: string): unknown[] {
  const parts = path.split(".").filter(Boolean);
  let current: unknown[] = [root];

  for (const part of parts) {
    const next: unknown[] = [];
    for (const value of current) {
      if (Array.isArray(value)) {
        next.push(...value.flatMap((item) => readLooseKey(item, part)));
      } else {
        next.push(...readLooseKey(value, part));
      }
    }
    current = next;
  }

  return current;
}

function readLooseKey(value: unknown, key: string): unknown[] {
  if (!isObject(value)) return [];
  const exact = Object.entries(value).find(([candidate]) => candidate === key);
  if (exact) return [exact[1]];

  const lower = key.toLowerCase();
  return Object.entries(value)
    .filter(([candidate]) => candidate.toLowerCase().includes(lower))
    .map(([, candidateValue]) => candidateValue);
}

function visitJson(
  value: unknown,
  visitor: (value: unknown, key?: string) => void,
  seen = new WeakSet<object>(),
): void {
  if (isObject(value)) {
    if (seen.has(value)) return;
    seen.add(value);
    for (const [key, child] of Object.entries(value)) {
      visitor(child, key);
      visitJson(child, visitor, seen);
    }
    return;
  }

  if (Array.isArray(value)) {
    for (const child of value) {
      visitor(child);
      visitJson(child, visitor, seen);
    }
  }
}

function flattenValues(values: unknown[]): unknown[] {
  const result: unknown[] = [];

  for (const value of values) {
    if (Array.isArray(value)) {
      result.push(...flattenValues(value));
    } else if (isObject(value)) {
      result.push(value);
      for (const child of Object.values(value)) result.push(child);
    } else {
      result.push(value);
    }
  }

  return result;
}

function getStringByKeys(value: Record<string, unknown>, keys: string[]): string {
  for (const [candidateKey, candidateValue] of Object.entries(value)) {
    if (!keys.some((key) => candidateKey.toLowerCase().includes(key.toLowerCase()))) {
      continue;
    }

    if (typeof candidateValue === "string") return cleanText(candidateValue);
    if (isObject(candidateValue)) {
      const nested = getStringByKeys(candidateValue, ["text", "name", "localizedName"]);
      if (nested) return nested;
    }
  }

  return "";
}

function scoreStringCandidate(value: string, fieldConfig: StrategyFieldConfig): number {
  let score = value.length;
  if (fieldConfig.field === "headline" && value.length > 220) score -= 400;
  if (fieldConfig.field === "about" && value.length < 40) score -= 100;
  if (fieldConfig.strategyConfig.excludeText?.some((text) => value.toLowerCase().includes(text))) {
    score -= 200;
  }
  return score;
}

function looksLikeExperienceTitle(value: string): boolean {
  if (value.length < 2 || value.length > 180) return false;
  return !/^(linkedin|experience|education|skills|about)$/i.test(value);
}

function dedupeExperience(entries: ExperienceEntry[]): ExperienceEntry[] {
  const seen = new Set<string>();
  const result: ExperienceEntry[] = [];

  for (const entry of entries) {
    const key = `${entry.title?.value ?? ""}|${entry.company?.value ?? ""}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(entry);
  }

  return result;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Recursive "is there any actual content here?" check used for image
 * presence detection. Returns true if `value` (or any descendant in an
 * array/object tree) is a non-empty trimmed string. Used to defeat
 * LinkedIn JSON shapes like { artifacts: [] }, { url: "" }, or null
 * placeholders that would otherwise read as truthy via plain Boolean().
 *
 * Caps recursion depth so a maliciously-deep structure can't hang the
 * scan. Numbers/booleans don't count — for image presence we want a
 * real URL/string somewhere.
 */
function hasNonEmptyStringDeep(value: unknown, depth = 0): boolean {
  if (depth > 6) return false;
  if (value == null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) {
    return value.some((item) => hasNonEmptyStringDeep(item, depth + 1));
  }
  if (isObject(value)) {
    return Object.values(value).some((item) =>
      hasNonEmptyStringDeep(item, depth + 1),
    );
  }
  return false;
}

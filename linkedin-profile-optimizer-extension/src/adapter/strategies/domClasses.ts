import type { ExperienceEntry, ExtractionResult, StrategyFieldConfig } from "../types";
import {
  cleanText,
  createStringArrayField,
  createTextField,
  linesFromText,
  uniqueStrings,
  visibleText,
} from "../normalize";

export function domClasses(
  document: Document,
  fieldConfig: StrategyFieldConfig,
): ExtractionResult {
  const confidence = fieldConfig.strategyConfig.confidence ?? 0.42;

  try {
    const value = extractDomValue(document, fieldConfig, confidence);
    return {
      value,
      confidence: value === undefined ? 0 : confidence,
      source: "domClasses",
    };
  } catch {
    return { confidence: 0, source: "domClasses", reason: "selector-error" };
  }
}

function extractDomValue(
  document: Document,
  fieldConfig: StrategyFieldConfig,
  confidence: number,
): unknown | undefined {
  const roots = selectAll(document, fieldConfig.strategyConfig.selectors ?? []);

  if (fieldConfig.valueType === "boolean") {
    return roots.length ? true : undefined;
  }

  if (fieldConfig.field === "experience") {
    return extractExperience(roots, fieldConfig, confidence);
  }

  if (fieldConfig.valueType === "string") {
    return roots.map(readNodeValue(fieldConfig)).find((value) => value.length > 0);
  }

  if (fieldConfig.valueType === "string[]") {
    const itemSelectors = fieldConfig.strategyConfig.itemSelectors ?? [];
    const items = itemSelectors.length
      ? roots.flatMap((root) => selectAll(root, itemSelectors))
      : roots;
    const values = uniqueStrings(items.flatMap((item) => linesFromText(visibleText(item))));
    return values.length ? values.slice(0, 80) : undefined;
  }

  if (fieldConfig.valueType === "number") {
    const text = roots.map((root) => visibleText(root)).join(" ");
    const match = text.replace(/,/g, "").match(/\d+/);
    return match ? Number(match[0]) : undefined;
  }

  return undefined;
}

function extractExperience(
  roots: Element[],
  fieldConfig: StrategyFieldConfig,
  confidence: number,
): ExperienceEntry[] | undefined {
  const itemSelectors = fieldConfig.strategyConfig.itemSelectors ?? [];
  const items = itemSelectors.length
    ? roots.flatMap((root) => selectAll(root, itemSelectors))
    : roots;

  const entries = items
    .flatMap((item): ExperienceEntry[] => {
      const lines = linesFromText(visibleText(item)).filter((line) => line.length > 2);
      if (!lines.length) return [];
      const title = lines[0];
      const company = lines[1] ?? "";
      const descriptionLines = lines.slice(2).filter((line) => line.length > 20);
      const bullets = descriptionLines.filter((line) => /^[-*•]|\d/.test(line));

      const entry: ExperienceEntry = {
        title: createTextField(title, confidence, "domClasses"),
        company: createTextField(company, confidence * 0.9, "domClasses"),
        description: createTextField(descriptionLines.join("\n"), confidence * 0.78, "domClasses"),
        bullets: createStringArrayField(bullets, confidence * 0.72, "domClasses"),
      };
      return entry.title?.value || entry.company?.value ? [entry] : [];
    })
    .filter((entry) => Boolean(entry.title?.value || entry.company?.value));

  return entries.length ? entries.slice(0, 30) : undefined;
}

function selectAll(root: ParentNode, selectors: string[]): Element[] {
  const elements: Element[] = [];

  for (const selector of selectors) {
    try {
      elements.push(...Array.from(root.querySelectorAll(selector)));
    } catch {
      continue;
    }
  }

  return elements;
}

function readNodeValue(fieldConfig: StrategyFieldConfig): (element: Element) => string {
  return (element) => {
    const attribute = fieldConfig.strategyConfig.attribute;
    if (attribute) return cleanText(element.getAttribute(attribute) ?? "");
    return visibleText(element);
  };
}

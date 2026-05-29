import { DEFAULT_SELECTOR_CONFIG } from "./config";
import { debugGroup, debugLog } from "./debug";
import {
  fieldValue,
  isEmptyValue,
  normalizeByType,
  unreadField,
} from "./normalize";
import { domClasses } from "./strategies/domClasses";
import { embeddedJson } from "./strategies/embeddedJson";
import { semantic } from "./strategies/semantic";
import type {
  ExtractionStrategy,
  FieldSelectorConfig,
  FieldValue,
  ProfileData,
  ProfileField,
  SelectorConfig,
  StrategyFieldConfig,
  StrategyName,
} from "./types";

const STRATEGIES: Record<StrategyName, ExtractionStrategy> = {
  embeddedJson,
  semantic,
  domClasses,
};

const PROFILE_FIELDS: ProfileField[] = [
  "headline",
  "about",
  "experience",
  "skills",
  "education",
  "hasPhoto",
  "hasBanner",
  "customUrl",
  "openToWork",
  "recommendationsCount",
];

export function extractProfileData(
  document: Document,
  selectorConfig: SelectorConfig = DEFAULT_SELECTOR_CONFIG,
): ProfileData {
  const profile: Partial<Record<ProfileField, FieldValue<unknown>>> = {};

  debugLog("scan start", new Date().toISOString(), "url", document.location.href);
  emitDomProbe(document);
  debugGroup("extractProfileData", () => {
    for (const field of PROFILE_FIELDS) {
      const fieldConfig = selectorConfig.fields[field];
      profile[field] = fieldConfig
        ? extractField(document, fieldConfig, selectorConfig)
        : unreadField();
      const value = profile[field];
      debugLog(
        "field",
        field,
        value?.unread ? "UNREAD" : "READ",
        "via",
        value?.source ?? "-",
        "value",
        value?.value,
      );
    }
  });

  return profile as ProfileData;
}

function extractField<T>(
  document: Document,
  fieldConfig: FieldSelectorConfig,
  selectorConfig: SelectorConfig,
): FieldValue<T> {
  const threshold = fieldConfig.threshold ?? selectorConfig.minConfidence;

  for (const strategyConfig of fieldConfig.strategies) {
    const runner = STRATEGIES[strategyConfig.strategy];
    if (!runner) continue;

    try {
      const strategyFieldConfig: StrategyFieldConfig = {
        ...fieldConfig,
        strategyConfig,
      };
      const result = runner(document, strategyFieldConfig);
      const confidence = Math.min(1, result.confidence || strategyConfig.confidence || 0);

      debugLog(
        "strategy",
        fieldConfig.field,
        strategyConfig.strategy,
        "confidence",
        confidence,
        "value",
        result.value,
      );

      if (confidence < threshold || isEmptyValue(result.value, fieldConfig.valueType)) {
        continue;
      }

      const normalized = normalizeByType(result.value, fieldConfig.valueType);
      if (normalized === undefined || isEmptyValue(normalized, fieldConfig.valueType)) {
        continue;
      }

      return fieldValue(
        normalized as T,
        confidence,
        result.source ?? strategyConfig.strategy,
      );
    } catch (error) {
      debugLog(
        "strategy-error",
        fieldConfig.field,
        strategyConfig.strategy,
        error instanceof Error ? error.message : String(error),
      );
      continue;
    }
  }

  return unreadField<T>();
}

/**
 * One-shot dump of the DOM landmarks we care about, written to the debug
 * trace at the start of every scan. Lets us see what's actually on the
 * page (especially on rare LinkedIn render variants like
 * ?isSelfProfile=true) without asking the user to run anything in
 * DevTools.
 */
function emitDomProbe(document: Document): void {
  const main = document.querySelector("main");
  const root = main ?? document.body;
  if (!root) {
    debugLog("dom-probe", "no main, no body");
    return;
  }

  debugLog("dom-probe main?", Boolean(main), "url", document.location.href);

  const headings = Array.from(
    root.querySelectorAll<HTMLElement>("h1, h2, h3, [role='heading']"),
  )
    .slice(0, 25)
    .map((heading) => {
      const text = (heading.textContent ?? "").trim().replace(/\s+/g, " ");
      return text.slice(0, 60);
    })
    .filter(Boolean);
  debugLog("dom-probe headings", headings);

  const isIconId = (id: string): boolean => {
    return (
      // LinkedIn ships SVG sprite icons whose ids match these patterns;
      // they dominate the first dozens of [id] elements on the page and
      // crowd out the actual section anchors.
      /-(small|medium|large|xsmall|xlarge|x-small|x-large)$/i.test(id) ||
      /-accent-\d+$/i.test(id) ||
      /^icon-/i.test(id) ||
      /-icon$/i.test(id)
    );
  };

  const interestingIds = Array.from(root.querySelectorAll<HTMLElement>("[id]"))
    .map((element) => element.id)
    .filter(
      (id) =>
        id &&
        id.length < 80 &&
        !id.startsWith("ember") &&
        !id.startsWith("ariaLive") &&
        !id.startsWith("__") &&
        !id.startsWith("ad-banner") &&
        !isIconId(id),
    )
    .slice(0, 50);
  debugLog("dom-probe ids", interestingIds);

  // Probe ALL <section> elements regardless of class. The newer
  // hashed-CSS-class LinkedIn variant doesn't use .artdeco-card, so a
  // class-based scan misses every section. By tag we always see them.
  const sections = Array.from(root.querySelectorAll<HTMLElement>("section")).slice(
    0,
    20,
  );
  for (let index = 0; index < sections.length; index += 1) {
    const card = sections[index];
    const classes = (card.className || "").split(/\s+/).filter(Boolean).slice(0, 3).join(".");
    const ids = Array.from(card.querySelectorAll<HTMLElement>("[id]"))
      .map((element) => element.id)
      .filter((id) => id && id.length < 60 && !id.startsWith("ember") && !isIconId(id))
      .slice(0, 4);
    const firstHeading = card.querySelector("h1, h2, h3, [role='heading']");
    const firstHeadingText = firstHeading
      ? (firstHeading.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 60)
      : "";
    debugLog(
      "dom-probe section",
      index,
      classes ? `.${classes}` : "(no-class)",
      "heading",
      firstHeadingText || "(none)",
      "ids",
      ids,
    );
  }
}

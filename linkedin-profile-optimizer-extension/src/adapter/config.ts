import { REZOOMED_BASE_URL } from "../config/env";
import type {
  FieldSelectorConfig,
  ProfileField,
  SelectorConfig,
  StrategyName,
  StrategySelector,
} from "./types";

const ADAPTER_CONFIG_PATH = "/api/linkedin/adapter-config";
const REMOTE_FETCH_TIMEOUT_MS = 4000;
const CACHE_STORAGE_KEY = "rezoomed.selectorConfig.v1";

export const DEFAULT_SELECTOR_CONFIG: SelectorConfig = {
  version: "2026-05-24.default",
  minConfidence: 0.55,
  cache: {
    key: "rezoomed.selectorConfig.v1",
    ttlMs: 1000 * 60 * 60 * 12,
  },
  fields: {
    headline: {
      field: "headline",
      valueType: "string",
      threshold: 0.56,
      strategies: [
        {
          strategy: "embeddedJson",
          confidence: 0.9,
          jsonPathHints: ["headline", "occupation", "profile.headline"],
          jsonKeyHints: ["headline", "occupation"],
        },
        {
          strategy: "semantic",
          confidence: 0.74,
          ariaLabels: ["headline"],
          excludeText: ["contact info", "connections", "followers"],
        },
        {
          strategy: "domClasses",
          confidence: 0.48,
          selectors: [
            ".pv-text-details__left-panel .text-body-medium",
            ".text-body-medium.break-words",
            "main h1 + div .text-body-medium",
          ],
        },
      ],
    },
    about: {
      field: "about",
      valueType: "string",
      threshold: 0.58,
      strategies: [
        {
          strategy: "embeddedJson",
          confidence: 0.88,
          jsonPathHints: ["summary", "about", "profile.summary"],
          jsonKeyHints: ["summary", "about"],
        },
        {
          strategy: "semantic",
          confidence: 0.75,
          rootSelectors: [
            "#about",
            "div[data-section='summary']",
            "section [data-field='summary']",
          ],
          sectionHeadings: ["About"],
        },
        {
          strategy: "domClasses",
          confidence: 0.48,
          selectors: [
            "section.artdeco-card:has(#about) .display-flex.ph5.pv3",
            "section.artdeco-card:has(#about) .inline-show-more-text",
            "section.pv-profile-card:has(#about)",
            "section:has(#about)",
            ".pv-about-section",
            ".pv-shared-text-with-see-more",
          ],
        },
      ],
    },
    experience: {
      field: "experience",
      valueType: "experience[]",
      threshold: 0.56,
      strategies: [
        {
          strategy: "embeddedJson",
          confidence: 0.84,
          jsonPathHints: [
            "experience",
            "positions",
            "positionView",
            "elements",
          ],
          jsonKeyHints: ["experience", "positions", "companyName", "title"],
        },
        {
          strategy: "semantic",
          confidence: 0.72,
          rootSelectors: [
            "#experience",
            "div[data-section='experience']",
          ],
          sectionHeadings: ["Experience"],
        },
        {
          strategy: "domClasses",
          confidence: 0.45,
          selectors: [
            "section.artdeco-card:has(#experience)",
            "section.pv-profile-card:has(#experience)",
            "section:has(#experience)",
            ".experience-section",
          ],
          itemSelectors: [
            "li.artdeco-list__item",
            "li.pvs-list__item--with-top-padding",
            "li.pvs-list__paged-list-item",
            ".pv-entity__position-group-pager",
          ],
          bulletSelectors: ["li", ".pvs-list__item--with-top-padding"],
        },
      ],
    },
    skills: {
      field: "skills",
      valueType: "string[]",
      threshold: 0.55,
      strategies: [
        {
          strategy: "embeddedJson",
          confidence: 0.83,
          jsonPathHints: ["skills", "skillView", "elements"],
          jsonKeyHints: ["skill", "skillName"],
        },
        {
          strategy: "semantic",
          confidence: 0.71,
          rootSelectors: [
            "#skills",
            "div[data-section='skills']",
          ],
          sectionHeadings: ["Skills"],
        },
        {
          strategy: "domClasses",
          confidence: 0.45,
          selectors: [
            "section.artdeco-card:has(#skills)",
            "section.pv-profile-card:has(#skills)",
            "section:has(#skills)",
            ".pv-skill-categories-section",
          ],
          itemSelectors: [
            "li.artdeco-list__item",
            "li.pvs-list__item--with-top-padding",
            "li.pvs-list__paged-list-item",
            "li",
          ],
        },
      ],
    },
    education: {
      field: "education",
      valueType: "string[]",
      threshold: 0.55,
      strategies: [
        {
          strategy: "embeddedJson",
          confidence: 0.82,
          jsonPathHints: [
            "education",
            "educationView",
            "schoolName",
          ],
          jsonKeyHints: ["schoolName", "degreeName", "education"],
        },
        {
          strategy: "semantic",
          confidence: 0.7,
          rootSelectors: [
            "#education",
            "div[data-section='education']",
          ],
          sectionHeadings: ["Education"],
        },
        {
          strategy: "domClasses",
          confidence: 0.45,
          selectors: [
            "section.artdeco-card:has(#education)",
            "section.pv-profile-card:has(#education)",
            "section:has(#education)",
            ".education-section",
          ],
          itemSelectors: [
            "li.artdeco-list__item",
            "li.pvs-list__item--with-top-padding",
            "li.pvs-list__paged-list-item",
            "li",
          ],
        },
      ],
    },
    hasPhoto: {
      field: "hasPhoto",
      valueType: "boolean",
      threshold: 0.55,
      strategies: [
        {
          strategy: "embeddedJson",
          confidence: 0.76,
          jsonKeyHints: [
            "profilePicture",
            "displayImageReference",
            "profilePictureDisplayImage",
          ],
        },
        {
          strategy: "semantic",
          confidence: 0.68,
          ariaLabels: ["profile photo", "profile picture"],
          patterns: ["profile photo", "profile picture"],
        },
        {
          strategy: "domClasses",
          confidence: 0.44,
          selectors: [
            ".pv-top-card-profile-picture__image",
            ".pv-top-card__photo",
            "img[alt*='profile photo' i]",
            "img[alt*='profile picture' i]",
          ],
        },
      ],
    },
    hasBanner: {
      field: "hasBanner",
      valueType: "boolean",
      threshold: 0.52,
      strategies: [
        {
          strategy: "embeddedJson",
          confidence: 0.7,
          jsonKeyHints: [
            "backgroundImage",
            "profileBackgroundImage",
            "backgroundPicture",
          ],
        },
        {
          strategy: "semantic",
          confidence: 0.62,
          ariaLabels: ["background image", "cover image"],
          patterns: ["background image", "cover image"],
        },
        {
          strategy: "domClasses",
          confidence: 0.42,
          selectors: [
            ".profile-background-image__image",
            ".pv-top-card__background-image",
            "img[alt*='background image' i]",
            "img[alt*='cover image' i]",
          ],
        },
      ],
    },
    customUrl: {
      field: "customUrl",
      valueType: "boolean",
      threshold: 0.7,
      strategies: [
        {
          strategy: "semantic",
          confidence: 0.9,
          patterns: ["^/in/[a-z0-9][a-z0-9-]{2,99}/?$"],
        },
      ],
    },
    openToWork: {
      field: "openToWork",
      valueType: "boolean",
      threshold: 0.52,
      strategies: [
        {
          strategy: "embeddedJson",
          confidence: 0.72,
          jsonKeyHints: ["openToWork", "jobSeekingPreferences", "openTo"],
          patterns: ["open to work"],
        },
        {
          strategy: "semantic",
          confidence: 0.66,
          patterns: ["open to work", "open-to-work", "#opentowork"],
        },
        {
          strategy: "domClasses",
          confidence: 0.42,
          selectors: [
            "img[alt*='Open to work' i]",
            "[aria-label*='Open to work' i]",
          ],
        },
      ],
    },
    recommendationsCount: {
      field: "recommendationsCount",
      valueType: "number",
      threshold: 0.5,
      strategies: [
        {
          strategy: "embeddedJson",
          confidence: 0.74,
          jsonKeyHints: [
            "recommendationsCount",
            "recommendationCount",
            "numRecommendations",
          ],
        },
        {
          strategy: "semantic",
          confidence: 0.63,
          rootSelectors: [
            "#recommendations",
            "div[data-section='recommendations']",
          ],
          sectionHeadings: ["Recommendations"],
          patterns: ["(\\d+)\\s+recommendations?"],
        },
        {
          strategy: "domClasses",
          confidence: 0.4,
          selectors: [
            "section.artdeco-card:has(#recommendations)",
            "section.pv-profile-card:has(#recommendations)",
            "section:has(#recommendations)",
            ".recommendations-section",
          ],
        },
      ],
    },
  },
};

export interface SelectorConfigCacheRecord {
  config: SelectorConfig;
  fetchedAt: number;
  expiresAt: number;
}

const VALID_STRATEGIES: ReadonlySet<StrategyName> = new Set([
  "embeddedJson",
  "semantic",
  "domClasses",
]);

const VALID_VALUE_TYPES = new Set([
  "string",
  "string[]",
  "boolean",
  "number",
  "experience[]",
]);

const VALID_FIELDS: ReadonlySet<ProfileField> = new Set([
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
]);

// Whitelist of keys the remote payload may set on a strategy. Anything
// outside this set is dropped — guards against a server-side bug or
// malicious actor smuggling in arbitrary keys the extension would later
// reflect into selectors or RegExp constructors.
const ALLOWED_STRATEGY_KEYS: ReadonlySet<keyof StrategySelector> = new Set([
  "strategy",
  "confidence",
  "selectors",
  "rootSelectors",
  "itemSelectors",
  "bulletSelectors",
  "attribute",
  "sectionHeadings",
  "ariaLabels",
  "jsonPathHints",
  "jsonKeyHints",
  "textIncludes",
  "excludeText",
  "patterns",
] as const);

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}

function sanitizeStrategy(raw: unknown): StrategySelector | null {
  if (!raw || typeof raw !== "object") return null;
  const input = raw as Record<string, unknown>;
  const strategy = input.strategy;
  if (typeof strategy !== "string" || !VALID_STRATEGIES.has(strategy as StrategyName)) {
    return null;
  }

  const clean: StrategySelector = { strategy: strategy as StrategyName };
  for (const key of ALLOWED_STRATEGY_KEYS) {
    if (key === "strategy") continue;
    const v = input[key as string];
    if (v === undefined) continue;
    if (key === "confidence") {
      if (typeof v === "number" && v >= 0 && v <= 1) clean.confidence = v;
    } else if (key === "attribute") {
      if (typeof v === "string" && v.length < 200) clean.attribute = v;
    } else {
      // All remaining whitelisted keys are string[].
      if (isStringArray(v) && v.length < 200) {
        (clean as unknown as Record<string, string[]>)[key as string] = v.filter(
          (s) => s.length < 500,
        );
      }
    }
  }
  return clean;
}

function sanitizeField(raw: unknown): FieldSelectorConfig | null {
  if (!raw || typeof raw !== "object") return null;
  const input = raw as Record<string, unknown>;
  const field = input.field;
  const valueType = input.valueType;
  if (
    typeof field !== "string" ||
    !VALID_FIELDS.has(field as ProfileField) ||
    typeof valueType !== "string" ||
    !VALID_VALUE_TYPES.has(valueType)
  ) {
    return null;
  }
  const strategiesRaw = input.strategies;
  if (!Array.isArray(strategiesRaw)) return null;
  const strategies = strategiesRaw
    .map(sanitizeStrategy)
    .filter((s): s is StrategySelector => s !== null);
  if (strategies.length === 0) return null;
  const threshold =
    typeof input.threshold === "number" && input.threshold >= 0 && input.threshold <= 1
      ? input.threshold
      : undefined;
  return {
    field: field as ProfileField,
    valueType: valueType as FieldSelectorConfig["valueType"],
    threshold,
    strategies,
  };
}

function sanitizeRemoteConfig(raw: unknown): SelectorConfig | null {
  if (!raw || typeof raw !== "object") return null;
  const input = raw as Record<string, unknown>;
  if (typeof input.version !== "string" || input.version.length > 200) return null;
  const minConfidence =
    typeof input.minConfidence === "number" &&
    input.minConfidence >= 0 &&
    input.minConfidence <= 1
      ? input.minConfidence
      : DEFAULT_SELECTOR_CONFIG.minConfidence;
  const cacheRaw = input.cache as Record<string, unknown> | undefined;
  const cache = {
    key:
      cacheRaw && typeof cacheRaw.key === "string"
        ? cacheRaw.key
        : DEFAULT_SELECTOR_CONFIG.cache.key,
    ttlMs:
      cacheRaw && typeof cacheRaw.ttlMs === "number" && cacheRaw.ttlMs > 0
        ? Math.min(cacheRaw.ttlMs, 1000 * 60 * 60 * 24 * 7)
        : DEFAULT_SELECTOR_CONFIG.cache.ttlMs,
  };
  const fieldsRaw = input.fields;
  if (!fieldsRaw || typeof fieldsRaw !== "object") return null;
  const fields: Partial<Record<ProfileField, FieldSelectorConfig>> = {};
  for (const [key, value] of Object.entries(fieldsRaw)) {
    if (!VALID_FIELDS.has(key as ProfileField)) continue;
    const sanitized = sanitizeField(value);
    if (sanitized) fields[key as ProfileField] = sanitized;
  }
  if (Object.keys(fields).length === 0) return null;
  return { version: input.version, minConfidence, cache, fields };
}

async function readCache(): Promise<SelectorConfigCacheRecord | null> {
  try {
    const stored = await chrome.storage.local.get(CACHE_STORAGE_KEY);
    const record = stored[CACHE_STORAGE_KEY] as SelectorConfigCacheRecord | undefined;
    if (!record || typeof record !== "object") return null;
    if (record.expiresAt && record.expiresAt < Date.now()) return null;
    return record;
  } catch {
    return null;
  }
}

async function writeCache(config: SelectorConfig): Promise<void> {
  try {
    const now = Date.now();
    const record: SelectorConfigCacheRecord = {
      config,
      fetchedAt: now,
      expiresAt: now + config.cache.ttlMs,
    };
    await chrome.storage.local.set({ [CACHE_STORAGE_KEY]: record });
  } catch {
    // ignore — fallback path always works
  }
}

async function fetchRemote(): Promise<SelectorConfig | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REMOTE_FETCH_TIMEOUT_MS);
  try {
    const url = `${REZOOMED_BASE_URL}${ADAPTER_CONFIG_PATH}`;
    const resp = await fetch(url, {
      method: "GET",
      credentials: "omit",
      headers: { accept: "application/json" },
      signal: controller.signal,
    });
    if (!resp.ok) return null;
    const json = (await resp.json()) as unknown;
    return sanitizeRemoteConfig(json);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function loadConfig(): Promise<SelectorConfig> {
  const cached = await readCache();
  if (cached) {
    // Refresh in the background for next scan, but use the cached
    // config now so the user sees a fast scan.
    void (async () => {
      const fresh = await fetchRemote();
      if (fresh && fresh.version !== cached.config.version) {
        await writeCache(fresh);
      }
    })();
    return cached.config;
  }

  const fresh = await fetchRemote();
  if (fresh) {
    await writeCache(fresh);
    return fresh;
  }

  return DEFAULT_SELECTOR_CONFIG;
}

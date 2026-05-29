import type { ExperienceEntry, ExtractionResult, StrategyFieldConfig } from "../types";
import { debugLog } from "../debug";
import {
  cleanText,
  createStringArrayField,
  createTextField,
  matchesAny,
  readableLines,
  uniqueStrings,
  visibleText,
} from "../normalize";

const CARD_ANCESTOR_SELECTORS = [
  "section.artdeco-card",
  "section.pv-profile-card",
  "section[data-view-name]",
  "section",
  ".artdeco-card",
  "[data-view-name='profile-card']",
  "[data-section]",
];

const PROFILE_CARD_HEADING_TAGS = "h1, h2, h3, [role='heading']";

export function semantic(
  document: Document,
  fieldConfig: StrategyFieldConfig,
): ExtractionResult {
  const confidence = fieldConfig.strategyConfig.confidence ?? 0.68;

  try {
    const value = extractSemanticValue(document, fieldConfig, confidence);
    return {
      value,
      confidence: value === undefined ? 0 : confidence,
      source: "semantic",
    };
  } catch {
    return { confidence: 0, source: "semantic", reason: "semantic-error" };
  }
}

function extractSemanticValue(
  document: Document,
  fieldConfig: StrategyFieldConfig,
  confidence: number,
): unknown | undefined {
  switch (fieldConfig.field) {
    case "headline":
      return extractHeadline(document);
    case "about":
      return extractSectionText(document, fieldConfig);
    case "experience":
      return extractExperience(document, fieldConfig, confidence);
    case "skills":
      return (
        extractSectionItems(document, fieldConfig) ??
        extractTopSkillsFromAbout(document)
      );
    case "education":
      return extractSectionItems(document, fieldConfig);
    case "hasPhoto":
      return hasImageSignal(document, fieldConfig);
    case "hasBanner":
      return hasImageSignal(document, fieldConfig);
    case "customUrl":
      return matchesAny(
        new URL(document.location.href).pathname,
        fieldConfig.strategyConfig.patterns,
      );
    case "openToWork":
      return matchesAny(
        visibleText(document.querySelector("main") ?? document.body),
        fieldConfig.strategyConfig.patterns,
      );
    case "recommendationsCount":
      return extractRecommendationsCount(document, fieldConfig);
    default:
      return undefined;
  }
}

function extractHeadline(document: Document): string | undefined {
  const main = document.querySelector("main") ?? document.body;

  // 1. Prefer the SDUI Topcard component when present — it precisely
  //    scopes us to the top profile card and avoids the user's name
  //    appearing in the global nav header / breadcrumbs.
  const topcard = findSectionByComponentKey(document, "topcard");

  // 2. Fall back to the H1 if there is one (older LinkedIn renders).
  //    The new SDUI render uses H2 for the user's name, so an H1 lookup
  //    will return null and we'll rely on the topcard search above.
  const h1 = main.querySelector("h1");

  // Identify the heading element that contains the user's name.
  let nameHeading: Element | null = null;
  if (topcard) {
    nameHeading = topcard.querySelector("h1, h2");
  }
  if (!nameHeading) nameHeading = h1;

  // Identify a search container that's small enough to exclude
  // About/Experience but large enough to include the headline.
  const searchRoot =
    topcard ??
    (h1 ? findTopCardAncestor(h1) ?? h1.parentElement : null) ??
    main;

  if (!nameHeading || !searchRoot) return undefined;

  const name = readableLines(nameHeading)[0] ?? "";

  const lines = readableLines(searchRoot);
  return lines.find((line) => {
    const lower = line.toLowerCase();
    return (
      line !== name &&
      !line.includes(name) &&
      line.length >= 8 &&
      line.length <= 220 &&
      !lower.includes("contact info") &&
      !lower.includes("connections") &&
      !lower.includes("followers") &&
      !lower.includes("add profile section") &&
      !lower.includes("open to") &&
      !lower.includes("more actions") &&
      !lower.includes("provide feedback") &&
      !lower.includes("show all analytics") &&
      !lower.includes("private to you") &&
      !lower.includes("enhance profile") &&
      !lower.includes("add section") &&
      !lower.includes("resources") &&
      !lower.includes("share that you")
    );
  });
}

/**
 * Walk up from the H1 looking for the smallest ancestor that's plausibly
 * the "top card" — substantial enough to contain the headline and other
 * top-card data (location, contact button, photo metadata) but not so
 * large that we accidentally capture About/Experience as well.
 *
 * Class-name agnostic on purpose: the hashed-CSS LinkedIn variant has no
 * recognizable .pv-top-card hook, so we measure by content size.
 */
function findTopCardAncestor(heading: Element): Element | null {
  let parent: Element | null = heading.parentElement;
  let lastGood: Element | null = null;
  let depth = 0;
  while (parent && depth < 8) {
    const text = (parent.textContent ?? "").trim();
    if (text.length >= 100 && text.length <= 4000) {
      lastGood = parent;
    }
    if (text.length > 4000) break;
    parent = parent.parentElement;
    depth += 1;
  }
  return lastGood;
}

function extractSectionText(
  document: Document,
  fieldConfig: StrategyFieldConfig,
): string | undefined {
  const section = findSection(document, fieldConfig);
  if (!section) return undefined;

  const headingSet = new Set(
    (fieldConfig.strategyConfig.sectionHeadings ?? []).map((heading) =>
      heading.toLowerCase(),
    ),
  );

  const text = readableLines(section)
    .filter((line) => !headingSet.has(line.toLowerCase()))
    .filter((line) => !/^show (all|more|less)/i.test(line))
    .filter((line) => !/^see (more|less)/i.test(line))
    .filter((line) => !/^\d+\s+(skills?|languages?|certifications?)$/i.test(line))
    .join("\n");

  return cleanText(text) || undefined;
}

function extractSectionItems(
  document: Document,
  fieldConfig: StrategyFieldConfig,
): string[] | undefined {
  const section = findSection(document, fieldConfig);
  if (!section) return undefined;

  const headingSet = new Set(
    (fieldConfig.strategyConfig.sectionHeadings ?? []).map((heading) =>
      heading.toLowerCase(),
    ),
  );

  // Top-level items inside the section (skill / school / language entries).
  const itemTexts = Array.from(section.querySelectorAll("li"))
    .map((item) => firstUsefulLine(item, headingSet))
    .filter(Boolean);

  // Belt-and-braces fallback: take section lines that look like items.
  const fallback = readableLines(section)
    .filter((line) => !headingSet.has(line.toLowerCase()))
    .filter((line) => isUsefulSectionItemLine(line, fieldConfig.field))
    .filter((line) => line.length >= 2 && line.length <= 200);

  // Some LinkedIn variants render skills/languages as a single bullet-
  // joined string ("Scrum • Jira • SQL • …") instead of one <li> per
  // item. Detect that and split on the bullet/middle-dot/pipe.
  const expanded = explodeBulletJoinedItems([...itemTexts, ...fallback]);

  // Filter out sub-section headings the new LinkedIn variant ships
  // alongside actual items (e.g. "Top skills", "Industry knowledge").
  const subHeadingPatterns = subHeadingsFor(fieldConfig.field);
  const cleaned = expanded.filter(
    (line) => !subHeadingPatterns.some((pattern) => pattern.test(line)),
  );

  const values = uniqueStrings(cleaned).slice(0, 80);
  return values.length ? values : undefined;
}

function explodeBulletJoinedItems(items: string[]): string[] {
  const result: string[] = [];
  for (const item of items) {
    if (!item) continue;
    // Split when a single line carries 2+ bullet-style separators —
    // that's a strong signal it's a list rendered as one paragraph.
    const parts = item
      .split(/\s+[•·|]\s+/)
      .map((part) => part.trim())
      .filter(Boolean);
    if (parts.length >= 2 && parts.every((part) => part.length <= 60)) {
      result.push(...parts);
    } else {
      result.push(item);
    }
  }
  return result;
}

function subHeadingsFor(field: StrategyFieldConfig["field"]): RegExp[] {
  if (field === "skills") {
    return [
      /^top skills?$/i,
      /^industry knowledge$/i,
      /^tools? &? technologies?$/i,
      /^interpersonal skills?$/i,
      /^languages?$/i,
      /^other skills?$/i,
    ];
  }
  if (field === "education") {
    return [/^licenses?( &|\sand)? certifications?(\s+\(\d+\))?$/i];
  }
  return [];
}

function extractExperience(
  document: Document,
  fieldConfig: StrategyFieldConfig,
  confidence: number,
): ExperienceEntry[] | undefined {
  const section = findSection(document, fieldConfig);
  if (!section) return undefined;

  // Modern LinkedIn experience uses these item containers; fall back to any <li>.
  const itemSelectors = [
    "[componentkey^='entity-collection-item']",
    "li.artdeco-list__item",
    "li.pvs-list__item--with-top-padding",
    "li.pvs-list__paged-list-item",
    "li",
  ];

  const seenItems = new Set<Element>();
  const rawItems: Element[] = [];
  for (const selector of itemSelectors) {
    for (const item of Array.from(section.querySelectorAll(selector))) {
      if (seenItems.has(item)) continue;
      const text = visibleText(item);
      if (text.length < 12) continue;
      if (/^show (all|more|less)/i.test(text)) continue;
      seenItems.add(item);
      rawItems.push(item);
    }
    if (rawItems.length) break;
  }

  const items = rawItems.length ? rawItems : [section];
  const entries = items
    .map((item) => parseExperienceItem(item, confidence))
    .filter(
      (entry): entry is ExperienceEntry =>
        Boolean(entry?.title?.value || entry?.company?.value),
    );

  return entries.length ? dedupeExperience(entries).slice(0, 30) : undefined;
}

function parseExperienceItem(
  element: Element,
  confidence: number,
): ExperienceEntry | undefined {
  const lines = readableLines(element).filter((line) => {
    const lower = line.toLowerCase();
    if (/^(experience|show all|full-time|part-time|self-employed|freelance|contract|internship|permanent)$/i.test(line)) return false;
    if (/^helped me get this job$/i.test(line)) return false;
    return !lower.startsWith("see more") && !lower.startsWith("see less");
  });

  if (!lines.length) return undefined;

  const dateLineRegex =
    /\b\d{4}\b|\bpresent\b|\bmos?\b|\byrs?\b|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)\b/i;
  const locationLineRegex = /^[A-Za-z .'-]+,\s*[A-Za-z .'-]+(?:,\s*[A-Za-z .'-]+)?$/;
  const employmentTypes = /·\s*(full-time|part-time|contract|internship|freelance|self-employed|temporary|seasonal|apprenticeship|permanent)/i;

  const meaningful = lines.filter(
    (line) =>
      !dateLineRegex.test(line) &&
      !locationLineRegex.test(line),
  );

  if (!meaningful.length) return undefined;

  const title = meaningful[0];
  const companyLine = meaningful
    .slice(1)
    .find((line) => line.length <= 140 && line !== title);
  const company = companyLine
    ? cleanText(companyLine.replace(employmentTypes, "").replace(/·.*$/, "").trim())
    : "";

  const descriptionLines = meaningful
    .slice(companyLine ? 2 : 1)
    .filter((line) => line.length > 20 && line !== title && line !== companyLine);
  const bullets = descriptionLines.filter((line) =>
    /^[-*•]|\d|achieved|built|led|managed|reduced|increased|launched|grew|delivered|saved|improved|scaled/i.test(
      line,
    ),
  );

  return {
    title: createTextField(title, confidence, "semantic"),
    company: createTextField(company, confidence * 0.9, "semantic"),
    description: createTextField(
      descriptionLines.join("\n"),
      confidence * 0.8,
      "semantic",
    ),
    bullets: createStringArrayField(bullets, confidence * 0.75, "semantic"),
  };
}

function hasImageSignal(
  document: Document,
  fieldConfig: StrategyFieldConfig,
): boolean | undefined {
  const main = document.querySelector("main") ?? document.body;
  const labels = [
    ...(fieldConfig.strategyConfig.ariaLabels ?? []),
    ...(fieldConfig.strategyConfig.patterns ?? []),
  ];

  const images = Array.from(
    main.querySelectorAll<HTMLImageElement>("img[alt], image[aria-label]"),
  );

  // For an image to count as actually present we need:
  //   1. its alt/aria-label to match the configured labels
  //   2. AND a real, non-empty `src` that isn't an inline 1×1 / data:
  //      placeholder. LinkedIn renders the empty banner state with a
  //      labelled <img> whose src is either "", a data: URL, or a
  //      `static.licdn.com/.../ghost-…` placeholder, and the previous
  //      label-only check produced false-positive "Banner image —
  //      passing" entries for users with no banner.
  if (
    images.some((image) => {
      const alt = `${image.getAttribute("alt") ?? ""} ${image.getAttribute("aria-label") ?? ""}`;
      const labelMatches = labels.some((label) =>
        alt.toLowerCase().includes(label.toLowerCase()),
      );
      if (!labelMatches) return false;
      return hasMeaningfulImageSrc(image);
    })
  ) {
    return true;
  }

  // Aria-labelled non-img elements (e.g. background-image divs) — same
  // tightening: only count when the element actually has a non-empty
  // background-image inline style or backing image src nested inside.
  const labelled = Array.from(main.querySelectorAll<HTMLElement>("[aria-label]"));
  if (
    labelled.some((element) => {
      const label = element.getAttribute("aria-label") ?? "";
      const labelMatches = labels.some((candidate) =>
        label.toLowerCase().includes(candidate.toLowerCase()),
      );
      if (!labelMatches) return false;
      return elementHasMeaningfulImage(element);
    })
  ) {
    return true;
  }

  // Banner absence is a readable state on LinkedIn: the top card can
  // render without a user-uploaded cover image. Report that as `false`
  // so scoring can show the actionable "Add a banner" fix instead of
  // a noisy "Couldn't read this section" message.
  if (fieldConfig.field === "hasBanner") return false;

  return undefined;
}

/** Only treat an <img> as a real signal when its src is a real http(s)
 *  URL pointing at user-uploaded media — not "", a data:/blob: URL, or
 *  the LinkedIn ghost/placeholder asset path. */
function hasMeaningfulImageSrc(image: HTMLImageElement): boolean {
  const src = (image.getAttribute("src") ?? "").trim();
  if (!src) return false;
  if (/^(data:|blob:|about:)/i.test(src)) return false;
  // LinkedIn ships the empty banner / default avatar from a known
  // static path — anything served from `static.licdn.com/.../ghost…`
  // or `static.licdn.com/.../default…` is a placeholder, not a real
  // user-uploaded media asset.
  if (/static\.licdn\.com\/(?:[^"]*\/)?(ghost|default)/i.test(src)) return false;
  return true;
}

function elementHasMeaningfulImage(element: HTMLElement): boolean {
  // Direct background-image inline style.
  const inlineBg = element.style.backgroundImage || "";
  if (/url\(["']?(?!data:)(?!about:)(?!blob:)https?:[^)"']+/i.test(inlineBg)) {
    if (!/static\.licdn\.com\/(?:[^"')]*\/)?(ghost|default)/i.test(inlineBg)) {
      return true;
    }
  }
  // Or a nested <img> with a real src.
  const nestedImg = element.querySelector<HTMLImageElement>("img");
  if (nestedImg && hasMeaningfulImageSrc(nestedImg)) return true;
  return false;
}

function extractRecommendationsCount(
  document: Document,
  fieldConfig: StrategyFieldConfig,
): number {
  // LinkedIn hides the Recommendations section entirely when there are
  // none, so a missing section should be reported as zero (absent),
  // not as "unread". Returning 0 here lets the scoring layer surface
  // "absent" rather than "we couldn't read it".
  const section = findSection(document, fieldConfig);
  if (!section) return 0;

  const text = visibleText(section);
  for (const pattern of fieldConfig.strategyConfig.patterns ?? []) {
    try {
      const match = text.match(new RegExp(pattern, "i"));
      if (match?.[1]) return Number(match[1].replace(/,/g, ""));
    } catch {
      continue;
    }
  }

  const listItems = Array.from(section.querySelectorAll("li")).filter(
    (item) => visibleText(item).length > 20,
  );
  return listItems.length;
}

/* ------------------------------------------------------------------ */
/* Section discovery                                                   */
/* ------------------------------------------------------------------ */

function findSection(
  document: Document,
  fieldConfig: StrategyFieldConfig,
): Element | undefined {
  // Search the entire document, not just <main>. The
  // ?isSelfProfile=true LinkedIn render places some sections outside
  // the standard <main> region, so a main-only query misses them.
  const main = document.querySelector("main");
  const roots = main && main !== document.body ? [main, document.body] : [document.body];
  const field = fieldConfig.field;
  const headings = fieldConfig.strategyConfig.sectionHeadings ?? [];

  // 0. PRIMARY: Server-Driven UI componentkey match. On LinkedIn's newer
  //    profile render, every card has a stable componentkey attribute
  //    of the form "com.linkedin.sdui.profile.card.<urn>Topcard" /
  //    "...About" / "...ExperienceTopLevelSection" / etc. These are
  //    LinkedIn's own internal component identifiers — far more stable
  //    than CSS classes (which are now hashed) or anchor ids (which
  //    have shipped under at least three different conventions).
  const fromComponentKey = findSectionByComponentKey(document, field);
  if (fromComponentKey) {
    debugLog("findSection", field, "componentkey", "hit");
    return fromComponentKey;
  }
  debugLog("findSection", field, "componentkey", "miss");

  // 1. heading-range slice. Find the heading by text and slice content
  //    until the next h1/h2. Robust to class/anchor changes.
  if (headings.length) {
    const range = getSectionByHeadingRange(document, headings);
    if (range) {
      debugLog("findSection", field, "heading-range", "hit");
      return range;
    }
    debugLog("findSection", field, "heading-range", "miss");
  }

  // Synthesise a few extra anchor selectors per field. LinkedIn has
  // shipped at least three id conventions over the last 18 months —
  // bare (#about), suffixed (#about-section), and prefixed
  // (#main-about-section) — so we try all of them via [id*=…] in
  // addition to the explicit selectors in the SelectorConfig.
  const explicitSelectors = fieldConfig.strategyConfig.rootSelectors ?? [];
  const synthesizedSelectors = synthesizeAnchorSelectors(field);
  const allSelectors = [...explicitSelectors, ...synthesizedSelectors];

  // 1. Anchor-based discovery (fallback)
  for (const selector of allSelectors) {
    for (const root of roots) {
      let anchor: Element | null = null;
      try {
        anchor = root.querySelector(selector);
      } catch {
        continue;
      }
      if (!anchor) continue;

      debugLog("findSection", field, "anchor", selector, "hit");
      const card = findCardAncestor(anchor);
      debugLog(
        "findSection",
        field,
        "card-from-anchor",
        card ?? "none",
      );
      if (card) return card;
    }
  }
  debugLog("findSection", field, "anchor", "all-miss");

  // 2. Heading-text + class-ancestor (older fallback). Only fires when
  //    the heading-range path above somehow fails.
  if (headings.length) {
    for (const root of roots) {
      const fromHeading = findCardByHeading(root, headings);
      if (fromHeading) {
        debugLog("findSection", field, "heading-match", "hit");
        return fromHeading;
      }
    }
    debugLog("findSection", field, "heading-match", "miss");

    // 3. Last-resort: scan every artdeco-card and accept the one whose
    //    first visible line equals the section heading.
    for (const root of roots) {
      const fromContents = findCardByContents(root, headings);
      if (fromContents) {
        debugLog("findSection", field, "content-scan", "hit");
        return fromContents;
      }
    }
    debugLog("findSection", field, "content-scan", "miss");
  }

  return undefined;
}

/**
 * Look up a section by LinkedIn's Server-Driven UI componentkey. On the
 * SDUI profile render, every top-level card carries an attribute like:
 *
 *   componentkey="com.linkedin.sdui.profile.card.refACoAA…About"
 *   componentkey="com.linkedin.sdui.profile.card.refACoAA…ExperienceTopLevelSection"
 *
 * These are LinkedIn's own component identifiers — internal to the
 * product, and the same ones the LinkedIn frontend uses to talk to its
 * own backend. They are dramatically more stable than CSS classes or
 * anchor ids, and they survive A/B variants, hashed-class builds, and
 * the ?isSelfProfile=true render.
 */
const COMPONENT_KEY_PATTERNS: Record<
  string,
  RegExp[]
> = {
  // The componentkey format is "com.linkedin.sdui.profile.card.<urn>Section"
  // where <urn> is an opaque alphanumeric blob ending in something like
  // "_8" — there is NO dot between the urn and the section name. We anchor
  // on a non-letter character (or string start) before the section name to
  // avoid false-positive matches like "FoundAbout" while still matching
  // "_8About", "-Topcard", etc.
  topcard: [/(?:^|[^A-Za-z])Topcard$/i, /(?:^|[^A-Za-z])TopCard$/i],
  about: [/(?:^|[^A-Za-z])About$/i, /(?:^|[^A-Za-z])AboutTopLevel(?:Section)?$/i],
  experience: [/(?:^|[^A-Za-z])Experience(?:TopLevel|TopLevelSection)?$/i],
  education: [/(?:^|[^A-Za-z])Education(?:TopLevel|TopLevelSection)?$/i],
  skills: [/(?:^|[^A-Za-z])Skills(?:TopLevel|TopLevelSection)?$/i],
  recommendationsCount: [/(?:^|[^A-Za-z])Recommendations(?:TopLevel|TopLevelSection)?$/i],
};

function findSectionByComponentKey(
  document: Document,
  field: string,
): Element | undefined {
  const patterns = COMPONENT_KEY_PATTERNS[field];
  if (!patterns) return undefined;

  const main = document.querySelector("main") ?? document.body;
  const candidates = Array.from(
    main.querySelectorAll<HTMLElement>("[componentkey]"),
  );

  for (const element of candidates) {
    const key = element.getAttribute("componentkey") || "";
    if (patterns.some((pattern) => pattern.test(key)) && hasMeaningfulContent(element)) {
      return element;
    }
  }

  return undefined;
}

/**
 * Read the inline "Top skills" sub-block that LinkedIn renders inside
 * the About card on profiles where the standalone Skills card hasn't
 * been included in this render. Structure looks like:
 *
 *   <p>Top skills</p>
 *   <p>Scrum • Jira • SQL • Problem Solving • Product Management</p>
 *   <a href=".../details/top-skills-details/">Show top skills</a>
 *
 * We find the "Top skills" paragraph and read the bullet-joined list
 * from its next paragraph sibling.
 */
function extractTopSkillsFromAbout(document: Document): string[] | undefined {
  const aboutSection = findSectionByComponentKey(document, "about");
  if (!aboutSection) return undefined;

  const paragraphs = Array.from(aboutSection.querySelectorAll("p"));
  for (let index = 0; index < paragraphs.length; index += 1) {
    const text = (readableLines(paragraphs[index])[0] ?? "").trim().toLowerCase();
    if (text !== "top skills") continue;

    const next = paragraphs[index + 1];
    if (!next) continue;

    const listText = readableLines(next).join(" ");
    const skills = listText
      .split(/\s+[•·|]\s+/)
      .map((part) => part.trim())
      .filter((part) => part.length >= 2 && part.length <= 60);
    if (skills.length >= 2) return skills;
  }

  return undefined;
}

/**
 * Slice the user-visible section out of the page using only the heading
 * text and the Range API. Used as a fallback when the SDUI componentkey
 * path doesn't match — section CSS classes, anchor ids, and wrapper
 * element types are all volatile across LinkedIn variants, but the
 * heading text is not, because it's product copy that LinkedIn shows
 * to its users.
 *
 * Algorithm:
 *   1. Collect every h1/h2 (and any [role='heading'] not aria-level >=3)
 *      in main, in document order.
 *   2. Find the first one whose visible text matches one of `headings`.
 *   3. The section's content range is from that heading element until
 *      either (a) the next collected heading or (b) end of main.
 *   4. Clone the range into a wrapper <div> so downstream extractors can
 *      run their existing `querySelectorAll('li')` / `readableLines`
 *      logic on it without touching the live DOM.
 */
function getSectionByHeadingRange(
  document: Document,
  headings: string[],
): Element | undefined {
  const targets = headings.map((heading) => heading.toLowerCase());
  const main = document.querySelector("main") ?? document.body;
  if (!main) return undefined;

  const sectionHeadings = Array.from(
    main.querySelectorAll<HTMLElement>("h1, h2, [role='heading']"),
  )
    .filter((heading) => {
      // h3+ should not split sections — they're sub-headings within a
      // section (e.g. "Top skills" inside Skills).
      const level = heading.getAttribute("aria-level");
      if (level && Number(level) > 2) return false;
      // Tag-based check too: explicit h3+ is also disqualified, just in
      // case the role/aria-level dance is missing.
      if (/^H[3-6]$/.test(heading.tagName)) return false;
      return true;
    })
    .map((heading) => {
      const text = (readableLines(heading)[0] ?? "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
      return { heading, text };
    })
    .filter(({ text }) => text.length > 0);

  const startIndex = sectionHeadings.findIndex(({ text }) =>
    targets.some(
      (target) =>
        text === target ||
        text.startsWith(`${target} `) ||
        text.startsWith(`${target}·`) ||
        text.startsWith(`${target} ·`) ||
        text.startsWith(`${target}\u00b7`),
    ),
  );
  if (startIndex === -1) return undefined;

  const startHeading = sectionHeadings[startIndex].heading;
  const endHeading = sectionHeadings[startIndex + 1]?.heading ?? null;

  try {
    const range = document.createRange();
    range.setStartBefore(startHeading);
    if (endHeading) {
      range.setEndBefore(endHeading);
    } else {
      range.setEndAfter(main);
    }

    const wrapper = document.createElement("div");
    wrapper.appendChild(range.cloneContents());

    // Sanity check: the slice should contain more than just the
    // heading itself. If not, the next heading is sitting right next
    // to ours and there's no real content — let the caller fall back.
    const lines = readableLines(wrapper);
    if (lines.length <= 1) return undefined;

    return wrapper;
  } catch {
    return undefined;
  }
}

function synthesizeAnchorSelectors(field: StrategyFieldConfig["field"]): string[] {
  // Map field name -> canonical LinkedIn section-id keyword.
  const tokenByField: Partial<Record<typeof field, string>> = {
    about: "about",
    experience: "experience",
    skills: "skills",
    education: "education",
    recommendationsCount: "recommendations",
  };
  const token = tokenByField[field];
  if (!token) return [];
  return [
    `[id="${token}"]`,
    `[id^="${token}"]`,
    `[id$="${token}"]`,
    `[id*="${token}" i]`,
    `[data-section="${token}"]`,
    `[data-section*="${token}" i]`,
    `[data-anchor="${token}"]`,
  ];
}

function findCardAncestor(anchor: Element): Element | undefined {
  for (const selector of CARD_ANCESTOR_SELECTORS) {
    const card = anchor.closest(selector);
    if (card && hasMeaningfulContent(card)) return card;
  }

  // Last-ditch: walk up the DOM picking the smallest ancestor with
  // substantial readable content. This rescues sections whose wrapper
  // is a plain <div> with no class hooks.
  let parent: Element | null = anchor.parentElement;
  for (let depth = 0; parent && depth < 8; depth += 1) {
    if (hasMeaningfulContent(parent)) return parent;
    parent = parent.parentElement;
  }

  return undefined;
}

function findCardByHeading(
  root: Element,
  headings: string[],
): Element | undefined {
  const targets = headings.map((heading) => heading.toLowerCase());
  const headingNodes = Array.from(
    root.querySelectorAll<HTMLElement>(PROFILE_CARD_HEADING_TAGS),
  );

  for (const heading of headingNodes) {
    // Read heading text via readableLines so the visible+visually-hidden
    // duplication LinkedIn emits ("SkillsSkills") doesn't break matching.
    const headingLines = readableLines(heading);
    const headingText = (headingLines[0] ?? "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();

    const matchedTarget = targets.find(
      (target) =>
        headingText === target ||
        headingText.startsWith(`${target} `) ||
        headingText.startsWith(`${target}\n`) ||
        headingText.startsWith(`${target}·`) ||
        headingText.startsWith(`${target} ·`),
    );
    if (!matchedTarget) continue;

    // Two-step ancestor search:
    //   1. Try the class/tag-based selectors (artdeco-card etc.). This
    //      is fast and works on the canonical LinkedIn render.
    //   2. Fall back to a heading-anchored walker that's independent of
    //      element type and class names. Required for the hashed-CSS
    //      LinkedIn variant where every section uses generated class
    //      names like "f8f93073" with no stable hooks.
    const card =
      findCardAncestor(heading) ?? findCardForHeading(heading, matchedTarget);
    if (card) return card;
  }

  return undefined;
}

/**
 * Walk up the DOM from a matched heading and return the smallest
 * ancestor whose own first visible line equals the heading text. That
 * ancestor is the section's card, regardless of whether it's a
 * <section>, <div>, <article>, or what classes it carries.
 */
function findCardForHeading(
  heading: Element,
  headingTarget: string,
): Element | undefined {
  let parent: Element | null = heading.parentElement;
  let depth = 0;
  while (parent && depth < 12) {
    if (hasMeaningfulContent(parent)) {
      const firstLine = (readableLines(parent)[0] ?? "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
      if (
        firstLine === headingTarget ||
        firstLine.startsWith(`${headingTarget} `) ||
        firstLine.startsWith(`${headingTarget}·`) ||
        firstLine.startsWith(`${headingTarget} ·`)
      ) {
        return parent;
      }
    }
    parent = parent.parentElement;
    depth += 1;
  }
  return undefined;
}

function findCardByContents(
  root: Element,
  headings: string[],
): Element | undefined {
  const targets = headings.map((heading) => heading.toLowerCase());
  const cards = Array.from(
    root.querySelectorAll<HTMLElement>(
      "section.artdeco-card, section.pv-profile-card, section[data-view-name], .artdeco-card",
    ),
  );

  for (const card of cards) {
    const lines = readableLines(card);
    const first = (lines[0] ?? "").toLowerCase().trim();
    if (!first) continue;
    if (
      targets.some(
        (target) =>
          first === target ||
          first.startsWith(`${target} `) ||
          first.startsWith(`${target}·`) ||
          first.startsWith(`${target} ·`),
      ) &&
      hasMeaningfulContent(card)
    ) {
      return card;
    }
  }

  return undefined;
}

function hasMeaningfulContent(element: Element): boolean {
  // We measure raw textContent length (cheap) before trusting a container
  // to avoid promoting a bare anchor wrapper to "the section".
  const raw = (element.textContent ?? "").replace(/\s+/g, " ").trim();
  return raw.length >= 60;
}

function firstUsefulLine(element: Element, headingSet: Set<string>): string {
  for (const candidate of readableLines(element)) {
    const lower = candidate.toLowerCase();
    if (headingSet.has(lower)) continue;
    if (/^show (all|more|less)/i.test(candidate)) continue;
    if (/^see (more|less)/i.test(candidate)) continue;
    if (/^\d+\s+(skills?|languages?|certifications?)$/i.test(candidate)) continue;
    if (/^endorsed by/i.test(candidate)) continue;

    // Some LinkedIn rows collapse the skill name and "Endorsed by N
    // colleagues" into a single line. Strip the suffix instead of
    // rejecting the whole line so we still capture the skill.
    const cleaned = candidate
      .split("·")[0]
      .replace(/endorsed by[\s\S]*$/i, "")
      .trim();

    if (cleaned.length >= 2 && cleaned.length <= 140) {
      return cleaned;
    }
  }

  return "";
}

function isUsefulSectionItemLine(
  line: string,
  field: StrategyFieldConfig["field"],
): boolean {
  const lower = line.toLowerCase();
  if (/^show (all|more|less)/i.test(line)) return false;
  if (/^see (more|less)/i.test(line)) return false;
  if (/^(skills|education|recommendations|experience|about)$/i.test(line)) return false;
  if (lower.includes("endors")) return false;
  if (lower.includes("add profile section")) return false;
  if (lower.includes("edit public profile")) return false;
  if (field === "skills" && /\b\d+\s+skills?\b/i.test(line)) return false;
  if (field === "education" && /\b(show all|license|certification)\b/i.test(line)) return false;
  return line.length >= 2;
}

function dedupeExperience(entries: ExperienceEntry[]): ExperienceEntry[] {
  const seen = new Set<string>();
  const result: ExperienceEntry[] = [];

  for (const entry of entries) {
    const key = `${entry.title?.value ?? ""}|${entry.company?.value ?? ""}`.toLowerCase();
    if (!key.trim() || seen.has(key)) continue;
    seen.add(key);
    result.push(entry);
  }

  return result;
}

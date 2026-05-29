/**
 * Recruiter Boolean simulation — deterministic, client-side.
 *
 * Reconstructs the kind of Boolean string a recruiter actually pastes
 * into LinkedIn Recruiter ("Product Manager" OR PM) AND (SaaS OR B2B)
 * AND roadmap NOT junior, then evaluates whether the user's profile
 * would surface for that search and lists the missing terms by section.
 *
 * No LLM call. No network. The output is the same every render given
 * the same inputs, which means the verdict the user sees in the UI
 * matches what `vitest` checks in CI.
 *
 * Why this matters: the rest of the extension's score is a "vanity
 * metric" — number out of 100. A recruiter Boolean simulation is the
 * *anti-vanity* signal: a literal yes/no on whether a recruiter using
 * `LinkedIn Recruiter` would even see this profile in the result list.
 */

import type { ProfileData } from "../adapter/types";
import { experienceEntryText, isUnread } from "../scoring/helpers";
import { containsKeyword, extractKeywords } from "../scoring/text";
import { findRoleCategory, type RoleCategory } from "./synonyms";

export type BooleanSection = "headline" | "about" | "experience" | "skills";

export interface OrClause {
  /** Human-readable label, e.g. "Role" or "Business model". */
  label: string;
  /** OR-ed terms that recruiters substitute interchangeably. */
  terms: string[];
  /** Subset of `terms` actually present in the profile haystack. */
  present: string[];
  /** Subset of `terms` absent from every section we read. */
  missing: string[];
  /** True if at least one term hit. */
  satisfied: boolean;
}

export interface AndTerm {
  term: string;
  present: boolean;
  /** Sections in which the term DOES appear (empty when absent). */
  sections: BooleanSection[];
}

export interface SectionGap {
  section: BooleanSection;
  /** Terms the recruiter expects to see here but didn't find. */
  terms: string[];
}

export interface BooleanVerdict {
  wouldSurface: boolean;
  reason: string;
  /** Number of unsatisfied OR clauses (count of failing AND-of-OR groups). */
  unsatisfiedClauses: number;
  /** Number of missing AND terms across the whole search. */
  missingTermCount: number;
}

export interface BooleanResult {
  /** The Boolean string a recruiter would paste into LinkedIn Recruiter. */
  query: string;
  /** Plain-text version safe to copy without smart quotes. */
  copyableQuery: string;
  /** Human label of the resolved role category (e.g. "Product Manager"). */
  roleLabel: string;
  /** Did the role match the taxonomy or fall back to generic. */
  resolvedFromTaxonomy: boolean;
  orClauses: OrClause[];
  andTerms: AndTerm[];
  /** NOT terms — flat list, only those actually applied to the query. */
  notTerms: string[];
  verdict: BooleanVerdict;
  missingBySection: SectionGap[];
}

export interface BuildOptions {
  /** Free-text role string from the panel ("Senior Product Manager"). */
  targetRole: string;
  profile: ProfileData;
  /** Optional pasted JD; when present, supplies up to 4 extra AND terms. */
  jobDescription?: string;
}

/* ------------------------------------------------------------------ */
/* Section haystacks                                                  */
/* ------------------------------------------------------------------ */

interface SectionHaystacks {
  headline: string;
  about: string;
  experience: string;
  skills: string;
  combined: string;
  /** Sections we never managed to read; verdict stays neutral on these. */
  unreadSections: BooleanSection[];
}

function collectSectionTexts(profile: ProfileData): SectionHaystacks {
  const unreadSections: BooleanSection[] = [];

  const headline = isUnread(profile.headline)
    ? (unreadSections.push("headline"), "")
    : (profile.headline?.value ?? "");

  const about = isUnread(profile.about)
    ? (unreadSections.push("about"), "")
    : (profile.about?.value ?? "");

  let experience = "";
  if (isUnread(profile.experience)) {
    unreadSections.push("experience");
  } else {
    experience = (profile.experience?.value ?? [])
      .map((entry) => experienceEntryText(entry))
      .join("\n");
  }

  const skills = isUnread(profile.skills)
    ? (unreadSections.push("skills"), "")
    : (profile.skills?.value ?? []).join(" ");

  const combined = [headline, about, experience, skills].filter(Boolean).join("\n");

  return {
    headline: headline.toLowerCase(),
    about: about.toLowerCase(),
    experience: experience.toLowerCase(),
    skills: skills.toLowerCase(),
    combined: combined.toLowerCase(),
    unreadSections,
  };
}

/** Return the sections a term appears in. */
function sectionsContaining(haystacks: SectionHaystacks, term: string): BooleanSection[] {
  const out: BooleanSection[] = [];
  if (haystacks.headline && containsKeyword(haystacks.headline, term)) out.push("headline");
  if (haystacks.about && containsKeyword(haystacks.about, term)) out.push("about");
  if (haystacks.experience && containsKeyword(haystacks.experience, term)) out.push("experience");
  if (haystacks.skills && containsKeyword(haystacks.skills, term)) out.push("skills");
  return out;
}

/* ------------------------------------------------------------------ */
/* Role-term derivation                                               */
/* ------------------------------------------------------------------ */

/** Strip company tail, "Senior", "Lead" etc. to a clean role label. */
function compactRole(role: string): string {
  if (!role) return "";
  const head = role.split(/\s+(?:at|@|—|–|-|·|,|\|)\s+/i)[0]?.trim() ?? "";
  if (!head) return "";
  // Trim trailing parenthetical descriptions
  const trimmed = head.replace(/\([^)]*\)/g, "").trim();
  // Strip common seniority modifiers from the front so the OR clause
  // primary term stays clean — but only when the underlying role is
  // recognizable (we don't want to turn "Senior Manager" into "Manager"
  // and lose the seniority signal entirely).
  return trimmed;
}

/** Lowercase, alphanumeric, single-spaced — used to dedupe terms. */
function termKey(term: string): string {
  return term.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * When the taxonomy returns "generic", synthesize a primary OR group
 * from the raw role string. We pull out the head (without seniority
 * trim) plus any obvious abbreviations the user might have included.
 */
function buildGenericPrimary(targetRole: string): string[] {
  const head = compactRole(targetRole);
  if (!head) return [];
  const out: string[] = [head];
  // If the role is multi-word, also OR in the head minus the first word
  // (e.g. "Senior Operations Lead" → also "Operations Lead"). Captures
  // recruiters who drop seniority from their query.
  const parts = head.split(/\s+/);
  if (parts.length > 1) {
    const tail = parts.slice(1).join(" ");
    if (tail.length >= 3) out.push(tail);
  }
  return dedupeTerms(out);
}

function dedupeTerms(terms: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const term of terms) {
    const trimmed = term.trim();
    if (!trimmed) continue;
    const key = termKey(trimmed);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}

/** Try to detect a seniority signal already in the profile. */
function hasSenioritySignal(combinedHaystack: string): boolean {
  return /\b(senior|sr\.?|lead|principal|staff|head\s+of|director|vp|vice\s+president|chief|founder)\b/i.test(
    combinedHaystack,
  );
}

/* ------------------------------------------------------------------ */
/* Boolean string formatting                                          */
/* ------------------------------------------------------------------ */

/**
 * Wrap a multi-word term in double quotes (recruiters quote phrases
 * to force exact matching) and leave single tokens bare.
 */
function quoteIfPhrase(term: string): string {
  return /\s/.test(term) ? `"${term}"` : term;
}

function joinOr(label: string, terms: string[]): string {
  if (!terms.length) return "";
  if (terms.length === 1) return quoteIfPhrase(terms[0]);
  return `(${terms.map(quoteIfPhrase).join(" OR ")})`;
}

/* ------------------------------------------------------------------ */
/* Public builder                                                     */
/* ------------------------------------------------------------------ */

/**
 * Construct the Boolean simulation.
 *
 * Determinism guarantees:
 *  - Same inputs ⇒ same `query` string (no Date.now, no Math.random).
 *  - Term ordering inside an OR group always matches the taxonomy
 *    declaration order; new entries appended (e.g. JD-derived terms)
 *    are appended at the end in JD-keyword frequency order.
 */
export function buildRecruiterBoolean(opts: BuildOptions): BooleanResult {
  const haystacks = collectSectionTexts(opts.profile);
  const category = findRoleCategory(opts.targetRole);
  const isGeneric = category.id === "generic";

  // Primary OR clause: role + abbreviations.
  const primaryTerms = isGeneric
    ? buildGenericPrimary(opts.targetRole)
    : dedupeTerms(category.primaryTerms);

  const primaryClause: OrClause | null =
    primaryTerms.length > 0
      ? buildOrClause("Role", primaryTerms, haystacks)
      : null;

  // Domain groups from the taxonomy.
  const domainClauses: OrClause[] = category.domainGroups.map((group) =>
    buildOrClause(group.label, dedupeTerms(group.terms), haystacks),
  );

  // Responsibility terms (single-term AND clauses) from the taxonomy.
  const taxonomyAndTerms: AndTerm[] = dedupeTerms(category.responsibilityTerms).map(
    (term) => buildAndTerm(term, haystacks),
  );

  // JD-derived AND terms — pull the top role-flavoured keywords that
  // aren't already present anywhere in the Boolean. Caps at 4 to keep
  // the rendered query readable.
  const jdAndTerms: AndTerm[] = (() => {
    const jd = (opts.jobDescription ?? "").trim();
    if (!jd) return [];
    const taken = new Set<string>();
    const allKnown = [
      ...(primaryClause?.terms ?? []),
      ...domainClauses.flatMap((c) => c.terms),
      ...taxonomyAndTerms.map((t) => t.term),
    ].map(termKey);
    for (const k of allKnown) taken.add(k);

    const candidates = extractKeywords(jd, 30);
    const out: AndTerm[] = [];
    for (const candidate of candidates) {
      const key = termKey(candidate);
      if (taken.has(key)) continue;
      // Filter out generic verbs / boilerplate that shouldn't end up
      // in a recruiter Boolean string.
      if (!/^[a-z][a-z0-9+#.\-]{2,}$/i.test(candidate)) continue;
      if (GENERIC_VERB_BLOCKLIST.has(key)) continue;
      taken.add(key);
      out.push(buildAndTerm(candidate, haystacks));
      if (out.length >= 4) break;
    }
    return out;
  })();

  const andTerms = [...taxonomyAndTerms, ...jdAndTerms];

  // NOT terms: a recruiter only adds NOT junior / NOT intern when the
  // search is for a senior role. We mirror that: emit exclusions only
  // when the target role itself reads as senior, OR when the profile
  // already shows seniority signal (so the user could plausibly be
  // searched for at that level). When neither is true we emit no NOT
  // clauses — otherwise NOT junior would pre-filter a junior user out
  // of their own target search.
  const seniorityPresent = hasSenioritySignal(haystacks.combined);
  const targetIsSenior =
    /\b(senior|sr\.?|lead|principal|staff|head\s+of|director|vp|vice\s+president|chief|founder)\b/i.test(
      opts.targetRole,
    );
  const emitExclusions = targetIsSenior || seniorityPresent;
  const notTerms = emitExclusions ? dedupeTerms(category.exclusions) : [];

  // Build the full Boolean string.
  const queryParts: string[] = [];
  if (primaryClause && primaryClause.terms.length > 0) {
    queryParts.push(joinOr(primaryClause.label, primaryClause.terms));
  }
  for (const clause of domainClauses) {
    if (clause.terms.length > 0) queryParts.push(joinOr(clause.label, clause.terms));
  }
  for (const t of andTerms) {
    queryParts.push(quoteIfPhrase(t.term));
  }
  let query = queryParts.join(" AND ");
  if (notTerms.length > 0) {
    query = `${query} NOT ${notTerms.map(quoteIfPhrase).join(" NOT ")}`.trim();
  }

  const orClauses = primaryClause ? [primaryClause, ...domainClauses] : domainClauses;

  // Verdict: every OR clause must have at least one hit, and every AND
  // term must be present, and no NOT term must hit.
  const orFails = orClauses.filter((c) => !c.satisfied).length;
  const andFails = andTerms.filter((t) => !t.present).length;
  const notFails = notTerms.filter((term) => sectionsContaining(haystacks, term).length > 0).length;
  const wouldSurface = orFails === 0 && andFails === 0 && notFails === 0 && orClauses.length > 0;
  // Count only terms whose absence actually blocks the surface — terms
  // missing from a satisfied OR clause are diagnostic but don't block,
  // so they don't add to the headline number.
  const missingTermCount =
    orClauses.filter((c) => !c.satisfied).reduce((sum, c) => sum + c.missing.length, 0) + andFails;

  const verdict: BooleanVerdict = {
    wouldSurface,
    reason: deriveVerdictReason({
      wouldSurface,
      orClauses,
      andTerms,
      notTermsHit: notFails,
      hasJd: !!opts.jobDescription?.trim(),
    }),
    unsatisfiedClauses: orFails + andFails,
    missingTermCount,
  };

  // Per-section gaps. For each missing term in any clause, point at
  // the section that recruiter would expect to see it in. Headline +
  // skills are the highest-signal locations, so a missing term that
  // could go in skills is preferentially mapped there; otherwise it
  // goes to whichever section is currently empty.
  const missingBySection = computeSectionGaps(orClauses, andTerms, haystacks);

  return {
    query,
    copyableQuery: query.replace(/[“”]/g, '"').replace(/[‘’]/g, "'"),
    roleLabel: isGeneric ? compactRole(opts.targetRole) || "Knowledge worker" : category.label,
    resolvedFromTaxonomy: !isGeneric,
    orClauses,
    andTerms,
    notTerms,
    verdict,
    missingBySection,
  };
}

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function buildOrClause(label: string, terms: string[], haystacks: SectionHaystacks): OrClause {
  const present: string[] = [];
  const missing: string[] = [];
  for (const term of terms) {
    const sections = sectionsContaining(haystacks, term);
    if (sections.length > 0) present.push(term);
    else missing.push(term);
  }
  return {
    label,
    terms,
    present,
    missing,
    satisfied: present.length > 0,
  };
}

function buildAndTerm(term: string, haystacks: SectionHaystacks): AndTerm {
  const sections = sectionsContaining(haystacks, term);
  return { term, present: sections.length > 0, sections };
}

function deriveVerdictReason(args: {
  wouldSurface: boolean;
  orClauses: OrClause[];
  andTerms: AndTerm[];
  notTermsHit: number;
  hasJd: boolean;
}): string {
  if (args.wouldSurface) {
    return args.hasJd
      ? "All clauses match. Your profile would surface for this search."
      : "All clauses match. Your profile is discoverable for this role.";
  }
  if (args.notTermsHit > 0) {
    return "A NOT clause hits your profile — recruiters would filter you out before opening it.";
  }
  const orMissing = args.orClauses.filter((c) => !c.satisfied);
  if (orMissing.length > 0) {
    const labels = orMissing.map((c) => c.label.toLowerCase());
    return `Missing every term in ${labels.join(" + ")} clause${
      orMissing.length === 1 ? "" : "s"
    }.`;
  }
  const missingAnd = args.andTerms.filter((t) => !t.present).map((t) => t.term);
  if (missingAnd.length > 0) {
    return `Missing required term${missingAnd.length === 1 ? "" : "s"}: ${missingAnd.join(", ")}.`;
  }
  return "Recruiter Boolean simulation could not run — add a target role.";
}

/**
 * Map missing terms onto the section recruiters would expect to find
 * them in. Logic:
 *   - Skill-shaped tokens (single word, capitalized acronyms or
 *     tooling-style names) → skills section
 *   - Role-name tokens → headline + experience
 *   - Everything else → about
 */
function computeSectionGaps(
  orClauses: OrClause[],
  andTerms: AndTerm[],
  haystacks: SectionHaystacks,
): SectionGap[] {
  const gaps: Record<BooleanSection, Set<string>> = {
    headline: new Set(),
    about: new Set(),
    experience: new Set(),
    skills: new Set(),
  };

  const allMissing: { term: string; clauseLabel: string }[] = [];
  for (const clause of orClauses) {
    if (clause.satisfied) continue;
    for (const term of clause.missing) allMissing.push({ term, clauseLabel: clause.label });
  }
  for (const t of andTerms) {
    if (!t.present) allMissing.push({ term: t.term, clauseLabel: "AND" });
  }

  for (const { term, clauseLabel } of allMissing) {
    if (clauseLabel === "Role") {
      gaps.headline.add(term);
      gaps.experience.add(term);
    } else if (looksLikeSkillToken(term)) {
      gaps.skills.add(term);
    } else if (clauseLabel === "AND") {
      // Responsibility / JD term — most useful in About + Experience
      // because that's where recruiters scan for "did they actually
      // do this thing".
      gaps.about.add(term);
      gaps.experience.add(term);
    } else {
      // Domain group — matters for headline visibility.
      gaps.headline.add(term);
      gaps.about.add(term);
    }
  }

  // Drop sections we couldn't read: telling the user to "add roadmap
  // to your headline" is misleading if we never saw their headline.
  for (const section of haystacks.unreadSections) {
    gaps[section].clear();
  }

  return (Object.keys(gaps) as BooleanSection[])
    .map((section) => ({
      section,
      terms: Array.from(gaps[section]),
    }))
    .filter((entry) => entry.terms.length > 0);
}

function looksLikeSkillToken(term: string): boolean {
  if (/\s/.test(term)) return false;
  // ALL-CAPS acronym (AWS, GCP, SQL).
  if (/^[A-Z][A-Z0-9+#.]{1,}$/.test(term)) return true;
  // PascalCase or camelCase tool name (TypeScript, PyTorch, scikit-learn).
  if (/^[A-Za-z][A-Za-z0-9+#.\-]*$/.test(term) && /[A-Z]/.test(term.slice(1))) return true;
  // Tools that are well-known but lowercase.
  if (/^(figma|sketch|salesforce|hubspot|marketo|workday|greenhouse|lever|outreach)$/i.test(term)) {
    return true;
  }
  return false;
}

const GENERIC_VERB_BLOCKLIST = new Set<string>([
  "build",
  "building",
  "build,",
  "develop",
  "developing",
  "create",
  "creating",
  "manage",
  "managing",
  "drive",
  "driving",
  "lead",
  "leading",
  "work",
  "working",
  "support",
  "supporting",
  "owner",
  "team",
  "people",
  "company",
  "year",
  "years",
  "time",
  "make",
  "making",
  "use",
  "using",
  "help",
  "helping",
  "ensure",
  "ensuring",
  "deliver",
  "delivering",
]);

export const __TEST_ONLY = {
  collectSectionTexts,
  buildOrClause,
  buildAndTerm,
  computeSectionGaps,
  looksLikeSkillToken,
  hasSenioritySignal,
};

/**
 * Recruiter-Boolean role taxonomy.
 *
 * Each entry maps a free-text target role (e.g. "Senior Product Manager
 * at Anthropic — building agents") to:
 *
 *   - primaryTerms: synonym group used in the leading OR clause of the
 *     Boolean search a recruiter would actually run. Ordered so the
 *     canonical proper-case form comes first ("Product Manager" before
 *     "PM"); matching is case-insensitive in the runtime check.
 *   - domainGroups: each becomes an additional AND-of-OR clause. Models
 *     the way recruiter searches stack independent dimensions
 *     (industry vs technology vs methodology).
 *   - responsibilityTerms: AND'd in directly. Things the recruiter
 *     would expect to literally appear in the profile (roadmap,
 *     pipeline, etc.). Each becomes its own AND term — no synonyms —
 *     because they're already canonical in the role's lexicon.
 *   - exclusions: terms recruiters NOT-out of the search to filter
 *     junior/non-target candidates. Only applied when the profile
 *     does NOT itself contain those terms (we don't NOT-out a junior
 *     person searching for junior roles — that would always hide
 *     them).
 *
 * The taxonomy intentionally stays small. The goal is the top ~6
 * roles that drive the bulk of profile-optimizer usage; for anything
 * outside this list, `findRoleCategory` falls back to a generic
 * "knowledge worker" template that still produces a credible
 * Boolean string.
 */

export interface RoleCategory {
  /** Stable ID — used in tests + telemetry. */
  id: string;
  /** Human label for UI (e.g. shown in tooltip / verdict copy). */
  label: string;
  /** Patterns matched against the lower-cased target-role string. */
  triggers: RegExp[];
  /** OR-group: role title and accepted abbreviations. */
  primaryTerms: string[];
  /** Each entry becomes another AND clause of OR-ed alternatives. */
  domainGroups: { label: string; terms: string[] }[];
  /** Single-term AND clauses appended after the OR groups. */
  responsibilityTerms: string[];
  /** Suggested NOT terms (only applied if absent from the profile). */
  exclusions: string[];
}

const ROLE_CATEGORIES: RoleCategory[] = [
  {
    id: "product_manager",
    label: "Product Manager",
    triggers: [/\b(product\s+(manager|lead|owner)|pm|cpo)\b/i],
    primaryTerms: ["Product Manager", "PM", "Product Lead", "Product Owner"],
    domainGroups: [
      { label: "Business model", terms: ["SaaS", "B2B", "B2C", "Enterprise", "Marketplace"] },
      { label: "Surface", terms: ["mobile", "web", "platform", "API"] },
    ],
    responsibilityTerms: ["roadmap", "prioritization", "discovery"],
    exclusions: ["junior", "intern", "associate"],
  },
  {
    id: "software_engineer",
    label: "Software Engineer",
    triggers: [
      /\b(software\s+(engineer|developer)|swe|sde|backend|frontend|full[- ]?stack|web\s+developer|programmer)\b/i,
    ],
    primaryTerms: [
      "Software Engineer",
      "Software Developer",
      "SWE",
      "Backend Engineer",
      "Full-Stack Engineer",
    ],
    domainGroups: [
      {
        label: "Stack",
        terms: ["TypeScript", "JavaScript", "Python", "Go", "Java", "Rust"],
      },
      {
        label: "Infrastructure",
        terms: ["AWS", "GCP", "Azure", "Kubernetes", "Docker"],
      },
    ],
    responsibilityTerms: ["distributed", "scalability", "production"],
    exclusions: ["junior", "intern", "trainee", "bootcamp"],
  },
  {
    id: "data_scientist",
    label: "Data Scientist",
    triggers: [
      /\b(data\s+(scientist|engineer|analyst)|ml\s+engineer|machine\s+learning|ai\s+engineer)\b/i,
    ],
    primaryTerms: [
      "Data Scientist",
      "ML Engineer",
      "Machine Learning Engineer",
      "AI Engineer",
    ],
    domainGroups: [
      { label: "Tooling", terms: ["Python", "SQL", "PyTorch", "TensorFlow", "scikit-learn"] },
      {
        label: "Methods",
        terms: ["modeling", "experimentation", "A/B testing", "forecasting"],
      },
    ],
    responsibilityTerms: ["production", "pipelines"],
    exclusions: ["junior", "intern"],
  },
  {
    id: "designer",
    label: "Designer",
    triggers: [
      /\b(product\s+designer|ux\s+designer|ui\s+designer|interaction\s+designer|visual\s+designer|design\s+lead)\b/i,
    ],
    primaryTerms: ["Product Designer", "UX Designer", "UI Designer", "Design Lead"],
    domainGroups: [
      { label: "Tools", terms: ["Figma", "Sketch", "Framer"] },
      { label: "Practice", terms: ["research", "prototyping", "design systems"] },
    ],
    responsibilityTerms: ["accessibility"],
    exclusions: ["junior", "intern"],
  },
  {
    id: "marketing",
    label: "Marketing",
    triggers: [
      /\b(marketing\s+(manager|lead|director)|growth\s+(manager|lead|marketer)|demand\s+gen|product\s+marketing|content\s+marketing|seo|brand\s+manager)\b/i,
    ],
    primaryTerms: [
      "Marketing Manager",
      "Growth Marketer",
      "Product Marketing Manager",
      "PMM",
      "Demand Generation",
    ],
    domainGroups: [
      { label: "Channel", terms: ["SEO", "paid", "lifecycle", "content"] },
      { label: "Tooling", terms: ["HubSpot", "Marketo", "Salesforce", "Google Analytics"] },
    ],
    responsibilityTerms: ["pipeline", "attribution"],
    exclusions: ["junior", "intern", "coordinator"],
  },
  {
    id: "sales",
    label: "Sales",
    triggers: [
      /\b(account\s+executive|account\s+manager|sales\s+(manager|lead|director|representative|rep)|business\s+development|bdr|sdr|enterprise\s+sales)\b/i,
    ],
    primaryTerms: [
      "Account Executive",
      "AE",
      "Sales Manager",
      "Account Manager",
      "Business Development",
    ],
    domainGroups: [
      { label: "Segment", terms: ["enterprise", "mid-market", "SMB"] },
      { label: "Tooling", terms: ["Salesforce", "Outreach", "HubSpot"] },
    ],
    responsibilityTerms: ["quota", "pipeline"],
    exclusions: ["intern"],
  },
  {
    id: "recruiter",
    label: "Recruiter",
    triggers: [
      /\b(recruiter|talent\s+(acquisition|partner|sourcer)|technical\s+recruiter|sourcer)\b/i,
    ],
    primaryTerms: ["Recruiter", "Talent Acquisition", "Talent Partner", "Sourcer"],
    domainGroups: [
      { label: "Specialty", terms: ["technical", "executive", "engineering", "product"] },
      { label: "Tooling", terms: ["Greenhouse", "Lever", "LinkedIn Recruiter", "Workday"] },
    ],
    responsibilityTerms: ["sourcing", "pipeline"],
    exclusions: ["intern"],
  },
];

/** Generic fallback used when no taxonomy entry matches. */
const GENERIC_CATEGORY: RoleCategory = {
  id: "generic",
  label: "Knowledge worker",
  triggers: [],
  primaryTerms: [],
  domainGroups: [],
  responsibilityTerms: [],
  exclusions: ["intern"],
};

/**
 * Resolve a free-text target role (e.g. "Senior Product Manager at
 * Anthropic — building agents") to the closest taxonomy entry. Returns
 * the generic category when nothing matches; the caller is responsible
 * for synthesising a primary term from the raw role string in that case.
 */
export function findRoleCategory(targetRole: string): RoleCategory {
  const role = (targetRole || "").trim();
  if (!role) return GENERIC_CATEGORY;
  for (const category of ROLE_CATEGORIES) {
    if (category.triggers.some((re) => re.test(role))) return category;
  }
  return GENERIC_CATEGORY;
}

export const __TEST_ONLY = { ROLE_CATEGORIES, GENERIC_CATEGORY };

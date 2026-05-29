/**
 * LinkedIn deep-link map.
 *
 * The /in/{slug}/* routes resolve only against a real profile slug.
 * The `/in/me/...` shortcut works for the *intro* edit modal but
 * silently 404s or lands on a generic page for `/details/experience`,
 * `/edit/forms/summary/new` and several other section editors. So we
 * extract the profile slug from `window.location.pathname` at the
 * moment the user clicks the button — the content script only mounts
 * on `/in/[slug]/` (see ownership.isLinkedInProfileUrl), so the slug
 * is always present.
 *
 * Verified URL shapes (May 2026, web LinkedIn):
 *   headline / intro    →  /in/{slug}/edit/intro/
 *   about / summary     →  /in/{slug}/edit/forms/summary/new/
 *   experience          →  /in/{slug}/details/experience/
 *   skills              →  /in/{slug}/details/skills/
 *   education           →  /in/{slug}/details/education/
 *   certifications      →  /in/{slug}/details/certifications/
 *
 * Used by SectionRow's per-section AI rewrite "Edit on LinkedIn" button
 * and ConsistencySync's full-profile aligned rewrite (each card).
 *
 * Adding a new generator type? Add the deep link here. Anything not in
 * this map cannot be deep-linked, and the UI should hide the button.
 */

import type { GeneratorType } from "../auth/api";

type SectionPath = string;

/**
 * Path templates keyed by generator. The token `{slug}` is replaced
 * with the user's actual profile slug at call time. Kept relative to
 * `https://www.linkedin.com` so we don't have to repeat the host.
 */
const SECTION_PATHS: Record<GeneratorType, SectionPath> = {
  headline: "/in/{slug}/edit/intro/",
  about: "/in/{slug}/edit/forms/summary/new/",
  experience_bullets: "/in/{slug}/details/experience/",
  skills: "/in/{slug}/details/skills/",
};

const LINKEDIN_HOST = "https://www.linkedin.com";

/**
 * Resolve the user's profile slug from the current page URL.
 *
 * The content script is only mounted on `/in/{slug}/` pages, so this
 * usually succeeds. We fall back to `me` only if the function is
 * called from a non-profile context — that path lands on the intro
 * edit page for the signed-in user but won't work for other sections.
 */
export function readProfileSlug(): string {
  if (typeof window === "undefined") return "me";
  try {
    const path = window.location.pathname;
    const match = path.match(/^\/in\/([^/?#]+)/i);
    if (match && match[1]) {
      return decodeURIComponent(match[1]);
    }
  } catch {
    /* fall through */
  }
  return "me";
}

/** Build the absolute deep-link URL for the given generator. */
export function deepLinkFor(
  generator: GeneratorType,
  slug: string = readProfileSlug(),
): string | null {
  const path = SECTION_PATHS[generator];
  if (!path) return null;
  // encodeURIComponent so unusual slug characters don't break the URL.
  // (LinkedIn vanity slugs allow alphanumerics, hyphens, underscores
  // and a small set of unicode letters — encoding is a safety net.)
  const safeSlug = encodeURIComponent(slug);
  return `${LINKEDIN_HOST}${path.replace("{slug}", safeSlug)}`;
}

/**
 * Backwards-compatible static map for callers that need a stable
 * record (e.g. tests). Reads the slug at module load — for runtime
 * accuracy (slug captured at click time) prefer `deepLinkFor()`.
 */
export const LINKEDIN_EDIT_URL: Record<GeneratorType, string> = {
  headline: deepLinkFor("headline") ?? "",
  about: deepLinkFor("about") ?? "",
  experience_bullets: deepLinkFor("experience_bullets") ?? "",
  skills: deepLinkFor("skills") ?? "",
};

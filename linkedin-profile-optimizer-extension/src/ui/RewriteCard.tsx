import type { ProfileData } from "../adapter/types";
import type { GeneratorType } from "../auth/api";
import { serializeExperienceForPrompt } from "./serializeExperience";

/**
 * Maps a scoring check ID to a Claude generator and to the section
 * text we send as input. Returning null means the check has no
 * rewriter (photo, banner, education, etc.). Used by SectionRow's
 * inline rewrite action.
 *
 * Note: in the Stripe-grade revamp the visible RewriteCard component
 * was inlined into SectionRow. This module retains only the
 * `getRewriteFor` mapping helper that consumers still depend on.
 */
export function getRewriteFor(
  checkId: string,
  profile: ProfileData | null,
): { generator: GeneratorType; currentText: string } | null {
  if (!profile) return null;
  switch (checkId) {
    case "headline-keywords":
      return { generator: "headline", currentText: profile.headline?.value ?? "" };
    case "about-depth":
    case "about-hook":
      return { generator: "about", currentText: profile.about?.value ?? "" };
    case "experience-filled":
    case "quantified-bullets":
      return {
        generator: "experience_bullets",
        currentText: serializeExperienceForPrompt(profile.experience?.value ?? []),
      };
    case "skills-count":
      return {
        generator: "skills",
        currentText: (profile.skills?.value ?? []).join("\n"),
      };
    default:
      return null;
  }
}


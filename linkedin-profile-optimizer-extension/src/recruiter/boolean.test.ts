import { describe, expect, it } from "vitest";

import type { ProfileData } from "../adapter/types";
import { buildRecruiterBoolean } from "./boolean";
import { findRoleCategory } from "./synonyms";

/** Helper: build a ProfileData with sensible "successfully read" defaults. */
function makeProfile(partial: {
  headline?: string;
  about?: string;
  experienceTitle?: string;
  experienceDescription?: string;
  experienceBullets?: string[];
  skills?: string[];
}): ProfileData {
  return {
    headline:
      partial.headline !== undefined
        ? { value: partial.headline, confidence: 1 }
        : { value: "", confidence: 1 },
    about:
      partial.about !== undefined
        ? { value: partial.about, confidence: 1 }
        : { value: "", confidence: 1 },
    experience: {
      value: [
        {
          title: { value: partial.experienceTitle ?? "", confidence: 1 },
          company: { value: "Acme", confidence: 1 },
          description: { value: partial.experienceDescription ?? "", confidence: 1 },
          bullets: { value: partial.experienceBullets ?? [], confidence: 1 },
        },
      ],
      confidence: 1,
    },
    skills: { value: partial.skills ?? [], confidence: 1 },
  };
}

const EMPTY_PROFILE: ProfileData = {
  headline: { value: "", confidence: 1 },
  about: { value: "", confidence: 1 },
  experience: { value: [], confidence: 1 },
  skills: { value: [], confidence: 1 },
};

describe("findRoleCategory", () => {
  it("matches Product Manager from a verbose role string", () => {
    const cat = findRoleCategory("Senior Product Manager at Anthropic — building agents");
    expect(cat.id).toBe("product_manager");
  });
  it("matches Software Engineer abbreviations", () => {
    expect(findRoleCategory("SWE").id).toBe("software_engineer");
    expect(findRoleCategory("Backend Engineer").id).toBe("software_engineer");
    expect(findRoleCategory("Full-stack developer").id).toBe("software_engineer");
  });
  it("matches Data Scientist + ML variants", () => {
    expect(findRoleCategory("Data Scientist").id).toBe("data_scientist");
    expect(findRoleCategory("ML Engineer").id).toBe("data_scientist");
    expect(findRoleCategory("Machine Learning Engineer").id).toBe("data_scientist");
  });
  it("falls back to generic when no taxonomy match", () => {
    const cat = findRoleCategory("Underwater basket weaving lead");
    expect(cat.id).toBe("generic");
  });
  it("returns generic for empty input", () => {
    expect(findRoleCategory("").id).toBe("generic");
    expect(findRoleCategory("   ").id).toBe("generic");
  });
});

describe("buildRecruiterBoolean — query string shape", () => {
  it("produces the canonical PM query", () => {
    const result = buildRecruiterBoolean({
      targetRole: "Product Manager",
      profile: makeProfile({
        headline: "Senior Product Manager",
        about: "I lead roadmap and prioritization for SaaS products",
        experienceTitle: "Senior Product Manager",
        skills: ["Roadmap", "B2B"],
      }),
    });
    expect(result.query).toContain("\"Product Manager\"");
    expect(result.query).toContain("OR PM");
    expect(result.query).toContain(" AND ");
    expect(result.query).toContain("roadmap");
    expect(result.copyableQuery).toBe(result.query);
  });

  it("quotes multi-word terms and leaves single tokens bare", () => {
    const result = buildRecruiterBoolean({
      targetRole: "Software Engineer",
      profile: makeProfile({}),
    });
    // "Software Engineer" is multi-word ⇒ quoted
    expect(result.query).toContain("\"Software Engineer\"");
    // "SWE" is a single token ⇒ unquoted
    expect(result.query).toContain("OR SWE");
  });

  it("appends NOT clause for senior roles when junior absent from profile", () => {
    const result = buildRecruiterBoolean({
      targetRole: "Senior Product Manager",
      profile: makeProfile({
        headline: "Senior PM at Acme — 8 years experience",
        about: "Senior product leader, roadmap and SaaS",
        skills: ["B2B"],
      }),
    });
    expect(result.query).toContain("NOT junior");
    expect(result.notTerms).toContain("junior");
  });

  it("does NOT emit a NOT junior clause when the profile has no seniority signal", () => {
    // Without any "Senior/Lead/Principal" signal, NOT junior would
    // accidentally hide the user's own profile from the recruiter.
    const result = buildRecruiterBoolean({
      targetRole: "Product Manager",
      profile: makeProfile({
        headline: "Product Manager",
        about: "Building product",
      }),
    });
    expect(result.notTerms).not.toContain("junior");
  });
});

describe("buildRecruiterBoolean — verdict logic", () => {
  it("would-surface=true when every clause matches", () => {
    const result = buildRecruiterBoolean({
      targetRole: "Product Manager",
      profile: makeProfile({
        headline: "Senior Product Manager — SaaS, web platform",
        about:
          "I run roadmap and prioritization for B2B SaaS. Experienced with discovery and platform work on mobile and web.",
        experienceTitle: "Product Manager",
        skills: ["Roadmap", "B2B", "SaaS", "Discovery", "Prioritization"],
      }),
    });
    expect(result.verdict.wouldSurface).toBe(true);
    expect(result.verdict.unsatisfiedClauses).toBe(0);
    expect(result.verdict.missingTermCount).toBe(0);
  });

  it("would-surface=false on an empty profile", () => {
    const result = buildRecruiterBoolean({
      targetRole: "Product Manager",
      profile: EMPTY_PROFILE,
    });
    expect(result.verdict.wouldSurface).toBe(false);
    expect(result.verdict.unsatisfiedClauses).toBeGreaterThan(0);
  });

  it("flags the specific failing OR clause in the verdict reason", () => {
    const result = buildRecruiterBoolean({
      targetRole: "Software Engineer",
      profile: makeProfile({
        // Has the role term but no stack mentions.
        headline: "Software Engineer at Acme",
        about: "I write code.",
      }),
    });
    expect(result.verdict.wouldSurface).toBe(false);
    // Missing "Stack" or "Infrastructure" group depending on which is unsatisfied.
    expect(result.verdict.reason.toLowerCase()).toMatch(/stack|infrastructure/);
  });

  it("does not surface when a NOT term hits the profile", () => {
    const result = buildRecruiterBoolean({
      targetRole: "Senior Software Engineer",
      profile: makeProfile({
        headline: "Senior Software Engineer (formerly junior dev)",
        about:
          "Senior engineer with TypeScript and AWS, distributed scalability in production.",
        experienceDescription: "intern at Acme",
        skills: ["TypeScript", "AWS", "Kubernetes"],
      }),
    });
    // The NOT junior / NOT intern clause hits the headline/experience.
    expect(result.verdict.wouldSurface).toBe(false);
    expect(result.verdict.reason).toMatch(/NOT/);
  });
});

describe("buildRecruiterBoolean — section gap mapping", () => {
  it("routes missing skill-shaped tokens to the skills section", () => {
    const result = buildRecruiterBoolean({
      targetRole: "Software Engineer",
      profile: makeProfile({
        headline: "Software Engineer",
        about: "I build production distributed systems.",
        experienceTitle: "Software Engineer",
      }),
    });
    const skillsGap = result.missingBySection.find((g) => g.section === "skills");
    expect(skillsGap).toBeDefined();
    // At least one ALL-CAPS or PascalCase term should land in skills.
    expect(skillsGap!.terms.some((t) => /[A-Z]/.test(t))).toBe(true);
  });

  it("routes missing role names to headline + experience", () => {
    const result = buildRecruiterBoolean({
      targetRole: "Product Manager",
      profile: EMPTY_PROFILE,
    });
    const headline = result.missingBySection.find((g) => g.section === "headline");
    const experience = result.missingBySection.find((g) => g.section === "experience");
    expect(headline).toBeDefined();
    expect(experience).toBeDefined();
    expect(headline!.terms).toContain("Product Manager");
    expect(experience!.terms).toContain("Product Manager");
  });

  it("never reports gaps for sections it could not read", () => {
    // Mark every section as unread (confidence: 0).
    const unread: ProfileData = {
      headline: { confidence: 0, unread: true },
      about: { confidence: 0, unread: true },
      experience: { confidence: 0, unread: true },
      skills: { confidence: 0, unread: true },
    };
    const result = buildRecruiterBoolean({
      targetRole: "Product Manager",
      profile: unread,
    });
    expect(result.missingBySection).toEqual([]);
  });
});

describe("buildRecruiterBoolean — JD augmentation", () => {
  it("adds JD-derived AND terms when a job description is supplied", () => {
    const baseline = buildRecruiterBoolean({
      targetRole: "Product Manager",
      profile: makeProfile({}),
    });
    const withJd = buildRecruiterBoolean({
      targetRole: "Product Manager",
      profile: makeProfile({}),
      jobDescription:
        "We are hiring a senior product manager. Strong fintech background needed. " +
        "Build product around payments orchestration and merchant experience. " +
        "Deep experience with payments compliance preferred.",
    });
    // JD augmentation must add at least one extra AND term.
    expect(withJd.andTerms.length).toBeGreaterThan(baseline.andTerms.length);
    expect(withJd.andTerms.some((t) => /payments|fintech|merchant|compliance/i.test(t.term))).toBe(true);
  });

  it("never adds JD AND term that duplicates an existing taxonomy term", () => {
    const result = buildRecruiterBoolean({
      targetRole: "Product Manager",
      profile: makeProfile({}),
      jobDescription:
        "We need a PM with strong roadmap, prioritization, and discovery skills. " +
        "B2B SaaS background required. Manage roadmap end-to-end.",
    });
    // "roadmap" already in taxonomy → no duplicate AND term.
    const dups = result.andTerms.filter(
      (t) => t.term.toLowerCase() === "roadmap",
    );
    expect(dups.length).toBe(1);
  });

  it("caps JD-derived AND terms to a small handful so the query stays readable", () => {
    const longJd = Array.from({ length: 50 }, (_, i) => `keyword${i}`).join(" ");
    const result = buildRecruiterBoolean({
      targetRole: "Product Manager",
      profile: makeProfile({}),
      jobDescription: longJd,
    });
    const taxonomyAndCount = 3; // PM has 3 responsibility terms.
    expect(result.andTerms.length).toBeLessThanOrEqual(taxonomyAndCount + 4);
  });
});

describe("buildRecruiterBoolean — determinism", () => {
  it("produces identical output across repeated invocations", () => {
    const args = {
      targetRole: "Product Manager",
      profile: makeProfile({
        headline: "Senior Product Manager — SaaS",
        about: "I lead roadmap for B2B products.",
        skills: ["Roadmap", "SaaS"],
      }),
      jobDescription: "Build product. Manage roadmap. SaaS B2B fintech payments.",
    };
    const a = buildRecruiterBoolean(args);
    const b = buildRecruiterBoolean(args);
    expect(a.query).toBe(b.query);
    expect(a.verdict).toEqual(b.verdict);
    expect(a.missingBySection).toEqual(b.missingBySection);
  });
});

describe("buildRecruiterBoolean — generic fallback", () => {
  it("synthesizes a primary OR group from the raw role when no taxonomy match", () => {
    const result = buildRecruiterBoolean({
      targetRole: "Founding Operations Lead",
      profile: makeProfile({}),
    });
    expect(result.resolvedFromTaxonomy).toBe(false);
    expect(result.roleLabel).toMatch(/Operations|Founding/i);
    // Primary OR clause should still emit even for unknown roles.
    expect(result.orClauses.length).toBeGreaterThan(0);
  });
});

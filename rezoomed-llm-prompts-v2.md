# Rezoomed — LLM Pipeline Architecture (v3)

## Overview

Two tiers. One model. Maximum value per token.

| Tier | What they get | Model | Est. cost/request |
|---|---|---|---|
| **Free** | ATS score + section scores (numbers only) | DeepSeek V3.2 | ~$0.0002 |
| **Pro** | Full ATS breakdown + issues + bullet rewrites + skills optimization + JD tailoring + match score + gap analysis | DeepSeek V3.2 | ~$0.001 (ATS) / ~$0.002 (JD tailor) |

**Why DeepSeek V3.2 for everything:**
- $0.26/$0.38 per 1M tokens via OpenRouter. Output tokens are 6.5x cheaper than Gemini 2.5 Flash ($0.38 vs $2.50) — and output is where most of the cost sits for resume analysis.
- 90% cache discount on repeated context ($0.028/M). System prompts stay identical across all users, so after the first request they are essentially free.
- Quality: matches ~90% of GPT-5.4 performance. For structured tasks like resume scoring, bullet rewriting, and JD keyword mapping, the gap is negligible.
- Via OpenRouter, inference runs on US-hosted providers (Together AI, Fireworks, etc.). Resume data never touches Chinese infrastructure.

**Regulatory contingency (the whole point of OpenRouter):**
If DeepSeek faces a broader US commercial ban, swap one string:

```javascript
// Today
const MODEL = "deepseek/deepseek-v4-flash";

// If regulatory change hits — one line swap, zero code changes
const MODEL = "google/gemini-2.5-flash";        // 2x more expensive on output, still cheap
// OR
const MODEL = "anthropic/claude-sonnet-4.6";     // 40x more expensive, best quality
// OR
const MODEL = "meta-llama/llama-3.3-70b";        // free tier available, open source
```

No prompt changes needed. No schema changes. No frontend changes. The prompts are model-agnostic by design.

**Token budget per request:**

| Component | Free | Pro (ATS) | Pro (JD Tailor) |
|---|---|---|---|
| System prompt | ~800 | ~1,500 | ~1,800 |
| Resume input | ~1,000 | ~1,000 | ~1,000 |
| JD input | — | — | ~800 |
| Output | ~300 | ~2,500 | ~3,000 |
| **Total** | **~2,100** | **~5,000** | **~6,600** |

---

## PIPELINE 1: FREE — ATS Score Only

### Model: DeepSeek V3.2 (via OpenRouter)

**What the user sees:** A score out of 100, six section scores as numbers, detected/missing sections, and whether they have quantified achievements. That's it. No issues, no suggestions, no fixes. Enough to know their resume needs work, not enough to know what to fix.

**Conversion hook:** User sees "Content Quality: 8/25" in red but can't see why. The "Unlock detailed feedback" CTA sits right next to the locked insights.

**Cost:** ~$0.0002 per request (~5,000 free analyses per dollar)

### System Prompt

```
You are an ATS (Applicant Tracking System) resume scorer. Score the resume strictly.

SCORING CRITERIA:

1. CONTACT INFORMATION (10 pts): Full name (3), professional email (3), phone (2), LinkedIn or portfolio (2)
2. SECTION STRUCTURE (15 pts): Labeled Experience section (4), labeled Education section (3), labeled Skills section (4), standard heading names not creative ones (4)
3. FORMATTING & PARSEABILITY (20 pts): Clean bullet points or line breaks (5), no tables/columns/complex layouts (5), standard date formats (5), clear job titles distinct from company names (5)
4. CONTENT QUALITY (25 pts): Bullets start with action verbs (7), quantified achievements with numbers/percentages (8), impact-focused not duty-focused descriptions (10)
5. KEYWORD OPTIMIZATION (15 pts): Industry-relevant technical skills present (8), skills mentioned within experience bullets not just skills section (7)
6. LENGTH & DENSITY (15 pts): Appropriate length (5), no large unexplained employment gaps (5), minimal filler phrases (5)

CALIBRATION:
- 85-100: Exceptional. Rarely given.
- 65-84: Good with room to improve.
- 45-64: Average. Needs significant work.
- 25-44: Below average.
- 0-24: Major structural problems.

Respond with ONLY this JSON. No markdown fences. No preamble. No explanation.

{
  "ats_score": <integer 0-100>,
  "section_scores": {
    "contact_information": {"score": <int>, "max": 10},
    "section_structure": {"score": <int>, "max": 15},
    "formatting": {"score": <int>, "max": 20},
    "content_quality": {"score": <int>, "max": 25},
    "keyword_optimization": {"score": <int>, "max": 15},
    "length_density": {"score": <int>, "max": 15}
  },
  "detected_sections": ["<section names found in the resume>"],
  "missing_sections": ["<standard sections not found>"],
  "word_count": <int>,
  "has_quantified_achievements": <boolean>
}

RULES:
- Be strict. Most resumes score 40-70.
- Score only. No issues. No suggestions. No feedback.
- ONLY output the JSON object.
```

### User Message

```
RESUME:
---
{parsed_resume_text}
---
```

---

## PIPELINE 2: PRO — Full ATS Breakdown + Resume Fix Suggestions

### Model: DeepSeek V3.2 (via OpenRouter)

**What the user sees:** Everything from free PLUS detailed issues per section, top 3 highest-impact fixes, rewritten bullet suggestions they can copy-paste, a summary/objective suggestion, and skills section optimization.

**Cost:** ~$0.001 per request (~1,000 analyses per dollar)

### System Prompt

```
You are Rezoomed Resume Optimizer — an expert resume writer and ATS specialist.

TWO JOBS:
1. Score the resume for ATS compatibility with detailed section-level feedback
2. Rewrite the weakest bullets so the user can copy-paste improvements directly

SCORING CRITERIA (score each honestly):

1. CONTACT INFORMATION (10 pts): Full name (3), professional email (3), phone (2), LinkedIn or portfolio (2)
2. SECTION STRUCTURE (15 pts): Labeled Experience section (4), labeled Education section (3), labeled Skills section (4), standard heading names (4)
3. FORMATTING & PARSEABILITY (20 pts): Clean bullets/line breaks (5), no tables/columns (5), standard dates (5), clear titles (5)
4. CONTENT QUALITY (25 pts): Action verbs (7), quantified achievements (8), impact over duties (10)
5. KEYWORD OPTIMIZATION (15 pts): Relevant technical skills (8), skills in experience bullets (7)
6. LENGTH & DENSITY (15 pts): Appropriate length (5), no unexplained gaps (5), minimal filler (5)

BULLET REWRITE RULES:
- Start every bullet with a strong specific action verb: Led, Built, Designed, Reduced, Automated, Migrated, Shipped, Negotiated. NEVER "Responsible for", "Helped with", "Worked on", "Assisted in"
- Add quantification. If the original says "managed clients", suggest "Managed a portfolio of [X]+ enterprise clients". Use [X] as placeholder for the user to fill in
- Show IMPACT not activity: "Reduced onboarding time by [X]% by building automated training module" NOT "Created training materials"
- Keep bullets to 1-2 lines max
- NEVER fabricate experience. Only reframe what exists. Mark metric placeholders clearly as [X]
- Remove filler: "Responsible for", "Duties included", "Successfully", "Effectively"
- Formula: [Action Verb] + [What You Did] + [Scale/Scope] + [Impact/Result]

Respond with ONLY this JSON:

{
  "ats_score": <integer 0-100>,
  "section_scores": {
    "contact_information": {"score": <int>, "max": 10, "issues": ["<specific issue max 15 words>"]},
    "section_structure": {"score": <int>, "max": 15, "issues": ["..."]},
    "formatting": {"score": <int>, "max": 20, "issues": ["..."]},
    "content_quality": {"score": <int>, "max": 25, "issues": ["..."]},
    "keyword_optimization": {"score": <int>, "max": 15, "issues": ["..."]},
    "length_density": {"score": <int>, "max": 15, "issues": ["..."]}
  },
  "top_3_fixes": [
    "<most impactful fix in 1 sentence>",
    "<second most impactful fix>",
    "<third most impactful fix>"
  ],
  "detected_sections": ["..."],
  "missing_sections": ["..."],
  "word_count": <int>,
  "has_quantified_achievements": <boolean>,
  "action_verb_percentage": <float 0-100>,
  "bullet_rewrites": [
    {
      "section": "<Experience | Projects | etc>",
      "company_or_project": "<name>",
      "original": "<exact original bullet text>",
      "rewritten": "<improved version>",
      "why": "<1 sentence: what changed and why>"
    }
  ],
  "summary_suggestion": "<if no summary exists, suggest one in 2-3 sentences for their apparent target role; if one exists and is weak, rewrite it; if good, null>",
  "skills_section_suggestion": {
    "current_skills": ["<skills currently listed>"],
    "missing_high_value_skills": ["<skills implied by experience but not listed>"],
    "recommended_format": "<how to organize: by category, by proficiency, etc>"
  },
  "overall_assessment": "<2-3 sentence honest assessment: strengths and what is holding it back>"
}

RULES:
- Rewrite at least the 5 weakest bullets. If fewer than 5 total, rewrite all.
- Be strict in scoring but constructive in suggestions.
- Never add experience the person does not have. Only reframe what is there.
- issues arrays: short, specific, actionable strings. Max 15 words each.
- ONLY output the JSON object.
```

### User Message

```
RESUME:
---
{parsed_resume_text}
---

Score this resume and provide rewrite suggestions.
```

---

## PIPELINE 3: PRO — JD Tailoring

### Model: DeepSeek V3.2 (via OpenRouter)

**Why same model works here too:** JD tailoring is the hardest task — mapping transferable skills, identifying gaps, reframing experience honestly. DeepSeek V3.2 handles this well for structured resume-to-JD matching. At ~$0.002 per request, you can offer unlimited JD tailoring in Pro without bleeding money. If user feedback indicates quality issues on edge cases (career pivots, highly technical JDs), you can selectively route those to Claude Sonnet via a quality flag — but start with DeepSeek for all.

**Cost:** ~$0.002 per request

### System Prompt

```
You are Rezoomed JD Tailor — an expert at adapting resumes to specific job descriptions while maintaining complete honesty about the candidate's actual experience.

TASK: Given a resume and a job description, produce a tailored version of the resume that maximizes relevance to the JD without fabricating any experience.

TAILORING PRINCIPLES:

1. KEYWORD ALIGNMENT
   - Identify the top 10-15 keywords/phrases from the JD
   - Map existing resume content to these keywords using honest reframing
   - Example: JD says "stakeholder management", resume says "worked with clients" → rewrite as "Managed stakeholder relationships across [X] enterprise banking clients"
   - NEVER add keywords for skills the person does not demonstrably have

2. EXPERIENCE REFRAMING
   - Reorder bullet points within each role to lead with JD-relevant ones
   - Rewrite bullets to emphasize JD-aligned aspects
   - Example: JD wants "data-driven decision making", resume has "created reports" → rewrite as "Drove data-driven product decisions by designing analytics dashboards tracking [X] KPIs"
   - Add honest context that connects experience to JD requirements

3. SKILLS SECTION OPTIMIZATION
   - Reorder skills to front-load JD-relevant ones
   - Add skills genuinely implied by experience but not explicitly listed
   - Deprioritize skills irrelevant to this specific role

4. SUMMARY REWRITE
   - Write a 2-3 sentence summary directly addressing the JD's core requirements
   - Frame background as a natural fit for this specific role
   - Mention strongest JD-relevant differentiator

5. GAP ANALYSIS
   - Identify JD requirements the candidate genuinely lacks
   - Be honest — do NOT manufacture a fit
   - Suggest how they might address gaps (certifications, projects, honest framing)

HONESTY RULES (NON-NEGOTIABLE):
- NEVER fabricate experience, projects, or skills
- NEVER upgrade titles ("Analyst" stays "Analyst", never becomes "Senior Analyst")
- NEVER claim proficiency in tools not evidenced in the resume
- If a JD requirement has zero mapping to experience, say so clearly in gaps
- Use [X] placeholders for metrics. Never invent numbers
- If the role is a genuine mismatch, flag it clearly

Respond with ONLY this JSON:

{
  "match_score": <integer 0-100>,
  "match_tier": "<STRONG_FIT | MODERATE_FIT | STRETCH | LONG_SHOT>",
  "jd_keywords": {
    "matched": [
      {"keyword": "<JD keyword>", "evidence": "<where in resume this is demonstrated>"}
    ],
    "unmatched": [
      {"keyword": "<JD keyword>", "suggestion": "<how to address, or 'genuine gap' if no honest mapping>"}
    ]
  },
  "tailored_summary": "<rewritten 2-3 sentence professional summary for this JD>",
  "tailored_bullets": [
    {
      "section": "<section name>",
      "company_or_project": "<name>",
      "original": "<original bullet>",
      "tailored": "<rewritten to align with JD>",
      "jd_keywords_hit": ["<keywords this bullet now targets>"]
    }
  ],
  "skills_reorder": {
    "recommended_order": ["<skill1>", "<skill2>", "..."],
    "add": ["<skills to add that are honestly implied>"],
    "deprioritize": ["<skills to move down for this JD>"]
  },
  "gaps": [
    {
      "jd_requirement": "<what JD asks for>",
      "gap_severity": "<CRITICAL | MODERATE | MINOR>",
      "mitigation": "<honest suggestion to address>"
    }
  ],
  "bullet_reorder": [
    {
      "section": "<section name>",
      "company_or_project": "<name>",
      "recommended_order": ["<bullet_index_1>", "<bullet_index_2>"],
      "reason": "<why this order better serves this JD>"
    }
  ],
  "overall_strategy": "<2-3 sentence tailoring strategy for THIS role>",
  "shortlisting_probability": "<LOW | MODERATE | HIGH | VERY_HIGH>",
  "honest_assessment": "<1-2 sentences on whether this is a realistic target>"
}

MATCH SCORE CALIBRATION:
- 85-100: Almost every JD requirement maps to real experience. Strong fit.
- 70-84: Most requirements met, 1-2 moderate gaps. Competitive.
- 50-69: Several gaps but transferable skills exist. Worth applying with strong cover letter.
- 30-49: Significant gaps. Stretch application.
- 0-29: Fundamental mismatch. Candidate should target different roles.

RULES:
- Tailor at least the 5 most impactful bullets.
- Every tailored bullet must hit at least 1 JD keyword.
- Be honest in shortlisting_probability. No false hope.
- ONLY output the JSON object.
```

### User Message

```
RESUME:
---
{parsed_resume_text}
---

JOB DESCRIPTION:
---
{job_description_text}
---

Tailor this resume to the job description.
```

---

## Implementation

### API Call

```javascript
// Single model for all pipelines — swap this one line if regulations change
const MODEL = "deepseek/deepseek-v4-flash";

// Fallback chain: if primary is down or gets banned, try next
const FALLBACK_CHAIN = [
  "deepseek/deepseek-v4-flash",   // fast, low cost — best value
  "google/gemini-2.5-flash",       // $0.30/$2.50 — safe fallback
  "meta-llama/llama-3.3-70b",      // free tier available
];

const analyzeResume = async (resumeText, pipeline, jdText = null) => {
  const systemPrompts = {
    free_ats: FREE_ATS_SYSTEM_PROMPT,
    pro_ats: PRO_ATS_SYSTEM_PROMPT,
    pro_jd_tailor: JD_TAILOR_SYSTEM_PROMPT,
  };

  const userMessage = jdText
    ? `RESUME:\n---\n${resumeText}\n---\n\nJOB DESCRIPTION:\n---\n${jdText}\n---\n\nTailor this resume to the job description.`
    : pipeline === "free_ats"
      ? `RESUME:\n---\n${resumeText}\n---`
      : `RESUME:\n---\n${resumeText}\n---\n\nScore this resume and provide rewrite suggestions.`;

  // Try each model in fallback chain
  for (const model of FALLBACK_CHAIN) {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://rezoomed.com",
          "X-Title": "Rezoomed",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompts[pipeline] },
            { role: "user", content: userMessage },
          ],
          temperature: 0.3,
          max_tokens: pipeline === "free_ats" ? 800 : 4000,
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) continue; // try next model

      const data = await response.json();
      const raw = data.choices[0].message.content;
      const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());

      return { success: true, model, data: parsed };
    } catch (err) {
      continue; // try next model in chain
    }
  }

  return { success: false, error: "All models failed" };
};
```

### Rate Limits & Cost Control

```javascript
const TIER_LIMITS = {
  free: {
    requests_per_day: 3,
    allowed_pipelines: ["free_ats"],
    max_input_chars: 8000,    // ~2000 tokens
    max_output_tokens: 800,
  },
  pro: {
    requests_per_day: 50,
    allowed_pipelines: ["free_ats", "pro_ats", "pro_jd_tailor"],
    max_input_chars: 20000,   // ~5000 tokens
    max_output_tokens: 4000,
  },
};
```

### Pre-LLM Processing (saves tokens)

```javascript
const preProcess = (resumeText) => ({
  wordCount: resumeText.split(/\s+/).length,
  hasEmail: /[\w.-]+@[\w.-]+\.\w+/.test(resumeText),
  hasPhone: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(resumeText),
  hasLinkedIn: /linkedin\.com/i.test(resumeText),
  hasStandardSections: {
    experience: /\b(experience|work\s*experience|employment|professional\s*experience)\b/i.test(resumeText),
    education: /\b(education|academic|qualifications)\b/i.test(resumeText),
    skills: /\b(skills|technical\s*skills|competencies|technologies)\b/i.test(resumeText),
  },
  bulletCount: (resumeText.match(/^[\s]*[•\-\*▪]/gm) || []).length,
  trimmedText: resumeText.slice(0, 16000),
});
```

### Fallback

Built into the main `analyzeResume` function above. The `FALLBACK_CHAIN` array tries models in order:
1. DeepSeek V3.2 — cheapest, best value
2. Gemini 2.5 Flash — Google-hosted, zero regulatory risk
3. Llama 3.3 70B — free tier, open source, last resort

If DeepSeek gets banned commercially, just remove it from the array. Zero downtime.

### Caching

```
CACHE STRATEGY:
- hash(resume_text) → free ATS score: cache 24 hours (same resume = same score)
- hash(resume_text) → pro ATS analysis: cache 24 hours
- hash(resume_text + jd_text) → JD tailoring: cache 24 hours
- Invalidate all caches on resume edit
- System prompts: cached by OpenRouter/provider automatically
```

---

## Feature Matrix

| Feature | Free | Pro |
|---|---|---|
| ATS Score (0-100) | ✅ | ✅ |
| Section scores (numbers) | ✅ | ✅ |
| Section-level issues & feedback | ❌ | ✅ |
| Top 3 highest-impact fixes | ❌ | ✅ |
| Bullet rewrite suggestions | ❌ | ✅ |
| Summary/objective generator | ❌ | ✅ |
| Skills section optimization | ❌ | ✅ |
| JD tailoring | ❌ | ✅ |
| JD match score & gap analysis | ❌ | ✅ |
| Shortlisting probability | ❌ | ✅ |
| Daily requests | 3 | 50 |
| Model | DeepSeek V3.2 | DeepSeek V3.2 |

---

## Monthly Cost Projections

Assumptions: 80% of requests are free tier, 20% are Pro. Pro requests split 60% ATS / 40% JD tailoring. All on DeepSeek V3.2 via OpenRouter.

| Daily Users | Free Cost/day | Pro ATS Cost/day | Pro JD Cost/day | **Total/month** |
|---|---|---|---|---|
| 100 | $0.016 | $0.012 | $0.016 | **~$1.30** |
| 1,000 | $0.16 | $0.12 | $0.16 | **~$13** |
| 10,000 | $1.60 | $1.20 | $1.60 | **~$132** |
| 50,000 | $8.00 | $6.00 | $8.00 | **~$660** |

At 10,000 DAU with a $10/month Pro subscription and 5% conversion rate, that's **$5,000 revenue vs ~$132 LLM cost**. 97% gross margin on the AI layer.

**If forced to swap to Gemini 2.5 Flash (regulatory scenario):**

| Daily Users | Total/month (Gemini) | vs DeepSeek |
|---|---|---|
| 10,000 | ~$540 | ~4x more |
| 50,000 | ~$2,700 | ~4x more |

Still very profitable. The margins compress from 97% to ~89% — completely manageable.

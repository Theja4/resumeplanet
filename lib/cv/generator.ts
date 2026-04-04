import { callClaudeJSONRace } from '@/lib/claude'
import { applyTailorAnalysisToResumeData } from '@/lib/tailorResume'
import {
  normalizeResumeData,
  normalizeTailorAnalysis,
  resumeDataToGeneratorContext,
} from '@/lib/cv/shared'
import type { ResumeData, TailorAnalysis, TailorIntensity } from '@/types'

const CV_ANALYSIS_MODELS = Array.from(
  new Set([
    process.env.ANTHROPIC_MODEL_PREMIUM || 'deepseek/deepseek-v3.2',
    'google/gemini-2.5-flash',
  ].filter(Boolean))
)

const CV_GENERATOR_SYSTEM = `You are Rezoomed CV Generator, an elite recruiter, hiring manager, and ATS strategist.

You are generating the strongest possible interview-winning CV for a specific job description while staying completely truthful to the candidate's actual background.

PRIMARY OBJECTIVE:
- Maximize shortlist odds for this exact role.
- Make the document feel sharp, specific, modern, and credible.
- Improve both ATS keyword alignment and recruiter skim quality.

NON-NEGOTIABLE HONESTY RULES:
- Never invent employers, titles, dates, promotions, budgets, teams, products, tools, certifications, metrics, education, projects, or responsibilities.
- Never imply hands-on experience with a skill or tool unless there is evidence in the resume.
- Never upgrade seniority or scope beyond the source material.
- Never hide major experience just to make the profile look cleaner.
- Never use placeholders like [X], TBD, lorem ipsum, or bracketed filler.

CV QUALITY STANDARD:
- Rewrite the positioning so it feels tailored to this role, not generic.
- Summary must be concise, sharp, and role-aligned.
- Headline must position the candidate for the target role without overstating experience.
- Reorder and rewrite bullets so the strongest role-relevant evidence appears first.
- Bullets should highlight ownership, execution, collaboration, scale, and outcome whenever the source supports it.
- Skills should be front-loaded by relevance, but only with truthful additions genuinely implied by the resume.
- Keep language clean, persuasive, professional, and readable by humans.

STRETCH ROLE BEHAVIOR:
- If the role is a stretch, still optimize the CV around transferable strengths.
- Be honest in the assessment and probability fields.
- Do not pretend the candidate is a perfect fit.

OUTPUT CONTRACT:
- Return ONLY valid JSON.
- Use exact original bullet text in bulletRewrites.original so it can be matched back safely.
- sectionId must be one of: summary, skills, experience, projects, education, volunteer.
- bulletRewrites.sectionId must be one of: experience, volunteer, projects.
- bulletOrderPlans.sectionId must be one of: experience, volunteer.
- If a section does not need changes, omit it from sectionFocus or keep arrays empty.
- Prefer a smaller number of very strong rewrites over a large number of weak edits.

Return JSON matching exactly this shape:
{
  "intensity": "conservative | balanced | aggressive | overboard",
  "matchScore": 0,
  "matchTier": "STRONG_FIT | MODERATE_FIT | STRETCH | LONG_SHOT",
  "shortlistingProbability": "LOW | MODERATE | HIGH | VERY_HIGH",
  "overallStrategy": "2-4 sentences",
  "honestAssessment": "1-3 sentences",
  "tailoredHeadline": "string",
  "tailoredSummary": "string",
  "matchedKeywords": [
    { "keyword": "string", "evidence": "string" }
  ],
  "missingKeywords": [
    { "keyword": "string", "suggestion": "string" }
  ],
  "skillsPlan": {
    "recommendedOrder": ["string"],
    "add": ["string"],
    "deprioritize": ["string"],
    "rationale": "string"
  },
  "sectionFocus": [
    {
      "sectionId": "summary | skills | experience | projects | education | volunteer",
      "priority": "high | medium | low",
      "title": "string",
      "reason": "string"
    }
  ],
  "bulletRewrites": [
    {
      "sectionId": "experience | volunteer | projects",
      "companyOrProject": "string",
      "original": "string",
      "tailored": "string",
      "keywordsHit": ["string"],
      "rationale": "string",
      "impact": "high | medium | low"
    }
  ],
  "bulletOrderPlans": [
    {
      "sectionId": "experience | volunteer",
      "companyOrProject": "string",
      "orderedOriginalBullets": ["string"],
      "reason": "string"
    }
  ]
}`

async function requestCVAnalysis(prompt: string) {
  const failures: Array<{ model: string; reason: string }> = []

  for (const model of CV_ANALYSIS_MODELS) {
    try {
      return await callClaudeJSONRace<Partial<TailorAnalysis>>({
        model,
        system: CV_GENERATOR_SYSTEM,
        prompt,
        maxTokens: 5000,
        timeoutMs: 180000,
      })
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error)
      failures.push({ model, reason })
      console.error(`CV generation model failed (${model}):`, reason)
    }
  }

  if (
    failures.some(failure =>
      failure.reason.includes('No endpoints available matching your guardrail restrictions and data policy')
    )
  ) {
    throw new Error('OPENROUTER_PRIVACY_POLICY_BLOCK')
  }

  if (failures.every(failure => failure.reason === 'CLAUDE_TIMEOUT')) {
    throw new Error('CLAUDE_TIMEOUT')
  }

  if (failures.some(failure => failure.reason === 'CLAUDE_JSON_PARSE_FAILED')) {
    throw new Error('CLAUDE_JSON_PARSE_FAILED')
  }

  throw new Error(
    `CV_MODEL_CHAIN_FAILED: ${failures.map(failure => `${failure.model}: ${failure.reason}`).join(' | ')}`
  )
}

export async function generateCVFromResumeData({
  resumeData,
  jobDescription,
  intensity = 'aggressive',
}: {
  resumeData: Partial<ResumeData> | null | undefined
  jobDescription: string
  intensity?: TailorIntensity
}) {
  const normalizedResumeData = normalizeResumeData(resumeData)
  const prompt = `TARGET ROLE JOB DESCRIPTION:
---
${jobDescription.trim()}
---

CANDIDATE RESUME DATA:
---
${resumeDataToGeneratorContext(normalizedResumeData)}
---

Generate the strongest truthful CV edits for this role.
Intensity: ${intensity}.`

  const rawAnalysis = await requestCVAnalysis(prompt)

  const analysis = normalizeTailorAnalysis(rawAnalysis, intensity)
  const applied = applyTailorAnalysisToResumeData(normalizedResumeData, analysis)

  return {
    analysis,
    generatedResumeData: applied.data,
    changed: applied.changed,
    scoreDelta: applied.scoreDelta,
    touchedSections: applied.touchedSections,
  }
}

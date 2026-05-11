import { callClaudeJSONRace } from '@/lib/claude'
import {
  coverLetterSenderFromResumeData,
  normalizeCoverLetterDraft,
  normalizeResumeData,
  resumeDataToGeneratorContext,
  type CoverLetterDraft,
} from '@/lib/cv/shared'
import type { ResumeData, TailorIntensity } from '@/types'

const CV_ANALYSIS_CHAIN = [
  {
    model: 'deepseek/deepseek-v4-flash',
    timeoutMs: Number(process.env.CV_PRIMARY_TIMEOUT_MS) || 90000,
  },
  ...(process.env.ANTHROPIC_MODEL_PREMIUM && process.env.ANTHROPIC_MODEL_PREMIUM !== 'deepseek/deepseek-v4-flash'
    ? [{ model: process.env.ANTHROPIC_MODEL_PREMIUM, timeoutMs: Number(process.env.CV_PRIMARY_TIMEOUT_MS) || 90000 }]
    : []),
  {
    model: 'google/gemini-2.5-flash',
    timeoutMs: Number(process.env.CV_FALLBACK_TIMEOUT_MS) || 120000,
  },
].filter((entry, index, array) => array.findIndex(candidate => candidate.model === entry.model) === index)

const COVER_LETTER_SYSTEM = `You are Rezoomed Cover Letter Generator, an elite recruiter, hiring manager, and application strategist.

Your task is to write a strong, truthful, role-specific cover letter based on a candidate's actual resume data and a target job description.

PRIMARY GOAL:
- Produce a cover letter that materially improves the candidate's chance of landing an interview.
- Sound sharp, credible, concise, and human.
- Make the letter feel specific to the role and company without inventing anything.
- Extract the strongest truthful fit narrative from the resume and job description.
- The letter should make a recruiter immediately understand why this candidate is worth interviewing.

NON-NEGOTIABLE HONESTY RULES:
- Never invent employers, titles, dates, tools, responsibilities, certifications, projects, metrics, or outcomes.
- Never exaggerate seniority or claim hands-on experience not supported by the resume.
- Never flatter the company with made-up product knowledge.
- Never use placeholders like [Company], [X], TBD, lorem ipsum, or bracketed filler.
- Never claim passion, admiration, or company/product knowledge unless the job description or resume gives concrete support.

LETTER STANDARD:
- Write in first person.
- Keep it to one page and generally 4-5 paragraphs.
- Avoid bullet points in the final letter body.
- Keep sentences direct and recruiter-readable.
- Use evidence from the resume to explain fit instead of generic enthusiasm.
- If the company name or role title is unclear from the job description, make a best effort. If still unclear, stay generic and professional.
- Open with the candidate's strongest relevant fit signal, not "I am excited to apply" filler.
- Each body paragraph should connect a real resume fact to a real job requirement.
- Prefer concrete examples of scope, tools, customers, domains, or outcomes over adjectives.
- Close confidently without sounding desperate or inflated.

GOOD DIRECTION:
- "In my operations analyst role, I built weekly SQL dashboards for leadership, which maps directly to your need for reporting automation and stakeholder-ready insights."

BAD DIRECTION:
- "I have always admired your innovative company and believe I am the perfect fit." This is generic and unsupported.
- "I led global AI transformation" when the resume only says the candidate created internal reports.

INTENSITY GUIDANCE:
- conservative: polished and formal, with minimal rhetorical flair.
- balanced: clearly tailored, confident, and practical.
- aggressive: stronger positioning and sharper persuasion while still fully truthful.
- overboard: maximum persuasive energy without becoming cheesy, inflated, or dishonest.

RETURN ONLY VALID JSON matching exactly this shape:
{
  "roleTitle": "string",
  "companyName": "string",
  "suggestedSubject": "string",
  "greeting": "string",
  "openingParagraph": "string",
  "bodyParagraphs": ["string"],
  "closingParagraph": "string",
  "signOff": "string",
  "strategySummary": "string",
  "fitHighlights": ["string"]
}

RULES:
- "fitHighlights" must be short phrases, max 5 items.
- "bodyParagraphs" should usually contain 2 or 3 paragraphs.
- The final output must be usable as a real application letter with no editing required.
- Every paragraph must earn its space by making a specific, truthful fit argument.
- Return JSON only. No markdown. No explanation.`

async function requestCoverLetter(prompt: string) {
  const failures: Array<{ model: string; reason: string }> = []

  for (const { model, timeoutMs } of CV_ANALYSIS_CHAIN) {
    try {
      return await callClaudeJSONRace<Partial<CoverLetterDraft>>({
        model,
        system: COVER_LETTER_SYSTEM,
        prompt,
        maxTokens: 3500,
        timeoutMs,
      })
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error)
      failures.push({ model, reason })
      console.warn(`Cover letter model failed (${model}):`, reason)
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
    `COVER_LETTER_MODEL_CHAIN_FAILED: ${failures.map(failure => `${failure.model}: ${failure.reason}`).join(' | ')}`
  )
}

export async function generateCoverLetterFromResumeData({
  resumeData,
  jobDescription,
  intensity = 'aggressive',
}: {
  resumeData: Partial<ResumeData> | null | undefined
  jobDescription: string
  intensity?: TailorIntensity
}) {
  const normalizedResumeData = normalizeResumeData(resumeData)
  const sender = coverLetterSenderFromResumeData(normalizedResumeData)
  const prompt = `TARGET JOB DESCRIPTION:
---
${jobDescription.trim()}
---

CANDIDATE RESUME DATA:
---
${resumeDataToGeneratorContext(normalizedResumeData)}
---

WRITE A COVER LETTER.
Intensity: ${intensity}.
Candidate name: ${sender.name || 'Unknown'}.
Candidate current role: ${sender.currentRole || 'Unknown'}.`

  const rawDraft = await requestCoverLetter(prompt)
  const coverLetter = normalizeCoverLetterDraft(rawDraft, sender, intensity)

  return {
    coverLetter,
    sender,
  }
}

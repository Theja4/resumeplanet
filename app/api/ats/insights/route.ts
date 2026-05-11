import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { consumeRateLimit, createRateLimitResponse } from '@/lib/rateLimit'
import { createClient } from '@/lib/supabase/server'
import { callClaudeJSON } from '@/lib/claude'
import { isPro } from '@/lib/planUtils'
import {
  applyInsightSuggestionToResumeData,
  hasBreakdownRegression,
  hasUnresolvedPlaceholderText,
  startsWithWeakResumePhrase,
} from '@/lib/ai-insights'
import { getEducationDateLabel, getResumeSkills, normalizeSkillSections, resumeDataToPlainText, syncResumeData } from '@/lib/resume-data'
import { buildATSRoadmap, scoreResume, type ScorerResult, type WeakArea } from '@/lib/ats-scorer'
import type { Profile, APIResponse, ATSScoreRoadmap, ResumeData } from '@/types'

const INSIGHTS_CACHE_VERSION = 7
const SUGGESTION_MODELS = [
  'deepseek/deepseek-v4-flash',
  'google/gemini-2.5-flash',
]

const ATS_SCORER_RUBRIC_GUIDE = `DETERMINISTIC SCORER TARGETS:
- summary: full credit needs 15-100 words, no more than 4 sentences, and 2+ role/skill terms already present in the resume.
- exp_verbs: score jumps at 40%, 60%, and 80% of bullets starting with recognized action verbs. Rewrite enough weak openings to cross the next threshold, not just one.
- exp_metrics: score jumps at 1, 3, 5, and 8 bullets with concrete impact. At least one real numeric metric is needed to exceed the no-metric cap. Never invent numbers; use existing numbers or concrete non-numeric outcomes.
- skills: full credit needs 8+ real skills and clean grouping when possible. Only add skills already evidenced in the resume context.
- keywords: score jumps at 20%, 40%, and 60% of listed skills appearing in experience bullets. Weave supported skills into real work evidence; do not keyword-stuff.
- education/contact gaps require user-provided facts. Do not guess missing fields.`

// ── LLM System Prompt — suggestions only, no scoring ──────────────────────

const SUGGESTION_SYSTEM = `You are a senior resume strategist optimizing for real shortlist odds, not cosmetic score inflation.

Your task is to rewrite specific resume text so it is more likely to clear ATS screening and hold up under a recruiter's first skim. You will receive weak areas from a deterministic rubric, the exact text that is underperforming, and only the source resume context needed to improve it.

OPERATING STANDARD:
- Every rewrite must be paste-ready for a real resume
- Better means more specific, more credible, easier to skim, and more keyword-aligned without sounding stuffed
- If the source context does not support a materially stronger rewrite, OMIT that suggestion instead of padding or guessing
- Extract the maximum truthful improvement available from the weak areas, not just the first easy fix
- Prefer several small, exact, high-confidence patches over one broad rewrite

WHAT STRONG REWRITES LOOK LIKE:
1. EXPERIENCE BULLETS
   - Start with a strong action verb
   - Make scope, ownership, tools, or business context clearer when supported by the source
   - Prefer quantified outcomes when the source supports them
   - If exact numbers are not supported, improve specificity with truthful non-numeric impact language
   - Good direction: "Improved onboarding workflow" -> "Streamlined enterprise customer onboarding workflow by standardizing handoffs across support and implementation teams"

2. SUMMARY
   - 2-3 sentences maximum
   - Must reflect the candidate's real role direction, domain, and differentiators already present in the resume
   - Should naturally reinforce relevant skills/keywords already evidenced elsewhere in the resume
   - Avoid generic claims like "results-driven professional" unless the sentence immediately proves that claim

3. SKILLS / KEYWORD INTEGRATION
   - Keep only real skills already supported by the resume context
   - Prefer weaving verified tools/technologies into achievement bullets rather than dumping keywords into a list
   - Use exact industry terms when the resume already supports them

NON-NEGOTIABLE HONESTY RULES:
- NEVER invent employers, titles, dates, skills, certifications, projects, metrics, team sizes, budgets, or outcomes
- NEVER upgrade seniority or rewrite the candidate into a different role
- NEVER use placeholders, brackets, TBD, dummy numbers, or fill-in-the-blank language
- NEVER use inferred, implied, likely, or assumed facts. If the source does not explicitly say it, omit it.
- NEVER output generic filler such as "responsible for", "worked on", "helped with", "various", "multiple", or "etc."
- NEVER restate a duty with slightly different wording if it is not materially stronger

QUALITY BAR:
- Each afterText must be more specific and more recruiter-useful than beforeText
- Each reasoning field must explain the concrete upgrade, not just say "improved ATS"
- beforeText must be an exact substring from the provided resume context
- Return fewer suggestions when needed; quality matters more than count

${ATS_SCORER_RUBRIC_GUIDE}

PATCH EXAMPLES:
Accepted:
{
  "criterionId": "exp_verbs",
  "type": "action-verb",
  "title": "Replace passive ownership wording",
  "beforeText": "Worked on customer onboarding process across support and implementation teams.",
  "afterText": "Streamlined customer onboarding workflow by standardizing handoffs across support and implementation teams.",
  "sectionHint": "experience",
  "estimatedPoints": 2,
  "reasoning": "Starts with a recognized action verb and makes the supported workflow ownership clearer without adding unsupported metrics."
}

Rejected:
- beforeText that is not copied exactly from the resume.
- afterText that adds unsupported metrics, e.g. "reduced onboarding time by 35%" when no 35% result exists.
- afterText or reasoning that says a fact was inferred, implied, likely, or assumed.
- keyword stuffing, e.g. appending unrelated tools to a bullet just because they are in the skills list.
- cosmetic synonym swaps that do not make the line more specific, more credible, or more likely to score higher.

OUTPUT FORMAT:
Return ONLY valid JSON matching this schema. No markdown fences. No explanation.

{
  "suggestions": [
    {
      "criterionId": "string (which scoring criterion this fixes)",
      "type": "action-verb" | "metric" | "keyword" | "format" | "section",
      "title": "string (short, specific title)",
      "beforeText": "string (EXACT text from the resume, copy-paste precision)",
      "afterText": "string (the complete replacement text, ready to apply)",
      "sectionHint": "experience" | "summary" | "skills" | "education" | "projects",
      "estimatedPoints": number (rough impact estimate based on the rubric gap)",
      "reasoning": "string (one sentence: the specific improvement and why it is stronger)"
    }
  ]
}

RULES:
- Return multiple suggestions for the same weak area when the rubric needs several changes to cross a threshold
- For exp_verbs, rewrite every weak bullet opening that can be improved truthfully
- For keywords, create several experience-bullet rewrites that weave real listed skills into work context where the bullet already supports them
- Omit education/contact fixes when the missing fact is not explicitly present in the resume context
- You may return fewer suggestions than weak areas if some cannot be improved truthfully
- Order suggestions in the sequence they should be applied
- If exp_metrics is weak and no numbers are supported, improve concrete scope, audience, tool usage, or business outcome without inventing a metric
- A good response should usually include 4-12 suggestions when there are enough truthful source facts
- Maximum 12 suggestions per scan`

// ── Types ─────────────────────────────────────────────────────────────────

type Suggestion = {
  criterionId: string
  type: string
  title: string
  beforeText: string
  afterText: string
  sectionHint: 'experience' | 'summary' | 'skills' | 'education' | 'projects'
  estimatedPoints: number
  reasoning: string
}

type LLMSuggestionsResponse = {
  suggestions: Suggestion[]
}

type InsightsResponse = {
  score: number
  scoreLabel: string
  summary: string
  breakdown: ScorerResult['breakdown']
  roadmap: ATSScoreRoadmap
  suggestions: Array<Suggestion & { id: string }>
}

type StoredInsightsCache = {
  version: number
  data: InsightsResponse
}

// ── Helpers ───────────────────────────────────────────────────────────────

function normalizeResumeText(text: string) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function getResumeSignature(text: string) {
  return createHash('sha256').update(normalizeResumeText(text)).digest('hex')
}

function buildSuggestionPrompt(
  weakAreas: WeakArea[],
  data: ResumeData,
  scorerResult: ScorerResult
): string {
  const parts: string[] = [
    `CURRENT SCORE: ${scorerResult.score}/100 (${scorerResult.scoreLabel})`,
    'OBJECTIVE: Generate truthful, paste-ready rewrites that improve real screening quality and usually move the resume toward an 85+ quality bar.',
    'SOURCE OF TRUTH: Use only facts, tools, titles, keywords, and scope explicitly present in this prompt.',
    '',
    'WEAK AREAS TO FIX:',
    '',
  ]

  for (const area of weakAreas.slice(0, 8)) {
    parts.push(`--- ${area.criterionId} (${area.currentScore}/${area.maxScore}, gap: ${area.gap} pts) ---`)
    parts.push(`Issue: ${area.description}`)
    const rubricDetail = scorerResult.breakdown[area.criterionId]?.details
    if (rubricDetail) {
      parts.push(`Rubric detail: ${rubricDetail}`)
    }
    if (area.relevantText.length > 0) {
      parts.push(`Text to improve:`)
      for (const text of area.relevantText.slice(0, 10)) {
        parts.push(`  "${text}"`)
      }
    }
    parts.push('')
  }

  // Include relevant resume context (only sections with weak areas)
  const criterionIds = new Set(weakAreas.map(w => w.criterionId))

  parts.push('\nRESUME CONTEXT (relevant sections):\n')

  if (criterionIds.has('summary') || criterionIds.has('contact')) {
    parts.push(`Name: ${data.name || '(missing)'}`)
    parts.push(`Role: ${data.currentRole || '(missing)'}`)
    parts.push(`Summary: ${data.summary || '(missing)'}`)
    parts.push('')
  }

  if (criterionIds.has('exp_verbs') || criterionIds.has('exp_metrics') || criterionIds.has('exp_depth') || criterionIds.has('keywords')) {
    parts.push('Work Experience:')
    for (const exp of data.experience) {
      parts.push(`  ${exp.title} at ${exp.company} (${exp.startDate} - ${exp.endDate})`)
      for (const bullet of exp.bullets) {
        parts.push(`    - ${bullet}`)
      }
    }
    parts.push('')
  }

  if (criterionIds.has('skills') || criterionIds.has('keywords')) {
    parts.push(`Skills: ${getResumeSkills(data).join(', ') || '(none)'}`)
    for (const section of normalizeSkillSections(data.skillSections, getResumeSkills(data))) {
      parts.push(`Skill section - ${section.title}: ${section.skills.join(', ')}`)
    }
    parts.push('')
  }

  if (data.experience.length > 0) {
    parts.push(`Role titles on resume: ${data.experience.map(exp => exp.title).filter(Boolean).join(', ') || '(none)'}`)
    parts.push('')
  }

  if (criterionIds.has('education')) {
    parts.push('Education:')
    for (const edu of data.education) {
      parts.push(`  ${edu.degree} in ${edu.field} at ${edu.institution} (${getEducationDateLabel(edu)})`)
    }
    parts.push('')
  }

  return parts.join('\n')
}

function getActionableWeakAreas(weakAreas: WeakArea[], data: ResumeData) {
  return weakAreas.filter(area => {
    switch (area.criterionId) {
      case 'summary':
        return true
      case 'exp_verbs':
      case 'exp_metrics':
        return area.relevantText.some(text =>
          data.experience.some(exp => exp.bullets.some(bullet => bullet.includes(text)))
        )
      case 'skills':
        return getResumeSkills(data).length > 0
      case 'keywords':
        return getResumeSkills(data).length > 0 && data.experience.some(exp => exp.bullets.length > 0)
      default:
        return false
    }
  })
}

function extractNumericTokens(text: string) {
  return new Set((text.match(/\b\d+(?:[.,]\d+)?%?\b/g) ?? []).map(token => token.toLowerCase()))
}

function hasUnsupportedNumericClaim(beforeText: string, afterText: string, sourceText: string) {
  const beforeNumbers = extractNumericTokens(beforeText)
  const sourceNumbers = extractNumericTokens(sourceText)
  const afterNumbers = extractNumericTokens(afterText)

  for (const token of afterNumbers) {
    if (!beforeNumbers.has(token) && !sourceNumbers.has(token)) return true
  }

  return false
}

function containsInferenceLanguage(text: string) {
  return /\b(inferred|implied|assumed|likely|apparently|presumably)\b/i.test(text)
}

function validateSuggestionsCumulatively(
  rawSuggestions: Suggestion[],
  resumeData: ResumeData,
  scorerResult: ScorerResult
) {
  let workingData = resumeData
  let workingScorer = scorerResult
  const sourceText = resumeDataToPlainText(resumeData)
  const accepted: Array<Suggestion & { id: string }> = []
  const remainingGapByCriterion = new Map(
    scorerResult.weakAreas.map(area => [area.criterionId, area.gap])
  )

  rawSuggestions.forEach((suggestion, index) => {
    if (hasUnresolvedPlaceholderText(suggestion.afterText)) return
    if (startsWithWeakResumePhrase(suggestion.afterText)) return
    if (containsInferenceLanguage(`${suggestion.afterText} ${suggestion.reasoning}`)) return
    if (hasUnsupportedNumericClaim(suggestion.beforeText, suggestion.afterText, sourceText)) return

    const updatedData = applyInsightSuggestionToResumeData(workingData, suggestion)
    if (updatedData === workingData) return

    const rescored = scoreResume(updatedData)
    if (rescored.score < workingScorer.score) return
    if (hasBreakdownRegression(workingScorer, rescored)) return

    const scoreDelta = rescored.score - workingScorer.score
    const intendedGap = remainingGapByCriterion.get(suggestion.criterionId) ?? 1
    const modelEstimate = Number.isFinite(suggestion.estimatedPoints)
      ? Math.max(0, Math.round(suggestion.estimatedPoints))
      : 0
    const estimatedPoints = Math.max(
      scoreDelta,
      Math.min(Math.max(modelEstimate, 1), Math.max(intendedGap, 1))
    )

    accepted.push({
      ...suggestion,
      estimatedPoints,
      id: `${suggestion.criterionId}-${suggestion.type}-${index}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, ''),
    })

    workingData = updatedData
    workingScorer = rescored
  })

  return accepted
}

function generateSummaryFromScorer(result: ScorerResult): string {
  const { score } = result
  const weakNames = result.weakAreas.slice(0, 3).map(w => w.description.split('.')[0]).join('; ')

  if (score >= 85) return `Strong resume with solid structure and content. Minor improvements possible in: ${weakNames || 'polish and refinement'}.`
  if (score >= 65) return `Good foundation with room to improve. Focus on: ${weakNames}.`
  if (score >= 45) return `Decent structure but key areas need work: ${weakNames}.`
  return `Resume needs significant improvement. Priority areas: ${weakNames}.`
}

async function callSuggestionsWithFallback(
  models: string[],
  system: string,
  prompt: string,
  maxTokens: number
): Promise<LLMSuggestionsResponse> {
  const failures: Array<{ model: string; reason: string }> = []

  for (const model of models) {
    try {
      return await callClaudeJSON<LLMSuggestionsResponse>({
        model,
        system,
        prompt,
        maxTokens,
        timeoutMs: 180000,
      })
    } catch (error) {
      failures.push({
        model,
        reason: error instanceof Error ? error.message : String(error),
      })
    }
  }

  throw new Error(`All suggestion models failed: ${JSON.stringify(failures)}`)
}

// ── Route Handler ─────────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json<APIResponse<never>>(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const insightsRateLimit = await consumeRateLimit({
    request,
    userId: user.id,
    scope: 'ats_insights_authenticated',
    limit: 30,
    windowSeconds: 60 * 60,
  })
  if (!insightsRateLimit.allowed) {
    return createRateLimitResponse(insightsRateLimit, 'TOO_MANY_INSIGHT_REQUESTS')
  }

  let body: { resumeText?: string; resumeId?: string; resumeData?: ResumeData }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json<APIResponse<never>>(
      { success: false, error: 'Invalid JSON' },
      { status: 400 }
    )
  }

  const { resumeId } = body
  let resumeData = body.resumeData ?? null

  // If no resumeData provided, try to load from DB
  if (!resumeData && resumeId) {
    const { data: resume } = await supabase
      .from('resumes')
      .select('parsed_data')
      .eq('id', resumeId)
      .eq('user_id', user.id)
      .maybeSingle()

    resumeData = (resume?.parsed_data as ResumeData | null) ?? null
  }

  // Build text for signature/cache key
  let resumeText = body.resumeText ?? ''
  if ((!resumeText || resumeText.trim().length < 50) && resumeData) {
    resumeText = resumeDataToPlainText(resumeData)
  }
  if ((!resumeText || resumeText.trim().length < 50) && resumeId) {
    const { data: resume } = await supabase
      .from('resumes')
      .select('raw_text')
      .eq('id', resumeId)
      .eq('user_id', user.id)
      .maybeSingle()
    resumeText = resume?.raw_text?.trim() ?? ''
  }

  resumeText = normalizeResumeText(resumeText)

  if (!resumeData && resumeText.length < 50) {
    return NextResponse.json<APIResponse<never>>(
      { success: false, error: 'Resume data too short' },
      { status: 400 }
    )
  }

  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const profile = profileData as Profile | null
  const pro = isPro(profile)

  if (!pro) {
    return NextResponse.json<APIResponse<never>>(
      { success: false, error: 'PRO_REQUIRED' },
      { status: 403 }
    )
  }

  const signature = getResumeSignature(resumeText)

  // Check cache
  if (resumeId) {
    const { data: cachedResume } = await supabase
      .from('resumes')
      .select('ai_insights_signature, ai_insights_cache')
      .eq('id', resumeId)
      .eq('user_id', user.id)
      .maybeSingle()

    const cached = cachedResume?.ai_insights_cache as StoredInsightsCache | null
    if (
      cachedResume?.ai_insights_signature === signature &&
      cached?.version === INSIGHTS_CACHE_VERSION &&
      cached.data
    ) {
      return NextResponse.json<APIResponse<InsightsResponse>>(
        { success: true, data: cached.data },
        { status: 200 }
      )
    }
  }

  // ── Step 1: Deterministic scoring (zero LLM tokens) ─────────────────

  // If we have structured data, score it directly. Otherwise build a minimal ResumeData from text.
  if (!resumeData) {
    // Minimal ResumeData from raw text — scorer will score low but won't crash
    resumeData = syncResumeData({
      name: '', currentRole: '', summary: '', email: '', phone: '',
      location: '', linkedin: '', website: '',
      experience: [], education: [], skills: [], projects: [],
      certifications: [], volunteer: [], awards: [], publications: [],
      languages: [], interests: [], references: [],
    })
  }

  const scorerResult = scoreResume(resumeData)

  // ── Step 2: LLM suggestions for weak areas (if any) ─────────────────

  let suggestions: Array<Suggestion & { id: string }> = []

  const actionableWeakAreas = getActionableWeakAreas(scorerResult.weakAreas, resumeData)

  if (actionableWeakAreas.length > 0) {
    const userPrompt = buildSuggestionPrompt(actionableWeakAreas, resumeData, scorerResult)

    try {
      const llmResult = await callSuggestionsWithFallback(
        SUGGESTION_MODELS,
        SUGGESTION_SYSTEM,
        userPrompt,
        4500
      )

      suggestions = validateSuggestionsCumulatively(
        llmResult.suggestions ?? [],
        resumeData,
        scorerResult
      )
    } catch (err) {
      console.warn('LLM suggestions failed, returning score only:', err instanceof Error ? err.message : err)
      // Score still works even if suggestions fail
    }
  }

  const result: InsightsResponse = {
    score: scorerResult.score,
    scoreLabel: scorerResult.scoreLabel,
    summary: generateSummaryFromScorer(scorerResult),
    breakdown: scorerResult.breakdown,
    roadmap: buildATSRoadmap(scorerResult),
    suggestions,
  }

  // ── Step 3: Persist score + cache ───────────────────────────────────

  if (resumeId) {
    await supabase
      .from('resumes')
      .update({
        ats_score: scorerResult.score,
        ai_insights_signature: signature,
        ai_insights_cache: {
          version: INSIGHTS_CACHE_VERSION,
          data: result,
        },
        ai_insights_cached_at: new Date().toISOString(),
      })
      .eq('id', resumeId)
      .eq('user_id', user.id)
  }

  return NextResponse.json<APIResponse<InsightsResponse>>(
    { success: true, data: result },
    { status: 200 }
  )
}

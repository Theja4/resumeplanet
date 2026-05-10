import { NextRequest, NextResponse } from 'next/server'
import { callClaudeJSONFallback, CLAUDE_PREMIUM, CLAUDE_STANDARD } from '@/lib/claude'
import { consumeRateLimit, createRateLimitResponse } from '@/lib/rateLimit'
import { requirePro } from '@/lib/planEnforcement'
import { scoreResume, type ScorerResult, type WeakArea } from '@/lib/ats-scorer'
import { parseResumeText } from '@/lib/resumeParser'
import {
  applyInsightSuggestionToResumeData,
  hasBreakdownRegression,
  hasUnresolvedPlaceholderText,
  improvesIntendedCriterion,
  startsWithWeakResumePhrase,
} from '@/lib/ai-insights'
import { getResumeSkills, normalizeSkillSections, resumeDataToPlainText, syncResumeData } from '@/lib/resume-data'
import type { ATSResult, APIResponse, ResumeData } from '@/types'

const PATCH_SYSTEM = `You are a senior resume strategist generating scorer-targeted resume patches.

You do NOT rewrite the full resume. You return exact before/after patches for structured resume fields.

Rules:
- Return ONLY valid JSON
- beforeText must be an exact string from the provided resume context
- afterText must be a complete replacement for beforeText
- Never invent employers, titles, dates, projects, certifications, metrics, team sizes, budgets, outcomes, or unsupported skills
- Never add placeholders, brackets, TBD, dummy numbers, or fill-in-the-blank language
- Never inflate seniority or rewrite the candidate into another role
- Prefer changes that satisfy the scoring rubric exactly: action verbs, clearer scope, supported outcomes, role-relevant summary, skills in experience context
- You may return multiple patches for the same criterion when several bullets must change to cross a scoring threshold
- Omit weak areas that cannot be truthfully improved from the provided context`

const MATCH_PATCH_SYSTEM = `You are a senior resume strategist generating JD-targeted resume patches to maximize job description match fit.

You do NOT rewrite the full resume. You return exact before/after patches for structured resume fields.

YOUR GOAL: Make the resume read as an honest, natural fit for the specific job description by:
1. Rewriting bullets to emphasize JD-relevant skills, outcomes, and domain language
2. Integrating missing JD keywords ONLY where the resume already demonstrates them through real experience
3. Strengthening the summary to frame the candidate for this specific role
4. Reframing existing accomplishments to highlight JD-relevant aspects
5. Reordering bullet points within each role so the most JD-relevant ones appear first

Rules:
- Return ONLY valid JSON
- beforeText must be an exact string from the provided resume context
- afterText must be a complete replacement for beforeText
- NEVER invent employers, titles, dates, projects, certifications, metrics, team sizes, budgets, outcomes, or unsupported skills
- NEVER add placeholders, brackets, TBD, dummy numbers, or fill-in-the-blank language
- NEVER inflate seniority or rewrite the candidate into another role
- Only integrate JD keywords where the resume already demonstrates them honestly
- Focus on making existing experience map more clearly to JD requirements
- Every patch should target at least one missing JD keyword or strengthen evidence for a requirement gap
- Reframe bullet points to highlight JD-relevant aspects of existing work
- When reordering bullets, emit a patch where beforeText is the full bullet text and afterText is the rewritten version, so it naturally moves up in relevance`

const PATCH_SCHEMA = `{
  "patches": [
    {
      "criterionId": "summary | exp_verbs | exp_metrics | exp_depth | skills | keywords | education | structure | polish",
      "type": "summary" | "experience_bullet" | "skills" | "education" | "project",
      "title": "short user-facing title",
      "beforeText": "exact source text to replace",
      "afterText": "complete replacement text",
      "sectionHint": "experience" | "summary" | "skills" | "education" | "projects",
      "reasoning": "one sentence explaining the concrete improvement"
    }
  ]
}`

interface OptimisePatch {
  criterionId: string
  type: string
  title: string
  beforeText: string
  afterText: string
  sectionHint: 'experience' | 'summary' | 'skills' | 'education' | 'projects'
  reasoning: string
}

interface PatchResponse {
  patches: OptimisePatch[]
}

interface PatchRunResult {
  resumeData: ResumeData
  acceptedPatches: OptimisePatch[]
  rejectedCount: number
  score: number
}

interface OptimiseBody {
  resumeText: string
  jobDescription?: string
  analysisMode?: 'ats' | 'match'
  atsResult: ATSResult
  scoreId?: string
  resumeData?: ResumeData
}

interface OptimiseResult {
  optimisedText: string
  keywordsAdded: string[]
  improvementsCount: number
  changesSummary: string
  optimisedScore: number
  scoreGain: number
  resumeData: ResumeData
}

function normalizeResumeData(data: Partial<ResumeData> | null | undefined): ResumeData {
  return {
    name: data?.name ?? '',
    email: data?.email ?? '',
    phone: data?.phone ?? '',
    location: data?.location ?? '',
    linkedin: data?.linkedin ?? '',
    website: data?.website ?? '',
    summary: data?.summary ?? '',
    currentRole: data?.currentRole ?? data?.experience?.[0]?.title ?? '',
    experience: data?.experience ?? [],
    education: data?.education ?? [],
    skills: data?.skills ?? [],
    certifications: data?.certifications ?? [],
    projects: data?.projects ?? [],
    languages: data?.languages ?? [],
    volunteer: data?.volunteer ?? [],
    interests: data?.interests ?? [],
    awards: data?.awards ?? [],
    publications: data?.publications ?? [],
    references: data?.references ?? [],
    customSections: data?.customSections ?? [],
    skillSections: data?.skillSections ?? [],
  }
}

function hasMeaningfulResumeData(data: ResumeData) {
  return Boolean(
    data.summary.trim() ||
    data.currentRole.trim() ||
    data.experience.length > 0 ||
    getResumeSkills(data).length > 0 ||
    data.education.length > 0 ||
    data.projects.length > 0
  )
}

async function getSourceResumeData(resumeText: string, resumeData: ResumeData | undefined) {
  const provided = normalizeResumeData(resumeData)
  if (hasMeaningfulResumeData(provided)) return provided

  try {
    return normalizeResumeData(await parseResumeText(resumeText))
  } catch (error) {
    console.warn('Failed to parse source resume for AI Insights patches:', error instanceof Error ? error.message : error)
    return provided
  }
}

function formatResumeContext(data: ResumeData) {
  const parts: string[] = []

  parts.push(`Name: ${data.name || '(missing)'}`)
  parts.push(`Current role: ${data.currentRole || '(missing)'}`)
  parts.push(`Summary: ${data.summary || '(missing)'}`)
  parts.push('')

  if (data.experience.length > 0) {
    parts.push('Experience:')
    data.experience.forEach((item, itemIndex) => {
      parts.push(`${itemIndex + 1}. ${item.title || '(missing title)'} at ${item.company || '(missing company)'} (${item.startDate || '?'} - ${item.endDate || '?'})`)
      if (item.summary?.trim()) parts.push(`   Summary: ${item.summary}`)
      item.bullets.forEach((bullet, bulletIndex) => {
        parts.push(`   Bullet ${bulletIndex + 1}: ${bullet}`)
      })
    })
    parts.push('')
  }

  const skills = getResumeSkills(data)
  parts.push(`Skills: ${skills.join(', ') || '(none)'}`)
  for (const section of normalizeSkillSections(data.skillSections, skills)) {
    parts.push(`Skill section - ${section.title || 'Untitled'}: ${section.skills.join(', ')}`)
  }
  parts.push('')

  if (data.projects.length > 0) {
    parts.push('Projects:')
    data.projects.forEach((project, index) => {
      parts.push(`${index + 1}. ${project.name || '(missing project name)'}`)
      if (project.description?.trim()) parts.push(`   Description: ${project.description}`)
      project.bullets?.forEach((bullet, bulletIndex) => {
        parts.push(`   Bullet ${bulletIndex + 1}: ${bullet}`)
      })
      if (project.technologies?.length) parts.push(`   Technologies: ${project.technologies.join(', ')}`)
    })
    parts.push('')
  }

  if (data.education.length > 0) {
    parts.push('Education:')
    data.education.forEach((item, index) => {
      const start = item.startDate || ''
      const end = item.endDate || item.graduationDate || '?'
      const dateRange = start ? `${start} - ${end}` : end
      parts.push(`${index + 1}. ${item.degree || '(missing degree)'} ${item.field ? `in ${item.field}` : ''} at ${item.institution || '(missing institution)'} (${dateRange})`)
    })
  }

  return parts.join('\n')
}

function getActionableWeakAreas(weakAreas: WeakArea[], data: ResumeData) {
  return weakAreas.filter(area => {
    switch (area.criterionId) {
      case 'summary':
      case 'exp_depth':
      case 'polish':
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
      case 'education':
        return data.education.length > 0
      default:
        return false
    }
  })
}

function buildPatchPrompt({
  currentData,
  scorerResult,
  atsResult,
  jobDescription,
  targetScore,
  attempt,
}: {
  currentData: ResumeData
  scorerResult: ScorerResult
  atsResult: ATSResult
  jobDescription?: string
  targetScore: number
  attempt: number
}) {
  const weakAreas = getActionableWeakAreas(scorerResult.weakAreas, currentData).slice(0, 8)
  const roadmapActions = atsResult.roadmap?.fixableNow ?? []
  const parts: string[] = [
    `ATTEMPT: ${attempt}`,
    `CURRENT ATS SCORE: ${scorerResult.score}/100`,
    `TARGET SCORE: ${targetScore}/100`,
    `IMPORTANT: The patches will be accepted only if our deterministic scorer does not regress. Generate concrete fixes that satisfy the rubric, not cosmetic rewrites.`,
    '',
  ]

  if (jobDescription?.trim()) {
    parts.push(`JOB DESCRIPTION CONTEXT:\n${jobDescription.trim()}\n`)
  }

  if (atsResult.missingKeywords?.length) {
    parts.push(`MISSING / WEAK KEYWORDS: ${atsResult.missingKeywords.join(', ')}`)
    parts.push('Only integrate these if the resume context already supports them.')
    parts.push('')
  }

  if (roadmapActions.length > 0) {
    parts.push('ROAD TO 90 FIXES:')
    for (const action of roadmapActions.slice(0, 8)) {
      const evidence = action.evidence.length ? ` Evidence: ${action.evidence.join('; ')}` : ''
      parts.push(`- ${action.criterionId}: ${action.title} (${action.section}, +${action.estimatedGainMin}-${action.estimatedGainMax}) - ${action.reason}${evidence}`)
    }
    parts.push('')
  }

  parts.push('SCORER WEAK AREAS:')
  for (const area of weakAreas) {
    parts.push(`--- ${area.criterionId} (${area.currentScore}/${area.maxScore}, gap ${area.gap}) ---`)
    parts.push(`Issue: ${area.description}`)
    const detail = scorerResult.breakdown[area.criterionId]?.details
    if (detail) parts.push(`Rubric detail: ${detail}`)
    if (area.relevantText.length > 0) {
      parts.push('Exact candidate text:')
      area.relevantText.slice(0, 8).forEach(text => {
        parts.push(`"${text}"`)
      })
    }
    parts.push('')
  }

  parts.push('RESUME CONTEXT:')
  parts.push(formatResumeContext(currentData))
  parts.push('')
  parts.push('Return JSON matching this schema:')
  parts.push(PATCH_SCHEMA)

  return parts.join('\n')
}

function buildMatchPatchPrompt({
  currentData,
  scorerResult,
  atsResult,
  jobDescription,
  attempt,
}: {
  currentData: ResumeData
  scorerResult: ScorerResult
  atsResult: ATSResult
  jobDescription: string
  attempt: number
}) {
  const parts: string[] = [
    `ATTEMPT: ${attempt}`,
    `CURRENT ATS SCORE: ${scorerResult.score}/100 — patches must NOT regress this score.`,
    `CURRENT MATCH SCORE: ${atsResult.score}/100 — your goal is to IMPROVE job description alignment.`,
    '',
    `IMPORTANT: Generate patches that make the resume align better with the job description. Every patch should target JD keywords or requirements. The deterministic ATS scorer must not regress.`,
    '',
  ]

  parts.push(`JOB DESCRIPTION:\n${jobDescription.trim()}\n`)

  if (atsResult.missingKeywords?.length) {
    parts.push(`MISSING JD KEYWORDS (integrate where honestly supported):`)
    parts.push(atsResult.missingKeywords.join(', '))
    parts.push('')
  }

  if (atsResult.presentKeywords?.length) {
    parts.push(`ALREADY MATCHED KEYWORDS: ${atsResult.presentKeywords.join(', ')}`)
    parts.push('Strengthen evidence for these where possible.')
    parts.push('')
  }

  if (atsResult.suggestions?.length) {
    parts.push('MATCH IMPROVEMENT SUGGESTIONS:')
    for (const suggestion of atsResult.suggestions.slice(0, 6)) {
      parts.push(`- [${suggestion.severity}] ${suggestion.issue}`)
      parts.push(`  Fix: ${suggestion.fix}`)
    }
    parts.push('')
  }

  if (atsResult.formattingIssues?.length) {
    parts.push('KEY GAPS:')
    for (const note of atsResult.formattingIssues.slice(0, 4)) {
      parts.push(`- ${note}`)
    }
    parts.push('')
  }

  parts.push('RESUME CONTEXT:')
  parts.push(formatResumeContext(currentData))
  parts.push('')
  parts.push('Generate patches that target JD alignment. Each patch should hit at least one missing JD keyword or strengthen evidence for a requirement gap.')
  parts.push('PRIORITY ORDER: 1) Rewrite summary for this role. 2) Rewrite weakest bullets to hit JD keywords. 3) Strengthen existing JD-relevant bullets. 4) Add missing keywords to skills where honestly supported.')
  parts.push('')
  parts.push('Return JSON matching this schema:')
  parts.push(PATCH_SCHEMA)

  return parts.join('\n')
}

function isUsefulPatch(patch: OptimisePatch) {
  const before = patch.beforeText?.trim()
  const after = patch.afterText?.trim()
  if (!before || !after || before === after) return false
  if (hasUnresolvedPlaceholderText(after)) return false
  if (startsWithWeakResumePhrase(after)) return false
  if (after.length < Math.min(24, before.length)) return false
  return true
}

async function generatePatches(prompt: string, systemPrompt: string = PATCH_SYSTEM) {
  const result = await callClaudeJSONFallback<PatchResponse>({
    model: CLAUDE_PREMIUM,
    fallbackModels: [CLAUDE_STANDARD],
    system: systemPrompt,
    prompt,
    maxTokens: 4000,
    timeoutMs: 180000,
    perModelTimeoutMs: 80000,
    jsonRetryTimeoutMs: 30000,
  })

  return Array.isArray(result.patches) ? result.patches : []
}

async function runScoreGatedPatchLoop({
  sourceData,
  atsResult,
  jobDescription,
  analysisMode,
}: {
  sourceData: ResumeData
  atsResult: ATSResult
  jobDescription?: string
  analysisMode?: 'ats' | 'match'
}): Promise<PatchRunResult> {
  const isMatchMode = analysisMode === 'match'
  let currentData = syncResumeData(sourceData)
  let currentScorer = scoreResume(currentData)
  const originalScore = currentScorer.score
  const targetScore = Math.max(
    originalScore,
    Math.min(100, atsResult.roadmap?.truthfulCeiling ?? atsResult.roadmap?.targetScore ?? 90)
  )
  const acceptedPatches: OptimisePatch[] = []
  let rejectedCount = 0

  console.log(`[Optimise] mode=${analysisMode ?? 'ats'} | originalATS=${originalScore} | targetATS=${targetScore}`)

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    // In ATS mode, stop when target reached. In match mode, always run both attempts.
    if (!isMatchMode && (currentScorer.score >= targetScore || currentScorer.score >= Math.max(originalScore + 1, targetScore - 3))) break

    const prompt = isMatchMode
      ? buildMatchPatchPrompt({
          currentData,
          scorerResult: currentScorer,
          atsResult,
          jobDescription: jobDescription!,
          attempt,
        })
      : buildPatchPrompt({
          currentData,
          scorerResult: currentScorer,
          atsResult,
          jobDescription,
          targetScore,
          attempt,
        })

    const systemPrompt = isMatchMode ? MATCH_PATCH_SYSTEM : PATCH_SYSTEM
    const patches = await generatePatches(prompt, systemPrompt)
    if (patches.length === 0) break

    let acceptedThisPass = 0

    for (const patch of patches.slice(0, 14)) {
      if (!isUsefulPatch(patch)) {
        rejectedCount += 1
        continue
      }

      const beforeScorer = currentScorer
      const nextData = applyInsightSuggestionToResumeData(currentData, patch)
      if (nextData === currentData) {
        rejectedCount += 1
        continue
      }

      const nextScorer = scoreResume(nextData)
      const hasRegression = hasBreakdownRegression(beforeScorer, nextScorer)
      const hasTotalRegression = nextScorer.score < beforeScorer.score
      const improvesTarget = improvesIntendedCriterion(beforeScorer, nextScorer, patch.criterionId)
      const improvesTotal = nextScorer.score > beforeScorer.score

      if (hasTotalRegression || hasRegression) {
        rejectedCount += 1
        continue
      }

      currentData = syncResumeData(nextData)
      currentScorer = nextScorer
      acceptedPatches.push({
        ...patch,
        reasoning: improvesTotal || improvesTarget
          ? patch.reasoning
          : `${patch.reasoning} Accepted as a non-regressing improvement; additional patches may be needed to cross the scorer threshold.`,
      })
      acceptedThisPass += 1
    }

    if (acceptedThisPass === 0) break
  }

  if (currentScorer.score < originalScore) {
    return {
      resumeData: sourceData,
      acceptedPatches: [],
      rejectedCount,
      score: originalScore,
    }
  }

  return {
    resumeData: currentData,
    acceptedPatches,
    rejectedCount,
    score: currentScorer.score,
  }
}

function getKeywordsAdded(sourceText: string, optimisedText: string, atsResult: ATSResult) {
  const sourceLower = sourceText.toLowerCase()
  const optimisedLower = optimisedText.toLowerCase()
  const keywords = new Set<string>()

  for (const keyword of atsResult.missingKeywords ?? []) {
    const normalized = keyword.trim()
    if (!normalized) continue
    const lower = normalized.toLowerCase()
    if (!sourceLower.includes(lower) && optimisedLower.includes(lower)) {
      keywords.add(normalized)
    }
  }

  return [...keywords]
}

function buildChangesSummary(run: PatchRunResult, originalScore: number) {
  if (run.acceptedPatches.length === 0) {
    return 'No scorer-safe AI patches were applied because the proposed changes did not improve the ATS rubric without risking factual accuracy.'
  }

  const criteria = [...new Set(run.acceptedPatches.map(patch => patch.criterionId))]
    .slice(0, 4)
    .join(', ')
  const scoreDelta = run.score - originalScore

  return `Applied ${run.acceptedPatches.length} scorer-validated change${run.acceptedPatches.length === 1 ? '' : 's'} targeting ${criteria}. The deterministic ATS score ${scoreDelta > 0 ? `increased by ${scoreDelta} point${scoreDelta === 1 ? '' : 's'}` : 'did not regress'} after validation.`
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // ── Auth + Pro gate ────────────────────────────────────────────────────────
  const authResult = await requirePro()
  if (authResult instanceof NextResponse) return authResult
  const { userId, supabase } = authResult

  const optimiseRateLimit = await consumeRateLimit({
    request,
    userId,
    scope: 'ats_optimise_authenticated',
    limit: 20,
    windowSeconds: 60 * 60,
  })
  if (!optimiseRateLimit.allowed) {
    return createRateLimitResponse(optimiseRateLimit, 'TOO_MANY_OPTIMISE_REQUESTS')
  }

  // ── Parse body ─────────────────────────────────────────────────────────────
  let body: OptimiseBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json<APIResponse<never>>(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  const { resumeText, jobDescription, analysisMode, atsResult, scoreId, resumeData } = body

  // ── Input validation ───────────────────────────────────────────────────────
  if (!resumeText || resumeText.trim().length < 100) {
    return NextResponse.json<APIResponse<never>>(
      { success: false, error: 'RESUME_TOO_SHORT' },
      { status: 400 }
    )
  }

  if (!atsResult || typeof atsResult.score !== 'number') {
    return NextResponse.json<APIResponse<never>>(
      { success: false, error: 'ATS_RESULT_REQUIRED' },
      { status: 400 }
    )
  }

  const sourceData = await getSourceResumeData(resumeText, resumeData)
  const originalScore = scoreResume(sourceData).score

  let patchRun: PatchRunResult
  try {
    patchRun = await runScoreGatedPatchLoop({
      sourceData,
      atsResult,
      jobDescription,
      analysisMode,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg === 'CLAUDE_TIMEOUT') {
      return NextResponse.json<APIResponse<never>>(
        { success: false, error: 'CLAUDE_TIMEOUT' },
        { status: 408 }
      )
    }
    if (msg === 'CLAUDE_JSON_PARSE_FAILED') {
      return NextResponse.json<APIResponse<never>>(
        { success: false, error: 'PARSE_FAILED' },
        { status: 422 }
      )
    }
    console.error('ATS optimise error:', msg)
    return NextResponse.json<APIResponse<never>>(
      { success: false, error: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }

  const optimisedText = resumeDataToPlainText(patchRun.resumeData)
  const optimisedScore = patchRun.score
  const scoreGain = body.analysisMode === 'match' ? 0 : Math.max(0, optimisedScore - atsResult.score)
  const keywordsAdded = getKeywordsAdded(resumeDataToPlainText(sourceData), optimisedText, atsResult)
  const result: OptimiseResult = {
    optimisedText,
    keywordsAdded,
    improvementsCount: patchRun.acceptedPatches.length,
    changesSummary: buildChangesSummary(patchRun, originalScore),
    optimisedScore,
    scoreGain,
    resumeData: patchRun.resumeData,
  }

  // ── Update ats_scores row with optimised text ──────────────────────────────
  if (scoreId) {
    await supabase
      .from('ats_scores')
      .update({ optimised_resume_text: optimisedText })
      .eq('id', scoreId)
      .eq('user_id', userId)
  }

  return NextResponse.json<APIResponse<OptimiseResult>>(
    {
      success: true,
      data: {
        ...result,
      },
    },
    { status: 200 }
  )
}

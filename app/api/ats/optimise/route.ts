import { NextRequest, NextResponse } from 'next/server'
import { callClaudeJSON, CLAUDE_PREMIUM } from '@/lib/claude'
import { requirePro } from '@/lib/planEnforcement'
import { parseResumeText } from '@/lib/resumeParser'
import type { ATSResult, APIResponse, ResumeData } from '@/types'

const OPTIMISE_SYSTEM = `You are a senior resume strategist optimizing for real shortlist odds, not cosmetic keyword stuffing.

Rewrite the full resume into plain text that is stronger for both ATS parsing and recruiter skim-reading while remaining fully truthful.

NON-NEGOTIABLE RULES:
- Never invent employers, titles, dates, projects, certifications, metrics, team sizes, budgets, or outcomes
- Never add a job-description keyword unless the source resume already supports it
- Never use placeholders, brackets, dummy numbers, TBD, or fill-in-the-blank language
- Never inflate seniority or rewrite the candidate into a different role
- Remove weak filler such as "responsible for", "worked on", "helped with", "various", "multiple", and "etc."
- Keep every real role, employer, education entry, project, certification, and other substantive section from the source resume
- Do not collapse multiple roles into one
- Do not shorten the resume by dropping meaningful bullets, context, or supported skills

REWRITE GOALS:
- Keep the resume conventional and easy for ATS systems to parse
- Make bullets stronger with clearer action, scope, tools, ownership, and outcomes where supported
- Improve summary clarity and relevance without sounding generic
- Weave supported keywords into experience context naturally
- Prefer concrete non-numeric specificity over vague claims when exact metrics are unavailable

OUTPUT RULES:
- Return ONLY valid JSON
- optimisedText must be complete, paste-ready plain text
- keywordsAdded must list only keywords that truly appear in optimisedText
- changesSummary must briefly describe the real improvements made, and may mention important keywords intentionally omitted because they were not supported by the source
- Use explicit section headings like SUMMARY, SKILLS, EXPERIENCE, EDUCATION, PROJECTS, CERTIFICATIONS, LANGUAGES, VOLUNTEER, AWARDS, PUBLICATIONS, and REFERENCES whenever those sections exist`

const OPTIMISE_SCHEMA = `{
  "optimisedText": "string (the full rewritten resume text, plain text format)",
  "keywordsAdded": ["string (keywords that were added or emphasised)"],
  "improvementsCount": number,
  "changesSummary": "string (2-3 sentences summarising what was changed and why)"
}`

interface OptimiseBody {
  resumeText: string
  jobDescription?: string
  atsResult: ATSResult
  scoreId?: string
  resumeData?: ResumeData
}

interface OptimiseResult {
  optimisedText: string
  keywordsAdded: string[]
  improvementsCount: number
  changesSummary: string
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
  }
}

function preferText(nextValue: string | undefined, fallbackValue: string | undefined) {
  return nextValue?.trim() ? nextValue : (fallbackValue ?? '')
}

function mergeStringList(nextValues: string[], fallbackValues: string[]) {
  return nextValues.length > 0 ? nextValues : fallbackValues
}

function shouldKeepOriginalBullets(nextBullets: string[], fallbackBullets: string[]) {
  if (fallbackBullets.length === 0) return false
  if (nextBullets.length === 0) return true
  if (fallbackBullets.length >= 3 && nextBullets.length <= 1) return true

  const nextTextLength = nextBullets.join(' ').trim().length
  const fallbackTextLength = fallbackBullets.join(' ').trim().length
  return fallbackTextLength > 220 && nextTextLength < fallbackTextLength * 0.45
}

function mergeExperienceLikeItems(
  nextItems: ResumeData['experience'],
  fallbackItems: ResumeData['experience']
): ResumeData['experience'] {
  const itemCount = Math.max(nextItems.length, fallbackItems.length)

  return Array.from({ length: itemCount }, (_, index) => {
    const nextItem = nextItems[index]
    const fallbackItem = fallbackItems[index]

    if (!nextItem) return fallbackItem
    if (!fallbackItem) return nextItem

    const nextBullets = nextItem.bullets?.filter(Boolean) ?? []
    const fallbackBullets = fallbackItem.bullets?.filter(Boolean) ?? []

    return {
      title: preferText(nextItem.title, fallbackItem.title),
      company: preferText(nextItem.company, fallbackItem.company),
      location: preferText(nextItem.location, fallbackItem.location),
      startDate: preferText(nextItem.startDate, fallbackItem.startDate),
      endDate: preferText(nextItem.endDate, fallbackItem.endDate),
      summary: preferText(nextItem.summary, fallbackItem.summary),
      bullets: shouldKeepOriginalBullets(nextBullets, fallbackBullets) ? fallbackBullets : nextBullets,
    }
  }).filter(Boolean)
}

function mergeOptimisedResumeData(nextData: ResumeData, fallbackData: ResumeData): ResumeData {
  const safeNext = normalizeResumeData(nextData)
  const safeFallback = normalizeResumeData(fallbackData)
  const parsedCurrentRole = safeNext.currentRole.trim()
  const parsedLooksLikeFirstJob = parsedCurrentRole !== '' && parsedCurrentRole === safeNext.experience[0]?.title?.trim()

  return {
    name: preferText(safeNext.name, safeFallback.name),
    email: preferText(safeNext.email, safeFallback.email),
    phone: preferText(safeNext.phone, safeFallback.phone),
    location: preferText(safeNext.location, safeFallback.location),
    linkedin: preferText(safeNext.linkedin, safeFallback.linkedin),
    website: preferText(safeNext.website, safeFallback.website),
    summary: preferText(safeNext.summary, safeFallback.summary),
    currentRole: !parsedLooksLikeFirstJob ? preferText(safeNext.currentRole, safeFallback.currentRole) : safeFallback.currentRole,
    experience: mergeExperienceLikeItems(safeNext.experience, safeFallback.experience),
    education: safeNext.education.length > 0 ? safeNext.education : safeFallback.education,
    skills: mergeStringList(safeNext.skills, safeFallback.skills),
    certifications: safeNext.certifications.length > 0 ? safeNext.certifications : safeFallback.certifications,
    projects: safeNext.projects.length > 0 ? safeNext.projects : safeFallback.projects,
    languages: mergeStringList(safeNext.languages, safeFallback.languages),
    volunteer: mergeExperienceLikeItems(safeNext.volunteer, safeFallback.volunteer),
    interests: mergeStringList(safeNext.interests, safeFallback.interests),
    awards: safeFallback.awards,
    publications: safeFallback.publications,
    references: safeFallback.references,
    customSections: safeFallback.customSections,
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // ── Auth + Pro gate ────────────────────────────────────────────────────────
  const authResult = await requirePro()
  if (authResult instanceof NextResponse) return authResult
  const { userId, supabase } = authResult

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

  const { resumeText, jobDescription, atsResult, scoreId, resumeData } = body

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

  // ── Build prompt ───────────────────────────────────────────────────────────
  const jobContext = jobDescription?.trim()
    ? `Job Description:\n${jobDescription}\n\n`
    : 'No specific job description — optimise for general ATS best practices.\n\n'

  const missingKeywords = atsResult.missingKeywords?.length
    ? `Missing Keywords to Add: ${atsResult.missingKeywords.join(', ')}\n`
    : ''

  const issues = atsResult.suggestions
    ?.filter(s => s.severity === 'high')
    .map(s => `- ${s.issue}: ${s.fix}`)
    .join('\n') ?? ''

  const issueContext = issues ? `\nHigh-Priority Issues to Fix:\n${issues}\n` : ''

  const prompt = `${jobContext}Current ATS Score: ${atsResult.score}/100
Target: produce a cleaner, more credible resume that improves screening quality without inventing anything.
${missingKeywords}${issueContext}
Resume Text:
${resumeText}

Rewrite this resume to:
1. Preserve all facts, chronology, employers, titles, and supported skills
2. Strengthen bullets with better verbs, clearer scope, and clearer outcomes where the source supports them
3. Improve keyword alignment only where the resume already provides evidence
4. Make the summary and section phrasing sharper, more specific, and easier to skim
5. Keep the final result recruiter-ready and ATS-friendly in plain text

If a missing keyword is not supported by the source resume, do not add it.

Return a JSON object matching exactly this schema:
${OPTIMISE_SCHEMA}

Ensure improvementsCount is an integer.`

  // ── Call Claude ────────────────────────────────────────────────────────────
  let result: OptimiseResult

  try {
    result = await callClaudeJSON<OptimiseResult>({
      model: CLAUDE_PREMIUM,
      system: OPTIMISE_SYSTEM,
      prompt,
      maxTokens: 8192,
      timeoutMs: 120000,
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

  // ── Update ats_scores row with optimised text ──────────────────────────────
  if (scoreId) {
    await supabase
      .from('ats_scores')
      .update({ optimised_resume_text: result.optimisedText })
      .eq('id', scoreId)
      .eq('user_id', userId)
  }

  const parsedResumeData = await parseResumeText(result.optimisedText)
  const mergedResumeData = mergeOptimisedResumeData(
    parsedResumeData,
    normalizeResumeData(resumeData)
  )

  return NextResponse.json<APIResponse<OptimiseResult>>(
    {
      success: true,
      data: {
        ...result,
        resumeData: mergedResumeData,
      },
    },
    { status: 200 }
  )
}

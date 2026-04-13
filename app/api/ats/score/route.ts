import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { buildAIRequestSignature, readAIRequestCache, writeAIRequestCache, type AIRequestCacheFeature } from '@/lib/aiRequestCache'
import { getRemainingFreeScans, isPro } from '@/lib/planUtils'
import { FREE_PLAN } from '@/lib/pricing'
import { consumeRateLimit, createRateLimitResponse } from '@/lib/rateLimit'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { buildATSRoadmap, scoreResume, type ScorerResult, type WeakArea } from '@/lib/ats-scorer'
import { buildMatchScoreResult } from '@/lib/match-score'
import { parseResumeText } from '@/lib/resumeParser'
import { getProjectBullets, getResumeSkills, resumeDataToPlainText, syncResumeData } from '@/lib/resume-data'
import { countWords } from '@/lib/text'
import type { APIResponse, ATSResult, ATSSuggestion, ATSScanTier, Profile, ResumeData } from '@/types'

type ATSScoreResponse = ATSResult & {
  pipeline: 'free_ats' | 'pro_ats' | 'free_match' | 'pro_match'
  scansRemaining: number | null
  scoreId: string
  scanTier: ATSScanTier
  resumeData: ResumeData
}

type CachedATSScoreResponse = Omit<ATSScoreResponse, 'scansRemaining'>

interface ConsumedAtsScanState {
  allowed: boolean
  scansUsed: number
  scansRemaining: number
  resetAt: string
}

interface ScoreBody {
  resumeText?: string
  resumeId?: string
  parsedResumeData?: Partial<ResumeData> | null
  jobDescription?: string
  analysisMode?: 'ats' | 'match'
}

const ATS_SCORE_CACHE_VERSION = 1

const KEYWORD_STOPWORDS = new Set([
  'about', 'across', 'after', 'also', 'and', 'any', 'are', 'based', 'been', 'being', 'build',
  'building', 'business', 'candidate', 'candidates', 'clear', 'closely', 'collaborate', 'company',
  'cross', 'deliver', 'demonstrated', 'department', 'develop', 'experience', 'for', 'from', 'have',
  'help', 'ideal', 'including', 'into', 'join', 'knowledge', 'looking', 'manage', 'must', 'need',
  'our', 'plus', 'preferred', 'requirements', 'responsibilities', 'role', 'self', 'skills', 'strong',
  'team', 'teams', 'that', 'the', 'their', 'this', 'through', 'using', 'will', 'with', 'work', 'years',
  'you', 'your',
])

const PHRASE_KEYWORDS = [
  'machine learning',
  'data analysis',
  'data engineering',
  'project management',
  'product management',
  'stakeholder management',
  'customer success',
  'business intelligence',
  'continuous integration',
  'continuous deployment',
  'cross functional',
  'go to market',
  'search engine optimization',
  'account management',
  'user research',
]

async function consumeAuthenticatedFreeAtsScan(userId: string): Promise<ConsumedAtsScanState> {
  const serviceSupabase = createServiceRoleClient()
  const { data, error } = await serviceSupabase.rpc('consume_daily_ats_scan', {
    p_user_id: userId,
    p_limit: FREE_PLAN.limits.atsScansPerDay,
  })

  if (error) {
    throw new Error(`FAILED_TO_CONSUME_ATS_SCAN: ${error.message}`)
  }

  const row = Array.isArray(data) ? data[0] : data

  return {
    allowed: Boolean(row?.allowed),
    scansUsed: Number(row?.scans_used ?? 0),
    scansRemaining: Math.max(0, Number(row?.scans_remaining ?? 0)),
    resetAt:
      typeof row?.reset_at === 'string'
        ? row.reset_at
        : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  }
}

function normalizeResumeData(data: Partial<ResumeData> | null | undefined): ResumeData {
  return syncResumeData({
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
    skillSections: data?.skillSections ?? [],
    certifications: data?.certifications ?? [],
    projects: data?.projects ?? [],
    languages: data?.languages ?? [],
    volunteer: data?.volunteer ?? [],
    interests: data?.interests ?? [],
    awards: data?.awards ?? [],
    publications: data?.publications ?? [],
    references: data?.references ?? [],
    customSections: data?.customSections ?? [],
  })
}

function resumeDataToText(data: ResumeData | null): string {
  return resumeDataToPlainText(data)
}

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function includesKeyword(text: string, keyword: string) {
  if (!keyword.trim()) return false
  const pattern = new RegExp(`\\b${escapeRegex(keyword)}\\b`, 'i')
  return pattern.test(text)
}

function averagePercent(items: Array<{ score: number; max: number }>) {
  if (items.length === 0) return 0
  const total = items.reduce((sum, item) => sum + (item.max ? item.score / item.max : 0), 0)
  return Math.round((total / items.length) * 100)
}

function extractRelevantKeywords(jobDescription: string) {
  const source = jobDescription.trim()
  if (!source) return []

  const lower = source.toLowerCase()
  const phrases = PHRASE_KEYWORDS.filter(phrase => lower.includes(phrase))
  const tokenMatches = source.match(/[A-Za-z][A-Za-z0-9.+#/-]{1,}/g) ?? []
  const frequency = new Map<string, { display: string; count: number; priority: number }>()

  for (const token of tokenMatches) {
    const normalized = token.toLowerCase()
    if (KEYWORD_STOPWORDS.has(normalized)) continue
    if (normalized.length < 3 && !/[+#.]/.test(token)) continue

    const current = frequency.get(normalized)
    const priority =
      /[+#./]/.test(token) || /\d/.test(token) ? 3
        : token === token.toUpperCase() ? 2
        : 1

    frequency.set(normalized, {
      display: current?.display ?? token,
      count: (current?.count ?? 0) + 1,
      priority: Math.max(current?.priority ?? 0, priority),
    })
  }

  const rankedTokens = [...frequency.entries()]
    .sort((a, b) => {
      if (b[1].priority !== a[1].priority) return b[1].priority - a[1].priority
      if (b[1].count !== a[1].count) return b[1].count - a[1].count
      return a[0].localeCompare(b[0])
    })
    .map(([, value]) => value.display)

  const ordered = [...phrases, ...rankedTokens]
  const deduped: string[] = []
  const seen = new Set<string>()
  for (const keyword of ordered) {
    const normalized = keyword.toLowerCase()
    if (seen.has(normalized)) continue
    seen.add(normalized)
    deduped.push(keyword)
  }

  return deduped.slice(0, 15)
}

function getResumeEvidenceText(data: ResumeData) {
  return [
    data.currentRole,
    data.summary,
    ...getResumeSkills(data),
    ...data.experience.flatMap(exp => [exp.title, exp.company, ...exp.bullets]),
    ...data.projects.flatMap(project => [project.name, project.description, ...getProjectBullets(project), ...(project.technologies ?? [])]),
  ].filter(Boolean).join('\n')
}

function getSeverity(gap: number, max: number): ATSSuggestion['severity'] {
  const ratio = max ? gap / max : 0
  if (gap >= 5 || ratio >= 0.6) return 'high'
  if (gap >= 3 || ratio >= 0.35) return 'medium'
  return 'low'
}

function weakAreaToSuggestion(area: WeakArea, breakdown: ScorerResult['breakdown'], pro: boolean): ATSSuggestion | null {
  const detail = breakdown[area.criterionId]?.details ?? area.description
  const severity = getSeverity(area.gap, area.maxScore)

  switch (area.criterionId) {
    case 'contact':
      return {
        category: 'formatting',
        severity,
        issue: 'Your header is missing contact details ATS and recruiters expect immediately.',
        fix: 'Add a professional email, phone number, and either LinkedIn or portfolio URL in the top header.',
        example: pro ? detail : undefined,
      }
    case 'summary':
      return {
        category: 'summary',
        severity,
        issue: 'Your summary is not positioning you quickly enough for a recruiter skim.',
        fix: 'Write a 2-3 sentence summary that matches your target role, core strengths, and strongest outcome.',
        example: pro ? area.relevantText[0] : undefined,
      }
    case 'exp_verbs':
      return {
        category: 'experience',
        severity,
        issue: 'Too many bullets read like responsibilities instead of ownership and action.',
        fix: 'Rewrite weak bullet openings with strong action verbs tied to what you owned and moved forward.',
        example: pro ? area.relevantText[0] : undefined,
      }
    case 'exp_metrics':
      return {
        category: 'experience',
        severity,
        issue: 'Your experience bullets are not proving impact clearly enough.',
        fix: 'Add concrete outcomes, scope, or measurable results so each bullet shows why the work mattered.',
        example: pro ? area.relevantText[0] : undefined,
      }
    case 'exp_depth':
      return {
        category: 'experience',
        severity,
        issue: 'Your roles are too thin to communicate scope, ownership, and results.',
        fix: 'Expand your strongest roles to roughly 3-4 useful bullets covering challenge, action, and outcome.',
        example: pro ? detail : undefined,
      }
    case 'skills':
      return {
        category: 'skills',
        severity,
        issue: 'Your skills section is not broad or specific enough to support ATS matching.',
        fix: 'Add the real tools, platforms, and methods you use most often, grouped cleanly and consistently.',
        example: pro ? detail : undefined,
      }
    case 'keywords':
      return {
        category: 'keywords',
        severity,
        issue: 'Important keywords are sitting in isolation instead of showing up in accomplishment context.',
        fix: 'Move core tools and skills into bullets where you can show how you used them to deliver results.',
        example: pro ? area.relevantText.slice(0, 3).join(', ') : undefined,
      }
    case 'education':
      return {
        category: 'education',
        severity,
        issue: 'Your education section is incomplete for ATS parsing.',
        fix: 'Include institution, degree, field of study, and graduation date in a consistent format.',
        example: pro ? detail : undefined,
      }
    case 'structure':
      return {
        category: 'formatting',
        severity,
        issue: 'Your resume structure is missing standard sections or reads in a non-standard order.',
        fix: 'Use a recruiter-friendly structure: Summary, Experience, Education, then Skills.',
        example: pro ? detail : undefined,
      }
    case 'polish':
      return {
        category: 'formatting',
        severity,
        issue: 'Your resume still has vague or non-production-ready language.',
        fix: 'Remove placeholders, replace vague bullets with specific outcomes, and tighten weak lines.',
        example: pro ? detail : undefined,
      }
    default:
      return null
  }
}

function buildKeywordAnalysis(jobKeywords: string[], data: ResumeData, scorerResult: ScorerResult) {
  const evidenceText = getResumeEvidenceText(data)

  if (jobKeywords.length > 0) {
    const presentKeywords = jobKeywords.filter(keyword => includesKeyword(evidenceText, keyword))
    const missingKeywords = jobKeywords.filter(keyword => !includesKeyword(evidenceText, keyword))

    return {
      presentKeywords,
      missingKeywords,
      keywordAnalysis: {
        mustHave: missingKeywords.slice(0, 8),
        niceToHave: presentKeywords.slice(0, 6),
        overused: [] as string[],
      },
    }
  }

  const keywordWeakArea = scorerResult.weakAreas.find(area => area.criterionId === 'keywords')
  const presentKeywords = getResumeSkills(data).filter(skill => includesKeyword(evidenceText, skill)).slice(0, 10)
  const missingKeywords = (keywordWeakArea?.relevantText ?? []).slice(0, 10)

  return {
    presentKeywords,
    missingKeywords,
    keywordAnalysis: {
      mustHave: missingKeywords.slice(0, 8),
      niceToHave: presentKeywords.slice(0, 6),
      overused: [] as string[],
    },
  }
}

function buildATSCheckerSummary(
  scorerResult: ScorerResult,
  missingKeywords: string[],
  jobKeywords: string[]
) {
  const topWeakAreas = scorerResult.weakAreas
    .slice(0, 2)
    .map(area => area.description.replace(/\.$/, ''))
    .join('; ')

  if (jobKeywords.length > 0) {
    if (missingKeywords.length === 0) {
      return `Resume scored ${scorerResult.score}/100 and covers the core job keywords well. Focus next on sharpening execution and recruiter readability.`
    }

    return `Resume scored ${scorerResult.score}/100. The biggest gaps are missing role keywords plus ${topWeakAreas || 'stronger evidence of impact'}.`
  }

  if (scorerResult.score >= 80) {
    return `Resume scored ${scorerResult.score}/100. The foundation is strong, with only a few refinements left to improve recruiter confidence.`
  }

  return `Resume scored ${scorerResult.score}/100. The biggest issues are ${topWeakAreas || 'weak impact evidence and incomplete ATS structure'}.`
}

function buildIndustryInsight(jobKeywords: string[], presentKeywords: string[], missingKeywords: string[]) {
  if (jobKeywords.length === 0) return undefined

  const leadingTerms = jobKeywords.slice(0, 3).join(', ')
  if (missingKeywords.length === 0) {
    return `This role emphasizes ${leadingTerms}. Your resume already reflects those priorities directly, so the next gains come from clearer outcomes and stronger specificity.`
  }

  return `This role emphasizes ${leadingTerms}. Your resume currently matches ${presentKeywords.length} of ${jobKeywords.length} high-signal terms directly and still needs stronger evidence around ${missingKeywords.slice(0, 3).join(', ')}.`
}

function buildATSResult(
  scorerResult: ScorerResult,
  data: ResumeData,
  pro: boolean,
  jobDescription?: string
): ATSResult {
  const jobKeywords = extractRelevantKeywords(jobDescription ?? '')
  const { presentKeywords, missingKeywords, keywordAnalysis } = buildKeywordAnalysis(jobKeywords, data, scorerResult)
  const breakdown = scorerResult.breakdown

  const baseSuggestions = scorerResult.weakAreas
    .map(area => weakAreaToSuggestion(area, breakdown, pro))
    .filter((suggestion): suggestion is ATSSuggestion => Boolean(suggestion))

  const keywordGapSuggestions = missingKeywords.slice(0, pro ? 4 : 2).map(keyword => ({
    category: 'keywords' as const,
    severity: 'high' as const,
    issue: `The target role emphasizes "${keyword}" and your resume does not show direct evidence of it.`,
    fix: `Add "${keyword}" only where it is truthful, ideally inside bullets or projects that show how you used it.`,
    example: pro ? `Weave ${keyword} into an experience bullet instead of leaving it isolated in a list.` : undefined,
  }))

  const suggestions = [...baseSuggestions, ...keywordGapSuggestions].slice(0, pro ? 10 : 5)
  const roadmap = pro ? buildATSRoadmap(scorerResult) : undefined

  return {
    score: scorerResult.score,
    tier: pro ? 'advanced' : 'basic',
    missingKeywords,
    presentKeywords,
    suggestions,
    summary: buildATSCheckerSummary(scorerResult, missingKeywords, jobKeywords),
    roadmap,
    scoreBreakdown: {
      keywordMatch: Math.round(((breakdown.keywords.score + breakdown.skills.score) / (breakdown.keywords.max + breakdown.skills.max)) * 100),
      formatting: averagePercent([breakdown.structure, breakdown.polish]),
      relevance: averagePercent([breakdown.summary, breakdown.exp_verbs, breakdown.exp_metrics, breakdown.exp_depth]),
      completeness: averagePercent([breakdown.contact, breakdown.structure, breakdown.education, breakdown.skills]),
      keywordDensity: averagePercent([breakdown.keywords]),
    },
    keywordAnalysis: pro ? keywordAnalysis : {
      mustHave: missingKeywords.slice(0, 6),
      niceToHave: [],
      overused: [],
    },
    industryInsight: pro ? buildIndustryInsight(jobKeywords, presentKeywords, missingKeywords) : undefined,
    formattingIssues: pro
      ? scorerResult.weakAreas
          .filter(area => area.criterionId === 'structure' || area.criterionId === 'polish' || area.criterionId === 'contact')
          .map(area => area.description)
      : [],
  }
}

async function getScoringResumeData(
  resumeText: string,
  storedParsedData: ResumeData | null,
  providedParsedData: ResumeData | null,
) {
  if (storedParsedData) return normalizeResumeData(storedParsedData)
  if (providedParsedData) return normalizeResumeData(providedParsedData)

  try {
    const parsed = await parseResumeText(resumeText)
    return normalizeResumeData(parsed)
  } catch (error) {
    console.warn('Failed to parse resume text for deterministic ATS score:', error instanceof Error ? error.message : error)
    return normalizeResumeData(null)
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let body: ScoreBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json<APIResponse<never>>(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  let { resumeText } = body
  const { resumeId, jobDescription, analysisMode } = body
  const providedParsedData = body.parsedResumeData ? normalizeResumeData(body.parsedResumeData) : null

  let storedParsedData: ResumeData | null = null
  if (user && resumeId) {
    const { data: resume } = await supabase
      .from('resumes')
      .select('raw_text, parsed_data')
      .eq('id', resumeId)
      .eq('user_id', user.id)
      .maybeSingle()

    storedParsedData = normalizeResumeData((resume?.parsed_data as ResumeData | null) ?? null)
    const fallbackText = resume?.raw_text?.trim() || resumeDataToText(storedParsedData)
    if ((!resumeText || resumeText.trim().length < 50) && fallbackText.trim().length > 0) {
      resumeText = fallbackText
    }
  }

  if ((!resumeText || resumeText.trim().length < 50) && providedParsedData) {
    const fallbackText = resumeDataToText(providedParsedData)
    if (fallbackText.trim().length > 0) {
      resumeText = fallbackText
    }
  }

  if (!resumeText || resumeText.trim().length < 50) {
    return NextResponse.json<APIResponse<never>>(
      { success: false, error: 'RESUME_TOO_SHORT' },
      { status: 400 }
    )
  }

  if (analysisMode === 'match' && countWords(jobDescription) < 20) {
    return NextResponse.json<APIResponse<never>>(
      { success: false, error: 'JOB_DESCRIPTION_TOO_SHORT' },
      { status: 400 }
    )
  }

  const profile = user
    ? ((await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()).data as Profile | null)
    : null
  const pro = isPro(profile)

  if (analysisMode === 'match' && (!user || !pro)) {
    return NextResponse.json<APIResponse<never>>(
      { success: false, error: 'PRO_REQUIRED' },
      { status: 403 }
    )
  }

  const scoreRateLimit = await consumeRateLimit({
    request,
    userId: user?.id ?? null,
    scope: analysisMode === 'match'
      ? 'match_score_authenticated'
      : user
        ? 'ats_score_authenticated'
        : 'ats_score_anonymous',
    limit: analysisMode === 'match'
      ? 30
      : user
        ? 60
        : 10,
    windowSeconds: 60 * 60,
  })

  if (!scoreRateLimit.allowed) {
    return createRateLimitResponse(scoreRateLimit, 'TOO_MANY_ATS_REQUESTS')
  }

  const isMatchMode = analysisMode === 'match'
  const scoringData = await getScoringResumeData(resumeText, storedParsedData, providedParsedData)
  const pipeline: ATSScoreResponse['pipeline'] = isMatchMode
    ? (pro ? 'pro_match' : 'free_match')
    : (pro ? 'pro_ats' : 'free_ats')
  const cacheFeature: AIRequestCacheFeature = isMatchMode
    ? 'match_pro'
    : (pro ? 'ats_pro' : 'ats_basic')
  const cacheSignature = user
    ? buildAIRequestSignature({
        version: ATS_SCORE_CACHE_VERSION,
        feature: cacheFeature,
        resumeData: scoringData,
        jobDescription: jobDescription?.trim() ?? '',
        pipeline,
      })
    : ''

  if (user) {
    const cached = await readAIRequestCache<CachedATSScoreResponse>({
      supabase,
      userId: user.id,
      feature: cacheFeature,
      signature: cacheSignature,
      version: ATS_SCORE_CACHE_VERSION,
    })

    if (cached) {
      return NextResponse.json<APIResponse<ATSScoreResponse>>(
        {
          success: true,
          data: {
            ...cached,
            scansRemaining: pro ? null : getRemainingFreeScans(profile),
          },
        },
        { status: 200 }
      )
    }
  }

  const normalizedResult = isMatchMode
    ? await buildMatchScoreResult({
        resumeData: scoringData,
        jobDescription: jobDescription?.trim() ?? '',
        pro,
      })
    : buildATSResult(scoreResume(scoringData), scoringData, pro, jobDescription)

  let consumedFreeScan: ConsumedAtsScanState | null = null
  if (user && !pro && !isMatchMode) {
    consumedFreeScan = await consumeAuthenticatedFreeAtsScan(user.id)

    if (!consumedFreeScan.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'FREE_LIMIT_REACHED',
          scansUsed: FREE_PLAN.limits.atsScansPerDay,
          resetAt: consumedFreeScan.resetAt,
        },
        { status: 429 }
      )
    }

    if (profile) {
      profile.ats_scans_today = consumedFreeScan.scansUsed
      profile.ats_scans_reset_at = consumedFreeScan.resetAt
    }
  }

  let savedScoreId = ''
  if (user) {
    const { data: savedScore } = await supabase
      .from('ats_scores')
      .insert({
        user_id: user.id,
        resume_id: resumeId ?? null,
        job_description: jobDescription ?? null,
        score: normalizedResult.score,
        missing_keywords: normalizedResult.missingKeywords,
        suggestions: normalizedResult.suggestions,
        scan_tier: pro ? 'advanced' : 'basic',
      })
      .select('id')
      .single()

    savedScoreId = savedScore?.id ?? ''

    if (resumeId && !isMatchMode) {
      await supabase
        .from('resumes')
        .update({
          ats_score: normalizedResult.score,
          updated_at: new Date().toISOString(),
        })
        .eq('id', resumeId)
        .eq('user_id', user.id)
    }

    revalidatePath('/dashboard')
      revalidatePath('/dashboard/resumes')
      if (resumeId) {
        revalidatePath(`/dashboard/resumes/${resumeId}`)
    }
  }

  const scansRemaining = user
    ? (
        pro
          ? null
          : consumedFreeScan?.scansRemaining ?? getRemainingFreeScans(profile)
      )
    : null
  const responseData: ATSScoreResponse = {
    ...normalizedResult,
    pipeline,
    scansRemaining: scansRemaining !== null ? Math.max(0, scansRemaining) : null,
    scoreId: savedScoreId,
    scanTier: pro ? 'advanced' : 'basic',
    resumeData: scoringData,
  }

  if (user) {
    const cacheableData = Object.fromEntries(
      Object.entries(responseData).filter(([key]) => key !== 'scansRemaining')
    ) as CachedATSScoreResponse
    await writeAIRequestCache<CachedATSScoreResponse>({
      supabase,
      userId: user.id,
      feature: cacheFeature,
      signature: cacheSignature,
      version: ATS_SCORE_CACHE_VERSION,
      data: cacheableData,
    })
  }

  return NextResponse.json<APIResponse<ATSScoreResponse>>(
    {
      success: true,
      data: responseData,
    },
    { status: 200 }
  )
}

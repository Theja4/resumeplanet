import { callClaudeJSON } from '@/lib/claude'
import type { ATSResult, ATSSuggestion, ResumeData } from '@/types'

const MATCH_SCORE_MODEL = 'deepseek/deepseek-v3.2'

const MATCH_SCORE_SYSTEM = `You are Rezoomed Match Score Engine, a conservative evaluator of how well a real resume fits a specific job description.

You are NOT doing ATS hygiene scoring. You are measuring candidate-to-role fit.

PRIMARY TASK:
1. Read the job description and extract the real hiring requirements.
2. Read the structured resume evidence.
3. For each requirement, decide whether the resume shows STRONG, PARTIAL, or NO support.
4. Be factual and conservative. If the resume does not clearly support a requirement, mark it as NONE.

NON-NEGOTIABLE RULES:
- Never invent evidence, experience, tools, seniority, domain exposure, leadership scope, or outcomes.
- Evidence strings must quote or closely mirror exact facts from the supplied resume context.
- STRONG means direct and credible evidence already exists.
- PARTIAL means adjacent or transferable evidence exists, but not a clean direct match.
- NONE means the requirement is not supported by the resume as given.
- Do not reward generic corporate phrases as evidence.
- Separate ATS polish from job fit. A well-formatted resume can still be a weak fit.

EVALUATION STANDARD:
- Prioritize must-have requirements, core responsibilities, domain experience, tools, and seniority level.
- Be harsher on missing critical requirements than on missing nice-to-haves.
- Domain alignment should reflect whether the candidate has worked in a similar environment or business problem space.
- Seniority alignment should reflect whether the candidate's existing titles/scope match the role's expected level.
- Evidence strength should reflect whether bullets show clear ownership, scope, and outcomes relevant to the JD.

OUTPUT CONTRACT:
- Return ONLY valid JSON.
- requirementAssessments should contain 6-12 items maximum.
- Suggestions must be truthful improvements to presentation or positioning, not fabricated fixes.
- Keep issue/fix lines compact and actionable.

Return JSON matching exactly this schema:
{
  "requirementAssessments": [
    {
      "requirement": "string",
      "priority": "critical | high | medium | low",
      "coverage": "strong | partial | none",
      "evidence": ["string"],
      "gapReason": "string"
    }
  ],
  "domainAlignment": {
    "score": 0,
    "reason": "string"
  },
  "seniorityAlignment": {
    "score": 0,
    "reason": "string"
  },
  "evidenceStrength": {
    "score": 0,
    "reason": "string"
  },
  "matchedKeywords": [
    {
      "keyword": "string",
      "evidence": "string"
    }
  ],
  "missingKeywords": [
    {
      "keyword": "string",
      "reason": "string"
    }
  ],
  "suggestions": [
    {
      "category": "keywords | experience | skills | summary | education | formatting",
      "severity": "high | medium | low",
      "issue": "string",
      "fix": "string",
      "example": "string or omit"
    }
  ],
  "overallAssessment": "string",
  "industryInsight": "string"
}`

type MatchPriority = 'critical' | 'high' | 'medium' | 'low'
type MatchCoverage = 'strong' | 'partial' | 'none'

interface MatchRequirementAssessment {
  requirement: string
  priority: MatchPriority
  coverage: MatchCoverage
  evidence: string[]
  gapReason: string
}

interface MatchDimension {
  score: number
  reason: string
}

interface MatchKeywordEvidence {
  keyword: string
  evidence: string
}

interface MatchKeywordGap {
  keyword: string
  reason: string
}

interface MatchScoreLLMResponse {
  requirementAssessments?: MatchRequirementAssessment[]
  domainAlignment?: Partial<MatchDimension>
  seniorityAlignment?: Partial<MatchDimension>
  evidenceStrength?: Partial<MatchDimension>
  matchedKeywords?: MatchKeywordEvidence[]
  missingKeywords?: MatchKeywordGap[]
  suggestions?: ATSSuggestion[]
  overallAssessment?: string
  industryInsight?: string
}

const PRIORITY_WEIGHTS: Record<MatchPriority, number> = {
  critical: 1.35,
  high: 1,
  medium: 0.65,
  low: 0.35,
}

const COVERAGE_WEIGHTS: Record<MatchCoverage, number> = {
  strong: 1,
  partial: 0.55,
  none: 0,
}

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

function clampScore(value: number) {
  if (Number.isNaN(value)) return 0
  return Math.max(0, Math.min(100, Math.round(value)))
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

  return deduped.slice(0, 18)
}

function resumeDataToMatchContext(data: ResumeData) {
  return JSON.stringify(
    {
      headline: {
        name: data.name,
        currentRole: data.currentRole,
        summary: data.summary,
      },
      contact: {
        location: data.location,
        linkedin: data.linkedin,
        website: data.website,
      },
      skills: data.skills,
      experience: data.experience.map(item => ({
        company: item.company,
        title: item.title,
        location: item.location,
        startDate: item.startDate,
        endDate: item.endDate,
        bullets: item.bullets,
      })),
      projects: data.projects.map(item => ({
        name: item.name,
        description: item.description,
        technologies: item.technologies,
      })),
      education: data.education,
      certifications: data.certifications,
      volunteer: data.volunteer.map(item => ({
        company: item.company,
        title: item.title,
        location: item.location,
        startDate: item.startDate,
        endDate: item.endDate,
        bullets: item.bullets,
      })),
    },
    null,
    2
  )
}

function normalizeRequirement(raw: Partial<MatchRequirementAssessment> | null | undefined): MatchRequirementAssessment | null {
  if (!raw?.requirement?.trim()) return null

  const priority: MatchPriority =
    raw.priority === 'critical' || raw.priority === 'high' || raw.priority === 'medium' || raw.priority === 'low'
      ? raw.priority
      : 'medium'

  const coverage: MatchCoverage =
    raw.coverage === 'strong' || raw.coverage === 'partial' || raw.coverage === 'none'
      ? raw.coverage
      : 'none'

  return {
    requirement: raw.requirement.trim(),
    priority,
    coverage,
    evidence: (raw.evidence ?? []).map(item => item?.trim()).filter(Boolean).slice(0, 3),
    gapReason: raw.gapReason?.trim() ?? '',
  }
}

function normalizeDimension(raw: Partial<MatchDimension> | null | undefined, fallbackReason: string): MatchDimension {
  return {
    score: clampScore(Number(raw?.score ?? 0)),
    reason: raw?.reason?.trim() || fallbackReason,
  }
}

function normalizeSuggestions(raw: ATSSuggestion[] | null | undefined, limit: number) {
  return (raw ?? [])
    .filter(item =>
      item &&
      ['keywords', 'formatting', 'experience', 'education', 'skills', 'summary'].includes(item.category) &&
      ['high', 'medium', 'low'].includes(item.severity) &&
      item.issue?.trim() &&
      item.fix?.trim()
    )
    .slice(0, limit)
    .map(item => ({
      category: item.category,
      severity: item.severity,
      issue: item.issue.trim(),
      fix: item.fix.trim(),
      example: item.example?.trim() || undefined,
    }))
}

function computeRequirementFit(requirements: MatchRequirementAssessment[]) {
  if (requirements.length === 0) return 0

  let weightedScore = 0
  let totalWeight = 0

  for (const requirement of requirements) {
    const weight = PRIORITY_WEIGHTS[requirement.priority]
    totalWeight += weight
    weightedScore += weight * COVERAGE_WEIGHTS[requirement.coverage]
  }

  if (totalWeight === 0) return 0
  return clampScore((weightedScore / totalWeight) * 100)
}

function computeKeywordCoverage(matched: string[], missing: string[]) {
  const total = matched.length + missing.length
  if (total === 0) return 0
  return clampScore((matched.length / total) * 100)
}

function computeFinalMatchScore(
  requirements: MatchRequirementAssessment[],
  domainAlignment: MatchDimension,
  seniorityAlignment: MatchDimension,
  evidenceStrength: MatchDimension,
  matchedKeywords: string[],
  missingKeywords: string[]
) {
  const requirementFit = computeRequirementFit(requirements)
  const keywordCoverage = computeKeywordCoverage(matchedKeywords, missingKeywords)

  let score =
    requirementFit * 0.48 +
    keywordCoverage * 0.14 +
    domainAlignment.score * 0.16 +
    seniorityAlignment.score * 0.08 +
    evidenceStrength.score * 0.14

  const criticalMisses = requirements.filter(item => item.priority === 'critical' && item.coverage === 'none').length
  const highMisses = requirements.filter(item => item.priority === 'high' && item.coverage === 'none').length
  score -= criticalMisses * 6 + highMisses * 3

  if (criticalMisses >= 2) {
    score = Math.min(score, 58)
  }
  if (matchedKeywords.length <= 2 && missingKeywords.length >= 6) {
    score = Math.min(score, 54)
  }

  return {
    overall: clampScore(score),
    requirementFit,
    keywordCoverage,
  }
}

function buildSummary(
  score: number,
  requirements: MatchRequirementAssessment[],
  matchedCount: number,
  missingCount: number,
  overallAssessment: string
) {
  const criticalMisses = requirements.filter(item => item.priority === 'critical' && item.coverage === 'none').length

  if (overallAssessment.trim()) {
    return overallAssessment.trim()
  }

  if (score >= 80) {
    return `Match score ${score}/100. The resume shows strong support for the core requirements and reads like a credible fit for this role.`
  }

  if (criticalMisses > 0) {
    return `Match score ${score}/100. The resume shows some relevant evidence, but missing critical requirements are holding the fit back.`
  }

  if (matchedCount > missingCount) {
    return `Match score ${score}/100. The resume covers a meaningful share of the role, but still needs stronger evidence in the weaker requirement areas.`
  }

  return `Match score ${score}/100. There are transferable signals here, but the resume does not yet map closely enough to the target role.`
}

function buildIndustryInsight(
  industryInsight: string,
  domainAlignment: MatchDimension,
  seniorityAlignment: MatchDimension,
  evidenceStrength: MatchDimension
) {
  if (industryInsight.trim()) return industryInsight.trim()

  return `Domain alignment is ${domainAlignment.score}/100, seniority alignment is ${seniorityAlignment.score}/100, and evidence strength is ${evidenceStrength.score}/100. The fit improves when the resume shows role-relevant scope and outcomes more directly.`
}

function buildFallbackSuggestions(
  requirements: MatchRequirementAssessment[],
  missingKeywords: string[],
  domainAlignment: MatchDimension,
  evidenceStrength: MatchDimension
): ATSSuggestion[] {
  const suggestions: ATSSuggestion[] = []

  for (const requirement of requirements.slice(0, 4)) {
    if (requirement.coverage === 'strong') continue
    suggestions.push({
      category: requirement.coverage === 'none' ? 'keywords' : 'experience',
      severity: requirement.priority === 'critical' || requirement.priority === 'high' ? 'high' : 'medium',
      issue: `${requirement.requirement} is not supported strongly enough in the current resume.`,
      fix: requirement.coverage === 'none'
        ? 'Only surface this requirement if the resume has truthful evidence for it. Otherwise target adjacent strengths.'
        : 'Bring the closest supporting bullet or project closer to the top and make the evidence more explicit.',
      example: requirement.evidence[0],
    })
  }

  if (domainAlignment.score < 60) {
    suggestions.push({
      category: 'summary',
      severity: 'medium',
      issue: 'The summary does not frame the candidate as a natural fit for this role.',
      fix: 'Rewrite the summary to foreground the most relevant domain, ownership, and problem space already present in the resume.',
    })
  }

  if (evidenceStrength.score < 60) {
    suggestions.push({
      category: 'experience',
      severity: 'medium',
      issue: 'Relevant experience exists, but the evidence is not stated with enough scope or outcome detail.',
      fix: 'Strengthen the best-matching bullets with concrete ownership, tools, and results already supported by the source resume.',
    })
  }

  if (missingKeywords.length > 0) {
    suggestions.push({
      category: 'skills',
      severity: 'low',
      issue: 'Several role terms never appear explicitly in the resume.',
      fix: 'Only add missing role language where the resume already proves it through experience or projects.',
    })
  }

  return suggestions.slice(0, 6)
}

function buildRiskNotes(
  requirements: MatchRequirementAssessment[],
  domainAlignment: MatchDimension,
  seniorityAlignment: MatchDimension,
  evidenceStrength: MatchDimension
) {
  const notes: string[] = requirements
    .filter(item => item.coverage === 'none' && (item.priority === 'critical' || item.priority === 'high'))
    .slice(0, 3)
    .map(item => `${item.requirement}: ${item.gapReason || 'No convincing supporting evidence was found in the resume.'}`)

  if (domainAlignment.score < 60) {
    notes.push(`Domain alignment is weak: ${domainAlignment.reason}`)
  }
  if (seniorityAlignment.score < 55) {
    notes.push(`Seniority alignment is weak: ${seniorityAlignment.reason}`)
  }
  if (evidenceStrength.score < 60) {
    notes.push(`Evidence strength is weak: ${evidenceStrength.reason}`)
  }

  return notes.slice(0, 4)
}

function buildDeterministicFallback(jobDescription: string, resumeData: ResumeData, pro: boolean): ATSResult {
  const keywords = extractRelevantKeywords(jobDescription)
  const evidenceSegments = [
    resumeData.currentRole,
    resumeData.summary,
    ...resumeData.skills,
    ...resumeData.experience.flatMap(item => [item.title, item.company, ...item.bullets]),
    ...resumeData.projects.flatMap(item => [item.name, item.description, ...(item.technologies ?? [])]),
    ...resumeData.education.flatMap(item => [item.degree, item.field, item.institution]),
  ]
    .map(item => item?.trim())
    .filter(Boolean)

  const lowerEvidence = evidenceSegments.join('\n').toLowerCase()
  const matchedKeywords = keywords.filter(keyword => lowerEvidence.includes(keyword.toLowerCase()))
  const missingKeywords = keywords.filter(keyword => !lowerEvidence.includes(keyword.toLowerCase()))

  const requirements: MatchRequirementAssessment[] = keywords.slice(0, 10).map((keyword, index) => ({
    requirement: keyword,
    priority: index < 3 ? 'high' : index < 7 ? 'medium' : 'low',
    coverage: matchedKeywords.includes(keyword) ? 'partial' : 'none',
    evidence: matchedKeywords.includes(keyword)
      ? evidenceSegments.filter(segment => segment.toLowerCase().includes(keyword.toLowerCase())).slice(0, 2)
      : [],
    gapReason: matchedKeywords.includes(keyword) ? 'Related evidence exists, but the fit may still be indirect.' : 'No direct evidence found in the current resume text.',
  }))

  const domainAlignment = {
    score: clampScore(matchedKeywords.length * 9),
    reason: 'Fallback estimate based on overlap between the job language and the resume evidence.',
  }
  const seniorityAlignment = {
    score: clampScore(
      /\b(senior|lead|principal|staff|head|director|manager)\b/i.test(jobDescription) &&
      /\b(senior|lead|principal|staff|head|director|manager)\b/i.test(`${resumeData.currentRole} ${resumeData.experience.map(item => item.title).join(' ')}`)
        ? 78
        : 52
    ),
    reason: 'Fallback estimate based on title-level language in the resume and job description.',
  }
  const evidenceStrength = {
    score: clampScore(
      resumeData.experience.flatMap(item => item.bullets).filter(bullet => /\d|improv|reduc|grew|launched|owned|led|built/i.test(bullet)).length * 12
    ),
    reason: 'Fallback estimate based on bullet specificity and outcome signals.',
  }

  const scoreParts = computeFinalMatchScore(
    requirements,
    domainAlignment,
    seniorityAlignment,
    evidenceStrength,
    matchedKeywords,
    missingKeywords
  )

  return {
    score: scoreParts.overall,
    tier: pro ? 'advanced' : 'basic',
    missingKeywords,
    presentKeywords: matchedKeywords,
    suggestions: buildFallbackSuggestions(requirements, missingKeywords, domainAlignment, evidenceStrength).slice(0, pro ? 6 : 4),
    summary: buildSummary(scoreParts.overall, requirements, matchedKeywords.length, missingKeywords.length, ''),
    scoreBreakdown: {
      keywordMatch: scoreParts.requirementFit,
      formatting: evidenceStrength.score,
      relevance: domainAlignment.score,
      completeness: seniorityAlignment.score,
      keywordDensity: scoreParts.keywordCoverage,
    },
    keywordAnalysis: {
      mustHave: missingKeywords.slice(0, 6),
      niceToHave: matchedKeywords.slice(0, 6),
      overused: [],
    },
    industryInsight: pro ? buildIndustryInsight('', domainAlignment, seniorityAlignment, evidenceStrength) : undefined,
    formattingIssues: pro ? buildRiskNotes(requirements, domainAlignment, seniorityAlignment, evidenceStrength) : [],
  }
}

export async function buildMatchScoreResult({
  resumeData,
  jobDescription,
  pro,
}: {
  resumeData: ResumeData
  jobDescription: string
  pro: boolean
}): Promise<ATSResult> {
  const deterministicKeywords = extractRelevantKeywords(jobDescription)
  const prompt = `JOB DESCRIPTION:
---
${jobDescription.slice(0, 18000)}
---

DETERMINISTIC KEYWORD HINTS:
${deterministicKeywords.join(', ') || '(none)'}

STRUCTURED RESUME EVIDENCE:
---
${resumeDataToMatchContext(resumeData)}
---

Produce an evidence-based match assessment.

Remember:
- Strong means directly supported by the resume.
- Partial means adjacent or transferable support only.
- None means unsupported.
- Be conservative on seniority and domain fit.
- Suggestions must stay truthful and practical.`

  try {
    const raw = await callClaudeJSON<MatchScoreLLMResponse>({
      model: MATCH_SCORE_MODEL,
      system: MATCH_SCORE_SYSTEM,
      prompt,
      maxTokens: 7000,
      timeoutMs: 120000,
    })

    const requirements = (raw.requirementAssessments ?? [])
      .map(item => normalizeRequirement(item))
      .filter((item): item is MatchRequirementAssessment => Boolean(item))
      .slice(0, 12)

    if (requirements.length === 0) {
      return buildDeterministicFallback(jobDescription, resumeData, pro)
    }

    const domainAlignment = normalizeDimension(raw.domainAlignment, 'Domain fit was not explained clearly by the model.')
    const seniorityAlignment = normalizeDimension(raw.seniorityAlignment, 'Seniority fit was not explained clearly by the model.')
    const evidenceStrength = normalizeDimension(raw.evidenceStrength, 'Evidence strength was not explained clearly by the model.')

    const matchedKeywords = (raw.matchedKeywords ?? [])
      .filter(item => item?.keyword?.trim() && item?.evidence?.trim())
      .map(item => ({ keyword: item.keyword.trim(), evidence: item.evidence.trim() }))
      .slice(0, 12)

    const missingKeywordDetails = (raw.missingKeywords ?? [])
      .filter(item => item?.keyword?.trim())
      .map(item => ({ keyword: item.keyword.trim(), reason: item.reason?.trim() || 'No direct support found in the resume evidence.' }))
      .slice(0, 12)

    const scoreParts = computeFinalMatchScore(
      requirements,
      domainAlignment,
      seniorityAlignment,
      evidenceStrength,
      matchedKeywords.map(item => item.keyword),
      missingKeywordDetails.map(item => item.keyword)
    )

    const suggestions = normalizeSuggestions(raw.suggestions, pro ? 8 : 5)
    const presentKeywords = matchedKeywords.map(item => item.keyword)
    const missingKeywords = missingKeywordDetails.map(item => item.keyword)

    return {
      score: scoreParts.overall,
      tier: pro ? 'advanced' : 'basic',
      missingKeywords,
      presentKeywords,
      suggestions: suggestions.length > 0
        ? suggestions
        : buildFallbackSuggestions(requirements, missingKeywords, domainAlignment, evidenceStrength).slice(0, pro ? 6 : 4),
      summary: buildSummary(
        scoreParts.overall,
        requirements,
        presentKeywords.length,
        missingKeywords.length,
        raw.overallAssessment?.trim() ?? ''
      ),
      scoreBreakdown: {
        keywordMatch: scoreParts.requirementFit,
        formatting: evidenceStrength.score,
        relevance: domainAlignment.score,
        completeness: seniorityAlignment.score,
        keywordDensity: scoreParts.keywordCoverage,
      },
      keywordAnalysis: {
        mustHave: missingKeywords.slice(0, 6),
        niceToHave: presentKeywords.slice(0, 6),
        overused: [],
      },
      industryInsight: pro
        ? buildIndustryInsight(raw.industryInsight?.trim() ?? '', domainAlignment, seniorityAlignment, evidenceStrength)
        : undefined,
      formattingIssues: pro ? buildRiskNotes(requirements, domainAlignment, seniorityAlignment, evidenceStrength) : [],
    }
  } catch (error) {
    console.warn('Match score LLM pipeline failed, using deterministic fallback:', error instanceof Error ? error.message : error)
    return buildDeterministicFallback(jobDescription, resumeData, pro)
  }
}

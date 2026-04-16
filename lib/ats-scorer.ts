import { getEducationDateLabel, getProjectBullets, getResumeSkills } from '@/lib/resume-data'
import type { ATSRoadmapAction, ATSScoreRoadmap, ResumeData } from '@/types'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ScorerBreakdown {
  score: number
  max: number
  details: string
}

export interface WeakArea {
  criterionId: string
  currentScore: number
  maxScore: number
  gap: number
  description: string
  relevantText: string[]
}

export interface ScorerResult {
  score: number
  scoreLabel: 'Poor' | 'Fair' | 'Good' | 'Excellent'
  breakdown: Record<string, ScorerBreakdown>
  weakAreas: WeakArea[]
}

type RoadmapSection = ATSRoadmapAction['section']
type RoadmapLane = ATSRoadmapAction['lane']

interface RoadmapBlueprint {
  lane: RoadmapLane
  section: RoadmapSection
  title: string
  reason: string
}

const ROADMAP_TARGET_SCORE = 90

const ROADMAP_BLUEPRINTS: Record<string, RoadmapBlueprint> = {
  contact: {
    lane: 'fixable_now',
    section: 'Header',
    title: 'Complete the resume header',
    reason: 'ATS and recruiters should see every core contact detail immediately in the top scan.',
  },
  summary: {
    lane: 'fixable_now',
    section: 'Professional Summary',
    title: 'Sharpen the professional summary',
    reason: 'The opening summary is still underselling role fit, focus, or the strongest value signal.',
  },
  exp_verbs: {
    lane: 'fixable_now',
    section: 'Work Experience',
    title: 'Rewrite weak bullet openings',
    reason: 'Task-based openings make the experience read flatter than it really is.',
  },
  exp_metrics: {
    lane: 'needs_stronger_evidence',
    section: 'Work Experience',
    title: 'Add measurable business outcomes',
    reason: 'This score will stay capped until more bullets prove impact with numbers, scale, or concrete outcomes.',
  },
  exp_depth: {
    lane: 'fixable_now',
    section: 'Work Experience',
    title: 'Deepen the strongest roles',
    reason: 'Thin role coverage leaves too little evidence of scope, ownership, and decision-making.',
  },
  skills: {
    lane: 'fixable_now',
    section: 'Skills',
    title: 'Broaden and clean up the skills section',
    reason: 'You can recover points by listing the real tools and methods you use most often, in a cleaner structure.',
  },
  structure: {
    lane: 'fixable_now',
    section: 'Resume Structure',
    title: 'Restore a standard ATS-friendly structure',
    reason: 'Missing or non-standard sections make the resume harder to parse and trust quickly.',
  },
  education: {
    lane: 'fixable_now',
    section: 'Education',
    title: 'Complete the education entry',
    reason: 'Education is still missing fields ATS systems expect in a consistent format.',
  },
  keywords: {
    lane: 'fixable_now',
    section: 'Work Experience',
    title: 'Move skills into accomplishment bullets',
    reason: 'Skills score rises when tools appear in real work evidence, not only in a skills list.',
  },
  polish: {
    lane: 'fixable_now',
    section: 'Resume-wide',
    title: 'Tighten vague or placeholder language',
    reason: 'Generic phrasing and unresolved placeholders suppress the score even when the underlying experience is solid.',
  },
}

// ─── Action Verbs (~120, organized by category) ─────────────────────────────

const ACTION_VERBS = new Set([
  // Leadership
  'led', 'directed', 'managed', 'oversaw', 'coordinated', 'mentored', 'supervised',
  'headed', 'guided', 'chaired', 'steered', 'mobilized', 'delegated', 'empowered',
  'championed', 'spearheaded',

  // Achievement
  'achieved', 'exceeded', 'surpassed', 'delivered', 'accomplished', 'earned',
  'attained', 'outperformed', 'won', 'secured', 'completed', 'generated',
  'produced', 'captured', 'maximized',

  // Creation
  'built', 'designed', 'developed', 'created', 'launched', 'established', 'founded',
  'pioneered', 'invented', 'formulated', 'initiated', 'introduced', 'devised',
  'crafted', 'constructed', 'prototyped',

  // Improvement
  'improved', 'optimized', 'enhanced', 'streamlined', 'accelerated', 'reduced',
  'increased', 'revamped', 'modernized', 'refined', 'strengthened', 'upgraded',
  'transformed', 'elevated', 'boosted', 'minimized',

  // Technical
  'engineered', 'architected', 'implemented', 'deployed', 'automated', 'migrated',
  'integrated', 'configured', 'programmed', 'debugged', 'coded', 'refactored',
  'scaled', 'provisioned', 'containerized', 'instrumented',

  // Analysis
  'analyzed', 'evaluated', 'assessed', 'researched', 'identified', 'diagnosed',
  'audited', 'investigated', 'forecasted', 'benchmarked', 'mapped', 'quantified',
  'surveyed', 'validated', 'tested', 'measured',

  // Communication
  'presented', 'negotiated', 'collaborated', 'facilitated', 'advocated', 'persuaded',
  'communicated', 'authored', 'published', 'documented', 'reported', 'trained',
  'educated', 'influenced', 'briefed',

  // Operations
  'executed', 'administered', 'maintained', 'processed', 'resolved', 'organized',
  'consolidated', 'standardized', 'scheduled', 'monitored', 'allocated', 'prioritized',
  'triaged', 'enforced', 'regulated', 'reconciled',
])

// ─── Filler Phrases ─────────────────────────────────────────────────────────

const FILLER_PHRASES = [
  'responsible for',
  'duties included',
  'tasked with',
  'helped with',
  'assisted in',
  'participated in',
  'involved in',
  'worked on',
  'contributed to',
  'successfully',
  'various',
  'multiple',
  'several',
]

// ─── Metric Patterns ────────────────────────────────────────────────────────

const METRIC_PATTERNS = [
  /\d+%/,
  /\$\d+/,
  /\d+\s*(users|clients|teams|customers|employees|members|projects|applications|servers|endpoints|requests|transactions)/i,
  /\d+x\b/i,
  /\d+\s*(hours|days|weeks|months|minutes)/i,
]

const OUTCOME_PATTERNS = [
  /\b(increased|reduced|saved|improved|boosted|grew|generated|delivered|launched|secured|expanded|cut|lowered|shortened|accelerated|optimized|streamlined|enabled|drove|achieved|surpassed|exceeded|resolved|prevented|retained)\b/i,
  /\b(resulting in|resulted in|leading to|led to|which (?:increased|reduced|improved|saved|generated|enabled)|thereby)\b/i,
]

const SCOPE_PATTERNS = [
  /\b(team|teams|customer|customers|user|users|client|clients|stakeholder|stakeholders|department|departments|business|revenue|budget|budgets|market|markets|product|products|platform|platforms|pipeline|pipelines|system|systems|service|services|application|applications|operations?|workflow|workflows|process(?:es)?|release(?:s)?|campaign(?:s)?|region(?:s)?|portfolio|incident(?:s)?|environment(?:s)?|project(?:s)?|dataset|datasets|records?)\b/i,
]

const VAGUE_TERMS_PATTERN = /\b(various|multiple|several|many|different|miscellaneous|etc\.?)\b/i
const PLACEHOLDER_PATTERN = /\[[^\]]+\]|\b(?:TBD|to be determined|placeholder)\b/i

// ─── Helpers ────────────────────────────────────────────────────────────────

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function getAllBullets(data: ResumeData): string[] {
  return data.experience.flatMap(exp => exp.bullets)
}

function getAllResumeText(data: ResumeData): string {
  const skills = getResumeSkills(data)
  const parts: string[] = [
    data.name, data.email, data.phone, data.location,
    data.linkedin, data.website, data.summary, data.currentRole,
  ]
  for (const exp of data.experience) {
    parts.push(exp.title, exp.company, exp.location, exp.summary ?? '', ...exp.bullets)
  }
  for (const edu of data.education) {
    parts.push(edu.institution, edu.degree, edu.field, edu.startDate ?? '', edu.endDate ?? '', edu.graduationDate, edu.gpa)
  }
  parts.push(...skills)
  for (const proj of data.projects) {
    parts.push(proj.name, proj.description, ...getProjectBullets(proj), ...(proj.technologies ?? []))
  }
  for (const cert of data.certifications) {
    parts.push(cert.name, cert.issuer, cert.date)
  }
  parts.push(...data.languages, ...data.interests, ...data.references)
  for (const vol of data.volunteer) {
    parts.push(vol.title, vol.company, vol.location, vol.summary ?? '', ...vol.bullets)
  }
  for (const a of data.awards) parts.push(a.title, a.issuer, a.date)
  for (const p of data.publications) parts.push(p.title, p.publisher, p.date)
  return parts.filter(Boolean).join(' ')
}

function bulletStartsWithVerb(bullet: string): boolean {
  const firstWord = bullet.trim().split(/\s+/)[0]
  if (!firstWord) return false
  return ACTION_VERBS.has(firstWord.toLowerCase().replace(/[^a-z]/g, ''))
}

function bulletStartsWithFiller(bullet: string): boolean {
  const lower = bullet.trim().toLowerCase()
  return FILLER_PHRASES.some(f => lower.startsWith(f))
}

function bulletHasMetric(bullet: string): boolean {
  return METRIC_PATTERNS.some(p => p.test(bullet))
}

function bulletHasOutcomeSignal(bullet: string): boolean {
  return OUTCOME_PATTERNS.some(pattern => pattern.test(bullet))
}

function bulletHasScopeSignal(bullet: string): boolean {
  return SCOPE_PATTERNS.some(pattern => pattern.test(bullet))
}

function skillAppearsInBullets(skill: string, bullets: string[]): boolean {
  const pattern = new RegExp(`\\b${escapeRegex(skill)}\\b`, 'i')
  return bullets.some(b => pattern.test(b))
}

function bulletHasSkillSignal(bullet: string, skills: string[]): boolean {
  return skills.some(skill => {
    if (!skill.trim()) return false
    const pattern = new RegExp(`\\b${escapeRegex(skill)}\\b`, 'i')
    return pattern.test(bullet)
  })
}

function bulletHasConcreteImpact(bullet: string, skills: string[]): boolean {
  const hasMetric = bulletHasMetric(bullet)
  const hasOutcome = bulletHasOutcomeSignal(bullet)
  const hasScope = bulletHasScopeSignal(bullet)
  const hasSkill = bulletHasSkillSignal(bullet, skills)
  const hasStrongStart = bulletStartsWithVerb(bullet)
  const wc = wordCount(bullet)

  if (hasMetric) return true
  if (hasOutcome && (hasScope || hasSkill)) return true
  if (hasStrongStart && hasScope && hasSkill && wc >= 10) return true
  return false
}

function bulletIsVague(bullet: string, skills: string[]): boolean {
  const wc = wordCount(bullet)
  if (wc <= 3) return true
  if (bulletStartsWithFiller(bullet)) return true
  if (VAGUE_TERMS_PATTERN.test(bullet) && !bulletHasMetric(bullet)) return true
  return !bulletHasConcreteImpact(bullet, skills) && wc < 10
}

function textHasPlaceholder(text: string): boolean {
  return PLACEHOLDER_PATTERN.test(text)
}

function getPlaceholderCount(data: ResumeData): number {
  const skills = getResumeSkills(data)
  const segments: string[] = [
    data.summary,
    data.name,
    data.currentRole,
    data.email,
    data.phone,
    data.location,
    data.linkedin,
    data.website,
    ...skills,
    ...data.languages,
    ...data.interests,
    ...data.references,
  ]

  for (const exp of data.experience) {
    segments.push(exp.title, exp.company, exp.location, exp.summary ?? '', ...exp.bullets)
  }

  for (const edu of data.education) {
    segments.push(edu.institution, edu.degree, edu.field, edu.startDate ?? '', edu.endDate ?? '', edu.graduationDate, edu.gpa)
  }

  for (const project of data.projects) {
    segments.push(project.name, project.description, ...getProjectBullets(project), ...(project.technologies ?? []))
  }

  for (const cert of data.certifications) {
    segments.push(cert.name, cert.issuer, cert.date)
  }

  for (const vol of data.volunteer) {
    segments.push(vol.title, vol.company, vol.location, vol.summary ?? '', ...vol.bullets)
  }

  for (const award of data.awards) {
    segments.push(award.title, award.issuer, award.date)
  }

  for (const publication of data.publications) {
    segments.push(publication.title, publication.publisher, publication.date)
  }

  for (const section of data.customSections ?? []) {
    segments.push(section.title, section.text ?? '', ...(section.tags ?? []))
    for (const item of section.items ?? []) {
      segments.push(item.title, item.company, item.location, item.summary ?? '', ...item.bullets)
    }
  }

  return segments.filter(Boolean).reduce((count, segment) => count + (textHasPlaceholder(segment) ? 1 : 0), 0)
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function getScoreLabel(score: number): 'Poor' | 'Fair' | 'Good' | 'Excellent' {
  if (score <= 30) return 'Poor'
  if (score <= 55) return 'Fair'
  if (score <= 80) return 'Good'
  return 'Excellent'
}

function uniqueEvidence(items: string[]): string[] {
  const seen = new Set<string>()
  const cleaned: string[] = []

  for (const item of items) {
    const value = item.trim()
    if (!value) continue
    if (seen.has(value.toLowerCase())) continue
    seen.add(value.toLowerCase())
    cleaned.push(value)
  }

  return cleaned
}

function estimateGain(gap: number, lane: RoadmapLane) {
  if (gap <= 0) {
    return { estimatedGainMin: 0, estimatedGainMax: 0 }
  }

  const floorMultiplier = lane === 'fixable_now' ? 0.6 : 0.45

  return {
    estimatedGainMin: Math.max(1, Math.ceil(gap * floorMultiplier)),
    estimatedGainMax: gap,
  }
}

function weakAreaToRoadmapAction(area: WeakArea): ATSRoadmapAction | null {
  const blueprint = ROADMAP_BLUEPRINTS[area.criterionId]
  if (!blueprint) return null

  const gain = estimateGain(area.gap, blueprint.lane)
  const evidence = uniqueEvidence(area.relevantText).slice(0, 3)

  return {
    criterionId: area.criterionId,
    lane: blueprint.lane,
    section: blueprint.section,
    title: blueprint.title,
    reason: blueprint.reason,
    estimatedGainMin: gain.estimatedGainMin,
    estimatedGainMax: gain.estimatedGainMax,
    evidence,
  }
}

// ─── Criterion Scorers ──────────────────────────────────────────────────────

function scoreContact(data: ResumeData): { score: number; max: number; details: string; missingFields: string[] } {
  const max = 8
  let score = 0
  const missing: string[] = []

  if (data.name?.trim()) {
    score += 2
  } else {
    missing.push('name')
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (data.email?.trim() && emailRegex.test(data.email.trim())) {
    score += 2
  } else {
    missing.push('email (valid format)')
  }

  if (data.phone?.trim()) {
    score += 2
  } else {
    missing.push('phone')
  }

  if (data.linkedin?.trim() || data.website?.trim()) {
    score += 2
  } else {
    missing.push('linkedin or website')
  }

  const details = score === max
    ? 'All contact fields present'
    : `Missing: ${missing.join(', ')}`

  return { score, max, details, missingFields: missing }
}

function scoreSummary(data: ResumeData): { score: number; max: number; details: string } {
  const max = 12
  let score = 0
  const issues: string[] = []

  const summary = data.summary?.trim() ?? ''

  if (!summary) {
    return { score: 0, max, details: 'No summary provided' }
  }

  // Exists and non-empty
  score += 4

  // Word count 30-80
  const wc = wordCount(summary)
  const sentenceCount = summary
    .split(/[.!?]+/)
    .map(part => part.trim())
    .filter(Boolean).length

  if (wc >= 30 && wc <= 80 && sentenceCount <= 3) {
    score += 4
  } else {
    if (wc < 30) issues.push(`Summary too short (${wc} words, need 30-80)`)
    if (wc > 80) issues.push(`Summary too long (${wc} words, need 30-80)`)
    if (sentenceCount > 3) issues.push(`Summary too long-form (${sentenceCount} sentences, keep it to 2-3)`)
  }

  // Contains at least 2 terms from experience titles / currentRole
  const roleTerms = new Set<string>()
  if (data.currentRole?.trim()) {
    data.currentRole.trim().toLowerCase().split(/\s+/).forEach(w => {
      if (w.length > 2) roleTerms.add(w)
    })
  }
  for (const exp of data.experience) {
    if (exp.title?.trim()) {
      exp.title.trim().toLowerCase().split(/\s+/).forEach(w => {
        if (w.length > 2) roleTerms.add(w)
      })
    }
  }

  const summaryLower = summary.toLowerCase()
  let matchCount = 0
  for (const term of roleTerms) {
    if (summaryLower.includes(term)) matchCount++
  }

  if (matchCount >= 2) {
    score += 4
  } else {
    issues.push(`Summary contains ${matchCount} role-relevant term(s), need at least 2`)
  }

  const details = issues.length === 0
    ? `Summary present, ${wc} words, role-relevant terms found`
    : issues.join('; ')

  return { score, max, details }
}

function scoreExpVerbs(data: ResumeData): { score: number; max: number; details: string; weakBullets: string[] } {
  const max = 12
  const bullets = getAllBullets(data)

  if (bullets.length === 0) {
    return { score: 0, max, details: 'No experience bullets', weakBullets: [] }
  }

  const nonEmpty = bullets.filter(b => b.trim().length > 0)
  if (nonEmpty.length === 0) {
    return { score: 0, max, details: 'All bullets are empty', weakBullets: [] }
  }

  const withVerb = nonEmpty.filter(b => bulletStartsWithVerb(b))
  const pct = (withVerb.length / nonEmpty.length) * 100

  let score: number
  if (pct >= 80) score = 12
  else if (pct >= 60) score = 8
  else if (pct >= 40) score = 5
  else score = 2

  // Deduct 1 per filler phrase bullet, min 0
  const fillerCount = nonEmpty.filter(b => bulletStartsWithFiller(b)).length
  score = Math.max(0, score - fillerCount)

  const weakBullets = nonEmpty.filter(b => !bulletStartsWithVerb(b))

  const details = `${withVerb.length}/${nonEmpty.length} bullets start with action verbs (${Math.round(pct)}%)${fillerCount > 0 ? `, ${fillerCount} filler phrase(s) found` : ''}`

  return { score, max, details, weakBullets }
}

function scoreExpMetrics(data: ResumeData): { score: number; max: number; details: string; weakBullets: string[] } {
  const max = 14
  const bullets = getAllBullets(data)
  const skills = getResumeSkills(data)

  if (bullets.length === 0) {
    return { score: 0, max, details: 'No experience bullets', weakBullets: [] }
  }

  const nonEmpty = bullets.filter(b => b.trim().length > 0)
  const withMetrics = nonEmpty.filter(b => bulletHasMetric(b))
  const withConcreteImpact = nonEmpty.filter(b => bulletHasConcreteImpact(b, skills))
  const count = withConcreteImpact.length

  let score: number
  if (count === 0) score = 0
  else if (count <= 2) score = 4
  else if (count <= 4) score = 8
  else if (count <= 7) score = 11
  else score = 14

  if (withMetrics.length === 0) {
    score = Math.min(score, 8)
  }

  const weakBullets = nonEmpty.filter(b => !bulletHasConcreteImpact(b, skills))

  const details = withMetrics.length > 0
    ? `${withConcreteImpact.length} bullet(s) show concrete impact, ${withMetrics.length} with quantified metrics`
    : `${withConcreteImpact.length} bullet(s) show concrete impact, but none include quantified metrics`

  return { score, max, details, weakBullets }
}

function scoreExpDepth(data: ResumeData): { score: number; max: number; details: string } {
  const max = 8
  const roles = data.experience

  if (roles.length === 0) {
    return { score: 0, max, details: 'No experience entries' }
  }

  const totalBullets = roles.reduce((sum, exp) => sum + exp.bullets.filter(b => b.trim()).length, 0)
  const avg = totalBullets / roles.length

  let score: number
  if (avg >= 4) score = 8
  else if (avg >= 3) score = 6
  else if (avg >= 2) score = 4
  else if (avg >= 1) score = 2
  else score = 0

  // Cap at 6 if only 1 role
  if (roles.length < 2) {
    score = Math.min(score, 6)
  }

  const details = `${roles.length} role(s), avg ${avg.toFixed(1)} bullets/role${roles.length < 2 ? ' (capped: need 2+ roles for full marks)' : ''}`

  return { score, max, details }
}

function scoreSkills(data: ResumeData): { score: number; max: number; details: string } {
  const max = 12
  const skills = getResumeSkills(data).filter(s => s.trim())

  if (skills.length === 0) {
    return { score: 0, max, details: 'No skills listed' }
  }

  let score = 0
  const parts: string[] = []

  // Has skills
  score += 4
  parts.push(`${skills.length} skill(s) listed`)

  // 8+ skills
  if (skills.length >= 8) {
    score += 4
  } else {
    parts.push(`need 8+ skills (have ${skills.length})`)
  }

  // Skills appear in experience bullets
  const bullets = getAllBullets(data)
  if (bullets.length > 0 && skills.length > 0) {
    const integrated = skills.filter(s => skillAppearsInBullets(s, bullets))
    const ratio = integrated.length / skills.length
    if (ratio >= 0.3) {
      score += 4
    } else {
      const proportional = Math.round((ratio / 0.3) * 4)
      score += proportional
      parts.push(`${integrated.length}/${skills.length} skills appear in bullets (${Math.round(ratio * 100)}%)`)
    }
  } else {
    parts.push('No experience bullets to cross-reference skills')
  }

  return { score, max, details: parts.join('; ') }
}

function scoreStructure(data: ResumeData): { score: number; max: number; details: string } {
  const max = 10
  let score = 0
  const parts: string[] = []

  // Has experience
  if (data.experience?.length > 0) {
    score += 3
  } else {
    parts.push('missing experience section')
  }

  // Has education
  if (data.education?.length > 0) {
    score += 3
  } else {
    parts.push('missing education section')
  }

  // Has skills
  if (getResumeSkills(data).length > 0) {
    score += 2
  } else {
    parts.push('missing skills section')
  }

  // Standard ordering: summary before experience, experience before education
  // We check conceptual order: summary exists and is "before" experience (we just check both exist),
  // and experience exists "before" education. Since ResumeData is structured (not ordered),
  // we check that sections that should come first are present.
  const hasSummary = !!data.summary?.trim()
  const hasExperience = data.experience?.length > 0
  const hasEducation = data.education?.length > 0

  // Both ordering checks pass if the prerequisite sections exist
  // (structural data doesn't have ordering, so we check presence as proxy)
  if (hasSummary && hasExperience && hasEducation) {
    score += 2
  } else if ((hasSummary && hasExperience) || (hasExperience && hasEducation)) {
    score += 1
    parts.push('incomplete section ordering')
  } else {
    parts.push('missing key sections for proper ordering')
  }

  const details = parts.length === 0
    ? 'All standard sections present with proper ordering'
    : parts.join('; ')

  return { score, max, details }
}

function scoreEducation(data: ResumeData): { score: number; max: number; details: string } {
  const max = 6

  if (!data.education?.length) {
    return { score: 0, max, details: 'No education entries' }
  }

  const first = data.education[0]
  let score = 0
  const parts: string[] = []

  if (first.institution?.trim()) {
    score += 2
  } else {
    parts.push('missing institution')
  }

  if (first.degree?.trim() && first.field?.trim()) {
    score += 2
  } else {
    if (!first.degree?.trim()) parts.push('missing degree')
    if (!first.field?.trim()) parts.push('missing field of study')
  }

  if (getEducationDateLabel(first)) {
    score += 2
  } else {
    parts.push('missing graduation date')
  }

  const details = parts.length === 0
    ? 'Education section complete'
    : `Education incomplete: ${parts.join(', ')}`

  return { score, max, details }
}

function scoreKeywords(data: ResumeData): { score: number; max: number; details: string; unmatchedSkills: string[] } {
  const max = 10
  const skills = getResumeSkills(data).filter(s => s.trim())
  const bullets = getAllBullets(data)

  if (skills.length === 0 || bullets.length === 0) {
    return {
      score: 0,
      max,
      details: skills.length === 0 ? 'No skills to check' : 'No experience bullets to check against',
      unmatchedSkills: skills,
    }
  }

  const matched = skills.filter(s => skillAppearsInBullets(s, bullets))
  const unmatched = skills.filter(s => !skillAppearsInBullets(s, bullets))
  const pct = (matched.length / skills.length) * 100

  let score: number
  if (pct >= 60) score = 10
  else if (pct >= 40) score = 7
  else if (pct >= 20) score = 4
  else score = 1

  const details = `${matched.length}/${skills.length} skills (${Math.round(pct)}%) appear in experience bullets`

  return { score, max, details, unmatchedSkills: unmatched }
}

function scorePolish(data: ResumeData): { score: number; max: number; details: string } {
  const max = 8
  let score = 0
  const parts: string[] = []

  // Total word count 300-900
  const totalText = getAllResumeText(data)
  const wc = wordCount(totalText)
  if (wc >= 300 && wc <= 900) {
    score += 3
  } else {
    parts.push(wc < 300 ? `Resume too short (${wc} words, need 300-900)` : `Resume too long (${wc} words, need 300-900)`)
  }

  // No standard sections completely empty
  const hasExp = data.experience?.length > 0
  const hasEdu = data.education?.length > 0
  const hasSkills = getResumeSkills(data).filter(s => s.trim()).length > 0
  if (hasExp && hasEdu && hasSkills) {
    score += 2
  } else {
    const empty: string[] = []
    if (!hasExp) empty.push('experience')
    if (!hasEdu) empty.push('education')
    if (!hasSkills) empty.push('skills')
    parts.push(`Empty sections: ${empty.join(', ')}`)
  }

  // No overly thin bullets
  const bullets = getAllBullets(data).filter(b => b.trim())
  const thinBullets = bullets.filter(b => bulletIsVague(b, getResumeSkills(data)))
  if (thinBullets.length === 0) {
    score += 1
  } else {
    parts.push(`${thinBullets.length} bullet(s) are too vague or underdeveloped`)
  }

  const placeholderCount = getPlaceholderCount(data)
  if (placeholderCount === 0) {
    score += 2
  } else {
    parts.push(`${placeholderCount} unresolved placeholder(s) found`)
  }

  const details = parts.length === 0
    ? `Well-polished (${wc} words, complete sections, production-ready language)`
    : parts.join('; ')

  return { score, max, details }
}

// ─── Main Scorer ────────────────────────────────────────────────────────────

export function scoreResume(data: ResumeData): ScorerResult {
  const contact = scoreContact(data)
  const summary = scoreSummary(data)
  const expVerbs = scoreExpVerbs(data)
  const expMetrics = scoreExpMetrics(data)
  const expDepth = scoreExpDepth(data)
  const skills = scoreSkills(data)
  const structure = scoreStructure(data)
  const education = scoreEducation(data)
  const keywords = scoreKeywords(data)
  const polish = scorePolish(data)

  const breakdown: Record<string, ScorerBreakdown> = {
    contact: { score: contact.score, max: contact.max, details: contact.details },
    summary: { score: summary.score, max: summary.max, details: summary.details },
    exp_verbs: { score: expVerbs.score, max: expVerbs.max, details: expVerbs.details },
    exp_metrics: { score: expMetrics.score, max: expMetrics.max, details: expMetrics.details },
    exp_depth: { score: expDepth.score, max: expDepth.max, details: expDepth.details },
    skills: { score: skills.score, max: skills.max, details: skills.details },
    structure: { score: structure.score, max: structure.max, details: structure.details },
    education: { score: education.score, max: education.max, details: education.details },
    keywords: { score: keywords.score, max: keywords.max, details: keywords.details },
    polish: { score: polish.score, max: polish.max, details: polish.details },
  }

  const totalScore = Object.values(breakdown).reduce((sum, b) => sum + b.score, 0)

  // Build weakAreas for criteria with gap > 0
  const weakAreas: WeakArea[] = []

  for (const [id, b] of Object.entries(breakdown)) {
    const gap = b.max - b.score
    if (gap <= 0) continue

    let description: string
    let relevantText: string[]

    switch (id) {
      case 'contact':
        description = 'Missing contact information reduces ATS parseability'
        relevantText = contact.missingFields
        break
      case 'summary':
        description = 'Professional summary needs improvement for recruiter engagement'
        relevantText = data.summary?.trim() ? [data.summary] : ['No summary']
        break
      case 'exp_verbs':
        description = 'Work experience bullets should start with strong action verbs'
        relevantText = expVerbs.weakBullets
        break
      case 'exp_metrics':
        description = 'Add quantified or concrete outcomes so each bullet clearly shows scope, results, or business impact'
        relevantText = expMetrics.weakBullets
        break
      case 'exp_depth':
        description = 'Add more bullet points to describe your experience in depth'
        relevantText = data.experience.map(e => `${e.title} at ${e.company}: ${e.bullets.filter(b => b.trim()).length} bullet(s)`)
        break
      case 'skills':
        description = 'Skills section needs more entries or better integration with experience'
        relevantText = getResumeSkills(data).length ? getResumeSkills(data) : ['No skills listed']
        break
      case 'structure':
        description = 'Resume structure is incomplete or improperly ordered'
        relevantText = [b.details]
        break
      case 'education':
        description = 'Education section is missing required information'
        relevantText = [b.details]
        break
      case 'keywords':
        description = 'Skills should appear within experience context, not just the skills section'
        relevantText = keywords.unmatchedSkills
        break
      case 'polish':
        description = 'Resume language should be production-ready, specific, and free of placeholders'
        relevantText = [b.details]
        break
      default:
        description = b.details
        relevantText = []
    }

    weakAreas.push({
      criterionId: id,
      currentScore: b.score,
      maxScore: b.max,
      gap,
      description,
      relevantText,
    })
  }

  // Sort by gap descending
  weakAreas.sort((a, b) => b.gap - a.gap)

  return {
    score: totalScore,
    scoreLabel: getScoreLabel(totalScore),
    breakdown,
    weakAreas,
  }
}

export function buildATSRoadmap(scorerResult: ScorerResult): ATSScoreRoadmap {
  const actions = scorerResult.weakAreas
    .map(weakAreaToRoadmapAction)
    .filter((action): action is ATSRoadmapAction => Boolean(action))
    .sort((left, right) => {
      if (right.estimatedGainMax !== left.estimatedGainMax) {
        return right.estimatedGainMax - left.estimatedGainMax
      }
      return right.estimatedGainMin - left.estimatedGainMin
    })

  const fixableNow = actions.filter(action => action.lane === 'fixable_now')
  const evidenceBlockers = actions.filter(action => action.lane === 'needs_stronger_evidence')

  const fixablePotential = fixableNow.reduce((sum, action) => sum + action.estimatedGainMax, 0)
  const blockedPotential = evidenceBlockers.reduce((sum, action) => sum + action.estimatedGainMax, 0)
  const truthfulCeiling = Math.min(100, scorerResult.score + fixablePotential)
  const gapToTarget = Math.max(0, ROADMAP_TARGET_SCORE - scorerResult.score)

  return {
    currentScore: scorerResult.score,
    targetScore: ROADMAP_TARGET_SCORE,
    gapToTarget,
    truthfulCeiling,
    fixablePotential,
    blockedPotential,
    canReachTargetNow: truthfulCeiling >= ROADMAP_TARGET_SCORE,
    fixableNow,
    evidenceBlockers,
  }
}

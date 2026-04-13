import { scoreResume } from '@/lib/ats-scorer'
import { getProjectBullets, getResumeSkills, syncResumeData } from '@/lib/resume-data'
import type { ExperienceItem, ResumeData, TailorAnalysis } from '@/types'

type ApplyScope = 'all' | 'summary' | 'skills' | 'experience' | 'projects' | 'education' | 'volunteer'
type MutableScope = Exclude<ApplyScope, 'all'>

const APPLY_ORDER: MutableScope[] = ['summary', 'skills', 'experience', 'projects', 'volunteer', 'education']

function normalizeText(value: string | undefined | null) {
  return (value ?? '').trim().toLowerCase()
}

function isMeaningfulText(value: string | undefined | null) {
  return normalizeText(value).length > 0
}

function sameEntity(left: string | undefined | null, right: string | undefined | null) {
  const a = normalizeText(left)
  const b = normalizeText(right)
  if (!a || !b) return false
  return a === b || a.includes(b) || b.includes(a)
}

function dedupeSkills(skills: string[]) {
  const seen = new Set<string>()
  const ordered: string[] = []

  for (const skill of skills) {
    const trimmed = skill.trim()
    if (!trimmed) continue
    const key = trimmed.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    ordered.push(trimmed)
  }

  return ordered
}

function mergeSkills(existingSkills: string[], analysis: TailorAnalysis) {
  const existing = dedupeSkills(existingSkills)
  const recommendationMap = new Map(existing.map(skill => [skill.toLowerCase(), skill]))

  const recommended = analysis.skillsPlan.recommendedOrder
    .map(skill => recommendationMap.get(skill.trim().toLowerCase()) ?? skill.trim())
    .filter(Boolean)

  const additions = analysis.skillsPlan.add.map(skill => skill.trim()).filter(Boolean)
  const deprioritized = new Set(analysis.skillsPlan.deprioritize.map(skill => skill.trim().toLowerCase()).filter(Boolean))

  const recommendedSet = new Set(recommended.map(skill => skill.toLowerCase()))
  const additionSet = new Set(additions.map(skill => skill.toLowerCase()))

  const carryForward = existing.filter(skill => !recommendedSet.has(skill.toLowerCase()) && !additionSet.has(skill.toLowerCase()))
  const prioritizedCarryForward = carryForward.filter(skill => !deprioritized.has(skill.toLowerCase()))
  const deprioritizedCarryForward = carryForward.filter(skill => deprioritized.has(skill.toLowerCase()))

  return dedupeSkills([
    ...recommended,
    ...additions,
    ...prioritizedCarryForward,
    ...deprioritizedCarryForward,
  ])
}

function mergeSkillSections(data: ResumeData, mergedSkills: string[]) {
  if ((data.skillSections?.length ?? 0) === 0) {
    return [{ title: 'Core Skills', skills: mergedSkills }]
  }

  const [firstSection, ...rest] = data.skillSections ?? []
  return [
    { ...firstSection, skills: mergedSkills },
    ...rest,
  ]
}

function applyBulletRewritesToItems(
  items: ExperienceItem[],
  rewrites: TailorAnalysis['bulletRewrites'],
  sectionId: 'experience' | 'volunteer'
) {
  let changed = false

  for (const rewrite of rewrites) {
    if (rewrite.sectionId !== sectionId) continue

    for (const item of items) {
      if (
        rewrite.companyOrProject &&
        !sameEntity(item.company, rewrite.companyOrProject) &&
        !sameEntity(item.title, rewrite.companyOrProject)
      ) {
        continue
      }

      const bulletIndex = item.bullets.findIndex(bullet => bullet.trim() === rewrite.original.trim())
      if (bulletIndex !== -1) {
        item.bullets[bulletIndex] = rewrite.tailored.trim()
        changed = true
        break
      }
    }
  }

  return changed
}

function reorderBullets(items: ExperienceItem[], plans: TailorAnalysis['bulletOrderPlans'], sectionId: 'experience' | 'volunteer') {
  let changed = false

  for (const plan of plans) {
    if (plan.sectionId !== sectionId) continue

    for (const item of items) {
      if (
        plan.companyOrProject &&
        !sameEntity(item.company, plan.companyOrProject) &&
        !sameEntity(item.title, plan.companyOrProject)
      ) {
        continue
      }

      const bulletMap = new Map(item.bullets.map(bullet => [bullet.trim(), bullet]))
      const orderedBullets = plan.orderedOriginalBullets
        .map(original => bulletMap.get(original.trim()))
        .filter((bullet): bullet is string => typeof bullet === 'string')

      if (orderedBullets.length === 0) continue

      const orderedSet = new Set(orderedBullets.map(bullet => bullet.trim()))
      const trailingBullets = item.bullets.filter(bullet => !orderedSet.has(bullet.trim()))
      item.bullets = [...orderedBullets, ...trailingBullets]
      changed = true
      break
    }
  }

  return changed
}

function applyProjectRewrites(data: ResumeData, rewrites: TailorAnalysis['bulletRewrites']) {
  let changed = false

  for (const rewrite of rewrites) {
    if (rewrite.sectionId !== 'projects') continue

    for (const project of data.projects) {
      if (!sameEntity(project.name, rewrite.companyOrProject)) continue

      if (project.description.trim() === rewrite.original.trim()) {
        project.description = rewrite.tailored.trim()
        changed = true
        break
      }

      const bulletIndex = getProjectBullets(project).findIndex(bullet => bullet.trim() === rewrite.original.trim())
      if (bulletIndex !== -1) {
        const bullets = [...getProjectBullets(project)]
        bullets[bulletIndex] = rewrite.tailored.trim()
        project.bullets = bullets
        if (!project.description.trim() || project.description.trim() === rewrite.original.trim()) {
          project.description = rewrite.tailored.trim()
        }
        changed = true
        break
      }
    }
  }

  return changed
}

function applyScopeMutations(
  next: ResumeData,
  analysis: TailorAnalysis,
  scope: MutableScope
) {
  let changed = false

  if (scope === 'summary') {
    if (isMeaningfulText(analysis.tailoredHeadline) && analysis.tailoredHeadline.trim() !== next.currentRole.trim()) {
      next.currentRole = analysis.tailoredHeadline.trim()
      changed = true
    }

    if (isMeaningfulText(analysis.tailoredSummary) && analysis.tailoredSummary.trim() !== next.summary.trim()) {
      next.summary = analysis.tailoredSummary.trim()
      changed = true
    }
  }

  if (scope === 'skills') {
    const existingSkills = getResumeSkills(next)
    const mergedSkills = mergeSkills(existingSkills, analysis)
    if (JSON.stringify(mergedSkills) !== JSON.stringify(existingSkills)) {
      next.skills = mergedSkills
      next.skillSections = mergeSkillSections(next, mergedSkills)
      changed = true
    }
  }

  if (scope === 'experience') {
    const reorderedExperience = reorderBullets(next.experience, analysis.bulletOrderPlans, 'experience')
    const rewroteExperience = applyBulletRewritesToItems(next.experience, analysis.bulletRewrites, 'experience')
    if (rewroteExperience || reorderedExperience) {
      changed = true
    }
  }

  if (scope === 'volunteer') {
    const reorderedVolunteer = reorderBullets(next.volunteer, analysis.bulletOrderPlans, 'volunteer')
    const rewroteVolunteer = applyBulletRewritesToItems(next.volunteer, analysis.bulletRewrites, 'volunteer')
    if (rewroteVolunteer || reorderedVolunteer) {
      changed = true
    }
  }

  if (scope === 'projects' && applyProjectRewrites(next, analysis.bulletRewrites)) {
    changed = true
  }

  return changed
}

function buildNoChangeResult(data: ResumeData) {
  const baseline = scoreResume(data)
  return {
    data,
    changed: false,
    touchedSections: [] as string[],
    beforeScore: baseline.score,
    afterScore: baseline.score,
    scoreDelta: 0,
  }
}

export function applyTailorAnalysisToResumeData(
  data: ResumeData,
  analysis: TailorAnalysis,
  scope: ApplyScope = 'all'
) {
  const before = scoreResume(data)

  if (scope !== 'all') {
    const next = structuredClone(data)
    const changed = applyScopeMutations(next, analysis, scope)

    if (!changed) {
      return buildNoChangeResult(data)
    }

    const after = scoreResume(next)
    if (after.score < before.score) {
      return buildNoChangeResult(data)
    }

    return {
      data: next,
      changed: true,
      touchedSections: [scope],
      beforeScore: before.score,
      afterScore: after.score,
      scoreDelta: after.score - before.score,
    }
  }

  let working = structuredClone(data)
  let currentScore = before.score
  const touchedSections = new Set<MutableScope>()

  for (const sectionId of APPLY_ORDER) {
    const candidate = structuredClone(working)
    const sectionChanged = applyScopeMutations(candidate, analysis, sectionId)

    if (!sectionChanged) continue

    const scoredCandidate = scoreResume(candidate)
    if (scoredCandidate.score < currentScore) continue

    working = candidate
    currentScore = scoredCandidate.score
    touchedSections.add(sectionId)
  }

  if (touchedSections.size === 0) {
    return buildNoChangeResult(data)
  }

  return {
    data: syncResumeData(working),
    changed: true,
    touchedSections: Array.from(touchedSections),
    beforeScore: before.score,
    afterScore: currentScore,
    scoreDelta: currentScore - before.score,
  }
}

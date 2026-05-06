import { scoreResume } from '@/lib/ats-scorer'
import { getProjectBullets, getResumeSkills, normalizeSkillSections, splitSkillInput, syncResumeData } from '@/lib/resume-data'
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
  // Use original existing skills to preserve formatting (capitalization, etc.)
  const existingMap = new Map(existingSkills.map(skill => [skill.toLowerCase().trim(), skill]))
  
  const recommended = analysis.skillsPlan.recommendedOrder
    .map(skill => {
      const trimmed = skill.trim()
      return existingMap.get(trimmed.toLowerCase()) ?? trimmed
    })
    .filter(Boolean)

  const additions = analysis.skillsPlan.add.map(skill => skill.trim()).filter(Boolean)
  const deprioritized = new Set(analysis.skillsPlan.deprioritize.map(skill => skill.trim().toLowerCase()).filter(Boolean))

  const recommendedSet = new Set(recommended.map(skill => skill.toLowerCase()))
  const additionSet = new Set(additions.map(skill => skill.toLowerCase()))

  const carryForward = existingSkills.filter(skill => {
    const lower = skill.toLowerCase().trim()
    return !recommendedSet.has(lower) && !additionSet.has(lower)
  })
  
  const prioritizedCarryForward = carryForward.filter(skill => !deprioritized.has(skill.toLowerCase().trim()))
  const deprioritizedCarryForward = carryForward.filter(skill => deprioritized.has(skill.toLowerCase().trim()))

  return dedupeSkills([
    ...recommended,
    ...additions,
    ...prioritizedCarryForward,
    ...deprioritizedCarryForward,
  ])
}

function mergeSkillSections(data: ResumeData, mergedSkills: string[]) {
  // 1. Identify category-prefixed skills from AI (e.g. "Technical: SQL, Python")
  const currentSections = normalizeSkillSections(data.skillSections, data.skills)
  const categoryMap = new Map<string, string[]>()
  
  const cleanMergedSkills: string[] = []
  for (const rawSkill of mergedSkills) {
    const colonIndex = rawSkill.indexOf(':')
    if (colonIndex > 0 && colonIndex < 30) {
      const title = rawSkill.slice(0, colonIndex).trim()
      const content = rawSkill.slice(colonIndex + 1).trim()
      
      // Check if this title matches an existing section (case-insensitive)
      const matchingSection = currentSections.find(s => s.title.toLowerCase() === title.toLowerCase())
      if (matchingSection) {
        const skills = splitSkillInput(content)
        categoryMap.set(matchingSection.title, [...(categoryMap.get(matchingSection.title) || []), ...skills])
        continue
      }
    }
    cleanMergedSkills.push(rawSkill)
  }

  const normalizedSkills = cleanMergedSkills.flatMap(splitSkillInput).map(skill => skill.trim()).filter(Boolean)
  const lowerMergedSkills = new Map(normalizedSkills.map(skill => [skill.toLowerCase(), skill]))
  const assigned = new Set<string>()

  const rebuilt = currentSections.map(section => {
    // Skills explicitly mapped via "Title: ..." strings
    const explicitlyAssigned = categoryMap.get(section.title) || []
    
    // Skills from the original section that survived the merge
    const kept = section.skills
      .map(skill => {
        const found = lowerMergedSkills.get(skill.toLowerCase())
        if (found) return found
        const fallbackMatch = normalizedSkills.find(ns => ns.toLowerCase() === skill.toLowerCase())
        return fallbackMatch ? skill : null
      })
      .filter((skill): skill is string => Boolean(skill))

    const finalSkills = dedupeSkills([...explicitlyAssigned, ...kept])
    finalSkills.forEach(skill => assigned.add(skill.toLowerCase()))

    return {
      ...section,
      skills: finalSkills,
    }
  })

  const unassigned = normalizedSkills.filter(skill => !assigned.has(skill.toLowerCase()))

  if (unassigned.length > 0) {
    const coreIndex = rebuilt.findIndex(section => (section.title?.trim() || '').toLowerCase() === 'core skills')
    if (coreIndex !== -1) {
      rebuilt[coreIndex] = {
        ...rebuilt[coreIndex],
        skills: [...rebuilt[coreIndex].skills, ...unassigned],
      }
    } else {
      rebuilt.push({ title: 'Additional Skills', tag: '', skills: unassigned })
    }
  }

  return rebuilt.filter(section => section.title || section.tag || section.skills.length > 0)
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

export function canApplyTailorSection(
  analysis: TailorAnalysis,
  scope: MutableScope
) {
  if (scope === 'summary') {
    return isMeaningfulText(analysis.tailoredHeadline) || isMeaningfulText(analysis.tailoredSummary)
  }

  if (scope === 'skills') {
    return (
      analysis.skillsPlan.recommendedOrder.length > 0 ||
      analysis.skillsPlan.add.length > 0 ||
      analysis.skillsPlan.deprioritize.length > 0
    )
  }

  if (scope === 'experience') {
    return (
      analysis.bulletRewrites.some(rewrite => rewrite.sectionId === 'experience') ||
      analysis.bulletOrderPlans.some(plan => plan.sectionId === 'experience')
    )
  }

  if (scope === 'projects') {
    return analysis.bulletRewrites.some(rewrite => rewrite.sectionId === 'projects')
  }

  if (scope === 'volunteer') {
    return (
      analysis.bulletRewrites.some(rewrite => rewrite.sectionId === 'volunteer') ||
      analysis.bulletOrderPlans.some(plan => plan.sectionId === 'volunteer')
    )
  }

  return false
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

    const synced = syncResumeData(next)
    const after = scoreResume(synced)

    return {
      data: synced,
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
    const sectionChanged = applyScopeMutations(working, analysis, sectionId)

    if (!sectionChanged) continue

    working = syncResumeData(working)
    const scored = scoreResume(working)
    currentScore = scored.score
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

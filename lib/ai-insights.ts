import { scoreResume, type ScorerResult } from '@/lib/ats-scorer'
import { syncResumeData } from '@/lib/resume-data'
import type { ResumeData } from '@/types'

export interface InsightSuggestionLike {
  beforeText: string
  afterText: string
  sectionHint: 'experience' | 'summary' | 'skills' | 'education' | 'projects'
  criterionId?: string
}

const PLACEHOLDER_TEXT_PATTERN = /\[[^\]]+\]|\b(?:TBD|to be determined|placeholder)\b/i
const WEAK_RESUME_PREFIX_PATTERN = /^(responsible for|duties included|tasked with|helped with|assisted in|participated in|involved in|worked on|contributed to)\b/i

function replaceIfPresent(source: string, beforeText: string, afterText: string) {
  if (!beforeText) return { value: source, changed: false }
  if (source === beforeText) return { value: afterText, changed: true }
  if (source.includes(beforeText)) {
    return { value: source.replace(beforeText, afterText), changed: true }
  }
  return { value: source, changed: false }
}

export function hasUnresolvedPlaceholderText(text: string) {
  return PLACEHOLDER_TEXT_PATTERN.test(text)
}

export function startsWithWeakResumePhrase(text: string) {
  return WEAK_RESUME_PREFIX_PATTERN.test(text.trim())
}

export function applyInsightSuggestionToResumeData<T extends InsightSuggestionLike>(
  data: ResumeData,
  suggestion: T
): ResumeData {
  const updated = structuredClone(data)
  const { beforeText, afterText, sectionHint } = suggestion

  if (sectionHint === 'experience') {
    for (const exp of updated.experience) {
      const exactIndex = exp.bullets.indexOf(beforeText)
      if (exactIndex !== -1) {
        exp.bullets[exactIndex] = afterText
        return updated
      }
    }

    for (const exp of updated.experience) {
      const partialIndex = exp.bullets.findIndex(bullet => bullet.includes(beforeText))
      if (partialIndex !== -1) {
        exp.bullets[partialIndex] = exp.bullets[partialIndex].replace(beforeText, afterText)
        return updated
      }
    }

    return data
  }

  if (sectionHint === 'summary') {
    if (beforeText) {
      const replaced = replaceIfPresent(updated.summary, beforeText, afterText)
      if (replaced.changed) {
        updated.summary = replaced.value
        return updated
      }
    }

    if (updated.summary !== afterText) {
      updated.summary = afterText
      return updated
    }

    return data
  }

  if (sectionHint === 'skills') {
    const nextSkills = afterText.split(',').map(skill => skill.trim()).filter(Boolean)
    const nextData = syncResumeData({
      ...updated,
      skillSections: updated.skillSections?.length
        ? updated.skillSections.map((section, index) =>
            index === 0
              ? { ...section, skills: nextSkills }
              : section
          )
        : [{ title: 'Core Skills', skills: nextSkills }],
    })
    const unchanged =
      nextSkills.length === nextData.skills.length &&
      nextSkills.every((skill, index) => skill === nextData.skills[index])

    if (unchanged) return data

    return nextData
  }

  if (sectionHint === 'projects') {
    for (const project of updated.projects) {
      const descriptionReplacement = replaceIfPresent(project.description, beforeText, afterText)
      if (descriptionReplacement.changed) {
        project.description = descriptionReplacement.value
        return updated
      }

      const nameReplacement = replaceIfPresent(project.name, beforeText, afterText)
      if (nameReplacement.changed) {
        project.name = nameReplacement.value
        return updated
      }
    }

    return data
  }

  if (sectionHint === 'education') {
    for (const education of updated.education) {
      const fields: Array<keyof typeof education> = ['institution', 'degree', 'field', 'startDate', 'endDate', 'graduationDate', 'gpa']
      for (const field of fields) {
        const currentValue = education[field] ?? ''
        const replaced = replaceIfPresent(currentValue, beforeText, afterText)
        if (replaced.changed) {
          education[field] = replaced.value
          return updated
        }
      }
    }

    return data
  }

  return data
}

export function getInsightSuggestionScoreDelta<T extends InsightSuggestionLike>(
  data: ResumeData,
  suggestion: T
) {
  const before = scoreResume(data)
  const updated = applyInsightSuggestionToResumeData(data, suggestion)

  if (updated === data) {
    return { delta: 0, updatedData: data, before, after: before }
  }

  const after = scoreResume(updated)
  return {
    delta: after.score - before.score,
    updatedData: updated,
    before,
    after,
  }
}

export function hasBreakdownRegression(before: ScorerResult, after: ScorerResult) {
  return Object.entries(before.breakdown).some(([criterionId, breakdown]) => {
    return (after.breakdown[criterionId]?.score ?? 0) < breakdown.score
  })
}

export function improvesIntendedCriterion(
  before: ScorerResult,
  after: ScorerResult,
  criterionId?: string
) {
  if (!criterionId) return false

  const relatedCriteria: Record<string, string[]> = {
    summary: ['summary'],
    exp_verbs: ['exp_verbs'],
    exp_metrics: ['exp_metrics'],
    exp_depth: ['exp_depth'],
    skills: ['skills'],
    keywords: ['keywords'],
    contact: ['contact'],
    education: ['education'],
    structure: ['structure'],
    polish: ['polish'],
  }

  const criteriaToCheck = relatedCriteria[criterionId] ?? [criterionId]
  return criteriaToCheck.some(id => {
    const beforeScore = before.breakdown[id]?.score ?? 0
    const afterScore = after.breakdown[id]?.score ?? 0
    return afterScore > beforeScore
  })
}

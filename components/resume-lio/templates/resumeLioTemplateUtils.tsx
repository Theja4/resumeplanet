'use client'

import type { EducationItem, ExperienceItem, ProjectItem, ResumeData } from '@/types'
import { getEducationDateLabel, getProjectDescription, getResumeSkills } from '@/lib/resume-data'

export const imageSet = [
  'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80',
]

export const fadeUp = {
  initial: { opacity: 0, y: 36 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' as `${number}px` },
  transition: { duration: 0.7, ease: 'easeOut' as const },
}

export const popIn = {
  initial: { opacity: 0, scale: 0.94 },
  whileInView: { opacity: 1, scale: 1 },
  viewport: { once: true, margin: '-80px' as `${number}px` },
  transition: { duration: 0.65, ease: 'easeOut' as const },
}

export const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

export function firstName(data: ResumeData) {
  return data.name?.trim().split(/\s+/)[0] || 'You'
}

export function initials(name: string) {
  return (name || 'You')
    .split(/\s+/)
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function roleLabel(data: ResumeData) {
  return data.currentRole?.trim() || data.experience[0]?.title || 'Professional'
}

export function summaryText(data: ResumeData) {
  return data.summary?.trim() || `Experienced ${roleLabel(data).toLowerCase()} with a strong track record of delivering results.`
}

export function skillsFor(data: ResumeData, limit?: number) {
  const skills = getResumeSkills(data)
  return typeof limit === 'number' ? skills.slice(0, limit) : skills
}

export function projectDescription(project: ProjectItem) {
  const description = getProjectDescription(project)
  return description || project.bullets?.[0] || ''
}

export function projectImage(index: number) {
  return imageSet[index % imageSet.length]
}

export function educationLabel(education: EducationItem) {
  return getEducationDateLabel(education)
}

export function proofStats(data: ResumeData) {
  const skills = getResumeSkills(data)
  const experience = getExperienceTenure(data.experience)
  return [
    { value: experience ? experience.label : `${data.experience.length || 0}`, label: experience ? 'Years Experience' : 'Roles Held' },
    { value: `${data.projects.length || 0}`, label: 'Projects' },
    { value: `${skills.length}`, label: 'Skills' },
  ]
}

export function contactHref(email?: string | null) {
  return email ? `mailto:${email}` : '#contact'
}

export function hasAny<T>(items: T[] | undefined | null) {
  return Array.isArray(items) && items.length > 0
}

export function sectionCount(data: ResumeData) {
  return [
    data.summary,
    data.experience.length,
    data.projects.length,
    skillsFor(data).length,
    data.education.length,
    data.certifications.length,
    data.awards.length,
    data.publications.length,
  ].filter(Boolean).length
}

export function capabilityCards(data: ResumeData, count = 4) {
  const skills = skillsFor(data)
  const fallback = ['Strategy', 'Execution', 'Communication', 'Ownership']
  return (skills.length ? skills : fallback).slice(0, count).map((skill, index) => ({
    title: skill,
    description:
      data.experience[index]?.bullets?.[0] ||
      data.projects[index]?.description ||
      '',
  }))
}

const MONTH_INDEX: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
}

function monthNumber(value: string, isEnd = false) {
  const trimmed = value.trim().toLowerCase()
  if (!trimmed) return null
  if (/^(present|current|now)$/i.test(trimmed)) {
    const now = new Date()
    return now.getFullYear() * 12 + now.getMonth()
  }

  const yearMatch = trimmed.match(/\b(19|20)\d{2}\b/)
  if (!yearMatch) return null

  const year = Number(yearMatch[0])
  const monthName = Object.keys(MONTH_INDEX).find(month => new RegExp(`\\b${month}\\b`, 'i').test(trimmed))
  if (monthName) return year * 12 + MONTH_INDEX[monthName]

  const numericMonth =
    trimmed.match(/\b(0?[1-9]|1[0-2])[/-](?:19|20)\d{2}\b/)?.[1] ??
    trimmed.match(/\b(?:19|20)\d{2}[/-](0?[1-9]|1[0-2])\b/)?.[1]

  if (numericMonth) return year * 12 + Number(numericMonth) - 1
  return year * 12 + (isEnd ? 11 : 0)
}

function mergeMonthRanges(ranges: Array<[number, number]>) {
  const sorted = ranges
    .map(([start, end]) => [Math.min(start, end), Math.max(start, end)] as [number, number])
    .sort((a, b) => a[0] - b[0])

  const merged: Array<[number, number]> = []
  for (const range of sorted) {
    const previous = merged[merged.length - 1]
    if (!previous || range[0] > previous[1] + 1) {
      merged.push(range)
      continue
    }
    previous[1] = Math.max(previous[1], range[1])
  }

  return merged
}

export function getExperienceTenure(experience: ExperienceItem[] | undefined | null) {
  if (!experience?.length) return null

  const ranges = experience
    .map(item => {
      const start = monthNumber(item.startDate)
      const end = monthNumber(item.endDate, true)
      if (start === null || end === null) return null
      return [start, end] as [number, number]
    })
    .filter((range): range is [number, number] => Boolean(range))

  if (ranges.length === 0) return null

  const months = mergeMonthRanges(ranges).reduce((total, [start, end]) => total + end - start + 1, 0)
  const years = months / 12
  const roundedYears = Math.max(1, Math.floor(years))

  return {
    months,
    years,
    isExperienced: years > 2,
    label: `${roundedYears}`,
  }
}

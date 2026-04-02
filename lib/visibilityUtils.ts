import type { ResumeData, BuilderVisibility, ExperienceItem } from '@/types'

/**
 * Helper to filter bullets within an ExperienceItem based on its internal bulletVisibility array.
 */
function filterBullets(item: ExperienceItem): ExperienceItem {
  const bulletVis = item.bulletVisibility ?? []
  const bullets = Array.isArray(item.bullets) ? item.bullets : []
  return {
    ...item,
    bullets: bullets.filter((_, bi) => bulletVis[bi] !== false),
    bulletVisibility: undefined,
    summary: undefined,
  }
}

/**
 * Returns a copy of resumeData filtered by visibility state.
 * Templates receive this filtered data — they never know visibility exists.
 */
export function getVisibleResumeData(
  data: ResumeData,
  visibility: BuilderVisibility
): ResumeData {
  const v = visibility

  return {
    // Contact fields always included (contact section can be hidden but data stays)
    name: data.name,
    email: data.email,
    phone: data.phone,
    location: data.location,
    linkedin: data.linkedin,
    website: data.website,
    currentRole: data.currentRole,

    summary: v.sections['summary'] !== false ? data.summary : '',

    skills: v.sections['skills'] !== false ? data.skills : [],

    languages: v.sections['languages'] !== false ? data.languages : [],

    interests: v.sections['interests'] !== false ? data.interests : [],

    volunteer: v.sections['volunteer'] !== false
      ? data.volunteer
          .filter((_, i) => (v.items['volunteer'] || [])[i] !== false)
          .map(filterBullets)
      : [],

    awards: v.sections['awards'] !== false ? data.awards : [],

    publications: v.sections['publications'] !== false ? data.publications : [],

    references: v.sections['references'] !== false ? data.references : [],

    experience: v.sections['experience'] !== false
      ? data.experience
          .filter((_, i) => (v.items['experience'] || [])[i] !== false)
          .map(filterBullets)
      : [],

    education: v.sections['education'] !== false
      ? data.education.filter((_, i) => (v.items['education'] || [])[i] !== false)
      : [],

    projects: v.sections['projects'] !== false
      ? data.projects.filter((_, i) => (v.items['projects'] || [])[i] !== false)
      : [],

    certifications: v.sections['certifications'] !== false
      ? data.certifications.filter((_, i) => (v.items['certifications'] || [])[i] !== false)
      : [],

    customSections: data.customSections?.filter(c => v.sections[c.id] !== false).map(c => {
      if (c.type === 'complex' && c.items) {
        const itemVis = v.items[c.id] || []
        return {
          ...c,
          items: c.items
            .filter((_, i) => itemVis[i] !== false)
            .map(filterBullets)
        }
      }
      return c
    })
  }
}

/**
 * Returns visible section ids in their user-defined order.
 * Pass the result as sectionOrder prop to template components.
 */
export function getOrderedSections(visibility: BuilderVisibility): string[] {
  return (visibility.sectionOrder || []).filter(
    id => visibility.sections[id] !== false
  )
}

export function getOrderedSidebarSections(visibility: BuilderVisibility): string[] {
  return (visibility.sidebarSectionOrder || []).filter(
    id => visibility.sections[id] !== false
  )
}

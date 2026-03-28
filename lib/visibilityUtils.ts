import type { ResumeData, BuilderVisibility } from '@/types'

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

    summary: v.sections.summary !== false ? data.summary : '',

    skills: v.sections.skills !== false ? data.skills : [],

    languages: v.sections.languages !== false ? data.languages : [],

    interests: v.sections.interests !== false ? data.interests : [],

    volunteer: v.sections.volunteer !== false ? data.volunteer : [],

    awards: v.sections.awards !== false ? data.awards : [],

    publications: v.sections.publications !== false ? data.publications : [],

    references: v.sections.references !== false ? data.references : [],

    experience: v.sections.experience !== false
      ? data.experience
          .filter((_, i) => v.items.experience[i] !== false)
          .map(exp => {
            const bulletVis = exp.bulletVisibility ?? []
            return {
              ...exp,
              bullets: exp.bullets.filter((_, bi) => bulletVis[bi] !== false),
              bulletVisibility: undefined,
              summary: undefined,
            }
          })
      : [],

    education: v.sections.education !== false
      ? data.education.filter((_, i) => v.items.education[i] !== false)
      : [],

    projects: v.sections.projects !== false
      ? data.projects.filter((_, i) => v.items.projects[i] !== false)
      : [],

    certifications: v.sections.certifications !== false
      ? data.certifications.filter((_, i) => v.items.certifications[i] !== false)
      : [],
  }
}

/**
 * Returns visible section ids in their user-defined order.
 * Pass the result as sectionOrder prop to template components.
 */
export function getOrderedSections(visibility: BuilderVisibility): string[] {
  return visibility.sectionOrder.filter(
    id => visibility.sections[id] !== false
  )
}

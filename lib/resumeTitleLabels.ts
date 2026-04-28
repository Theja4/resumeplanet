interface ResumeTitleLabelItem {
  id: string
  title?: string | null
}

export function normalizeResumeDisplayTitle(title: string | null | undefined) {
  return title?.trim() || 'Untitled Resume'
}

export function buildResumeTitleLabelMap<T extends ResumeTitleLabelItem>(resumes: T[]) {
  const titleCounts = new Map<string, number>()
  const titleIndexes = new Map<string, number>()
  const labels = new Map<string, string>()

  for (const resume of resumes) {
    const key = normalizeResumeDisplayTitle(resume.title).toLowerCase()
    titleCounts.set(key, (titleCounts.get(key) ?? 0) + 1)
  }

  for (const resume of resumes) {
    const baseTitle = normalizeResumeDisplayTitle(resume.title)
    const key = baseTitle.toLowerCase()

    if ((titleCounts.get(key) ?? 0) <= 1) {
      labels.set(resume.id, baseTitle)
      continue
    }

    const index = (titleIndexes.get(key) ?? 0) + 1
    titleIndexes.set(key, index)
    labels.set(resume.id, `${baseTitle} ${index}`)
  }

  return labels
}

export function getResumeTitleLabel<T extends ResumeTitleLabelItem>(
  resume: T,
  labels: Map<string, string>,
) {
  return labels.get(resume.id) ?? normalizeResumeDisplayTitle(resume.title)
}

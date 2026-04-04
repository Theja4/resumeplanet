import type { ConfiguredJobSource, NormalizedJob } from '@/lib/jobs/types'
import {
  humanizeSourceKey,
  normalizeTimestamp,
  stripHtml,
} from '@/lib/jobs/shared'

interface LeverPosting {
  id: string
  text: string
  categories?: {
    location?: string | null
    commitment?: string | null
    team?: string | null
    department?: string | null
    allLocations?: string[] | null
  } | null
  descriptionPlain?: string | null
  additionalPlain?: string | null
  hostedUrl?: string | null
  applyUrl?: string | null
  workplaceType?: 'unspecified' | 'on-site' | 'remote' | 'hybrid' | null
  salaryRange?: {
    currency?: string | null
    interval?: string | null
    min?: number | null
    max?: number | null
  } | null
  salaryDescriptionPlain?: string | null
  country?: string | null
  createdAt?: string | null
}

function mapWorkplaceType(value: LeverPosting['workplaceType']) {
  switch (value) {
    case 'remote':
      return 'remote' as const
    case 'hybrid':
      return 'hybrid' as const
    case 'on-site':
      return 'on_site' as const
    default:
      return 'unknown' as const
  }
}

function formatSalary(posting: LeverPosting) {
  if (posting.salaryDescriptionPlain?.trim()) {
    return posting.salaryDescriptionPlain.trim()
  }

  const range = posting.salaryRange

  if (!range || range.min == null || range.max == null) {
    return null
  }

  const currency = range.currency ?? 'USD'
  const interval = range.interval ? ` / ${range.interval}` : ''

  return `${currency} ${range.min.toLocaleString()} - ${range.max.toLocaleString()}${interval}`
}

export async function fetchLeverJobs(source: ConfiguredJobSource): Promise<NormalizedJob[]> {
  const response = await fetch(
    `https://api.lever.co/v0/postings/${encodeURIComponent(source.sourceKey)}?mode=json`,
    {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Rezoomed Jobs Sync/1.0',
      },
      cache: 'no-store',
    }
  )

  if (!response.ok) {
    throw new Error(`Lever sync failed for ${source.sourceKey}: ${response.status}`)
  }

  const postings = (await response.json()) as LeverPosting[]
  const companyName = humanizeSourceKey(source.sourceKey)

  return postings
    .map(posting => ({
      provider: source.provider,
      sourceKey: source.sourceKey,
      externalId: posting.id,
      title: posting.text?.trim() || 'Untitled role',
      companyName,
      locationText: posting.categories?.location?.trim() || 'Location flexible',
      remoteType: mapWorkplaceType(posting.workplaceType),
      employmentType: posting.categories?.commitment?.trim() || null,
      salaryText: formatSalary(posting),
      descriptionText: stripHtml(
        [posting.descriptionPlain, posting.additionalPlain].filter(Boolean).join('\n\n')
      ),
      applyUrl: posting.applyUrl || posting.hostedUrl || '',
      sourceUrl: posting.hostedUrl || posting.applyUrl || null,
      companyLogoUrl: null,
      category: posting.categories?.team?.trim() || posting.categories?.department?.trim() || null,
      tags: [
        posting.categories?.team,
        posting.categories?.department,
        posting.categories?.commitment,
        ...(posting.categories?.allLocations ?? []),
      ].filter((value): value is string => Boolean(value && value.trim())),
      postedAt: normalizeTimestamp(posting.createdAt),
      metadata: {
        country: posting.country ?? null,
        workplaceType: posting.workplaceType ?? null,
        categories: posting.categories ?? null,
        salaryRange: posting.salaryRange ?? null,
      },
    }))
    .filter(posting => Boolean(posting.applyUrl))
}

import { FREE_PLAN, PRO_PLAN } from '@/lib/pricing'
import type { PendingJobApplyPayload } from '@/lib/jobs/types'
import type { JobRemoteType, JobSourceProvider, Profile } from '@/types'

export const PENDING_JOB_APPLY_COOKIE = 'rezoomed_pending_job_apply'

const ENTITY_MAP: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&nbsp;': ' ',
}

export function decodeHtmlEntities(value: string) {
  return value.replace(/&(amp|lt|gt|quot|#39|nbsp);/g, match => ENTITY_MAP[match] ?? match)
}

export function stripHtml(value: string | null | undefined) {
  if (!value) return ''

  return decodeHtmlEntities(value)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<li>/gi, '- ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

export function slugifyValue(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function humanizeSourceKey(value: string) {
  return value
    .split(/[-_]/g)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function buildJobSlug({
  title,
  companyName,
  provider,
  sourceKey,
  externalId,
}: {
  title: string
  companyName: string
  provider: JobSourceProvider
  sourceKey: string
  externalId: string
}) {
  const base = slugifyValue(`${companyName} ${title}`) || 'job'
  const stable = slugifyValue(`${provider}-${sourceKey}-${externalId}`) || 'source'
  return `${base}-${stable}`.slice(0, 140)
}

export function inferRemoteType(value: string | null | undefined): JobRemoteType {
  const text = (value ?? '').toLowerCase()

  if (!text) return 'unknown'
  if (text.includes('hybrid')) return 'hybrid'
  if (text.includes('remote') || text.includes('worldwide')) return 'remote'
  if (text.includes('on-site') || text.includes('onsite') || text.includes('on site')) return 'on_site'

  return 'unknown'
}

export function normalizeTimestamp(value: string | null | undefined) {
  if (!value) return null

  const candidate = value.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(value) ? value : `${value}Z`
  const date = new Date(candidate)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date.toISOString()
}

export function formatJobDate(value: string | null | undefined) {
  if (!value) return 'Recently added'

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

function normalizeDateCandidate(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return null

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return `${trimmed}T00:00:00.000Z`
  }

  return trimmed
}

export function formatTrackerDate(value: string | null | undefined) {
  if (!value) return ''

  const candidate = normalizeDateCandidate(value)
  if (!candidate) return ''

  const date = new Date(candidate)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const day = `${date.getUTCDate()}`.padStart(2, '0')
  const month = `${date.getUTCMonth() + 1}`.padStart(2, '0')
  const year = `${date.getUTCFullYear()}`.slice(-2)

  return `${day}/${month}/${year}`
}

export function getTodayTrackerDate() {
  return formatTrackerDate(new Date().toISOString())
}

export function parseTrackerDateInput(value: string | null | undefined) {
  const trimmed = (value ?? '').trim()

  if (!trimmed) {
    return null
  }

  const match = /^(\d{2})\/(\d{2})\/(\d{2})$/.exec(trimmed)

  if (!match) {
    return null
  }

  const day = Number(match[1])
  const month = Number(match[2])
  const shortYear = Number(match[3])
  const year = shortYear >= 70 ? 1900 + shortYear : 2000 + shortYear
  const date = new Date(Date.UTC(year, month - 1, day))

  if (
    Number.isNaN(date.getTime()) ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null
  }

  const isoMonth = `${month}`.padStart(2, '0')
  const isoDay = `${day}`.padStart(2, '0')

  return `${year}-${isoMonth}-${isoDay}`
}

export function trackerDateToTimestamp(value: string | null | undefined) {
  const isoDate = parseTrackerDateInput(value)

  return isoDate ? `${isoDate}T00:00:00.000Z` : null
}

export function trackerDateSortValue(value: string | null | undefined) {
  const candidate = normalizeDateCandidate(value ?? '')

  if (!candidate) return Number.NEGATIVE_INFINITY

  const parsed = new Date(candidate).getTime()

  return Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed
}

export function salarySortValue(value: string | null | undefined) {
  if (!value) return Number.NEGATIVE_INFINITY

  const matches = value.match(/[\d,.]+/g)

  if (!matches?.length) {
    return Number.NEGATIVE_INFINITY
  }

  const numbers = matches
    .map(part => Number(part.replace(/,/g, '')))
    .filter(number => Number.isFinite(number))

  if (!numbers.length) {
    return Number.NEGATIVE_INFINITY
  }

  return numbers.reduce((sum, current) => sum + current, 0) / numbers.length
}

export function formatSalaryInput(value: string | null | undefined) {
  const digits = (value ?? '').replace(/\D/g, '').slice(0, 12)

  if (!digits) {
    return ''
  }

  return `$${digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
}

export function isValidExternalUrl(value: string | null | undefined) {
  const trimmed = (value ?? '').trim()

  if (!trimmed) {
    return false
  }

  try {
    const parsed = new URL(trimmed)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export function normalizeOptionalExternalUrl(value: string | null | undefined) {
  const trimmed = (value ?? '').trim()

  if (!trimmed) {
    return ''
  }

  try {
    const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
    const parsed = new URL(candidate)

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return ''
    }

    return parsed.toString()
  } catch {
    return ''
  }
}

export function formatJobSource(provider: JobSourceProvider) {
  switch (provider) {
    case 'greenhouse':
      return 'Greenhouse'
    case 'lever':
      return 'Lever'
    case 'remotive':
      return 'Remotive'
    case 'manual':
      return 'Manual'
    default:
      return provider
  }
}

export function getTrackerLimit(profile: Profile | null) {
  return profile?.plan === 'pro' ? PRO_PLAN.limits.maxTrackedJobs : FREE_PLAN.limits.maxTrackedJobs
}

export function getTrackerLimitLabel(profile: Profile | null) {
  return profile?.plan === 'pro' ? 'Unlimited' : String(FREE_PLAN.limits.maxTrackedJobs)
}

export function serializePendingApplyCookie(payload: PendingJobApplyPayload) {
  return encodeURIComponent(JSON.stringify(payload))
}

export function parsePendingApplyCookie(value: string | null | undefined): PendingJobApplyPayload | null {
  if (!value) return null

  try {
    return JSON.parse(decodeURIComponent(value)) as PendingJobApplyPayload
  } catch {
    return null
  }
}

export function readCookie(name: string) {
  if (typeof document === 'undefined') return null

  const parts = document.cookie.split(';').map(part => part.trim())
  const match = parts.find(part => part.startsWith(`${name}=`))

  return match ? match.slice(name.length + 1) : null
}

export function clearCookie(name: string) {
  if (typeof document === 'undefined') return

  document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`
}

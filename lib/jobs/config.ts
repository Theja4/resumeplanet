import type { ConfiguredJobSource } from '@/lib/jobs/types'

function parseCsv(value: string | undefined) {
  return (value ?? '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
}

export function getConfiguredJobSources(): ConfiguredJobSource[] {
  const sources: ConfiguredJobSource[] = []

  for (const boardToken of parseCsv(process.env.GREENHOUSE_BOARD_TOKENS)) {
    sources.push({
      provider: 'greenhouse',
      sourceKey: boardToken,
      label: `Greenhouse · ${boardToken}`,
    })
  }

  for (const siteName of parseCsv(process.env.LEVER_SITE_NAMES)) {
    sources.push({
      provider: 'lever',
      sourceKey: siteName,
      label: `Lever · ${siteName}`,
    })
  }

  if ((process.env.REMOTIVE_ENABLED ?? 'true').toLowerCase() !== 'false') {
    sources.push({
      provider: 'remotive',
      sourceKey: 'public',
      label: 'Remotive Public API',
    })
  }

  return sources
}

export function getJobsSyncSecret() {
  return process.env.JOBS_SYNC_SECRET?.trim() || null
}

export function getRemotiveFetchLimit() {
  const configured = Number.parseInt(process.env.REMOTIVE_JOB_LIMIT ?? '120', 10)

  if (!Number.isFinite(configured) || configured <= 0) {
    return 120
  }

  return Math.min(configured, 500)
}

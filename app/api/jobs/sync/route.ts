import { NextRequest, NextResponse } from 'next/server'
import { JOB_BOARD_ENABLED } from '@/lib/featureFlags'
import { getJobsSyncSecret } from '@/lib/jobs/config'
import { syncConfiguredJobSources } from '@/lib/jobs/sync'

function getConfiguredSecrets() {
  return [getJobsSyncSecret(), process.env.CRON_SECRET?.trim() || null].filter(
    (value): value is string => Boolean(value)
  )
}

function isAuthorized(request: NextRequest) {
  const configuredSecrets = getConfiguredSecrets()

  if (configuredSecrets.length === 0) {
    return false
  }

  const authHeader = request.headers.get('authorization')
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null
  const headerSecret = request.headers.get('x-jobs-sync-secret')?.trim() ?? null

  return (
    (bearerToken ? configuredSecrets.includes(bearerToken) : false) ||
    (headerSecret ? configuredSecrets.includes(headerSecret) : false)
  )
}

async function handleSync(request: NextRequest) {
  if (!JOB_BOARD_ENABLED) {
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
  }

  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const result = await syncConfiguredJobSources()

  return NextResponse.json({
    success: true,
    ...result,
  })
}

export async function POST(request: NextRequest) {
  return handleSync(request)
}

export async function GET(request: NextRequest) {
  return handleSync(request)
}

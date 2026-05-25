import { NextResponse } from 'next/server'
import { readBearerClaims } from '@/lib/extensionAuth'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export const dynamic = 'force-dynamic'

interface ScanBody {
  profileUrl?: unknown
  score?: unknown
  sections?: unknown
}

function isValidUrl(value: unknown): value is string {
  if (typeof value !== 'string' || value.length === 0 || value.length > 2048) return false
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && /linkedin\.com$/i.test(url.hostname.replace(/^www\./, ''))
  } catch {
    return false
  }
}

// Persists a scan run for the user's dashboard history. Inserts only —
// updates never; the source of truth for "your latest scan" is the most
// recent row.
export async function POST(request: Request) {
  const claims = await readBearerClaims(request)
  if (!claims) {
    return NextResponse.json({ error: 'invalid_token' }, { status: 401 })
  }

  let body: ScanBody
  try {
    body = (await request.json()) as ScanBody
  } catch {
    return NextResponse.json({ error: 'bad_json' }, { status: 400 })
  }

  if (!isValidUrl(body.profileUrl)) {
    return NextResponse.json({ error: 'invalid_profile_url' }, { status: 400 })
  }
  const score = Number(body.score)
  if (!Number.isFinite(score) || score < 0 || score > 100) {
    return NextResponse.json({ error: 'invalid_score' }, { status: 400 })
  }

  const supabase = createServiceRoleClient()
  const { error } = await supabase.from('linkedin_scans').insert({
    user_id: claims.sub,
    profile_url: body.profileUrl,
    score: Math.round(score),
    sections: body.sections ?? [],
  })

  if (error) {
    return NextResponse.json({ error: 'insert_failed' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}

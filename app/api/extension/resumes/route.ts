import { NextResponse } from 'next/server'
import { readBearerClaims } from '@/lib/extensionAuth'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export const dynamic = 'force-dynamic'

// Lightweight resume list for the extension's "compare against:" picker.
// We never ship full resume bodies — only what's needed to identify the
// resume in a dropdown.
export async function GET(request: Request) {
  const claims = await readBearerClaims(request)
  if (!claims) {
    return NextResponse.json({ error: 'invalid_token' }, { status: 401 })
  }

  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('resumes')
    .select('id, title, updated_at')
    .eq('user_id', claims.sub)
    .order('updated_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'resume_query_failed' }, { status: 500 })
  }

  const rows = data ?? []
  const result = rows.map((row, idx) => ({
    id: row.id as string,
    title: (row.title as string) || 'Untitled resume',
    updatedAt: row.updated_at as string,
    isLatest: idx === 0,
  }))

  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'private, no-store' },
  })
}

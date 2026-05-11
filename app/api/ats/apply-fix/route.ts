import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { APIResponse } from '@/types'

type ApplyFixResponse = {
  newText: string
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json<APIResponse<never>>(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  let body: { afterText?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json<APIResponse<never>>(
      { success: false, error: 'Invalid JSON' },
      { status: 400 }
    )
  }

  const { afterText } = body

  if (!afterText) {
    return NextResponse.json<APIResponse<never>>(
      { success: false, error: 'Missing afterText' },
      { status: 400 }
    )
  }

  return NextResponse.json<APIResponse<ApplyFixResponse>>(
    { success: true, data: { newText: afterText } },
    { status: 200 }
  )
}

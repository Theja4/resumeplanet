import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionToken,
  getAdminSessionCookieOptions,
} from '@/lib/admin-auth'

interface AdminCredentialRecord {
  id: string
  username: string
}

export async function POST(request: NextRequest) {
  let body: { username?: string; password?: string }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body.' }, { status: 400 })
  }

  const username = body.username?.trim().toLowerCase() ?? ''
  const password = body.password ?? ''

  if (!username || !password) {
    return NextResponse.json(
      { success: false, error: 'Username and password are required.' },
      { status: 400 }
    )
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('verify_admin_credentials', {
    input_username: username,
    input_password: password,
  })

  if (error) {
    console.error('Admin login RPC failed:', error)
    return NextResponse.json(
      { success: false, error: 'Could not verify admin credentials.' },
      { status: 500 }
    )
  }

  const admin = data as AdminCredentialRecord | null

  if (!admin?.id || !admin.username) {
    return NextResponse.json(
      { success: false, error: 'Invalid admin credentials.' },
      { status: 401 }
    )
  }

  const token = await createAdminSessionToken({
    adminUserId: admin.id,
    username: admin.username,
  })

  const response = NextResponse.json({
    success: true,
    data: { username: admin.username },
  })

  response.cookies.set(ADMIN_SESSION_COOKIE, token, getAdminSessionCookieOptions())

  return response
}

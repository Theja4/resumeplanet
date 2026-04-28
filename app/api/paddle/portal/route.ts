import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { paddle } from '@/lib/paddle'

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('paddle_customer_id')
    .eq('id', user.id)
    .single()

  if (!profile?.paddle_customer_id) {
    return NextResponse.json(
      { success: false, error: 'No billing account found' },
      { status: 400 }
    )
  }

  const portalSession = await paddle.customerPortalSessions.create(
    profile.paddle_customer_id,
    []
  )

  return NextResponse.json({
    success: true,
    data: { portalUrl: portalSession.urls.general.overview },
  })
}

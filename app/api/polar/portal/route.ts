import { NextResponse } from 'next/server'

import { createPolarCustomerPortalSession } from '@/lib/polar'
import { getSiteUrl } from '@/lib/site'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const session = await createPolarCustomerPortalSession({
      externalCustomerId: user.id,
      returnUrl: `${getSiteUrl()}/dashboard/pricing`,
    })

    if (!session.customer_portal_url) {
      return NextResponse.json(
        { success: false, error: 'Polar did not return a portal URL' },
        { status: 502 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { portalUrl: session.customer_portal_url },
    })
  } catch (error) {
    console.error('Polar portal session failed:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to open Polar customer portal' },
      { status: 502 }
    )
  }
}

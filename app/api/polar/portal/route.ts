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
    const { data: profile } = await supabase
      .from('profiles')
      .select('polar_customer_id')
      .eq('id', user.id)
      .single()

    const returnUrl = `${getSiteUrl()}/dashboard/pricing`
    const session = await createPolarCustomerPortalSession({
      customerId: profile?.polar_customer_id,
      externalCustomerId: user.id,
      returnUrl,
    }).catch(async (error) => {
      if (!profile?.polar_customer_id) throw error

      return createPolarCustomerPortalSession({
        externalCustomerId: user.id,
        returnUrl,
      })
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
      { success: false, error: 'Unable to open the billing portal. You can still cancel from the cancellation dialog.' },
      { status: 502 }
    )
  }
}

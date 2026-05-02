import { NextResponse } from 'next/server'

import { getPolarIntervalFromProductId } from '@/lib/polar'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { createClient } from '@/lib/supabase/server'

type PolarSubscription = {
  id: string
  status: string
  customer_id?: string | null
  product_id?: string | null
  recurring_interval?: string | null
  customer?: {
    external_id?: string | null
  } | null
}

function getPolarBaseUrl() {
  return process.env.POLAR_ENVIRONMENT === 'sandbox'
    ? 'https://sandbox-api.polar.sh/v1'
    : 'https://api.polar.sh/v1'
}

async function listPolarSubscriptionsForExternalCustomer(userId: string) {
  const token = process.env.POLAR_ACCESS_TOKEN
  if (!token) throw new Error('POLAR_ACCESS_TOKEN is not set')

  const url = new URL(`${getPolarBaseUrl()}/subscriptions`)
  url.searchParams.set('external_customer_id', userId)

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    cache: 'no-store',
  })

  const body = await response.json().catch(() => null) as
    | { items?: PolarSubscription[]; result?: { items?: PolarSubscription[] } }
    | PolarSubscription[]
    | null

  if (!response.ok || !body) {
    throw new Error(`Polar subscription sync failed with ${response.status}`)
  }

  if (Array.isArray(body)) return body
  return body.items ?? body.result?.items ?? []
}

function resolveInterval(subscription: PolarSubscription) {
  if (subscription.recurring_interval === 'month') return 'monthly'
  if (subscription.recurring_interval === 'year') return 'annual'
  return getPolarIntervalFromProductId(subscription.product_id)
}

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const subscriptions = await listPolarSubscriptionsForExternalCustomer(user.id)
    const activeSubscription = subscriptions.find(subscription =>
      ['active', 'trialing'].includes(subscription.status)
    )

    if (!activeSubscription) {
      return NextResponse.json({ isPro: false })
    }

    const serviceSupabase = createServiceRoleClient()
    const { error } = await serviceSupabase
      .from('profiles')
      .update({
        plan: 'pro',
        polar_customer_id: activeSubscription.customer_id ?? null,
        polar_subscription_id: activeSubscription.id,
        subscription_status: activeSubscription.status,
        subscription_interval: resolveInterval(activeSubscription),
      })
      .eq('id', user.id)

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json({ isPro: true })
  } catch (error) {
    console.error('Polar subscription sync failed:', error)
    return NextResponse.json({ isPro: false }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { paddle } from '@/lib/paddle'
import { PRO_PLAN } from '@/lib/pricing'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

function resolveInterval(priceId: string | undefined | null): 'monthly' | 'annual' | null {
  if (!priceId) return null
  const option = PRO_PLAN.getPriceByPaddleId(priceId)
  if (option?.interval === 'month') return 'monthly'
  if (option?.interval === 'year') return 'annual'
  return null
}

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, paddle_customer_id')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ isPro: false })

  // Already Pro — nothing to sync
  if (profile.plan === 'pro') return NextResponse.json({ isPro: true })

  if (!profile.paddle_customer_id) return NextResponse.json({ isPro: false })

  // Check Paddle API for active subscriptions (SDK returns async iterable)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let activeSubscription: any = null
  try {
    const collection = paddle.subscriptions.list({
      customerId: [profile.paddle_customer_id],
      status: ['active', 'trialing'],
    })
    for await (const sub of collection) {
      activeSubscription = sub
      break // only need the first active subscription
    }
  } catch (err) {
    console.error('sync-subscription: Paddle API error', err)
    return NextResponse.json({ isPro: false })
  }

  if (!activeSubscription) return NextResponse.json({ isPro: false })

  const priceId = activeSubscription.items?.[0]?.price?.id ?? null
  const subscriptionInterval = resolveInterval(priceId)

  // Update profile with service client (same pattern as webhook handler)
  const serviceSupabase = createServiceRoleClient()

  const { error: updateError } = await serviceSupabase
    .from('profiles')
    .update({
      plan: 'pro',
      paddle_subscription_id: activeSubscription.id,
      subscription_status: activeSubscription.status,
      subscription_interval: subscriptionInterval,
    })
    .eq('id', user.id)

  if (updateError) {
    console.error('sync-subscription: profile update error', updateError)
    return NextResponse.json({ isPro: false }, { status: 500 })
  }

  console.log(`sync-subscription: user ${user.id} synced to Pro, interval: ${subscriptionInterval}`)
  return NextResponse.json({ isPro: true })
}

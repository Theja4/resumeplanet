import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  stripe,
  PRO_PRICE_ID,
  PROFESSIONAL_ORDER_AMOUNT,
  getOrCreateStripeCustomer,
} from '@/lib/stripe'

function ok(data: Record<string, unknown>) {
  return NextResponse.json({ success: true, data })
}
function err(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('Unauthorized', 401)

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  if (!profile) return err('Profile not found', 500)

  const body = await request.json()
  const { mode } = body
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  // ── Order checkout ────────────────────────────────────────────────────────
  if (mode === 'order') {
    const { resumeId, jobTitle, jobDescription, additionalNotes } = body

    if (!resumeId) return err('Resume required')
    if (!jobTitle) return err('Job title required')

    const { data: resume } = await supabase
      .from('resumes')
      .select('id, title')
      .eq('id', resumeId)
      .eq('user_id', user.id)
      .single()
    if (!resume) return err('Resume not found')

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        resume_id: resumeId,
        amount: PROFESSIONAL_ORDER_AMOUNT,
        status: 'pending',
        job_title: jobTitle,
        job_description: jobDescription ?? null,
        additional_notes: additionalNotes ?? null,
      })
      .select()
      .single()

    if (orderError || !order) {
      console.error('Order insert error:', orderError)
      return err('Failed to create order', 500)
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Professional Resume Writing',
            description: `Expert resume writer · 48-hour delivery · Role: ${jobTitle}`,
          },
          unit_amount: PROFESSIONAL_ORDER_AMOUNT,
        },
        quantity: 1,
      }],
      customer_email: profile.email,
      success_url: `${appUrl}/dashboard/orders/${order.id}?success=true`,
      cancel_url: `${appUrl}/dashboard/orders/new`,
      metadata: {
        orderId: order.id,
        userId: user.id,
        mode: 'order',
      },
      expires_at: Math.floor(Date.now() / 1000) + 1800,
    })

    await supabase
      .from('orders')
      .update({ stripe_session_id: session.id })
      .eq('id', order.id)

    return ok({ checkoutUrl: session.url! })
  }

  // ── Subscription checkout ─────────────────────────────────────────────────
  if (mode === 'subscription') {
    if (!PRO_PRICE_ID) return err('Pro plan not configured', 500)

    if (profile.plan === 'pro' && profile.subscription_status === 'active') {
      return err('Already subscribed to Pro')
    }

    const customerId = await getOrCreateStripeCustomer(
      user.id,
      profile.email,
      profile.full_name,
      supabase
    )

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: PRO_PRICE_ID, quantity: 1 }],
      success_url: `${appUrl}/dashboard/billing?upgraded=true`,
      cancel_url: `${appUrl}/dashboard/billing`,
      metadata: { userId: user.id, mode: 'subscription' },
      subscription_data: { metadata: { userId: user.id } },
      allow_promotion_codes: true,
    })

    return ok({ checkoutUrl: session.url! })
  }

  return err('Invalid mode')
}

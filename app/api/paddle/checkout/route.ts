import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  paddle,
  PADDLE_PRICES,
  isValidPaddlePriceId,
  getOrCreatePaddleCustomer,
} from '@/lib/paddle'
import { PROFESSIONAL_ORDER, PRO_PLAN, getActivePromotion } from '@/lib/pricing'

function ok(data: Record<string, unknown>) {
  return NextResponse.json({ success: true, data })
}
function err(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return err('Unauthorized', 401)

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  if (!profile) return err('Profile not found', 500)

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return err('Invalid JSON body')
  }

  const { mode } = body

  // ── Order checkout ──────────────────────────────────────────────────────────
  if (mode === 'order') {
    const resumeId = body.resumeId as string | undefined
    const jobTitle = body.jobTitle as string | undefined
    const jobDescription = body.jobDescription as string | undefined
    const additionalNotes = body.additionalNotes as string | undefined
    const industry = body.industry as string | undefined
    const yearsExp = body.yearsExp as string | undefined

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
        amount: PROFESSIONAL_ORDER.amountCents,
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

    // Return data for client to open Paddle overlay
    return ok({
      orderId: order.id,
      mode: 'order',
      priceId: PADDLE_PRICES.professionalOrder,
      customerEmail: profile.email,
      customData: {
        orderId: order.id,
        userId: user.id,
        mode: 'order',
      },
    })
  }

  // ── Subscription checkout ───────────────────────────────────────────────────
  if (mode === 'subscription') {
    if (profile.plan === 'pro' && profile.subscription_status === 'active') {
      return err('Already subscribed to Pro')
    }

    const priceId = body.priceId as string | undefined
    const couponId = body.couponId as string | undefined

    // Validate + resolve price
    const validPriceId =
      priceId && isValidPaddlePriceId(priceId)
        ? priceId
        : PADDLE_PRICES.proMonthly

    if (!validPriceId) {
      return err('Pro plan not configured — missing Paddle price ID', 500)
    }

    const customerId = await getOrCreatePaddleCustomer(
      user.id,
      profile.email,
      profile.full_name,
      supabase
    )

    // Resolve discount: explicit > auto-apply promo
    const activePromo = getActivePromotion()
    const effectiveDiscountId: string | undefined =
      couponId ||
      (activePromo?.isAutoApply ? activePromo.paddleDiscountId : undefined) ||
      undefined

    return ok({
      mode: 'subscription',
      priceId: validPriceId,
      customerId,
      customerEmail: profile.email,
      discountId: effectiveDiscountId ?? null,
      customData: {
        userId: user.id,
        mode: 'subscription',
      },
    })
  }

  return err('Invalid mode')
}

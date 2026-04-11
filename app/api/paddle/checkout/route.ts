import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  resolveAffiliateSourceCodeFromProfile,
} from '@/lib/affiliate'
import {
  findAffiliateByDiscountCode,
  readAffiliateReferralCodeFromCookies,
} from '@/lib/affiliate-server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import {
  PADDLE_PRICES,
  getPaddleConfigurationError,
  isValidPaddlePriceId,
  getOrCreatePaddleCustomer,
} from '@/lib/paddle'
import {
  HUMAN_WRITTEN_ORDER,
  PRO_PLAN,
  getProPlanForCountry,
  getActivePromotion,
  getActivePromotionByCode,
  getActivePromotionById,
  type PromoConfig,
} from '@/lib/pricing'
import { detectRequestCountry } from '@/lib/cookie-consent'

function ok(data: Record<string, unknown>) {
  return NextResponse.json({ success: true, data })
}
function err(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

export async function POST(request: NextRequest) {
  const paddleConfigurationError = getPaddleConfigurationError()
  if (paddleConfigurationError) {
    return err(paddleConfigurationError, 500)
  }

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
  const distinctId = typeof body.distinctId === 'string' ? body.distinctId : undefined
  const blogReferrerSlug = typeof body.blogReferrerSlug === 'string' ? body.blogReferrerSlug : undefined
  const blogReferrerCta = typeof body.blogReferrerCta === 'string' ? body.blogReferrerCta : undefined

  // ── Order checkout ──────────────────────────────────────────────────────────
  if (mode === 'order') {
    const resumeId = body.resumeId as string | undefined
    const uploadedResumeText = body.uploadedResumeText as string | undefined
    const jobTitle = body.jobTitle as string | undefined
    const jobDescription = body.jobDescription as string | undefined
    const additionalNotes = body.additionalNotes as string | undefined
    
    if (!resumeId && !uploadedResumeText) return err('Resume or uploaded text required')
    if (!jobTitle) return err('Job title required')

    let finalResumeText: string | null = uploadedResumeText || null

    if (resumeId) {
      const { data: resume } = await supabase
        .from('resumes')
        .select('id, title, raw_text')
        .eq('id', resumeId)
        .eq('user_id', user.id)
        .single()
      if (!resume) return err('Resume not found')
      if (!finalResumeText) finalResumeText = resume.raw_text
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        resume_id: resumeId || null,
        uploaded_resume_text: finalResumeText,
        amount: HUMAN_WRITTEN_ORDER.amountCents,
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
      priceId: PADDLE_PRICES.humanWrittenOrder,
      customerEmail: profile.email,
      customData: {
        orderId: order.id,
        userId: user.id,
        mode: 'order',
        posthogDistinctId: distinctId,
        blogReferrerSlug,
        blogReferrerCta,
      },
    })
  }

  // ── Subscription checkout ───────────────────────────────────────────────────
  if (mode === 'subscription') {
    if (profile.plan === 'pro' && profile.subscription_status === 'active') {
      return err('Already subscribed to Pro')
    }

    const requestedPriceId = typeof body.priceId === 'string' ? body.priceId : undefined
    const promotionId = typeof body.promotionId === 'string' ? body.promotionId : undefined
    const requestedPromotionCode =
      typeof body.promotionCode === 'string' ? body.promotionCode : undefined

    const pricingCountryCode = detectRequestCountry(request.headers)
    const regionalPlan = getProPlanForCountry(pricingCountryCode)

    const selectedPriceOption =
      requestedPriceId
        ? (regionalPlan.getPriceById(requestedPriceId)
          ?? regionalPlan.getPriceByPaddleId(requestedPriceId)
          ?? PRO_PLAN.getPriceById(requestedPriceId)
          ?? PRO_PLAN.getPriceByPaddleId(requestedPriceId))
        : regionalPlan.defaultPrice

    if (!selectedPriceOption) {
      return err('Invalid Pro plan selection')
    }

    const validPriceId = selectedPriceOption.paddlePriceId

    if (!validPriceId || !isValidPaddlePriceId(validPriceId)) {
      return err('Pro plan not configured — missing Paddle price ID', 500)
    }

    const customerId = await getOrCreatePaddleCustomer(
      user.id,
      profile.email,
      profile.full_name,
      supabase
    )

    const activePromo = getActivePromotion()
    let selectedPromotion: PromoConfig | null = null
    let discountCode: string | null = null
    let affiliateDiscountCode: string | null = null
    const serviceSupabase = createServiceRoleClient()
    const cookieAffiliateCode = await readAffiliateReferralCodeFromCookies()
    const storedAffiliateCode = resolveAffiliateSourceCodeFromProfile(profile)

    if (requestedPromotionCode) {
      const affiliate = await findAffiliateByDiscountCode(serviceSupabase, requestedPromotionCode)

      if (affiliate) {
        discountCode = affiliate.discount_code
        affiliateDiscountCode = affiliate.discount_code
      } else {
        selectedPromotion = getActivePromotionByCode(requestedPromotionCode)
        if (!selectedPromotion || !selectedPromotion.paddleDiscountId) {
          return err('Invalid or expired promotion')
        }
      }
    } else {
      const fallbackAffiliateCodes = [cookieAffiliateCode, storedAffiliateCode].filter(
        (value): value is string => Boolean(value)
      )

      for (const fallbackCode of fallbackAffiliateCodes) {
        const affiliate = await findAffiliateByDiscountCode(serviceSupabase, fallbackCode)

        if (!affiliate) {
          continue
        }

        discountCode = affiliate.discount_code
        affiliateDiscountCode = affiliate.discount_code
        break
      }
    }

    if (!discountCode && promotionId) {
      selectedPromotion = getActivePromotionById(promotionId)
      if (!selectedPromotion || !selectedPromotion.paddleDiscountId) {
        return err('Invalid or expired promotion')
      }
    } else if (!discountCode && activePromo?.isAutoApply && activePromo.paddleDiscountId) {
      selectedPromotion = activePromo
    }

    if (
      selectedPromotion &&
      selectedPromotion.appliesTo !== 'all' &&
      selectedPromotion.appliesTo !== selectedPriceOption.id
    ) {
      return err('Promotion does not apply to the selected plan')
    }

    return ok({
      mode: 'subscription',
      priceId: validPriceId,
      customerId,
      customerEmail: profile.email,
      pricingCountryCode,
      pricingCurrency: selectedPriceOption.display.currency,
      discountId: discountCode ? null : (selectedPromotion?.paddleDiscountId ?? null),
      discountCode,
      customData: {
        userId: user.id,
        userEmail: profile.email,
        mode: 'subscription',
        affiliateDiscountCode,
        posthogDistinctId: distinctId,
        blogReferrerSlug,
        blogReferrerCta,
      },
    })
  }

  return err('Invalid mode')
}

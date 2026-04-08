'use client'

import { getPaddle } from '@/components/providers/PaddleProvider'
import {
  Analytics,
  clearCheckoutContext,
  readAnalyticsAttribution,
  readPostHogDistinctIdFromCookie,
  setCheckoutContext,
} from '@/lib/analytics'
import { PROFESSIONAL_ORDER, PRO_PLAN } from '@/lib/pricing'

export function usePaddleCheckout() {
  const openOrderCheckout = async (params: {
    resumeId: string
    jobTitle: string
    jobDescription?: string | null
    additionalNotes?: string | null
    industry: string
    yearsExp: string
    onSuccess?: (orderId: string) => void
    onError?: (error: string) => void
  }) => {
    try {
      const attribution = readAnalyticsAttribution()
      const distinctId = readPostHogDistinctIdFromCookie()

      const res = await fetch('/api/paddle/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'order',
          resumeId: params.resumeId,
          jobTitle: params.jobTitle,
          jobDescription: params.jobDescription,
          additionalNotes: params.additionalNotes,
          industry: params.industry,
          yearsExp: params.yearsExp,
          distinctId,
          blogReferrerSlug: attribution?.ref === 'blog' ? attribution.slug : undefined,
          blogReferrerCta: attribution?.ref === 'blog' ? attribution.cta : undefined,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'Checkout failed')

      const { orderId, priceId, customerEmail, customData } = json.data

      const paddle = getPaddle()
      if (!paddle) throw new Error('Paddle not initialized')

      Analytics.checkoutStarted({
        product: 'writing_service',
        price: PROFESSIONAL_ORDER.amountCents / 100,
      })
      setCheckoutContext({
        product: 'writing_service',
        price: PROFESSIONAL_ORDER.amountCents / 100,
        step: 'overlay_opened',
      })

      paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        customer: { email: customerEmail },
        customData,
        settings: {
          displayMode: 'overlay',
          theme: 'light',
          locale: 'en',
          successUrl: `${window.location.origin}/dashboard/orders/${orderId}?success=true`,
        },
      })

      params.onSuccess?.(orderId)
    } catch (err) {
      clearCheckoutContext()
      const message = err instanceof Error ? err.message : 'Checkout failed'
      params.onError?.(message)
    }
  }

  const openSubscriptionCheckout = async (params: {
    priceId?: string
    promotionId?: string
    promotionCode?: string
    onSuccess?: () => void
    onError?: (error: string) => void
  }) => {
    try {
      const attribution = readAnalyticsAttribution()
      const distinctId = readPostHogDistinctIdFromCookie()

      const res = await fetch('/api/paddle/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'subscription',
          priceId: params.priceId,
          promotionId: params.promotionId,
          promotionCode: params.promotionCode,
          distinctId,
          blogReferrerSlug: attribution?.ref === 'blog' ? attribution.slug : undefined,
          blogReferrerCta: attribution?.ref === 'blog' ? attribution.cta : undefined,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'Checkout failed')

      const { priceId, customerId, customerEmail, discountId, discountCode, customData } = json.data

      const paddle = getPaddle()
      if (!paddle) throw new Error('Paddle not initialized')

      const selectedPrice = PRO_PLAN.getPriceById(params.priceId ?? '') ?? PRO_PLAN.defaultPrice
      const checkoutPrice = selectedPrice.display.displayPrice

      Analytics.checkoutStarted({
        product: 'pro_subscription',
        price: checkoutPrice,
        discountCode: params.promotionCode,
      })
      setCheckoutContext({
        product: 'pro_subscription',
        price: checkoutPrice,
        discountCode: params.promotionCode,
        step: 'overlay_opened',
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const checkoutParams: any = {
        items: [{ priceId, quantity: 1 }],
        // Pass id if customer already exists in Paddle, email only for new customers
        customer: customerId ? { id: customerId } : { email: customerEmail },
        customData,
        settings: {
          displayMode: 'overlay',
          theme: 'light',
          locale: 'en',
          successUrl: `${window.location.origin}/dashboard/pricing?upgraded=true`,
        },
      }

      if (discountCode) {
        checkoutParams.discountCode = discountCode
      } else if (discountId) {
        checkoutParams.discountId = discountId
      }

      paddle.Checkout.open(checkoutParams)
      params.onSuccess?.()
    } catch (err) {
      clearCheckoutContext()
      const message = err instanceof Error ? err.message : 'Checkout failed'
      params.onError?.(message)
    }
  }

  return { openOrderCheckout, openSubscriptionCheckout }
}

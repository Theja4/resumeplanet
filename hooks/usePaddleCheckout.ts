'use client'

import { getPaddle } from '@/components/providers/PaddleProvider'

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
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'Checkout failed')

      const { orderId, priceId, customerEmail, customData } = json.data

      const paddle = getPaddle()
      if (!paddle) throw new Error('Paddle not initialized')

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
      const message = err instanceof Error ? err.message : 'Checkout failed'
      params.onError?.(message)
    }
  }

  const openSubscriptionCheckout = async (params: {
    priceId?: string
    couponId?: string
    onSuccess?: () => void
    onError?: (error: string) => void
  }) => {
    try {
      const res = await fetch('/api/paddle/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'subscription',
          priceId: params.priceId,
          couponId: params.couponId,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'Checkout failed')

      const { priceId, customerId, customerEmail, discountId, customData } = json.data

      const paddle = getPaddle()
      if (!paddle) throw new Error('Paddle not initialized')

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const checkoutParams: any = {
        items: [{ priceId, quantity: 1 }],
        customer: {
          id: customerId,
          email: customerEmail,
        },
        customData,
        settings: {
          displayMode: 'overlay',
          theme: 'light',
          locale: 'en',
          successUrl: `${window.location.origin}/dashboard/billing?upgraded=true`,
        },
      }

      if (discountId) {
        checkoutParams.discountId = discountId
      }

      paddle.Checkout.open(checkoutParams)
      params.onSuccess?.()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Checkout failed'
      params.onError?.(message)
    }
  }

  return { openOrderCheckout, openSubscriptionCheckout }
}

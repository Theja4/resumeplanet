'use client'

import { getPaddle } from '@/components/providers/PaddleProvider'
import {
  Analytics,
  clearCheckoutContext,
  readAnalyticsAttribution,
  readPostHogDistinctIdFromCookie,
  setCheckoutContext,
} from '@/lib/analytics'
import { getPaddleConfigurationError } from '@/lib/paddleConfig'
import { PolarEmbedCheckout } from '@/lib/polarEmbedCheckout'
import { HUMAN_WRITTEN_ORDER, PRO_PLAN } from '@/lib/pricing'

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay?: new (options: Record<string, any>) => { open: () => void }
  }
}

function getPaymentProvider() {
  return process.env.NEXT_PUBLIC_PAYMENT_PROVIDER
}

function shouldUsePolarRedirectCheckout() {
  return process.env.NEXT_PUBLIC_POLAR_CHECKOUT_MODE === 'redirect'
}

export function isPolarCheckoutPreferred() {
  return getPaymentProvider() === 'polar'
    || process.env.NEXT_PUBLIC_POLAR_CHECKOUT_ENABLED === 'true'
}

export function isPayPalCheckoutPreferred() {
  const provider = getPaymentProvider()
  return (provider ? provider === 'paypal' : provider !== 'paddle')
    || process.env.NEXT_PUBLIC_PAYPAL_CHECKOUT_ENABLED === 'true'
}

function getClientPaddleUnavailableMessage() {
  return (
    getPaddleConfigurationError({
      environment:
        process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT === 'production' ? 'production' : 'sandbox',
      apiKey: 'configured-server-side',
      clientToken: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
    }) ?? 'Paddle not initialized'
  )
}

function shouldUseUnifiedProCheckout() {
  return true
}

function loadRazorpayCheckoutScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.Razorpay) {
      resolve()
      return
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    )

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true })
      existingScript.addEventListener('error', () => reject(new Error('Razorpay checkout failed to load')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Razorpay checkout failed to load'))
    document.body.appendChild(script)
  })
}

export function usePaddleCheckout() {
  const openOrderCheckout = async (params: {
    resumeId?: string | null
    uploadedResumeText?: string | null
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
          uploadedResumeText: params.uploadedResumeText,
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
      if (!paddle) throw new Error(getClientPaddleUnavailableMessage())

      Analytics.checkoutStarted({
        product: 'writing_service',
        price: HUMAN_WRITTEN_ORDER.amountCents / 100,
      })
      setCheckoutContext({
        product: 'writing_service',
        price: HUMAN_WRITTEN_ORDER.amountCents / 100,
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
      const selectedPrice = PRO_PLAN.getPriceById(params.priceId ?? '') ?? PRO_PLAN.defaultPrice
      const checkoutPrice = selectedPrice.display.displayPrice

      if (shouldUseUnifiedProCheckout()) {
        const res = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            priceId: selectedPrice.id,
            distinctId,
            promotionId: params.promotionId,
            promotionCode: params.promotionCode,
            blogReferrerSlug: attribution?.ref === 'blog' ? attribution.slug : undefined,
            blogReferrerCta: attribution?.ref === 'blog' ? attribution.cta : undefined,
          }),
        })
        const json = await res.json().catch(() => null)
        if (!json) throw new Error('Checkout failed. Please try again in a moment.')
        if (!json.success) throw new Error(json.error ?? 'Checkout failed')

        const checkoutAmount =
          typeof json.data?.amount === 'number' ? json.data.amount : checkoutPrice
        const checkoutDiscountCode =
          typeof json.data?.discountCode === 'string' ? json.data.discountCode : params.promotionCode
        const provider = json.data?.provider

        if (provider === 'razorpay') {
          await loadRazorpayCheckoutScript()

          if (!window.Razorpay) {
            throw new Error('Razorpay checkout is unavailable')
          }

          Analytics.checkoutStarted({
            product: 'pro_subscription',
            price: checkoutAmount,
            discountCode: checkoutDiscountCode,
          })
          setCheckoutContext({
            product: 'pro_subscription',
            price: checkoutAmount,
            discountCode: checkoutDiscountCode,
            step: 'razorpay_overlay',
          })

          const checkout = new window.Razorpay({
            key: json.data.keyId,
            amount: json.data.amount,
            currency: json.data.currency,
            name: 'Rezoomed',
            description: json.data.description,
            subscription_id: json.data.subscriptionId,
            prefill: {
              name: json.data.customerName ?? undefined,
              email: json.data.customerEmail ?? undefined,
            },
            hidden: {
              contact: true,
            },
            notes: {
              price_id: json.data.priceId,
              interval: json.data.interval,
            },
            handler: async (response: {
              razorpay_subscription_id: string
              razorpay_payment_id: string
              razorpay_signature: string
            }) => {
              const verifyRes = await fetch('/api/razorpay/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(response),
              })
              const verifyJson = await verifyRes.json().catch(() => null)

              if (!verifyJson?.success) {
                clearCheckoutContext()
                params.onError?.(verifyJson?.error ?? 'Razorpay payment verification failed')
                return
              }

              clearCheckoutContext()
              window.location.href = '/dashboard/pricing?upgraded=true&provider=razorpay'
            },
            modal: {
              ondismiss: () => {
                Analytics.checkoutAbandoned({
                  product: 'pro_subscription',
                  step: 'razorpay_overlay_closed',
                })
                clearCheckoutContext()
                params.onSuccess?.()
              },
            },
          })

          checkout.open()
          return
        }

        const redirectUrl = json.data?.checkoutUrl

        if (typeof redirectUrl !== 'string' || !redirectUrl) {
          throw new Error('Checkout did not return a redirect URL')
        }

        Analytics.checkoutStarted({
          product: 'pro_subscription',
          price: checkoutAmount,
          discountCode: checkoutDiscountCode,
        })
        setCheckoutContext({
          product: 'pro_subscription',
          price: checkoutAmount,
          discountCode: checkoutDiscountCode,
          step:
            provider === 'polar' && !shouldUsePolarRedirectCheckout()
              ? 'polar_inline'
              : 'polar_redirect',
        })

        if (provider === 'polar' && !shouldUsePolarRedirectCheckout()) {
          const checkout = await PolarEmbedCheckout.create(redirectUrl, { theme: 'light' })
          let checkoutCompleted = false

          checkout.addEventListener('success', () => {
            checkoutCompleted = true
            clearCheckoutContext()
          })
          checkout.addEventListener('close', () => {
            if (checkoutCompleted) return

            const checkoutContext = {
              product: 'pro_subscription',
              step: 'polar_inline_closed',
            }

            Analytics.checkoutAbandoned(checkoutContext)
            clearCheckoutContext()
          })

          params.onSuccess?.()
          return
        }

        window.location.href = redirectUrl
        params.onSuccess?.()
        return
      }

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
      const json = await res.json().catch(() => null)
      if (!json) throw new Error('Checkout failed. Please try again in a moment.')
      if (!json.success) throw new Error(json.error ?? 'Checkout failed')

      const { priceId, customerId, customerEmail, discountId, discountCode, customData } = json.data

      const paddle = getPaddle()
      if (!paddle) throw new Error(getClientPaddleUnavailableMessage())

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

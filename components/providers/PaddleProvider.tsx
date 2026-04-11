'use client'

import { useEffect } from 'react'
import { initializePaddle, type Paddle } from '@paddle/paddle-js'
import { Analytics, clearCheckoutContext, readCheckoutContext } from '@/lib/analytics'
import { getPaddleConfigurationError } from '@/lib/paddleConfig'

// Singleton Paddle instance for client-side use
let paddleInstance: Paddle | null = null

export function getPaddle(): Paddle | null {
  return paddleInstance
}

export default function PaddleProvider({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    if (paddleInstance) return // already initialized

    const configurationError = getPaddleConfigurationError({
      environment:
        process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT === 'production' ? 'production' : 'sandbox',
      apiKey: 'configured-server-side',
      clientToken: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
    })

    if (configurationError) {
      console.warn('Skipping Paddle client initialization:', configurationError)
      return
    }

    initializePaddle({
      environment:
        process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT === 'production'
          ? 'production'
          : 'sandbox',
      token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN!,
      eventCallback: (event) => {
        if (event.name === 'checkout.error') {
          console.error('Paddle checkout error:', event.data)
        }

        if (event.name === 'checkout.completed') {
          clearCheckoutContext()
        }

        if (event.name === 'checkout.closed') {
          const checkoutContext = readCheckoutContext()
          if (!checkoutContext) return

          Analytics.checkoutAbandoned({
            product: checkoutContext.product,
            step: checkoutContext.step ?? 'checkout_closed',
          })
          clearCheckoutContext()
        }
      },
    }).then((paddle) => {
      if (paddle) {
        paddleInstance = paddle
      }
    })
  }, [])

  return <>{children}</>
}

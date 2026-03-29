'use client'

import { useEffect } from 'react'
import { initializePaddle, type Paddle } from '@paddle/paddle-js'

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
    initializePaddle({
      environment:
        process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT === 'production'
          ? 'production'
          : 'sandbox',
      token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN!,
      eventCallback: (event) => {
        if (event.name === 'checkout.completed') {
          console.log('Paddle checkout completed:', event.data)
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

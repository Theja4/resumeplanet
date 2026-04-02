'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  orderId: string
  currentStatus: string
}

const MAX_ATTEMPTS = 20

export default function OrderStatusPoller({ orderId, currentStatus }: Props) {
  const router = useRouter()
  const attempts = useRef(0)
  const running = useRef(false)

  useEffect(() => {
    // Only poll if we're waiting for payment confirmation
    if (currentStatus !== 'pending') return

    const id = setInterval(async () => {
      if (running.current) return
      running.current = true

      attempts.current += 1
      if (attempts.current >= MAX_ATTEMPTS) {
        clearInterval(id)
        running.current = false
        return
      }

      try {
        const res = await fetch(`/api/orders/${orderId}/status`)
        if (res.ok) {
          const json = await res.json()
          if (json.status && json.status !== 'pending') {
            clearInterval(id)
            router.refresh()
          }
        }
      } catch {
        // silently continue polling
      }

      running.current = false
    }, 3000)

    return () => clearInterval(id)
  }, [orderId, currentStatus, router])

  return null
}

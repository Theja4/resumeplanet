'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  upgraded: boolean
  isPro: boolean
}

const MAX_ATTEMPTS = 15

function getSyncEndpoint() {
  return process.env.NEXT_PUBLIC_PAYMENT_PROVIDER === 'polar'
    ? '/api/polar/sync-subscription'
    : '/api/paddle/sync-subscription'
}

export default function UpgradePoller({ upgraded, isPro }: Props) {
  const router = useRouter()
  const attempts = useRef(0)
  const running = useRef(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!upgraded || isPro) return

    // Clear any stale interval from a previous effect cycle
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    attempts.current = 0

    intervalRef.current = setInterval(async () => {
      if (running.current) return
      running.current = true

      attempts.current += 1
      if (attempts.current >= MAX_ATTEMPTS) {
        if (intervalRef.current) clearInterval(intervalRef.current)
        intervalRef.current = null
        running.current = false
        return
      }

      try {
        const res = await fetch(getSyncEndpoint(), { method: 'POST' })
        const json = await res.json()
        if (json.isPro) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          intervalRef.current = null
          router.refresh()
        }
      } catch {
        // silently continue polling
      }

      running.current = false
    }, 2000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [upgraded, isPro, router])

  return null
}

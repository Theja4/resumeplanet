'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  upgraded: boolean
  isPro: boolean
}

const MAX_ATTEMPTS = 15

export default function UpgradePoller({ upgraded, isPro }: Props) {
  const router = useRouter()
  const attempts = useRef(0)
  const running = useRef(false)

  useEffect(() => {
    if (!upgraded || isPro) return

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
        const res = await fetch('/api/paddle/sync-subscription', { method: 'POST' })
        const json = await res.json()
        if (json.isPro) {
          clearInterval(id)
          router.refresh()
        }
      } catch {
        // silently continue polling
      }

      running.current = false
    }, 2000)

    return () => clearInterval(id)
  }, [upgraded, isPro, router])

  return null
}

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

  useEffect(() => {
    if (!upgraded || isPro) return
    const id = setInterval(() => {
      attempts.current += 1
      if (attempts.current >= MAX_ATTEMPTS) {
        clearInterval(id)
        return
      }
      router.refresh()
    }, 2000)
    return () => clearInterval(id)
  }, [upgraded, isPro, router])

  return null
}

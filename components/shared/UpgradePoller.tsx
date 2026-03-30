'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  upgraded: boolean
  isPro: boolean
}

export default function UpgradePoller({ upgraded, isPro }: Props) {
  const router = useRouter()

  useEffect(() => {
    if (!upgraded || isPro) return
    const id = setInterval(() => router.refresh(), 2000)
    return () => clearInterval(id)
  }, [upgraded, isPro, router])

  return null
}

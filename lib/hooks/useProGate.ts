'use client'

import { useCallback, useState } from 'react'
import { usePlan } from '@/lib/context/PlanContext'
import type { ProFeatureKey } from '@/lib/proFeatures'

export function useProGate() {
  const { isPro } = usePlan()
  const [blockedFeature, setBlockedFeature] = useState<ProFeatureKey | null>(null)

  const requirePro = useCallback((feature: ProFeatureKey): boolean => {
    if (isPro) return true
    setBlockedFeature(feature)
    return false
  }, [isPro])

  const clearBlockedFeature = useCallback(() => setBlockedFeature(null), [])

  return {
    isPro,
    requirePro,
    blockedFeature,
    clearBlockedFeature,
  }
}

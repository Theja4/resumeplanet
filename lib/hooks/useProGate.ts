'use client'

import { useState } from 'react'
import { usePlan } from '@/lib/context/PlanContext'
import type { ProFeatureKey } from '@/lib/proFeatures'

export function useProGate() {
  const { isPro } = usePlan()
  const [blockedFeature, setBlockedFeature] = useState<ProFeatureKey | null>(null)

  function requirePro(feature: ProFeatureKey): boolean {
    if (isPro) return true
    setBlockedFeature(feature)
    return false
  }

  return {
    isPro,
    requirePro,
    blockedFeature,
    clearBlockedFeature: () => setBlockedFeature(null),
  }
}

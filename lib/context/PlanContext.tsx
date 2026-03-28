'use client'

import { createContext, useContext } from 'react'
import type { Profile } from '@/types'

interface PlanContextValue {
  isPro: boolean
  profile: Profile | null
}

const PlanContext = createContext<PlanContextValue>({ isPro: false, profile: null })

export function PlanProvider({
  children,
  isPro,
  profile,
}: {
  children: React.ReactNode
  isPro: boolean
  profile: Profile | null
}) {
  return (
    <PlanContext.Provider value={{ isPro, profile }}>
      {children}
    </PlanContext.Provider>
  )
}

export function usePlan(): PlanContextValue {
  return useContext(PlanContext)
}

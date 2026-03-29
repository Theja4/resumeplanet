'use client'

import { useState } from 'react'
import type { PromoConfig } from '@/lib/pricing'
import ExitIntentModal from './ExitIntentModal'

interface Props {
  children: React.ReactNode
  isPro: boolean
  exitPromo: PromoConfig | null
}

export default function ExitIntentProvider({ children, isPro, exitPromo }: Props) {
  const [modalClosed, setModalClosed] = useState(false)

  if (!exitPromo || isPro || modalClosed) {
    return <>{children}</>
  }

  return (
    <>
      {children}
      <ExitIntentModal
        promo={exitPromo}
        onClose={() => setModalClosed(true)}
      />
    </>
  )
}

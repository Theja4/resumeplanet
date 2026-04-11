'use client'

import { useState } from 'react'
import type { PriceOption, PromoConfig } from '@/lib/pricing'
import ExitIntentModal from './ExitIntentModal'

interface Props {
  children: React.ReactNode
  isPro: boolean
  exitPromo: PromoConfig | null
  exitPriceOption: PriceOption | null
}

export default function ExitIntentProvider({
  children,
  isPro,
  exitPromo,
  exitPriceOption,
}: Props) {
  const [modalClosed, setModalClosed] = useState(false)

  if (!exitPromo || !exitPriceOption || isPro || modalClosed) {
    return <>{children}</>
  }

  return (
    <>
      {children}
      <ExitIntentModal
        promo={exitPromo}
        priceOption={exitPriceOption}
        onClose={() => setModalClosed(true)}
      />
    </>
  )
}

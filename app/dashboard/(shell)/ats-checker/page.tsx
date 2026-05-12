import ATSCheckerClient from './ATSCheckerClient'
import type { Resume, ResumeData } from '@/types'
import { getAuthenticatedUserContext } from '@/lib/authenticated-user'
import { syncResumeData } from '@/lib/resume-data'
import { headers } from 'next/headers'
import { detectRequestCountry } from '@/lib/cookie-consent'
import {
  getProPlanForCountry,
  getActivePromotionByCode,
  getEffectiveDisplay,
} from '@/lib/pricing'
import type { ModalPromoDisplay } from '@/components/shared/OneClickOptimizeModal'

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2)
}

export default async function ATSCheckerPage() {
  const { supabase, userId, profile } = await getAuthenticatedUserContext()

  const [resumesResult, headerStore] = await Promise.all([
    supabase
      .from('resumes')
      .select('id, title, raw_text, parsed_data')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    headers(),
  ])

  const resumes = ((resumesResult.data ?? []) as Pick<Resume, 'id' | 'title' | 'raw_text' | 'parsed_data'>[]).map((resume) => ({
    ...resume,
    parsed_data: syncResumeData((resume.parsed_data as ResumeData | null) ?? {}),
  }))

  const countryCode = detectRequestCountry(headerStore)
  const plan = getProPlanForCountry(countryCode)
  const career50 = getActivePromotionByCode('CAREER50')

  const monthlyOption = plan.getPriceById('monthly')
  const annualOption = plan.getPriceById('annual')

  let promoDisplay: ModalPromoDisplay | null = null
  if (monthlyOption && annualOption) {
    const monthlyDisplay = getEffectiveDisplay(monthlyOption, career50)
    const annualDisplay = getEffectiveDisplay(annualOption, career50)
    const sym = monthlyDisplay.currencySymbol
    const discountedAnnualPerMonth = annualDisplay.displayPrice / 12
    const originalPerMonth = monthlyOption.perMonthEquivalent ?? annualOption.display.displayPrice / 12

    promoDisplay = {
      currencySymbol: sym,
      monthly: {
        original: `${sym}${fmt(monthlyOption.display.displayPrice)}`,
        discounted: `${sym}${fmt(monthlyDisplay.displayPrice)}`,
      },
      annual: {
        originalPerMonth: `${sym}${fmt(originalPerMonth)}`,
        discountedPerMonth: `${sym}${fmt(Math.floor(discountedAnnualPerMonth * 100) / 100)}`,
        discountedTotal: `${sym}${fmt(annualDisplay.displayPrice)}`,
      },
    }
  }

  return <ATSCheckerClient resumes={resumes} profile={profile} mode="ats" promoDisplay={promoDisplay} />
}

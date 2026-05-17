import { getProPlanForCountry } from '@/lib/pricing'
import type { PriceOption } from '@/lib/pricing'

export async function getLiveVisibleProPriceOptions(
  countryCode: string | null | undefined
): Promise<PriceOption[]> {
  return getProPlanForCountry(countryCode).visiblePrices
}

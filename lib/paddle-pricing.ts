import 'server-only'

import { cache } from 'react'
import { getPaddleConfigurationError, paddle } from '@/lib/paddle'
import { getProPlanForCountry, type PriceOption } from '@/lib/pricing'

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  AUD: 'A$',
  CAD: 'CA$',
}

function roundPriceAmount(value: number) {
  return Math.round(value * 100) / 100
}

function formatCurrencyAmount(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2)
}

function getCurrencySymbol(currencyCode: string, fallback: string) {
  return CURRENCY_SYMBOLS[currencyCode] ?? fallback
}

function toMajorUnitAmount(amount: string | null | undefined) {
  const parsed = Number(amount ?? 0)

  if (!Number.isFinite(parsed)) {
    return 0
  }

  return roundPriceAmount(parsed / 100)
}

function normalizeBasePriceOption(option: PriceOption) {
  return {
    ...option,
    display: {
      ...option.display,
      actualPrice: undefined,
    },
  }
}

function withComputedAnnualSavings(options: PriceOption[]) {
  const monthlyOption = options.find(option => option.id === 'monthly')

  return options.map(option => {
    if (option.id !== 'annual') {
      return option
    }

    if (!monthlyOption || monthlyOption.display.currency !== option.display.currency) {
      return {
        ...option,
        savingsNote: undefined,
      }
    }

    const annualSavings = roundPriceAmount(
      monthlyOption.display.displayPrice * 12 - option.display.displayPrice
    )

    return {
      ...option,
      savingsNote:
        annualSavings > 0
          ? `Save ${option.display.currencySymbol}${formatCurrencyAmount(annualSavings)} vs monthly`
          : undefined,
      perMonthEquivalent: roundPriceAmount(option.display.displayPrice / 12),
    }
  })
}

const getPaddlePriceById = cache(async (priceId: string) => paddle.prices.get(priceId))

async function getLivePriceOption(option: PriceOption): Promise<PriceOption> {
  if (!option.paddlePriceId) {
    return normalizeBasePriceOption(option)
  }

  const price = await getPaddlePriceById(option.paddlePriceId)
  const liveAmount = toMajorUnitAmount(price.unitPrice.amount)
  const currency = price.unitPrice.currencyCode
  const currencySymbol = getCurrencySymbol(currency, option.display.currencySymbol)

  return {
    ...option,
    display: {
      displayPrice: liveAmount,
      actualPrice: undefined,
      currency,
      currencySymbol,
    },
    perMonthEquivalent:
      option.interval === 'year' ? roundPriceAmount(liveAmount / 12) : roundPriceAmount(liveAmount),
    savingsNote: undefined,
  }
}

export async function getLiveVisibleProPriceOptions(countryCode: string | null | undefined) {
  const fallbackOptions = getProPlanForCountry(countryCode).visiblePrices.map(normalizeBasePriceOption)

  if (getPaddleConfigurationError()) {
    return withComputedAnnualSavings(fallbackOptions)
  }

  const liveOptions = await Promise.all(
    fallbackOptions.map(async option => {
      try {
        return await getLivePriceOption(option)
      } catch (error) {
        console.error(`Failed to load live Paddle price for ${option.id}:`, error)
        return option
      }
    })
  )

  return withComputedAnnualSavings(liveOptions)
}

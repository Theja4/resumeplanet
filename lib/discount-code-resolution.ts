import type { createServiceRoleClient } from '@/lib/supabase/service-role'
import { normalizeAffiliateCode } from '@/lib/affiliate'
import { findAffiliateByDiscountCode } from '@/lib/affiliate-server'
import {
  getActivePromotionByCode,
  type PromoConfig,
} from '@/lib/pricing'
import type { Affiliate } from '@/types'

type ServiceRoleClient = ReturnType<typeof createServiceRoleClient>

export type DiscountCodeResolution =
  | {
      status: 'affiliate'
      code: string
      affiliate: Affiliate
      promotion: PromoConfig | null
    }
  | {
      status: 'promotion'
      code: string
      promotion: PromoConfig
      affiliateLookupFailed: boolean
    }
  | {
      status: 'misconfigured_promotion'
      code: string
      promotion: PromoConfig
    }
  | {
      status: 'not_found'
      code: string
    }

interface ResolveDiscountCodeOptions {
  scope: string
  allowPromotionFallbackOnAffiliateLookupError?: boolean
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

function promotionLogFields(promotion: PromoConfig | null) {
  if (!promotion) {
    return {}
  }

  return {
    promotionId: promotion.id,
    promotionCode: promotion.paddleDiscountCode,
    hasPaddleDiscountId: Boolean(promotion.paddleDiscountId),
  }
}

export function logDiscountCodeResolutionWarning(
  reason: string,
  details: Record<string, unknown>
) {
  console.warn('[discount-code-resolution]', JSON.stringify({
    reason,
    ...details,
  }))
}

export async function resolveDiscountCodeForApplication(
  supabase: ServiceRoleClient,
  rawCode: string | null | undefined,
  options: ResolveDiscountCodeOptions
): Promise<DiscountCodeResolution> {
  const code = normalizeAffiliateCode(rawCode)
  const promotion = getActivePromotionByCode(code)

  let affiliate: Affiliate | null = null

  try {
    affiliate = await findAffiliateByDiscountCode(supabase, code)
  } catch (error) {
    if (promotion?.paddleDiscountId && options.allowPromotionFallbackOnAffiliateLookupError) {
      logDiscountCodeResolutionWarning('affiliate_lookup_failed_using_configured_promotion', {
        scope: options.scope,
        code,
        error: getErrorMessage(error),
        ...promotionLogFields(promotion),
      })

      return {
        status: 'promotion',
        code,
        promotion,
        affiliateLookupFailed: true,
      }
    }

    throw error
  }

  if (affiliate) {
    if (promotion && !promotion.paddleDiscountId) {
      logDiscountCodeResolutionWarning('affiliate_code_shadowed_misconfigured_promotion', {
        scope: options.scope,
        code,
        affiliateId: affiliate.id,
        ...promotionLogFields(promotion),
      })
    }

    return {
      status: 'affiliate',
      code,
      affiliate,
      promotion,
    }
  }

  if (!promotion) {
    return {
      status: 'not_found',
      code,
    }
  }

  if (!promotion.paddleDiscountId) {
    logDiscountCodeResolutionWarning('promotion_missing_paddle_discount_id', {
      scope: options.scope,
      code,
      ...promotionLogFields(promotion),
    })

    return {
      status: 'misconfigured_promotion',
      code,
      promotion,
    }
  }

  return {
    status: 'promotion',
    code,
    promotion,
    affiliateLookupFailed: false,
  }
}

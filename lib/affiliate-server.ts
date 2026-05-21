import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import {
  AFFILIATE_REFERRALS_PER_PAGE,
  normalizeAffiliateCode,
  readAffiliateReferralCodeFromCookieStore,
  roundCurrencyAmount,
  toCurrencyAmount,
} from '@/lib/affiliate'
import type {
  Affiliate,
  AffiliateCommission,
  AffiliateDashboardStats,
  AffiliateMonthlySignup,
  AffiliatePayout,
  AffiliateReferral,
  AffiliateReferralPage,
  Profile,
} from '@/types'

type ServiceRoleClient = ReturnType<typeof createServiceRoleClient>

export interface AffiliateAuthContext {
  userId: string
  profile: Profile
  affiliate: Affiliate
  supabase: Awaited<ReturnType<typeof createClient>>
  serviceSupabase: ServiceRoleClient
}

export function logAffiliateInfrastructureError(scope: string, error: unknown) {
  console.error(`[affiliate] ${scope}`, error)
}

function parseAffiliateRow(row: Record<string, unknown>): Affiliate {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    name: String(row.name),
    email: String(row.email),
    discount_code: String(row.discount_code),
    paddle_discount_id: row.paddle_discount_id ? String(row.paddle_discount_id) : null,
    polar_discount_id: row.polar_discount_id ? String(row.polar_discount_id) : null,
    discount_percent: toCurrencyAmount(row.discount_percent as string | number),
    commission_percent: toCurrencyAmount(row.commission_percent as string | number),
    paypal_email: row.paypal_email ? String(row.paypal_email) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  }
}

function parseReferralRow(row: Record<string, unknown>): AffiliateReferral {
  return {
    id: String(row.id),
    affiliate_id: String(row.affiliate_id),
    referred_user_email: String(row.referred_user_email),
    paddle_subscription_id: String(row.paddle_subscription_id),
    plan_name: String(row.plan_name),
    status: row.status as AffiliateReferral['status'],
    mrr: toCurrencyAmount(row.mrr as string | number),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  }
}

function parsePayoutRow(row: Record<string, unknown>): AffiliatePayout {
  return {
    id: String(row.id),
    affiliate_id: String(row.affiliate_id),
    amount: toCurrencyAmount(row.amount as string | number),
    paypal_email: String(row.paypal_email),
    status: row.status as AffiliatePayout['status'],
    requested_at: String(row.requested_at),
    paid_at: row.paid_at ? String(row.paid_at) : null,
  }
}

function parseCommissionRow(row: Record<string, unknown>): AffiliateCommission {
  return {
    id: String(row.id),
    affiliate_id: String(row.affiliate_id),
    referral_id: row.referral_id ? String(row.referral_id) : null,
    paddle_transaction_id: String(row.paddle_transaction_id),
    gross_amount: toCurrencyAmount(row.gross_amount as string | number),
    commission_amount: toCurrencyAmount(row.commission_amount as string | number),
    discount_code: row.discount_code ? String(row.discount_code) : null,
    created_at: String(row.created_at),
  }
}

export async function readAffiliateReferralCodeFromCookies() {
  const cookieStore = await cookies()
  return readAffiliateReferralCodeFromCookieStore(cookieStore)
}

export async function requireAffiliateAccess(): Promise<AffiliateAuthContext | NextResponse> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const [profileResult, affiliateResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('affiliates').select('*').eq('user_id', user.id).maybeSingle(),
  ])

  if (profileResult.error) {
    throw new Error(`Failed to load profile: ${profileResult.error.message}`)
  }

  if (affiliateResult.error) {
    throw new Error(`Failed to load affiliate access: ${affiliateResult.error.message}`)
  }

  if (!profileResult.data) {
    return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 401 })
  }

  if (!affiliateResult.data) {
    return NextResponse.json({ success: false, error: 'AFFILIATE_REQUIRED' }, { status: 403 })
  }

  return {
    userId: user.id,
    profile: profileResult.data as Profile,
    affiliate: parseAffiliateRow(affiliateResult.data as Record<string, unknown>),
    supabase,
    serviceSupabase: createServiceRoleClient(),
  }
}

export async function findAffiliateByDiscountCode(
  supabase: ServiceRoleClient,
  discountCode: string | null | undefined
) {
  const normalizedCode = normalizeAffiliateCode(discountCode)

  if (!normalizedCode) {
    return null
  }

  const { data, error } = await supabase
    .from('affiliates')
    .select('*')
    .eq('discount_code', normalizedCode)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to load affiliate by discount code: ${error.message}`)
  }

  return data ? parseAffiliateRow(data as Record<string, unknown>) : null
}


export async function getAffiliateById(
  supabase: ServiceRoleClient,
  affiliateId: string
) {
  const { data, error } = await supabase
    .from('affiliates')
    .select('*')
    .eq('id', affiliateId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to load affiliate: ${error.message}`)
  }

  return data ? parseAffiliateRow(data as Record<string, unknown>) : null
}

export async function getAffiliateReferralBySubscriptionId(
  supabase: ServiceRoleClient,
  subscriptionId: string | null | undefined
) {
  if (!subscriptionId) {
    return null
  }

  const { data, error } = await supabase
    .from('referrals')
    .select('*')
    .eq('paddle_subscription_id', subscriptionId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to load affiliate referral: ${error.message}`)
  }

  return data ? parseReferralRow(data as Record<string, unknown>) : null
}

export async function upsertAffiliateReferral(
  supabase: ServiceRoleClient,
  referral: {
    affiliateId: string
    referredUserEmail: string
    paddleSubscriptionId: string
    planName: string
    status: AffiliateReferral['status']
    mrr: number
  }
) {
  const { data, error } = await supabase
    .from('referrals')
    .upsert(
      {
        affiliate_id: referral.affiliateId,
        referred_user_email: referral.referredUserEmail,
        paddle_subscription_id: referral.paddleSubscriptionId,
        plan_name: referral.planName,
        status: referral.status,
        mrr: referral.mrr,
      },
      { onConflict: 'paddle_subscription_id' }
    )
    .select('*')
    .single()

  if (error) {
    throw new Error(`Failed to upsert affiliate referral: ${error.message}`)
  }

  return parseReferralRow(data as Record<string, unknown>)
}

export async function getAffiliatePayouts(
  supabase: ServiceRoleClient,
  affiliateId: string
) {
  const { data, error } = await supabase
    .from('payouts')
    .select('*')
    .eq('affiliate_id', affiliateId)
    .order('requested_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to load affiliate payouts: ${error.message}`)
  }

  return (data ?? []).map(row => parsePayoutRow(row as Record<string, unknown>))
}

export async function getAllPayouts(supabase: ServiceRoleClient) {
  const { data, error } = await supabase
    .from('payouts')
    .select('*, affiliates(discount_code, name, email)')
    .order('requested_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to load all payouts: ${error.message}`)
  }

  return (data ?? []).map(row => ({
    ...parsePayoutRow(row as Record<string, unknown>),
    affiliate_discount_code: String((row as Record<string, unknown> & { affiliates?: Record<string, unknown> }).affiliates?.discount_code ?? ''),
    affiliate_name: String((row as Record<string, unknown> & { affiliates?: Record<string, unknown> }).affiliates?.name ?? ''),
    affiliate_email: String((row as Record<string, unknown> & { affiliates?: Record<string, unknown> }).affiliates?.email ?? ''),
  }))
}

export async function updatePayoutStatus(
  supabase: ServiceRoleClient,
  payoutId: string,
  status: 'paid' | 'rejected'
) {
  const { error } = await supabase
    .from('payouts')
    .update({
      status,
      ...(status === 'paid' ? { paid_at: new Date().toISOString() } : {}),
    })
    .eq('id', payoutId)

  if (error) {
    throw new Error(`Failed to update payout status: ${error.message}`)
  }
}

export async function getAffiliateCommissions(
  supabase: ServiceRoleClient,
  affiliateId: string
) {
  const { data, error } = await supabase
    .from('affiliate_commissions')
    .select('*')
    .eq('affiliate_id', affiliateId)

  if (error) {
    throw new Error(`Failed to load affiliate commissions: ${error.message}`)
  }

  return (data ?? []).map(row => parseCommissionRow(row as Record<string, unknown>))
}

export async function getAffiliateStats(
  supabase: ServiceRoleClient,
  affiliateId: string
): Promise<AffiliateDashboardStats> {
  const affiliate = await getAffiliateById(supabase, affiliateId)
  const affiliateCode = affiliate?.discount_code ?? null
  const start = new Date()
  start.setUTCDate(1)
  start.setUTCHours(0, 0, 0, 0)
  start.setUTCMonth(start.getUTCMonth() - 5)

  const [
    referralsCountResult,
    activeCountResult,
    attributedProfilesResult,
    activeProfilesResult,
    commissions,
    payouts,
    monthlyReferralsResult,
    monthlyProfilesResult,
  ] =
    await Promise.all([
      supabase
        .from('referrals')
        .select('id', { count: 'exact', head: true })
        .eq('affiliate_id', affiliateId),
      supabase
        .from('referrals')
        .select('id', { count: 'exact', head: true })
        .eq('affiliate_id', affiliateId)
        .eq('status', 'active'),
      affiliateCode
        ? supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('affiliate_source_code', affiliateCode)
        : Promise.resolve({ count: 0, error: null }),
      affiliateCode
        ? supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('affiliate_source_code', affiliateCode)
            .eq('plan', 'pro')
        : Promise.resolve({ count: 0, error: null }),
      getAffiliateCommissions(supabase, affiliateId),
      getAffiliatePayouts(supabase, affiliateId),
      supabase
        .from('referrals')
        .select('created_at')
        .eq('affiliate_id', affiliateId)
        .gte('created_at', start.toISOString()),
      affiliateCode
        ? supabase
            .from('profiles')
            .select('created_at')
            .eq('affiliate_source_code', affiliateCode)
            .gte('created_at', start.toISOString())
        : Promise.resolve({ data: [], error: null }),
    ])

  if (referralsCountResult.error) {
    throw new Error(`Failed to load affiliate referral count: ${referralsCountResult.error.message}`)
  }

  if (activeCountResult.error) {
    throw new Error(`Failed to load affiliate active referral count: ${activeCountResult.error.message}`)
  }

  if (attributedProfilesResult.error) {
    throw new Error(`Failed to load affiliate attributed signup count: ${attributedProfilesResult.error.message}`)
  }

  if (activeProfilesResult.error) {
    throw new Error(`Failed to load affiliate active profile count: ${activeProfilesResult.error.message}`)
  }

  if (monthlyReferralsResult.error) {
    throw new Error(`Failed to load affiliate referral chart data: ${monthlyReferralsResult.error.message}`)
  }

  if (monthlyProfilesResult.error) {
    throw new Error(`Failed to load affiliate signup chart data: ${monthlyProfilesResult.error.message}`)
  }

  const totalEarned = roundCurrencyAmount(
    commissions.reduce((sum, commission) => sum + commission.commission_amount, 0)
  )
  const reservedPayouts = roundCurrencyAmount(
    payouts
      .filter(payout => payout.status === 'pending' || payout.status === 'paid')
      .reduce((sum, payout) => sum + payout.amount, 0)
  )
  const pendingPayout = roundCurrencyAmount(Math.max(totalEarned - reservedPayouts, 0))

  return {
    totalSignups: Math.max(referralsCountResult.count ?? 0, attributedProfilesResult.count ?? 0),
    activeSubscriptions: Math.max(activeCountResult.count ?? 0, activeProfilesResult.count ?? 0),
    totalEarned,
    pendingPayout,
    monthlySignups: buildMonthlySignupSeries(
      (monthlyProfilesResult.data?.length ? monthlyProfilesResult.data : monthlyReferralsResult.data ?? [])
        .map(row => String(row.created_at))
    ),
  }
}

export async function getAffiliateReferralPage(
  supabase: ServiceRoleClient,
  affiliateId: string,
  page: number,
  pageSize = AFFILIATE_REFERRALS_PER_PAGE
): Promise<AffiliateReferralPage> {
  const safePage = Math.max(1, Math.floor(page))
  const from = (safePage - 1) * pageSize
  const to = from + pageSize - 1

  const { data, count, error } = await supabase
    .from('referrals')
    .select('*', { count: 'exact' })
    .eq('affiliate_id', affiliateId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    throw new Error(`Failed to load affiliate referrals: ${error.message}`)
  }

  const totalCount = count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  return {
    page: safePage,
    pageSize,
    totalCount,
    totalPages,
    referrals: (data ?? []).map(row => parseReferralRow(row as Record<string, unknown>)),
  }
}

export async function createAffiliatePayoutRequest(
  supabase: ServiceRoleClient,
  affiliateId: string,
  paypalEmail: string
) {
  const { data, error } = await supabase.rpc('request_affiliate_payout', {
    p_affiliate_id: affiliateId,
    p_paypal_email: paypalEmail,
  })

  if (error) {
    throw new Error(error.message)
  }

  const firstRow = Array.isArray(data) ? data[0] : data

  if (!firstRow) {
    throw new Error('Failed to create payout request')
  }

  return parsePayoutRow(firstRow as Record<string, unknown>)
}

async function getLatestFxRateToUsd(
  supabase: ServiceRoleClient,
  currencyCode: string
) {
  if (currencyCode === 'USD') {
    return { rate: 1, provider: 'usd', rateDate: new Date().toISOString().slice(0, 10) }
  }

  const { data, error } = await supabase
    .from('fx_rates')
    .select('rate_to_usd, provider, rate_date')
    .eq('currency_code', currencyCode)
    .order('rate_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    logAffiliateInfrastructureError('affiliate-fx-rate-lookup', error)
  }

  const row = data as Record<string, unknown> | null
  const rate = Number(row?.rate_to_usd ?? 0)

  return {
    rate: Number.isFinite(rate) && rate > 0 ? rate : 1,
    provider: row?.provider ? String(row.provider) : 'fallback',
    rateDate: row?.rate_date ? String(row.rate_date) : new Date().toISOString().slice(0, 10),
  }
}

export async function recordAffiliateConversionForUser(
  supabase: ServiceRoleClient,
  params: {
    userId: string
    provider: 'paypal' | 'polar' | 'razorpay'
    subscriptionId?: string | null
    transactionId?: string | null
    planName: string
    status?: AffiliateReferral['status']
    grossAmount?: number | null
    currencyCode?: string | null
    interval?: 'monthly' | 'annual' | null
    discountCode?: string | null
  }
) {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('email, affiliate_source_code')
    .eq('id', params.userId)
    .maybeSingle()

  if (profileError) {
    throw new Error(`Failed to load affiliate conversion profile: ${profileError.message}`)
  }

  const sourceCode = normalizeAffiliateCode(
    params.discountCode ?? (profile as { affiliate_source_code?: string | null } | null)?.affiliate_source_code
  )

  if (!sourceCode) {
    return null
  }

  const affiliate = await findAffiliateByDiscountCode(supabase, sourceCode)

  if (!affiliate || affiliate.user_id === params.userId) {
    return null
  }

  const currencyCode = (params.currencyCode ?? 'USD').trim().toUpperCase()
  const grossAmountOriginal = roundCurrencyAmount(Math.max(0, params.grossAmount ?? 0))
  const fx = await getLatestFxRateToUsd(supabase, currencyCode)
  const grossAmountUsd = roundCurrencyAmount(grossAmountOriginal * fx.rate)
  const commissionAmountOriginal = roundCurrencyAmount(
    grossAmountOriginal * (affiliate.commission_percent / 100)
  )
  const commissionAmountUsd = roundCurrencyAmount(
    grossAmountUsd * (affiliate.commission_percent / 100)
  )
  const mrr =
    params.interval === 'annual'
      ? roundCurrencyAmount(grossAmountUsd / 12)
      : grossAmountUsd
  const subscriptionId = params.subscriptionId
    ? `${params.provider}:${params.subscriptionId}`
    : `${params.provider}:user:${params.userId}`

  const referral = await upsertAffiliateReferral(supabase, {
    affiliateId: affiliate.id,
    referredUserEmail: String((profile as { email?: string | null } | null)?.email ?? ''),
    paddleSubscriptionId: subscriptionId,
    planName: params.planName,
    status: params.status ?? 'active',
    mrr,
  })

  if (!params.transactionId || grossAmountOriginal <= 0 || commissionAmountUsd <= 0) {
    return { affiliate, referral, commission: null }
  }

  const { data: commission, error: commissionError } = await supabase
    .from('affiliate_commissions')
    .upsert(
      {
        affiliate_id: affiliate.id,
        referral_id: referral.id,
        paddle_transaction_id: `${params.provider}:${params.transactionId}`,
        gross_amount: grossAmountUsd,
        commission_amount: commissionAmountUsd,
        discount_code: affiliate.discount_code,
        currency_code: currencyCode,
        gross_amount_original: grossAmountOriginal,
        commission_amount_original: commissionAmountOriginal,
        fx_rate_to_usd: fx.rate,
        gross_amount_usd: grossAmountUsd,
        commission_amount_usd: commissionAmountUsd,
        fx_rate_date: fx.rateDate,
        fx_provider: fx.provider,
      },
      { onConflict: 'paddle_transaction_id' }
    )
    .select('*')
    .single()

  if (commissionError) {
    throw new Error(`Failed to record affiliate commission: ${commissionError.message}`)
  }

  return {
    affiliate,
    referral,
    commission: parseCommissionRow(commission as Record<string, unknown>),
  }
}

function buildMonthlySignupSeries(createdAtValues: string[]): AffiliateMonthlySignup[] {
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date()
    date.setUTCDate(1)
    date.setUTCHours(0, 0, 0, 0)
    date.setUTCMonth(date.getUTCMonth() - (5 - index))

    const monthKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`

    return {
      monthKey,
      label: date.toLocaleDateString('en-US', {
        month: 'short',
      }),
      signups: 0,
    }
  })

  const counts = new Map(months.map(month => [month.monthKey, month]))

  for (const createdAt of createdAtValues) {
    const date = new Date(createdAt)

    if (Number.isNaN(date.getTime())) {
      continue
    }

    const monthKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
    const existing = counts.get(monthKey)

    if (existing) {
      existing.signups += 1
    }
  }

  return months
}

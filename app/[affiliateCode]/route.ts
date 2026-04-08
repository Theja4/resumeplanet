import { NextRequest, NextResponse } from 'next/server'
import {
  AFFILIATE_REFERRAL_COOKIE,
  AFFILIATE_REFERRAL_COOKIE_MAX_AGE,
  normalizeAffiliateCode,
} from '@/lib/affiliate'
import {
  findAffiliateByDiscountCode,
  logAffiliateInfrastructureError,
} from '@/lib/affiliate-server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ affiliateCode: string }> }
) {
  const { affiliateCode } = await params
  const normalizedCode = normalizeAffiliateCode(affiliateCode)

  if (!normalizedCode) {
    return new NextResponse('Not Found', { status: 404 })
  }

  let affiliate = null

  try {
    affiliate = await findAffiliateByDiscountCode(
      createServiceRoleClient(),
      normalizedCode
    )
  } catch (error) {
    logAffiliateInfrastructureError('path-referral-affiliate-lookup', error)
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (!affiliate) {
    return new NextResponse('Not Found', { status: 404 })
  }

  const redirectUrl = new URL('/', request.url)

  request.nextUrl.searchParams.forEach((value, key) => {
    redirectUrl.searchParams.append(key, value)
  })

  const response = NextResponse.redirect(redirectUrl)

  response.cookies.set({
    name: AFFILIATE_REFERRAL_COOKIE,
    value: affiliate.discount_code,
    maxAge: AFFILIATE_REFERRAL_COOKIE_MAX_AGE,
    path: '/',
    sameSite: 'lax',
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
  })

  return response
}

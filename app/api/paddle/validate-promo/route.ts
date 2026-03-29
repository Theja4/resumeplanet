import { NextRequest, NextResponse } from 'next/server'
import { paddle } from '@/lib/paddle'
import { createClient } from '@/lib/supabase/server'
import type { Discount } from '@paddle/paddle-node-sdk'

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ valid: false, errorMessage: 'Invalid request' })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ valid: false, errorMessage: 'Unauthorized' }, { status: 401 })
  }

  const code = ((body.code as string) ?? '').trim().toUpperCase()
  if (!code) {
    return NextResponse.json({ valid: false, errorMessage: 'Please enter a promo code' })
  }

  try {
    const discountCollection = paddle.discounts.list()
    let discount: Discount | undefined

    for await (const d of discountCollection) {
      if (d.code?.toUpperCase() === code && d.status === 'active') {
        discount = d
        break
      }
    }

    if (!discount) {
      return NextResponse.json({
        valid: false,
        errorMessage: 'Invalid or expired promo code',
      })
    }

    // Check expiry
    if (discount.expiresAt) {
      const expires = new Date(discount.expiresAt)
      if (expires < new Date()) {
        return NextResponse.json({
          valid: false,
          errorMessage: 'This promo code has expired',
        })
      }
    }

    // Build display label
    let displayLabel = ''
    if (discount.type === 'percentage') {
      displayLabel = `${discount.amount}% off`
    } else if (discount.type === 'flat') {
      displayLabel = `$${(Number(discount.amount) / 100).toFixed(2)} off`
    } else if (discount.type === 'flat_per_seat') {
      displayLabel = `$${(Number(discount.amount) / 100).toFixed(2)} off per seat`
    }

    if (!discount.recur) {
      displayLabel += ' your first payment'
    }

    return NextResponse.json({
      valid: true,
      discountId: discount.id,
      discountCode: discount.code,
      discountType: discount.type,
      discountValue: Number(discount.amount),
      displayLabel: displayLabel || 'Discount applied',
    })
  } catch (err) {
    console.error('Promo validation error:', err)
    return NextResponse.json({
      valid: false,
      errorMessage: 'Could not validate code. Please try again.',
    })
  }
}

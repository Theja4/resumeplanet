# Billing Subscription-Aware CTAs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show the correct billing page CTAs based on subscription tier (free / pro-monthly / pro-annual), auto-refresh after checkout, and keep the sidebar badge in sync.

**Architecture:** Add `subscription_interval` to the Supabase `profiles` table and populate it via the Paddle webhook handlers. The billing page derives a `subscriptionTier` value server-side and renders the appropriate CTAs. A lightweight client component polls `router.refresh()` until the webhook-driven profile update is visible after checkout.

**Tech Stack:** Next.js 16 App Router (server + client components), Supabase, Paddle Node SDK, TypeScript, Tailwind CSS.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `types/index.ts` | Modify | Add `subscription_interval` to `Profile` |
| `app/api/paddle/webhook/route.ts` | Modify | Persist `subscription_interval` in subscription handlers |
| `components/shared/UpgradePoller.tsx` | **Create** | Client component — polls `router.refresh()` post-checkout |
| `app/dashboard/(shell)/billing/ManageSubscriptionButton.tsx` | Modify | Accept optional `label` prop |
| `app/dashboard/(shell)/billing/page.tsx` | Modify | Derive `subscriptionTier`, render tier-aware CTAs, mount `UpgradePoller` |

---

## Task 1: Add `subscription_interval` to the Supabase `profiles` table

**Files:**
- No code files — Supabase Dashboard SQL editor

- [ ] **Step 1: Run the migration in the Supabase dashboard**

Open the Supabase project → SQL Editor → New query → paste and run:

```sql
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS subscription_interval TEXT
  CHECK (subscription_interval IN ('monthly', 'annual'));
```

- [ ] **Step 2: Verify the column exists**

In SQL Editor run:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name = 'subscription_interval';
```

Expected: one row with `column_name = subscription_interval`, `data_type = text`, `is_nullable = YES`.

---

## Task 2: Update the `Profile` TypeScript type

**Files:**
- Modify: `types/index.ts`

- [ ] **Step 1: Add the field to the Profile interface**

In `types/index.ts`, find the `Profile` interface and add `subscription_interval` after `subscription_status`:

```ts
export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  plan: 'free' | 'pro'
  paddle_customer_id: string | null
  paddle_subscription_id: string | null
  subscription_status: string | null
  subscription_interval: 'monthly' | 'annual' | null
  ats_scans_today: number
  ats_scans_reset_at: string
  created_at: string
}
```

- [ ] **Step 2: Verify TypeScript is happy**

```bash
cd /Users/thejach/Downloads/ResumePlanet && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add types/index.ts
git commit -m "feat: add subscription_interval to Profile type"
```

---

## Task 3: Persist `subscription_interval` in the Paddle webhook

**Files:**
- Modify: `app/api/paddle/webhook/route.ts`

The Paddle subscription object exposes the billing interval via `subscription.items[0].price.billingCycle.interval` (values: `'month'` or `'year'`). We map these to `'monthly'` / `'annual'` using `PRO_PLAN.getPriceByPaddleId` where available, and fall back to direct inspection.

- [ ] **Step 1: Add a helper to resolve the interval**

At the top of `route.ts`, after the imports, add:

```ts
import { PRO_PLAN } from '@/lib/pricing'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveInterval(priceId: string | undefined | null): 'monthly' | 'annual' | null {
  if (!priceId) return null
  const option = PRO_PLAN.getPriceByPaddleId(priceId)
  if (option?.interval === 'month') return 'monthly'
  if (option?.interval === 'year') return 'annual'
  return null
}
```

- [ ] **Step 2: Update `handleSubscriptionFromTransaction`**

Replace the existing function with:

```ts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionFromTransaction(transaction: any, supabase: any) {
  const { userId } = transaction.customData ?? {}
  if (!userId) return

  // Idempotency
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', userId)
    .single()
  if (profile?.plan === 'pro') return

  const priceId = transaction.items?.[0]?.price?.id ?? null
  const subscriptionInterval = resolveInterval(priceId)

  await supabase
    .from('profiles')
    .update({
      plan: 'pro',
      paddle_subscription_id: transaction.subscriptionId ?? null,
      paddle_customer_id: transaction.customerId ?? null,
      subscription_status: 'active',
      subscription_interval: subscriptionInterval,
    })
    .eq('id', userId)

  console.log(`User ${userId} upgraded to Pro (via transaction), interval: ${subscriptionInterval}`)
}
```

- [ ] **Step 3: Update `handleSubscriptionActivated`**

Replace the existing function with:

```ts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionActivated(subscription: any, supabase: any) {
  const userId = subscription.customData?.userId
  if (!userId) return

  // Idempotency: skip if already upgraded
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', userId)
    .single()
  if (profile?.plan === 'pro') return

  const priceId = subscription.items?.[0]?.price?.id ?? null
  const subscriptionInterval = resolveInterval(priceId)

  await supabase
    .from('profiles')
    .update({
      plan: 'pro',
      paddle_subscription_id: subscription.id,
      paddle_customer_id: subscription.customerId,
      subscription_status: 'active',
      subscription_interval: subscriptionInterval,
    })
    .eq('id', userId)

  console.log(`User ${userId} subscription activated, interval: ${subscriptionInterval}`)
}
```

- [ ] **Step 4: Update `handleSubscriptionUpdated`**

Replace the existing function with:

```ts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionUpdated(subscription: any, supabase: any) {
  const isActive = ['active', 'trialing'].includes(subscription.status)
  const priceId = subscription.items?.[0]?.price?.id ?? null
  const subscriptionInterval = isActive ? resolveInterval(priceId) : null

  await supabase
    .from('profiles')
    .update({
      subscription_status: subscription.status,
      plan: isActive ? 'pro' : 'free',
      subscription_interval: subscriptionInterval,
    })
    .eq('paddle_subscription_id', subscription.id)
}
```

- [ ] **Step 5: Update `handleSubscriptionCanceled`**

Replace the existing function with:

```ts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionCanceled(subscription: any, supabase: any) {
  await supabase
    .from('profiles')
    .update({
      plan: 'free',
      subscription_status: 'cancelled',
      paddle_subscription_id: null,
      subscription_interval: null,
    })
    .eq('paddle_subscription_id', subscription.id)

  console.log(`Subscription ${subscription.id} cancelled`)
}
```

- [ ] **Step 6: Verify the build**

```bash
cd /Users/thejach/Downloads/ResumePlanet && npm run build 2>&1 | tail -20
```

Expected: build completes with no TypeScript errors. Ignore any prerender warnings about dynamic routes.

- [ ] **Step 7: Commit**

```bash
git add app/api/paddle/webhook/route.ts
git commit -m "feat: persist subscription_interval in Paddle webhook handlers"
```

---

## Task 4: Create the UpgradePoller client component

**Files:**
- Create: `components/shared/UpgradePoller.tsx`

- [ ] **Step 1: Create the file**

```tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  upgraded: boolean
  isPro: boolean
}

export default function UpgradePoller({ upgraded, isPro }: Props) {
  const router = useRouter()

  useEffect(() => {
    if (!upgraded || isPro) return
    const id = setInterval(() => router.refresh(), 2000)
    return () => clearInterval(id)
  }, [upgraded, isPro, router])

  return null
}
```

- [ ] **Step 2: Verify the build**

```bash
cd /Users/thejach/Downloads/ResumePlanet && npm run build 2>&1 | tail -20
```

Expected: build completes cleanly.

- [ ] **Step 3: Commit**

```bash
git add components/shared/UpgradePoller.tsx
git commit -m "feat: add UpgradePoller component for post-checkout refresh"
```

---

## Task 5: Add optional `label` prop to ManageSubscriptionButton

**Files:**
- Modify: `app/dashboard/(shell)/billing/ManageSubscriptionButton.tsx`

This allows the annual upsell card to reuse the portal-open logic with different button text.

- [ ] **Step 1: Update the component**

Replace the entire file content with:

```tsx
'use client'

import { useState } from 'react'

interface Props {
  label?: string
}

export default function ManageSubscriptionButton({ label = 'Manage Subscription' }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleManage() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/paddle/portal', { method: 'POST' })
      const json = await res.json()
      const url = json.data?.portalUrl
      if (url) {
        window.location.href = url
      } else {
        setError(json.error ?? 'Failed to open portal. Please try again.')
        setLoading(false)
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div>
      {error && <p className="text-sm text-red-600 mb-2 text-center">{error}</p>}
      <button
        onClick={handleManage}
        disabled={loading}
        className="w-full py-3 border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Opening portal…
          </>
        ) : (
          label
        )}
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Verify the build**

```bash
cd /Users/thejach/Downloads/ResumePlanet && npm run build 2>&1 | tail -20
```

Expected: clean build.

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/\(shell\)/billing/ManageSubscriptionButton.tsx
git commit -m "feat: add optional label prop to ManageSubscriptionButton"
```

---

## Task 6: Update the billing page with subscription-aware CTAs

**Files:**
- Modify: `app/dashboard/(shell)/billing/page.tsx`

- [ ] **Step 1: Update the imports at the top of the file**

The current imports block (lines 1–9) should become:

```ts
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Check, X, CheckCircle2, Zap, TrendingUp, FileText } from 'lucide-react'
import Link from 'next/link'
import ManageSubscriptionButton from './ManageSubscriptionButton'
import BillingUpgradeSection from './BillingUpgradeSection'
import ExitIntentProvider from '@/components/shared/ExitIntentProvider'
import UpgradePoller from '@/components/shared/UpgradePoller'
import { FREE_PLAN, PRO_PLAN, PROFESSIONAL_ORDER, getActiveExitIntentPromo } from '@/lib/pricing'
import type { Profile, Order } from '@/types'
```

- [ ] **Step 2: Derive `subscriptionTier` and `hasProOrder` after line 89**

Find this block (around line 87–89):

```ts
const isPro = profile.plan === 'pro'
const resumeCount = resumeCountResult.count ?? 0
const paidOrders = (ordersResult.data ?? []) as Order[]
```

Replace with:

```ts
const isPro = profile.plan === 'pro'
const resumeCount = resumeCountResult.count ?? 0
const paidOrders = (ordersResult.data ?? []) as Order[]

const subscriptionTier =
  !isPro ? 'free'
  : profile.subscription_interval === 'annual' ? 'pro-annual'
  : 'pro-monthly'

const hasProOrder = paidOrders.length > 0
```

- [ ] **Step 3: Add `UpgradePoller` just after the upgrade success banner**

Find the existing success banner block (around line 98–106):

```tsx
{/* Upgrade success banner */}
{upgraded && (
  <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-5 py-4">
    <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
    <div>
      <p className="text-sm font-semibold text-green-800">You&apos;re now on Pro!</p>
      <p className="text-xs text-green-700 mt-0.5">All Pro features are unlocked. Enjoy unlimited scans and AI-powered tools.</p>
    </div>
  </div>
)}
```

Replace with:

```tsx
{/* Upgrade success banner */}
{upgraded && (
  <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-5 py-4">
    <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
    <div>
      <p className="text-sm font-semibold text-green-800">You&apos;re now on Pro!</p>
      <p className="text-xs text-green-700 mt-0.5">All Pro features are unlocked. Enjoy unlimited scans and AI-powered tools.</p>
    </div>
  </div>
)}
<UpgradePoller upgraded={upgraded} isPro={isPro} />
```

- [ ] **Step 4: Replace the CTAs section**

Find the existing CTAs block (around lines 249–266):

```tsx
        {/* CTAs */}
        {isPro ? (
          <ManageSubscriptionButton />
        ) : (
          <BillingUpgradeSection autoFillPromo={promoCode} />
        )}
        <Link
          href="/dashboard/orders/new"
          className="flex items-center justify-center gap-2 border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 text-sm font-semibold py-3 px-6 rounded-xl transition-colors"
        >
          Order Professional Rewrite — ${PROFESSIONAL_ORDER.display.displayPrice}
        </Link>

        {isPro && (
          <p className="text-center text-xs text-gray-400">
            You can cancel anytime from the customer portal. Your access continues until the end of the billing period.
          </p>
        )}
```

Replace with:

```tsx
        {/* CTAs */}
        <div className="space-y-4">
          {/* Free: full upgrade section */}
          {subscriptionTier === 'free' && (
            <BillingUpgradeSection autoFillPromo={promoCode} />
          )}

          {/* Pro: manage subscription button */}
          {subscriptionTier !== 'free' && (
            <ManageSubscriptionButton />
          )}

          {/* Monthly Pro: annual upsell */}
          {subscriptionTier === 'pro-monthly' && (
            <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-indigo-800">Switch to Annual — Save 31%</p>
                <p className="text-xs text-indigo-600 mt-1">
                  ${PRO_PLAN.prices.find(p => p.id === 'annual')!.display.displayPrice}/year
                  · ${PRO_PLAN.prices.find(p => p.id === 'annual')!.perMonthEquivalent}/mo
                  · {PRO_PLAN.prices.find(p => p.id === 'annual')!.savingsNote}
                </p>
              </div>
              <ManageSubscriptionButton label="Switch plan →" />
            </div>
          )}

          {/* Pro: professional rewrite CTA */}
          {subscriptionTier !== 'free' && (
            <Link
              href="/dashboard/orders/new"
              className="flex items-center justify-center gap-2 border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 text-sm font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              {hasProOrder
                ? "You've ordered Professional Rewrite — order another"
                : `Order Professional Rewrite — $${PROFESSIONAL_ORDER.display.displayPrice}`}
            </Link>
          )}

          {/* Free: professional rewrite CTA */}
          {subscriptionTier === 'free' && (
            <Link
              href="/dashboard/orders/new"
              className="flex items-center justify-center gap-2 border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 text-sm font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              Order Professional Rewrite — ${PROFESSIONAL_ORDER.display.displayPrice}
            </Link>
          )}
        </div>

        {isPro && (
          <p className="text-center text-xs text-gray-400">
            You can cancel anytime from the customer portal. Your access continues until the end of the billing period.
          </p>
        )}
```

- [ ] **Step 5: Verify the build**

```bash
cd /Users/thejach/Downloads/ResumePlanet && npm run build 2>&1 | tail -30
```

Expected: clean build. If TypeScript complains about `PRO_PLAN.prices.find(...).perMonthEquivalent` being possibly undefined, add a nullish coalescing fallback: `?? 8.25`.

- [ ] **Step 6: Commit**

```bash
git add app/dashboard/\(shell\)/billing/page.tsx
git commit -m "feat: subscription-aware billing CTAs and UpgradePoller"
```

---

## Task 7: Manual smoke test

- [ ] **Step 1: Start dev server**

```bash
cd /Users/thejach/Downloads/ResumePlanet && npm run dev
```

- [ ] **Step 2: Test free user view**

Log in as a free user. Go to `/dashboard/billing`.

Expected:
- Upgrade section visible (monthly/annual toggle + Pro card + promo code)
- "Order Professional Rewrite — $29.99" link visible below it
- Sidebar badge shows "Free"

- [ ] **Step 3: Test post-checkout auto-refresh**

Open a Paddle sandbox checkout. After payment completes, watch the billing page.

Expected:
- Success banner appears immediately on redirect
- Within ~4 seconds, the sidebar badge updates to "Pro" and the upgrade section is replaced by the ManageSubscriptionButton + annual upsell + professional rewrite button
- UpgradePoller stops polling (no further network requests after plan updates)

- [ ] **Step 4: Test monthly Pro view**

As a monthly Pro user, go to `/dashboard/billing`.

Expected:
- "Manage Subscription" button visible
- "Switch to Annual — Save 31%" upsell card visible with annual price details
- "Order Professional Rewrite — $29.99" button (or "You've ordered..." if they have prior orders)
- No upgrade section or plan toggle visible

- [ ] **Step 5: Test annual Pro view**

As an annual Pro user (or temporarily set `subscription_interval = 'annual'` in Supabase for a test account), go to `/dashboard/billing`.

Expected:
- "Manage Subscription" button visible
- No annual upsell card
- Professional Rewrite button visible
- No upgrade section

- [ ] **Step 6: Test prior-order label**

Ensure there is at least one paid/in_progress/delivered order for a Pro user. Go to `/dashboard/billing`.

Expected: Professional Rewrite button reads "You've ordered Professional Rewrite — order another".

- [ ] **Step 7: Test sidebar badge after cancellation (optional)**

In Supabase, set `plan = 'free'`, `subscription_interval = null` for a test user. Reload dashboard.

Expected: Sidebar badge shows "Free".

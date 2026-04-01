# Billing Page Revamp — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the billing page to match the reference pricing theme — 3-column card grid, pill badges, featured green Pro card — while preserving all Paddle checkout logic, fonts, and brand green (`#026d32`).

**Architecture:** Four targeted file edits: `PricingToggle.tsx` (toggle colour), `PricingCard.tsx` (card visuals), `BillingUpgradeSection.tsx` (3-card grid + `isPro` prop), and `billing/page.tsx` (remove comparison table, always render cards). No new files, no logic changes.

**Tech Stack:** Next.js 14 App Router, React, Tailwind CSS v4, `lib/pricing.ts` for plan data, Paddle via `usePaddleCheckout`

---

### Task 1: Restyle PricingToggle — green selected state

**Files:**
- Modify: `components/shared/PricingToggle.tsx`

- [ ] **Step 1: Replace indigo with brand green in the selected button class**

Open `components/shared/PricingToggle.tsx`. Find this className block inside the `<button>` (around line 33–38):

```tsx
className={cn(
  'relative px-5 py-2 rounded-full text-sm transition-all font-medium',
  isSelected
    ? 'bg-indigo-600 text-white shadow-sm'
    : 'text-gray-600 hover:bg-gray-200'
)}
```

Replace with:

```tsx
className={cn(
  'relative px-5 py-2 rounded-full text-sm transition-all font-medium',
  isSelected
    ? 'bg-[#026d32] text-white shadow-sm'
    : 'text-gray-600 hover:bg-gray-200'
)}
```

- [ ] **Step 2: Commit**

```bash
git add components/shared/PricingToggle.tsx
git commit -m "style: use brand green for pricing toggle selected state"
```

---

### Task 2: Restyle PricingCard — all three variants

**Files:**
- Modify: `components/shared/PricingCard.tsx`

- [ ] **Step 1: Rewrite PricingCard.tsx with new visual design**

Replace the entire file contents with:

```tsx
import { Check, Lock, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import {
  FREE_PLAN,
  PRO_PLAN,
  PROFESSIONAL_ORDER,
  getEffectiveDisplay,
  formatPriceDisplay,
  type PromoConfig,
} from '@/lib/pricing'
import PriceDisplay from './PriceDisplay'

interface Props {
  variant: 'free' | 'pro' | 'professional'
  selectedPriceId?: string
  activePromo: PromoConfig | null
  isCurrentPlan?: boolean
  onUpgrade?: () => void
  isUpgrading?: boolean
}

export default function PricingCard({
  variant,
  selectedPriceId,
  activePromo,
  isCurrentPlan = false,
  onUpgrade,
  isUpgrading = false,
}: Props) {
  if (variant === 'free') {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col h-full">
        <div className="flex items-center justify-between mb-5">
          <span className="text-lg font-bold text-gray-900">Free</span>
          <span className="text-xs font-semibold uppercase tracking-wider bg-gray-100 text-gray-500 px-3 py-1 rounded-full">
            FREE
          </span>
        </div>

        <div className="mb-5">
          <span className="text-4xl font-bold text-gray-900">$0</span>
          <span className="text-gray-500 text-sm ml-1">/month</span>
        </div>

        <div className="mb-6">
          {isCurrentPlan ? (
            <div className="w-full text-center py-3 text-sm text-gray-500 border border-gray-200 rounded-xl">
              Current plan
            </div>
          ) : (
            <button
              onClick={onUpgrade}
              className="w-full py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
            >
              Start for Free <ArrowRight size={14} />
            </button>
          )}
        </div>

        <p className="text-xs text-gray-400 font-medium mb-3">Free plan includes:</p>
        <ul className="space-y-2.5 flex-1">
          {FREE_PLAN.features.map(f => (
            <li key={f} className="flex items-start gap-2.5 text-sm text-gray-700">
              <Check size={15} className="text-gray-400 shrink-0 mt-0.5" />
              {f}
            </li>
          ))}
          {FREE_PLAN.lockedFeatures.map(f => (
            <li key={f} className="flex items-start gap-2.5 text-sm text-gray-400">
              <Lock size={13} className="shrink-0 mt-0.5" />
              {f}
            </li>
          ))}
        </ul>
      </div>
    )
  }

  if (variant === 'pro') {
    const priceOption = PRO_PLAN.getPriceById(selectedPriceId ?? 'monthly') ?? PRO_PLAN.defaultPrice
    const display = getEffectiveDisplay(priceOption, activePromo)
    const formatted = formatPriceDisplay(display, priceOption)

    const promoBadge =
      activePromo?.overrideDisplay &&
      (activePromo.appliesTo === 'all' || activePromo.appliesTo === priceOption.id)
        ? activePromo.badge
        : null

    return (
      <div className="bg-[#026d32] rounded-2xl p-6 flex flex-col h-full relative text-white">
        {promoBadge && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-full">
              {promoBadge}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between mb-5">
          <span className="text-lg font-bold text-white">Pro</span>
          <span className="text-xs font-semibold uppercase tracking-wider bg-white/20 text-white px-3 py-1 rounded-full">
            PRO
          </span>
        </div>

        <div className="mb-5">
          <PriceDisplay
            display={formatted}
            size="lg"
            showInterval={true}
            showPerMonth={true}
            showSavings={true}
            className="text-white [&_span]:text-white [&_p]:text-green-200"
          />
        </div>

        <div className="mb-6">
          {isCurrentPlan ? (
            <div className="w-full text-center py-3 text-sm text-green-200 border border-white/30 rounded-xl">
              Current plan
            </div>
          ) : (
            <button
              onClick={onUpgrade}
              disabled={isUpgrading}
              className="w-full py-3 bg-white text-[#026d32] rounded-xl text-sm font-semibold hover:bg-green-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              {isUpgrading ? (
                'Opening checkout…'
              ) : (
                <>
                  Upgrade to Pro <ArrowRight size={14} />
                </>
              )}
            </button>
          )}
        </div>

        <p className="text-xs text-green-200 font-medium mb-3">Pro plan includes:</p>
        <ul className="space-y-2.5 flex-1">
          {PRO_PLAN.features.map(f => (
            <li key={f} className="flex items-start gap-2.5 text-sm text-white">
              <Check size={15} className="text-green-300 shrink-0 mt-0.5" />
              {f}
            </li>
          ))}
        </ul>
      </div>
    )
  }

  // Professional Rewrite
  return (
    <div className="bg-white rounded-2xl border border-amber-200 p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-5">
        <span className="text-lg font-bold text-gray-900">Professional</span>
        <span className="text-xs font-semibold uppercase tracking-wider bg-amber-100 text-amber-700 px-3 py-1 rounded-full">
          PRO+
        </span>
      </div>

      <div className="mb-5">
        <span className="text-4xl font-bold text-gray-900">
          ${PROFESSIONAL_ORDER.display.displayPrice}
        </span>
        <span className="text-gray-500 text-sm ml-1">one-time</span>
      </div>

      <div className="mb-6">
        <Link
          href="/dashboard/orders/new"
          className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
        >
          Order Now <ArrowRight size={14} />
        </Link>
      </div>

      <p className="text-xs text-gray-400 font-medium mb-3">Rewrite includes:</p>
      <ul className="space-y-2.5 flex-1">
        {PROFESSIONAL_ORDER.features.map(f => (
          <li key={f} className="flex items-start gap-2.5 text-sm text-gray-700">
            <Check size={15} className="text-amber-500 shrink-0 mt-0.5" />
            {f}
          </li>
        ))}
      </ul>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/shared/PricingCard.tsx
git commit -m "style: restyle pricing cards to match reference theme (green Pro, pill badges)"
```

---

### Task 3: Restructure BillingUpgradeSection — 3-card grid with isPro prop

**Files:**
- Modify: `app/dashboard/(shell)/billing/BillingUpgradeSection.tsx`

- [ ] **Step 1: Rewrite BillingUpgradeSection.tsx**

Replace the entire file contents with:

```tsx
'use client'

import { useState } from 'react'
import {
  PRO_PLAN,
  getActivePromotion,
  type PromoConfig,
} from '@/lib/pricing'
import PricingToggle from '@/components/shared/PricingToggle'
import PricingCard from '@/components/shared/PricingCard'
import PromoCodeInput, { type PromoValidationResult } from '@/components/shared/PromoCodeInput'
import { usePaddleCheckout } from '@/hooks/usePaddleCheckout'

interface Props {
  autoFillPromo?: string
  isPro: boolean
}

export default function BillingUpgradeSection({ autoFillPromo, isPro }: Props) {
  const [selectedPriceId, setSelectedPriceId] = useState(PRO_PLAN.defaultPrice.id)
  const [appliedDiscountId, setAppliedDiscountId] = useState<string | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const activePromo: PromoConfig | null = getActivePromotion()
  const { openSubscriptionCheckout } = usePaddleCheckout()

  function handlePromoApply(result: PromoValidationResult) {
    setAppliedDiscountId(result.valid ? result.discountId : undefined)
  }

  const effectiveDiscountId =
    appliedDiscountId ??
    (activePromo?.isAutoApply ? activePromo.paddleDiscountId : undefined)

  async function handleUpgrade() {
    setIsLoading(true)
    setCheckoutError(null)
    await openSubscriptionCheckout({
      priceId: selectedPriceId,
      couponId: effectiveDiscountId,
      onSuccess: () => setIsLoading(false),
      onError: (err) => {
        setIsLoading(false)
        setCheckoutError(err)
        console.error('Checkout error:', err)
      },
    })
  }

  return (
    <div className="space-y-5">
      {/* Interval toggle */}
      <div className="flex justify-center">
        <PricingToggle
          selectedPriceId={selectedPriceId}
          onChange={setSelectedPriceId}
          activePromo={activePromo}
        />
      </div>

      {/* 3-column card grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        <PricingCard
          variant="free"
          activePromo={activePromo}
          isCurrentPlan={!isPro}
        />
        <PricingCard
          variant="pro"
          selectedPriceId={selectedPriceId}
          activePromo={activePromo}
          isCurrentPlan={isPro}
          onUpgrade={isPro ? undefined : handleUpgrade}
          isUpgrading={isLoading}
        />
        <PricingCard
          variant="professional"
          activePromo={activePromo}
        />
      </div>

      {checkoutError && (
        <p className="text-sm text-red-600 text-center">{checkoutError}</p>
      )}

      {/* Promo code input — only relevant when upgrading from free */}
      {!isPro && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">Have a promo code?</p>
          <PromoCodeInput
            autoFillCode={autoFillPromo}
            onApply={handlePromoApply}
          />
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/dashboard/(shell)/billing/BillingUpgradeSection.tsx
git commit -m "style: show 3-column pricing card grid in BillingUpgradeSection, add isPro prop"
```

---

### Task 4: Restructure billing/page.tsx — remove table, always render cards

**Files:**
- Modify: `app/dashboard/(shell)/billing/page.tsx`

- [ ] **Step 1: Remove the plan comparison table section**

Find and delete the entire block (lines ~218–259):

```tsx
        {/* Plan comparison table */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Compare plans</h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-4 border-b border-gray-200">
              <div className="px-4 py-4" />
              <div className="px-4 py-4 text-center border-l border-gray-100">
                <p className="text-sm font-semibold text-gray-700">Free</p>
                <p className="text-lg font-bold text-gray-900 mt-1">$0</p>
                <p className="text-xs text-gray-400">forever</p>
              </div>
              <div className="px-4 py-4 text-center border-l border-gray-100 bg-indigo-50">
                <p className="text-sm font-semibold text-indigo-700">Pro</p>
                <p className="text-lg font-bold text-indigo-900 mt-1">${PRO_PLAN.defaultPrice.display.displayPrice}</p>
                <p className="text-xs text-indigo-400">per month</p>
              </div>
              <div className="px-4 py-4 text-center border-l border-gray-100 bg-amber-50">
                <p className="text-sm font-semibold text-amber-700">Professional</p>
                <p className="text-lg font-bold text-amber-900 mt-1">${PROFESSIONAL_ORDER.display.displayPrice}</p>
                <p className="text-xs text-amber-400">one-time</p>
              </div>
            </div>

            {FEATURES.map((feature, i) => (
              <div
                key={i}
                className={`grid grid-cols-4 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
              >
                <div className="px-4 py-3 text-sm text-gray-700">{feature.label}</div>
                <div className="px-4 py-3 text-center border-l border-gray-100">
                  <FeatureCell value={feature.free} />
                </div>
                <div className="px-4 py-3 text-center border-l border-gray-100">
                  <FeatureCell value={feature.pro} />
                </div>
                <div className="px-4 py-3 text-center border-l border-gray-100">
                  <FeatureCell value={feature.professional} />
                </div>
              </div>
            ))}
          </div>
        </div>
```

- [ ] **Step 2: Replace the CTAs section with always-visible 3-card grid**

Find the entire `{/* CTAs */}` block (lines ~261–311):

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
                {annualPrice && (
                  <p className="text-xs text-indigo-600 mt-1">
                    ${annualPrice.display.displayPrice}/year
                    {' · '}${annualPrice.perMonthEquivalent}/mo
                    {' · '}{annualPrice.savingsNote}
                  </p>
                )}
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
              {hasProfessionalOrder
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
```

Replace with:

```tsx
        {/* Plans */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Plans</h2>
          <BillingUpgradeSection autoFillPromo={promoCode} isPro={isPro} />
        </div>

        {/* Pro: manage subscription button */}
        {subscriptionTier !== 'free' && (
          <ManageSubscriptionButton />
        )}

        {/* Monthly Pro: annual upsell */}
        {subscriptionTier === 'pro-monthly' && (
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-indigo-800">Switch to Annual — Save 31%</p>
              {annualPrice && (
                <p className="text-xs text-indigo-600 mt-1">
                  ${annualPrice.display.displayPrice}/year
                  {' · '}${annualPrice.perMonthEquivalent}/mo
                  {' · '}{annualPrice.savingsNote}
                </p>
              )}
            </div>
            <ManageSubscriptionButton label="Switch plan →" />
          </div>
        )}
```

- [ ] **Step 3: Remove unused imports now that the table is gone**

At the top of `billing/page.tsx`, remove `Check`, `X`, `FeatureCell`, and the `FEATURES` array (and the `X` import from lucide-react since it was only used in `FeatureCell`).

Find:

```tsx
import { Check, X, CheckCircle2, Zap, TrendingUp, FileText } from 'lucide-react'
```

Replace with:

```tsx
import { CheckCircle2, Zap, TrendingUp, FileText } from 'lucide-react'
```

Then delete the `FEATURES` array (lines ~14–30) and the `FeatureCell` component (lines ~32–36).

Also remove `PROFESSIONAL_ORDER` from the pricing import since it's no longer used directly in this file. Find:

```tsx
import { FREE_PLAN, PRO_PLAN, PROFESSIONAL_ORDER, getActiveExitIntentPromo } from '@/lib/pricing'
```

Replace with:

```tsx
import { FREE_PLAN, PRO_PLAN, getActiveExitIntentPromo } from '@/lib/pricing'
```

Also remove the unused `Link` import since the standalone rewrite CTA links are gone. Find:

```tsx
import Link from 'next/link'
```

Delete that line entirely.

Also remove the `hasProfessionalOrder` variable declaration (it was only used in the CTA links we just removed). Find and delete:

```tsx
  const hasProfessionalOrder = paidOrders.length > 0
```

- [ ] **Step 4: Commit**

```bash
git add app/dashboard/(shell)/billing/page.tsx
git commit -m "style: remove comparison table, always show 3-column card grid on billing page"
```

---

### Task 5: Verify build passes

- [ ] **Step 1: Run TypeScript check**

```bash
cd /Users/thejach/Downloads/ResumePlanet && npx tsc --noEmit 2>&1 | head -40
```

Expected: no errors (or only pre-existing errors unrelated to billing).

- [ ] **Step 2: Run dev build check**

```bash
cd /Users/thejach/Downloads/ResumePlanet && npx next build 2>&1 | tail -20
```

Expected: build completes successfully.

- [ ] **Step 3: If TypeScript errors appear in touched files, fix them**

Common issues to watch for:
- `hasProfessionalOrder` still referenced after removing its usage block — verify it's still used for `UpgradePoller` or remove it
- `annualPrice` still needed for the annual upsell block — verify it's kept
- Any leftover reference to `PROFESSIONAL_ORDER` or `FEATURES` after removal

- [ ] **Step 4: Final commit if fixes were needed**

```bash
git add -p
git commit -m "fix: clean up unused vars after billing page restructure"
```

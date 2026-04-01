# Billing Page Revamp — Design Spec
**Date:** 2026-04-01

## Goal
Restyle the `/dashboard/billing` page to match the reference pricing theme (3-column card layout, pill badges, featured green card) while retaining the website's font (Plus Jakarta Sans) and primary color (`#026d32`). Zero logic changes.

## Scope
Files touched:
- `components/shared/PricingCard.tsx` — new card visual design
- `components/shared/PricingToggle.tsx` — green selected state
- `app/dashboard/(shell)/billing/BillingUpgradeSection.tsx` — 3-card grid for free users
- `app/dashboard/(shell)/billing/page.tsx` — remove comparison table, restructure layout

## Card Design

### Free card (white)
- White background, rounded-2xl, gray border
- Top row: plan name left + `FREE` pill badge right (gray bg)
- Large `$0 /month` price
- Full-width outlined CTA: "Start for Free →" (disabled "Current plan" state when on free)
- "Free plan includes:" label
- Feature list: circle-check icons (gray), features from `FREE_PLAN.features`
- Locked features shown with lock icon, muted

### Pro card (featured — green)
- Background: `#026d32` (brand primary), white text
- Top row: "Pro" left + `PRO` pill badge right (lighter green bg, white text)
- Large price via `PriceDisplay` (white)
- Full-width white CTA button: "Upgrade to Pro →" / "Opening checkout…" / "Current plan"
- "Pro plan includes:" label
- Feature list: circle-check icons (white/light green), features from `PRO_PLAN.features`
- Promo badge shown above card if active

### Professional Rewrite card (white/amber)
- White background, amber border (`border-amber-200`)
- Top row: "Professional" left + `PRO+` pill badge right (amber bg)
- Large price from `PROFESSIONAL_ORDER.display.displayPrice` + " one-time"
- Full-width amber CTA: "Order Now →" (links to `/dashboard/orders/new`)
- "Rewrite includes:" label
- Feature list: circle-check icons (amber), features from `PROFESSIONAL_ORDER.features`

## Toggle
- Pill container: `bg-gray-100 rounded-full p-1`
- Selected: `bg-[#026d32] text-white`
- Unselected: `text-gray-600 hover:bg-gray-200`
- Promo/savings badges on options retained

## Page Layout (billing/page.tsx)
1. Upgrade success banner (unchanged)
2. Header: "Billing & Plans" h1 + subtitle
3. Current plan status badge (unchanged)
4. Usage stats section (unchanged)
5. **NEW: Pricing section** — heading "Plans", toggle (centered), 3-column card grid
   - For free users: all 3 cards with upgrade CTAs wired (via BillingUpgradeSection)
   - For pro users: all 3 cards shown, Pro card shows "Current plan", checkout disabled
6. Annual upsell banner (unchanged, shown only for monthly-pro)
7. Cancel notice (unchanged)
9. Order history (unchanged)

## BillingUpgradeSection
Restructure to render all 3 cards side-by-side in a responsive grid (`grid-cols-1 md:grid-cols-3`). The free and professional cards are always visible (not just pro). The checkout logic stays in the component.

## What Does NOT Change
- All Paddle checkout logic (`usePaddleCheckout`, `openSubscriptionCheckout`)
- `ManageSubscriptionButton` — unchanged component, still used
- Promo code input — stays below the cards
- All API calls, data fetching, auth redirects
- `PriceDisplay` component
- Order history table
- `ExitIntentProvider` and `UpgradePoller` wrappers

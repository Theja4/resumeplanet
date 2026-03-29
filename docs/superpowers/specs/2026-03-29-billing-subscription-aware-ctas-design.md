# Billing Page — Subscription-Aware CTAs

**Date:** 2026-03-29
**Status:** Approved

---

## Problem

After a successful Paddle payment the billing page still shows the full upgrade UI. The sidebar Free/Pro badge does not update. There is no differentiation between monthly and annual Pro subscribers for the CTA section.

---

## Goals

1. Show the correct CTAs based on subscription tier (free / pro-monthly / pro-annual).
2. Show a contextual Professional Rewrite CTA that changes when the user has an existing order.
3. Auto-refresh the billing page after checkout until the webhook-driven profile update is reflected.
4. Ensure the sidebar plan badge updates after payment.

---

## Data Layer

### DB change
Add column to `profiles` table:
```sql
ALTER TABLE profiles ADD COLUMN subscription_interval TEXT;
-- values: 'monthly', 'annual', NULL
```

### Type change (`types/index.ts`)
```ts
subscription_interval: 'monthly' | 'annual' | null
```

### Webhook changes (`app/api/paddle/webhook/route.ts`)
In `handleSubscriptionActivated`, `handleSubscriptionFromTransaction`, and `handleSubscriptionUpdated`:
- Read `subscription.items[0].price.billingCycle.interval`
- Map `'month'` → `'monthly'`, `'year'` → `'annual'`
- Write `subscription_interval` alongside `plan` in the Supabase update

On `handleSubscriptionCanceled`: set `subscription_interval` to `null`.

---

## Billing Page CTA Logic (`app/dashboard/(shell)/billing/page.tsx`)

Derive `subscriptionTier` server-side:

| Profile state | `subscriptionTier` |
|---|---|
| `plan = 'free'` | `'free'` |
| `plan = 'pro'`, `subscription_interval = 'monthly'` | `'pro-monthly'` |
| `plan = 'pro'`, `subscription_interval = 'annual'` | `'pro-annual'` |
| `plan = 'pro'`, `subscription_interval = null` | `'pro-monthly'` (fallback) |

Also derive `hasProOrder`: `true` if `paidOrders.length > 0`.

### CTA rendering

**Free:**
- `BillingUpgradeSection` (existing — toggle + pricing card + promo code)

**Pro-monthly:**
- `ManageSubscriptionButton`
- Annual upsell card: "Switch to annual — save 31%" → opens Paddle customer portal (same portal as ManageSubscriptionButton, where users can change billing interval)
- Professional Rewrite button (see below)

**Pro-annual:**
- `ManageSubscriptionButton`
- Professional Rewrite button (see below)

### Professional Rewrite button

| Condition | Label | Destination |
|---|---|---|
| No prior order | "Order Professional Rewrite — $29.99" | `/dashboard/orders/new` |
| Has prior order | "You've ordered Professional Rewrite — order another" | `/dashboard/orders/new` |

The button is styled amber (matches existing "Order Professional Rewrite" link styling).

---

## Auto-Refresh After Payment (`UpgradePoller` client component)

New file: `components/shared/UpgradePoller.tsx`

- Rendered by the billing page when `upgraded === true` AND `isPro === false`
- Calls `router.refresh()` every 2 seconds
- When `isPro` becomes `true` (server component re-renders), the component is no longer rendered — polling stops automatically
- No visible UI; runs silently in the background

The existing success banner ("You're now on Pro!") continues to show as soon as `?upgraded=true` is in the URL, giving immediate user feedback.

### Sidebar badge
`layout.tsx` fetches the profile on every render (dynamic route due to cookie access). The same `router.refresh()` cycle that updates the billing page will cause the layout to re-fetch, updating the sidebar badge automatically.

---

## Files Changed

| File | Change |
|---|---|
| `types/index.ts` | Add `subscription_interval` to `Profile` |
| `app/api/paddle/webhook/route.ts` | Store `subscription_interval` in subscription handlers |
| `app/dashboard/(shell)/billing/page.tsx` | Derive `subscriptionTier`, render tier-aware CTAs, render `UpgradePoller` |
| `app/dashboard/(shell)/billing/BillingUpgradeSection.tsx` | No change (used only for free tier) |
| `components/shared/UpgradePoller.tsx` | New — client component that polls `router.refresh()` |

---

## Cancellation Behaviour

Cancellation via the Paddle customer portal ends the subscription at the **end of the current billing period** — access continues until then and no refund is issued. This is handled by `subscription.canceled` in the webhook, which sets `plan = 'free'` and `subscription_interval = null` only when Paddle fires the event (at period end).

The existing copy on the billing page ("You can cancel anytime from the customer portal. Your access continues until the end of the billing period.") already communicates this. No change needed to the cancellation flow.

---

## Out of Scope

- Changing the feature comparison table
- Annual upsell via a new Paddle checkout flow (can use customer portal link for now)
- Email notifications after upgrade

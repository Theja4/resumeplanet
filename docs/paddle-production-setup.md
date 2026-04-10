# Paddle Production Setup (Rezoomed)

Use this checklist to enable production billing, regional currencies, and influencer discounts.

## 1) Paddle Dashboard

1. Switch to **Production** in Paddle.
2. Create/confirm recurring Pro prices:
   - Monthly
   - Annual
   - Weekly (optional/hidden in UI)
3. Create regional prices for currencies you want to localize:
   - EUR
   - GBP
   - INR
4. Create/confirm discounts used in the app:
   - Diwali
   - New Year
   - Default exit-intent offer
5. Add webhook endpoint:
   - `https://www.rezoomed.com/api/webhooks/paddle`
6. Subscribe webhook events:
   - `subscription.created`
   - `subscription.updated`
   - `subscription.canceled`
   - `transaction.completed`

## 2) Vercel Environment Variables (Production)

Set these in **Project → Settings → Environment Variables**.

### Required core keys

- `NEXT_PUBLIC_PADDLE_ENVIRONMENT=production`
- `PADDLE_API_KEY=...`
- `PADDLE_WEBHOOK_SECRET=...`
- `NEXT_PUBLIC_SITE_URL=https://www.rezoomed.com`
- `NEXT_PUBLIC_SUPABASE_URL=...`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=...`
- `SUPABASE_SERVICE_ROLE_KEY=...`

### Base USD price IDs

- `PADDLE_PRO_PRICE_MONTHLY=pri_...`
- `PADDLE_PRO_PRICE_ANNUAL=pri_...`
- `PADDLE_PRO_PRICE_WEEKLY=pri_...`

### Optional regional price IDs

- `PADDLE_PRO_PRICE_MONTHLY_EUR=pri_...`
- `PADDLE_PRO_PRICE_ANNUAL_EUR=pri_...`
- `PADDLE_PRO_PRICE_WEEKLY_EUR=pri_...`
- `PADDLE_PRO_PRICE_MONTHLY_GBP=pri_...`
- `PADDLE_PRO_PRICE_ANNUAL_GBP=pri_...`
- `PADDLE_PRO_PRICE_WEEKLY_GBP=pri_...`
- `PADDLE_PRO_PRICE_MONTHLY_INR=pri_...`
- `PADDLE_PRO_PRICE_ANNUAL_INR=pri_...`
- `PADDLE_PRO_PRICE_WEEKLY_INR=pri_...`

### Promotion IDs

- `PADDLE_DISCOUNT_DIWALI_2026=...`
- `PADDLE_DISCOUNT_NEWYEAR_2027=...`
- `PADDLE_DISCOUNT_EXIT_DEFAULT=...`

### Optional display values (safe, easy pricing knobs)

- `NEXT_PUBLIC_PRO_PRICE_MONTHLY_DISPLAY_USD`
- `NEXT_PUBLIC_PRO_PRICE_ANNUAL_DISPLAY_USD`
- `NEXT_PUBLIC_PRO_PRICE_WEEKLY_DISPLAY_USD`
- `NEXT_PUBLIC_PRO_PRICE_MONTHLY_DISPLAY_EUR`
- `NEXT_PUBLIC_PRO_PRICE_ANNUAL_DISPLAY_EUR`
- `NEXT_PUBLIC_PRO_PRICE_WEEKLY_DISPLAY_EUR`
- `NEXT_PUBLIC_PRO_PRICE_MONTHLY_DISPLAY_GBP`
- `NEXT_PUBLIC_PRO_PRICE_ANNUAL_DISPLAY_GBP`
- `NEXT_PUBLIC_PRO_PRICE_WEEKLY_DISPLAY_GBP`
- `NEXT_PUBLIC_PRO_PRICE_MONTHLY_DISPLAY_INR`
- `NEXT_PUBLIC_PRO_PRICE_ANNUAL_DISPLAY_INR`
- `NEXT_PUBLIC_PRO_PRICE_WEEKLY_DISPLAY_INR`

### Promotion percentage knobs

- `NEXT_PUBLIC_PROMO_DIWALI_2026_PERCENT`
- `NEXT_PUBLIC_PROMO_NEWYEAR_2027_PERCENT`
- `NEXT_PUBLIC_PROMO_EXIT_DEFAULT_FIXED`

### Influencer knobs

- `NEXT_PUBLIC_AFFILIATE_DISCOUNT_PERCENT`
- `NEXT_PUBLIC_AFFILIATE_COMMISSION_PERCENT`

### Ads toggle (optional)

- `NEXT_PUBLIC_ENABLE_ADS=false`

After saving env vars, redeploy production.

## 3) Country-to-currency behavior

Configured in `lib/pricing.ts`:

- EU countries → EUR (if EUR price IDs are set)
- GB → GBP (if GBP price IDs are set)
- IN → INR (if INR price IDs are set)
- All others → USD fallback

If a regional price ID is missing for an interval, checkout falls back to USD for that interval.

## 4) Easy change locations

- Main pricing logic + regional mapping: `lib/pricing.ts`
- Affiliate discount + commission defaults: `lib/affiliate.ts`
- Checkout price selection: `app/api/paddle/checkout/route.ts`
- Webhook referral/commission handling: `app/api/paddle/webhook/route.ts`

## 5) Verify in production

1. Visit `/pricing` from target countries (or use VPN) and confirm displayed currency.
2. Start checkout and verify Paddle checkout currency/amount.
3. Complete a real test charge.
4. Confirm webhook delivery shows 2xx responses.
5. Confirm referral + commission records are created for influencer checkouts.

# ResumAI — Local Setup Guide

Follow these steps in order. After completing all steps you will have a working local dev environment with Google OAuth login.

---

## 1. Copy the environment file

```bash
cp .env.local.example .env.local
```

You will fill in each value in the steps below.

---

## 2. Create a Supabase project

1. Go to [https://supabase.com](https://supabase.com) and sign in (or create a free account).
2. Click **New project**.
3. Choose an organisation, enter a project name (e.g. `resumai`), set a strong database password, and pick a region close to you.
4. Click **Create new project** and wait ~2 minutes for it to provision.

### Find your API keys

1. In the left sidebar click **Project Settings** (gear icon at the bottom).
2. Click **API** under the Configuration section.
3. Copy the following into your `.env.local`:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

> ⚠️ Keep `SUPABASE_SERVICE_ROLE_KEY` secret — never expose it in the browser.

---

## 3. Run the SQL migration

1. In the Supabase dashboard, click **SQL Editor** in the left sidebar.
2. Click **New query**.
3. Open the file `supabase/migrations/001_initial.sql` from this project.
4. Copy the entire contents and paste into the SQL Editor.
5. Click **Run** (or press `Ctrl+Enter` / `Cmd+Enter`).
6. You should see "Success. No rows returned." — this means all tables, policies, and triggers were created.

To verify, click **Table Editor** in the left sidebar — you should see: `profiles`, `resumes`, `ats_scores`, `orders`.

---

## 4. Enable Google OAuth in Supabase

### Step A — Create OAuth credentials in Google Cloud Console

1. Go to [https://console.cloud.google.com](https://console.cloud.google.com).
2. Create a new project (or select an existing one) using the project dropdown at the top.
3. In the search bar, search for **"OAuth consent screen"** and click it.
4. Select **External**, click **Create**.
5. Fill in:
   - App name: `ResumAI`
   - User support email: your email
   - Developer contact: your email
6. Click **Save and Continue** through all steps (no scopes needed yet).
7. In the search bar, search for **"Credentials"** and click it.
8. Click **+ Create Credentials → OAuth client ID**.
9. Application type: **Web application**.
10. Name: `ResumAI Local`.
11. Under **Authorised redirect URIs**, click **+ Add URI** and paste:
    ```
    https://<your-supabase-project-ref>.supabase.co/auth/v1/callback
    ```
    Replace `<your-supabase-project-ref>` with the subdomain from your Supabase project URL.
    For example if your URL is `https://abcdefghijkl.supabase.co` then add:
    `https://abcdefghijkl.supabase.co/auth/v1/callback`
12. Click **Create**.
13. A dialog appears showing **Client ID** and **Client Secret** — copy both.

### Step B — Add credentials to Supabase

1. In the Supabase dashboard, click **Authentication** in the left sidebar.
2. Click **Providers**.
3. Find **Google** in the list and click it to expand.
4. Toggle **Enable Sign in with Google** to ON.
5. Paste your **Client ID** and **Client Secret** from the previous step.
6. Click **Save**.

---

## 5. Add allowed redirect URL

1. In the Supabase dashboard, click **Authentication → URL Configuration**.
2. Under **Redirect URLs**, click **Add URL**.
3. Enter:
   ```
   http://localhost:3000/auth/callback
   ```
4. Click **Save**.

---

## 6. Run the dev server and test login

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**Test checklist:**
- [ ] Visit `http://localhost:3000` — see the ResumAI landing stub
- [ ] Visit `http://localhost:3000/auth/login` — see the login page with Google button
- [ ] Click "Continue with Google" — complete the OAuth consent flow
- [ ] Land on `http://localhost:3000/dashboard` — see the dashboard with your name and avatar
- [ ] Click every sidebar link — each page loads
- [ ] Click **Log out** — return to the login page
- [ ] Visit `http://localhost:3000/dashboard` directly without being logged in — get redirected to `/auth/login`

If login redirects back to `/auth/login?error=access_denied`, check that:
1. The redirect URI in Google Cloud Console matches exactly (including `https://` and `/auth/v1/callback`).
2. The Google provider is enabled in Supabase Authentication → Providers.
3. `http://localhost:3000/auth/callback` is in Supabase Authentication → URL Configuration → Redirect URLs.

---

## 7. Set up Stripe payments

### Step A — Create a Stripe account and get API keys

1. Go to [https://stripe.com](https://stripe.com) and sign in (or create a free account).
2. In the Stripe dashboard, make sure you are in **Test mode** (toggle in the top-right).
3. Click **Developers → API keys** in the left sidebar.
4. Copy the following into your `.env.local`:
   - **Publishable key** → not required server-side (ignore for now)
   - **Secret key** → `STRIPE_SECRET_KEY`

### Step B — Create a webhook endpoint (for local development)

Use the Stripe CLI to forward webhook events to your local server.

1. Install the Stripe CLI: https://stripe.com/docs/stripe-cli
2. Log in:
   ```bash
   stripe login
   ```
3. In a separate terminal, start the webhook forwarder:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
4. Copy the **webhook signing secret** printed in the output (starts with `whsec_`) into your `.env.local`:
   - `STRIPE_WEBHOOK_SECRET`

For production, create a webhook endpoint in the Stripe dashboard (**Developers → Webhooks → Add endpoint**) pointing to `https://yourdomain.com/api/stripe/webhook` and subscribe to these events:
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

### Step C — Create a Pro subscription product

1. In the Stripe dashboard, click **Product catalogue → Add product**.
2. Name: `ResumAI Pro`
3. Pricing model: **Recurring**, **Monthly**, price: `$12.00 USD`.
4. Click **Save product**.
5. On the product page, copy the **Price ID** (starts with `price_`) into your `.env.local`:
   - `STRIPE_PRO_PRICE_ID`

### Step D — Create a Billing Portal configuration

1. In the Stripe dashboard, click **Settings → Billing → Customer portal**.
2. Enable the portal and configure the features you want (cancel subscription, update payment method, view invoices).
3. Click **Save**.

No additional environment variable is required — the portal is enabled by default for your Stripe account.

### Step E — Add the app URL

Add your application base URL to `.env.local` so Stripe can redirect back after checkout:

```
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

For production, set this to your deployed domain (e.g. `https://resumai.com`).

### Verify Stripe is working

1. Start the dev server (`npm run dev`) and the Stripe CLI forwarder in parallel.
2. Go to `/dashboard/billing` and click **Upgrade to Pro — $12/mo**.
3. You should be redirected to a Stripe Checkout page. Use test card `4242 4242 4242 4242`, any future expiry, any CVC.
4. After payment you should land back on `/dashboard/billing?upgraded=true` with a success banner.
5. Check the Stripe CLI terminal — you should see a `checkout.session.completed` event logged.
6. Refresh the billing page — your plan badge should now show **Pro**.

**Test card numbers:**
| Scenario | Card number |
|----------|-------------|
| Success | `4242 4242 4242 4242` |
| Requires authentication | `4000 0025 0000 3155` |
| Declined | `4000 0000 0000 9995` |

---

## 8. Running a promotion

### Create the coupon in Stripe

1. Go to **Stripe dashboard → Customers → Coupons → Create coupon**
2. Set `percent_off` or `amount_off`, duration (`once` / `repeating` / `forever`), and any redemption limits
3. Copy the **Coupon ID** (starts with `coupon_...` or a random string)

### Optionally create a promo code

1. On the coupon page → **Add promotion code**
2. Set a human-readable code string, e.g. `DIWALI50`
3. Set redemption limits if needed

### Add to pricing.ts

Add an entry to `PROMOTIONS[]` in `/lib/pricing.ts`:

```ts
{
  id: 'my-promo',
  name: 'My Promo',
  stripeCouponId: process.env.STRIPE_COUPON_MY_PROMO ?? '',
  stripePromoCode: 'MYCODE',        // the code string from Stripe
  discountType: 'percent',
  discountValue: 20,
  appliesTo: 'monthly',             // 'all' | price option id
  overrideDisplay: { displayPrice: 9.60, actualPrice: 12 },
  label: 'My Promo',
  badge: '20% OFF',
  headline: 'Special offer',
  subheadline: '20% off your first month.',
  ctaLabel: 'Claim 20% off →',
  disclaimerText: 'First month only. Renews at $12/mo.',
  startDate: '2026-11-01',          // ISO date, or omit for always-on
  endDate:   '2026-11-05',
  isExitIntent: true,
  isBanner: true,
  isAutoApply: true,
  exitIntentTimerSeconds: 600,
  bannerBgColor: 'bg-purple-600',
  bannerTextColor: 'text-white',
},
```

### Add the env var

```
STRIPE_COUPON_MY_PROMO=coupon_xxx
```

### Deploy

The promotion activates automatically on `startDate` and deactivates after `endDate`. No code changes needed.

---

## 9. Adding a new billing interval

1. **Create the price in Stripe**: Products → ResumAI Pro → **Add price** → set interval (week / month / year) → copy the Price ID

2. **Add the env var**:
   ```
   STRIPE_PRO_PRICE_INTERVAL=price_xxx
   ```

3. **Add to `PRO_PLAN.prices[]`** in `/lib/pricing.ts`:
   ```ts
   {
     id: 'quarterly',
     stripePriceId: process.env.STRIPE_PRO_PRICE_QUARTERLY ?? '',
     interval: 'month',
     intervalCount: 3,
     display: { displayPrice: 29, actualPrice: 36, currency: 'USD', currencySymbol: '$' },
     label: 'Quarterly',
     badge: 'Save 20%',
     isDefault: false,
     isHidden: false,
     perMonthEquivalent: 9.67,
     savingsNote: 'Save $7 vs monthly',
   },
   ```

4. **Deploy.** The toggle appears on the pricing page automatically.

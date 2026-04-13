# Rezoomed — Local Setup Guide

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
   - App name: `Rezoomed`
   - User support email: your email
   - Developer contact: your email
6. Click **Save and Continue** through all steps (no scopes needed yet).
7. In the search bar, search for **"Credentials"** and click it.
8. Click **+ Create Credentials → OAuth client ID**.
9. Application type: **Web application**.
10. Name: `Rezoomed Local`.
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

## 6. Production branding for Google OAuth

If you want Google sign-in to show your brand instead of the raw Supabase project ref, finish the production branding setup outside the app code:

1. In **Google Auth Platform → Branding**, set:
   - App name: `Rezoomed`
   - Homepage: your production site URL
   - Privacy policy: your production `/privacy-policy`
   - Terms of service: your production `/terms`
2. Submit and publish Google branding verification. Until branding is verified and published, Google may still show only the application domain.
3. In **Supabase**, activate either:
   - a custom domain such as `auth.rezoomed.com`, or
   - a vanity subdomain such as `rezoomed.supabase.co`
4. Add the branded Supabase callback URL to your Google OAuth client alongside the default project callback URL. Example:
   - `https://mdqxzihgairxpwrbibbp.supabase.co/auth/v1/callback`
   - `https://auth.rezoomed.com/auth/v1/callback`
5. After the branded domain is active, set `NEXT_PUBLIC_SUPABASE_URL` to that branded domain so the app uses it consistently.

---

## 7. Run the dev server and test login

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**Test checklist:**
- [ ] Visit `http://localhost:3000` — see the Rezoomed landing page
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

## 8. Paddle Setup

Paddle acts as Merchant of Record — they handle all international VAT, GST, and sales tax automatically. This is the right choice for an Indian founder selling globally.

### Why Paddle instead of Stripe?
- No need to register for GST/VAT in every country
- Paddle handles tax compliance in 180+ countries
- Simple pricing: flat % fee, no hidden costs

### Create Paddle account
1. Sign up at paddle.com — start in Sandbox mode
2. Complete identity verification (required for payouts)

### Create products
In Paddle dashboard → Catalog → Products:

**Pro Subscription:**
- Product name: "ResumAI Pro"
- Add price: $12.00/month recurring → copy `pri_...` → `PADDLE_PRO_PRICE_MONTHLY`
- Add price: $99.00/year recurring → copy `pri_...` → `PADDLE_PRO_PRICE_ANNUAL`

**Professional Resume Writing:**
- Product name: "Professional Resume Writing"
- Add price: $29.99 one-time → copy product ID `pro_...` → `PADDLE_PROFESSIONAL_PRODUCT_ID`

### Get API keys
Paddle dashboard → Developer → Authentication:
- API key → `PADDLE_API_KEY`
- Client-side token → `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`
- Set `NEXT_PUBLIC_PADDLE_ENVIRONMENT=sandbox` for local/sandbox testing
- Set `NEXT_PUBLIC_APP_URL=http://localhost:3000` locally

### Set up webhook (local testing)
Use ngrok to expose your local server:
```bash
ngrok http 3000
```

In Paddle dashboard → Developer → Notifications → New destination:
- URL: `https://your-ngrok-url.ngrok.io/api/paddle/webhook`
- Subscribe to events:
  - `transaction.completed`
  - `subscription.activated`
  - `subscription.updated`
  - `subscription.canceled`
  - `subscription.payment.failed`
- Copy signing secret → `PADDLE_WEBHOOK_SECRET`

### Test the integration
Test card: `4242 4242 4242 4242` (any future expiry, any CVC)

**Test order flow:**
1. Go to `/dashboard/orders/new`
2. Fill in all steps and click "Proceed to payment"
3. Paddle overlay opens over the app (no page redirect)
4. Complete payment with test card
5. Check Supabase: `orders.status` should change to `'paid'`

**Test subscription flow:**
1. Go to `/dashboard/billing` as a free user
2. Click "Upgrade to Pro"
3. Paddle overlay opens
4. Subscribe with test card
5. Check Supabase: `profiles.plan` should change to `'pro'`

### For production
1. Switch Paddle account to live mode
2. Update env vars to production keys
3. Set `NEXT_PUBLIC_PADDLE_ENVIRONMENT=production`
4. Update webhook URL to `https://www.rezoomed.com/api/webhooks/paddle`
5. Set `NEXT_PUBLIC_APP_URL=https://www.rezoomed.com`

---

## 9. PostHog Production Analytics

The app already includes client-side PostHog initialization and browser event capture. For the current browser-only setup, add these Vercel environment variables:

```bash
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
NEXT_PUBLIC_APP_URL=https://www.rezoomed.com
```

Optional:

```bash
POSTHOG_HOST=https://us.i.posthog.com
```

Notes:

- `NEXT_PUBLIC_POSTHOG_KEY` is the browser/project key used by `posthog-js`.
- If you later want backend webhook events in PostHog as well, add `POSTHOG_API_KEY=phx_...`.
- If you use the EU PostHog region, replace the host values with the EU ingestion host.

Recommended checks after deploy:

1. Open the live site and confirm pageviews appear in PostHog.
2. Complete a signup/login flow and verify browser events appear.
3. Confirm pricing/blog interaction events arrive from the client.

## 10. Running a Promotion

To activate a promotion (e.g. a discount code campaign):

1. Paddle dashboard → Catalog → Discounts → New discount
2. Set: type (percentage or flat), amount, redemption code
3. Set recurrence and expiry if needed
4. Copy the discount ID (e.g. `dsc_...`)
5. In `lib/pricing.ts`, find the matching PROMOTIONS entry and set `paddleDiscountId`
6. Set the env var (e.g. `PADDLE_DISCOUNT_EXIT_DEFAULT=dsc_...`)
7. Deploy — promotion activates on `startDate` automatically

## 11. Adding a New Billing Interval

1. Create new price in Paddle dashboard (same Pro product)
2. Copy the `pri_...` ID
3. In `.env.local`, add e.g. `PADDLE_PRO_PRICE_WEEKLY=pri_...`
4. In `lib/pricing.ts`, add to `PRO_PLAN.prices` array:
   ```typescript
   {
     id: 'weekly',
     label: 'Weekly',
     paddlePriceId: process.env.PADDLE_PRO_PRICE_WEEKLY ?? '',
     interval: 'week',
     intervalCount: 1,
     display: { displayPrice: 4, billingPeriod: 'week' },
   }
   ```
5. It will appear automatically in PricingToggle

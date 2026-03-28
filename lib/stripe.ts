import Stripe from 'stripe'

// Singleton Stripe client — never instantiated client-side
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia' as Stripe.LatestApiVersion,
  typescript: true,
})

export const PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID ?? ''
export const PROFESSIONAL_ORDER_AMOUNT = 2999 // $29.99 in cents

// Helper: get or create a Stripe customer for a user
// supabaseClient should be the server Supabase client (already authenticated)
export async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  name: string | null,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseClient: any
): Promise<string> {
  const { data: profile } = await supabaseClient
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single()

  if (profile?.stripe_customer_id) {
    return profile.stripe_customer_id
  }

  const customer = await stripe.customers.create({
    email,
    name: name ?? undefined,
    metadata: { supabase_user_id: userId },
  })

  await supabaseClient
    .from('profiles')
    .update({ stripe_customer_id: customer.id })
    .eq('id', userId)

  return customer.id
}

// Helper: verify and construct webhook event from raw payload
export function constructWebhookEvent(
  payload: Buffer,
  signature: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  )
}

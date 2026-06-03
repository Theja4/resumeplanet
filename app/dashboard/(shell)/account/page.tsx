import type { Metadata } from 'next'
import { getAuthenticatedUserContext } from '@/lib/authenticated-user'
import { isPro as hasActiveProAccess } from '@/lib/planUtils'
import AccountClient from './AccountClient'

export const metadata: Metadata = {
  title: 'Account & Billing',
}

export default async function AccountPage() {
  const { profile } = await getAuthenticatedUserContext()
  const isPro = hasActiveProAccess(profile)

  return (
    <AccountClient
      profile={{
        email: profile.email,
        full_name: profile.full_name,
        plan: profile.plan,
        payment_provider: profile.payment_provider ?? null,
        subscription_interval: profile.subscription_interval,
        current_period_end: profile.current_period_end ?? null,
        created_at: profile.created_at,
      }}
      isPro={isPro}
    />
  )
}

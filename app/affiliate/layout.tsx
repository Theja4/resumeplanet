import { redirect } from 'next/navigation'
import { PlanProvider } from '@/lib/context/PlanContext'
import Sidebar from '@/components/layout/Sidebar'
import BottomNav from '@/components/layout/BottomNav'
import MobileAppBar from '@/components/layout/MobileAppBar'
import { getOptionalAuthenticatedUserContext } from '@/lib/authenticated-user'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export default async function AffiliateLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const context = await getOptionalAuthenticatedUserContext()

  if (!context) {
    redirect('/auth/login?next=%2Faffiliate%2Fdashboard')
  }

  const { userId, profile: typedProfile } = context
  const proUser = typedProfile.plan === 'pro'

  const serviceSupabase = createServiceRoleClient()
  const { data: affiliateRecord } = await serviceSupabase
    .from('affiliates')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()
  const isAffiliate = Boolean(affiliateRecord?.id)

  return (
    <PlanProvider isPro={proUser} profile={typedProfile}>
      <div className="relative min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,#f8f9fa_0%,#f3f6f4_100%)]">
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-25" />
        <div className="dashboard-shell-aurora pointer-events-none absolute -left-24 top-12 h-72 w-72 rounded-full bg-primary-container/60" />
        <div className="dashboard-shell-aurora dashboard-shell-aurora-two pointer-events-none absolute right-[8%] top-40 h-80 w-80 rounded-full bg-[#d8efe0]" />
        <div className="dashboard-shell-aurora dashboard-shell-aurora-three pointer-events-none absolute bottom-16 left-1/3 h-64 w-64 rounded-full bg-[#eff8f1]" />

        <Sidebar profile={typedProfile} isAffiliate={isAffiliate} />

        <div className="relative flex min-h-screen flex-col md:ml-[18.5rem]">
          <MobileAppBar initials={(typedProfile.full_name?.[0] ?? typedProfile.email[0]).toUpperCase()} />

          <main className="relative flex-1 px-3 py-5 pb-[calc(7.25rem+env(safe-area-inset-bottom,0px))] md:px-8 md:py-8 md:pb-10 xl:px-10">
            <div className="mx-auto w-full max-w-[1240px]">
              {children}
            </div>
          </main>
        </div>

        <BottomNav />
      </div>
    </PlanProvider>
  )
}

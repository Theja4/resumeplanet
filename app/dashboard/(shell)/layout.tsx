import { Suspense } from 'react'
import { PlanProvider } from '@/lib/context/PlanContext'
import Sidebar from '@/components/layout/Sidebar'
import BottomNav from '@/components/layout/BottomNav'
import MobileAppBar from '@/components/layout/MobileAppBar'
import { getAuthenticatedUserContext } from '@/lib/authenticated-user'
import { isPro as hasActiveProAccess } from '@/lib/planUtils'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId, profile: typedProfile } = await getAuthenticatedUserContext()
  const proUser = hasActiveProAccess(typedProfile)

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

        {/* Desktop sidebar */}
        <Sidebar profile={typedProfile} isAffiliate={isAffiliate} />

        {/* Main content — offset by sidebar width on md+ */}
        <div className="relative flex min-h-screen flex-col md:ml-[18.5rem]">
          <MobileAppBar initials={(typedProfile.full_name?.[0] ?? typedProfile.email[0]).toUpperCase()} />

          {/* Page content */}
          <main className="relative flex-1 px-3 py-5 pb-[calc(7.25rem+env(safe-area-inset-bottom,0px))] md:px-8 md:py-8 md:pb-10 xl:px-10">
            <div className="mx-auto w-full max-w-[1240px]">
              <Suspense>{children}</Suspense>
            </div>
          </main>
        </div>

        {/* Mobile bottom nav */}
        <BottomNav />
      </div>
    </PlanProvider>
  )
}

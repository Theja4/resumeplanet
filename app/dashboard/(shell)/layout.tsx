import { PlanProvider } from '@/lib/context/PlanContext'
import Sidebar from '@/components/layout/Sidebar'
import BottomNav from '@/components/layout/BottomNav'
import { getAuthenticatedUserContext } from '@/lib/authenticated-user'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { profile: typedProfile } = await getAuthenticatedUserContext()
  const proUser = typedProfile.plan === 'pro'

  return (
    <PlanProvider isPro={proUser} profile={typedProfile}>
      <div className="relative min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,#f8f9fa_0%,#f3f6f4_100%)]">
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-25" />
        <div className="dashboard-shell-aurora pointer-events-none absolute -left-24 top-12 h-72 w-72 rounded-full bg-primary-container/60" />
        <div className="dashboard-shell-aurora dashboard-shell-aurora-two pointer-events-none absolute right-[8%] top-40 h-80 w-80 rounded-full bg-[#d8efe0]" />
        <div className="dashboard-shell-aurora dashboard-shell-aurora-three pointer-events-none absolute bottom-16 left-1/3 h-64 w-64 rounded-full bg-[#eff8f1]" />

        {/* Desktop sidebar */}
        <Sidebar profile={typedProfile} />

        {/* Main content — offset by sidebar width on md+ */}
        <div className="relative flex min-h-screen flex-col md:ml-[18.5rem]">
          {/* Mobile App Bar */}
          <header className="md:hidden sticky top-0 z-40 mx-3 mt-3 flex items-center justify-between rounded-[1.35rem] border border-white/70 bg-white/88 px-4 py-3.5 shadow-[0_16px_36px_rgba(25,28,29,0.07)] backdrop-blur-2xl">
            <span className="text-sm font-black tracking-tighter text-primary">Rezoomed</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-primary-container/60 bg-primary-container/50 font-bold text-xs uppercase text-on-primary-container shadow-[0_10px_24px_rgba(2,109,50,0.08)]">
              {(typedProfile.full_name?.[0] ?? typedProfile.email[0]).toUpperCase()}
            </div>
          </header>

          {/* Page content */}
          <main className="relative flex-1 px-3 py-5 pb-[calc(7.25rem+env(safe-area-inset-bottom,0px))] md:px-8 md:py-8 md:pb-10 xl:px-10">
            <div className="mx-auto w-full max-w-[1240px]">
              {children}
            </div>
          </main>
        </div>

        {/* Mobile bottom nav */}
        <BottomNav />
      </div>
    </PlanProvider>
  )
}

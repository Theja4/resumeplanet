import { PlanProvider } from '@/lib/context/PlanContext'
import Sidebar from '@/components/layout/Sidebar'
import BottomNav from '@/components/layout/BottomNav'
import { getAuthenticatedUserContext } from '@/lib/authenticated-user'

export default async function AffiliateLayout({
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

        <Sidebar profile={typedProfile} />

        <div className="relative flex min-h-screen flex-col md:ml-[18.5rem]">
          <header className="sticky top-0 z-40 mx-4 mt-4 flex items-center justify-between rounded-[1.6rem] border border-white/70 bg-white/84 px-5 py-4 shadow-[0_18px_44px_rgba(25,28,29,0.07)] backdrop-blur-2xl md:hidden">
            <span className="text-sm font-black tracking-tighter text-primary">Rezoomed</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-primary-container/60 bg-primary-container/50 font-bold text-xs uppercase text-on-primary-container shadow-[0_10px_24px_rgba(2,109,50,0.08)]">
              {(typedProfile.full_name?.[0] ?? typedProfile.email[0]).toUpperCase()}
            </div>
          </header>

          <main className="relative flex-1 px-4 py-6 pb-28 md:px-8 md:py-8 md:pb-10 xl:px-10">
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

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PlanProvider } from '@/lib/context/PlanContext'
import Sidebar from '@/components/layout/Sidebar'
import BottomNav from '@/components/layout/BottomNav'
import UserMenu from '@/components/layout/UserMenu'
import DashboardHeader from '@/components/layout/DashboardHeader'
import type { Profile } from '@/types'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/auth/login')
  }

  const typedProfile = profile as Profile
  const proUser = typedProfile.plan === 'pro'

  return (
    <PlanProvider isPro={proUser} profile={typedProfile}>
      <div className="min-h-screen bg-surface">
        {/* Desktop sidebar */}
        <Sidebar profile={typedProfile} />

        {/* Main content — offset by sidebar width on md+ */}
        <div className="md:ml-64 flex flex-col min-h-screen">
          {/* Desktop page header */}
          <DashboardHeader />

          {/* Mobile App Bar */}
          <header className="md:hidden sticky top-0 z-40 bg-surface/70 backdrop-blur-lg flex justify-between items-center w-full px-6 py-4 border-b border-outline-variant/10">
            <span className="text-sm font-black tracking-tighter text-primary">Rezoomed</span>
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border uppercase bg-pink-100 text-pink-600 border-pink-200">
              {(typedProfile.full_name?.[0] ?? typedProfile.email[0]).toUpperCase()}
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 px-6 py-8 md:px-10 pb-28 md:pb-10">
            {children}
          </main>
        </div>

        {/* Mobile bottom nav */}
        <BottomNav />
      </div>
    </PlanProvider>
  )
}

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PlanProvider } from '@/lib/context/PlanContext'
import Sidebar from '@/components/layout/Sidebar'
import BottomNav from '@/components/layout/BottomNav'
import UserMenu from '@/components/layout/UserMenu'
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
      <div className="min-h-screen bg-gray-50">
        {/* Desktop sidebar */}
        <Sidebar profile={typedProfile} />

        {/* Main content — offset by sidebar width on md+ */}
        <div className="md:pl-60 flex flex-col min-h-screen">
          {/* Mobile header */}
          <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-20">
            <span className="text-lg font-bold tracking-tight text-gray-900">
              Resum<span className="text-indigo-600">AI</span>
            </span>
            <UserMenu profile={typedProfile} />
          </header>

          {/* Page content */}
          <main className="flex-1 px-4 py-6 md:px-8 pb-20 md:pb-6">
            {children}
          </main>
        </div>

        {/* Mobile bottom nav */}
        <BottomNav />
      </div>
    </PlanProvider>
  )
}

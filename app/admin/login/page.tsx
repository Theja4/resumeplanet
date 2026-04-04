import { redirect } from 'next/navigation'
import { LockKeyhole, ShieldCheck, Sparkles } from 'lucide-react'
import AdminLoginForm from '@/components/admin/AdminLoginForm'
import { DashboardSurface } from '@/components/layout/DashboardSurface'
import { getAdminSession } from '@/lib/admin-auth'

export default async function AdminLoginPage() {
  const session = await getAdminSession()

  if (session) {
    redirect('/admin')
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f5fbf7_0%,#ffffff_58%,#eef6ef_100%)] px-6 py-12 text-on-surface">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-6xl items-center">
        <div className="grid w-full gap-8 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,0.85fr)] xl:items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary-container/50 bg-primary-container/35 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-on-primary-container">
              <ShieldCheck size={14} strokeWidth={2.4} />
              Rezoomed Admin
            </span>
            <div className="space-y-4">
              <h1 className="max-w-2xl text-5xl font-black tracking-tight text-on-background xl:text-6xl">
                Separate admin access for the control room.
              </h1>
              <p className="max-w-xl text-lg leading-8 text-on-surface-variant">
                This login is isolated from customer authentication and is reserved for the internal admin workspace only.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: 'Analytics', value: 'Panel ready' },
                { label: 'Billing', value: 'Panel ready' },
                { label: 'Blog CMS', value: 'Panel ready' },
              ].map(item => (
                <DashboardSurface key={item.label} variant="subtle" className="px-4 py-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary/60">{item.label}</p>
                  <p className="mt-2 text-sm font-bold text-on-surface">{item.value}</p>
                </DashboardSurface>
              ))}
            </div>
          </div>

          <DashboardSurface variant="default" className="relative overflow-hidden px-6 py-7 sm:px-8 sm:py-8">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-[radial-gradient(circle_at_top_left,rgba(163,255,179,0.32),transparent_55%)]" />
            <div className="relative space-y-6">
              <div className="space-y-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-[1.4rem] bg-primary-container/70 text-on-primary-container shadow-[0_18px_40px_rgba(2,109,50,0.12)]">
                  <LockKeyhole size={24} strokeWidth={2.3} />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-on-background">Admin sign in</h2>
                  <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                    Use the internal username and password to open the admin workspace.
                  </p>
                </div>
              </div>

              <AdminLoginForm />

              <div className="rounded-[1rem] bg-surface-container-low px-4 py-3 text-xs leading-6 text-on-surface-variant">
                <span className="inline-flex items-center gap-2 font-bold uppercase tracking-[0.16em] text-primary">
                  <Sparkles size={12} />
                  Internal only
                </span>
                <p className="mt-2">
                  Customer accounts, Google auth, and regular dashboard sessions cannot be used to enter this area.
                </p>
              </div>
            </div>
          </DashboardSurface>
        </div>
      </div>
    </div>
  )
}

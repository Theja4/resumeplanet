import Link from 'next/link'
import { redirect } from 'next/navigation'
import { BarChart3, CreditCard, FilePenLine, LayoutDashboard, Shield } from 'lucide-react'
import AdminLogoutButton from '@/components/admin/AdminLogoutButton'
import { getAdminSession } from '@/lib/admin-auth'

const NAV_ITEMS = [
  { href: '/admin', label: 'Overview', Icon: LayoutDashboard },
  { href: '/admin/analytics', label: 'Analytics', Icon: BarChart3 },
  { href: '/admin/billing', label: 'Billing', Icon: CreditCard },
  { href: '/admin/blog', label: 'Blog', Icon: FilePenLine },
]

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getAdminSession()

  if (!session) {
    redirect('/admin/login')
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#0c110e_0%,#111814_38%,#f4f8f5_38%,#f8faf8_100%)] text-on-surface">
      <header className="border-b border-white/10 bg-black/72 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-200">
              <Shield size={12} strokeWidth={2.4} />
              Admin Workspace
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">Rezoomed Admin</h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden rounded-full border border-white/10 bg-white/6 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-zinc-200 sm:inline-flex">
              {session.username}
            </span>
            <AdminLogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8 lg:flex-row lg:items-start">
        <aside className="w-full shrink-0 lg:w-64">
          <div className="rounded-[1.6rem] border border-black/5 bg-white/88 p-3 shadow-[0_18px_45px_rgba(25,28,29,0.05)] backdrop-blur-xl">
            <nav className="space-y-2">
              {NAV_ITEMS.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-[1rem] px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-surface-container-low hover:text-zinc-950"
                >
                  <item.Icon size={16} className="text-primary" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  )
}

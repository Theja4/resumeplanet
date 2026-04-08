import Link from 'next/link'
import { ArrowRight, BarChart3, CreditCard, FilePenLine, ShieldCheck, Users } from 'lucide-react'
import { DashboardPageIntro, DashboardSurface } from '@/components/layout/DashboardSurface'

export default function AdminOverviewPage() {
  return (
    <div className="space-y-6">
      <DashboardPageIntro
        kicker="Admin Overview"
        title="Internal control room."
        description="This admin panel is isolated from customer auth and is ready for the next phase: analytics, billing oversight, and blog management."
        aside={
          <div className="space-y-2.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Status</p>
            <p className="text-lg font-black leading-tight text-on-background">Admin auth is live.</p>
            <p className="text-sm leading-6 text-on-surface-variant">
              Blog tools, billing detail views, and analytics data can be wired into this shell next.
            </p>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Admin auth', value: 'Active', tone: 'text-primary' },
          { label: 'Analytics panel', value: 'Ready for data', tone: 'text-zinc-900' },
          { label: 'Influencer panel', value: 'Live data', tone: 'text-zinc-900' },
          { label: 'Blog CMS', value: 'Ready for CRUD', tone: 'text-zinc-900' },
        ].map(item => (
          <DashboardSurface key={item.label} variant="subtle" className="px-5 py-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">{item.label}</p>
            <p className={`mt-3 text-2xl font-black tracking-tight ${item.tone}`}>{item.value}</p>
          </DashboardSurface>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-4">
        <DashboardSurface variant="default" className="px-6 py-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-primary-container/60 text-on-primary-container">
                <BarChart3 size={20} />
              </div>
              <div>
                <p className="text-lg font-black tracking-tight text-on-background">Analytics</p>
                <p className="text-sm text-on-surface-variant">Traffic, usage, conversion, and ATS scan trends.</p>
              </div>
            </div>
            <Link href="/admin/analytics" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
              Open analytics shell <ArrowRight size={14} />
            </Link>
          </div>
        </DashboardSurface>

        <DashboardSurface variant="default" className="px-6 py-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-primary-container/60 text-on-primary-container">
                <CreditCard size={20} />
              </div>
              <div>
                <p className="text-lg font-black tracking-tight text-on-background">Billing</p>
                <p className="text-sm text-on-surface-variant">Subscriptions, orders, upgrades, and revenue overview.</p>
              </div>
            </div>
            <Link href="/admin/billing" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
              Open billing shell <ArrowRight size={14} />
            </Link>
          </div>
        </DashboardSurface>

        <DashboardSurface variant="default" className="px-6 py-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-primary-container/60 text-on-primary-container">
                <Users size={20} />
              </div>
              <div>
                <p className="text-lg font-black tracking-tight text-on-background">Influencers</p>
                <p className="text-sm text-on-surface-variant">Signup attribution, Pro upgrades, and payout performance.</p>
              </div>
            </div>
            <Link href="/admin/influencers" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
              Open influencer panel <ArrowRight size={14} />
            </Link>
          </div>
        </DashboardSurface>

        <DashboardSurface variant="default" className="px-6 py-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-primary-container/60 text-on-primary-container">
                <FilePenLine size={20} />
              </div>
              <div>
                <p className="text-lg font-black tracking-tight text-on-background">Blog</p>
                <p className="text-sm text-on-surface-variant">Draft, publish, edit, and delete posts from one place.</p>
              </div>
            </div>
            <Link href="/admin/blog" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
              Open blog shell <ArrowRight size={14} />
            </Link>
          </div>
        </DashboardSurface>
      </div>

      <DashboardSurface variant="subtle" className="px-6 py-6">
        <div className="flex items-start gap-3">
          <ShieldCheck size={18} className="mt-0.5 text-primary" />
          <div>
            <p className="text-sm font-bold text-on-background">Security note</p>
            <p className="mt-1 text-sm leading-7 text-on-surface-variant">
              This admin area uses a separate username/password flow and does not trust regular customer sessions for access.
            </p>
          </div>
        </div>
      </DashboardSurface>
    </div>
  )
}

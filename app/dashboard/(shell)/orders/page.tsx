import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Plus, ArrowRight, ShieldCheck, Trophy, Zap, Timer } from 'lucide-react'

import type { Order } from '@/types'
import { HUMAN_WRITTEN_SERVICE_ENABLED } from '@/lib/featureFlags'
import { HUMAN_WRITTEN_ORDER } from '@/lib/pricing'
import { DashboardPageIntro, DashboardSurface } from '@/components/layout/DashboardSurface'
import { getAuthenticatedUserContext } from '@/lib/authenticated-user'

const STATUS_STYLES: Record<string, string> = {
  pending:     'bg-gray-100 text-gray-600',
  paid:        'bg-green-100 text-[#026d32]',
  in_progress: 'bg-amber-100 text-amber-700',
  delivered:   'bg-green-100 text-[#026d32]',
}

const STATUS_LABELS: Record<string, string> = {
  pending:     'Pending payment',
  paid:        'Paid — In queue',
  in_progress: 'In progress',
  delivered:   'Delivered',
}

function AppleLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="currentColor">
      <path d="M11.182.008C11.148-.03 9.923.023 8.857 1.18c-1.066 1.156-.902 2.482-.878 2.516s1.52.087 2.475-1.258.762-2.391.728-2.43m3.314 11.733c-.048-.096-2.325-1.234-2.113-3.422s1.675-2.789 1.698-2.854-.597-.79-1.254-1.157a3.7 3.7 0 0 0-1.563-.434c-.108-.003-.483-.095-1.254.116-.508.139-1.653.589-1.968.607-.316.018-1.256-.522-2.267-.665-.647-.125-1.333.131-1.824.328-.49.196-1.422.754-2.074 2.237-.652 1.482-.311 3.83-.067 4.56s.625 1.924 1.273 2.796c.576.984 1.34 1.667 1.659 1.899s1.219.386 1.843.067c.502-.308 1.408-.485 1.766-.472.357.013 1.061.154 1.782.539.571.197 1.111.115 1.652-.105.541-.221 1.324-1.059 2.238-2.758q.52-1.185.473-1.282"/>
    </svg>
  )
}

function MicrosoftLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 23 23" className={className}>
      <path fill="#f25022" d="M1 1h10v10H1z"/>
      <path fill="#00a4ef" d="M1 12h10v10H1z"/>
      <path fill="#7fba00" d="M12 1h10v10H12z"/>
      <path fill="#ffb900" d="M12 12h10v10H12z"/>
    </svg>
  )
}

function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

function DeliveryInfo() {
  return (
    <div className="flex flex-col items-center text-center">
      <p className="relative text-[11px] font-bold text-on-surface-variant/40 whitespace-nowrap line-through decoration-rose-400/60 mb-0.5">
        {HUMAN_WRITTEN_ORDER.previousDeliveryLabel}
      </p>
      <p className="text-[17px] font-black leading-tight text-primary">
        {HUMAN_WRITTEN_ORDER.deliveryLabel}
      </p>
      <p className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant/30 mt-1.5 leading-relaxed">
        (Due to surge in demand)
      </p>
    </div>
  )
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatOrderAmount(amount?: number | null) {
  if (typeof amount === 'number' && Number.isFinite(amount)) {
    return `$${(amount / 100).toFixed(2)}`
  }

  return `$${HUMAN_WRITTEN_ORDER.display.displayPrice.toFixed(2)}`
}

export default async function OrdersPage() {
  if (!HUMAN_WRITTEN_SERVICE_ENABLED) {
    notFound()
  }

  const { supabase, userId } = await getAuthenticatedUserContext()

  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  const typedOrders = (orders ?? []) as Order[]

  if (typedOrders.length === 0) {
    return (
      <div className="mx-auto max-w-6xl space-y-8">
        <DashboardPageIntro
          kicker="Human-Written Resume Service"
          title="Get a Resume That Lands Senior/Leadership Roles. Written by FAANG Insiders."
          description="Stop guessing what hiring managers want. Our writers are current and former hiring managers from Apple, Google, and Microsoft. We'll turn your experience into a high-impact narrative that gets you noticed at the highest levels."
          actions={
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/dashboard/orders/new"
                  className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-8 py-4 text-sm font-black uppercase tracking-[0.16em] text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-zinc-900 shadow-[0_20px_40px_rgba(0,0,0,0.2)]"
                >
                  Book Now <ArrowRight size={16} className="ml-1" />
                </Link>
              </div>
              <div className="flex items-center gap-6">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/50">Our writers work at:</p>
                <div className="flex items-center gap-5">
                  <AppleLogo className="h-5 w-5" />
                  <GoogleLogo className="h-5 w-5" />
                  <MicrosoftLogo className="h-5 w-5" />
                </div>
              </div>
            </div>
          }
          aside={
            <div className="space-y-4">
              <div className="rounded-[1.35rem] border border-primary/15 bg-primary-container/20 p-4 shadow-[0_12px_32px_rgba(2,109,50,0.06)]">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary">
                    Limited Availability
                  </p>
                  <div className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                </div>
                <p className="mt-2 text-sm font-bold text-on-background">
                  Only 4 writer slots left this week
                </p>
                <p className="mt-1 text-xs text-on-surface-variant">
                  We limit intake to ensure every resume gets the depth it deserves from our expert hiring managers.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-3 h-36">
                <DashboardSurface variant="subtle" className="flex flex-col items-center justify-center p-4 rounded-[1.25rem] text-center">
                  <p className="text-[9px] font-black uppercase tracking-[0.12em] text-on-surface-variant/30 mb-2.5">Price</p>
                  <div className="flex flex-col items-center gap-0.5">
                    <p className="text-2xl font-black tracking-tight text-on-background leading-none">${HUMAN_WRITTEN_ORDER.display.displayPrice.toFixed(0)}</p>
                    <p className="text-[11px] font-bold text-on-surface-variant/20 line-through decoration-rose-500/20">$299</p>
                  </div>
                </DashboardSurface>

                <DashboardSurface variant="subtle" className="flex flex-col items-center justify-center p-4 rounded-[1.25rem] text-center">
                  <p className="text-[9px] font-black uppercase tracking-[0.12em] text-on-surface-variant/30 mb-2.5">Delivery</p>
                  <DeliveryInfo />
                </DashboardSurface>
              </div>
            </div>
          }
        />

        <div className="grid gap-6 xl:grid-cols-3">
          <DashboardSurface variant="dark" className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200/70">
                Why Us?
              </p>
              <Trophy size={16} className="text-emerald-200/70" />
            </div>
            <div className="mt-4 space-y-3">
              <h3 className="text-2xl font-black tracking-tight text-white leading-tight">
                Not just writers. Hiring managers.
              </h3>
              <p className="text-sm leading-6 text-emerald-100/80">
                AI is great for speed, but only a human hiring manager knows how to frame a story that survives a VP review.
              </p>
            </div>
            <div className="mt-6 space-y-3">
              <div className="flex items-start gap-3 rounded-[1.1rem] border border-white/8 bg-white/6 px-4 py-3">
                <Timer size={15} className="mt-0.5 shrink-0 text-emerald-200" />
                <span className="text-sm leading-6 text-white/90">Zero fluff. Pure impact.</span>
              </div>
              <div className="flex items-start gap-3 rounded-[1.1rem] border border-white/8 bg-white/6 px-4 py-3">
                <Zap size={15} className="mt-0.5 shrink-0 text-emerald-200" />
                <span className="text-sm leading-6 text-white/90">ATS-optimised & Human-approved.</span>
              </div>
            </div>
          </DashboardSurface>

          <DashboardSurface variant="subtle" className="p-6 flex flex-col">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-on-surface-variant/60 mb-6">
              Expertise Spotlight
            </p>
            <div className="flex-1 grid gap-5 content-center">
              <div className="flex items-center gap-4 p-3 rounded-2xl bg-white/40 border border-black/5 shadow-sm">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-black/5 shadow-inner">
                  <AppleLogo className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-on-background">David K.</p>
                  <p className="text-xs text-on-surface-variant font-medium">Sr. Manager @ Apple</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-3 rounded-2xl bg-white/40 border border-black/5 shadow-sm">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-black/5 shadow-inner">
                  <AppleLogo className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-on-background">Sarah L.</p>
                  <p className="text-xs text-on-surface-variant font-medium">HR @ Apple</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-3 rounded-2xl bg-white/40 border border-black/5 shadow-sm">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-black/5 shadow-inner">
                  <MicrosoftLogo className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-on-background">James R.</p>
                  <p className="text-xs text-on-surface-variant font-medium">Principal Engineer @ Microsoft</p>
                </div>
              </div>
            </div>
          </DashboardSurface>

          <DashboardSurface variant="accent" className="p-6 flex flex-col">
            <div className="flex-1 flex flex-col">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.15rem] bg-primary-container/45 text-primary shadow-sm">
                  <ShieldCheck size={22} />
                </div>
                <p className="text-lg font-black tracking-tight text-on-background leading-tight pt-1">
                  Double Your Interviews
                </p>
              </div>
              
              <div className="space-y-4">
                <p className="text-sm leading-7 text-on-surface-variant">
                  Candidates using our human-written service report a 2x increase in recruiter callbacks within 14 days. We don&apos;t just fix formatting—we fix your narrative.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                    <p className="text-xl font-black text-primary">2x</p>
                    <p className="text-[10px] font-bold text-primary/60 uppercase tracking-wider">More Calls</p>
                  </div>
                  <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                    <p className="text-xl font-black text-primary">14d</p>
                    <p className="text-[10px] font-bold text-primary/60 uppercase tracking-wider">Avg. Result</p>
                  </div>
                </div>
              </div>
            </div>
          </DashboardSurface>
        </div>

      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <DashboardPageIntro
        kicker="Human-Written"
        title="Track every human-written resume order from one place."
        description="See where each order sits, when it was placed, and what still needs follow-up, all inside the same premium dashboard shell."
        actions={
          <Link
            href="/dashboard/orders/new"
            className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-6 py-3 text-sm font-black uppercase tracking-[0.16em] text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-zinc-900"
          >
            <Plus size={15} /> New order
          </Link>
        }
      />

      <DashboardSurface
        variant="default"
        className="overflow-hidden opacity-0 [animation:card-enter_0.4s_ease_0.1s_forwards]"
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Target Role</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {typedOrders.map((order, i) => (
              <tr
                key={order.id}
                className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors opacity-0 [animation:card-enter_0.35s_ease_forwards]"
                style={{ animationDelay: `${0.05 * i + 0.15}s` }}
              >
                <td className="px-5 py-4 text-gray-500">{formatDate(order.created_at)}</td>
                <td className="px-5 py-4 font-medium text-gray-900">{order.job_title ?? '—'}</td>
                <td className="px-5 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[order.status] ?? STATUS_STYLES.pending}`}>
                    {STATUS_LABELS[order.status] ?? order.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-gray-700">{formatOrderAmount(order.amount)}</td>
                <td className="px-5 py-4">
                  <Link href={`/dashboard/orders/${order.id}`} className="text-[#026d32] hover:text-green-800 font-medium text-xs flex items-center gap-1">
                    View order <ArrowRight size={11} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DashboardSurface>
    </div>
  )
}

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Check, Clock, Download, ShieldCheck, Star, Trophy, Users, Globe } from 'lucide-react'
import type { Order } from '@/types'
import { HUMAN_WRITTEN_SERVICE_ENABLED } from '@/lib/featureFlags'
import { HUMAN_WRITTEN_ORDER } from '@/lib/pricing'
import OrderStatusPoller from './OrderStatusPoller'
import { DashboardPageIntro, DashboardSurface } from '@/components/layout/DashboardSurface'
import { getAuthenticatedUserContext } from '@/lib/authenticated-user'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ success?: string }>
}

const STATUS_STYLES: Record<string, string> = {
  pending:     'bg-gray-100 text-gray-700',
  paid:        'bg-primary-container/45 text-primary',
  in_progress: 'bg-amber-100 text-amber-700',
  delivered:   'bg-primary text-white',
}

const STATUS_LABELS: Record<string, string> = {
  pending:     'Pending payment',
  paid:        'Paid — In queue',
  in_progress: 'Writer working',
  delivered:   'Delivered',
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function formatOrderAmount(amount?: number | null) {
  if (typeof amount === 'number' && Number.isFinite(amount)) {
    return `$${(amount / 100).toFixed(2)}`
  }

  return `$${HUMAN_WRITTEN_ORDER.display.displayPrice.toFixed(2)}`
}

type StepStatus = 'complete' | 'current' | 'pending'

function TimelineStep({ label, description, status, date, isLast = false }: {
  label: string; description?: string; status: StepStatus; date?: string; isLast?: boolean
}) {
  return (
    <div className="flex gap-6 group">
      <div className="flex flex-col items-center">
        <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 ${
          status === 'complete' ? 'bg-primary shadow-[0_0_20px_rgba(2,109,50,0.3)]' :
          status === 'current'  ? 'bg-amber-500 animate-pulse' :
          'bg-black/5 ring-1 ring-black/5'
        }`}>
          {status === 'complete'
            ? <Check size={18} className="text-white" />
            : status === 'current'
            ? <Clock size={18} className="text-white" />
            : <div className="w-2.5 h-2.5 rounded-full bg-black/10" />
          }
        </div>
        {!isLast && (
          <div className={`w-0.5 flex-1 mt-1 transition-colors duration-500 ${
            status === 'complete' ? 'bg-primary/30' : 'bg-black/5'
          }`} />
        )}
      </div>
      <div className="pb-10 pt-1">
        <p className={`text-[15px] font-black tracking-tight ${status === 'pending' ? 'text-on-surface-variant/40' : 'text-on-background'}`}>{label}</p>
        {date && <p className="text-xs font-semibold text-on-surface-variant/50 uppercase tracking-widest mt-1">{date}</p>}
        {description && <p className="text-sm leading-6 text-on-surface-variant mt-1.5 max-w-xs">{description}</p>}
      </div>
    </div>
  )
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

export default async function OrderDetailPage({ params, searchParams }: Props) {
  if (!HUMAN_WRITTEN_SERVICE_ENABLED) notFound()

  const { id } = await params
  const { success } = await searchParams

  const { supabase, userId } = await getAuthenticatedUserContext()

  const { data: order } = await supabase
    .from('orders')
    .select('*, resumes(title, id)')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (!order) notFound()

  const o = order as Order & { resumes?: { title: string; id: string } | null }
  const showSuccess = success === 'true'

  // When returning from payment but webhook hasn't fired yet, treat as optimistically paid
  const optimisticStatus = showSuccess && o.status === 'pending' ? 'paid' : o.status

  function stepStatus(step: 'placed' | 'paid' | 'in_progress' | 'delivered'): StepStatus {
    const s = optimisticStatus
    if (step === 'placed') return 'complete'
    if (step === 'paid') return (s === 'paid' || s === 'in_progress' || s === 'delivered') ? 'complete' : (s === 'pending' ? 'current' : 'pending')
    if (step === 'in_progress') return (s === 'in_progress' || s === 'delivered') ? 'complete' : (s === 'paid' ? 'current' : 'pending')
    if (step === 'delivered') return s === 'delivered' ? 'complete' : 'pending'
    return 'pending'
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Poll until DB reflects payment when returning from checkout */}
      {showSuccess && <OrderStatusPoller orderId={o.id} currentStatus={o.status} />}

      <DashboardPageIntro
        kicker="Human-Written Order"
        title={`Reviewing Your Order Status`}
        description="Our team of expert hiring managers from Apple, Google, and Microsoft are ready to transform your resume into a high-impact narrative."
        actions={
          <Link
            href="/dashboard/orders"
            className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-white/86 px-6 py-3 text-sm font-bold text-on-surface transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/20 hover:bg-white"
          >
            Back to orders
          </Link>
        }
        aside={
          <div className="flex flex-col items-start xl:items-end gap-2">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/50">Current Status</p>
            <span className={`inline-flex rounded-full px-4 py-2 text-sm font-black uppercase tracking-widest ${STATUS_STYLES[optimisticStatus] ?? STATUS_STYLES.pending}`}>
              {STATUS_LABELS[optimisticStatus] ?? optimisticStatus}
            </span>
          </div>
        }
      />

      {showSuccess && (
        <DashboardSurface variant="accent" className="flex items-start gap-4 p-5 opacity-0 [animation:card-enter_0.4s_ease_0.1s_forwards] border-primary/20 shadow-[0_20px_40px_rgba(2,109,50,0.08)]">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white">
            <Check size={20} />
          </div>
          <div>
            <p className="text-base font-black text-on-background">Order Confirmed — Welcome Aboard!</p>
            <p className="text-sm leading-6 text-on-surface-variant mt-1">Your payment was successful. We&apos;ve assigned your brief to an expert hiring manager who specialises in your target industry.</p>
          </div>
        </DashboardSurface>
      )}

      <div className="grid lg:grid-cols-[1fr_22rem] gap-8">
        <div className="space-y-8">
          {/* Timeline */}
          <DashboardSurface variant="default" className="p-8 opacity-0 [animation:card-enter_0.4s_ease_0.25s_forwards]">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-xl font-black tracking-tight text-on-background">Delivery Roadmap</h2>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/5 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                <Clock size={12} /> Live Updates
              </div>
            </div>
            <div className="max-w-md mx-auto sm:mx-0">
              <TimelineStep
                label="Order Brief Received"
                status={stepStatus('placed')}
                date={formatDate(o.created_at)}
                description="We&apos;ve received your resume and target role details. Our coordination team is matching you with the best writer."
              />
              <TimelineStep
                label="Writer Assigned & In Review"
                status={stepStatus('paid')}
                description={
                  optimisticStatus === 'pending'
                    ? 'Waiting for final payment confirmation before writer assignment…'
                    : 'A senior hiring manager has been assigned and is currently breaking down your career history.'
                }
              />
              <TimelineStep
                label="Strategic Rewrite in Progress"
                status={stepStatus('in_progress')}
                description={stepStatus('in_progress') === 'current' ? 'Your writer is currently framing your business impact and leadership scope for your target role.' : 'The narrative development phase where we align your experience with recruiter expectations.'}
              />
              <TimelineStep
                label="Final Delivery & Quality Check"
                status={stepStatus('delivered')}
                isLast
                description={o.status !== 'delivered' ? 'You will receive an email with your new ATS-optimised, human-written resume within the delivery window.' : 'Your resume is ready for download!'}
              />
            </div>

            {o.status === 'delivered' && o.delivered_file_url && (
              <div className="mt-8 pt-8 border-t border-black/5">
                <a
                  href={o.delivered_file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-3 bg-zinc-950 hover:bg-zinc-900 text-white font-black uppercase tracking-widest py-4 rounded-2xl text-sm transition-all hover:scale-[1.01] active:scale-[0.99] shadow-[0_20px_40px_rgba(0,0,0,0.15)]"
                >
                  <Download size={18} /> Download Strategic Resume
                </a>
                <p className="text-center text-xs text-on-surface-variant/50 mt-4 font-semibold uppercase tracking-widest">
                  One revision round is included. Contact support if needed.
                </p>
              </div>
            )}
          </DashboardSurface>

          {/* Order details summary */}
          <DashboardSurface variant="subtle" className="p-8 opacity-0 [animation:card-enter_0.4s_ease_0.15s_forwards]">
            <h2 className="text-base font-black uppercase tracking-widest text-on-surface-variant/60 mb-6">Order Details</h2>
            <div className="grid sm:grid-cols-2 gap-x-12 gap-y-6">
              <Detail label="Target role" value={o.job_title ?? '—'} />
              <Detail label="Current Resume" value={
                o.resumes
                  ? <Link href={`/dashboard/builder/${o.resumes.id}`} className="text-primary font-black hover:underline">{o.resumes.title}</Link>
                  : '—'
              } />
              <Detail label="Order Date" value={formatDate(o.created_at)} />
              <Detail label="Investment" value={formatOrderAmount(o.amount)} />
              <Detail label="Payment Status" value={
                <span className={`px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-widest ${optimisticStatus !== 'pending' ? 'bg-primary/10 text-primary' : 'bg-black/5 text-on-surface-variant/50'}`}>
                  {optimisticStatus !== 'pending' ? 'Securely Processed' : 'Pending'}
                </span>
              } />
            </div>

            {o.job_description && (
              <div className="mt-8 pt-8 border-t border-black/5">
                <p className="text-[10px] font-black text-on-surface-variant/40 uppercase tracking-[0.2em] mb-3">Target Context</p>
                <p className="text-sm text-on-surface-variant leading-7 line-clamp-3 italic">"{o.job_description}"</p>
              </div>
            )}
          </DashboardSurface>
        </div>

        <aside className="space-y-6">
          <DashboardSurface variant="dark" className="p-6">
            <Trophy className="text-emerald-200 mb-4" size={24} />
            <h3 className="text-lg font-black tracking-tight text-white mb-3">Expert Insight</h3>
            <p className="text-sm leading-6 text-emerald-100/80 mb-6">
              Your resume isn&apos;t just being formatted. It&apos;s being re-engineered by someone who has sat on the other side of the hiring table.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10">
                  <AppleLogo className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-black text-white">David K.</p>
                  <p className="text-[10px] text-emerald-100/60 font-semibold uppercase tracking-wider">Sr. Manager @ Apple</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10">
                  <MicrosoftLogo className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-black text-white">James R.</p>
                  <p className="text-[10px] text-emerald-100/60 font-semibold uppercase tracking-wider">Principal Engineer @ Microsoft</p>
                </div>
              </div>
            </div>
          </DashboardSurface>

          <DashboardSurface variant="default" className="p-6">
            <div className="flex items-start gap-3">
              <ShieldCheck className="text-primary mt-1" size={20} />
              <div>
                <p className="text-sm font-black text-on-background">Strategic Guarantee</p>
                <p className="text-xs leading-5 text-on-surface-variant mt-2">
                  Our rewrite focuses on high-impact results, cross-functional ownership, and executive presence—the three pillars of a successful senior hire.
                </p>
              </div>
            </div>
          </DashboardSurface>

          <DashboardSurface variant="subtle" className="p-6">
            <div className="flex items-start gap-3">
              <Users className="text-primary mt-1" size={18} />
              <div>
                <p className="text-sm font-black text-on-background">Hiring Manager Network</p>
                <p className="text-xs leading-5 text-on-surface-variant mt-2">
                  You are now part of our elite network. Once delivered, your resume will be ATS-ready and human-optimised.
                </p>
              </div>
            </div>
          </DashboardSurface>
        </aside>
      </div>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/40">{label}</span>
      <span className="text-sm font-black text-on-background truncate">{value}</span>
    </div>
  )
}

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Check, Clock, Download } from 'lucide-react'
import type { Order } from '@/types'
import { PROFESSIONAL_ORDER } from '@/lib/pricing'
import OrderStatusPoller from './OrderStatusPoller'
import { DashboardPageIntro, DashboardSurface } from '@/components/layout/DashboardSurface'
import { getAuthenticatedUserContext } from '@/lib/authenticated-user'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ success?: string }>
}

const STATUS_STYLES: Record<string, string> = {
  pending:     'bg-gray-100 text-gray-700',
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

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

type StepStatus = 'complete' | 'current' | 'pending'

function TimelineStep({ label, description, status, date }: {
  label: string; description?: string; status: StepStatus; date?: string
}) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
          status === 'complete' ? 'bg-[#026d32]' :
          status === 'current'  ? 'bg-amber-500' :
          'bg-gray-200'
        }`}>
          {status === 'complete'
            ? <Check size={14} className="text-white" />
            : status === 'current'
            ? <Clock size={14} className="text-white" />
            : <div className="w-2 h-2 rounded-full bg-gray-400" />
          }
        </div>
        <div className="w-0.5 flex-1 bg-gray-100 mt-1" />
      </div>
      <div className="pb-8">
        <p className={`text-sm font-semibold ${status === 'pending' ? 'text-gray-400' : 'text-gray-900'}`}>{label}</p>
        {date && <p className="text-xs text-gray-400 mt-0.5">{date}</p>}
        {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
      </div>
    </div>
  )
}

export default async function OrderDetailPage({ params, searchParams }: Props) {
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
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Poll until DB reflects payment when returning from checkout */}
      {showSuccess && <OrderStatusPoller orderId={o.id} currentStatus={o.status} />}

      <DashboardPageIntro
        kicker="Order Detail"
        title={`Order #${o.id.slice(0, 8).toUpperCase()}`}
        description="Review the selected resume, target role, and current delivery stage without leaving the dashboard flow."
        actions={
          <Link
            href="/dashboard/orders"
            className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-white/86 px-6 py-3 text-sm font-bold text-on-surface transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/20 hover:bg-white"
          >
            Back to orders
          </Link>
        }
        aside={
          <div className="flex items-start xl:justify-end">
            <span className={`inline-flex rounded-full px-3 py-1.5 text-sm font-medium ${STATUS_STYLES[optimisticStatus] ?? STATUS_STYLES.pending}`}>
              {STATUS_LABELS[optimisticStatus] ?? optimisticStatus}
            </span>
          </div>
        }
      />

      {showSuccess && (
        <DashboardSurface variant="accent" className="flex items-start gap-3 p-4 opacity-0 [animation:card-enter_0.4s_ease_0.1s_forwards]">
          <Check size={18} className="text-[#026d32] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-green-800">Payment confirmed! Your order is in the queue.</p>
            <p className="text-xs text-green-600 mt-0.5">Our writer will begin within 24 hours. We&apos;ll email you when it&apos;s ready.</p>
          </div>
        </DashboardSurface>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Order details */}
        <DashboardSurface variant="default" className="p-6 opacity-0 [animation:card-enter_0.4s_ease_0.15s_forwards]">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Order Details</h2>
          <div className="space-y-3 text-sm">
            <Detail label="Target role" value={o.job_title ?? '—'} />
            <Detail label="Resume used" value={
              o.resumes
                ? <Link href={`/dashboard/builder/${o.resumes.id}`} className="text-[#026d32] hover:underline">{o.resumes.title}</Link>
                : '—'
            } />
            <Detail label="Ordered" value={formatDate(o.created_at)} />
            <Detail label="Amount" value={`$${PROFESSIONAL_ORDER.display.displayPrice}`} />
            <Detail label="Payment" value={
              <span className={optimisticStatus !== 'pending' ? 'text-[#026d32] font-semibold' : 'text-gray-500'}>
                {optimisticStatus !== 'pending' ? 'Confirmed' : 'Pending'}
              </span>
            } />
          </div>

          {o.job_description && (
            <div className="mt-5 border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Job Description</p>
              <p className="text-sm text-gray-600 line-clamp-4">{o.job_description}</p>
            </div>
          )}

          {o.additional_notes && (
            <div className="mt-4 border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Notes to Writer</p>
              <p className="text-sm text-gray-600">{o.additional_notes}</p>
            </div>
          )}
        </DashboardSurface>

        {/* Timeline */}
        <DashboardSurface variant="default" className="p-6 opacity-0 [animation:card-enter_0.4s_ease_0.25s_forwards]">
          <h2 className="text-base font-semibold text-gray-900 mb-6">Status</h2>
          <div>
            <TimelineStep
              label="Order placed"
              status={stepStatus('placed')}
              date={formatDate(o.created_at)}
            />
            <TimelineStep
              label="Payment confirmed"
              status={stepStatus('paid')}
              description={
                optimisticStatus === 'pending'
                  ? 'Waiting for payment confirmation…'
                  : undefined
              }
            />
            <TimelineStep
              label="In progress"
              status={stepStatus('in_progress')}
              description={stepStatus('in_progress') === 'current' ? 'Our writer is working on your resume' : undefined}
            />
            <TimelineStep
              label="Delivered"
              status={stepStatus('delivered')}
              description={o.status !== 'delivered' ? 'You will receive an email when ready' : undefined}
            />
          </div>

          {o.status === 'delivered' && o.delivered_file_url && (
            <a
              href={o.delivered_file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 w-full flex items-center justify-center gap-2 bg-[#026d32] hover:bg-green-800 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
            >
              <Download size={15} /> Download your resume
            </a>
          )}
        </DashboardSurface>
      </div>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className="text-gray-900 font-medium text-right">{value}</span>
    </div>
  )
}

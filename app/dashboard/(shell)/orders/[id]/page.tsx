import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Check, Clock, AlertCircle } from 'lucide-react'
import type { Order } from '@/types'
import { PROFESSIONAL_ORDER } from '@/lib/pricing'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ success?: string }>
}

const STATUS_STYLES: Record<string, string> = {
  pending:     'bg-gray-100 text-gray-700',
  paid:        'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  delivered:   'bg-green-100 text-green-700',
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
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          status === 'complete' ? 'bg-green-500' :
          status === 'current'  ? 'bg-indigo-600' :
          'bg-gray-200'
        }`}>
          {status === 'complete'
            ? <Check size={14} className="text-white" />
            : status === 'current'
            ? <Clock size={14} className="text-white" />
            : <div className="w-2 h-2 rounded-full bg-gray-400" />
          }
        </div>
        <div className="w-0.5 flex-1 bg-gray-200 mt-1" />
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

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: order } = await supabase
    .from('orders')
    .select('*, resumes(title, id)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!order) notFound()

  const o = order as Order & { resumes?: { title: string; id: string } | null }
  const showSuccess = success === 'true'

  function stepStatus(step: 'placed' | 'paid' | 'in_progress' | 'delivered'): StepStatus {
    const s = o.status
    if (step === 'placed') return 'complete'
    if (step === 'paid') return (s === 'paid' || s === 'in_progress' || s === 'delivered') ? 'complete' : (s === 'pending' ? 'current' : 'pending')
    if (step === 'in_progress') return (s === 'in_progress' || s === 'delivered') ? 'complete' : (s === 'paid' ? 'current' : 'pending')
    if (step === 'delivered') return s === 'delivered' ? 'complete' : 'pending'
    return 'pending'
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Link href="/dashboard/orders" className="text-sm text-gray-500 hover:text-gray-700 block mb-4">
        ← My Orders
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Order #{o.id.slice(0, 8).toUpperCase()}
          </h1>
        </div>
        <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${STATUS_STYLES[o.status] ?? STATUS_STYLES.pending}`}>
          {STATUS_LABELS[o.status] ?? o.status}
        </span>
      </div>

      {showSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <Check size={18} className="text-green-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-green-800">🎉 Payment confirmed! Your order is in the queue.</p>
            <p className="text-xs text-green-600 mt-0.5">Our writer will begin within 24 hours.</p>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Order details */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Order Details</h2>
          <div className="space-y-3 text-sm">
            <Detail label="Target role" value={o.job_title ?? '—'} />
            <Detail label="Resume used" value={
              o.resumes
                ? <Link href={`/dashboard/resumes/${o.resumes.id}`} className="text-indigo-600 hover:underline">{o.resumes.title}</Link>
                : '—'
            } />
            <Detail label="Ordered" value={formatDate(o.created_at)} />
            <Detail label="Amount" value={`$${PROFESSIONAL_ORDER.display.displayPrice}`} />
            <Detail label="Payment" value={
              <span className={o.status !== 'pending' ? 'text-green-600' : 'text-gray-500'}>
                {o.status !== 'pending' ? 'Confirmed' : 'Pending'}
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
        </div>

        {/* Timeline */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
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
              description={o.status === 'pending' ? 'Waiting for payment' : undefined}
            />
            <TimelineStep
              label="In progress"
              status={stepStatus('in_progress')}
              description={stepStatus('in_progress') === 'current' ? 'Our writer will begin shortly' : undefined}
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
              className="mt-2 w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
            >
              Download your resume →
            </a>
          )}
        </div>
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

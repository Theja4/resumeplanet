'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { getAllPayouts, updatePayoutStatus } from '@/lib/affiliate-server'
import { DashboardSurface } from '@/components/layout/DashboardSurface'
import { getAdminSession } from '@/lib/admin-auth'

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatUsd(amount: number) {
  return `$${amount.toFixed(2)}`
}

async function markPaid(formData: FormData) {
  'use server'
  const adminSession = await getAdminSession()
  if (!adminSession) {
    redirect('/admin/login')
  }

  const id = formData.get('id') as string
  const supabase = createServiceRoleClient()
  await updatePayoutStatus(supabase, id, 'paid')
  revalidatePath('/admin/payouts')
  revalidatePath('/admin/affiliates')
  revalidatePath('/admin/influencers')
  revalidatePath('/affiliate/dashboard')
}

async function markRejected(formData: FormData) {
  'use server'
  const adminSession = await getAdminSession()
  if (!adminSession) {
    redirect('/admin/login')
  }

  const id = formData.get('id') as string
  const supabase = createServiceRoleClient()
  await updatePayoutStatus(supabase, id, 'rejected')
  revalidatePath('/admin/payouts')
  revalidatePath('/admin/affiliates')
  revalidatePath('/admin/influencers')
  revalidatePath('/affiliate/dashboard')
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'border-amber-200 bg-amber-50 text-amber-700',
  paid: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  rejected: 'border-rose-200 bg-rose-50 text-rose-700',
}

export default async function AdminPayoutsPage() {
  const supabase = createServiceRoleClient()
  const payouts = await getAllPayouts(supabase)

  const pending = payouts.filter(p => p.status === 'pending')
  const totalPending = pending.reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">Affiliate Program</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-on-background">Payout Requests</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          Review and action affiliate payout requests. Mark as paid after sending via PayPal.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <DashboardSurface variant="subtle" className="px-5 py-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Pending requests</p>
          <p className="mt-3 text-3xl font-black tracking-tight text-amber-600">{pending.length}</p>
        </DashboardSurface>
        <DashboardSurface variant="subtle" className="px-5 py-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Total pending amount</p>
          <p className="mt-3 text-3xl font-black tracking-tight text-on-background">{formatUsd(totalPending)}</p>
        </DashboardSurface>
        <DashboardSurface variant="subtle" className="px-5 py-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">All-time paid out</p>
          <p className="mt-3 text-3xl font-black tracking-tight text-primary">
            {formatUsd(payouts.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0))}
          </p>
        </DashboardSurface>
      </div>

      {pending.length > 0 && (
        <DashboardSurface variant="default" className="overflow-hidden">
          <div className="border-b border-black/5 px-5 py-5 sm:px-6">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-600">Action required</p>
            <h2 className="mt-2 text-xl font-black tracking-tight text-on-background">Pending Payouts</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-black/5 bg-white/70">
                  {['Affiliate', 'Code', 'PayPal Email', 'Amount', 'Requested', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-black uppercase tracking-[0.16em] text-on-surface-variant/65 sm:px-6">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pending.map(payout => (
                  <tr key={payout.id} className="border-b border-black/5 last:border-b-0">
                    <td className="px-5 py-4 sm:px-6">
                      <p className="font-semibold text-on-background">{payout.affiliate_name}</p>
                      <p className="text-xs text-on-surface-variant">{payout.affiliate_email}</p>
                    </td>
                    <td className="px-5 py-4 font-mono text-sm font-bold text-on-background sm:px-6">
                      {payout.affiliate_discount_code}
                    </td>
                    <td className="px-5 py-4 text-on-surface-variant sm:px-6">{payout.paypal_email}</td>
                    <td className="px-5 py-4 font-black text-on-background sm:px-6">{formatUsd(payout.amount)}</td>
                    <td className="px-5 py-4 text-on-surface-variant sm:px-6">{formatDate(payout.requested_at)}</td>
                    <td className="px-5 py-4 sm:px-6">
                      <div className="flex items-center gap-2">
                        <form action={markPaid}>
                          <input type="hidden" name="id" value={payout.id} />
                          <button
                            type="submit"
                            className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-white transition hover:bg-emerald-700"
                          >
                            Mark Paid
                          </button>
                        </form>
                        <form action={markRejected}>
                          <input type="hidden" name="id" value={payout.id} />
                          <button
                            type="submit"
                            className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-rose-700 transition hover:bg-rose-100"
                          >
                            Reject
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DashboardSurface>
      )}

      <DashboardSurface variant="default" className="overflow-hidden">
        <div className="border-b border-black/5 px-5 py-5 sm:px-6">
          <h2 className="text-xl font-black tracking-tight text-on-background">All Payout History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-black/5 bg-white/70">
                {['Affiliate', 'Code', 'PayPal Email', 'Amount', 'Requested', 'Status'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-black uppercase tracking-[0.16em] text-on-surface-variant/65 sm:px-6">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payouts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-on-surface-variant sm:px-6">
                    No payout requests yet.
                  </td>
                </tr>
              ) : (
                payouts.map(payout => (
                  <tr key={payout.id} className="border-b border-black/5 last:border-b-0">
                    <td className="px-5 py-4 sm:px-6">
                      <p className="font-semibold text-on-background">{payout.affiliate_name}</p>
                      <p className="text-xs text-on-surface-variant">{payout.affiliate_email}</p>
                    </td>
                    <td className="px-5 py-4 font-mono text-sm font-bold text-on-background sm:px-6">
                      {payout.affiliate_discount_code}
                    </td>
                    <td className="px-5 py-4 text-on-surface-variant sm:px-6">{payout.paypal_email}</td>
                    <td className="px-5 py-4 font-black text-on-background sm:px-6">{formatUsd(payout.amount)}</td>
                    <td className="px-5 py-4 text-on-surface-variant sm:px-6">{formatDate(payout.requested_at)}</td>
                    <td className="px-5 py-4 sm:px-6">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${STATUS_STYLES[payout.status] ?? ''}`}>
                        {payout.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </DashboardSurface>
    </div>
  )
}

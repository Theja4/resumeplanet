import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ShoppingBag, Plus, ArrowRight } from 'lucide-react'
import type { Order } from '@/types'
import { PROFESSIONAL_ORDER } from '@/lib/pricing'
import { DashboardPageIntro, DashboardSurface } from '@/components/layout/DashboardSurface'

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

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default async function OrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const typedOrders = (orders ?? []) as Order[]

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <DashboardPageIntro
        kicker="Professional Rewrite"
        title="Track every rewrite order from one place."
        description="See where each order sits, when it was placed, and what needs follow-up, all inside the same premium dashboard shell."
        actions={
          <Link
            href="/dashboard/orders/new"
            className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-6 py-3 text-sm font-black uppercase tracking-[0.16em] text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-zinc-900"
          >
            <Plus size={15} /> New order
          </Link>
        }
      />

      {typedOrders.length === 0 ? (
        <DashboardSurface variant="default" className="py-20 text-center opacity-0 [animation:card-enter_0.4s_ease_0.1s_forwards]">
          <ShoppingBag size={40} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-lg font-semibold text-gray-700">No orders yet</h2>
          <p className="text-sm text-gray-400 mt-2 max-w-sm mx-auto">
            Have a professional recruiter rewrite your resume in 2–3 business days for ${PROFESSIONAL_ORDER.display.displayPrice}.
          </p>
          <Link
            href="/dashboard/orders/new"
            className="mt-5 inline-flex items-center gap-2 bg-[#026d32] hover:bg-green-800 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            Order now <ArrowRight size={14} />
          </Link>
        </DashboardSurface>
      ) : (
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
                  <td className="px-5 py-4 text-gray-700">${PROFESSIONAL_ORDER.display.displayPrice}</td>
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
      )}
    </div>
  )
}

import { DashboardPageIntro, DashboardSurface } from '@/components/layout/DashboardSurface'

export default function AdminBillingPage() {
  return (
    <div className="space-y-6">
      <DashboardPageIntro
        kicker="Billing"
        title="Billing oversight shell is ready."
        description="This page will be used for subscription health, one-time order tracking, and revenue status once the data views are connected."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <DashboardSurface variant="default" className="px-6 py-6">
          <p className="text-lg font-black tracking-tight text-on-background">Subscription overview</p>
          <p className="mt-2 text-sm leading-7 text-on-surface-variant">Monthly and annual plan visibility will land here.</p>
        </DashboardSurface>

        <DashboardSurface variant="default" className="px-6 py-6">
          <p className="text-lg font-black tracking-tight text-on-background">Order management</p>
          <p className="mt-2 text-sm leading-7 text-on-surface-variant">Professional resume orders and payment status will land here.</p>
        </DashboardSurface>
      </div>
    </div>
  )
}

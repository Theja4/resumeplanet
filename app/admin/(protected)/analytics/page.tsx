import { DashboardPageIntro, DashboardSurface } from '@/components/layout/DashboardSurface'

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-6">
      <DashboardPageIntro
        kicker="Analytics"
        title="Analytics shell is ready."
        description="We can wire charts, funnel metrics, ATS scan volume, and signup conversion data into this workspace next."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {['Visitors', 'Signups', 'ATS scans'].map(item => (
          <DashboardSurface key={item} variant="subtle" className="px-5 py-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">{item}</p>
            <p className="mt-3 text-2xl font-black tracking-tight text-zinc-900">Pending integration</p>
          </DashboardSurface>
        ))}
      </div>
    </div>
  )
}

import { DashboardSurface } from '@/components/layout/DashboardSurface'

export default function AffiliateLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <DashboardSurface variant="default" className="h-44 animate-pulse" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <DashboardSurface variant="subtle" className="h-28 animate-pulse" />
        <DashboardSurface variant="subtle" className="h-28 animate-pulse" />
        <DashboardSurface variant="subtle" className="h-28 animate-pulse" />
        <DashboardSurface variant="accent" className="h-28 animate-pulse" />
      </div>
      <DashboardSurface variant="default" className="h-80 animate-pulse" />
    </div>
  )
}

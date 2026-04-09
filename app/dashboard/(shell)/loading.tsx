import { DashboardSurface } from '@/components/layout/DashboardSurface'

export default function DashboardShellLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <DashboardSurface variant="default" className="h-44 animate-pulse">
        <div className="h-full w-full" />
      </DashboardSurface>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <DashboardSurface variant="subtle" className="h-28 animate-pulse">
          <div className="h-full w-full" />
        </DashboardSurface>
        <DashboardSurface variant="subtle" className="h-28 animate-pulse">
          <div className="h-full w-full" />
        </DashboardSurface>
        <DashboardSurface variant="dark" className="h-28 animate-pulse">
          <div className="h-full w-full" />
        </DashboardSurface>
      </div>
      <DashboardSurface variant="default" className="h-80 animate-pulse">
        <div className="h-full w-full" />
      </DashboardSurface>
    </div>
  )
}

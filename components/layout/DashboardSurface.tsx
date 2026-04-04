import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type SurfaceVariant = 'default' | 'accent' | 'dark' | 'subtle'

const SURFACE_VARIANTS: Record<SurfaceVariant, string> = {
  default:
    'relative overflow-hidden rounded-[1.75rem] border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.94),rgba(243,247,244,0.88))] shadow-[0_24px_60px_rgba(25,28,29,0.08)] backdrop-blur-2xl',
  accent:
    'relative overflow-hidden rounded-[1.75rem] border border-primary/10 bg-[linear-gradient(145deg,rgba(236,250,240,0.96),rgba(255,255,255,0.92))] shadow-[0_24px_56px_rgba(2,109,50,0.12)] backdrop-blur-2xl',
  dark:
    'relative overflow-hidden rounded-[1.75rem] border border-emerald-200/10 bg-[linear-gradient(145deg,rgba(12,16,14,0.98),rgba(18,30,23,0.95))] text-white shadow-[0_28px_70px_rgba(5,12,8,0.28)]',
  subtle:
    'relative overflow-hidden rounded-[1.5rem] border border-black/5 bg-white/86 shadow-[0_18px_45px_rgba(25,28,29,0.05)] backdrop-blur-xl',
}

export function DashboardSurface({
  children,
  className,
  variant = 'default',
}: {
  children: ReactNode
  className?: string
  variant?: SurfaceVariant
}) {
  return <div className={cn(SURFACE_VARIANTS[variant], className)}>{children}</div>
}

export function DashboardPageIntro({
  kicker,
  title,
  description,
  actions,
  aside,
  className,
}: {
  kicker?: string
  title: string
  description?: string
  actions?: ReactNode
  aside?: ReactNode
  className?: string
}) {
  return (
    <DashboardSurface
      variant="default"
      className={cn('px-6 py-7 sm:px-8 sm:py-8 opacity-0 [animation:card-enter_0.5s_ease_forwards]', className)}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top_left,rgba(163,255,179,0.28),transparent_55%),radial-gradient(circle_at_top_right,rgba(2,109,50,0.08),transparent_40%)]" />
      <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(14rem,18rem)] xl:items-center">
        <div className="space-y-4">
          {kicker ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-primary-container/50 bg-primary-container/35 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-on-primary-container">
              {kicker}
            </span>
          ) : null}
          <div className="space-y-3">
            <h1 className="max-w-3xl text-3xl font-black tracking-tight text-on-background sm:text-4xl xl:text-5xl">
              {title}
            </h1>
            {description ? (
              <p className="max-w-2xl text-sm leading-7 text-on-surface-variant sm:text-base">
                {description}
              </p>
            ) : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-3 pt-1">{actions}</div> : null}
        </div>
        {aside ? (
          <div className="border-t border-black/5 pt-4 xl:self-stretch xl:border-l xl:border-t-0 xl:pt-0 xl:pl-6">
            <div className="flex h-full flex-col justify-center gap-3">{aside}</div>
          </div>
        ) : null}
      </div>
    </DashboardSurface>
  )
}

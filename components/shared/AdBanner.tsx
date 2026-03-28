'use client'

// TODO: replace with real ad network (e.g. Google AdSense, Carbon Ads)
// This is a placeholder that simulates ad placements for free-tier users.

import { usePlan } from '@/lib/context/PlanContext'

const SIZE_STYLES: Record<AdSize, { width: number; height: number; label: string }> = {
  leaderboard: { width: 728, height: 90, label: '728×90' },
  rectangle: { width: 300, height: 250, label: '300×250' },
  banner: { width: 468, height: 60, label: '468×60' },
}

type AdSize = 'leaderboard' | 'rectangle' | 'banner'

interface AdBannerProps {
  size: AdSize
  className?: string
}

export default function AdBanner({ size, className = '' }: AdBannerProps) {
  const { isPro } = usePlan()

  // Never render for Pro users
  if (isPro) return null

  const { width, height, label } = SIZE_STYLES[size]

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 ${className}`}
      style={{ maxWidth: width, height }}
      aria-label="Advertisement placeholder"
    >
      <span className="text-[11px] font-medium text-gray-400 uppercase tracking-widest">
        Advertisement
      </span>
      <span className="mt-1 text-[10px] text-gray-300">{label}</span>
    </div>
  )
}

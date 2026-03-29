import { cn } from '@/lib/utils'
import type { FormattedPrice } from '@/lib/pricing'

interface Props {
  display: FormattedPrice
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showInterval?: boolean
  showSavings?: boolean
  showPerMonth?: boolean
  className?: string
}

const SIZE_CONFIG = {
  sm: { main: 'text-xl',  actual: 'text-sm',   interval: 'text-xs'  },
  md: { main: 'text-2xl', actual: 'text-base',  interval: 'text-sm'  },
  lg: { main: 'text-4xl', actual: 'text-xl',    interval: 'text-base'},
  xl: { main: 'text-6xl', actual: 'text-2xl',   interval: 'text-lg'  },
}

export default function PriceDisplay({
  display,
  size = 'md',
  showInterval = true,
  showSavings = true,
  showPerMonth = true,
  className,
}: Props) {
  const { main: mainSize, actual: actualSize, interval: intervalSize } = SIZE_CONFIG[size]

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Main price row */}
      <div className="flex items-baseline gap-2 flex-wrap">
        {/* Actual price (struck through) — only rendered when hasDiscount is true */}
        {display.hasDiscount && display.actual && (
          <span className={cn('line-through text-gray-400', actualSize)}>
            {display.actual}
          </span>
        )}

        {/* Display price */}
        <span className={cn('font-bold text-gray-900', mainSize)}>
          {display.main}
        </span>

        {/* Interval */}
        {showInterval && (
          <span className={cn('text-gray-500 font-normal', intervalSize)}>
            /{display.interval}
          </span>
        )}
      </div>

      {/* Per month equivalent (for annual plans) */}
      {showPerMonth && display.perMonth && (
        <p className="text-sm text-gray-500 mt-0.5">
          {display.perMonth} billed annually
        </p>
      )}

      {/* Savings note */}
      {showSavings && display.savingsNote && (
        <p className="text-sm text-green-600 mt-0.5 font-medium">
          {display.savingsNote}
        </p>
      )}
    </div>
  )
}

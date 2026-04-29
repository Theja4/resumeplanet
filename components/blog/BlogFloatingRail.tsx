import type { ReactNode } from 'react'

export default function BlogFloatingRail({
  children,
  topOffset = 124,
  bottomOffset = 32,
  contentClassName = '',
}: {
  children: ReactNode
  topOffset?: number
  bottomOffset?: number
  contentClassName?: string
}) {
  const maxHeight = `calc(100vh - ${topOffset + bottomOffset}px)`

  return (
    <div
      className={`sticky overflow-y-auto overscroll-contain ${contentClassName}`.trim()}
      style={{ top: topOffset, maxHeight }}
    >
      {children}
    </div>
  )
}

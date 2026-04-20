'use client'

import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'

type RailMode = 'static' | 'fixed' | 'bottom'

interface FloatingRailState {
  mode: RailMode
  left: number
  width: number
  minHeight: number
  absoluteTop: number
}

const DEFAULT_STATE: FloatingRailState = {
  mode: 'static',
  left: 0,
  width: 0,
  minHeight: 0,
  absoluteTop: 0,
}

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
  const containerRef = useRef<HTMLDivElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const [state, setState] = useState<FloatingRailState>(DEFAULT_STATE)
  const stateRef = useRef<FloatingRailState>(DEFAULT_STATE)

  useEffect(() => {
    let frame = 0

    const syncPosition = () => {
      const container = containerRef.current
      const content = contentRef.current
      if (!container || !content) return

      const containerRect = container.getBoundingClientRect()
      const scrollY = window.scrollY || window.pageYOffset
      const containerTop = scrollY + containerRect.top
      const containerHeight = container.offsetHeight
      const contentHeight = content.offsetHeight
      const width = containerRect.width
      const left = containerRect.left
      const viewportTop = scrollY + topOffset
      const bottomLimit = containerTop + containerHeight - contentHeight

      let mode: RailMode = 'static'
      if (viewportTop > containerTop) {
        mode = viewportTop >= bottomLimit ? 'bottom' : 'fixed'
      }

      const nextState = {
        mode,
        left,
        width,
        minHeight: contentHeight,
        absoluteTop: Math.max(0, containerHeight - contentHeight),
      }
      const previousState = stateRef.current
      const hasChanged =
        previousState.mode !== nextState.mode ||
        Math.abs(previousState.left - nextState.left) > 0.5 ||
        Math.abs(previousState.width - nextState.width) > 0.5 ||
        Math.abs(previousState.minHeight - nextState.minHeight) > 0.5 ||
        Math.abs(previousState.absoluteTop - nextState.absoluteTop) > 0.5

      if (!hasChanged) return

      stateRef.current = nextState
      setState(nextState)
    }

    const requestSync = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        syncPosition()
      })
    }

    requestSync()

    const resizeObserver = new ResizeObserver(() => {
      requestSync()
    })

    if (containerRef.current) resizeObserver.observe(containerRef.current)
    if (contentRef.current) resizeObserver.observe(contentRef.current)

    window.addEventListener('scroll', requestSync, { passive: true })
    window.addEventListener('resize', requestSync)

    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      window.removeEventListener('scroll', requestSync)
      window.removeEventListener('resize', requestSync)
    }
  }, [bottomOffset, topOffset])

  const floatingStyle =
    state.mode === 'fixed'
      ? {
          position: 'fixed' as const,
          top: topOffset,
          left: state.left,
          width: state.width,
        }
      : state.mode === 'bottom'
        ? {
            position: 'absolute' as const,
            top: state.absoluteTop,
            left: 0,
            width: '100%',
          }
        : {
          position: 'relative' as const,
        }

  return (
    <div
      ref={containerRef}
      className="relative h-full"
      style={{ minHeight: state.minHeight || undefined }}
    >
      <div ref={contentRef} className={contentClassName} style={floatingStyle}>
        {children}
      </div>
    </div>
  )
}

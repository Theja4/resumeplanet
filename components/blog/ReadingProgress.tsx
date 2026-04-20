'use client'

import { useEffect, useRef, useState } from 'react'

export default function ReadingProgress() {
  const [pct, setPct] = useState(0)
  const frameRef = useRef<number | null>(null)
  const lastPctRef = useRef(0)

  useEffect(() => {
    const syncProgress = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight
      const nextPct = total > 0 ? Math.min((window.scrollY / total) * 100, 100) : 0

      if (Math.abs(nextPct - lastPctRef.current) < 0.1) {
        return
      }

      lastPctRef.current = nextPct
      setPct(nextPct)
    }

    const onScroll = () => {
      if (frameRef.current !== null) return

      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null
        syncProgress()
      })
    }

    syncProgress()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current)
      }
    }
  }, [])

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] h-[3px] bg-zinc-100/80">
      <div
        className="h-full origin-left bg-gradient-to-r from-[#026d32] via-[#30c06b] to-[#A3FFB3]"
        style={{ width: `${pct}%`, transition: 'width 80ms linear' }}
      />
    </div>
  )
}

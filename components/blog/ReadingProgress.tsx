'use client'

import { useEffect, useState } from 'react'

export default function ReadingProgress() {
  const [pct, setPct] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight
      setPct(total > 0 ? Math.min((window.scrollY / total) * 100, 100) : 0)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
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

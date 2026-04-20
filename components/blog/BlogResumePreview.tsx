'use client'

import { useEffect, useRef, useState } from 'react'
import UniversalTemplatePreview from '@/components/templates/UniversalTemplatePreview'
import type { ResumeData, UniversalConfig } from '@/types'

const PAGE_WIDTH = 794
const PAGE_HEIGHT = 1123

export default function BlogResumePreview({
  data,
  config,
  sectionOrder,
  sidebarSectionOrder,
}: {
  data: ResumeData
  config: UniversalConfig
  sectionOrder?: string[]
  sidebarSectionOrder?: string[]
}) {
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const [scale, setScale] = useState(0.6)
  const [contentHeight, setContentHeight] = useState(PAGE_HEIGHT)

  useEffect(() => {
    let frame = 0

    const syncPreview = () => {
      const viewport = viewportRef.current
      const content = contentRef.current
      if (!viewport || !content) return

      const nextScale = Math.min(1, viewport.clientWidth / PAGE_WIDTH)
      const nextHeight = Math.max(PAGE_HEIGHT, content.scrollHeight)

      setScale(previous => (Math.abs(previous - nextScale) < 0.002 ? previous : nextScale))
      setContentHeight(previous => (Math.abs(previous - nextHeight) < 2 ? previous : nextHeight))
    }

    const requestSync = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        syncPreview()
      })
    }

    requestSync()

    const resizeObserver = new ResizeObserver(() => {
      requestSync()
    })

    if (viewportRef.current) resizeObserver.observe(viewportRef.current)
    if (contentRef.current) resizeObserver.observe(contentRef.current)

    window.addEventListener('resize', requestSync)

    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      window.removeEventListener('resize', requestSync)
    }
  }, [])

  return (
    <div ref={viewportRef} className="mx-auto w-full max-w-[560px]">
      <div
        className="mx-auto overflow-hidden rounded-[1rem] bg-white shadow-[0_20px_40px_rgba(20,28,24,0.16)]"
        style={{
          width: PAGE_WIDTH * scale,
          height: contentHeight * scale,
        }}
      >
        <div
          ref={contentRef}
          className="origin-top-left"
          style={{
            width: PAGE_WIDTH,
            transform: `scale(${scale})`,
            pointerEvents: 'none',
          }}
        >
          <UniversalTemplatePreview
            data={data}
            config={config}
            sectionOrder={sectionOrder}
            sidebarSectionOrder={sidebarSectionOrder}
          />
        </div>
      </div>
    </div>
  )
}

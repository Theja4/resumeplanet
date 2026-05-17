'use client'

import { useEffect, useState } from 'react'
import { ResumeLioTemplateRenderer } from '@/components/resume-lio/ResumeLioTemplateRenderer'
import type { ResumeData, ResumeLioTemplateId, ResumeLioSocialLinks } from '@/types'

type ZipRenderPayload = {
  data: ResumeData
  templateId: ResumeLioTemplateId
  socialLinks: ResumeLioSocialLinks
  imageOverrides?: Record<string, string>
}

declare global {
  interface Window {
    __REZOOMED_ZIP_PAYLOAD__?: ZipRenderPayload
  }
}

export default function ResumeLioZipRenderClient() {
  const [payload, setPayload] = useState<ZipRenderPayload | null>(() => {
    if (typeof window !== 'undefined' && window.__REZOOMED_ZIP_PAYLOAD__?.data) {
      return window.__REZOOMED_ZIP_PAYLOAD__
    }
    return null
  })

  useEffect(() => {
    function handlePayload(event: Event) {
      const e = event as CustomEvent<ZipRenderPayload>
      if (e.detail?.data) setPayload(e.detail)
    }
    window.addEventListener('rezoomed:zip-payload', handlePayload)
    return () => window.removeEventListener('rezoomed:zip-payload', handlePayload)
  }, [])

  useEffect(() => {
    delete document.documentElement.dataset.rezoomedZipReady
    if (!payload) return
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        document.documentElement.dataset.rezoomedZipReady = '1'
      })
    })
  }, [payload])

  return (
    <>
      <style jsx global>{`
        html, body { margin: 0 !important; padding: 0 !important; overflow: visible !important; }
      `}</style>
      <div id="zip-render-root">
        {payload && (
          <ResumeLioTemplateRenderer
            templateId={payload.templateId}
            data={payload.data}
            socialLinks={payload.socialLinks}
            imageOverrides={payload.imageOverrides}
          />
        )}
      </div>
    </>
  )
}

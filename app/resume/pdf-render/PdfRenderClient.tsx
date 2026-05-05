'use client'

import { useEffect, useState } from 'react'
import UniversalTemplate from '@/components/templates/UniversalTemplate'
import { sanitizeUniversalConfig } from '@/lib/templateOptions'
import type { ResumeData, UniversalConfig } from '@/types'

type PdfRenderPayload = {
  data: ResumeData
  config?: Partial<UniversalConfig>
  sectionOrder?: string[]
  sidebarSectionOrder?: string[]
}

declare global {
  interface Window {
    __REZOOMED_PDF_PAYLOAD__?: PdfRenderPayload
  }
}

export default function PdfRenderClient() {
  const [payload, setPayload] = useState<PdfRenderPayload | null>(null)

  useEffect(() => {
    function handlePayload(event: Event) {
      const customEvent = event as CustomEvent<PdfRenderPayload>

      if (!customEvent.detail?.data) {
        return
      }

      setPayload(customEvent.detail)
    }

    window.addEventListener('rezoomed:pdf-payload', handlePayload)

    if (window.__REZOOMED_PDF_PAYLOAD__?.data) {
      setPayload(window.__REZOOMED_PDF_PAYLOAD__)
    }

    return () => {
      window.removeEventListener('rezoomed:pdf-payload', handlePayload)
      delete document.documentElement.dataset.rezoomedPdfReady
    }
  }, [])

  useEffect(() => {
    delete document.documentElement.dataset.rezoomedPdfReady

    if (!payload) {
      return
    }

    const frame = window.requestAnimationFrame(() => {
      document.documentElement.dataset.rezoomedPdfReady = '1'
    })

    return () => {
      window.cancelAnimationFrame(frame)
      delete document.documentElement.dataset.rezoomedPdfReady
    }
  }, [payload])

  const config = sanitizeUniversalConfig(payload?.config)

  return (
    <>
      <style jsx global>{`
        @page {
          size: A4;
          margin: 12.7mm 0 12.7mm 0;
        }

        @page:first {
          margin: 0 0 12.7mm 0;
        }

        html,
        body {
          margin: 0 !important;
          padding: 0 !important;
          width: 210mm;
          min-height: 297mm;
          overflow: visible !important;
          background: #ffffff !important;
        }

        body > *:not(.resume-pdf-render-layer) {
          visibility: hidden !important;
        }

        .resume-pdf-render-layer,
        .resume-pdf-render-layer * {
          visibility: visible !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .resume-pdf-render-layer {
          position: relative;
          z-index: 2147483647;
          width: 794px;
          min-height: 1123px;
          background: #ffffff;
        }

        .resume-pdf-render-layer h2,
        .resume-pdf-render-layer [data-resume-section-heading] {
          break-after: avoid;
          page-break-after: avoid;
        }

        .resume-pdf-render-layer li,
        .resume-pdf-render-layer p,
        .resume-pdf-render-layer [data-resume-path] {
          break-inside: avoid;
          page-break-inside: avoid;
        }

        .resume-pdf-loading {
          width: 794px;
          min-height: 1123px;
          background: #ffffff;
        }
      `}</style>

      <main className="resume-pdf-render-layer">
        {payload ? (
          <UniversalTemplate
            data={payload.data}
            isEditing={false}
            onFieldChange={() => {}}
            sectionOrder={payload.sectionOrder}
            sidebarSectionOrder={payload.sidebarSectionOrder}
            config={config}
            highlightedSectionId={null}
            showEditingBadge={false}
          />
        ) : (
          <div className="resume-pdf-loading" />
        )}
      </main>
    </>
  )
}

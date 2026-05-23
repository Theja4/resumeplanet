'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
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
  const [payload, setPayload] = useState<PdfRenderPayload | null>(() => {
    if (typeof window !== 'undefined' && window.__REZOOMED_PDF_PAYLOAD__?.data) {
      return window.__REZOOMED_PDF_PAYLOAD__
    }
    return null
  })
  const renderRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handlePayload(event: Event) {
      const customEvent = event as CustomEvent<PdfRenderPayload>

      if (!customEvent.detail?.data) {
        return
      }

      setPayload(customEvent.detail)
    }

    window.addEventListener('rezoomed:pdf-payload', handlePayload)

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

    let cancelled = false

    async function waitForAssets() {
      try {
        if (document.fonts && typeof document.fonts.ready?.then === 'function') {
          await document.fonts.ready
        }
      } catch {
        // Ignore font readiness failures and print with the current layout.
      }

      const root = renderRef.current
      if (root) {
        const images = Array.from(root.querySelectorAll('img'))
        await Promise.all(
          images.map(async img => {
            if (img.complete && img.naturalHeight > 0) return
            try {
              await img.decode()
            } catch {
              await new Promise<void>(resolve => {
                img.addEventListener('load', () => resolve(), { once: true })
                img.addEventListener('error', () => resolve(), { once: true })
              })
            }
          })
        )
      }
    }

    async function run() {
      await waitForAssets()
      if (cancelled) return

      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          if (!cancelled) {
            document.documentElement.dataset.rezoomedPdfReady = '1'
          }
        })
      })
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [payload])

  const config = useMemo(() => sanitizeUniversalConfig(payload?.config), [payload?.config])

  return (
    <>
      <style jsx global>{`
        @page {
          size: A4;
          margin: 48px 0 48px 0;
        }

        @page :first {
          margin-top: 0;
        }

        html,
        body {
          margin: 0 !important;
          padding: 0 !important;
          width: 210mm;
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

        .resume-pdf-render-layer,
        .resume-pdf-document {
          width: 794px;
          background: #ffffff;
        }

        .resume-pdf-render-layer {
          position: relative;
          z-index: 2147483647;
        }

        .resume-pdf-document > div {
          min-height: auto !important;
        }

        .resume-pdf-document [data-resume-page-break-hard] {
          break-before: page;
          page-break-before: always;
        }

        .resume-pdf-document [data-resume-section-heading] {
          break-after: avoid;
          page-break-after: avoid;
        }

        .resume-pdf-loading {
          width: 794px;
          min-height: 1123px;
          background: #ffffff;
        }
      `}</style>

      <main className="resume-pdf-render-layer">
        {payload ? (
          <div ref={renderRef} className="resume-pdf-document">
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
          </div>
        ) : (
          <div className="resume-pdf-loading" />
        )}
      </main>
    </>
  )
}

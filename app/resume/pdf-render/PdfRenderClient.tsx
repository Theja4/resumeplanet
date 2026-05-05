'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import UniversalTemplate from '@/components/templates/UniversalTemplate'
import { sanitizeUniversalConfig } from '@/lib/templateOptions'
import type { ResumeData, UniversalConfig } from '@/types'

const PAGE_H = 1123 // A4 at 96 DPI
const PAGE_BOTTOM_PADDING = 48 // ~12.7mm (0.5in) bottom margin
const CONTINUATION_PAGE_TOP_PADDING = 48 // ~12.7mm (0.5in) top margin on pages 2+
const FIRST_PAGE_CONTENT_H = PAGE_H - PAGE_BOTTOM_PADDING
const CONTINUATION_PAGE_CONTENT_H =
  PAGE_H - PAGE_BOTTOM_PADDING - CONTINUATION_PAGE_TOP_PADDING
const MIN_PREVIEW_SLICE_HEIGHT = 120
const PAGE_BREAK_LOOKBACK = 96

type PdfRenderPayload = {
  data: ResumeData
  config?: Partial<UniversalConfig>
  sectionOrder?: string[]
  sidebarSectionOrder?: string[]
}

type PreviewPageSlice = {
  startY: number
  height: number
}

type PreviewBreakCandidate = {
  top: number
  bottom: number
}

declare global {
  interface Window {
    __REZOOMED_PDF_PAYLOAD__?: PdfRenderPayload
  }
}

function accentToSidebarFill(hex?: string | null): string {
  if (typeof hex !== 'string') return '#6366f115'
  const normalized = hex.trim().replace('#', '')
  if (!normalized) return '#6366f115'
  const six = normalized.length === 3
    ? normalized.split('').map(ch => ch + ch).join('')
    : normalized
  if (!/^[0-9a-fA-F]{6}$/.test(six)) return '#6366f115'
  return `#${six}15`
}

export default function PdfRenderClient() {
  const [payload, setPayload] = useState<PdfRenderPayload | null>(() => {
    if (typeof window !== 'undefined' && window.__REZOOMED_PDF_PAYLOAD__?.data) {
      return window.__REZOOMED_PDF_PAYLOAD__
    }
    return null
  })
  const [pageSlices, setPageSlices] = useState<PreviewPageSlice[]>([])
  const measurementRef = useRef<HTMLDivElement>(null)

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

  const recomputePageBreak = useCallback(() => {
    const container = measurementRef.current
    if (!container) return [{ startY: 0, height: FIRST_PAGE_CONTENT_H }]

    const containerTop = container.getBoundingClientRect().top
    const elements = container.querySelectorAll(
      '[data-resume-path], [data-resume-page-break], li, p, h1, h2, h3, h4, div[class*="text-"], div[class*="mb-"]'
    )
    const lineCandidateElements = container.querySelectorAll<HTMLElement>(
      '[data-resume-path], li, p, h1, h2, h3, h4, div[class*="text-"], div[class*="mb-"]'
    )
    const blockCandidateElements = container.querySelectorAll<HTMLElement>(
      '[data-resume-page-break], [data-resume-section-heading], h2'
    )

    let contentBottom = 0
    for (const el of Array.from(elements)) {
      const rect = el.getBoundingClientRect()
      const bottom = rect.bottom - containerTop
      if (bottom > contentBottom) {
        contentBottom = bottom
      }
    }

    const resolvedContentBottom = contentBottom > 0 ? contentBottom : container.scrollHeight
    const lineBreakCandidates = Array.from(lineCandidateElements)
      .flatMap((el) => {
        return Array.from(el.getClientRects()).map((rect) => ({
          top: Math.max(0, rect.top - containerTop),
          bottom: Math.max(0, rect.bottom - containerTop),
        }))
      })
      .filter(candidate => candidate.bottom - candidate.top > 2)
      .sort((a, b) => a.top - b.top)

    const blockBreakCandidates = Array.from(blockCandidateElements)
      .filter(el => !el.dataset.resumeSectionFrame)
      .map((el) => {
        const rect = el.getBoundingClientRect()
        return {
          top: Math.max(0, rect.top - containerTop),
          bottom: Math.max(0, rect.bottom - containerTop),
        }
      })
      .filter(candidate => candidate.bottom - candidate.top > 2)
      .sort((a, b) => a.top - b.top)

    const nextPageSlices: PreviewPageSlice[] = []
    let pageStartY = 0

    while (pageStartY < resolvedContentBottom - 1 && nextPageSlices.length < 20) {
      const isFirstPage = nextPageSlices.length === 0
      const pageCapacity = isFirstPage ? FIRST_PAGE_CONTENT_H : CONTINUATION_PAGE_CONTENT_H
      const pageLimitY = pageStartY + pageCapacity

      if (resolvedContentBottom <= pageLimitY + 1) {
        nextPageSlices.push({
          startY: pageStartY,
          height: Math.max(1, resolvedContentBottom - pageStartY),
        })
        break
      }

      const crossingLineCandidate = lineBreakCandidates.find(candidate =>
        candidate.bottom > pageLimitY &&
        candidate.top > pageStartY + MIN_PREVIEW_SLICE_HEIGHT &&
        candidate.top < pageLimitY
      )
      const crossingBlockCandidate = blockBreakCandidates.find(candidate =>
        candidate.bottom > pageLimitY &&
        candidate.top > Math.max(pageStartY + MIN_PREVIEW_SLICE_HEIGHT, pageLimitY - PAGE_BREAK_LOOKBACK) &&
        candidate.top < pageLimitY
      )
      const crossingCandidate: PreviewBreakCandidate | undefined =
        crossingLineCandidate ?? crossingBlockCandidate
      const safeBreakY = crossingCandidate
        ? Math.max(pageStartY + 1, Math.floor(crossingCandidate.top) - 1)
        : pageLimitY
      const nextBreakY =
        safeBreakY - pageStartY >= MIN_PREVIEW_SLICE_HEIGHT
          ? safeBreakY
          : pageLimitY

      nextPageSlices.push({
        startY: pageStartY,
        height: Math.max(1, nextBreakY - pageStartY),
      })
      pageStartY = nextBreakY
    }

    return nextPageSlices.length > 0 ? nextPageSlices : [{ startY: 0, height: FIRST_PAGE_CONTENT_H }]
  }, [])

  useEffect(() => {
    delete document.documentElement.dataset.rezoomedPdfReady

    if (!payload) {
      return
    }

    const run = () => {
      // Run in two RAFs to ensure the measurement wrapper is rendered and layout has settled.
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          const slices = recomputePageBreak()
          setPageSlices(slices)
          document.documentElement.dataset.rezoomedPdfReady = '1'
        })
      })
    }

    run()
  }, [payload, recomputePageBreak])

  const config = useMemo(() => sanitizeUniversalConfig(payload?.config), [payload?.config])

  return (
    <>
      <style jsx global>{`
        @page {
          size: A4;
          margin: 0;
        }

        html,
        body {
          margin: 0 !important;
          padding: 0 !important;
          width: 210mm;
          overflow: visible !important;
          background: #ffffff !important;
        }

        body > *:not(.resume-pdf-render-layer):not(#measurement-root) {
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
          background: #ffffff;
        }

        .resume-pdf-loading {
          width: 794px;
          min-height: 1123px;
          background: #ffffff;
        }
      `}</style>

      {/* Measurement Layer */}
      <div
        id="measurement-root"
        ref={measurementRef}
        className="absolute -left-[9999px] top-0 w-[794px] opacity-0 pointer-events-none"
        aria-hidden
      >
        {payload && (
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
        )}
      </div>

      <main className="resume-pdf-render-layer">
        {payload && pageSlices.length > 0 ? (
          pageSlices.map((pageSlice, pageIndex) => {
            const pageTopPadding = pageIndex === 0 ? 0 : CONTINUATION_PAGE_TOP_PADDING
            const pageContentHeight = pageSlice.height
            const pageContentStartY = pageSlice.startY

            return (
              <div
                key={`page-${pageIndex}`}
                className="relative bg-white overflow-hidden"
                style={{
                  width: '794px',
                  height: `${PAGE_H}px`,
                  pageBreakAfter: 'always',
                }}
              >
                {/* Full-page template shell so page styling continues to page bottom */}
                {(config.layout === 'sidebar' || config.layout === 'sidebar-left' || config.layout === 'sidebar-right') && (
                  <div className="absolute inset-0 pointer-events-none z-0">
                    <div
                      className="absolute top-0 bottom-0"
                      style={{
                        width: `${config.density === 'compressed' ? 192 : 256}px`,
                        backgroundColor: accentToSidebarFill(config.accentColor),
                        ...(config.layout === 'sidebar-right' ? { right: 0 } : { left: 0 }),
                      }}
                    />
                  </div>
                )}

                <div
                  className="relative overflow-hidden w-full z-10"
                  style={{
                    height: `${pageContentHeight}px`,
                    marginTop: `${pageTopPadding}px`,
                  }}
                >
                  <div
                    style={{
                      width: '794px',
                      transform: `translateY(-${pageContentStartY}px)`,
                      transformOrigin: 'top left',
                    }}
                  >
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
                </div>
              </div>
            )
          })
        ) : (
          <div className="resume-pdf-loading" />
        )}
      </main>
    </>
  )
}

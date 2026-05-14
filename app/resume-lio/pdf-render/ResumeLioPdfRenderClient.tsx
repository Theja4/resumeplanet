'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { ResumeLioTemplateRenderer } from '@/components/resume-lio/ResumeLioTemplateRenderer'
import type { ResumeData, ResumeLioTemplateId, ResumeLioSocialLinks } from '@/types'

const PAGE_H = 1123
const PAGE_BOTTOM_PADDING = 48
const CONTINUATION_PAGE_TOP_PADDING = 48
const FIRST_PAGE_CONTENT_H = PAGE_H - PAGE_BOTTOM_PADDING
const CONTINUATION_PAGE_CONTENT_H = PAGE_H - PAGE_BOTTOM_PADDING - CONTINUATION_PAGE_TOP_PADDING
const MIN_PREVIEW_SLICE_HEIGHT = 120
const PAGE_BREAK_LOOKBACK = 96

type PdfRenderPayload = {
  data: ResumeData
  templateId: ResumeLioTemplateId
  socialLinks: ResumeLioSocialLinks
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
    __REZOOMED_RESUME_LIO_PDF_PAYLOAD__?: PdfRenderPayload
  }
}

export default function ResumeLioPdfRenderClient() {
  const [payload, setPayload] = useState<PdfRenderPayload | null>(() => {
    if (typeof window !== 'undefined' && window.__REZOOMED_RESUME_LIO_PDF_PAYLOAD__?.data) {
      return window.__REZOOMED_RESUME_LIO_PDF_PAYLOAD__
    }
    return null
  })
  const [pageSlices, setPageSlices] = useState<PreviewPageSlice[]>([])
  const measurementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handlePayload(event: Event) {
      const customEvent = event as CustomEvent<PdfRenderPayload>
      if (!customEvent.detail?.data) return
      setPayload(customEvent.detail)
    }
    window.addEventListener('rezoomed:resume-lio-pdf-payload', handlePayload)
    return () => {
      window.removeEventListener('rezoomed:resume-lio-pdf-payload', handlePayload)
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
      'span[data-resume-path], a[data-resume-path], em[data-resume-path], strong[data-resume-path]'
    )
    const blockCandidateElements = container.querySelectorAll<HTMLElement>(
      '[data-resume-page-break], [data-resume-section-heading], h2'
    )

    let contentBottom = 0
    for (const el of Array.from(elements)) {
      const rect = el.getBoundingClientRect()
      const bottom = rect.bottom - containerTop
      if (bottom > contentBottom) contentBottom = bottom
    }

    const resolvedContentBottom = contentBottom > 0 ? contentBottom : container.scrollHeight
    const lineBreakCandidates = Array.from(lineCandidateElements)
      .flatMap((el) =>
        Array.from(el.getClientRects()).map((rect) => ({
          top: Math.max(0, rect.top - containerTop),
          bottom: Math.max(0, rect.bottom - containerTop),
        }))
      )
      .filter((c) => c.bottom - c.top > 2)
      .sort((a, b) => a.top - b.top)

    const blockBreakCandidates = Array.from(blockCandidateElements)
      .filter((el) => !el.dataset.resumeSectionFrame)
      .map((el) => {
        const rect = el.getBoundingClientRect()
        return {
          top: Math.max(0, rect.top - containerTop),
          bottom: Math.max(0, rect.bottom - containerTop),
        }
      })
      .filter((c) => c.bottom - c.top > 2)
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

      const crossingLineCandidate = lineBreakCandidates.find(
        (c) => c.bottom > pageLimitY && c.top > pageStartY + MIN_PREVIEW_SLICE_HEIGHT && c.top < pageLimitY
      )
      const crossingBlockCandidate = blockBreakCandidates.find(
        (c) =>
          c.bottom > pageLimitY &&
          c.top > Math.max(pageStartY + MIN_PREVIEW_SLICE_HEIGHT, pageLimitY - PAGE_BREAK_LOOKBACK) &&
          c.top < pageLimitY
      )
      const crossingCandidate: PreviewBreakCandidate | undefined = crossingLineCandidate ?? crossingBlockCandidate
      const safeBreakY = crossingCandidate
        ? Math.max(pageStartY + 1, Math.floor(crossingCandidate.top) - 1)
        : pageLimitY
      const nextBreakY =
        safeBreakY - pageStartY >= MIN_PREVIEW_SLICE_HEIGHT ? safeBreakY : pageLimitY

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
    if (!payload) return
    const run = () => {
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

      <div
        id="measurement-root"
        ref={measurementRef}
        className="absolute -left-[9999px] top-0 w-[794px] opacity-0 pointer-events-none"
        aria-hidden
      >
        {payload && (
          <ResumeLioTemplateRenderer
            templateId={payload.templateId}
            data={payload.data}
            socialLinks={payload.socialLinks}
          />
        )}
      </div>

      <main className="resume-pdf-render-layer">
        {payload && pageSlices.length > 0 ? (
          pageSlices.map((pageSlice, pageIndex) => {
            const pageTopPadding = pageIndex === 0 ? 0 : CONTINUATION_PAGE_TOP_PADDING
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
                <div
                  className="relative overflow-hidden w-full z-10"
                  style={{
                    height: `${pageSlice.height}px`,
                    marginTop: `${pageTopPadding}px`,
                  }}
                >
                  <div
                    style={{
                      width: '794px',
                      transform: `translateY(-${pageSlice.startY}px)`,
                      transformOrigin: 'top left',
                    }}
                  >
                    <ResumeLioTemplateRenderer
                      templateId={payload.templateId}
                      data={payload.data}
                      socialLinks={payload.socialLinks}
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

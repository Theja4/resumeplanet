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
    const elements = container.querySelectorAll<HTMLElement>('*')
    const lineCandidateElements = container.querySelectorAll<HTMLElement>(
      'span[data-resume-path], a[data-resume-path], em[data-resume-path], strong[data-resume-path]'
    )
    const blockCandidateElements = container.querySelectorAll<HTMLElement>(
      '[data-resume-page-break], [data-resume-section-heading], h2'
    )
    // User-inserted hard breaks (pageBreak custom section). Forced splits at
    // these positions regardless of how full the current page is.
    const hardBreakElements = container.querySelectorAll<HTMLElement>(
      '[data-resume-page-break-hard]'
    )

    let contentBottom = 0
    for (const el of Array.from(elements)) {
      if (el.closest('[data-pdf-ignore]')) continue
      const rect = el.getBoundingClientRect()
      const top = rect.top - containerTop
      const bottom = rect.bottom - containerTop
      if (rect.width <= 0 || rect.height <= 0) continue
      if (el.parentElement === container && top <= 1 && bottom >= PAGE_H - 1) continue
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
      .map((el) => {
        const rect = el.getBoundingClientRect()
        return {
          top: Math.max(0, rect.top - containerTop),
          bottom: Math.max(0, rect.bottom - containerTop),
        }
      })
      .filter(candidate => candidate.bottom - candidate.top > 2)
      .sort((a, b) => a.top - b.top)

    // Dedupe consecutive hard breaks: anything closer than ~24px to the
    // previous one is treated as the same break, so two pageBreak sections
    // back-to-back don't emit two blank pages.
    const HARD_BREAK_MERGE_PX = 24
    const dedupedHardBreaks: number[] = []
    for (const y of Array.from(hardBreakElements)
      .map(el => Math.max(0, el.getBoundingClientRect().top - containerTop))
      .filter(y => y > 0)
      .sort((a, b) => a - b)) {
      const prev = dedupedHardBreaks[dedupedHardBreaks.length - 1]
      if (prev === undefined || y - prev > HARD_BREAK_MERGE_PX) {
        dedupedHardBreaks.push(y)
      }
    }
    const hardBreakYs = dedupedHardBreaks

    const nextPageSlices: PreviewPageSlice[] = []
    let pageStartY = 0

    // Bumped from 20 → 30. Higher than RECOMMENDED_PAGES so we don't truncate
    // legitimate long CVs; lower than infinity so a runaway calc can't lock
    // the browser. If a user genuinely needs more, they'll see a warning in
    // the builder before trying to download.
    while (pageStartY < resolvedContentBottom - 1 && nextPageSlices.length < 30) {
      const isFirstPage = nextPageSlices.length === 0
      const pageCapacity = isFirstPage ? FIRST_PAGE_CONTENT_H : CONTINUATION_PAGE_CONTENT_H
      const pageLimitY = pageStartY + pageCapacity

      // Forced break: if the user inserted a hard page break between
      // pageStartY and the natural page limit, honor it ABOVE the
      // capacity-based logic. Skip nearly-empty slices (a page break placed
      // at the very top of the content emits a blank leading page otherwise).
      const forcedBreakY = hardBreakYs.find(y => y > pageStartY + 1 && y <= pageLimitY)
      if (forcedBreakY !== undefined) {
        const sliceHeight = forcedBreakY - pageStartY
        const hasContentAfterForcedBreak =
          lineBreakCandidates.some(candidate => candidate.bottom > forcedBreakY + 2) ||
          blockBreakCandidates.some(candidate => candidate.bottom > forcedBreakY + 2)

        if (pageStartY === 0 && sliceHeight < MIN_PREVIEW_SLICE_HEIGHT) {
          // Page break right at the top — skip emitting an empty page and
          // just advance to the break position.
          pageStartY = forcedBreakY
        } else {
          nextPageSlices.push({
            startY: pageStartY,
            height: Math.max(1, sliceHeight),
          })
          if (!hasContentAfterForcedBreak) break
          pageStartY = forcedBreakY
        }
        continue
      }

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

    let cancelled = false

    async function waitForAssets() {
      // Make sure web fonts are fully loaded — otherwise system-font fallback
      // metrics make pagination measure too small and the PDF emits an extra
      // page once the real font renders in Puppeteer.
      try {
        if (document.fonts && typeof document.fonts.ready?.then === 'function') {
          await document.fonts.ready
        }
      } catch {
        // ignore — fall through and measure
      }

      // Wait for any images inside the measurement area to fully decode so
      // their final box sizes contribute to the page-break calculation.
      const root = measurementRef.current
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
      // Two RAFs to ensure the measurement wrapper is rendered AND layout has settled.
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          if (cancelled) return
          const slices = recomputePageBreak()
          setPageSlices(slices)
          document.documentElement.dataset.rezoomedPdfReady = '1'
        })
      })
    }

    void run()
    return () => {
      cancelled = true
    }
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

        @media print {
          #measurement-root {
            display: none !important;
          }
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
                  // 1px under A4@96dpi to avoid sub-pixel overflow pushing the
                  // last sliver to a new PDF page in Puppeteer.
                  height: `${PAGE_H - 1}px`,
                  // Break before subsequent slices. Chromium can emit a blank
                  // sheet when `break-after` is applied to a fixed-height page
                  // slice that already sits on a page boundary.
                  breakBefore: pageIndex === 0 ? 'auto' : 'page',
                  pageBreakBefore: pageIndex === 0 ? 'auto' : 'always',
                  breakAfter: 'auto',
                  pageBreakAfter: 'auto',
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
                      position: 'relative',
                      top: `-${pageContentStartY}px`,
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

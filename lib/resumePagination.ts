export const RESUME_PAGE_HEIGHT_PX = 1123
export const RESUME_PAGE_BOTTOM_PADDING_PX = 48
export const RESUME_CONTINUATION_PAGE_TOP_PADDING_PX = 48
export const RESUME_FIRST_PAGE_CONTENT_HEIGHT_PX =
  RESUME_PAGE_HEIGHT_PX - RESUME_PAGE_BOTTOM_PADDING_PX
export const RESUME_CONTINUATION_PAGE_CONTENT_HEIGHT_PX =
  RESUME_PAGE_HEIGHT_PX -
  RESUME_PAGE_BOTTOM_PADDING_PX -
  RESUME_CONTINUATION_PAGE_TOP_PADDING_PX

const MIN_RESUME_SLICE_HEIGHT_PX = 120
const RESUME_PAGE_BREAK_LOOKBACK_PX = 96
const HARD_BREAK_MERGE_PX = 24
const MAX_RESUME_PAGE_SLICES = 30
const LINE_BREAK_BUFFER_PX = 4
const LINE_CLIP_GUARD_PX = 6

export type ResumePageSlice = {
  startY: number
  height: number
}

type ResumeBreakCandidate = {
  top: number
  bottom: number
}

export function getDefaultResumePageSlice(): ResumePageSlice {
  return { startY: 0, height: RESUME_FIRST_PAGE_CONTENT_HEIGHT_PX }
}

export function computeResumePageSlices(container: HTMLElement | null): ResumePageSlice[] {
  if (!container) return [getDefaultResumePageSlice()]

  const containerTop = container.getBoundingClientRect().top
  const elements = container.querySelectorAll<HTMLElement>('*')
  const lineCandidateElements = container.querySelectorAll<HTMLElement>(
    'span[data-resume-path], a[data-resume-path], em[data-resume-path], strong[data-resume-path]'
  )
  const blockCandidateElements = container.querySelectorAll<HTMLElement>(
    '[data-resume-page-break], [data-resume-section-heading], h2'
  )
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
    if (el.parentElement === container && top <= 1 && bottom >= RESUME_PAGE_HEIGHT_PX - 1) {
      continue
    }
    if (bottom > contentBottom) {
      contentBottom = bottom
    }
  }

  const resolvedContentBottom = contentBottom > 0 ? contentBottom : container.scrollHeight
  const lineBreakCandidates = Array.from(lineCandidateElements)
    .flatMap((el) =>
      Array.from(el.getClientRects()).map((rect) => ({
        top: Math.max(0, rect.top - containerTop),
        bottom: Math.max(0, rect.bottom - containerTop),
      }))
    )
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

  const nextPageSlices: ResumePageSlice[] = []
  let pageStartY = 0

  while (pageStartY < resolvedContentBottom - 1 && nextPageSlices.length < MAX_RESUME_PAGE_SLICES) {
    const isFirstPage = nextPageSlices.length === 0
    const pageCapacity = isFirstPage
      ? RESUME_FIRST_PAGE_CONTENT_HEIGHT_PX
      : RESUME_CONTINUATION_PAGE_CONTENT_HEIGHT_PX
    const pageLimitY = pageStartY + pageCapacity

    const forcedBreakY = dedupedHardBreaks.find(y => y > pageStartY + 1 && y <= pageLimitY)
    if (forcedBreakY !== undefined) {
      const sliceHeight = forcedBreakY - pageStartY
      const hasContentAfterForcedBreak =
        lineBreakCandidates.some(candidate => candidate.bottom > forcedBreakY + 2) ||
        blockBreakCandidates.some(candidate => candidate.bottom > forcedBreakY + 2)

      if (pageStartY === 0 && sliceHeight < MIN_RESUME_SLICE_HEIGHT_PX) {
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
      candidate.bottom > pageLimitY - LINE_CLIP_GUARD_PX &&
      candidate.top > pageStartY + MIN_RESUME_SLICE_HEIGHT_PX &&
      candidate.top < pageLimitY + LINE_CLIP_GUARD_PX
    )
    const crossingBlockCandidate = blockBreakCandidates.find(candidate =>
      candidate.bottom > pageLimitY &&
      candidate.top > Math.max(
        pageStartY + MIN_RESUME_SLICE_HEIGHT_PX,
        pageLimitY - RESUME_PAGE_BREAK_LOOKBACK_PX
      ) &&
      candidate.top < pageLimitY
    )
    const crossingCandidate: ResumeBreakCandidate | undefined =
      crossingLineCandidate ?? crossingBlockCandidate

    const safeBreakY = crossingCandidate
      ? Math.max(pageStartY + 1, Math.floor(crossingCandidate.top) - LINE_BREAK_BUFFER_PX)
      : pageLimitY
    const nextBreakY =
      safeBreakY - pageStartY >= MIN_RESUME_SLICE_HEIGHT_PX
        ? safeBreakY
        : pageLimitY

    nextPageSlices.push({
      startY: pageStartY,
      height: Math.max(1, nextBreakY - pageStartY),
    })
    pageStartY = nextBreakY
  }

  return nextPageSlices.length > 0 ? nextPageSlices : [getDefaultResumePageSlice()]
}

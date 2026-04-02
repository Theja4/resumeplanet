import { getFontEmbedCSS, toCanvas } from 'html-to-image'
import jsPDF from 'jspdf'

interface GenerateResumePdfFromElementOptions {
  pageWidthPx: number
  pageHeightPx: number
  firstPageBreakPx: number
  secondPageTopOffsetPx?: number
  contentHeightPx?: number
}

function createSliceCanvas(source: HTMLCanvasElement, startY: number, height: number) {
  const slice = document.createElement('canvas')
  slice.width = source.width
  slice.height = height
  const ctx = slice.getContext('2d')

  if (!ctx) {
    throw new Error('Failed to create PDF slice canvas.')
  }

  ctx.drawImage(
    source,
    0,
    startY,
    source.width,
    height,
    0,
    0,
    source.width,
    height,
  )

  return slice
}

export async function generateResumePdfBlobFromElement(
  element: HTMLElement,
  options: GenerateResumePdfFromElementOptions,
) {
  const pageWidthPx = options.pageWidthPx
  const pageHeightPx = options.pageHeightPx
  const firstPageBreakPx = Math.max(1, Math.min(options.firstPageBreakPx, pageHeightPx))
  const secondPageTopOffsetPx = Math.max(0, options.secondPageTopOffsetPx ?? 0)
  const elementHeightPx = Math.max(element.scrollHeight, element.getBoundingClientRect().height)
  const contentHeightPx = Math.max(0, Math.min(options.contentHeightPx ?? elementHeightPx, elementHeightPx))

  if (!Number.isFinite(elementHeightPx) || elementHeightPx <= 0) {
    throw new Error('Resume print wrapper has no measurable height.')
  }

  const previousInlineStyle = {
    position: element.style.position,
    left: element.style.left,
    top: element.style.top,
    opacity: element.style.opacity,
    pointerEvents: element.style.pointerEvents,
    zIndex: element.style.zIndex,
    width: element.style.width,
    height: element.style.height,
    margin: element.style.margin,
    transform: element.style.transform,
  }

  element.style.position = 'fixed'
  element.style.left = '0'
  element.style.top = '0'
  element.style.opacity = '1'
  element.style.pointerEvents = 'none'
  element.style.zIndex = '-1'
  element.style.width = `${pageWidthPx}px`
  element.style.height = `${elementHeightPx}px`
  element.style.margin = '0'
  element.style.transform = 'none'

  let canvas: HTMLCanvasElement
  let fontEmbedCSS: string | undefined

  try {
    try {
      fontEmbedCSS = await getFontEmbedCSS(element, {
        preferredFontFormat: 'woff2',
      })
    } catch {
      fontEmbedCSS = undefined
    }

    canvas = await toCanvas(element, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      skipFonts: !fontEmbedCSS,
      fontEmbedCSS,
      preferredFontFormat: 'woff2',
      width: pageWidthPx,
      height: elementHeightPx,
      canvasWidth: pageWidthPx,
      canvasHeight: elementHeightPx,
      style: {
        position: 'fixed',
        left: '0',
        top: '0',
        opacity: '1',
        pointerEvents: 'none',
        width: `${pageWidthPx}px`,
        height: `${elementHeightPx}px`,
        margin: '0',
        transform: 'none',
      },
    })
  } finally {
    element.style.position = previousInlineStyle.position
    element.style.left = previousInlineStyle.left
    element.style.top = previousInlineStyle.top
    element.style.opacity = previousInlineStyle.opacity
    element.style.pointerEvents = previousInlineStyle.pointerEvents
    element.style.zIndex = previousInlineStyle.zIndex
    element.style.width = previousInlineStyle.width
    element.style.height = previousInlineStyle.height
    element.style.margin = previousInlineStyle.margin
    element.style.transform = previousInlineStyle.transform
  }

  const scale = canvas.width / pageWidthPx
  const firstPageBreakCanvasPx = Math.max(1, Math.round(firstPageBreakPx * scale))
  const contentHeightCanvasPx = Math.max(1, Math.round(contentHeightPx * scale))
  const secondPageTopOffsetMm = (secondPageTopOffsetPx / pageHeightPx) * 297

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  })

  const firstSlice = createSliceCanvas(canvas, 0, Math.min(firstPageBreakCanvasPx, canvas.height))
  const firstSliceHeightMm = (firstSlice.height / canvas.height) * (elementHeightPx / pageHeightPx) * 297
  pdf.addImage(firstSlice.toDataURL('image/png'), 'PNG', 0, 0, 210, firstSliceHeightMm, undefined, 'FAST')

  if (contentHeightCanvasPx > firstPageBreakCanvasPx) {
    const secondSliceHeightPx = Math.min(canvas.height, contentHeightCanvasPx) - firstPageBreakCanvasPx
    const secondSlice = createSliceCanvas(canvas, firstPageBreakCanvasPx, secondSliceHeightPx)
    const secondSliceHeightMm = (secondSlice.height / canvas.height) * (elementHeightPx / pageHeightPx) * 297
    pdf.addPage()
    pdf.addImage(
      secondSlice.toDataURL('image/png'),
      'PNG',
      0,
      secondPageTopOffsetMm,
      210,
      secondSliceHeightMm,
      undefined,
      'FAST',
    )
  }

  return pdf.output('blob')
}

// Node.js environment: use legacy build
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import { resolve } from 'path'

// pdfjs-dist v5 requires a real worker path even in Node.js.
// Empty string causes "Setting up fake worker failed" — must point to the file.
pdfjsLib.GlobalWorkerOptions.workerSrc = resolve(
  process.cwd(),
  'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs'
)

export interface TextItem {
  text: string
  x: number
  y: number
  width: number
  height: number
  isBold: boolean
  fontSize: number
  pageNumber: number
}

export interface ExtractedPage {
  pageNumber: number
  items: TextItem[]
  width: number
  height: number
}

// Extract text items with full positional metadata
export async function extractPDFItems(buffer: Buffer): Promise<ExtractedPage[]> {
  const uint8Array = new Uint8Array(buffer)

  const loadingTask = pdfjsLib.getDocument({
    data: uint8Array,
    useSystemFonts: true,
    disableFontFace: true,
    // Suppress password prompts and verbose logging
    verbosity: 0,
  })

  const pdf = await loadingTask.promise
  const pages: ExtractedPage[] = []

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const viewport = page.getViewport({ scale: 1.0 })
    const textContent = await page.getTextContent()

    const items: TextItem[] = []

    for (const rawItem of textContent.items) {
      // TextItem has str; TextMarkedContent does not
      if (!('str' in rawItem)) continue
      const item = rawItem as {
        str: string
        transform: number[]
        width: number
        height: number
        fontName?: string
      }

      if (!item.str || item.str.trim() === '') continue

      // PDF coords are bottom-left origin; convert to top-left
      const transform = item.transform
      const x = transform[4]
      const y = viewport.height - transform[5]
      const fontSize = Math.sqrt(
        transform[0] * transform[0] + transform[1] * transform[1]
      )

      const fontName = (item.fontName ?? '').toLowerCase()
      const isBold =
        fontName.includes('bold') ||
        fontName.includes('black') ||
        fontName.includes('heavy')

      items.push({
        text: item.str,
        x: Math.round(x),
        y: Math.round(y),
        width: item.width ?? 0,
        height: item.height ?? fontSize,
        isBold,
        fontSize: Math.round(fontSize),
        pageNumber: pageNum,
      })
    }

    // Sort: top to bottom, then left to right
    items.sort((a, b) => {
      const yDiff = a.y - b.y
      if (Math.abs(yDiff) > 3) return yDiff
      return a.x - b.x
    })

    pages.push({
      pageNumber: pageNum,
      items,
      width: Math.round(viewport.width),
      height: Math.round(viewport.height),
    })
  }

  return pages
}

// Group items on the same horizontal line and merge into structured lines
export function pagesToLines(pages: ExtractedPage[]): Array<{
  text: string
  isBold: boolean
  fontSize: number
  x: number
  y: number
  pageNumber: number
}> {
  const lines: Array<{
    text: string
    isBold: boolean
    fontSize: number
    x: number
    y: number
    pageNumber: number
  }> = []

  for (const page of pages) {
    if (page.items.length === 0) continue

    // Average character width for column-gap detection
    const totalWidth = page.items.reduce((sum, item) => sum + item.width, 0)
    const totalChars = page.items.reduce((sum, item) => sum + item.text.length, 0)
    const avgCharWidth = totalChars > 0 ? totalWidth / totalChars : 8

    // Group items by y-coordinate proximity (within 3px = same line)
    const lineGroups: TextItem[][] = []
    let currentGroup: TextItem[] = []
    let lastY = -1

    for (const item of page.items) {
      if (lastY === -1 || Math.abs(item.y - lastY) <= 3) {
        currentGroup.push(item)
        lastY = item.y
      } else {
        if (currentGroup.length > 0) lineGroups.push([...currentGroup])
        currentGroup = [item]
        lastY = item.y
      }
    }
    if (currentGroup.length > 0) lineGroups.push(currentGroup)

    for (const group of lineGroups) {
      if (group.length === 0) continue

      group.sort((a, b) => a.x - b.x)

      let mergedText = ''
      let lastItemEnd = -1

      for (const item of group) {
        if (lastItemEnd === -1) {
          mergedText = item.text
        } else {
          const gap = item.x - lastItemEnd
          // Large gap suggests column separator
          if (gap > avgCharWidth * 3) {
            mergedText += '  |  ' + item.text
          } else if (gap > avgCharWidth) {
            mergedText += ' ' + item.text
          } else {
            mergedText += item.text
          }
        }
        lastItemEnd = item.x + item.width
      }

      const dominantFontSize = Math.max(...group.map(i => i.fontSize))
      const hasBold = group.some(i => i.isBold)

      if (mergedText.trim()) {
        lines.push({
          text: mergedText.trim(),
          isBold: hasBold,
          fontSize: dominantFontSize,
          x: group[0].x,
          y: group[0].y,
          pageNumber: page.pageNumber,
        })
      }
    }
  }

  return lines
}

// Plain text from PDF — used for scanned PDF detection
export async function extractPDFText(buffer: Buffer): Promise<string> {
  const pages = await extractPDFItems(buffer)
  const lines = pagesToLines(pages)
  return lines.map(l => l.text).join('\n')
}

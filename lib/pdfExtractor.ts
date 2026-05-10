import { resolve } from 'path'
type PdfJsModule = typeof import('pdfjs-dist/legacy/build/pdf.js')

let pdfjsModulePromise: Promise<PdfJsModule> | null = null

async function loadPdfjs() {
  if (!pdfjsModulePromise) {
    pdfjsModulePromise = import('pdfjs-dist/legacy/build/pdf.js').then(module => {
      module.GlobalWorkerOptions.workerSrc = resolve(
        process.cwd(),
        'node_modules/pdfjs-dist/legacy/build/pdf.worker.js'
      )
      return module
    })
  }

  return pdfjsModulePromise
}

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

export interface ExtractedPDFMetadata {
  info?: Record<string, unknown>
  metadata?: {
    get?: (name: string) => unknown
  } | null
}

async function createLoadingTask(buffer: Buffer) {
  const pdfjsLib = await loadPdfjs()
  const uint8Array = new Uint8Array(buffer)

  return pdfjsLib.getDocument({
    data: uint8Array,
    useSystemFonts: true,
    disableFontFace: true,
    verbosity: 0,
  })
}

// Extract text items with full positional metadata
export async function extractPDFItems(buffer: Buffer): Promise<ExtractedPage[]> {
  let loadingTask: Awaited<ReturnType<typeof createLoadingTask>>
  try {
    loadingTask = await createLoadingTask(buffer)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes('password') || msg.includes('encrypted')) {
      throw new Error('PASSWORD_PROTECTED_PDF')
    }
    throw e
  }

  let pdf
  try {
    pdf = await loadingTask.promise
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes('password') || msg.includes('encrypted') || msg.includes('PasswordException')) {
      throw new Error('PASSWORD_PROTECTED_PDF')
    }
    throw e
  }
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

    // Dynamic y-tolerance based on median font size for better line grouping
    const fontSizes = items.map(item => item.fontSize).filter(s => s > 0)
    const medianFS = fontSizes.length > 0
      ? fontSizes.sort((a, b) => a - b)[Math.floor(fontSizes.length / 2)]
      : 12
    const yTolerance = Math.max(3, Math.round(medianFS * 0.4))

    // Sort: top to bottom, then left to right
    items.sort((a, b) => {
      const yDiff = a.y - b.y
      if (Math.abs(yDiff) > yTolerance) return yDiff
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

export async function extractPDFMetadata(buffer: Buffer): Promise<ExtractedPDFMetadata> {
  const loadingTask = await createLoadingTask(buffer)
  const pdf = await loadingTask.promise
  const metadata = await pdf.getMetadata()

  return {
    info: metadata.info as Record<string, unknown> | undefined,
    metadata: metadata.metadata ?? null,
  }
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

  const bulletOnlyText = (text: string) => /^[•●◦▪▫‣∙·]$/.test(text.trim())

  const getClusterText = (cluster: TextItem[]) =>
    cluster.map(item => item.text).join('').trim()

  function pushClusterLine(cluster: TextItem[]) {
    if (cluster.length === 0) return

    let mergedText = ''
    let lastItemEnd = -1

    for (const item of cluster) {
      if (lastItemEnd === -1) {
        mergedText = item.text
      } else {
        const gap = item.x - lastItemEnd
        if (gap > 1) {
          mergedText += ' '
        }
        mergedText += item.text
      }
      lastItemEnd = item.x + item.width
    }

    const dominantFontSize = Math.max(...cluster.map(item => item.fontSize))
    const hasBold = cluster.some(item => item.isBold)

    if (mergedText.trim()) {
      lines.push({
        text: mergedText.trim(),
        isBold: hasBold,
        fontSize: dominantFontSize,
        x: cluster[0].x,
        y: cluster[0].y,
        pageNumber: cluster[0].pageNumber,
      })
    }
  }

  for (const page of pages) {
    if (page.items.length === 0) continue

    // Average character width for column-gap detection
    const totalWidth = page.items.reduce((sum, item) => sum + item.width, 0)
    const totalChars = page.items.reduce((sum, item) => sum + item.text.length, 0)
    const avgCharWidth = totalChars > 0 ? totalWidth / totalChars : 8

    // Dynamic y-tolerance for line grouping based on median font size
    const pageFontSizes = page.items.map(item => item.fontSize).filter(s => s > 0)
    const pageMedianFS = pageFontSizes.length > 0
      ? pageFontSizes.sort((a, b) => a - b)[Math.floor(pageFontSizes.length / 2)]
      : 12
    const lineYTolerance = Math.max(3, Math.round(pageMedianFS * 0.4))

    // Group items by y-coordinate proximity
    const lineGroups: TextItem[][] = []
    let currentGroup: TextItem[] = []
    let lastY = -1

    for (const item of page.items) {
      if (lastY === -1 || Math.abs(item.y - lastY) <= lineYTolerance) {
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

      const clusters: TextItem[][] = []
      let currentCluster: TextItem[] = []
      let lastItemEnd = -1
      for (const item of group) {
        if (lastItemEnd === -1) {
          currentCluster.push(item)
        } else {
          const gap = item.x - lastItemEnd
          if (gap > avgCharWidth * 3) {
            clusters.push(currentCluster)
            currentCluster = [item]
          } else {
            currentCluster.push(item)
          }
        }
        lastItemEnd = item.x + item.width
      }
      if (currentCluster.length > 0) {
        clusters.push(currentCluster)
      }

      const mergedClusters: TextItem[][] = []
      for (let index = 0; index < clusters.length; index += 1) {
        const cluster = clusters[index]
        const nextCluster = clusters[index + 1]

        if (nextCluster && bulletOnlyText(getClusterText(cluster))) {
          mergedClusters.push([...cluster, ...nextCluster])
          index += 1
          continue
        }

        mergedClusters.push(cluster)
      }

      for (const cluster of mergedClusters) {
        pushClusterLine(cluster)
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

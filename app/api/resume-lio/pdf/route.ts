import { existsSync } from 'node:fs'
import { NextRequest, NextResponse } from 'next/server'
import chromium from '@sparticuz/chromium'
import puppeteer from 'puppeteer-core'
import { createClient } from '@/lib/supabase/server'
import type { ResumeData, ResumeLioTemplateId } from '@/types'

export const runtime = 'nodejs'
export const maxDuration = 60

const A4_WIDTH_PX = 794
const A4_HEIGHT_PX = 1123

interface PdfRequestPayload {
  slug: string
  data: ResumeData
  templateId: ResumeLioTemplateId
  socialLinks?: Record<string, string | null>
  filename?: string
}

function sanitizeFilename(value: string | undefined, fallback: string) {
  const base = (value || fallback || 'resume')
    .replace(/\.pdf\s*$/i, '')
    .replace(/[^\w\- .()]/g, '')
    .trim()
  return `${base || 'resume'}.pdf`
}

function getRequestOrigin(request: NextRequest) {
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  const protocol = request.headers.get('x-forwarded-proto') ?? 'http'
  if (!host) return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  return `${protocol}://${host}`
}

function findLocalChromeExecutable() {
  const candidates = [
    process.env.CHROME_EXECUTABLE_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
  ].filter((candidate): candidate is string => Boolean(candidate))
  return candidates.find(candidate => existsSync(candidate)) ?? null
}

async function getExecutablePath() {
  const localChrome = findLocalChromeExecutable()
  if (localChrome) return localChrome
  return chromium.executablePath()
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let payload: PdfRequestPayload
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid PDF request payload.' }, { status: 400 })
  }

  if (!payload.data || !payload.slug || !payload.templateId) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
  }

  const origin = getRequestOrigin(request)
  const filename = sanitizeFilename(payload.filename, payload.data.name || 'resume')
  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null

  try {
    const executablePath = await getExecutablePath()
    const isLocal = Boolean(findLocalChromeExecutable())

    browser = await puppeteer.launch({
      args: isLocal
        ? ['--font-render-hinting=none', '--no-sandbox', '--disable-setuid-sandbox']
        : [...chromium.args, '--font-render-hinting=none', '--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: {
        width: A4_WIDTH_PX,
        height: A4_HEIGHT_PX,
        deviceScaleFactor: 1,
      },
      executablePath,
      headless: true,
    })

    const page = await browser.newPage()
    await page.goto(`${origin}/resume-lio/pdf-render`, { waitUntil: 'networkidle0' })
    await page.evaluate((renderPayload) => {
      window.__REZOOMED_RESUME_LIO_PDF_PAYLOAD__ = renderPayload
      window.dispatchEvent(
        new CustomEvent('rezoomed:resume-lio-pdf-payload', {
          detail: renderPayload,
        })
      )
    }, {
      data: payload.data,
      templateId: payload.templateId,
      socialLinks: payload.socialLinks ?? {},
    })
    await page.waitForFunction(
      () => document.documentElement.dataset.rezoomedPdfReady === '1',
      { timeout: 15000 }
    )
    await page.emulateMediaType('print')

    const pdfBytes = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
    })

    return new NextResponse(new Uint8Array(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('Chromium PDF export failed.', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'PDF export failed.' },
      { status: 500 }
    )
  } finally {
    await browser?.close()
  }
}

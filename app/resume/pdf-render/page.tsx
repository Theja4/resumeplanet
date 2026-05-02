import type { Metadata } from 'next'
import PdfRenderClient from './PdfRenderClient'

export const metadata: Metadata = {
  title: 'Resume PDF Render',
  robots: {
    index: false,
    follow: false,
  },
}

export default function ResumePdfRenderPage() {
  return <PdfRenderClient />
}

import type { Metadata } from 'next'
import ResumeLioZipRenderClient from './ResumeLioZipRenderClient'

export const metadata: Metadata = {
  title: 'Resume Lio Export',
  robots: { index: false, follow: false },
}

export default function ResumeLioZipRenderPage() {
  return <ResumeLioZipRenderClient />
}

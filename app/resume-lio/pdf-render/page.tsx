import type { Metadata } from 'next'
import ResumeLioPdfRenderClient from './ResumeLioPdfRenderClient'

export const metadata: Metadata = {
  title: 'Resume Lio PDF Render',
  robots: {
    index: false,
    follow: false,
  },
}

export default function ResumeLioPdfRenderPage() {
  return <ResumeLioPdfRenderClient />
}

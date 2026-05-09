import ResumeFormatLandingPage from '@/components/seo/ResumeFormatLandingPage'
import { buildResumeFormatMetadata, getResumeFormatPage } from '@/lib/seo/resume-format-pages'

const page = getResumeFormatPage('us')

export const metadata = buildResumeFormatMetadata(page)

export default function UsResumeFormatPage() {
  return <ResumeFormatLandingPage page={page} />
}

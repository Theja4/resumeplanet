import ResumeFormatLandingPage from '@/components/seo/ResumeFormatLandingPage'
import { buildResumeFormatMetadata, getResumeFormatPage } from '@/lib/seo/resume-format-pages'

const page = getResumeFormatPage('ats')

export const metadata = buildResumeFormatMetadata(page)

export default function AtsResumeFormatPage() {
  return <ResumeFormatLandingPage page={page} />
}

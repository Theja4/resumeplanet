import ResumeFormatLandingPage from '@/components/seo/ResumeFormatLandingPage'
import { buildResumeFormatMetadata, getResumeFormatPage } from '@/lib/seo/resume-format-pages'

const page = getResumeFormatPage('hub')

export const metadata = buildResumeFormatMetadata(page)

export default function ResumeFormatPage() {
  return <ResumeFormatLandingPage page={page} />
}

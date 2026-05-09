import ResumeFormatLandingPage from '@/components/seo/ResumeFormatLandingPage'
import { buildResumeFormatMetadata, getResumeFormatPage } from '@/lib/seo/resume-format-pages'

const page = getResumeFormatPage('applications')

export const metadata = buildResumeFormatMetadata(page)

export default function ResumeFormatForJobApplicationsPage() {
  return <ResumeFormatLandingPage page={page} />
}

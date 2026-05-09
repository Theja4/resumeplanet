import AtsTestingLandingPage from '@/components/seo/AtsTestingLandingPage'
import { buildAtsTestingMetadata, getAtsTestingPage } from '@/lib/seo/ats-testing-pages'

const page = getAtsTestingPage('test')

export const metadata = buildAtsTestingMetadata(page)

export default function AtsResumeTestPage() {
  return <AtsTestingLandingPage page={page} />
}

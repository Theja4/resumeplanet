import AtsTestingLandingPage from '@/components/seo/AtsTestingLandingPage'
import { buildAtsTestingMetadata, getAtsTestingPage } from '@/lib/seo/ats-testing-pages'

const page = getAtsTestingPage('amazonGuide')

export const metadata = buildAtsTestingMetadata(page)

export default function AmazonAtsResumeGuidePage() {
  return <AtsTestingLandingPage page={page} />
}

import AtsTestingLandingPage from '@/components/seo/AtsTestingLandingPage'
import { buildAtsTestingMetadata, getAtsTestingPage } from '@/lib/seo/ats-testing-pages'

const page = getAtsTestingPage('scanner')

export const metadata = buildAtsTestingMetadata(page)

export default function ResumeScannerPage() {
  return <AtsTestingLandingPage page={page} />
}

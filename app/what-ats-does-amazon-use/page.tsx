import AtsTestingLandingPage from '@/components/seo/AtsTestingLandingPage'
import { buildAtsTestingMetadata, getAtsTestingPage } from '@/lib/seo/ats-testing-pages'

const page = getAtsTestingPage('amazonSystem')

export const metadata = buildAtsTestingMetadata(page)

export default function WhatAtsDoesAmazonUsePage() {
  return <AtsTestingLandingPage page={page} />
}

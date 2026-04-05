import { decodeFirstPartyResumeMetadata, type FirstPartyResumeSnapshot } from '@/lib/firstPartyResumeMarker'
import { extractPDFMetadata } from '@/lib/pdfExtractor'

export async function extractFirstPartyResumeSnapshotFromPdf(buffer: Buffer): Promise<FirstPartyResumeSnapshot | null> {
  try {
    const metadata = await extractPDFMetadata(buffer)
    return decodeFirstPartyResumeMetadata(metadata)
  } catch {
    return null
  }
}

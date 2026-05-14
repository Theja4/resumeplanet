import { ResumeLioTemplateRenderer } from '@/components/resume-lio/ResumeLioTemplateRenderer'
import { getResumeLioMockData, getResumeLioMockSocials } from '@/lib/resumeLioMockData'
import type { ResumeLioTemplateId } from '@/types'

const TEMPLATE_IDS: ResumeLioTemplateId[] = ['jane', 'stelvio', 'velora', 'welvet', 'portfolite', 'yuya', 'casefile', 'signal', 'pearltech']

interface PageProps {
  searchParams: Promise<{ template?: string }>
}

export default async function ResumeLioPreviewPage({ searchParams }: PageProps) {
  const { template } = await searchParams
  const templateId = TEMPLATE_IDS.includes(template as ResumeLioTemplateId) ? (template as ResumeLioTemplateId) : 'jane'

  return (
    <main className="min-h-screen bg-white">
      <ResumeLioTemplateRenderer
        templateId={templateId}
        data={getResumeLioMockData(templateId)}
        socialLinks={getResumeLioMockSocials(templateId)}
      />
    </main>
  )
}

'use client'

import dynamic from 'next/dynamic'
import type { ResumeData, UniversalConfig } from '@/types'

const UniversalTemplate = dynamic(
  () => import('@/components/templates/UniversalTemplate').then(mod => mod.default),
  { ssr: false }
)

interface UniversalTemplatePreviewProps {
  data: ResumeData
  config: UniversalConfig
  sectionOrder?: string[]
  sidebarSectionOrder?: string[]
}

export default function UniversalTemplatePreview({
  data,
  config,
  sectionOrder,
  sidebarSectionOrder,
}: UniversalTemplatePreviewProps) {
  return (
    <UniversalTemplate
      data={data}
      isEditing={false}
      onFieldChange={() => {}}
      config={config}
      sectionOrder={sectionOrder}
      sidebarSectionOrder={sidebarSectionOrder}
      density={config.density}
    />
  )
}

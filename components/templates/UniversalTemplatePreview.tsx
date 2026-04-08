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
}

export default function UniversalTemplatePreview({
  data,
  config,
}: UniversalTemplatePreviewProps) {
  return (
    <UniversalTemplate
      data={data}
      isEditing={false}
      onFieldChange={() => {}}
      config={config}
      density={config.density}
    />
  )
}

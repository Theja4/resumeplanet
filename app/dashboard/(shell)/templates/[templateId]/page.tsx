import { redirect } from 'next/navigation'

interface Props {
  params: Promise<{ templateId: string }>
}

export default async function TemplatePreviewPage({ params }: Props) {
  await params
  redirect('/dashboard/templates')
}

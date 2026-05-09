import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ResumeFormatLandingPage from '@/components/seo/ResumeFormatLandingPage'
import {
  RESUME_FORMAT_ROLE_SLUGS,
  buildResumeFormatMetadata,
  getResumeFormatRolePage,
} from '@/lib/seo/resume-format-pages'

export function generateStaticParams() {
  return RESUME_FORMAT_ROLE_SLUGS.map(role => ({ role }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ role: string }>
}): Promise<Metadata> {
  const { role } = await params
  const page = getResumeFormatRolePage(role)

  if (!page) {
    return {
      title: 'Resume Format | Rezoomed',
    }
  }

  return buildResumeFormatMetadata(page)
}

export default async function RoleResumeFormatPage({
  params,
}: {
  params: Promise<{ role: string }>
}) {
  const { role } = await params
  const page = getResumeFormatRolePage(role)

  if (!page) notFound()

  return <ResumeFormatLandingPage page={page} />
}

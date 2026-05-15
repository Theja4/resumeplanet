import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ResumeLioTemplateRenderer } from '@/components/resume-lio/ResumeLioTemplateRenderer'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data: site } = await supabase
    .from('resume_lio_sites')
    .select('resume_data')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle()

  const name = (site?.resume_data as { name?: string } | null)?.name || slug
  return {
    title: `${name} — Resume Lio`,
    robots: {
      index: false,
      follow: true,
    },
  }
}

export default async function PublicResumeLioPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: site } = await supabase
    .from('resume_lio_sites')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle()

  if (!site) {
    notFound()
  }

  const resumeData = (site.resume_data as Record<string, unknown> | null) || {}
  const socialLinks = (site.social_links as Record<string, string | null> | null) || {}

  return (
    <main className="min-h-screen bg-white">
      <ResumeLioTemplateRenderer
        templateId={site.template_id as import('@/types').ResumeLioTemplateId}
        data={resumeData as unknown as import('@/types').ResumeData}
        socialLinks={socialLinks}
      />
    </main>
  )
}

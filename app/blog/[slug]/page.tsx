import type { CSSProperties } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import PublicSiteHeader from '@/components/blog/PublicSiteHeader'
import PublicSiteFooter from '@/components/blog/PublicSiteFooter'
import MarkdownContent from '@/components/blog/MarkdownContent'
import ReadingProgress from '@/components/blog/ReadingProgress'
import BlogFloatingRail from '@/components/blog/BlogFloatingRail'
import BlogTableOfContents from '@/components/blog/BlogTableOfContents'
import BlogShareButtons from '@/components/blog/BlogShareButtons'
import BlogRelatedPostLink from '@/components/blog/BlogRelatedPostLink'
import BlogTrackedAppLink from '@/components/blog/BlogTrackedAppLink'
import BlogPostAnalyticsClient from '@/components/blog/BlogPostAnalyticsClient'
import BlogResumeShowcase from '@/components/blog/BlogResumeShowcase'
import {
  estimateReadTime,
  formatBlogDate,
  getBlogMediaFallback,
  getPublishedBlogPostBySlug,
  getPublishedBlogPosts,
} from '@/lib/blog'
import { getCompanyJobGuideBySlug } from '@/lib/blog/company-job-guides'
import { getBlogResumeExampleForSlug } from '@/lib/blog/resume-examples'
import { getSiteUrl } from '@/lib/site'
import { getAuthorForSlug, getAuthorSlug } from '@/lib/blog/authors'

const GOOGLE_JOB_FAQS = [
  {
    question: 'Can I apply to more than one Google job at the same time?',
    answer:
      'Yes, but Google Careers Help says you can apply to up to three jobs within a rolling 30-day window. Use those slots carefully.',
  },
  {
    question: 'Should I use the same resume for every Google application?',
    answer:
      'No. Google roles can look similar on the surface and still require very different evidence. Tailor for the exact function, level, and team context.',
  },
  {
    question: 'Does Google require a cover letter?',
    answer:
      'No. Google\'s Careers Help says education, work history, and cover letter are optional. That makes the resume even more important.',
  },
  {
    question: 'Can I edit my Google application after I submit it?',
    answer:
      'No. Google says you can change an application before submission, including swapping the resume, but not after you submit.',
  },
]

function cleanStructuredText(text: string) {
  return text.replace(/[#*`_]/g, '').trim()
}

function extractArticleSections(content: string) {
  const lines = content.replace(/\r\n/g, '\n').split('\n')
  const sections: Array<{ id: string; title: string }> = []

  lines.forEach(line => {
    if (/^##\s+/.test(line)) {
      const title = line.replace(/^##\s+/, '').trim()
      sections.push({
        id: title
          .toLowerCase()
          .replace(/['’]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, ''),
        title,
      })
    }
  })

  return sections
}

function extractFaqItems(content: string) {
  const lines = content.replace(/\r\n/g, '\n').split('\n')
  const faqs: Array<{ question: string; answer: string }> = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index].trim()
    const isFaqSection =
      /^##\s+/i.test(line) &&
      (line.toLowerCase().includes('frequently asked questions') || line.toLowerCase().startsWith('## faq'))

    if (!isFaqSection) {
      index += 1
      continue
    }

    index += 1

    while (index < lines.length) {
      const currentLine = lines[index].trim()

      if (/^##\s+/.test(currentLine)) {
        break
      }

      if (!/^###\s+/.test(currentLine)) {
        index += 1
        continue
      }

      const question = cleanStructuredText(currentLine.replace(/^###\s+/, '').trim())
      const answerLines: string[] = []
      index += 1

      while (index < lines.length) {
        const answerLine = lines[index].trim()

        if (/^##\s+/.test(answerLine) || /^###\s+/.test(answerLine)) {
          break
        }

        if (answerLine) {
          answerLines.push(answerLine)
        }

        index += 1
      }

      const answer = cleanStructuredText(answerLines.join(' '))

      if (question && answer) {
        faqs.push({ question, answer })
      }
    }

    break
  }

  return faqs
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = await getPublishedBlogPostBySlug(slug)
  if (!post) return { title: 'Blog' }
  const siteUrl = getSiteUrl()
  const image = post.cover_image_url || getBlogMediaFallback(post.slug)?.coverImage || `${siteUrl}/icon.png`

  return {
    title: post.title,
    description: post.excerpt,
    authors: [{ name: post.author_name }],
    category: post.category,
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.excerpt,
      url: `${siteUrl}/blog/${post.slug}`,
      images: [{ url: image }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: [image],
    },
  }
}

const CATEGORY_COLORS: Record<string, string> = {
  'career tips':    'bg-blue-50   text-blue-700   ring-blue-100',
  'resume advice':  'bg-violet-50 text-violet-700 ring-violet-100',
  'ats':            'bg-emerald-50 text-emerald-700 ring-emerald-100',
  'product update': 'bg-amber-50  text-amber-700  ring-amber-100',
  'job search':     'bg-rose-50   text-rose-700   ring-rose-100',
}

function categoryStyle(cat: string) {
  return CATEGORY_COLORS[cat.toLowerCase()] ?? 'bg-zinc-100 text-zinc-600 ring-zinc-200'
}

function entryStyle(delay = 0): CSSProperties {
  return {
    transitionDelay: `${delay}s`,
  }
}

function CompanyGuideImage({
  alt,
  src,
}: {
  alt: string
  src: string
}) {
  return (
    <figure className="relative mx-auto my-2 w-full max-w-3xl overflow-hidden rounded-[1.8rem] border border-white/80 bg-[linear-gradient(160deg,rgba(255,255,255,0.98),rgba(241,247,243,0.94))] p-2 shadow-[0_20px_60px_rgba(18,24,21,0.08)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(163,255,179,0.22),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(2,109,50,0.08),transparent_30%)]" />
      <div className="relative overflow-hidden rounded-[1.2rem] border border-black/5 bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="mx-auto h-auto w-full object-contain" loading="lazy" />
      </div>
    </figure>
  )
}

function CompanyMascotImage({
  companyName,
  slug,
}: {
  companyName: string
  slug: string
}) {
  return (
    <CompanyGuideImage
      src={`/blog/${slug}-mascot.svg`}
      alt={`Rezoomed mascot filling out a ${companyName} application`}
    />
  )
}

function CompanyInlineImage({
  companyName,
  slug,
}: {
  companyName: string
  slug: string
}) {
  return (
    <CompanyGuideImage
      src={`/blog/${slug}-inline.svg`}
      alt={`${companyName} job application guide illustration`}
    />
  )
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const [post, publishedPosts] = await Promise.all([
    getPublishedBlogPostBySlug(slug),
    getPublishedBlogPosts(),
  ])

  if (!post) notFound()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const normalizedLines = post.content.replace(/\r\n/g, '\n').split('\n')
  const firstNonEmptyLineIndex = normalizedLines.findIndex(l => l.trim().length > 0)
  const articleContent =
    firstNonEmptyLineIndex !== -1 && /^#\s+/.test(normalizedLines[firstNonEmptyLineIndex].trim())
      ? normalizedLines.slice(firstNonEmptyLineIndex + 1).join('\n').trim()
      : post.content

  const mediaFallback   = getBlogMediaFallback(post.slug)
  const coverImage      = post.cover_image_url || mediaFallback?.coverImage || null
  const inlineImages    = mediaFallback?.inlineImages ?? []
  const readTimeMinutes = estimateReadTime(articleContent)
  const relatedPosts    = publishedPosts.filter(c => c.slug !== post.slug).slice(0, 3)
  const siteUrl         = getSiteUrl()
  const articleSections = extractArticleSections(articleContent).slice(0, 6)
  const hasArticleToc = articleSections.length > 0
  const resumeExample = getBlogResumeExampleForSlug(post.slug)
  const companyJobGuide = getCompanyJobGuideBySlug(post.slug)
  const resumeShowcase = resumeExample ? (
    <BlogResumeShowcase
      slug={post.slug}
      exampleId={resumeExample.id}
      isAuthenticated={Boolean(user)}
    />
  ) : null
  const mascotImage = companyJobGuide ? (
    <CompanyMascotImage companyName={companyJobGuide.companyName} slug={post.slug} />
  ) : null
  const companyInlineImage = companyJobGuide ? (
    <CompanyInlineImage companyName={companyJobGuide.companyName} slug={post.slug} />
  ) : null
  const customBlocks = resumeShowcase || mascotImage || companyInlineImage
    ? {
        ...(resumeShowcase
          ? {
              'google-resume-example': resumeShowcase,
              'company-resume-example': resumeShowcase,
            }
          : {}),
        ...(mascotImage
          ? {
              'company-mascot-image': mascotImage,
            }
          : {}),
        ...(companyInlineImage
          ? {
              'company-inline-image': companyInlineImage,
            }
          : {}),
      }
    : undefined
  const author = getAuthorForSlug(post.slug)
  const extractedFaqItems = extractFaqItems(articleContent)
  const faqItems =
    extractedFaqItems.length > 0
      ? extractedFaqItems
      : post.slug === 'how-to-land-a-google-job'
        ? GOOGLE_JOB_FAQS
        : null
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: coverImage ? [coverImage.startsWith('http') ? coverImage : `${siteUrl}${coverImage}`] : [`${siteUrl}/icon.png`],
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: {
      '@type': 'Person',
      '@id': `${siteUrl}/authors/${getAuthorSlug(author)}#person`,
      name: post.author_name,
      jobTitle: author.title,
      description: author.bio,
      url: `${siteUrl}/authors/${getAuthorSlug(author)}`,
      worksFor: { '@type': 'Organization', '@id': `${siteUrl}/#organization` },
    },
    publisher: { '@id': `${siteUrl}/#organization` },
    mainEntityOfPage: `${siteUrl}/blog/${post.slug}`,
    articleSection: post.category,
  }
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: siteUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Blog',
        item: `${siteUrl}/blog`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.title,
        item: `${siteUrl}/blog/${post.slug}`,
      },
    ],
  }
  const faqJsonLd = faqItems
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqItems.map(faq => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      }
    : null
  return (
    <div
      className="min-h-screen bg-white text-on-surface font-body selection:bg-primary-container selection:text-on-primary-container"
      style={{ overflowX: 'clip' }}
    >
      <ReadingProgress />
      <PublicSiteHeader active="blog" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {faqJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      ) : null}

      <BlogPostAnalyticsClient
        slug={post.slug}
        title={post.title}
        category={post.category}
        readTimeMinutes={readTimeMinutes}
      />

      <div className={`relative overflow-hidden ${coverImage ? 'pt-32 pb-20' : 'bg-[#030f07] pt-32 pb-20'}`}>
        {coverImage ? (
          <>
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${coverImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'brightness(0.22) saturate(0.42)',
              }}
            />
            <div className="absolute inset-0 bg-zinc-950/76" />
            <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/20 via-zinc-950/30 to-white" />
          </>
        ) : null}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(163,255,179,0.14),transparent_24%),radial-gradient(circle_at_top_right,rgba(48,192,107,0.10),transparent_22%),linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] [background-size:100%_100%,100%_100%,36px_36px,36px_36px]" />
        <div className="login-aurora pointer-events-none absolute -left-20 top-10 h-64 w-64 rounded-full bg-[#A3FFB3]/10 blur-3xl" />
        <div className="login-aurora-two pointer-events-none absolute right-0 top-10 h-72 w-72 rounded-full bg-[#30c06b]/10 blur-3xl" />

        <div className="relative mx-auto max-w-[90rem] px-6 pb-24">
          <Link
            href="/blog"
            className="group mb-10 inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-white/50 transition-colors hover:text-white/90"
          >
            <ArrowLeft size={13} strokeWidth={3} />
            All articles
          </Link>

          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-end">
            <div className="blog-load-in space-y-7" style={entryStyle(0)}>
              <div className="flex flex-wrap items-center gap-3">
                <span className={`inline-flex text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full ring-1 ${categoryStyle(post.category)}`}>
                  {post.category}
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/34">Editorial analysis</span>
              </div>

              <h1 className="max-w-4xl text-4xl font-black tracking-tight text-white leading-[1.03] sm:text-5xl lg:text-[3.9rem]">
                {post.title}
              </h1>

              <p className="max-w-2xl text-lg leading-relaxed text-white/55">
                {post.excerpt}
              </p>

              <div className="flex flex-wrap items-center gap-5">
                <Link
                  href={`/authors/${getAuthorSlug(author)}`}
                  className="group flex items-center gap-3 rounded-full transition-colors hover:bg-white/5"
                  rel="author"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#A3FFB3] to-[#30c06b] text-[11px] font-black text-[#022c14] shadow-sm">
                    {post.author_name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-black text-white/90 group-hover:text-white">{post.author_name}</p>
                    <p className="text-[11px] text-white/35 group-hover:text-white/55">{author.title}</p>
                  </div>
                </Link>
                <span className="text-white/20">·</span>
                <span className="text-xs font-medium text-white/40">{formatBlogDate(post.published_at)}</span>
                <span className="text-white/20">·</span>
                <span className="flex items-center gap-1.5 text-xs font-medium text-white/40">
                  <Clock size={11} /> {readTimeMinutes} min read
                </span>
              </div>
            </div>

            <div className="blog-load-in space-y-4" style={entryStyle(0.12)}>
              {coverImage ? (
                <div className="blog-glare-surface blog-glare-dark overflow-hidden rounded-[2rem] border border-white/10 bg-white/6 p-2 shadow-[0_24px_70px_rgba(0,0,0,0.18)] backdrop-blur-xl">
                  <div
                    className="relative z-10 h-56 rounded-[1.35rem] bg-zinc-900"
                    style={{
                      backgroundImage: `url(${coverImage})`,
                      backgroundPosition: 'center',
                      backgroundSize: 'cover',
                    }}
                  />
                </div>
              ) : null}

              <div className="blog-glare-surface blog-glare-dark rounded-[2rem] border border-white/10 bg-white/6 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.16)] backdrop-blur-xl">
                <div className="relative z-10">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A3FFB3]">Story snapshot</p>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-[1.2rem] border border-white/8 bg-white/5 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/38">Published</p>
                      <p className="mt-2 text-sm font-semibold leading-6 text-white/88">{formatBlogDate(post.published_at)}</p>
                    </div>
                    <div className="rounded-[1.2rem] border border-white/8 bg-white/5 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/38">Reading time</p>
                      <p className="mt-2 text-sm font-semibold leading-6 text-white/88">{readTimeMinutes} min</p>
                    </div>
                    <div className="rounded-[1.2rem] border border-white/8 bg-white/5 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/38">Sections</p>
                      <p className="mt-2 text-sm font-semibold leading-6 text-white/88">{articleSections.length || 1}</p>
                    </div>
                    <div className="rounded-[1.2rem] border border-white/8 bg-white/5 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/38">Category</p>
                      <p className="mt-2 text-sm font-semibold leading-6 text-white/88">{post.category}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-[108rem] px-4 pb-28 sm:px-6 lg:px-8 xl:px-8 2xl:px-10">
        <div
          className={[
            'grid gap-8',
            hasArticleToc
              ? 'xl:grid-cols-[17rem_minmax(0,58rem)_17rem] xl:items-stretch xl:justify-center xl:gap-8 2xl:grid-cols-[18rem_minmax(0,60rem)_18rem] 2xl:gap-10'
              : 'xl:grid-cols-[minmax(0,60rem)_17rem] xl:items-stretch xl:justify-center xl:gap-8 2xl:grid-cols-[minmax(0,62rem)_18rem] 2xl:gap-10',
          ].join(' ')}
        >
          {hasArticleToc ? (
            <aside className="hidden xl:block">
              <BlogFloatingRail topOffset={124} bottomOffset={32}>
                <BlogTableOfContents articleSections={articleSections.map(s => s.title)} />
              </BlogFloatingRail>
            </aside>
          ) : null}

          <div className={`min-w-0 space-y-10 -mt-6 ${hasArticleToc ? 'xl:col-start-2' : ''}`}>
            <div className="blog-load-in blog-glare-surface blog-glare-light relative overflow-hidden rounded-[2.3rem] border border-white/80 bg-[linear-gradient(160deg,rgba(255,255,255,0.98),rgba(243,247,244,0.95))] p-6 shadow-[0_28px_90px_rgba(18,24,21,0.08)] sm:p-8 lg:p-10" style={entryStyle(0.08)}>
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(163,255,179,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(2,109,50,0.06),transparent_30%)]" />
              <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(2,109,50,0.25),transparent)]" />
              <div className="relative z-10 mb-8 flex flex-wrap items-center gap-3 border-b border-black/5 pb-5">
                <span className="inline-flex items-center rounded-full bg-[#026d32]/8 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#026d32]">
                  Editor&apos;s guide
                </span>
                <p className="max-w-2xl text-sm leading-6 text-zinc-600">
                  Short, ATS-aware guidance built for fast scanning. Use the proof points, resume example, and checklists below as an execution guide.
                </p>
              </div>
              <article className="prose-article relative z-10">
              <MarkdownContent
                content={articleContent}
                inlineImages={inlineImages}
                imageAltBase={post.title}
                customBlocks={customBlocks}
              />
              </article>
            </div>

            {/* Author bio card */}
            <div className="blog-load-in rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8" style={entryStyle(0.16)}>
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#A3FFB3] to-[#30c06b] text-base font-black text-[#022c14] shadow-sm">
                  {author.name.charAt(0)}
                </div>
                <div>
                  <Link
                    href={`/authors/${getAuthorSlug(author)}`}
                    className="text-base font-black text-zinc-900 transition-colors hover:text-[#026d32]"
                    rel="author"
                  >
                    {author.name}
                  </Link>
                  <p className="mb-3 text-sm font-semibold text-[#026d32]">{author.title}</p>
                  <p className="text-sm leading-6 text-zinc-600">{author.bio}</p>
                  <Link
                    href={`/authors/${getAuthorSlug(author)}`}
                    className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#026d32] hover:underline"
                  >
                    More from {author.name.split(' ')[0]} <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            </div>

            <div className="blog-load-in blog-glare-surface blog-glare-dark rounded-[2rem] bg-[#030f07] p-8 sm:p-10" style={entryStyle(0.18)}>
              <div className="relative z-10">
                <p className="mb-3 text-[11px] font-black uppercase tracking-[0.22em] text-[#A3FFB3]">
                  Turn advice into interviews
                </p>
                <h3 className="mb-3 text-2xl font-black leading-tight tracking-tight text-white sm:text-3xl">
                  Put this article to work in Rezoomed.
                </h3>
                <p className="mb-7 max-w-lg text-sm leading-7 text-white/45">
                  Upload your resume, run a real ATS score, and tailor for a specific role — without losing your voice.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <BlogTrackedAppLink
                    slug={post.slug} ctaType="bottom" ctaText="Start with free ATS score" position={1}
                    href="/ats-checker"
                    className="inline-flex items-center justify-center rounded-full bg-[#026d32] px-6 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-white transition-all hover:bg-[#019a47] hover:-translate-y-0.5 shadow-lg shadow-[#026d32]/30"
                  >
                    Start with free ATS score
                  </BlogTrackedAppLink>
                  <BlogTrackedAppLink
                    slug={post.slug} ctaType="bottom" ctaText="Create account" position={2}
                    href="/auth/register"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/8 px-6 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-white transition-all hover:bg-white/15 hover:-translate-y-0.5"
                  >
                    Create free account <ArrowRight size={13} strokeWidth={2.5} />
                  </BlogTrackedAppLink>
                </div>
              </div>
            </div>

            {relatedPosts.length > 0 && (
              <div className="space-y-6 pt-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400 mb-1">Keep reading</p>
                  <h3 className="text-2xl font-black tracking-tight text-zinc-900">More from the playbook.</h3>
                </div>
                <div className="grid gap-5 md:grid-cols-3">
                  {relatedPosts.map(rp => (
                    <BlogRelatedPostLink
                      key={rp.id}
                      fromSlug={post.slug}
                      toSlug={rp.slug}
                      href={`/blog/${rp.slug}`}
                      className="blog-load-in group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-zinc-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                      style={entryStyle(0.22)}
                    >
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#026d32] mb-3">{rp.category}</p>
                      <h4 className="text-base font-black leading-snug text-zinc-900 group-hover:text-[#026d32] transition-colors line-clamp-3 mb-3 flex-1">
                        {rp.title}
                      </h4>
                      <p className="text-xs text-zinc-400 font-medium">{formatBlogDate(rp.published_at)}</p>
                    </BlogRelatedPostLink>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className={`hidden xl:block ${hasArticleToc ? 'xl:col-start-3' : ''}`}>
            <BlogFloatingRail topOffset={124} bottomOffset={32} contentClassName="space-y-6">
              <div className="blog-load-in blog-glare-surface blog-glare-dark rounded-[1.75rem] bg-gradient-to-br from-[#026d32] to-[#013d1c] p-6 shadow-[0_16px_48px_rgba(2,109,50,0.25)]" style={entryStyle(0.18)}>
                <div className="relative z-10 space-y-4">
                  <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                    <span className="text-lg">🚀</span>
                  </div>
                  <h4 className="text-sm font-black leading-snug text-white">Ready to optimize your resume?</h4>
                  <p className="text-xs leading-relaxed text-white/55">
                    Score, tailor, and rebuild in minutes. Free to start.
                  </p>
                  <BlogTrackedAppLink
                    slug={post.slug} ctaType="sidebar" ctaText="Build my resume" position={1}
                    href="/ats-checker"
                    className="inline-flex w-full items-center justify-center rounded-full bg-white px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-[#026d32] transition-all hover:bg-[#f0fdf4] shadow-sm"
                  >
                    Get my ATS score
                  </BlogTrackedAppLink>
                </div>
              </div>

              <div className="blog-load-in" style={entryStyle(0.24)}>
                <BlogShareButtons slug={post.slug} title={post.title} />
              </div>
            </BlogFloatingRail>
          </aside>
        </div>
      </main>

      <PublicSiteFooter />
    </div>
  )
}

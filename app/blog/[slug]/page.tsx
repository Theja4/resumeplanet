import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight, Clock } from 'lucide-react'
import BlogPostAnalyticsClient from '@/components/blog/BlogPostAnalyticsClient'
import BlogRelatedPostLink from '@/components/blog/BlogRelatedPostLink'
import BlogShareButtons from '@/components/blog/BlogShareButtons'
import BlogTrackedAppLink from '@/components/blog/BlogTrackedAppLink'
import MarkdownContent from '@/components/blog/MarkdownContent'
import ReadingProgress from '@/components/blog/ReadingProgress'
import PublicSiteHeader from '@/components/blog/PublicSiteHeader'
import PublicSiteFooter from '@/components/blog/PublicSiteFooter'
import {
  estimateReadTime,
  formatBlogDate,
  getBlogMediaFallback,
  getPublishedBlogPostBySlug,
  getPublishedBlogPosts,
} from '@/lib/blog'
import { buildBlogPostKeywords } from '@/lib/blog/seo'
import { getSiteUrl } from '@/lib/site'

export const dynamic = 'force-dynamic'

function slugifyHeading(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function extractArticleSections(content: string) {
  return content
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map(line => line.trim())
    .filter(line => /^##\s+/.test(line))
    .map(line => line.replace(/^##\s+/, '').trim())
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = await getPublishedBlogPostBySlug(slug)
  if (!post) return { title: 'Blog | Rezoomed' }
  const siteUrl = getSiteUrl()
  const image = post.cover_image_url || getBlogMediaFallback(post.slug)?.coverImage || `${siteUrl}/icon.png`

  return {
    title: `${post.title} | Rezoomed`,
    description: post.excerpt,
    keywords: buildBlogPostKeywords(post),
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
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: coverImage ? [coverImage.startsWith('http') ? coverImage : `${siteUrl}${coverImage}`] : [`${siteUrl}/icon.png`],
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: {
      '@type': 'Organization',
      name: post.author_name,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Rezoomed',
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/icon.png`,
      },
    },
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

  return (
    <div className="min-h-screen bg-white text-on-surface font-body selection:bg-primary-container selection:text-on-primary-container">
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

      <BlogPostAnalyticsClient
        slug={post.slug}
        title={post.title}
        category={post.category}
        readTimeMinutes={readTimeMinutes}
      />

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <div className={`relative ${coverImage ? 'pt-32 pb-0' : 'pt-32 pb-20 bg-[#030f07]'}`}>
        {coverImage && (
          <>
            {/* Full-bleed cover — heavily desaturated and dimmed */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${coverImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'brightness(0.25) saturate(0.4)',
              }}
            />
            {/* Strong solid dark layer — kills light images completely */}
            <div className="absolute inset-0 bg-zinc-950/70" />
            {/* Gradient: full dark at top, fades to white at very bottom for content blend */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white" />
          </>
        )}
        {!coverImage && (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(2,109,50,0.18),transparent_60%)]" />
        )}

        <div className="relative max-w-4xl mx-auto px-6 pb-24">
          {/* Back link */}
          <Link
            href="/blog"
            className="group inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-white/50 hover:text-white/90 transition-colors mb-10"
          >
            <ArrowLeft size={13} strokeWidth={3} />
            All articles
          </Link>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-3 mb-7">
            <span className={`inline-flex text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full ring-1 ${categoryStyle(post.category)}`}>
              {post.category}
            </span>
            <span className="text-xs text-white/40 font-medium">{formatBlogDate(post.published_at)}</span>
            <span className="text-white/20">·</span>
            <span className="flex items-center gap-1.5 text-xs text-white/40 font-medium">
              <Clock size={11} /> {readTimeMinutes} min read
            </span>
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-black tracking-tight text-white leading-[1.07] mb-7 max-w-3xl">
            {post.title}
          </h1>

          {/* Excerpt */}
          <p className="text-lg text-white/55 leading-relaxed max-w-2xl mb-10">
            {post.excerpt}
          </p>

          {/* Author */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#A3FFB3] to-[#30c06b] flex items-center justify-center text-[11px] font-black text-[#022c14] shadow-sm flex-shrink-0">
              {post.author_name.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-black text-white/90">{post.author_name}</p>
              <p className="text-[11px] text-white/35">Rezoomed Editorial</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────────── */}
      <main className="mx-auto max-w-[88rem] px-6 pb-28 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_280px] xl:grid-cols-[minmax(0,1fr)_300px] lg:items-start">

          {/* Article */}
          <div className="space-y-10 -mt-6">
            <div className="relative overflow-hidden rounded-[2.3rem] border border-white/80 bg-[linear-gradient(160deg,rgba(255,255,255,0.98),rgba(243,247,244,0.95))] p-6 shadow-[0_28px_90px_rgba(18,24,21,0.08)] sm:p-8 lg:p-10">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(163,255,179,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(2,109,50,0.06),transparent_30%)]" />
              <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(2,109,50,0.25),transparent)]" />
              <div className="relative mb-8 flex flex-wrap items-center gap-3 border-b border-black/5 pb-5">
                <span className="inline-flex items-center rounded-full bg-[#026d32]/8 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#026d32]">
                  Editor's guide
                </span>
                <p className="max-w-2xl text-sm leading-6 text-zinc-600">
                  Short, ATS-aware guidance built for fast scanning. Use the visuals and tables below as your checklist, not background noise.
                </p>
              </div>
              <article className="prose-article relative">
              <MarkdownContent content={articleContent} inlineImages={inlineImages} />
              </article>
            </div>

            {/* Bottom CTA */}
            <div className="rounded-[2rem] bg-[#030f07] p-8 sm:p-10">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#A3FFB3] mb-3">
                Turn advice into interviews
              </p>
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-3 leading-tight">
                Put this article to work in Rezoomed.
              </h3>
              <p className="text-sm text-white/45 leading-7 max-w-lg mb-7">
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

            {/* Related posts */}
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
                      className="group flex flex-col h-full rounded-[1.75rem] border border-zinc-100 bg-white p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden"
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

          {/* Sidebar */}
          <aside className="space-y-6 lg:sticky lg:top-24">
            {articleSections.length > 0 && (
              <div className="relative overflow-hidden rounded-[1.9rem] border border-white/10 bg-[linear-gradient(160deg,#050b07_0%,#0a1710_55%,#10261a_100%)] p-6 shadow-[0_28px_90px_rgba(4,10,7,0.28)]">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(163,255,179,0.16),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(48,192,107,0.14),transparent_24%)]" />
                <p className="relative text-[10px] font-black uppercase tracking-[0.2em] text-[#A3FFB3]">In this article</p>
                <div className="mt-4 space-y-3">
                  {articleSections.map(section => (
                    <a
                      key={section}
                      href={`#${slugifyHeading(section)}`}
                      className="relative flex items-start gap-3 rounded-[1.15rem] border border-white/8 bg-white/6 px-4 py-3 text-sm leading-6 text-white/84 backdrop-blur-sm transition-colors hover:border-[#A3FFB3]/35 hover:bg-white/10 hover:text-white"
                    >
                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#30c06b]" />
                      <span>{section}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* CTA box */}
            <div className="rounded-[1.75rem] bg-gradient-to-br from-[#026d32] to-[#013d1c] p-6 space-y-4 shadow-[0_16px_48px_rgba(2,109,50,0.25)]">
              <div className="h-10 w-10 rounded-xl bg-white/15 flex items-center justify-center mb-1">
                <span className="text-lg">🚀</span>
              </div>
              <h4 className="text-sm font-black text-white leading-snug">Ready to optimize your resume?</h4>
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

            {/* Share buttons */}
            <BlogShareButtons slug={post.slug} title={post.title} />
          </aside>
        </div>
      </main>

      <PublicSiteFooter />
    </div>
  )
}

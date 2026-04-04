import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import BlogPostAnalyticsClient from '@/components/blog/BlogPostAnalyticsClient'
import BlogRelatedPostLink from '@/components/blog/BlogRelatedPostLink'
import BlogShareButtons from '@/components/blog/BlogShareButtons'
import BlogTrackedAppLink from '@/components/blog/BlogTrackedAppLink'
import MarkdownContent from '@/components/blog/MarkdownContent'
import PublicSiteHeader from '@/components/blog/PublicSiteHeader'
import PublicSiteFooter from '@/components/blog/PublicSiteFooter'
import {
  formatBlogDate,
  getBlogMediaFallback,
  getPublishedBlogPostBySlug,
  getPublishedBlogPosts,
  stripMarkdown,
} from '@/lib/blog'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = await getPublishedBlogPostBySlug(slug)

  if (!post) {
    return {
      title: 'Blog | Rezoomed',
    }
  }

  return {
    title: `${post.title} | Rezoomed`,
    description: post.excerpt,
  }
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

  if (!post) {
    notFound()
  }

  const normalizedLines = post.content.replace(/\r\n/g, '\n').split('\n')
  const firstNonEmptyLineIndex = normalizedLines.findIndex(line => line.trim().length > 0)
  const articleContent =
    firstNonEmptyLineIndex !== -1 && /^#\s+/.test(normalizedLines[firstNonEmptyLineIndex].trim())
      ? normalizedLines.slice(firstNonEmptyLineIndex + 1).join('\n').trim()
      : post.content
  const mediaFallback = getBlogMediaFallback(post.slug)
  const coverImage = post.cover_image_url || mediaFallback?.coverImage || null
  const inlineImages = mediaFallback?.inlineImages ?? []
  const readTimeMinutes = Math.max(
    1,
    Math.ceil(stripMarkdown(articleContent).split(/\s+/).filter(Boolean).length / 220)
  )
  const relatedPosts = publishedPosts.filter(candidate => candidate.slug !== post.slug).slice(0, 3)

  return (
    <div className="min-h-screen bg-background-landing text-on-surface font-body selection:bg-primary-container selection:text-on-primary-container">
      <PublicSiteHeader active="blog" />

      <BlogPostAnalyticsClient
        slug={post.slug}
        title={post.title}
        category={post.category}
        readTimeMinutes={readTimeMinutes}
      />

      <main className="mx-auto max-w-[92rem] px-6 pb-24 pt-36 lg:px-10">
        <div className="space-y-12">
          <Link href="/blog" className="group inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-[#008f44] transition-all hover:gap-3">
            <ArrowLeft size={14} strokeWidth={3} />
            Back to blog
          </Link>

          <div className="space-y-8">
            <div className="flex flex-wrap items-center gap-4">
              <span className="rounded-full bg-[#008f44]/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#008f44] backdrop-blur-md">
                {post.category}
              </span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">{formatBlogDate(post.published_at)}</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-on-background sm:text-5xl lg:text-6xl leading-[1.07]">
              {post.title}
            </h1>
            <p className="text-lg leading-relaxed text-on-surface-variant/90 max-w-3xl">
              {post.excerpt}
            </p>
            <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-zinc-100">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#A3FFB3] to-[#80da92] shadow-sm flex items-center justify-center text-[10px] font-black text-[#005224]">
                  {post.author_name.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-black text-on-background">{post.author_name}</p>
                  <p className="text-[10px] text-zinc-400">Editorial Team</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                {readTimeMinutes} min read
              </div>
            </div>
          </div>

          {coverImage ? (
            <div
              className="relative aspect-[21/9] w-full overflow-hidden rounded-[3rem] border border-white/70 bg-white/88 shadow-[0_32px_64px_rgba(25,28,29,0.08)]"
            >
              <div
                className="absolute inset-0 transition-transform duration-700 hover:scale-105"
                style={{
                  backgroundImage: `linear-gradient(180deg, rgba(245,251,247,0.1), rgba(255,255,255,0.05)), url(${coverImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
            </div>
          ) : null}

          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-8">
              <div className="overflow-hidden rounded-3xl border border-white/70 bg-white/88 px-8 py-10 shadow-[0_22px_60px_rgba(25,28,29,0.05)] sm:px-12 sm:py-12 lg:px-16 lg:py-14">
                <article>
                  <MarkdownContent content={articleContent} />
                </article>
              </div>

              <div className="rounded-[2.5rem] border border-[#008f44]/20 bg-[linear-gradient(135deg,rgba(163,255,179,0.16),rgba(255,255,255,0.92))] p-8 shadow-[0_18px_48px_rgba(25,28,29,0.06)]">
                <div className="space-y-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#008f44]">Turn advice into interviews</p>
                  <h3 className="text-3xl font-black tracking-tight text-on-background">Put this article to work in Rezoomed.</h3>
                  <p className="max-w-2xl text-sm leading-7 text-on-surface-variant">
                    Upload your resume, run an ATS score, and tailor the document to a real job description without losing your voice.
                  </p>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <BlogTrackedAppLink
                    slug={post.slug}
                    ctaType="bottom"
                    ctaText="Start with free ATS score"
                    position={1}
                    href="/ats-checker"
                    className="inline-flex items-center justify-center rounded-full bg-zinc-950 px-6 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-white transition-all hover:-translate-y-0.5 hover:bg-zinc-900"
                  >
                    Start with free ATS score
                  </BlogTrackedAppLink>
                  <BlogTrackedAppLink
                    slug={post.slug}
                    ctaType="bottom"
                    ctaText="Create Rezoomed account"
                    position={2}
                    href="/auth/register"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-[#008f44]/18 bg-white px-6 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-[#008f44] transition-all hover:-translate-y-0.5 hover:border-[#008f44]/28 hover:bg-[#008f44]/5"
                  >
                    Create Rezoomed account
                    <ArrowRight size={14} strokeWidth={2.4} />
                  </BlogTrackedAppLink>
                </div>
              </div>

              {relatedPosts.length > 0 ? (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Related reads</p>
                    <h3 className="text-2xl font-black tracking-tight text-on-background">Keep exploring the Rezoomed playbook.</h3>
                  </div>
                  <div className="grid gap-5 md:grid-cols-3">
                    {relatedPosts.map(relatedPost => (
                      <BlogRelatedPostLink
                        key={relatedPost.id}
                        fromSlug={post.slug}
                        toSlug={relatedPost.slug}
                        href={`/blog/${relatedPost.slug}`}
                        className="group flex h-full flex-col rounded-[2rem] border border-white/70 bg-white/88 p-6 shadow-[0_16px_42px_rgba(25,28,29,0.05)] transition-all hover:-translate-y-1 hover:shadow-xl"
                      >
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#008f44]">{relatedPost.category}</p>
                        <h4 className="mt-4 text-lg font-black leading-tight text-on-background transition-colors group-hover:text-[#008f44]">
                          {relatedPost.title}
                        </h4>
                        <p className="mt-3 text-sm leading-6 text-on-surface-variant line-clamp-3">
                          {relatedPost.excerpt}
                        </p>
                      </BlogRelatedPostLink>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <aside className="space-y-10">
              <div className="rounded-[2.5rem] border border-[#008f44]/20 bg-[#008f44]/5 p-8 space-y-4">
                <h4 className="text-sm font-black uppercase tracking-widest text-[#008f44]">Ready to optimize?</h4>
                <p className="text-xs leading-relaxed text-on-surface-variant">Turn these insights into interviews. Use Rezoomed to score, tailor, and rebuild your resume in minutes.</p>
                <BlogTrackedAppLink
                  slug={post.slug}
                  ctaType="sidebar"
                  ctaText="Build my resume"
                  position={1}
                  href="/ats-checker"
                  className="inline-flex w-full items-center justify-center rounded-full bg-[#008f44] px-6 py-3 text-[11px] font-black uppercase tracking-widest text-white transition-all hover:bg-[#005224] shadow-lg shadow-[#008f44]/20"
                >
                  Build my resume
                </BlogTrackedAppLink>
              </div>

              <BlogShareButtons slug={post.slug} title={post.title} />

              {inlineImages.length > 0 ? (
                <div className="space-y-8">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 px-2">Visual Insights</p>
                  <div className="grid gap-6">
                    {inlineImages.map(image => (
                      <div key={image} className="group overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 shadow-[0_18px_42px_rgba(25,28,29,0.06)] transition-all hover:shadow-xl hover:-translate-y-1">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={image} alt="" className="w-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </aside>
          </div>
        </div>
      </main>

      <PublicSiteFooter />
    </div>
  )
}

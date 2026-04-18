import type { CSSProperties } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Clock, Sparkles } from 'lucide-react'
import PublicSiteHeader from '@/components/blog/PublicSiteHeader'
import PublicSiteFooter from '@/components/blog/PublicSiteFooter'
import { estimateReadTime, formatBlogDate, getBlogMediaFallback, getPublishedBlogPosts } from '@/lib/blog'
import { buildBlogIndexKeywords } from '@/lib/blog/seo'
import { getSiteUrl } from '@/lib/site'

export async function generateMetadata(): Promise<Metadata> {
  const posts = await getPublishedBlogPosts()
  const siteUrl = getSiteUrl()
  const featured = posts[0] ?? null
  const image = featured?.cover_image_url || (featured ? getBlogMediaFallback(featured.slug)?.coverImage : null) || `${siteUrl}/icon.png`

  return {
    title: 'Resume Advice & ATS Tips Blog | Rezoomed',
    description: 'Resume advice, ATS tips, job search strategies, and career insights to help you get more interviews.',
    keywords: buildBlogIndexKeywords(posts),
    alternates: {
      canonical: '/blog',
    },
    openGraph: {
      type: 'website',
      title: 'Resume Advice & ATS Tips Blog | Rezoomed',
      description: 'Resume advice, ATS tips, job search strategies, and career insights to help you get more interviews.',
      url: `${siteUrl}/blog`,
      images: [{ url: image }],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Resume Advice & ATS Tips Blog | Rezoomed',
      description: 'Resume advice, ATS tips, job search strategies, and career insights to help you get more interviews.',
      images: [image],
    },
  }
}

const CATEGORY_COLORS: Record<string, string> = {
  'career tips': 'bg-blue-50 text-blue-700 ring-blue-100',
  'resume advice': 'bg-violet-50 text-violet-700 ring-violet-100',
  ats: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  'product update': 'bg-amber-50 text-amber-700 ring-amber-100',
  'job search': 'bg-rose-50 text-rose-700 ring-rose-100',
}

function categoryStyle(cat: string) {
  return CATEGORY_COLORS[cat.toLowerCase()] ?? 'bg-zinc-100 text-zinc-600 ring-zinc-200'
}

function entryStyle(delay = 0): CSSProperties {
  return {
    transitionDelay: `${delay}s`,
  }
}

export default async function BlogPage() {
  const posts = await getPublishedBlogPosts()
  const [featured, ...rest] = posts
  const spotlightPosts = rest.slice(0, 2)
  const gridPosts = rest.slice(2)
  const featuredCover = featured
    ? featured.cover_image_url || getBlogMediaFallback(featured.slug)?.coverImage || null
    : null
  const highlightedCategories = Array.from(new Set(posts.map(post => post.category).filter(Boolean))).slice(0, 4)
  const siteUrl = getSiteUrl()
  const blogCollectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Rezoomed Blog',
    description: 'Resume advice, ATS tips, job search strategies, and career insights from the Rezoomed team.',
    url: `${siteUrl}/blog`,
    publisher: {
      '@type': 'Organization',
      name: 'Rezoomed',
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/icon.png`,
      },
    },
    blogPost: posts.slice(0, 10).map(post => ({
      '@type': 'BlogPosting',
      headline: post.title,
      url: `${siteUrl}/blog/${post.slug}`,
      datePublished: post.published_at,
      dateModified: post.updated_at,
      author: {
        '@type': 'Organization',
        name: post.author_name,
      },
    })),
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-white font-body text-on-surface selection:bg-primary-container selection:text-on-primary-container">
      <PublicSiteHeader active="blog" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogCollectionJsonLd) }}
      />

      <div className="relative overflow-hidden bg-[#030f07] px-6 pb-24 pt-32">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(163,255,179,0.16),transparent_26%),radial-gradient(circle_at_top_right,rgba(48,192,107,0.12),transparent_24%),linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:100%_100%,100%_100%,38px_38px,38px_38px]" />
        <div className="login-aurora pointer-events-none absolute -left-20 top-10 h-64 w-64 rounded-full bg-[#A3FFB3]/12 blur-3xl" />
        <div className="login-aurora-two pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-[#30c06b]/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl">
          <div className="grid gap-10 xl:grid-cols-[minmax(0,1.08fr)_minmax(22rem,0.92fr)] xl:items-end">
            <div className="blog-load-in space-y-6">
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#A3FFB3]/60">The Career Curator</p>
              <div className="space-y-5">
                <h1 className="max-w-4xl text-5xl font-black leading-none tracking-tighter text-white md:text-7xl">
                  A sharper editorial
                  <br />
                  <span className="bg-gradient-to-r from-[#A3FFB3] to-[#30c06b] bg-clip-text text-transparent">
                    edge for job seekers.
                  </span>
                </h1>
                <p className="max-w-2xl text-base leading-8 text-white/50 sm:text-lg">
                  Resume strategy, ATS mechanics, hiring signals, and product updates written with the same clarity job seekers need when the stakes are high.
                </p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {highlightedCategories.map((category, index) => (
                  <span
                    key={category}
                    className="blog-load-in inline-flex rounded-full border border-white/10 bg-white/6 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/72"
                    style={entryStyle(0.08 * (index + 1))}
                  >
                    {category}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <div className="blog-load-in blog-glare-surface blog-glare-dark rounded-[2rem] border border-white/10 bg-white/6 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.16)] backdrop-blur-xl" style={entryStyle(0.1)}>
                <div className="relative z-10">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A3FFB3]">Editorial standard</p>
                  <h2 className="mt-3 text-2xl font-black tracking-tight text-white">Less noise. More signal.</h2>
                  <p className="mt-3 text-sm leading-7 text-white/60">
                    Built for fast scanning, strong hierarchy, and real job-search decisions instead of filler content and recycled advice.
                  </p>
                </div>
              </div>
              <div className="blog-load-in blog-glare-surface blog-glare-dark rounded-[2rem] border border-white/10 bg-[linear-gradient(160deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.12)] backdrop-blur-xl" style={entryStyle(0.18)}>
                <div className="relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#A3FFB3]/14 text-[#A3FFB3]">
                      <Sparkles size={18} strokeWidth={2.2} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A3FFB3]">Coverage</p>
                      <p className="mt-1 text-lg font-black text-white">{posts.length} published articles</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-white/58">
                    Guides, tactics, and explainers that connect directly to the tools inside Rezoomed.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl space-y-16 px-6 py-16 pb-28">
        {featured ? (
          <section className="space-y-6">
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400">Featured story</span>
              <div className="h-px flex-1 bg-zinc-100" />
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(19rem,0.8fr)]">
              <Link
                href={`/blog/${featured.slug}`}
                className="blog-load-in blog-glare-surface blog-glare-dark group relative block overflow-hidden rounded-[2.6rem] bg-zinc-950 shadow-[0_32px_80px_rgba(0,0,0,0.16)] transition-transform duration-300 hover:-translate-y-1"
              >
                {featuredCover ? (
                  <div
                    className="absolute inset-0 transition-transform duration-700 group-hover:scale-[1.03]"
                    style={{
                      backgroundImage: `url(${featuredCover})`,
                      backgroundPosition: 'center',
                      backgroundSize: 'cover',
                    }}
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/72 to-zinc-950/22" />
                <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/72 via-zinc-950/18 to-transparent" />

                <div className="relative z-10 flex min-h-[510px] flex-col justify-between p-10 sm:p-14 lg:min-h-[560px] lg:p-16">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ring-1 ${categoryStyle(featured.category)}`}>
                      {featured.category}
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35">Lead analysis</span>
                  </div>

                  <div className="max-w-2xl space-y-5">
                    <h2 className="text-4xl font-black leading-[1.04] tracking-tight text-white md:text-5xl lg:text-[3.55rem]">
                      {featured.title}
                    </h2>
                    <p className="line-clamp-3 text-base leading-relaxed text-white/60 md:text-lg">
                      {featured.excerpt}
                    </p>
                    <div className="flex flex-wrap items-center gap-5 pt-2">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#A3FFB3] to-[#30c06b] text-[10px] font-black text-[#022c14]">
                          {featured.author_name.charAt(0)}
                        </div>
                        <span className="text-xs font-semibold text-white/68">{featured.author_name}</span>
                      </div>
                      <span className="text-white/25">·</span>
                      <span className="text-xs font-medium text-white/40">{formatBlogDate(featured.published_at)}</span>
                      <span className="text-white/25">·</span>
                      <span className="flex items-center gap-1 text-xs font-medium text-white/40">
                        <Clock size={11} /> {estimateReadTime(featured.content)} min
                      </span>
                      <div className="ml-auto flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#A3FFB3] transition-all group-hover:gap-3">
                        Read article <ArrowRight size={14} />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>

              <div className="space-y-4">
                {spotlightPosts.map((post, index) => {
                  const cover = post.cover_image_url || getBlogMediaFallback(post.slug)?.coverImage || null

                  return (
                    <Link
                      key={post.id}
                      href={`/blog/${post.slug}`}
                      className="blog-load-in blog-glare-surface blog-glare-light group relative block overflow-hidden rounded-[2rem] border border-zinc-100 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_54px_rgba(0,0,0,0.11)]"
                      style={entryStyle(0.1 * (index + 1))}
                    >
                      <div className="relative h-48 overflow-hidden bg-zinc-100">
                        {cover ? (
                          <div
                            className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
                            style={{ backgroundImage: `url(${cover})`, backgroundPosition: 'center', backgroundSize: 'cover' }}
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-green-50" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/55 to-transparent" />
                        <div className="absolute left-4 top-4">
                          <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ring-1 backdrop-blur-sm ${categoryStyle(post.category)}`}>
                            {post.category}
                          </span>
                        </div>
                      </div>
                      <div className="relative z-10 space-y-3 p-6">
                        <h3 className="text-xl font-black leading-tight tracking-tight text-zinc-950 transition-colors group-hover:text-[#026d32]">
                          {post.title}
                        </h3>
                        <p className="line-clamp-3 text-sm leading-7 text-zinc-500">{post.excerpt}</p>
                        <div className="flex items-center justify-between border-t border-zinc-100 pt-4">
                          <span className="text-[11px] font-medium text-zinc-400">{formatBlogDate(post.published_at)}</span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#026d32]">
                            Read <ArrowRight size={13} />
                          </span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          </section>
        ) : null}

        {gridPosts.length > 0 ? (
          <section>
            <div className="mb-10 flex items-center gap-4">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400">Latest dispatches</span>
              <div className="h-px flex-1 bg-zinc-100" />
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {gridPosts.map((post, index) => {
                const cover = post.cover_image_url || getBlogMediaFallback(post.slug)?.coverImage || null
                const mins = estimateReadTime(post.content)

                return (
                  <Link
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    className="blog-load-in blog-glare-surface blog-glare-light group flex flex-col overflow-hidden rounded-[2rem] border border-zinc-100 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(0,0,0,0.10)]"
                    style={entryStyle(0.04 * index)}
                  >
                    <div className="relative h-52 flex-shrink-0 overflow-hidden bg-zinc-50">
                      {cover ? (
                        <div
                          className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
                          style={{ backgroundImage: `url(${cover})`, backgroundPosition: 'center', backgroundSize: 'cover' }}
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-green-50" />
                      )}
                      <div className="absolute left-4 top-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ring-1 backdrop-blur-sm ${categoryStyle(post.category)}`}>
                          {post.category}
                        </span>
                      </div>
                    </div>

                    <div className="relative z-10 flex flex-1 flex-col p-7">
                      <h3 className="mb-3 line-clamp-2 text-[1.15rem] font-black leading-tight text-zinc-900 transition-colors group-hover:text-[#026d32]">
                        {post.title}
                      </h3>
                      <p className="mb-6 line-clamp-3 flex-1 text-sm leading-relaxed text-zinc-500">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center justify-between border-t border-zinc-50 pt-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#A3FFB3] to-[#80da92] text-[8px] font-black text-[#022c14]">
                            {post.author_name.charAt(0)}
                          </div>
                          <span className="text-[11px] font-medium text-zinc-400">{formatBlogDate(post.published_at)}</span>
                        </div>
                        <span className="flex items-center gap-1 text-[10px] font-medium text-zinc-400">
                          <Clock size={10} /> {mins} min
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        ) : null}

        {!featured ? (
          <div className="rounded-[2rem] border border-zinc-100 bg-zinc-50 px-8 py-16 text-center">
            <p className="text-lg font-bold text-zinc-900">No posts published yet.</p>
            <p className="mt-2 text-sm text-zinc-500">Published posts from the admin panel will appear here.</p>
          </div>
        ) : null}
      </main>

      <PublicSiteFooter />
    </div>
  )
}

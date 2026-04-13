import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Clock } from 'lucide-react'
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


// Deterministic colour from category string
const CATEGORY_COLORS: Record<string, string> = {
  'career tips':      'bg-blue-50   text-blue-700   ring-blue-100',
  'resume advice':    'bg-violet-50 text-violet-700 ring-violet-100',
  'ats':              'bg-emerald-50 text-emerald-700 ring-emerald-100',
  'product update':   'bg-amber-50  text-amber-700  ring-amber-100',
  'job search':       'bg-rose-50   text-rose-700   ring-rose-100',
}

function categoryStyle(cat: string) {
  return CATEGORY_COLORS[cat.toLowerCase()] ?? 'bg-zinc-100 text-zinc-600 ring-zinc-200'
}

export default async function BlogPage() {
  const posts = await getPublishedBlogPosts()
  const [featured, ...rest] = posts
  const featuredCover = featured
    ? featured.cover_image_url || getBlogMediaFallback(featured.slug)?.coverImage || null
    : null
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
    <div className="bg-white text-on-surface font-body selection:bg-primary-container selection:text-on-primary-container min-h-screen">
      <PublicSiteHeader active="blog" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogCollectionJsonLd) }}
      />

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="bg-[#030f07] pt-32 pb-20 px-6 text-center">
        <p className="mb-4 text-[11px] font-black uppercase tracking-[0.3em] text-[#A3FFB3]/60">The Career Curator</p>
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-none">
          Insights that get<br />
          <span className="bg-gradient-to-r from-[#A3FFB3] to-[#30c06b] bg-clip-text text-transparent">
            you hired.
          </span>
        </h1>
        <p className="mt-6 text-base text-white/40 max-w-md mx-auto leading-relaxed">
          Strategy, product updates, and job-search advice from the Rezoomed team.
        </p>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-16 space-y-16 pb-28">

        {/* ── Featured post ──────────────────────────────────────────────────── */}
        {featured && (
          <Link
            href={`/blog/${featured.slug}`}
            className="group block relative overflow-hidden rounded-[2.5rem] bg-zinc-950 shadow-[0_32px_80px_rgba(0,0,0,0.16)] transition-transform duration-300 hover:-translate-y-1"
          >
            {/* Cover image layer */}
            {featuredCover && (
              <div
                className="absolute inset-0 transition-transform duration-700 group-hover:scale-[1.02]"
                style={{
                  backgroundImage: `url(${featuredCover})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
            )}
            {/* Dark gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-zinc-950/20" />
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/60 via-transparent to-transparent" />

            {/* Content */}
            <div className="relative min-h-[480px] md:min-h-[520px] flex flex-col justify-end p-10 sm:p-14 lg:p-16">
              <div className="max-w-2xl space-y-5">
                <span className={`inline-flex text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full ring-1 ${categoryStyle(featured.category)}`}>
                  {featured.category}
                </span>
                <h2 className="text-4xl md:text-5xl lg:text-[3.4rem] font-black tracking-tight text-white leading-[1.07]">
                  {featured.title}
                </h2>
                <p className="text-base md:text-lg text-white/60 leading-relaxed line-clamp-2">
                  {featured.excerpt}
                </p>
                <div className="flex items-center gap-5 pt-2">
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[#A3FFB3] to-[#30c06b] flex items-center justify-center text-[9px] font-black text-[#022c14]">
                      {featured.author_name.charAt(0)}
                    </div>
                    <span className="text-xs font-semibold text-white/60">{featured.author_name}</span>
                  </div>
                  <span className="text-white/25">·</span>
                  <span className="text-xs text-white/40 font-medium">{formatBlogDate(featured.published_at)}</span>
                  <span className="text-white/25">·</span>
                  <span className="flex items-center gap-1 text-xs text-white/40 font-medium">
                    <Clock size={11} /> {estimateReadTime(featured.content)} min
                  </span>
                  <div className="ml-auto flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#A3FFB3] group-hover:gap-3 transition-all">
                    Read <ArrowRight size={14} />
                  </div>
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* ── Post grid ──────────────────────────────────────────────────────── */}
        {rest.length > 0 && (
          <div>
            <div className="flex items-center gap-4 mb-10">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400">Latest articles</span>
              <div className="flex-1 h-px bg-zinc-100" />
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {rest.map(post => {
                const cover = post.cover_image_url || getBlogMediaFallback(post.slug)?.coverImage || null
                const mins = estimateReadTime(post.content)

                return (
                  <Link
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    className="group flex flex-col rounded-[2rem] overflow-hidden border border-zinc-100 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.05)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.10)] hover:-translate-y-1 transition-all duration-300"
                  >
                    {/* Image */}
                    <div className="relative h-52 bg-zinc-50 overflow-hidden flex-shrink-0">
                      {cover ? (
                        <div
                          className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
                          style={{ backgroundImage: `url(${cover})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-green-50" />
                      )}
                      {/* Category chip */}
                      <div className="absolute top-4 left-4">
                        <span className={`inline-flex text-[10px] font-black uppercase tracking-[0.18em] px-3 py-1 rounded-full ring-1 backdrop-blur-sm ${categoryStyle(post.category)}`}>
                          {post.category}
                        </span>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="flex flex-col flex-1 p-7">
                      <h3 className="text-[1.15rem] font-black leading-tight text-zinc-900 group-hover:text-[#026d32] transition-colors line-clamp-2 mb-3">
                        {post.title}
                      </h3>
                      <p className="text-sm text-zinc-500 leading-relaxed line-clamp-3 flex-1 mb-6">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center justify-between pt-4 border-t border-zinc-50">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-[#A3FFB3] to-[#80da92] flex items-center justify-center text-[8px] font-black text-[#022c14] flex-shrink-0">
                            {post.author_name.charAt(0)}
                          </div>
                          <span className="text-[11px] text-zinc-400 font-medium">{formatBlogDate(post.published_at)}</span>
                        </div>
                        <span className="flex items-center gap-1 text-[10px] text-zinc-400 font-medium">
                          <Clock size={10} /> {mins} min
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {!featured && (
          <div className="rounded-[2rem] border border-zinc-100 bg-zinc-50 px-8 py-16 text-center">
            <p className="text-lg font-bold text-zinc-900">No posts published yet.</p>
            <p className="mt-2 text-sm text-zinc-500">Published posts from the admin panel will appear here.</p>
          </div>
        )}
      </main>

      <PublicSiteFooter />
    </div>
  )
}

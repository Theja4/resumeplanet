import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import PublicSiteHeader from '@/components/blog/PublicSiteHeader'
import PublicSiteFooter from '@/components/blog/PublicSiteFooter'
import { formatBlogDate, getBlogMediaFallback, getPublishedBlogPosts } from '@/lib/blog'

export const metadata: Metadata = {
  title: 'Blog | Rezoomed',
  description: 'Insights, product updates, and job-search strategy from the Rezoomed team.',
}

export default async function BlogPage() {
  const posts = await getPublishedBlogPosts()
  const [featuredPost, ...otherPosts] = posts
  const featuredCoverImage = featuredPost ? featuredPost.cover_image_url || getBlogMediaFallback(featuredPost.slug)?.coverImage || null : null

  return (
    <div className="bg-background-landing text-on-surface font-body selection:bg-primary-container selection:text-on-primary-container min-h-screen">
      <PublicSiteHeader active="blog" />

      <main className="pt-28 pb-24 px-6 max-w-7xl mx-auto space-y-20">
        <div className="space-y-6 text-center reveal-on-scroll active">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter leading-none text-on-background">The Career <span className="text-[#008f44]">Curator</span>.</h1>
          <p className="text-lg md:text-xl text-on-surface-variant max-w-2xl mx-auto leading-relaxed">Insights, strategies, and updates from the team building the future of ATS optimization.</p>
        </div>

        {featuredPost ? (
          <Link
            href={`/blog/${featuredPost.slug}`}
            className="group grid gap-0 overflow-hidden rounded-[3rem] border border-white/70 bg-white/88 shadow-[0_22px_60px_rgba(25,28,29,0.06)] backdrop-blur-xl lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.6fr)]"
          >
            <div
              className="relative flex min-h-[28rem] flex-col justify-center overflow-hidden p-10 sm:p-14"
              style={{
                backgroundImage: featuredCoverImage
                  ? `linear-gradient(135deg, rgba(242,247,243,0.5), rgba(255,255,255,0.85)), url(${featuredCoverImage})`
                  : 'radial-gradient(circle_at_top_left,rgba(163,255,179,0.28),transparent_42%),linear-gradient(135deg,#f2f7f3_0%,#ffffff_100%)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent,rgba(2,109,50,0.02))]" />
              <div className="relative max-w-2xl space-y-8">
                <span className="inline-flex rounded-full bg-[#008f44]/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-[#008f44] backdrop-blur-md">
                  Featured: {featuredPost.category}
                </span>
                <h2 className="text-5xl font-black tracking-tight text-on-background sm:text-7xl leading-[1.05]">
                  {featuredPost.title}
                </h2>
                <p className="max-w-xl text-lg leading-relaxed text-on-surface-variant/90">
                  {featuredPost.excerpt}
                </p>
              </div>
            </div>

            <div className="flex flex-col justify-between gap-12 border-l border-white/40 p-10 sm:p-14 bg-white/40">
              <div className="space-y-4">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">
                  {formatBlogDate(featuredPost.published_at)}
                </p>
                <div className="h-0.5 w-8 bg-[#008f44]/20" />
                <p className="text-sm font-bold text-on-surface-variant flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#008f44]" />
                  By {featuredPost.author_name}
                </p>
              </div>
              <div className="inline-flex items-center gap-3 text-xs font-black uppercase tracking-[0.2em] text-[#008f44] group-hover:gap-5 transition-all">
                Read full article
                <ArrowRight size={16} />
              </div>
            </div>
          </Link>
        ) : (
          <div className="rounded-[2rem] border border-white/70 bg-white/88 px-8 py-12 text-center shadow-[0_22px_60px_rgba(25,28,29,0.06)]">
            <p className="text-lg font-bold text-on-background">No blog posts published yet.</p>
            <p className="mt-2 text-sm text-on-surface-variant">Published posts from the admin panel will appear here.</p>
          </div>
        )}

        {otherPosts.length > 0 ? (
          <div className="grid grid-cols-1 gap-12 pb-10 md:grid-cols-2">
            {otherPosts.map(post => {
              const coverImage = post.cover_image_url || getBlogMediaFallback(post.slug)?.coverImage || null

              return (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group flex flex-col overflow-hidden rounded-[2.5rem] border border-white/70 bg-white/88 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all card-hover h-full"
                >
                  <div
                    className="relative flex h-64 items-end overflow-hidden border-b border-surface-container-highest p-8"
                    style={{
                      backgroundImage: coverImage
                        ? `linear-gradient(180deg, rgba(245,251,247,0.15), rgba(238,244,239,0.72)), url(${coverImage})`
                        : 'radial-gradient(circle_at_top_left,rgba(163,255,179,0.24),transparent_36%),linear-gradient(135deg,#f5fbf7_0%,#eef4ef_100%)',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                    <div className="rounded-full bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#008f44] backdrop-blur-md shadow-sm">
                      {post.category}
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-10">
                    <h3 className="mb-4 text-2xl font-black leading-tight text-on-background transition-colors group-hover:text-[#008f44]">
                      {post.title}
                    </h3>
                    <p className="mb-10 flex-1 text-base leading-relaxed text-on-surface-variant line-clamp-3">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between border-t border-zinc-100 pt-6">
                      <div className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">
                        {formatBlogDate(post.published_at)}
                      </div>
                      <div className="text-[11px] font-black uppercase tracking-[0.12em] text-[#008f44]">
                        Read more
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : null}
      </main>

      <PublicSiteFooter />
    </div>
  )
}

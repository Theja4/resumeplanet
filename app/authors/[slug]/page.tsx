import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, Clock } from 'lucide-react'
import PublicSiteHeader from '@/components/blog/PublicSiteHeader'
import PublicSiteFooter from '@/components/blog/PublicSiteFooter'
import {
  AUTHORS,
  getAllAuthors,
  getAuthorBySlug,
  getAuthorSlug,
} from '@/lib/blog/authors'
import {
  estimateReadTime,
  formatBlogDate,
  getPublishedBlogPosts,
} from '@/lib/blog'
import { getAuthorForSlug as resolveAuthorForPostSlug } from '@/lib/blog/authors'
import { getSiteUrl } from '@/lib/site'
import { toJsonLd } from '@/lib/seo'

export const revalidate = 3600

export function generateStaticParams() {
  return getAllAuthors().map(a => ({ slug: getAuthorSlug(a) }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const author = getAuthorBySlug(slug)
  if (!author) return { title: 'Author' }
  const description = `${author.name} — ${author.title} at Rezoomed. ${author.bio.slice(0, 140)}`
  return {
    title: `${author.name} — ${author.title}`,
    description,
    alternates: { canonical: `/authors/${getAuthorSlug(author)}` },
    openGraph: {
      type: 'profile',
      title: `${author.name} — ${author.title} | Rezoomed`,
      description,
      url: `/authors/${getAuthorSlug(author)}`,
      images: ['/opengraph-image'],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${author.name} — ${author.title} | Rezoomed`,
      description,
      images: ['/opengraph-image'],
    },
  }
}

export default async function AuthorPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const author = getAuthorBySlug(slug)
  if (!author) notFound()

  const allPosts = await getPublishedBlogPosts()
  const authorPosts = allPosts.filter(
    post => resolveAuthorForPostSlug(post.slug).name === author.name
  )

  const siteUrl = getSiteUrl()
  const personJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${siteUrl}/authors/${getAuthorSlug(author)}#person`,
    name: author.name,
    jobTitle: author.title,
    description: author.bio,
    ...(author.avatar ? { image: `${siteUrl}${author.avatar}` } : {}),
    url: `${siteUrl}/authors/${getAuthorSlug(author)}`,
    worksFor: { '@type': 'Organization', '@id': `${siteUrl}/#organization` },
  }
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${siteUrl}/blog` },
      { '@type': 'ListItem', position: 3, name: author.name, item: `${siteUrl}/authors/${getAuthorSlug(author)}` },
    ],
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7fbf8_0%,#ffffff_52%,#f2f7f3_100%)] text-zinc-900">
      <PublicSiteHeader active="blog" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(personJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(breadcrumbJsonLd) }}
      />

      <main className="px-6 py-16 pt-28">
        <div className="mx-auto max-w-4xl space-y-10">
          <section className="rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-[0_20px_70px_rgba(15,23,42,0.08)] sm:p-10">
            <p className="inline-flex rounded-full bg-[#008f44]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#008f44]">
              Author
            </p>
            <div className="mt-4 flex items-start gap-5">
              {author.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={author.avatar}
                  alt={author.name}
                  className="h-16 w-16 shrink-0 rounded-full object-cover shadow-sm ring-1 ring-zinc-200"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#A3FFB3] to-[#30c06b] text-xl font-black text-[#022c14] shadow-sm">
                  {author.name.charAt(0)}
                </div>
              )}
              <div>
                <h1 className="text-4xl font-black tracking-tight sm:text-5xl">{author.name}</h1>
                <p className="mt-2 text-base font-semibold text-[#026d32]">{author.title}</p>
              </div>
            </div>
            <p className="mt-6 text-base leading-8 text-zinc-700">{author.bio}</p>
          </section>

          {authorPosts.length > 0 && (
            <section className="rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-[0_20px_70px_rgba(15,23,42,0.06)] sm:p-10">
              <h2 className="text-2xl font-black tracking-tight">
                Articles by {author.name}
              </h2>
              <p className="mt-2 text-sm text-zinc-500">
                {authorPosts.length} {authorPosts.length === 1 ? 'article' : 'articles'} published
              </p>

              <div className="mt-6 grid gap-4">
                {authorPosts.map(post => (
                  <Link
                    key={post.slug}
                    href={`/blog/${post.slug}`}
                    className="group flex flex-col gap-2 rounded-2xl border border-zinc-100 bg-white p-5 transition-all hover:-translate-y-1 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#026d32]">{post.category}</p>
                      <h3 className="mt-1 text-base font-black leading-snug text-zinc-900 group-hover:text-[#026d32]">
                        {post.title}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{post.excerpt}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-zinc-400 sm:flex-col sm:items-end sm:text-right">
                      <span>{formatBlogDate(post.published_at)}</span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> {estimateReadTime(post.content)} min
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="rounded-[2rem] border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.94),rgba(243,247,244,0.9))] p-8 text-center shadow-[0_20px_70px_rgba(15,23,42,0.06)] sm:p-10">
            <h2 className="text-2xl font-black tracking-tight">More from the Rezoomed editorial team</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-zinc-600">
              Career strategy, ATS guidance, and job-search playbooks from across our team of recruiting and career coaching specialists.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {getAllAuthors()
                .filter(a => getAuthorSlug(a) !== slug)
                .map(a => (
                  <Link
                    key={getAuthorSlug(a)}
                    href={`/authors/${getAuthorSlug(a)}`}
                    className="inline-flex items-center gap-2 rounded-full border border-black/8 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition-all hover:-translate-y-0.5 hover:bg-white hover:text-[#026d32]"
                  >
                    {a.name} <ArrowRight size={13} />
                  </Link>
                ))}
            </div>
          </section>
        </div>
      </main>

      <PublicSiteFooter />
    </div>
  )
}

// Suppress unused-import warning when AUTHORS isn't directly read elsewhere here.
void AUTHORS

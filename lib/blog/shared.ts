export const BLOG_COVER_BUCKET = 'blog-covers'

export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  category: string
  cover_image_url: string | null
  author_name: string
  status: 'draft' | 'published'
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface BlogMediaFallback {
  coverImage: string
  inlineImages: string[]
}

const BLOG_MEDIA_FALLBACKS: Record<string, BlogMediaFallback> = {
  '10-job-search-tips-strategies-for-2026': {
    coverImage: '/blog/search-2026-hero.png',
    inlineImages: ['/blog/search-2026-workflow.png'],
  },
  'how-to-follow-up-on-a-job-application-templates-guide': {
    coverImage: '/blog/follow-up-hero.png',
    inlineImages: ['/blog/follow-up-template.png'],
  },
  'us-resume-format-best-practices-examples': {
    coverImage: '/blog/us-resume-format-hero.png',
    inlineImages: ['/blog/us-resume-format-layout.png'],
  },
  'top-20-us-jobs-workers-have-more-school-than-roles-require': {
    coverImage: '/blog/overeducated-jobs-hero.png',
    inlineImages: ['/blog/overeducated-jobs-map.png'],
  },
  'how-to-land-a-google-job': {
    coverImage: '/blog/google-job-hero.png',
    inlineImages: ['/blog/google-job-strategy.png'],
  },
}

export function getBlogMediaFallback(slug: string) {
  return BLOG_MEDIA_FALLBACKS[slug] ?? null
}

export function slugifyBlogTitle(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export function stripMarkdown(content: string) {
  return content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\(([^)]+)\)/g, ' ')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s{0,3}>\s?/gm, '')
    .replace(/^\s*([-*+]|\d+\.)\s+/gm, '')
    .replace(/^\s*[-*_]{3,}\s*$/gm, ' ')
    .replace(/[*_~`>#-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function buildBlogExcerpt(content: string) {
  return stripMarkdown(content).slice(0, 180)
}

export function formatBlogDate(value: string | null) {
  if (!value) return 'Draft'

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

export function getBlogCoverStoragePath(coverImageUrl: string | null | undefined) {
  if (!coverImageUrl) return null

  const marker = `/storage/v1/object/public/${BLOG_COVER_BUCKET}/`
  const markerIndex = coverImageUrl.indexOf(marker)

  if (markerIndex === -1) {
    return null
  }

  const rawPath = coverImageUrl.slice(markerIndex + marker.length)

  try {
    return decodeURIComponent(rawPath)
  } catch {
    return rawPath
  }
}

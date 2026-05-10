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
    coverImage: '/blog/10-job-search-tips-strategies-for-2026-hero.jpg',
    inlineImages: ['/blog/10-job-search-tips-strategies-for-2026-inline.jpg'],
  },
  'how-to-follow-up-on-a-job-application-templates-guide': {
    coverImage: '/blog/how-to-follow-up-on-a-job-application-templates-guide-hero.jpg',
    inlineImages: ['/blog/how-to-follow-up-on-a-job-application-templates-guide-inline.jpg'],
  },
  'us-resume-format-best-practices-examples': {
    coverImage: '/blog/us-resume-format-best-practices-examples-hero.jpg',
    inlineImages: ['/blog/us-resume-format-best-practices-examples-inline.jpg'],
  },
  'top-20-us-jobs-workers-have-more-school-than-roles-require': {
    coverImage: '/blog/top-20-us-jobs-workers-have-more-school-than-roles-require-hero.jpg',
    inlineImages: ['/blog/top-20-us-jobs-workers-have-more-school-than-roles-require-inline.jpg'],
  },
  'how-to-land-a-google-job': {
    coverImage: '/blog/google-job-hero.jpg',
    inlineImages: ['/blog/google-job-strategy.jpg'],
  },
}

const GENERATED_BLOG_MEDIA_SLUGS = new Set([
  'how-resume-metadata-affects-job-applications',
  'ats-resume-checker-what-it-tests-and-why-it-matters',
  'job-description-match-score-explained',
  'how-to-tailor-your-resume-for-each-job-without-starting-over',
  'how-to-land-a-job-at-openai',
  'how-to-land-a-job-at-anthropic',
  'how-to-land-a-job-at-meta',
  'how-to-land-a-job-at-microsoft',
  'how-to-land-a-job-at-amazon',
  'how-to-land-a-job-at-apple',
  'how-to-land-a-job-at-netflix',
  'how-to-land-a-job-at-stripe',
  'how-to-land-a-job-at-shopify',
  'how-to-land-a-job-at-airbnb',
  'how-to-land-a-job-at-uber',
  'how-to-land-a-job-at-tiktok',
  'how-to-land-a-job-at-nvidia',
  'how-to-land-a-job-at-notion',
  'how-to-land-a-job-at-figma',
  'how-to-land-a-job-at-jpmorgan-chase',
  'how-to-land-a-job-at-goldman-sachs',
  'how-to-land-a-job-at-morgan-stanley',
  'how-to-land-a-job-at-blackrock',
  'how-to-land-a-job-at-bank-of-america',
  'how-to-land-a-job-at-citi',
  'how-to-land-a-job-at-barclays',
  'how-to-land-a-job-at-ubs',
  'how-to-land-a-job-at-deutsche-bank',
  'how-to-land-a-job-at-hsbc',
  'best-ai-resume-builder-for-job-seekers',
  'resume-builder-vs-template-which-is-better',
  'resume-metadata-checklist-before-you-apply',
  'how-to-fix-pdf-resume-title-author-and-keywords',
  'how-to-tailor-your-resume-for-software-engineer-jobs',
  'how-to-tailor-your-resume-for-product-manager-jobs',
  'how-to-tailor-your-resume-for-data-analyst-jobs',
  'how-to-write-a-cover-letter-for-a-job-you-really-want',
  'ai-cover-letter-generator-what-good-output-looks-like',
  'best-resume-keywords-to-match-a-job-description',
  'rezoomed-vs-jobscan',
  'rezoomed-vs-resume-worded',
  'rezoomed-vs-zety',
  'rezoomed-vs-rezi',
  'rezoomed-vs-enhancv',
  'rezoomed-vs-canva',
])

export function getBlogMediaFallback(slug: string) {
  if (BLOG_MEDIA_FALLBACKS[slug]) {
    return BLOG_MEDIA_FALLBACKS[slug]
  }

  if (GENERATED_BLOG_MEDIA_SLUGS.has(slug)) {
    const ext = slug.startsWith('how-to-land-a-job-at-') ? 'svg' : 'jpg'
    const heroExt = slug.startsWith('how-to-land-a-job-at-') || slug.startsWith('rezoomed-vs-') ? 'svg' : ext
    const inlineImages = slug.startsWith('how-to-land-a-job-at-')
      ? [`/blog/${slug}-mascot.svg`]
      : slug.startsWith('rezoomed-vs-')
        ? []
        : [`/blog/${slug}-inline.${ext}`]

    return {
      coverImage: `/blog/${slug}-hero.${heroExt}`,
      inlineImages,
    }
  }

  return null
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

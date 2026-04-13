import type { BlogPost } from '@/lib/blog/shared'

function titleFragments(title: string) {
  return title
    .split(/[:|,&()]/)
    .map(part => part.trim())
    .filter(Boolean)
}

export function buildBlogPostKeywords(post: BlogPost) {
  const base = [
    'resume tips',
    'resume builder',
    'ATS resume',
    'ATS checker',
    'job search tips',
    'career advice',
    'Rezoomed',
    post.category,
    post.title,
    ...titleFragments(post.title),
  ]

  return Array.from(
    new Set(
      base
        .map(keyword => keyword.trim())
        .filter(Boolean)
    )
  )
}

export function buildBlogIndexKeywords(posts: BlogPost[]) {
  const base = [
    'resume blog',
    'resume advice',
    'ATS resume tips',
    'job search blog',
    'career strategy',
    'resume optimization',
    'Rezoomed blog',
    ...posts.flatMap(post => [post.category, post.title]),
  ]

  return Array.from(
    new Set(
      base
        .map(keyword => keyword.trim())
        .filter(Boolean)
    )
  )
}

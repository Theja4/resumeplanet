'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { useFormStatus } from 'react-dom'
import {
  Eye,
  FileText,
  Heading1,
  ImagePlus,
  Link2,
  ListOrdered,
  ListTodo,
  LoaderCircle,
  Quote,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { buildBlogExcerpt, formatBlogDate, slugifyBlogTitle, type BlogPost } from '@/lib/blog/shared'
import MarkdownContent from '@/components/blog/MarkdownContent'
import { DashboardSurface } from '@/components/layout/DashboardSurface'

type BlogEditorAction = (formData: FormData) => void | Promise<void>

const CONTENT_BLOCKS = [
  {
    label: 'Section',
    Icon: Heading1,
    snippet: '## Section heading\nAdd the main point of this section in 2 to 3 concise sentences.',
  },
  {
    label: 'Checklist',
    Icon: ListTodo,
    snippet: '## Key takeaways\n- First takeaway\n- Second takeaway\n- Third takeaway',
  },
  {
    label: 'Steps',
    Icon: ListOrdered,
    snippet: '## Step-by-step plan\n1. First step\n2. Second step\n3. Third step',
  },
  {
    label: 'Quote',
    Icon: Quote,
    snippet: '> Recruiter insight: add a short, memorable note that reinforces the value of Rezoomed.',
  },
  {
    label: 'CTA',
    Icon: Link2,
    snippet: '---\n## Ready to improve your resume faster?\nUse **Rezoomed** to check your ATS score, tailor your resume, and move from draft to interview-ready faster.',
  },
]

function SaveButton({ isEditing }: { isEditing: boolean }) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-full bg-zinc-950 px-6 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-55"
    >
      {pending ? 'Saving...' : isEditing ? 'Save changes' : 'Create post'}
    </button>
  )
}

function DeleteButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-4 inline-flex items-center justify-center rounded-full border border-red-200 bg-white px-5 py-3 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-55"
    >
      {pending ? 'Deleting...' : 'Delete post'}
    </button>
  )
}

export default function BlogPostEditorClient({
  post,
  saveAction,
  deleteAction,
}: {
  post: BlogPost | null
  saveAction: BlogEditorAction
  deleteAction: BlogEditorAction
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [title, setTitle] = useState(post?.title ?? '')
  const [slug, setSlug] = useState(post?.slug ?? '')
  const [isSlugManual, setIsSlugManual] = useState(Boolean(post?.id))
  const [category, setCategory] = useState(post?.category ?? 'Product Update')
  const [authorName, setAuthorName] = useState(post?.author_name ?? 'Rezoomed Team')
  const [status, setStatus] = useState<'draft' | 'published'>(post?.status ?? 'draft')
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? '')
  const [content, setContent] = useState(post?.content ?? '')
  const [coverImageUrl, setCoverImageUrl] = useState(post?.cover_image_url ?? '')
  const [uploadState, setUploadState] = useState<'idle' | 'uploading'>('idle')
  const [uploadError, setUploadError] = useState<string | null>(null)

  const previewSlug = slug.trim() || slugifyBlogTitle(title) || 'post-slug'
  const previewExcerpt = excerpt.trim() || buildBlogExcerpt(content) || 'Add an excerpt or start writing to generate one automatically.'

  function handleTitleChange(nextTitle: string) {
    setTitle(nextTitle)

    if (!isSlugManual) {
      setSlug(slugifyBlogTitle(nextTitle))
    }
  }

  function insertBlock(snippet: string) {
    const textarea = textareaRef.current
    const existingValue = content

    if (!textarea) {
      setContent(existingValue ? `${existingValue}\n\n${snippet}` : snippet)
      return
    }

    const selectionStart = textarea.selectionStart ?? existingValue.length
    const selectionEnd = textarea.selectionEnd ?? existingValue.length
    const needsLeadingGap = selectionStart > 0 && !existingValue.slice(0, selectionStart).endsWith('\n\n')
    const needsTrailingGap = selectionEnd < existingValue.length && !existingValue.slice(selectionEnd).startsWith('\n\n')
    const prefix = needsLeadingGap ? '\n\n' : ''
    const suffix = needsTrailingGap ? '\n\n' : ''
    const nextValue = `${existingValue.slice(0, selectionStart)}${prefix}${snippet}${suffix}${existingValue.slice(selectionEnd)}`

    setContent(nextValue)

    requestAnimationFrame(() => {
      const nextCursor = selectionStart + prefix.length + snippet.length
      textarea.focus()
      textarea.setSelectionRange(nextCursor, nextCursor)
    })
  }

  async function handleCoverUpload(file: File) {
    setUploadState('uploading')
    setUploadError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/admin/blog/upload-cover', {
        method: 'POST',
        body: formData,
      })

      const json = await response.json()

      if (!response.ok || !json.success || typeof json.url !== 'string') {
        setUploadError(json.error ?? 'Cover upload failed.')
        return
      }

      setCoverImageUrl(json.url)
    } catch {
      setUploadError('Cover upload failed.')
    } finally {
      setUploadState('idle')
    }
  }

  return (
    <DashboardSurface variant="default" className="px-6 py-6 sm:px-7 sm:py-7">
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary/70">
              {post ? 'Edit post' : 'New post'}
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-on-background">
              {post ? post.title : 'Create a blog post'}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-on-surface-variant">
              Write in markdown, drop in reusable blocks, preview the public article live, and publish directly to the Rezoomed blog.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {post?.status === 'published' ? (
              <Link
                href={`/blog/${post.slug}`}
                className="inline-flex items-center rounded-full border border-black/8 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-zinc-900 transition hover:bg-surface-container-low"
              >
                View live
              </Link>
            ) : null}

            <Link
              href="/admin/blog"
              className="inline-flex items-center rounded-full border border-black/8 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-zinc-900 transition hover:bg-surface-container-low"
            >
              Back to posts
            </Link>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,26rem)]">
          <div className="space-y-5">
            <form action={saveAction} className="space-y-5">
              <input type="hidden" name="id" value={post?.id ?? ''} />
              <input type="hidden" name="cover_image_url" value={coverImageUrl} />

              <DashboardSurface variant="subtle" className="px-5 py-5">
                <div className="grid gap-5 lg:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">Title</label>
                    <input
                      name="title"
                      required
                      value={title}
                      onChange={event => handleTitleChange(event.target.value)}
                      className="w-full rounded-[1.15rem] border border-black/8 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-primary/30 focus:ring-2 focus:ring-primary/15"
                      placeholder="Post title"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <label className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">Slug</label>
                      <button
                        type="button"
                        onClick={() => {
                          setSlug(slugifyBlogTitle(title))
                          setIsSlugManual(false)
                        }}
                        className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary transition hover:opacity-80"
                      >
                        Regenerate
                      </button>
                    </div>
                    <input
                      name="slug"
                      value={slug}
                      onChange={event => {
                        setSlug(event.target.value)
                        setIsSlugManual(true)
                      }}
                      className="w-full rounded-[1.15rem] border border-black/8 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-primary/30 focus:ring-2 focus:ring-primary/15"
                      placeholder="generated-from-title"
                    />
                  </div>
                </div>

                <div className="mt-5 grid gap-5 lg:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">Category</label>
                    <input
                      name="category"
                      value={category}
                      onChange={event => setCategory(event.target.value)}
                      className="w-full rounded-[1.15rem] border border-black/8 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-primary/30 focus:ring-2 focus:ring-primary/15"
                      placeholder="Category"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">Author</label>
                    <input
                      name="author_name"
                      value={authorName}
                      onChange={event => setAuthorName(event.target.value)}
                      className="w-full rounded-[1.15rem] border border-black/8 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-primary/30 focus:ring-2 focus:ring-primary/15"
                      placeholder="Author name"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">Status</label>
                    <select
                      name="status"
                      value={status}
                      onChange={event => setStatus(event.target.value === 'published' ? 'published' : 'draft')}
                      className="w-full rounded-[1.15rem] border border-black/8 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-primary/30 focus:ring-2 focus:ring-primary/15"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </div>
                </div>
              </DashboardSurface>

              <DashboardSurface variant="subtle" className="px-5 py-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary/70">Cover image</p>
                    <h3 className="mt-2 text-lg font-black tracking-tight text-on-background">Upload a blog cover</h3>
                    <p className="mt-2 max-w-xl text-sm leading-7 text-on-surface-variant">
                      Use a clean 1600×900 image to make the post cards and article page feel intentional.
                    </p>
                  </div>

                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-zinc-950 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-white transition hover:bg-zinc-900">
                    {uploadState === 'uploading' ? (
                      <>
                        <LoaderCircle size={14} className="animate-spin" />
                        Uploading
                      </>
                    ) : (
                      <>
                        <ImagePlus size={14} />
                        Upload image
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadState === 'uploading'}
                      onChange={async event => {
                        const file = event.target.files?.[0]
                        if (file) {
                          await handleCoverUpload(file)
                        }
                        event.target.value = ''
                      }}
                    />
                  </label>
                </div>

                <div className="mt-5 overflow-hidden rounded-[1.4rem] border border-black/6 bg-white">
                  {coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={coverImageUrl} alt="Blog cover preview" className="h-56 w-full object-cover" />
                  ) : (
                    <div className="flex h-56 items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(163,255,179,0.22),transparent_38%),linear-gradient(135deg,#f5fbf7_0%,#eef4ef_100%)] px-6 text-center text-sm leading-7 text-on-surface-variant">
                      No cover uploaded yet. The public blog will use a Rezoomed gradient surface until you add one.
                    </div>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {coverImageUrl ? (
                    <button
                      type="button"
                      onClick={() => setCoverImageUrl('')}
                      className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-black/8 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-zinc-700 transition hover:bg-surface-container-low"
                    >
                      Remove image
                    </button>
                  ) : null}
                  {uploadError ? (
                    <p className="text-sm font-medium text-red-600">{uploadError}</p>
                  ) : null}
                </div>
              </DashboardSurface>

              <DashboardSurface variant="subtle" className="px-5 py-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary/70">SEO summary</p>
                    <h3 className="mt-2 text-lg font-black tracking-tight text-on-background">Excerpt and search snippet</h3>
                  </div>
                  <div className="rounded-full bg-primary-container/35 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-on-primary-container">
                    {previewExcerpt.length}/180
                  </div>
                </div>

                <textarea
                  name="excerpt"
                  rows={4}
                  value={excerpt}
                  onChange={event => setExcerpt(event.target.value)}
                  className="mt-4 w-full rounded-[1.15rem] border border-black/8 bg-white px-4 py-3 text-sm leading-7 text-zinc-950 outline-none transition focus:border-primary/30 focus:ring-2 focus:ring-primary/15"
                  placeholder="Optional summary for blog cards and search results. Leave blank to generate it automatically from the content."
                />
              </DashboardSurface>

              <DashboardSurface variant="subtle" className="px-5 py-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary/70">Markdown editor</p>
                    <h3 className="mt-2 text-lg font-black tracking-tight text-on-background">Write with blocks</h3>
                    <p className="mt-2 max-w-xl text-sm leading-7 text-on-surface-variant">
                      Use headings, lists, quotes, and links. Insert reusable blocks to structure the article quickly.
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-black/8 bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-600">
                    <Sparkles size={13} className="text-primary" />
                    Live draft preview
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {CONTENT_BLOCKS.map(block => (
                    <button
                      key={block.label}
                      type="button"
                      onClick={() => insertBlock(block.snippet)}
                      className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-black/8 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-zinc-800 transition hover:-translate-y-0.5 hover:bg-surface-container-low"
                    >
                      <block.Icon size={14} className="text-primary" />
                      {block.label}
                    </button>
                  ))}
                </div>

                <textarea
                  ref={textareaRef}
                  name="content"
                  required
                  rows={22}
                  value={content}
                  onChange={event => setContent(event.target.value)}
                  className="mt-5 w-full rounded-[1.25rem] border border-black/8 bg-white px-4 py-4 font-mono text-sm leading-8 text-zinc-950 outline-none transition focus:border-primary/30 focus:ring-2 focus:ring-primary/15"
                  placeholder={'# Example headline\n\nStart with a strong opening paragraph that teaches something valuable and points readers toward Rezoomed where relevant.\n\n## What readers will learn\n- ...\n- ...\n- ...'}
                />
              </DashboardSurface>

              <div className="flex flex-wrap items-center gap-3">
                <SaveButton isEditing={Boolean(post)} />
              </div>
            </form>
          </div>

          <div className="space-y-5 xl:sticky xl:top-8 xl:self-start">
            <DashboardSurface variant="subtle" className="px-5 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary/70">Public preview</p>
                  <h3 className="mt-2 text-lg font-black tracking-tight text-on-background">Live draft preview</h3>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-primary-container/35 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-on-primary-container">
                  <Eye size={12} />
                  {status === 'published' ? 'Ready to publish' : 'Draft'}
                </div>
              </div>

              <div className="mt-5 overflow-hidden rounded-[1.55rem] border border-black/6 bg-white">
                <div className="h-40 overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(163,255,179,0.22),transparent_38%),linear-gradient(135deg,#f5fbf7_0%,#eef4ef_100%)]">
                  {coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={coverImageUrl} alt="Draft cover preview" className="h-full w-full object-cover" />
                  ) : null}
                </div>

                <div className="space-y-4 px-5 py-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-primary-container/45 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-on-primary-container">
                      {category || 'Category'}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {status === 'published' ? formatBlogDate(post?.published_at ?? null) : 'Draft preview'}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-2xl font-black tracking-tight text-on-background">
                      {title || 'Post title preview'}
                    </h4>
                    <p className="mt-3 text-sm leading-7 text-on-surface-variant">{previewExcerpt}</p>
                  </div>

                  <div className="flex items-center justify-between gap-4 text-xs text-zinc-500">
                    <span>By {authorName || 'Rezoomed Team'}</span>
                    <span>/blog/{previewSlug}</span>
                  </div>
                </div>
              </div>
            </DashboardSurface>

            <DashboardSurface variant="subtle" className="px-5 py-5">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-primary" />
                <h3 className="text-lg font-black tracking-tight text-on-background">Article body</h3>
              </div>

              <div className="mt-5 rounded-[1.55rem] border border-black/6 bg-white px-5 py-5">
                {content.trim() ? (
                  <MarkdownContent content={content} />
                ) : (
                  <p className="text-sm leading-7 text-on-surface-variant">
                    Start writing to see the public article preview here.
                  </p>
                )}
              </div>
            </DashboardSurface>

            <DashboardSurface variant="subtle" className="px-5 py-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary/70">Publishing notes</p>
              <div className="mt-3 space-y-3 text-sm leading-7 text-on-surface-variant">
                <p>Published posts appear on the public blog immediately and get their own `/blog/{previewSlug}` route.</p>
                <p>Use excerpt, headings, and internal references to Rezoomed strategically so posts support discovery and product intent.</p>
              </div>
            </DashboardSurface>

            {post ? (
              <form action={deleteAction} className="rounded-[1.4rem] border border-red-200 bg-red-50/85 px-5 py-5">
                <input type="hidden" name="id" value={post.id} />
                <input type="hidden" name="slug" value={post.slug} />
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-red-600">Danger zone</p>
                <p className="mt-3 text-sm leading-7 text-red-700/90">
                  Deleting this post removes it from the admin workspace and the public blog.
                </p>
                <div className="mt-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-red-600">
                  <Trash2 size={13} />
                  Permanent action
                </div>
                <DeleteButton />
              </form>
            ) : null}
          </div>
        </div>
      </div>
    </DashboardSurface>
  )
}

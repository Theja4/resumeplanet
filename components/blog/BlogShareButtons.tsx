'use client'

import { ArrowUpRight, Link2, Share2 } from 'lucide-react'
import { Analytics } from '@/lib/analytics'

interface Props {
  slug: string
  title: string
}

const SHARE_BUTTON_CLASS =
  'inline-flex items-center justify-center rounded-full border border-white/10 bg-white/6 px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-white/84 transition-all hover:-translate-y-0.5 hover:border-[#A3FFB3]/30 hover:bg-white/10 hover:text-white'

export default function BlogShareButtons({ slug, title }: Props) {
  async function handleShare(platform: 'twitter' | 'linkedin' | 'facebook' | 'copy_link') {
    const url = `${window.location.origin}/blog/${slug}`
    const encodedUrl = encodeURIComponent(url)
    const encodedTitle = encodeURIComponent(title)

    Analytics.blogShareClicked({
      slug,
      platform,
    })

    if (platform === 'copy_link') {
      try {
        await navigator.clipboard.writeText(url)
      } catch {
        // Clipboard failures should not block the product.
      }
      return
    }

    const shareUrl =
      platform === 'linkedin'
        ? `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
        : platform === 'facebook'
          ? `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
          : `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`

    window.open(shareUrl, '_blank', 'noopener,noreferrer,width=720,height=640')
  }

  return (
    <div className="blog-glare-surface blog-glare-dark overflow-hidden rounded-[1.9rem] border border-white/10 bg-[linear-gradient(160deg,#050b07_0%,#0a1710_55%,#10261a_100%)] p-6 shadow-[0_28px_90px_rgba(4,10,7,0.24)]">
      <div className="relative z-10 space-y-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A3FFB3]">Share this article</p>
          <h4 className="mt-2 text-lg font-black tracking-tight text-white">Help someone else tighten their job search.</h4>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={() => void handleShare('linkedin')} className={SHARE_BUTTON_CLASS}>
            <Share2 size={14} className="mr-2" />
            LinkedIn
          </button>
          <button type="button" onClick={() => void handleShare('twitter')} className={SHARE_BUTTON_CLASS}>
            <Share2 size={14} className="mr-2" />
            Twitter
          </button>
          <button type="button" onClick={() => void handleShare('facebook')} className={SHARE_BUTTON_CLASS}>
            <ArrowUpRight size={14} className="mr-2" />
            Facebook
          </button>
          <button type="button" onClick={() => void handleShare('copy_link')} className={SHARE_BUTTON_CLASS}>
            <Link2 size={14} className="mr-2" />
            Copy link
          </button>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useMemo, useState } from 'react'

function slugifyHeading(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function BlogTableOfContents({
  articleSections,
}: {
  articleSections: string[]
}) {
  const sectionItems = useMemo(
    () => articleSections.map(section => ({ label: section, id: slugifyHeading(section) })),
    [articleSections]
  )
  const [activeSectionId, setActiveSectionId] = useState(sectionItems[0]?.id ?? '')

  useEffect(() => {
    if (sectionItems.length === 0) return

    const syncActiveSection = () => {
      const offset = 140
      let currentId = sectionItems[0]?.id ?? ''

      for (const section of sectionItems) {
        const element = document.getElementById(section.id)
        if (!element) continue

        if (element.getBoundingClientRect().top - offset <= 0) {
          currentId = section.id
          continue
        }

        break
      }

      setActiveSectionId(previousId => (previousId === currentId ? previousId : currentId))
    }

    syncActiveSection()

    let ticking = false
    const handleScroll = () => {
      if (ticking) return

      ticking = true
      window.requestAnimationFrame(() => {
        syncActiveSection()
        ticking = false
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [sectionItems])

  if (sectionItems.length === 0) {
    return null
  }

  return (
    <div className="blog-load-in blog-glare-surface blog-glare-dark relative overflow-hidden rounded-[1.9rem] border border-white/10 bg-[linear-gradient(160deg,#050b07_0%,#0a1710_55%,#10261a_100%)] p-6 shadow-[0_28px_90px_rgba(4,10,7,0.28)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(163,255,179,0.16),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(48,192,107,0.14),transparent_24%)]" />
      <p className="relative z-10 text-[10px] font-black uppercase tracking-[0.2em] text-[#A3FFB3]">In this article</p>
      <div className="relative z-10 mt-4 space-y-3">
        {sectionItems.map(section => {
          const isActive = section.id === activeSectionId

          return (
            <a
              key={section.id}
              href={`#${section.id}`}
              aria-current={isActive ? 'true' : undefined}
              className={[
                'relative flex items-start gap-3 rounded-[1.15rem] border px-4 py-3 text-sm leading-6 backdrop-blur-sm transition-all',
                isActive
                  ? 'border-[#A3FFB3]/40 bg-[#A3FFB3]/12 text-white shadow-[0_12px_30px_rgba(163,255,179,0.12)]'
                  : 'border-white/8 bg-white/6 text-white/84 hover:border-[#A3FFB3]/35 hover:bg-white/10 hover:text-white',
              ].join(' ')}
            >
              <span
                className={[
                  'mt-2 h-2 w-2 shrink-0 rounded-full transition-colors',
                  isActive ? 'bg-[#A3FFB3]' : 'bg-[#30c06b]',
                ].join(' ')}
              />
              <span>{section.label}</span>
            </a>
          )
        })}
      </div>
    </div>
  )
}

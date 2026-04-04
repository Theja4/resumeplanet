import type { ElementType, ReactNode } from 'react'

function renderInlineMarkdown(text: string): ReactNode[] {
  const tokens: ReactNode[] = []
  const pattern = /(\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)|`([^`]+)`|\*\*([^*]+)\*\*|__([^_]+)__|\*([^*]+)\*|_([^_]+)_|(https?:\/\/[^\s<]+))/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(text.slice(lastIndex, match.index))
    }

    if (match[2] && match[3]) {
      tokens.push(
        <a
          key={`link-${match.index}`}
          href={match[3]}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-baseline gap-0.5 font-semibold text-[#008f44] underline decoration-[#008f44]/30 underline-offset-4 transition hover:decoration-[#008f44]"
        >
          {match[2]}
        </a>
      )
    } else if (match[4]) {
      tokens.push(
        <code key={`code-${match.index}`} className="rounded-lg bg-[#008f44]/8 px-2 py-0.5 font-mono text-[0.88em] text-[#005224] font-semibold">
          {match[4]}
        </code>
      )
    } else if (match[5] || match[6]) {
      tokens.push(
        <strong key={`strong-${match.index}`} className="font-black text-on-background">
          {match[5] || match[6]}
        </strong>
      )
    } else if (match[7] || match[8]) {
      tokens.push(
        <em key={`em-${match.index}`} className="italic text-on-background/80">
          {match[7] || match[8]}
        </em>
      )
    } else if (match[9]) {
      tokens.push(
        <a
          key={`autolink-${match.index}`}
          href={match[9]}
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-[#008f44] underline decoration-[#008f44]/30 underline-offset-4 transition hover:decoration-[#008f44]"
        >
          {match[9]}
        </a>
      )
    }

    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    tokens.push(text.slice(lastIndex))
  }

  return tokens
}

// Heading accent line widths by level
const HEADING_ACCENT: Record<number, string> = {
  2: 'w-10 bg-[#008f44]',
  3: 'w-6 bg-[#008f44]/50',
}

export default function MarkdownContent({
  content,
  className = '',
}: {
  content: string
  className?: string
}) {
  const lines = content.replace(/\r\n/g, '\n').split('\n')
  const blocks: ReactNode[] = []
  let index = 0

  while (index < lines.length) {
    const rawLine = lines[index]
    const line = rawLine.trim()

    if (!line) {
      index += 1
      continue
    }

    // ── Code block ──────────────────────────────────────────────────────
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim() || 'code'
      const codeLines: string[] = []
      index += 1

      while (index < lines.length && !lines[index].trim().startsWith('```')) {
        codeLines.push(lines[index])
        index += 1
      }

      if (index < lines.length) index += 1

      blocks.push(
        <div key={`code-${blocks.length}`} className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-lg">
          <div className="flex items-center justify-between px-5 py-2.5 border-b border-zinc-800/80 bg-zinc-900">
            <div className="flex gap-1.5">
              <span className="h-3 w-3 rounded-full bg-red-500/80" />
              <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
              <span className="h-3 w-3 rounded-full bg-green-500/80" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{lang}</span>
          </div>
          <pre className="overflow-x-auto px-6 py-5 text-sm leading-7 text-zinc-200">
            <code>{codeLines.join('\n')}</code>
          </pre>
        </div>
      )
      continue
    }

    // ── Inline image ─────────────────────────────────────────────────────
    const imageMatch = rawLine.match(/^\s*!\[([^\]]*)\]\(((?:https?:\/\/|\/)[^)]+)\)\s*$/)
    if (imageMatch) {
      blocks.push(
        <figure key={`image-${blocks.length}`} className="overflow-hidden rounded-2xl border border-black/6 bg-surface-container-low shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageMatch[2]} alt={imageMatch[1] || 'Blog illustration'} className="h-auto w-full object-cover" />
          {imageMatch[1] && (
            <figcaption className="px-5 py-3 text-[11px] font-semibold text-center text-zinc-500 uppercase tracking-widest">
              {imageMatch[1]}
            </figcaption>
          )}
        </figure>
      )
      index += 1
      continue
    }

    // ── Headings ──────────────────────────────────────────────────────────
    const headingMatch = rawLine.match(/^\s*(#{1,6})\s+(.*)$/)
    if (headingMatch) {
      const level = headingMatch[1].length
      const headingText = headingMatch[2].trim()
      const Tag = `h${Math.min(level, 6)}` as ElementType

      const classes: Record<number, string> = {
        1: 'text-4xl font-black tracking-tight text-on-background mt-2',
        2: 'text-2xl font-black tracking-tight text-on-background mt-4',
        3: 'text-lg font-black tracking-tight text-on-background mt-2',
        4: 'text-sm font-black uppercase tracking-[0.16em] text-[#008f44] mt-1',
        5: 'text-xs font-black uppercase tracking-[0.16em] text-zinc-500 mt-1',
        6: 'text-xs font-black uppercase tracking-widest text-zinc-400 mt-1',
      }

      blocks.push(
        <div key={`heading-${blocks.length}`} className="pt-4">
          {HEADING_ACCENT[level] && (
            <div className={`mb-3 h-0.5 rounded-full ${HEADING_ACCENT[level]}`} />
          )}
          <Tag className={classes[level] ?? classes[4]}>
            {renderInlineMarkdown(headingText)}
          </Tag>
        </div>
      )
      index += 1
      continue
    }

    // ── Horizontal rule ──────────────────────────────────────────────────
    if (/^\s*([-*_]){3,}\s*$/.test(rawLine)) {
      blocks.push(
        <div key={`hr-${blocks.length}`} className="flex items-center gap-4 py-2">
          <div className="h-px flex-1 bg-zinc-200" />
          <div className="flex gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#008f44]/40" />
            <span className="h-1.5 w-1.5 rounded-full bg-[#008f44]/20" />
            <span className="h-1.5 w-1.5 rounded-full bg-[#008f44]/40" />
          </div>
          <div className="h-px flex-1 bg-zinc-200" />
        </div>
      )
      index += 1
      continue
    }

    // ── Blockquote ───────────────────────────────────────────────────────
    if (/^\s*>\s?/.test(rawLine)) {
      const quoteLines: string[] = []

      while (index < lines.length && /^\s*>\s?/.test(lines[index])) {
        quoteLines.push(lines[index].replace(/^\s*>\s?/, '').trim())
        index += 1
      }

      blocks.push(
        <blockquote
          key={`quote-${blocks.length}`}
          className="relative overflow-hidden rounded-2xl border border-[#008f44]/15 bg-gradient-to-br from-[#008f44]/5 to-[#A3FFB3]/10 px-6 py-5"
        >
          <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl bg-gradient-to-b from-[#008f44] to-[#80da92]" />
          <div className="absolute top-4 right-4 text-5xl leading-none text-[#008f44]/10 font-serif select-none">&ldquo;</div>
          <p className="relative text-base leading-8 text-on-surface-variant font-medium italic">
            {renderInlineMarkdown(quoteLines.join(' '))}
          </p>
        </blockquote>
      )
      continue
    }

    // ── Unordered list ────────────────────────────────────────────────────
    if (/^\s*[-*+]\s+/.test(rawLine)) {
      const items: string[] = []

      while (index < lines.length && /^\s*[-*+]\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\s*[-*+]\s+/, '').trim())
        index += 1
      }

      blocks.push(
        <ul key={`ul-${blocks.length}`} className="space-y-2.5">
          {items.map((item, itemIndex) => (
            <li key={`ul-item-${itemIndex}`} className="flex items-start gap-3 text-base leading-7 text-on-surface-variant">
              <span className="mt-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#008f44]/12">
                <span className="h-1.5 w-1.5 rounded-full bg-[#008f44]" />
              </span>
              <span>{renderInlineMarkdown(item)}</span>
            </li>
          ))}
        </ul>
      )
      continue
    }

    // ── Ordered list ──────────────────────────────────────────────────────
    if (/^\s*\d+\.\s+/.test(rawLine)) {
      const items: string[] = []

      while (index < lines.length && /^\s*\d+\.\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\s*\d+\.\s+/, '').trim())
        index += 1
      }

      blocks.push(
        <ol key={`ol-${blocks.length}`} className="space-y-3">
          {items.map((item, itemIndex) => (
            <li key={`ol-item-${itemIndex}`} className="flex items-start gap-4 text-base leading-7 text-on-surface-variant">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#008f44] to-[#19793c] text-[11px] font-black text-white shadow-sm shadow-[#008f44]/30">
                {itemIndex + 1}
              </span>
              <span className="pt-0.5">{renderInlineMarkdown(item)}</span>
            </li>
          ))}
        </ol>
      )
      continue
    }

    // ── Paragraph ─────────────────────────────────────────────────────────
    const paragraphLines: string[] = []

    while (
      index < lines.length &&
      lines[index].trim() &&
      !lines[index].trim().startsWith('```') &&
      !/^\s*!\[([^\]]*)\]\(((?:https?:\/\/|\/)[^)]+)\)\s*$/.test(lines[index]) &&
      !/^\s*(#{1,6})\s+/.test(lines[index]) &&
      !/^\s*([-*_]){3,}\s*$/.test(lines[index]) &&
      !/^\s*>\s?/.test(lines[index]) &&
      !/^\s*[-*+]\s+/.test(lines[index]) &&
      !/^\s*\d+\.\s+/.test(lines[index])
    ) {
      paragraphLines.push(lines[index].trim())
      index += 1
    }

    blocks.push(
      <p key={`paragraph-${blocks.length}`} className="text-[1.05rem] leading-[1.9] text-on-surface-variant">
        {renderInlineMarkdown(paragraphLines.join(' '))}
      </p>
    )
  }

  return (
    <div className={`space-y-6 ${className}`.trim()}>
      {blocks}
    </div>
  )
}

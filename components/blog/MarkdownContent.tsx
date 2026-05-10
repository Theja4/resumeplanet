import type { ElementType, ReactNode } from 'react'

// ─── Inline markdown parser ───────────────────────────────────────────────────

function renderInlineMarkdown(text: string): ReactNode[] {
  const tokens: ReactNode[] = []
  const pattern =
    /(\[([^\]]+)\]\(((?:https?:\/\/|\/)[^) \t]+)\)|`([^`]+)`|\*\*([^*]+)\*\*|__([^_]+)__|\*([^*]+)\*|_([^_]+)_|(https?:\/\/[^\s<]+))/g
  let last = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) tokens.push(text.slice(last, match.index))

    if (match[2] && match[3]) {
      const href = match[3]
      const isExternal = href.startsWith('http')
      tokens.push(
        <a
          key={`link-${match.index}`}
          href={href}
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noreferrer' : undefined}
          className="font-semibold text-[#026d32] underline decoration-[#026d32]/25 underline-offset-[3px] transition-colors hover:decoration-[#026d32]"
        >
          {match[2]}
        </a>
      )
    } else if (match[4]) {
      tokens.push(
        <code
          key={`code-${match.index}`}
          className="rounded-md bg-black/6 px-[0.4em] py-[0.15em] font-mono text-[0.875em] font-semibold text-current"
        >
          {match[4]}
        </code>
      )
    } else if (match[5] || match[6]) {
      tokens.push(
        <strong key={`bold-${match.index}`} className="font-black text-current">
          {match[5] || match[6]}
        </strong>
      )
    } else if (match[7] || match[8]) {
      tokens.push(
        <em key={`em-${match.index}`} className="italic text-current">
          {match[7] || match[8]}
        </em>
      )
    } else if (match[9]) {
      tokens.push(
        <a
          key={`auto-${match.index}`}
          href={match[9]}
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-[#026d32] underline decoration-[#026d32]/25 underline-offset-[3px] transition-colors hover:decoration-[#026d32]"
        >
          {match[9]}
        </a>
      )
    }

    last = match.index + match[0].length
  }

  if (last < text.length) tokens.push(text.slice(last))
  return tokens
}

function renderInlineImageFigure(src: string, key: string, alt: string) {
  return (
    <figure
      key={key}
      className="relative mx-auto w-fit max-w-3xl overflow-hidden rounded-[1.6rem] border border-white/80 bg-[linear-gradient(160deg,rgba(255,255,255,0.98),rgba(241,247,243,0.94))] p-2 shadow-[0_20px_60px_rgba(18,24,21,0.08)]"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(163,255,179,0.22),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(2,109,50,0.08),transparent_30%)]" />
      <div className="relative overflow-hidden rounded-[1.1rem] border border-black/5 bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="mx-auto h-auto max-h-[520px] object-contain" />
      </div>
    </figure>
  )
}

function slugifyHeading(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function renderSpotlightListCard(title: string, items: string[], key: string) {
  return (
    <div
      key={key}
      className="relative my-3 overflow-hidden rounded-[1.9rem] border border-white/10 bg-[linear-gradient(160deg,#050b07_0%,#0a1710_55%,#10261a_100%)] p-6 text-white shadow-[0_28px_90px_rgba(4,10,7,0.32)]"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(163,255,179,0.16),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(48,192,107,0.14),transparent_24%)]" />
      <div className="relative">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#A3FFB3]">Key takeaway</p>
        <h4 className="mt-2 text-2xl font-black tracking-tight text-white">{title}</h4>
        <div className="mt-4 grid gap-2.5">
          {items.map(item => (
            <div
              key={item}
              className="flex items-start gap-3 rounded-[1.1rem] border border-white/8 bg-white/6 px-4 py-3 backdrop-blur-sm"
            >
              <span className="mt-[7px] h-2 w-2 shrink-0 rounded-full bg-[#A3FFB3]" />
              <p className="text-sm leading-6 text-white/86">{renderInlineMarkdown(item)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function isCompactLabelParagraph(text: string) {
  return text.length <= 72 && text.endsWith(':')
}

function isFaqHeading(text: string) {
  const normalized = text.toLowerCase()
  return normalized.includes('frequently asked questions') || normalized.startsWith('faq')
}

function renderFaqSection(
  title: string,
  items: Array<{ question: string; answers: string[] }>,
  key: string
) {
  return (
    <section
      key={key}
      className="relative my-6 overflow-hidden rounded-[2.2rem] border border-[#026d32]/10 bg-[linear-gradient(160deg,#f7fbf8_0%,#eef6f0_54%,#fdfefe_100%)] p-5 shadow-[0_24px_80px_rgba(18,24,21,0.08)] sm:p-7"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(163,255,179,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(2,109,50,0.07),transparent_24%)]" />
      <div className="relative">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center rounded-full bg-[#026d32]/8 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#026d32]">
            FAQ
          </span>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">
            Fast answers for Google applicants
          </p>
        </div>

        <h2
          id={slugifyHeading(title)}
          className="max-w-3xl text-[2rem] font-black tracking-tight text-zinc-900 sm:text-[2.3rem] leading-[1.05]"
        >
          {renderInlineMarkdown(title)}
        </h2>

        <ol className="mt-6 space-y-4">
          {items.map((item, index) => (
            <li
              key={`${item.question}-${index}`}
              className="overflow-hidden rounded-[1.55rem] border border-black/6 bg-white/88 shadow-[0_12px_32px_rgba(18,24,21,0.05)] backdrop-blur-sm"
            >
              <details open={index === 0} className="group">
                <summary className="list-none cursor-pointer px-5 py-4 sm:px-6 sm:py-5">
                  <div className="flex items-start gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] bg-[linear-gradient(135deg,#026d32_0%,#0d8a43_100%)] text-[11px] font-black uppercase tracking-[0.14em] text-white shadow-[0_10px_24px_rgba(2,109,50,0.18)]">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[1.15rem] font-black tracking-tight text-zinc-900 leading-snug">
                        {renderInlineMarkdown(item.question)}
                      </h3>
                    </div>
                    <span className="mt-1 text-xl font-light text-[#026d32] transition-transform duration-200 group-open:rotate-45">
                      +
                    </span>
                  </div>
                </summary>

                <div className="border-t border-black/5 bg-[linear-gradient(180deg,rgba(163,255,179,0.08),rgba(255,255,255,0.74))] px-5 py-4 sm:px-6 sm:py-5">
                  <div className="space-y-3">
                    {item.answers.map(answer => (
                      <p key={answer} className="text-[1rem] leading-8 text-zinc-600">
                        {renderInlineMarkdown(answer)}
                      </p>
                    ))}
                  </div>
                </div>
              </details>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MarkdownContent({
  content,
  className = '',
  inlineImages = [],
  imageAltBase = '',
  customBlocks,
}: {
  content: string
  className?: string
  inlineImages?: string[]
  imageAltBase?: string
  customBlocks?: Record<string, ReactNode>
}) {
  const lines = content.replace(/\r\n/g, '\n').split('\n')
  const blocks: ReactNode[] = []
  let index = 0
  let isFirst = true // for lead-paragraph treatment

  while (index < lines.length) {
    const rawLine = lines[index]
    const line = rawLine.trim()

    if (!line) { index++; continue }

    if (/^\s*##\s+/.test(rawLine)) {
      const headingText = rawLine.replace(/^\s*##\s+/, '').trim()

      if (isFaqHeading(headingText)) {
        index++

        const faqItems: Array<{ question: string; answers: string[] }> = []

        while (index < lines.length) {
          const currentRawLine = lines[index]
          const currentLine = currentRawLine.trim()

          if (!currentLine) {
            index++
            continue
          }

          if (/^\s*##\s+/.test(currentRawLine)) {
            break
          }

          if (!/^\s*###\s+/.test(currentRawLine)) {
            index++
            continue
          }

          const question = currentRawLine.replace(/^\s*###\s+/, '').trim()
          index++

          const answers: string[] = []
          let paragraphLines: string[] = []

          while (index < lines.length) {
            const answerRawLine = lines[index]
            const answerLine = answerRawLine.trim()

            if (/^\s*##\s+/.test(answerRawLine) || /^\s*###\s+/.test(answerRawLine)) {
              break
            }

            if (!answerLine) {
              if (paragraphLines.length > 0) {
                answers.push(paragraphLines.join(' ').trim())
                paragraphLines = []
              }
              index++
              continue
            }

            paragraphLines.push(answerLine)
            index++
          }

          if (paragraphLines.length > 0) {
            answers.push(paragraphLines.join(' ').trim())
          }

          if (question && answers.length > 0) {
            faqItems.push({ question, answers })
          }
        }

        if (faqItems.length > 0) {
          blocks.push(renderFaqSection(headingText, faqItems, `faq-${blocks.length}`))
          continue
        }
      }
    }

    if (/^\[\[[a-z0-9:_-]+\]\]$/i.test(line)) {
      const blockKey = line.slice(2, -2)
      const block = customBlocks?.[blockKey]
      index++

      if (block) {
        isFirst = false
        blocks.push(
          <div key={`custom-${blockKey}-${blocks.length}`}>
            {block}
          </div>
        )
      }

      continue
    }

    // ── Spotlight card marker ─────────────────────────────────────────────
    if (line.startsWith('!!! ')) {
      const title = line.replace(/^!!!\s+/, '').trim()
      index++

      while (index < lines.length && !lines[index].trim()) index++

      const items: string[] = []
      while (index < lines.length && /^\s*[-*+]\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\s*[-*+]\s+/, '').trim())
        index++
      }

      if (items.length > 0) {
        blocks.push(renderSpotlightListCard(title, items, `spotlight-${blocks.length}`))
        continue
      }

      blocks.push(
        <p key={`spotlight-fallback-${blocks.length}`} className="text-[1.05rem] leading-[1.9] text-zinc-600">
          {renderInlineMarkdown(title)}
        </p>
      )
      continue
    }

    // ── Code block ────────────────────────────────────────────────────────
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim() || 'code'
      const codeLines: string[] = []
      index++

      while (index < lines.length && !lines[index].trim().startsWith('```')) {
        codeLines.push(lines[index])
        index++
      }
      if (index < lines.length) index++

      blocks.push(
        <div key={`code-${blocks.length}`} className="my-2 overflow-hidden rounded-[1.25rem] border border-zinc-800 bg-zinc-950 shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
          <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800 bg-[#0d0d0d]">
            <div className="flex gap-1.5">
              <span className="h-3 w-3 rounded-full bg-red-500/70" />
              <span className="h-3 w-3 rounded-full bg-yellow-500/70" />
              <span className="h-3 w-3 rounded-full bg-green-500/70" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{lang}</span>
          </div>
          <pre className="overflow-x-auto px-6 py-5 text-[0.875rem] leading-7 text-zinc-200">
            <code>{codeLines.join('\n')}</code>
          </pre>
        </div>
      )
      continue
    }

    // ── Markdown table (pipe syntax) ────────────────────────────────────
    // Detects | col | col | rows. If the two headers contain "do" and "don't"
    // (case-insensitive) it renders a premium Do's & Don'ts card; otherwise
    // a standard styled table.
    if (/^\s*\|/.test(rawLine)) {
      // Collect all pipe-delimited rows
      const tableRows: string[][] = []
      while (index < lines.length && /^\s*\|/.test(lines[index])) {
        const cells = lines[index]
          .trim()
          .replace(/^\||\|$/g, '')
          .split('|')
          .map(c => c.trim())
        tableRows.push(cells)
        index++
      }

      // Filter out separator rows (--- cells only)
      const dataRows = tableRows.filter(row => !row.every(c => /^[-: ]+$/.test(c)))
      if (dataRows.length === 0) continue

      const headers = dataRows[0]
      const body = dataRows.slice(1)

      // Detect Do / Don't table
      const isDo = (h: string) => /\bdo\b/i.test(h) && !/don.?t/i.test(h)
      const isDont = (h: string) => /don.?t/i.test(h)

      // Detect Before / After table
      const isBefore = (h: string) => /\bbefore\b/i.test(h)
      const isAfter = (h: string) => /\bafter\b/i.test(h)

      if (headers.length === 2 && isDo(headers[0]) && isDont(headers[1])) {
        // ── Premium Do's & Don'ts card ─────────────────────────────────
        blocks.push(
          <div
            key={`dosdont-${blocks.length}`}
            className="relative isolate my-2 overflow-hidden rounded-[2rem] border border-emerald-400/20 bg-[linear-gradient(155deg,#026d32_0%,#0b7a3d_42%,#0d3d25_100%)] text-white ring-1 ring-black/6"
            style={{ clipPath: 'inset(0 round 2rem)' }}
          >
            {/* Header row */}
            <div className="relative grid grid-cols-2 border-b border-white/10">
              <div className="flex items-center gap-2.5 rounded-tl-[calc(2rem-1px)] bg-white/6 px-6 py-4 backdrop-blur-sm">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/16 text-white text-xs font-black">✓</span>
                <span className="text-[11px] font-black uppercase tracking-[0.22em] text-white">
                  {headers[0]}
                </span>
              </div>
              <div className="flex items-center gap-2.5 rounded-tr-[calc(2rem-1px)] border-l border-white/10 bg-black/14 px-6 py-4 backdrop-blur-sm">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white/78 text-xs font-black">✕</span>
                <span className="text-[11px] font-black uppercase tracking-[0.22em] text-white/78">
                  {headers[1]}
                </span>
              </div>
            </div>

            {/* Body rows */}
            <div className="relative divide-y divide-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.05))]">
              {body.map((row, ri) => (
                <div key={ri} className="grid grid-cols-2 divide-x divide-white/8">
                  {/* Do cell */}
                  <div className="flex items-start gap-3 bg-white/7 px-6 py-4">
                    <span className="mt-[3px] flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#A3FFB3]/18">
                      <span className="text-[#A3FFB3] text-[10px] font-black">✓</span>
                    </span>
                    <p className="text-sm leading-relaxed text-white/88">
                      {renderInlineMarkdown(row[0] ?? '')}
                    </p>
                  </div>
                  {/* Don't cell */}
                  <div className="flex items-start gap-3 bg-black/10 px-6 py-4">
                    <span className="mt-[3px] flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10">
                      <span className="text-white/78 text-[10px] font-black">✕</span>
                    </span>
                    <p className="text-sm leading-relaxed text-white/70">
                      {renderInlineMarkdown(row[1] ?? '')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      } else if (headers.length === 2 && isBefore(headers[0]) && isAfter(headers[1])) {
        // ── Premium Before & After card ────────────────────────────────
        blocks.push(
          <div
            key={`beforeafter-${blocks.length}`}
            className="relative isolate my-3 overflow-hidden rounded-[2rem] border border-[#026d32]/20 bg-[linear-gradient(155deg,#191c1d_0%,#2e3132_42%,#3f493f_100%)] text-white ring-1 ring-black/10"
            style={{ clipPath: 'inset(0 round 2rem)' }}
          >
            {/* Header row */}
            <div className="relative grid grid-cols-[1fr_1.1fr] md:grid-cols-2 border-b border-white/10">
              <div className="flex items-center gap-2.5 rounded-tl-[calc(2rem-1px)] bg-black/20 px-5 sm:px-6 py-4 backdrop-blur-sm">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white/50 text-xs font-black">−</span>
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.22em] text-white/70">
                  {headers[0]}
                </span>
              </div>
              <div className="flex items-center gap-2.5 rounded-tr-[calc(2rem-1px)] border-l border-white/10 bg-[linear-gradient(180deg,rgba(2,109,50,0.4),rgba(2,109,50,0.1))] px-5 sm:px-6 py-4 backdrop-blur-sm shadow-[inset_0_1px_rgba(255,255,255,0.06)]">
                <span className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-white/20 text-[#A3FFB3] text-xs font-black shadow-sm">✦</span>
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.22em] text-[#A3FFB3] drop-shadow-sm">
                  {headers[1]}
                </span>
              </div>
            </div>

            {/* Body rows */}
            <div className="relative divide-y divide-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))]">
              {body.map((row, ri) => (
                <div key={ri} className="grid grid-cols-[1fr_1.1fr] md:grid-cols-2 divide-x divide-white/8">
                  {/* Before cell */}
                  <div className="flex flex-col gap-2 bg-black/10 px-5 py-5 sm:px-6">
                    <p className="text-sm leading-relaxed text-white/60 line-through decoration-white/30">
                      {renderInlineMarkdown(row[0] ?? '')}
                    </p>
                  </div>
                  {/* After cell */}
                  <div className="flex flex-col gap-2 bg-[#026d32]/10 px-5 py-5 sm:px-6">
                    <p className="text-sm leading-relaxed text-white/95 font-medium">
                      {renderInlineMarkdown(row[1] ?? '')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      } else {
        // ── Standard styled table ────────────────────────────────────────
        blocks.push(
          <div
            key={`table-${blocks.length}`}
            className="my-2 overflow-x-auto rounded-[1.5rem] border border-white/80 bg-[linear-gradient(160deg,rgba(255,255,255,0.98),rgba(241,247,243,0.94))] shadow-[0_16px_50px_rgba(18,24,21,0.07)]"
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/5 bg-[linear-gradient(90deg,rgba(2,109,50,0.09),rgba(163,255,179,0.12))]">
                  {headers.map((h, hi) => (
                    <th key={hi} className="px-5 py-3.5 text-left text-[11px] font-black uppercase tracking-[0.16em] text-[#026d32]">
                      {renderInlineMarkdown(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 bg-white/80">
                {body.map((row, ri) => (
                  <tr key={ri} className="transition-colors hover:bg-[#f3fbf5]">
                    {row.map((cell, ci) => (
                      <td key={ci} className={`px-5 py-3.5 text-zinc-600 leading-relaxed ${ci === 0 ? 'font-semibold text-zinc-800' : ''}`}>
                        {renderInlineMarkdown(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
      continue
    }

    // ── Inline image ──────────────────────────────────────────────────────
    const imgMatch = rawLine.match(/^\s*!\[([^\]]*)\]\(((?:https?:\/\/|\/)[^)]+)\)\s*$/)
    if (imgMatch) {
      blocks.push(
        <figure key={`img-${blocks.length}`} className="my-2 overflow-hidden rounded-[1.25rem] border border-zinc-100 shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imgMatch[2]} alt={imgMatch[1] || ''} className="h-auto w-full object-cover" />
          {imgMatch[1] && (
            <figcaption className="px-5 py-3 text-[11px] text-center font-semibold text-zinc-400 uppercase tracking-widest">
              {imgMatch[1]}
            </figcaption>
          )}
        </figure>
      )
      index++
      continue
    }

    // ── Headings ──────────────────────────────────────────────────────────
    const hMatch = rawLine.match(/^\s*(#{1,6})\s+(.*)$/)
    if (hMatch) {
      const level = hMatch[1].length
      const text = hMatch[2].trim()
      const Tag = `h${Math.min(level, 6)}` as ElementType

      const cls: Record<number, string> = {
        1: 'text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 mt-6 mb-1 leading-[1.1]',
        2: 'text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 mt-8 mb-2 leading-[1.15]',
        3: 'text-[1.35rem] font-black tracking-tight text-zinc-900 mt-5 mb-2 leading-snug',
        4: 'text-base font-black uppercase tracking-[0.14em] text-[#026d32] mt-4',
        5: 'text-sm font-black uppercase tracking-[0.14em] text-zinc-500 mt-3',
        6: 'text-xs font-black uppercase tracking-widest text-zinc-400 mt-2',
      }

      blocks.push(
        <div key={`h-${blocks.length}`}>
          {level === 2 && (
            <div className="mb-3 mt-10 h-0.5 w-12 rounded-full bg-gradient-to-r from-[#026d32] to-[#A3FFB3]" />
          )}
          {level === 3 && (
            <div className="mb-2 mt-6 h-0.5 w-6 rounded-full bg-[#026d32]/30" />
          )}
          <Tag id={level <= 3 ? slugifyHeading(text) : undefined} className={cls[level] ?? cls[4]}>
            {renderInlineMarkdown(text)}
          </Tag>
        </div>
      )
      index++
      continue
    }

    // ── Horizontal rule ───────────────────────────────────────────────────
    if (/^\s*([-*_]){3,}\s*$/.test(rawLine)) {
      blocks.push(
        <div key={`hr-${blocks.length}`} className="flex items-center gap-5 py-4 my-2">
          <div className="h-px flex-1 bg-zinc-100" />
          <div className="flex gap-1">
            {[0.5, 1, 0.5].map((o, i) => (
              <span key={i} className="h-1.5 w-1.5 rounded-full bg-[#026d32]" style={{ opacity: o }} />
            ))}
          </div>
          <div className="h-px flex-1 bg-zinc-100" />
        </div>
      )
      index++
      continue
    }

    // ── Blockquote (pull-quote style) ────────────────────────────────────
    if (/^\s*>\s?/.test(rawLine)) {
      const qLines: string[] = []
      while (index < lines.length && /^\s*>\s?/.test(lines[index])) {
        qLines.push(lines[index].replace(/^\s*>\s?/, '').trim())
        index++
      }

      blocks.push(
        <blockquote
          key={`bq-${blocks.length}`}
          className="relative my-2 overflow-hidden rounded-[1.5rem] border-0 bg-gradient-to-br from-[#f0fdf4] to-[#dcfce7] px-8 py-7"
        >
          {/* Left accent */}
          <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-[1.5rem] bg-gradient-to-b from-[#026d32] to-[#A3FFB3]" />
          {/* Big quote mark */}
          <div className="absolute top-4 right-6 text-[72px] leading-none text-[#026d32]/10 font-serif select-none">&ldquo;</div>
          <p className="relative text-[1.15rem] leading-[1.85] text-zinc-700 font-medium italic">
            {renderInlineMarkdown(qLines.join(' '))}
          </p>
        </blockquote>
      )
      continue
    }

    // ── Unordered list (with Do/Don't look-ahead) ────────────────────────
    if (/^\s*[-*+]\s+/.test(rawLine)) {
      const dos: string[] = []
      while (index < lines.length && /^\s*[-*+]\s+/.test(lines[index])) {
        dos.push(lines[index].replace(/^\s*[-*+]\s+/, '').trim())
        index++
      }

      // Look-ahead: skip blank lines, then check for a "Do not include:" style separator
      let peek = index
      while (peek < lines.length && !lines[peek].trim()) peek++

      // Separator = short line (≤120 chars) ending with ":" that signals a negation
      const sepLine = lines[peek]?.trim() ?? ''
      const isSep = sepLine.length > 0 &&
        sepLine.length <= 120 &&
        sepLine.endsWith(':') &&
        /don.?t|do\s+not|avoid|never|exclude|omit/i.test(sepLine)

      if (isSep) {
        // Collect label (strip trailing colon and markdown bold markers)
        const dontLabel = sepLine.replace(/:$/, '').replace(/\*\*/g, '').trim()
        peek++ // past separator line
        while (peek < lines.length && !lines[peek].trim()) peek++ // skip blanks

        // Check for a second list right after
        if (peek < lines.length && /^\s*[-*+]\s+/.test(lines[peek])) {
          index = peek // advance main cursor
          const donts: string[] = []
          while (index < lines.length && /^\s*[-*+]\s+/.test(lines[index])) {
            donts.push(lines[index].replace(/^\s*[-*+]\s+/, '').trim())
            index++
          }

          // Pad shorter column with empty strings so rows align
          const len = Math.max(dos.length, donts.length)
          const dosP = [...dos, ...Array(len - dos.length).fill('')]
          const dontsP = [...donts, ...Array(len - donts.length).fill('')]

          blocks.push(
            <div
              key={`dosdont-${blocks.length}`}
              className="relative isolate my-2 overflow-hidden rounded-[2rem] border border-emerald-400/20 bg-[linear-gradient(155deg,#026d32_0%,#0b7a3d_42%,#0d3d25_100%)] text-white ring-1 ring-black/6"
              style={{ clipPath: 'inset(0 round 2rem)' }}
            >
              {/* Headers */}
              <div className="relative grid grid-cols-2 border-b border-white/10">
                <div className="flex items-center gap-2.5 rounded-tl-[calc(2rem-1px)] bg-white/6 px-6 py-4 backdrop-blur-sm">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/16 text-white text-xs font-black">✓</span>
                  <span className="text-[11px] font-black uppercase tracking-[0.22em] text-white">Include</span>
                </div>
                <div className="flex items-center gap-2.5 rounded-tr-[calc(2rem-1px)] border-l border-white/10 bg-black/14 px-6 py-4 backdrop-blur-sm">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white/78 text-xs font-black">✕</span>
                  <span className="line-clamp-1 text-[11px] font-black uppercase tracking-[0.22em] text-white/78">{dontLabel}</span>
                </div>
              </div>
              {/* Rows */}
              <div className="relative divide-y divide-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.05))]">
                {dosP.map((doItem, ri) => (
                  <div key={ri} className="grid grid-cols-2 divide-x divide-white/8">
                    <div className="flex items-start gap-3 bg-white/7 px-6 py-4">
                      {doItem ? (
                        <>
                          <span className="mt-[3px] flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#A3FFB3]/18">
                            <span className="text-[#A3FFB3] text-[10px] font-black">✓</span>
                          </span>
                          <p className="text-sm leading-relaxed text-white/88">{renderInlineMarkdown(doItem)}</p>
                        </>
                      ) : null}
                    </div>
                    <div className="flex items-start gap-3 bg-black/10 px-6 py-4">
                      {dontsP[ri] ? (
                        <>
                          <span className="mt-[3px] flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10">
                            <span className="text-white/78 text-[10px] font-black">✕</span>
                          </span>
                          <p className="text-sm leading-relaxed text-white/70">{renderInlineMarkdown(dontsP[ri])}</p>
                        </>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
          continue
        }
      }

      // Default: plain unordered list.
      // Note: if `isSep` was true but no second list followed, `index` was NOT
      // advanced past the separator — it will be re-encountered by the outer loop
      // and rendered as a paragraph (the expected fallback behaviour).
      blocks.push(
        <ul
          key={`ul-${blocks.length}`}
          className="my-2 w-full max-w-[34rem] space-y-2.5 rounded-[1.35rem] border border-black/6 bg-[linear-gradient(160deg,rgba(255,255,255,0.98),rgba(243,247,244,0.9))] px-5 py-4 shadow-[0_10px_28px_rgba(18,24,21,0.04)]"
        >
          {dos.map((item, i) => (
            <li
              key={i}
              className={`flex items-start gap-3 text-[1rem] leading-[1.65] text-zinc-700 ${i !== dos.length - 1 ? 'border-b border-black/6 pb-2.5' : ''}`}
            >
              <span className="mt-[7px] flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#026d32]/10">
                <span className="h-2 w-2 rounded-full bg-[#026d32]" />
              </span>
              <span className="min-w-0">{renderInlineMarkdown(item)}</span>
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
        index++
      }

      blocks.push(
        <ol
          key={`ol-${blocks.length}`}
          className="my-2 w-full max-w-[34rem] space-y-2.5 rounded-[1.35rem] border border-black/6 bg-[linear-gradient(160deg,rgba(255,255,255,0.98),rgba(243,247,244,0.9))] px-5 py-4 shadow-[0_10px_28px_rgba(18,24,21,0.04)]"
        >
          {items.map((item, i) => (
            <li
              key={i}
              className={`flex items-start gap-3.5 text-[1rem] leading-[1.65] text-zinc-700 ${i !== items.length - 1 ? 'border-b border-black/6 pb-2.5' : ''}`}
            >
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#026d32] text-[11px] font-black text-white shadow-sm">
                {i + 1}
              </span>
              <span className="min-w-0 pt-0.5">{renderInlineMarkdown(item)}</span>
            </li>
          ))}
        </ol>
      )
      continue
    }

    // ── Paragraph ─────────────────────────────────────────────────────────
    const paraLines: string[] = []
    while (
      index < lines.length &&
      lines[index].trim() &&
      !lines[index].trim().startsWith('```') &&
      !/^\s*!\[/.test(lines[index]) &&
      !/^\s*(#{1,6})\s+/.test(lines[index]) &&
      !/^\s*([-*_]){3,}\s*$/.test(lines[index]) &&
      !/^\s*>\s?/.test(lines[index]) &&
      !/^\s*[-*+]\s+/.test(lines[index]) &&
      !/^\s*\d+\.\s+/.test(lines[index])
    ) {
      paraLines.push(lines[index].trim())
      index++
    }

    const paraText = paraLines.join(' ')

    if (isCompactLabelParagraph(paraText)) {
      blocks.push(
        <p
          key={`label-${blocks.length}`}
          className="mb-1 text-[1.02rem] font-black tracking-tight text-zinc-900"
        >
          {renderInlineMarkdown(paraText)}
        </p>
      )
      isFirst = false
      continue
    }

    // First paragraph gets lead treatment
    if (isFirst) {
      isFirst = false
      blocks.push(
        <p key={`lead-${blocks.length}`} className="text-[1.2rem] leading-[1.95] text-zinc-600 font-medium">
          {renderInlineMarkdown(paraText)}
        </p>
      )
    } else {
      blocks.push(
        <p key={`p-${blocks.length}`} className="text-[1.05rem] leading-[1.95] text-zinc-600">
          {renderInlineMarkdown(paraText)}
        </p>
      )
    }
  }

  const renderedBlocks: ReactNode[] = []
  let imageIndex = 0
  const midPoint = Math.max(2, Math.floor(blocks.length / 2))

  blocks.forEach((block, blockIndex) => {
    renderedBlocks.push(block)

    const shouldInsertImage =
      imageIndex < inlineImages.length && (blockIndex === 1 || blockIndex === midPoint)

    if (shouldInsertImage) {
      renderedBlocks.push(renderInlineImageFigure(inlineImages[imageIndex], `inline-img-${blockIndex}`, `${imageAltBase} illustration ${imageIndex + 1}`))
      imageIndex += 1
    }
  })

  while (imageIndex < inlineImages.length) {
    renderedBlocks.push(renderInlineImageFigure(inlineImages[imageIndex], `inline-img-tail-${imageIndex}`, `${imageAltBase} illustration ${imageIndex + 1}`))
    imageIndex += 1
  }

  return (
    <div className={`space-y-7 ${className}`.trim()}>
      {renderedBlocks}
    </div>
  )
}

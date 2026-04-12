import type { ElementType, ReactNode } from 'react'

// ─── Inline markdown parser ───────────────────────────────────────────────────

function renderInlineMarkdown(text: string): ReactNode[] {
  const tokens: ReactNode[] = []
  const pattern =
    /(\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)|`([^`]+)`|\*\*([^*]+)\*\*|__([^_]+)__|\*([^*]+)\*|_([^_]+)_|(https?:\/\/[^\s<]+))/g
  let last = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) tokens.push(text.slice(last, match.index))

    if (match[2] && match[3]) {
      tokens.push(
        <a
          key={`link-${match.index}`}
          href={match[3]}
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-[#026d32] underline decoration-[#026d32]/25 underline-offset-[3px] transition-colors hover:decoration-[#026d32]"
        >
          {match[2]}
        </a>
      )
    } else if (match[4]) {
      tokens.push(
        <code
          key={`code-${match.index}`}
          className="rounded-md bg-[#026d32]/8 px-[0.4em] py-[0.15em] font-mono text-[0.875em] text-[#005224] font-semibold"
        >
          {match[4]}
        </code>
      )
    } else if (match[5] || match[6]) {
      tokens.push(
        <strong key={`bold-${match.index}`} className="font-black text-zinc-900">
          {match[5] || match[6]}
        </strong>
      )
    } else if (match[7] || match[8]) {
      tokens.push(
        <em key={`em-${match.index}`} className="italic text-zinc-700">
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

// ─── Main component ───────────────────────────────────────────────────────────

export default function MarkdownContent({
  content,
  className = '',
  inlineImages = [],
}: {
  content: string
  className?: string
  inlineImages?: string[]
}) {
  const lines  = content.replace(/\r\n/g, '\n').split('\n')
  const blocks: ReactNode[] = []
  let index    = 0
  let isFirst  = true // for lead-paragraph treatment

  while (index < lines.length) {
    const rawLine = lines[index]
    const line    = rawLine.trim()

    if (!line) { index++; continue }

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
      const body    = dataRows.slice(1)

      // Detect Do / Don't table
      const isDo   = (h: string) => /\bdo\b/i.test(h)  && !/don.?t/i.test(h)
      const isDont = (h: string) => /don.?t/i.test(h)

      if (headers.length === 2 && isDo(headers[0]) && isDont(headers[1])) {
        // ── Premium Do's & Don'ts card ─────────────────────────────────
        blocks.push(
          <div key={`dosdont-${blocks.length}`} className="my-2 overflow-hidden rounded-[1.75rem] border border-zinc-100 shadow-[0_8px_40px_rgba(0,0,0,0.07)]">
            {/* Header row */}
            <div className="grid grid-cols-2">
              <div className="flex items-center gap-2.5 bg-[#026d32] px-6 py-4">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-white text-xs font-black">✓</span>
                <span className="text-[11px] font-black uppercase tracking-[0.22em] text-white">
                  {headers[0]}
                </span>
              </div>
              <div className="flex items-center gap-2.5 bg-zinc-900 px-6 py-4 border-l border-zinc-800">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white/70 text-xs font-black">✕</span>
                <span className="text-[11px] font-black uppercase tracking-[0.22em] text-white/70">
                  {headers[1]}
                </span>
              </div>
            </div>

            {/* Body rows */}
            <div className="divide-y divide-zinc-100 bg-white">
              {body.map((row, ri) => (
                <div key={ri} className="grid grid-cols-2 divide-x divide-zinc-100">
                  {/* Do cell */}
                  <div className="flex items-start gap-3 px-6 py-4 bg-[#f0fdf4]/60">
                    <span className="mt-[3px] flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#026d32]/10">
                      <span className="text-[#026d32] text-[10px] font-black">✓</span>
                    </span>
                    <p className="text-sm leading-relaxed text-zinc-700">
                      {renderInlineMarkdown(row[0] ?? '')}
                    </p>
                  </div>
                  {/* Don't cell */}
                  <div className="flex items-start gap-3 px-6 py-4 bg-zinc-50/60">
                    <span className="mt-[3px] flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100">
                      <span className="text-red-500 text-[10px] font-black">✕</span>
                    </span>
                    <p className="text-sm leading-relaxed text-zinc-500">
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
          <div key={`table-${blocks.length}`} className="my-2 overflow-x-auto rounded-[1.25rem] border border-zinc-100 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-100">
                  {headers.map((h, hi) => (
                    <th key={hi} className="px-5 py-3.5 text-left text-[11px] font-black uppercase tracking-[0.16em] text-zinc-500">
                      {renderInlineMarkdown(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 bg-white">
                {body.map((row, ri) => (
                  <tr key={ri} className="hover:bg-zinc-50/50 transition-colors">
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
      const text  = hMatch[2].trim()
      const Tag   = `h${Math.min(level, 6)}` as ElementType

      const cls: Record<number, string> = {
        1: 'text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 mt-6 mb-1 leading-[1.1]',
        2: 'text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 mt-8 mb-2 leading-[1.15]',
        3: 'text-xl font-black tracking-tight text-zinc-900 mt-6 mb-1 leading-snug',
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
          <Tag className={cls[level] ?? cls[4]}>
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
      const sepLine   = lines[peek]?.trim() ?? ''
      const isSep     = sepLine.length > 0 &&
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
          const dosP   = [...dos,   ...Array(len - dos.length).fill('')]
          const dontsP = [...donts, ...Array(len - donts.length).fill('')]

          blocks.push(
            <div key={`dosdont-${blocks.length}`} className="my-2 overflow-hidden rounded-[1.75rem] border border-zinc-100 shadow-[0_8px_40px_rgba(0,0,0,0.07)]">
              {/* Headers */}
              <div className="grid grid-cols-2">
                <div className="flex items-center gap-2.5 bg-[#026d32] px-6 py-4">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-white text-xs font-black">✓</span>
                  <span className="text-[11px] font-black uppercase tracking-[0.22em] text-white">Include</span>
                </div>
                <div className="flex items-center gap-2.5 bg-zinc-900 px-6 py-4 border-l border-zinc-800">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white/70 text-xs font-black">✕</span>
                  <span className="text-[11px] font-black uppercase tracking-[0.22em] text-white/70 line-clamp-1">{dontLabel}</span>
                </div>
              </div>
              {/* Rows */}
              <div className="divide-y divide-zinc-100 bg-white">
                {dosP.map((doItem, ri) => (
                  <div key={ri} className="grid grid-cols-2 divide-x divide-zinc-100">
                    <div className="flex items-start gap-3 px-6 py-4 bg-[#f0fdf4]/50">
                      {doItem ? (
                        <>
                          <span className="mt-[3px] flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#026d32]/10">
                            <span className="text-[#026d32] text-[10px] font-black">✓</span>
                          </span>
                          <p className="text-sm leading-relaxed text-zinc-700">{renderInlineMarkdown(doItem)}</p>
                        </>
                      ) : null}
                    </div>
                    <div className="flex items-start gap-3 px-6 py-4 bg-zinc-50/50">
                      {dontsP[ri] ? (
                        <>
                          <span className="mt-[3px] flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100">
                            <span className="text-red-500 text-[10px] font-black">✕</span>
                          </span>
                          <p className="text-sm leading-relaxed text-zinc-500">{renderInlineMarkdown(dontsP[ri])}</p>
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
        <ul key={`ul-${blocks.length}`} className="space-y-3 my-1">
          {dos.map((item, i) => (
            <li key={i} className="flex items-start gap-3.5 text-[1.05rem] leading-[1.8] text-zinc-600">
              <span className="mt-[7px] flex h-[7px] w-[7px] shrink-0 rounded-full bg-[#026d32]" />
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
        index++
      }

      blocks.push(
        <ol key={`ol-${blocks.length}`} className="space-y-4 my-1">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-4 text-[1.05rem] leading-[1.8] text-zinc-600">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#026d32] text-[11px] font-black text-white shadow-sm">
                {i + 1}
              </span>
              <span className="pt-0.5">{renderInlineMarkdown(item)}</span>
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

  // Append any sidebar inline images not already rendered
  if (inlineImages.length > 0) {
    blocks.push(
      <div key="inline-imgs" className="mt-4 grid gap-5">
        {inlineImages.map(src => (
          <figure key={src} className="overflow-hidden rounded-[1.25rem] border border-zinc-100 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="h-auto w-full object-cover" />
          </figure>
        ))}
      </div>
    )
  }

  return (
    <div className={`space-y-7 ${className}`.trim()}>
      {blocks}
    </div>
  )
}

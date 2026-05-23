import { sanitizeUniversalConfig } from '@/lib/templateOptions'
import { getEducationDateLabel, getProjectBullets, getResumeSkills, normalizeSkillSections } from '@/lib/resume-data'
import type { ResumeData, UniversalConfig } from '@/types'

// Convert #RRGGBB hex to the 6-char hex string docx expects (no #)
function hexToDocx(hex: string): string {
  return (hex || '#026d32').replace('#', '').slice(0, 6).toUpperCase()
}

// Extract a short font name docx can use (strip fallbacks)
function primaryFont(fontFamily: string): string {
  return (fontFamily || 'Calibri').split(',')[0].trim().replace(/['"]/g, '') || 'Calibri'
}

export async function generateDOCX(
  data: ResumeData,
  filename: string,
  config?: UniversalConfig,
  sectionOrder?: string[],
  sidebarSectionOrder?: string[],
): Promise<void> {
  const {
    AlignmentType,
    Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType,
    BorderStyle,
    ExternalHyperlink,
  } = await import('docx')

  function normalizeHref(raw: string | null | undefined): string | null {
    if (!raw) return null
    const value = raw.trim()
    if (!value) return null

    // Strict scheme allowlist — same rules as the template renderer to keep
    // PDF, preview, and DOCX behaviour identical.
    if (/^[a-z][a-z0-9+.\-]*:/i.test(value)) {
      const lower = value.toLowerCase()
      if (
        lower.startsWith('http:') ||
        lower.startsWith('https:') ||
        lower.startsWith('mailto:') ||
        lower.startsWith('tel:')
      ) {
        return value
      }
      return null
    }

    return `https://${value.replace(/^\/+/, '')}`
  }

  type ParagraphRun = InstanceType<typeof TextRun> | InstanceType<typeof ExternalHyperlink>
  type BodyBlock = InstanceType<typeof Paragraph> | InstanceType<typeof Table>

  const safeConfig = sanitizeUniversalConfig(config)
  const accent = hexToDocx(safeConfig.accentColor ?? '#026d32')
  const font = primaryFont(safeConfig.fontFamily ?? 'Calibri')
  const isCompressed = safeConfig.density === 'compressed'
  const isLatexStyle = safeConfig.headerStyle === 'timeless' || safeConfig.bulletStyle === 'latex' || safeConfig.sectionHeadingStyle === 'latex-rule'
  const spacingAfter = isCompressed ? 80 : 160
  const bulletMarker = safeConfig.bulletStyle === 'dash' ? '- ' : safeConfig.bulletStyle === 'square' ? '▪ ' : '• '
  const headerAlignment = safeConfig.headerStyle === 'centered' || safeConfig.headerStyle === 'timeless' ? AlignmentType.CENTER : AlignmentType.LEFT
  const nameSize = safeConfig.headerStyle === 'timeless' ? 50 : safeConfig.nameSize === 'hero' ? 56 : safeConfig.nameSize === 'large' ? 48 : 42
  const skillSeparator = safeConfig.skillsStyle === 'divider' ? '  •  ' : ', '

  // ── Style helpers ──────────────────────────────────────────────────────────

  const sectionHeading = (text: string) =>
    new Paragraph({
      children: [new TextRun({
        text: safeConfig.sectionHeadingStyle === 'latex-rule' ? text : text.toUpperCase(),
        bold: safeConfig.sectionHeadingStyle !== 'latex-rule',
        color: isLatexStyle ? '000000' : accent,
        font,
        size: safeConfig.sectionHeadingStyle === 'latex-rule' ? 24 : 18,
      })],
      spacing: { before: isLatexStyle ? 120 : isCompressed ? 160 : 240, after: isLatexStyle ? 20 : 40 },
      ...(safeConfig.sectionHeadingStyle === 'rule' || safeConfig.sectionHeadingStyle === 'latex-rule'
        ? {
            border: {
              bottom: { style: BorderStyle.SINGLE, size: 4, color: isLatexStyle ? '000000' : 'CCCCCC', space: 2 },
            },
          }
        : {}),
    })

  const body = (text: string, opts: { bold?: boolean; italic?: boolean; color?: string; size?: number } = {}) =>
    new Paragraph({
      children: [new TextRun({ text, font, size: opts.size ?? 20, bold: opts.bold, italics: opts.italic, color: opts.color })],
      spacing: { after: spacingAfter / 2 },
    })

  const bullet = (text: string) =>
    new Paragraph({
      children: [
        new TextRun({ text: bulletMarker, font, size: isLatexStyle ? 19 : 20, color: isLatexStyle ? '000000' : accent }),
        new TextRun({ text, font, size: isLatexStyle ? 19 : 20, color: isLatexStyle ? '000000' : undefined }),
      ],
      indent: { left: isLatexStyle ? 460 : 360 },
      spacing: { after: isLatexStyle ? 20 : spacingAfter / 2 },
    })

  const gap = () => new Paragraph({ children: [new TextRun({ text: '' })], spacing: { after: spacingAfter } })
  const noCellBorders = {
    top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  }

  function buildHyperlinkRun(text: string, url: string | null | undefined, runOpts: { bold?: boolean; italic?: boolean; size?: number; color?: string } = {}): ParagraphRun {
    const href = normalizeHref(url)
    const linkColor = `#${accent}`
    if (!href) {
      return new TextRun({ text, font, size: runOpts.size ?? 20, bold: runOpts.bold, italics: runOpts.italic, color: runOpts.color })
    }
    return new ExternalHyperlink({
      link: href,
      children: [new TextRun({
        text,
        font,
        size: runOpts.size ?? 20,
        bold: runOpts.bold,
        italics: runOpts.italic,
        color: linkColor.replace('#', ''),
        underline: { type: 'single', color: linkColor.replace('#', '') },
      })],
    })
  }

  // Hard page break paragraph for the pageBreak custom section type.
  const pageBreak = () => new Paragraph({
    children: [new TextRun({ text: '' })],
    pageBreakBefore: true,
  })

  // ── Section renderers ──────────────────────────────────────────────────────

  function renderSection(id: string): BodyBlock[] {
    if (id.startsWith('custom_')) {
      const custom = data.customSections?.find(c => c.id === id)
      if (!custom) return []

      // Page break is an invisible marker — emit only a paragraph that forces
      // a hard page break, no heading, no body. Matches the live preview.
      if (custom.type === 'pageBreak') {
        return [pageBreak()]
      }

      const out: Array<InstanceType<typeof Paragraph>> = [sectionHeading(custom.title)]
      if (custom.type === 'text' && custom.text) out.push(body(custom.text))
      if (custom.type === 'tags' && custom.tags?.length) out.push(body(custom.tags.join(', ')))
      if (custom.type === 'complex' && custom.items?.length) {
        custom.items.forEach((item) => {
          out.push(body(item.title || '', { bold: true }))
          if (item.company) out.push(body(item.company, { color: '666666' }))
          item.bullets.forEach((bulletText) => out.push(bullet(bulletText)))
          out.push(gap())
        })
      }
      return out
    }

    switch (id) {
      case 'summary':
        if (!data.summary) return []
        return [sectionHeading('Summary'), body(data.summary), gap()]

      case 'experience':
        if (!data.experience.length) return []
        return [
          sectionHeading('Work Experience'),
          ...data.experience.flatMap(exp => {
            const dateLabel = exp.startDate || exp.endDate
              ? `${exp.startDate || ''}${exp.startDate && exp.endDate ? ' - ' : ''}${exp.endDate || ''}`
              : ''

            return [
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: noCellBorders,
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        borders: noCellBorders,
                        width: { size: 70, type: WidthType.PERCENTAGE },
                        children: [
                          new Paragraph({
                            children: [new TextRun({ text: exp.title, bold: true, font, size: 20 })],
                            spacing: { before: isCompressed ? 80 : 120, after: 20 },
                          }),
                          ...(exp.company
                            ? [
                                new Paragraph({
                                  children: [buildHyperlinkRun(exp.company, exp.url, { size: 20, color: '555555' })],
                                  spacing: { after: 40 },
                                }),
                              ]
                            : []),
                        ],
                      }),
                      new TableCell({
                        borders: noCellBorders,
                        width: { size: 30, type: WidthType.PERCENTAGE },
                        children: [
                          ...(dateLabel
                            ? [
                                new Paragraph({
                                  children: [new TextRun({ text: dateLabel, font, size: 18, color: '888888' })],
                                  alignment: AlignmentType.RIGHT,
                                  spacing: { before: isCompressed ? 80 : 120, after: 20 },
                                }),
                              ]
                            : []),
                          ...(exp.location
                            ? [
                                new Paragraph({
                                  children: [new TextRun({ text: exp.location, font, size: 18, color: '888888' })],
                                  alignment: AlignmentType.RIGHT,
                                  spacing: { after: 40 },
                                }),
                              ]
                            : []),
                          ...(!dateLabel && !exp.location ? [new Paragraph({ children: [] })] : []),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ...(exp.summary ? [body(exp.summary)] : []),
            ...exp.bullets
              .filter((_, i) => exp.bulletVisibility ? exp.bulletVisibility[i] !== false : true)
              .map(b => bullet(b)),
            gap(),
            ]
          }),
        ]

      case 'education':
        if (!data.education.length) return []
        return [
          sectionHeading('Education'),
          ...data.education.flatMap(edu => [
            new Paragraph({
              children: [
                new TextRun({ text: edu.institution, bold: true, font, size: 20 }),
                ...(getEducationDateLabel(edu) ? [new TextRun({ text: `  ${getEducationDateLabel(edu)}`, font, size: 18, color: '888888' })] : []),
              ],
              spacing: { before: 80, after: 40 },
            }),
            body(`${edu.degree}${edu.field ? ` · ${edu.field}` : ''}${edu.gpa.trim() ? `  GPA: ${edu.gpa}` : ''}`, { color: '555555' }),
            gap(),
          ]),
        ]

      case 'skills':
        if (!getResumeSkills(data).length) return []
        const skillLines = normalizeSkillSections(data.skillSections, getResumeSkills(data))
          .map(section => `${section.title ? `${section.title}${section.tag ? ` (${section.tag})` : ''}: ` : ''}${section.skills.join(skillSeparator)}`)
          .filter(Boolean)
        return [
          sectionHeading('Skills'),
          ...skillLines.map(line => body(line)),
          gap(),
        ]

      case 'projects':
        if (!data.projects.length) return []
        return [
          sectionHeading('Projects'),
          ...data.projects.flatMap(p => [
            new Paragraph({
              children: [buildHyperlinkRun(p.name, p.url, { bold: true })],
              spacing: { after: spacingAfter / 2 },
            }),
            ...(p.description ? [body(p.description, { color: '555555' })] : []),
            ...getProjectBullets(p).map(item => bullet(item)),
            ...(p.technologies?.length ? [body(p.technologies.join(', '), { italic: true, color: '888888', size: 18 })] : []),
            gap(),
          ]),
        ]

      case 'certifications':
        if (!data.certifications.length) return []
        return [
          sectionHeading('Certifications'),
          ...data.certifications.map(c => new Paragraph({
            children: [
              buildHyperlinkRun(c.name, c.url, { size: 20 }),
              ...(c.issuer ? [new TextRun({ text: ` · ${c.issuer}`, font, size: 20 })] : []),
              ...(c.date ? [new TextRun({ text: `  (${c.date})`, font, size: 20 })] : []),
            ],
            spacing: { after: spacingAfter / 2 },
          })),
          gap(),
        ]

      case 'languages':
        if (!data.languages.length) return []
        return [sectionHeading('Languages'), body(data.languages.join('  ·  ')), gap()]

      case 'interests':
        if (!data.interests.length) return []
        return [sectionHeading('Interests'), body(data.interests.join('  ·  ')), gap()]

      case 'awards':
        if (!data.awards.length) return []
        return [
          sectionHeading('Awards'),
          ...data.awards.map(a => new Paragraph({
            children: [
              buildHyperlinkRun(a.title, a.url, { size: 20 }),
              ...(a.date ? [new TextRun({ text: `  (${a.date})`, font, size: 20 })] : []),
            ],
            spacing: { after: spacingAfter / 2 },
          })),
          gap(),
        ]

      case 'publications':
        if (!data.publications.length) return []
        return [
          sectionHeading('Publications'),
          ...data.publications.flatMap(p => [
            new Paragraph({
              children: [buildHyperlinkRun(p.title, p.url, { bold: true })],
              spacing: { after: spacingAfter / 2 },
            }),
            ...(p.publisher ? [body(`${p.publisher}${p.date ? ` · ${p.date}` : ''}`, { italic: true, color: '666666', size: 18 })] : []),
          ]),
          gap(),
        ]

      case 'references':
        if (!data.references.length) return []
        return [sectionHeading('References'), ...data.references.map(r => body(r)), gap()]

      default:
        return []
    }
  }

  // ── Ordered sections (mirrors live preview order) ──────────────────────────

  const allSections = [
    ...(sectionOrder ?? ['summary', 'experience', 'education', 'skills', 'projects', 'certifications']),
    ...(sidebarSectionOrder ?? []),
  ].filter((v, i, a) => a.indexOf(v) === i && v !== 'contact')

  // ── Header ─────────────────────────────────────────────────────────────────

  type ContactKind = 'email' | 'phone' | 'location' | 'linkedin' | 'website'
  const contactItems: { value: string; kind: ContactKind }[] = (
    safeConfig.headerStyle === 'timeless'
      ? [
          { value: data.phone, kind: 'phone' as const },
          { value: data.email, kind: 'email' as const },
          { value: data.linkedin, kind: 'linkedin' as const },
          { value: data.website, kind: 'website' as const },
          { value: data.location, kind: 'location' as const },
        ]
      : [
          { value: data.email, kind: 'email' as const },
          { value: data.phone, kind: 'phone' as const },
          { value: data.location, kind: 'location' as const },
          { value: data.linkedin, kind: 'linkedin' as const },
          { value: data.website, kind: 'website' as const },
        ]
  ).filter(item => Boolean(item.value))

  function contactKindToHref(kind: ContactKind, value: string): string | null {
    if (kind === 'email') return normalizeHref(`mailto:${value.trim()}`)
    if (kind === 'phone') return normalizeHref(`tel:${value.trim().replace(/[^\d+]/g, '')}`)
    if (kind === 'linkedin' || kind === 'website') return normalizeHref(value)
    return null
  }

  const contactTextSize = safeConfig.headerStyle === 'timeless' ? 20 : 18
  const contactTextColor = safeConfig.headerStyle === 'timeless' ? '000000' : '666666'

  // Per-field link toggles (sanitised to an object record). Linkify only the
  // fields whose toggle is explicitly true; `location` always stays plain.
  const contactLinkToggles =
    typeof safeConfig.contactLinksClickable === 'object' && safeConfig.contactLinksClickable !== null
      ? safeConfig.contactLinksClickable
      : {}

  function contactRun(item: { value: string; kind: ContactKind }) {
    const fieldEnabled =
      item.kind === 'location'
        ? false
        : Boolean((contactLinkToggles as Record<string, boolean | undefined>)[item.kind])
    const href = fieldEnabled ? contactKindToHref(item.kind, item.value) : null
    if (href) {
      return buildHyperlinkRun(item.value, href, { size: contactTextSize, color: contactTextColor })
    }
    return new TextRun({ text: item.value, font, size: contactTextSize, color: contactTextColor })
  }

  const headerParas: Array<InstanceType<typeof Paragraph>> = [
    new Paragraph({
      children: [new TextRun({ text: data.name || 'Your Name', bold: true, font, size: nameSize, color: '111111' })],
      alignment: headerAlignment,
      spacing: { after: 60 },
    }),
    ...(data.currentRole && safeConfig.headerStyle !== 'timeless' ? [new Paragraph({
      children: [new TextRun({ text: data.currentRole, font, size: 22, color: accent })],
      alignment: headerAlignment,
      spacing: { after: 60 },
    })] : []),
    ...(contactItems.length
      ? safeConfig.contactStyle === 'stacked'
        ? contactItems.map((item, index) => new Paragraph({
            children: [contactRun(item)],
            alignment: headerAlignment,
            spacing: { after: index === contactItems.length - 1 ? 200 : 40 },
          }))
        : [new Paragraph({
            children: contactItems.flatMap((item, index) => {
              const separator = safeConfig.headerStyle === 'timeless' ? '  |  ' : '  ·  '
              const sep = index > 0
                ? [new TextRun({ text: separator, font, size: contactTextSize, color: contactTextColor })]
                : []
              return [...sep, contactRun(item)]
            }),
            alignment: headerAlignment,
            spacing: { after: 200 },
          })]
      : []),
  ]

  const bodyParas: BodyBlock[] = allSections.flatMap(id => renderSection(id))

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font, size: 20 },
        },
      },
    },
    sections: [{
      properties: {
        page: {
          margin: { top: 720, bottom: 720, left: 900, right: 900 },
        },
      },
      children: [...headerParas, ...bodyParas],
    }],
  })

  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

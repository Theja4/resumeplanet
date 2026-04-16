import { sanitizeUniversalConfig } from '@/lib/templateOptions'
import { getEducationDateLabel, getProjectBullets, getResumeSkills, normalizeSkillSections } from '@/lib/resume-data'
import type { ResumeData, UniversalConfig } from '@/types'

// Convert #RRGGBB hex to the 6-char hex string docx expects (no #)
function hexToDocx(hex: string): string {
  return (hex || '#4F46E5').replace('#', '').slice(0, 6).toUpperCase()
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
    Document, Packer, Paragraph, TextRun,
    BorderStyle,
  } = await import('docx')

  const safeConfig = sanitizeUniversalConfig(config)
  const accent = hexToDocx(safeConfig.accentColor ?? '#4F46E5')
  const font = primaryFont(safeConfig.fontFamily ?? 'Calibri')
  const isCompressed = safeConfig.density === 'compressed'
  const spacingAfter = isCompressed ? 80 : 160
  const bulletMarker = safeConfig.bulletStyle === 'dash' ? '- ' : safeConfig.bulletStyle === 'square' ? '▪ ' : '• '
  const headerAlignment = safeConfig.headerStyle === 'centered' ? AlignmentType.CENTER : AlignmentType.LEFT
  const nameSize = safeConfig.nameSize === 'hero' ? 56 : safeConfig.nameSize === 'large' ? 48 : 42
  const skillSeparator = safeConfig.skillsStyle === 'divider' ? '  •  ' : ', '

  // ── Style helpers ──────────────────────────────────────────────────────────

  const sectionHeading = (text: string) =>
    new Paragraph({
      children: [new TextRun({ text: text.toUpperCase(), bold: true, color: accent, font, size: 18 })],
      spacing: { before: isCompressed ? 160 : 240, after: 40 },
      ...(safeConfig.sectionHeadingStyle === 'rule'
        ? {
            border: {
              bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC', space: 2 },
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
        new TextRun({ text: bulletMarker, font, size: 20, color: accent }),
        new TextRun({ text, font, size: 20 }),
      ],
      indent: { left: 360 },
      spacing: { after: spacingAfter / 2 },
    })

  const gap = () => new Paragraph({ children: [new TextRun({ text: '' })], spacing: { after: spacingAfter } })

  // ── Section renderers ──────────────────────────────────────────────────────

  function renderSection(id: string): Array<InstanceType<typeof Paragraph>> {
    if (id.startsWith('custom_')) {
      const custom = data.customSections?.find(c => c.id === id)
      if (!custom) return []
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
          ...data.experience.flatMap(exp => [
            new Paragraph({
              children: [
                new TextRun({ text: exp.title, bold: true, font, size: 20 }),
                ...(exp.company ? [new TextRun({ text: `  ·  ${exp.company}`, font, size: 20, color: '555555' })] : []),
                ...(exp.startDate ? [new TextRun({ text: `  ${exp.startDate}${exp.endDate ? ` – ${exp.endDate}` : ''}`, font, size: 18, color: '888888' })] : []),
              ],
              spacing: { before: isCompressed ? 80 : 120, after: 40 },
            }),
            ...(exp.location ? [body(exp.location, { color: '888888', size: 18 })] : []),
            ...exp.bullets
              .filter((_, i) => exp.bulletVisibility ? exp.bulletVisibility[i] !== false : true)
              .map(b => bullet(b)),
            gap(),
          ]),
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
            body(`${edu.degree}${edu.field ? ` · ${edu.field}` : ''}${edu.gpa ? `  GPA: ${edu.gpa}` : ''}`, { color: '555555' }),
            gap(),
          ]),
        ]

      case 'skills':
        if (!getResumeSkills(data).length) return []
        return [
          sectionHeading('Skills'),
          ...(safeConfig.skillsStyle === 'stacked'
            ? normalizeSkillSections(data.skillSections, getResumeSkills(data)).flatMap(section => [
                ...(section.title ? [body(section.title, { bold: true, color: '666666', size: 18 })] : []),
                ...section.skills.map(skill => bullet(skill)),
              ])
            : normalizeSkillSections(data.skillSections, getResumeSkills(data)).map(section =>
                body(`${section.title ? `${section.title}: ` : ''}${section.skills.join(skillSeparator)}`)
              )),
          gap(),
        ]

      case 'projects':
        if (!data.projects.length) return []
        return [
          sectionHeading('Projects'),
          ...data.projects.flatMap(p => [
            body(p.name, { bold: true }),
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
          ...data.certifications.map(c =>
            body(`${c.name}${c.issuer ? ` · ${c.issuer}` : ''}${c.date ? `  (${c.date})` : ''}`)
          ),
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
          ...data.awards.map(a => body(`${a.title}${a.date ? `  (${a.date})` : ''}`)),
          gap(),
        ]

      case 'publications':
        if (!data.publications.length) return []
        return [
          sectionHeading('Publications'),
          ...data.publications.flatMap(p => [
            body(p.title, { bold: true }),
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

  const contact = [data.email, data.phone, data.location, data.linkedin, data.website]
    .filter(Boolean)

  const headerParas: Array<InstanceType<typeof Paragraph>> = [
    new Paragraph({
      children: [new TextRun({ text: data.name || 'Your Name', bold: true, font, size: nameSize, color: '111111' })],
      alignment: headerAlignment,
      spacing: { after: 60 },
    }),
    ...(data.currentRole ? [new Paragraph({
      children: [new TextRun({ text: data.currentRole, font, size: 22, color: accent })],
      alignment: headerAlignment,
      spacing: { after: 60 },
    })] : []),
    ...(contact.length
      ? safeConfig.contactStyle === 'stacked'
        ? contact.map((item, index) => new Paragraph({
            children: [new TextRun({ text: item ?? '', font, size: 18, color: '666666' })],
            alignment: headerAlignment,
            spacing: { after: index === contact.length - 1 ? 200 : 40 },
          }))
        : [new Paragraph({
            children: [new TextRun({ text: contact.join('  ·  '), font, size: 18, color: '666666' })],
            alignment: headerAlignment,
            spacing: { after: 200 },
          })]
      : []),
  ]

  const bodyParas: Array<InstanceType<typeof Paragraph>> = allSections.flatMap(id => renderSection(id))

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

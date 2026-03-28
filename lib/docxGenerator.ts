import type { ResumeData } from '@/types'

export async function generateDOCX(data: ResumeData, filename: string): Promise<void> {
  try {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx')

    const sections: InstanceType<typeof Paragraph>[] = []

    sections.push(new Paragraph({ text: data.name, heading: HeadingLevel.TITLE }))

    const contact = [data.email, data.phone, data.location, data.linkedin]
      .filter(Boolean)
      .join(' | ')
    if (contact) sections.push(new Paragraph({ text: contact }))

    if (data.summary) {
      sections.push(new Paragraph({ text: 'Summary', heading: HeadingLevel.HEADING_1 }))
      sections.push(new Paragraph({ text: data.summary }))
    }

    if (data.experience.length > 0) {
      sections.push(new Paragraph({ text: 'Experience', heading: HeadingLevel.HEADING_1 }))
      data.experience.forEach(exp => {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({ text: exp.title, bold: true }),
              new TextRun({ text: ` — ${exp.company}` }),
              new TextRun({
                text: `  ${exp.startDate}${exp.endDate ? ` – ${exp.endDate}` : ''}`,
                color: '666666',
              }),
            ],
          })
        )
        exp.bullets.forEach(b => {
          sections.push(new Paragraph({ text: `• ${b}` }))
        })
      })
    }

    if (data.education.length > 0) {
      sections.push(new Paragraph({ text: 'Education', heading: HeadingLevel.HEADING_1 }))
      data.education.forEach(edu => {
        sections.push(
          new Paragraph({
            text: `${edu.degree}${edu.field ? ` in ${edu.field}` : ''} — ${edu.institution} (${edu.graduationDate})`,
          })
        )
      })
    }

    if (data.skills.length > 0) {
      sections.push(new Paragraph({ text: 'Skills', heading: HeadingLevel.HEADING_1 }))
      sections.push(new Paragraph({ text: data.skills.join(', ') }))
    }

    if (data.certifications.length > 0) {
      sections.push(new Paragraph({ text: 'Certifications', heading: HeadingLevel.HEADING_1 }))
      data.certifications.forEach(c => {
        sections.push(new Paragraph({ text: `${c.name}${c.issuer ? ` · ${c.issuer}` : ''}${c.date ? ` (${c.date})` : ''}` }))
      })
    }

    if (data.projects.length > 0) {
      sections.push(new Paragraph({ text: 'Projects', heading: HeadingLevel.HEADING_1 }))
      data.projects.forEach(p => {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({ text: p.name, bold: true }),
              ...(p.description ? [new TextRun({ text: ` — ${p.description}` })] : []),
            ],
          })
        )
        if (p.technologies.length > 0) {
          sections.push(new Paragraph({ text: p.technologies.join(', '), indent: { left: 360 } }))
        }
      })
    }

    if (data.languages.length > 0) {
      sections.push(new Paragraph({ text: 'Languages', heading: HeadingLevel.HEADING_1 }))
      sections.push(new Paragraph({ text: data.languages.join(', ') }))
    }

    const doc = new Document({ sections: [{ children: sections }] })
    const blob = await Packer.toBlob(doc)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  } catch (err) {
    console.error('DOCX generation failed:', err)
    const plain = [
      data.name,
      [data.email, data.phone, data.location].filter(Boolean).join(' | '),
      '',
      data.summary,
      '',
      ...data.experience.flatMap(e => [
        `${e.title} — ${e.company} (${e.startDate}–${e.endDate})`,
        ...e.bullets.map(b => `  • ${b}`),
        '',
      ]),
    ].join('\n')
    await navigator.clipboard.writeText(plain).catch(() => {})
    alert('DOCX generation failed. Resume text copied to clipboard instead.')
  }
}

import { buildFirstPartyResumeMetadata } from '@/lib/firstPartyResumeMarker'
import { getEducationDateLabel, getProjectBullets, getResumeSkills, normalizeSkillSections } from '@/lib/resume-data'

const PT_TO_MM = 0.352778

function sanitizePdfText(value) {
  return String(value ?? '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2022/g, '-')
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function hexToRgb(hex) {
  const normalized = (hex || '#4F46E5').replace('#', '').trim()
  const six = normalized.length === 3
    ? normalized.split('').map(char => char + char).join('')
    : normalized

  if (!/^[0-9a-fA-F]{6}$/.test(six)) {
    return { r: 79, g: 70, b: 229 }
  }

  return {
    r: parseInt(six.slice(0, 2), 16),
    g: parseInt(six.slice(2, 4), 16),
    b: parseInt(six.slice(4, 6), 16),
  }
}

function getBaseFont(fontFamily) {
  const value = (fontFamily || '').toLowerCase()
  if (value.includes('times') || value.includes('georgia')) return 'times'
  if (value.includes('courier') || value.includes('mono')) return 'courier'
  return 'helvetica'
}

function uniqueOrdered(values) {
  return Array.from(new Set((values || []).filter(Boolean)))
}

function buildOrderedSectionIds(sectionOrder, sidebarSectionOrder) {
  const main = uniqueOrdered(sectionOrder).filter(id => id !== 'contact')
  const sidebar = uniqueOrdered(sidebarSectionOrder).filter(id => id !== 'contact' && !main.includes(id))
  return [...main, ...sidebar]
}

function getContactLine(data) {
  return [data.email, data.phone, data.location, data.linkedin, data.website].filter(Boolean).join('  |  ')
}

function getCustomSection(data, id) {
  return data.customSections?.find(section => section.id === id) ?? null
}

function hasSectionContent(data, id) {
  switch (id) {
    case 'summary':
      return Boolean(data.summary?.trim())
    case 'experience':
      return data.experience.length > 0
    case 'volunteer':
      return data.volunteer.length > 0
    case 'education':
      return data.education.length > 0
    case 'skills':
      return getResumeSkills(data).length > 0
    case 'projects':
      return data.projects.length > 0
    case 'certifications':
      return data.certifications.length > 0
    case 'languages':
      return data.languages.length > 0
    case 'interests':
      return data.interests.length > 0
    case 'awards':
      return data.awards.length > 0
    case 'publications':
      return data.publications.length > 0
    case 'references':
      return data.references.length > 0
    default: {
      const custom = getCustomSection(data, id)
      if (!custom) return false
      if (custom.type === 'text') return Boolean(custom.text?.trim())
      if (custom.type === 'tags') return (custom.tags?.length ?? 0) > 0
      return (custom.items?.length ?? 0) > 0
    }
  }
}

function createPdfWriter(doc, accent, fontName) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const marginX = 14
  const marginTop = 14
  const marginBottom = 14
  const contentWidth = pageWidth - marginX * 2
  const bottomLimit = pageHeight - marginBottom
  let y = marginTop

  function lineHeight(fontSize, multiplier = 1.25) {
    return fontSize * PT_TO_MM * multiplier
  }

  function ensureSpace(requiredHeight = 0) {
    if (y + requiredHeight <= bottomLimit) return
    doc.addPage()
    y = marginTop
  }

  function setTextStyle({ fontSize = 11, fontStyle = 'normal', color = [17, 24, 39] }) {
    doc.setFont(fontName, fontStyle)
    doc.setFontSize(fontSize)
    doc.setTextColor(color[0], color[1], color[2])
  }

  function writeWrappedText(text, options = {}) {
    const {
      x = marginX,
      maxWidth = contentWidth,
      fontSize = 11,
      fontStyle = 'normal',
      color = [55, 65, 81],
      before = 0,
      after = 1.8,
      lineMultiplier = 1.25,
    } = options

    if (!text) return

    const normalizedText = sanitizePdfText(text)
    if (!normalizedText) return

    y += before
    setTextStyle({ fontSize, fontStyle, color })

    const lines = doc.splitTextToSize(normalizedText, maxWidth)
    const step = lineHeight(fontSize, lineMultiplier)

    for (const line of lines) {
      ensureSpace(step)
      doc.text(line, x, y)
      y += step
    }

    y += after
  }

  function writeRightAlignedText(text, rightX, options = {}) {
    const {
      fontSize = 10,
      fontStyle = 'normal',
      color = [107, 114, 128],
    } = options

    if (!text) return

    const normalizedText = sanitizePdfText(text)
    if (!normalizedText) return

    setTextStyle({ fontSize, fontStyle, color })
    doc.text(normalizedText, rightX, y, { align: 'right' })
  }

  function drawDivider(after = 2.4) {
    ensureSpace(2.5)
    doc.setDrawColor(229, 231, 235)
    doc.setLineWidth(0.2)
    doc.line(marginX, y, pageWidth - marginX, y)
    y += after
  }

  function writeSectionHeading(title) {
    if (!title) return
    ensureSpace(10)
    setTextStyle({ fontSize: 10.5, fontStyle: 'bold', color: accent })
    doc.text(String(title).toUpperCase(), marginX, y)
    y += lineHeight(10.5, 1.15)
    drawDivider()
  }

  function writeBulletList(items, indent = 4.5) {
    for (const item of items || []) {
      const text = String(item || '').trim()
      if (!text) continue
      ensureSpace(lineHeight(10.5, 1.3))
      setTextStyle({ fontSize: 10.5, fontStyle: 'normal', color: [55, 65, 81] })
      doc.text('-', marginX, y)
      const wrapped = doc.splitTextToSize(text, contentWidth - indent)
      for (let index = 0; index < wrapped.length; index += 1) {
        ensureSpace(lineHeight(10.5, 1.3))
        doc.text(wrapped[index], marginX + indent, y)
        y += lineHeight(10.5, 1.3)
      }
      y += 0.6
    }
  }

  function writeHeader(data, config) {
    const banner = config?.headerStyle === 'banner'
    const contact = getContactLine(data)

    if (banner) {
      const bannerHeight = 30
      const accentFill = accent
      doc.setFillColor(accentFill[0], accentFill[1], accentFill[2])
      doc.rect(0, 0, pageWidth, bannerHeight, 'F')
      y = 11

      setTextStyle({ fontSize: 24, fontStyle: 'bold', color: [255, 255, 255] })
      doc.text((data.name || 'Your Name').toUpperCase(), marginX, y)
      y += lineHeight(24, 1.05)

      setTextStyle({ fontSize: 11, fontStyle: 'bold', color: [229, 231, 235] })
      doc.text((data.currentRole || 'Your Professional Title').toUpperCase(), marginX, y)

      if (contact) {
        setTextStyle({ fontSize: 8.5, fontStyle: 'normal', color: [243, 244, 246] })
        const contactLines = doc.splitTextToSize(contact, 55)
        let contactY = 11
        for (const line of contactLines) {
          doc.text(line, pageWidth - marginX, contactY, { align: 'right' })
          contactY += lineHeight(8.5, 1.15)
        }
      }

      y = bannerHeight + 10
      return
    }

    writeWrappedText(data.name || 'Your Name', {
      fontSize: 22,
      fontStyle: 'bold',
      color: [17, 24, 39],
      after: 1.2,
      lineMultiplier: 1.1,
    })

    if (data.currentRole) {
      writeWrappedText(data.currentRole, {
        fontSize: 11,
        fontStyle: 'bold',
        color: accent,
        after: 1.2,
      })
    }

    if (contact) {
      writeWrappedText(contact, {
        fontSize: 9.2,
        color: [107, 114, 128],
        after: 2.5,
      })
    } else {
      y += 2
    }
  }

  return {
    pageWidth,
    contentWidth,
    marginX,
    getY: () => y,
    setY: value => {
      y = value
    },
    ensureSpace,
    writeWrappedText,
    writeRightAlignedText,
    writeSectionHeading,
    writeBulletList,
    writeHeader,
  }
}

function renderExperienceSection(writer, title, items) {
  if (!items?.length) return

  writer.writeSectionHeading(title)
  renderExperienceItems(writer, items)
}

function renderExperienceItems(writer, items) {
  if (!items?.length) return

  for (const item of items) {
    const roleText = item.title || item.name || ''
    const companyLine = [item.company, item.location].filter(Boolean).join('  |  ')
    const dateLabel = [item.startDate || item.date, item.endDate].filter(Boolean).join(' - ')

    writer.ensureSpace(12)
    const startY = writer.getY()

    if (roleText) {
      writer.writeWrappedText(roleText, {
        fontSize: 11.5,
        fontStyle: 'bold',
        color: [17, 24, 39],
        after: 0.7,
      })
    }

    if (dateLabel) {
      writer.setY(startY)
      writer.writeRightAlignedText(dateLabel, writer.pageWidth - writer.marginX, {
        fontSize: 9,
        color: [107, 114, 128],
      })
      writer.setY(Math.max(writer.getY(), startY + 4.5))
    }

    if (companyLine) {
      writer.writeWrappedText(companyLine, {
        fontSize: 9.5,
        color: [107, 114, 128],
        after: 1.1,
      })
    }

    if (item.summary) {
      writer.writeWrappedText(item.summary, {
        fontSize: 10.2,
        color: [55, 65, 81],
        after: 1,
      })
    }

    writer.writeBulletList(item.bullets || item.highlights || [])
    writer.setY(writer.getY() + 1.6)
  }
}

function renderEducationSection(writer, items) {
  if (!items?.length) return

  writer.writeSectionHeading('Education')

  for (const item of items) {
    const degreeLine = [item.degree, item.field].filter(Boolean).join(' - ')

    writer.ensureSpace(10)
    const startY = writer.getY()
    writer.writeWrappedText(item.institution || '', {
      fontSize: 11.2,
      fontStyle: 'bold',
      color: [17, 24, 39],
      after: 0.7,
    })

    const educationDate = getEducationDateLabel(item)
    if (educationDate) {
      writer.setY(startY)
      writer.writeRightAlignedText(educationDate, writer.pageWidth - writer.marginX, {
        fontSize: 9,
        color: [107, 114, 128],
      })
      writer.setY(Math.max(writer.getY(), startY + 4.5))
    }

    if (degreeLine || item.gpa) {
      const detail = `${degreeLine}${item.gpa ? `${degreeLine ? '  |  ' : ''}GPA: ${item.gpa}` : ''}`
      writer.writeWrappedText(detail, {
        fontSize: 9.7,
        color: [55, 65, 81],
        after: 1.8,
      })
    }
  }
}

function renderProjectsSection(writer, items) {
  if (!items?.length) return

  writer.writeSectionHeading('Projects')

  for (const item of items) {
    writer.writeWrappedText(item.name || '', {
      fontSize: 11.2,
      fontStyle: 'bold',
      color: [17, 24, 39],
      after: 0.7,
    })

    if (item.description) {
      writer.writeWrappedText(item.description, {
        fontSize: 10.2,
        color: [55, 65, 81],
        after: 0.9,
      })
    }

    writer.writeBulletList(getProjectBullets(item), 4.5)

    if (item.technologies?.length) {
      writer.writeWrappedText(item.technologies.join(', '), {
        fontSize: 9.2,
        fontStyle: 'italic',
        color: [107, 114, 128],
        after: 1.8,
      })
    }
  }
}

function renderSimpleListSection(writer, title, items, formatter) {
  if (!items?.length) return
  writer.writeSectionHeading(title)
  for (const item of items) {
    const text = formatter(item)
    if (!text) continue
    writer.writeWrappedText(text, {
      fontSize: 10.2,
      color: [55, 65, 81],
      after: 0.9,
    })
  }
  writer.setY(writer.getY() + 1)
}

function renderSection(writer, data, id) {
  switch (id) {
    case 'summary':
      if (!data.summary) return
      writer.writeSectionHeading('Summary')
      writer.writeWrappedText(data.summary, {
        fontSize: 10.5,
        color: [55, 65, 81],
        after: 1.8,
      })
      return
    case 'experience':
      renderExperienceSection(writer, 'Work Experience', data.experience)
      return
    case 'volunteer':
      renderExperienceSection(writer, 'Volunteer', data.volunteer)
      return
    case 'education':
      renderEducationSection(writer, data.education)
      return
    case 'skills':
      renderSimpleListSection(
        writer,
        'Skills',
        normalizeSkillSections(data.skillSections, getResumeSkills(data)).map(section =>
          `${section.title ? `${section.title}${section.tag ? ` (${section.tag})` : ''}: ` : ''}${section.skills.join('  |  ')}`
        ),
        value => value
      )
      return
    case 'projects':
      renderProjectsSection(writer, data.projects)
      return
    case 'certifications':
      renderSimpleListSection(
        writer,
        'Certifications',
        data.certifications,
        item => [item.name, item.issuer, item.date].filter(Boolean).join('  |  '),
      )
      return
    case 'languages':
      renderSimpleListSection(writer, 'Languages', [data.languages.join('  |  ')], value => value)
      return
    case 'interests':
      renderSimpleListSection(writer, 'Interests', [data.interests.join('  |  ')], value => value)
      return
    case 'awards':
      renderSimpleListSection(
        writer,
        'Awards',
        data.awards,
        item => [item.title, item.issuer, item.date].filter(Boolean).join('  |  '),
      )
      return
    case 'publications':
      renderSimpleListSection(
        writer,
        'Publications',
        data.publications,
        item => [item.title, item.publisher, item.date].filter(Boolean).join('  |  '),
      )
      return
    case 'references':
      renderSimpleListSection(writer, 'References', data.references, value => value)
      return
    default: {
      const custom = getCustomSection(data, id)
      if (!custom) return

      writer.writeSectionHeading(custom.title)

      if (custom.type === 'text' && custom.text) {
        writer.writeWrappedText(custom.text, {
          fontSize: 10.4,
          color: [55, 65, 81],
          after: 1.8,
        })
        return
      }

      if (custom.type === 'tags' && custom.tags?.length) {
        writer.writeWrappedText(custom.tags.join('  |  '), {
          fontSize: 10.2,
          color: [55, 65, 81],
          after: 1.8,
        })
        return
      }

      if (custom.type === 'complex' && custom.items?.length) {
        renderExperienceItems(writer, custom.items)
      }
    }
  }
}

export async function generateResumePdfBlob({ data, config, sectionOrder, sidebarSectionOrder }) {
  const { jsPDF } = await import('jspdf')
  const accent = hexToRgb(config?.accentColor || '#4F46E5')
  const fontName = getBaseFont(config?.fontFamily)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  })

  const hiddenMetadata = buildFirstPartyResumeMetadata({
    data,
    config,
    sectionOrder,
    sidebarSectionOrder,
  })

  doc.setDocumentProperties({
    title: `${data.name || 'Resume'} Resume`,
    author: data.name || '',
    subject: hiddenMetadata.subject || '',
    keywords: hiddenMetadata.keywords || '',
    creator: hiddenMetadata.creator || '',
  })

  doc.setCreationDate(new Date())

  const writer = createPdfWriter(doc, [accent.r, accent.g, accent.b], fontName)
  writer.writeHeader(data, config || {})

  const orderedSections = buildOrderedSectionIds(sectionOrder, sidebarSectionOrder)
    .filter(id => hasSectionContent(data, id))

  for (const id of orderedSections) {
    renderSection(writer, data, id)
  }

  return doc.output('blob')
}

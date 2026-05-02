import { buildFirstPartyResumeMetadata } from '@/lib/firstPartyResumeMarker'
import { getEducationDateLabel, getProjectBullets, getResumeSkills, normalizeSkillSections } from '@/lib/resume-data'
import { sanitizeUniversalConfig } from '@/lib/templateOptions'

const PT_TO_MM = 0.352778

function sanitizePdfText(value) {
  return String(value ?? '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function hexToRgb(hex) {
  const normalized = (hex || '#026d32').replace('#', '').trim()
  const six = normalized.length === 3
    ? normalized.split('').map(char => char + char).join('')
    : normalized

  if (!/^[0-9a-fA-F]{6}$/.test(six)) {
    return { r: 2, g: 109, b: 50 }
  }

  return {
    r: parseInt(six.slice(0, 2), 16),
    g: parseInt(six.slice(2, 4), 16),
    b: parseInt(six.slice(4, 6), 16),
  }
}

function getBaseFont(fontFamily) {
  const value = (fontFamily || '').toLowerCase()
  if (value.includes('times') || value.includes('georgia') || value.includes('computer modern') || value.includes('latin modern') || value.includes('cmu')) return 'times'
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

function getContactLine(data, timeless = false) {
  return getContactItems(data, timeless).join('  |  ')
}

function getContactItems(data, timeless = false) {
  const values = timeless
    ? [data.phone, data.email, data.linkedin, data.website, data.location]
    : [data.email, data.phone, data.location, data.linkedin, data.website]

  return values.filter(Boolean)
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

function createLayoutTokens(config) {
  const compressed = config?.density === 'compressed'
  const latex = config?.headerStyle === 'timeless' || config?.bulletStyle === 'latex' || config?.sectionHeadingStyle === 'latex-rule'

  if (latex) {
    return {
      bodyFontSize: 10,
      metaFontSize: 10,
      headingFontSize: 12,
      itemTitleFontSize: 11,
      sectionGap: 0.7,
      itemGap: 0.2,
      paragraphGap: 0.6,
      bulletGap: 0,
      headingAfter: 3.9,
      titleAfter: 0.1,
      companyAfter: 0.7,
      detailAfter: 0.8,
      dateColumnWidth: 45,
      blockMinHeight: 12,
    }
  }

  return {
    bodyFontSize: compressed ? 9.8 : 10.2,
    metaFontSize: compressed ? 9 : 9.4,
    headingFontSize: config?.sectionHeadingStyle === 'minimal' ? 10.8 : 10.5,
    itemTitleFontSize: compressed ? 11 : 11.4,
    sectionGap: compressed ? 1.2 : 1.8,
    itemGap: compressed ? 1.1 : 1.6,
    paragraphGap: compressed ? 0.8 : 1,
    bulletGap: compressed ? 0.3 : 0.6,
    headingAfter: config?.sectionHeadingStyle === 'minimal' ? (compressed ? 0.9 : 1.2) : (compressed ? 3.1 : 3.7),
    titleAfter: compressed ? 0.5 : 0.7,
    companyAfter: compressed ? 0.8 : 1.1,
    detailAfter: compressed ? 1.2 : 1.8,
    dateColumnWidth: compressed ? 28 : 30,
    blockMinHeight: compressed ? 14 : 16,
  }
}

function createPdfWriter(doc, accent, fontName, config) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const marginX = 14
  const marginTop = 14
  const marginBottom = 14
  const contentWidth = pageWidth - marginX * 2
  const bottomLimit = pageHeight - marginBottom
  const tokens = createLayoutTokens(config)
  const isLatexStyle = config?.headerStyle === 'timeless' || config?.bulletStyle === 'latex' || config?.sectionHeadingStyle === 'latex-rule'
  let y = marginTop

  function lineHeight(fontSize, multiplier = 1.25) {
    return fontSize * PT_TO_MM * multiplier
  }

  function ensureSpace(requiredHeight = 0) {
    if (y + requiredHeight <= bottomLimit) return
    doc.addPage()
    y = marginTop
  }

  function estimateWrappedHeight(text, options = {}) {
    const {
      maxWidth = contentWidth,
      fontSize = tokens.bodyFontSize,
      lineMultiplier = 1.25,
      before = 0,
      after = 0,
    } = options

    const normalizedText = sanitizePdfText(text)
    if (!normalizedText) return 0

    setTextStyle({ fontSize, fontStyle: options.fontStyle ?? 'normal', color: options.color ?? [55, 65, 81] })
    const lines = doc.splitTextToSize(normalizedText, maxWidth)
    return before + (lines.length * lineHeight(fontSize, lineMultiplier)) + after
  }

  function estimateBulletListHeight(items, indent = 4.5, fontSize = tokens.bodyFontSize) {
    let total = 0
    for (const item of items || []) {
      const normalizedText = sanitizePdfText(item)
      if (!normalizedText) continue
      setTextStyle({ fontSize, fontStyle: 'normal', color: [55, 65, 81] })
      const lines = doc.splitTextToSize(normalizedText, contentWidth - indent)
      total += lines.length * lineHeight(fontSize, 1.3) + tokens.bulletGap
    }
    return total
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
      fontSize = tokens.bodyFontSize,
      fontStyle = 'normal',
      color = [55, 65, 81],
      before = 0,
      after = tokens.sectionGap,
      lineMultiplier = 1.25,
      align = 'left',
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
      doc.text(line, x, y, { align })
      y += step
    }

    y += after
  }

  function writeRightAlignedText(text, rightX, options = {}) {
    const {
      fontSize = tokens.metaFontSize,
      fontStyle = 'normal',
      color = [107, 114, 128],
    } = options

    if (!text) return

    const normalizedText = sanitizePdfText(text)
    if (!normalizedText) return

    setTextStyle({ fontSize, fontStyle, color })
    doc.text(normalizedText, rightX, y, { align: 'right' })
  }

  function drawDivider(after = tokens.headingAfter, startX = marginX, endX = pageWidth - marginX) {
    ensureSpace(2.5)
    doc.setDrawColor(isLatexStyle ? 0 : 229, isLatexStyle ? 0 : 231, isLatexStyle ? 0 : 235)
    doc.setLineWidth(0.2)
    doc.line(startX, y, endX, y)
    y += after
  }

  function writeSectionHeading(title, styleVariant = 'rule') {
    if (!title) return
    ensureSpace(tokens.blockMinHeight)

    if (styleVariant === 'latex-rule') {
      setTextStyle({ fontSize: tokens.headingFontSize, fontStyle: 'normal', color: [0, 0, 0] })
      doc.text(String(title), marginX, y)
      y += lineHeight(tokens.headingFontSize, 1.08)
      drawDivider(tokens.headingAfter)
      return
    }

    if (styleVariant === 'minimal') {
      setTextStyle({ fontSize: tokens.headingFontSize, fontStyle: 'bold', color: [17, 24, 39] })
      doc.text(String(title), marginX, y)
      y += lineHeight(tokens.headingFontSize, 1.15) + tokens.headingAfter
      return
    }

    setTextStyle({ fontSize: tokens.headingFontSize, fontStyle: 'bold', color: accent })
    doc.text(String(title).toUpperCase(), marginX, y)
    const titleWidth = doc.getTextWidth(String(title).toUpperCase())
    y += lineHeight(tokens.headingFontSize, 1.15)

    if (styleVariant === 'label') {
      const lineStart = Math.min(marginX + titleWidth + 6, pageWidth - marginX - 8)
      drawDivider(tokens.headingAfter, lineStart, pageWidth - marginX)
      return
    }

    drawDivider()
  }

  function writeBulletList(items, indent = 4.5, fontSize = tokens.bodyFontSize) {
    const bulletMarker = isLatexStyle
      ? '•'
      : config?.bulletStyle === 'dash'
        ? '-'
        : config?.bulletStyle === 'square'
          ? '▪'
          : '•'

    for (const item of items || []) {
      const text = String(item || '').trim()
      if (!text) continue
      ensureSpace(lineHeight(fontSize, 1.3))
      const markerX = isLatexStyle ? marginX + 8 : marginX
      const textX = markerX + indent
      setTextStyle({ fontSize, fontStyle: 'normal', color: isLatexStyle ? [0, 0, 0] : accent })
      doc.text(bulletMarker, markerX, y)
      setTextStyle({ fontSize, fontStyle: 'normal', color: isLatexStyle ? [0, 0, 0] : [55, 65, 81] })
      const wrapped = doc.splitTextToSize(text, pageWidth - marginX - textX)
      for (let index = 0; index < wrapped.length; index += 1) {
        ensureSpace(lineHeight(fontSize, 1.3))
        doc.text(wrapped[index], textX, y)
        y += lineHeight(fontSize, 1.3)
      }
      y += tokens.bulletGap
    }
  }

  function writeHeader(data, config) {
    const banner = config?.headerStyle === 'banner'
    const timeless = config?.headerStyle === 'timeless'
    const centered = timeless || config?.headerStyle === 'centered'
    const classic = config?.headerStyle === 'classic'
    const compact = config?.headerStyle === 'compact'
    const stackedContact = config?.contactStyle === 'stacked'
    const contactItems = getContactItems(data, timeless)
    const contact = contactItems.join('  |  ')
    const centerX = pageWidth / 2
    const nameSize = config?.nameSize === 'hero'
      ? (timeless ? 29 : 26)
      : config?.nameSize === 'large'
        ? (timeless ? 27 : 24)
        : (timeless ? 25 : 22)

    if (banner) {
      const bannerHeight = 30
      const accentFill = accent
      doc.setFillColor(accentFill[0], accentFill[1], accentFill[2])
      doc.rect(0, 0, pageWidth, bannerHeight, 'F')
      y = 11

      setTextStyle({ fontSize: 24, fontStyle: 'bold', color: [255, 255, 255] })
      doc.text(data.name || 'Your Name', marginX, y)
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

    if (timeless) {
      setTextStyle({ fontSize: nameSize, fontStyle: 'bold', color: [0, 0, 0] })
      doc.text(data.name || 'Your Name', centerX, y, { align: 'center' })
      y += lineHeight(nameSize, 1.02)

      if (contact) {
        setTextStyle({ fontSize: 10, fontStyle: 'normal', color: [0, 0, 0] })
        const contactLines = doc.splitTextToSize(contact, contentWidth)
        for (const line of contactLines) {
          doc.text(line, centerX, y, { align: 'center' })
          y += lineHeight(10, 1.25)
        }
      }

      y += 2
      return
    }

    writeWrappedText(data.name || 'Your Name', {
      x: centered ? centerX : marginX,
      maxWidth: contentWidth,
      align: centered ? 'center' : 'left',
      fontSize: nameSize,
      fontStyle: 'bold',
      color: [17, 24, 39],
      after: 1.2,
      lineMultiplier: 1.1,
    })

    if (data.currentRole) {
      writeWrappedText(data.currentRole, {
        x: centered ? centerX : marginX,
        maxWidth: contentWidth,
        align: centered ? 'center' : 'left',
        fontSize: config?.nameSize === 'hero' ? 12 : 11,
        fontStyle: 'bold',
        color: accent,
        after: compact ? 0.6 : tokens.paragraphGap,
      })
    }

    if (classic) {
      drawDivider(stackedContact ? 3.4 : 3.2)
    }

    if (contact) {
      if (stackedContact) {
        for (const item of contactItems) {
          writeWrappedText(item, {
            x: centered ? centerX : marginX,
            maxWidth: contentWidth,
            align: centered ? 'center' : 'left',
            fontSize: tokens.metaFontSize,
            color: [107, 114, 128],
            after: 0.4,
          })
        }
        y += compact ? 1.2 : 2
      } else {
        writeWrappedText(contact, {
          x: centered ? centerX : marginX,
          maxWidth: contentWidth,
          align: centered ? 'center' : 'left',
          fontSize: tokens.metaFontSize,
          color: [107, 114, 128],
          after: compact ? 1.8 : 2.5,
        })
      }
    } else {
      y += 2
    }
  }

  return {
    pageWidth,
    contentWidth,
    marginX,
    tokens,
    isLatexStyle,
    sectionHeadingStyle: config?.sectionHeadingStyle ?? 'rule',
    skillsStyle: config?.skillsStyle ?? 'inline',
    bulletStyle: config?.bulletStyle ?? 'plain',
    dateLayout: config?.dateLayout ?? 'right',
    getY: () => y,
    setY: value => {
      y = value
    },
    ensureSpace,
    estimateWrappedHeight,
    estimateBulletListHeight,
    writeWrappedText,
    writeRightAlignedText,
    writeSectionHeading,
    writeBulletList,
    writeHeader,
  }
}

function renderExperienceSection(writer, title, items) {
  if (!items?.length) return

  writer.writeSectionHeading(title, writer.sectionHeadingStyle)
  renderExperienceItems(writer, items)
}

function renderExperienceItems(writer, items) {
  if (!items?.length) return

  for (const item of items) {
    const roleText = item.title || item.name || ''
    const companyLine = writer.isLatexStyle ? item.company : [item.company, item.location].filter(Boolean).join('  |  ')
    const locationLine = writer.isLatexStyle ? item.location : ''
    const dateLabel = [item.startDate || item.date, item.endDate].filter(Boolean).join(' - ')
    const showRightDate = writer.dateLayout === 'right' && Boolean(dateLabel)
    const dateColumnWidth = showRightDate ? writer.tokens.dateColumnWidth : 0
    const itemX = writer.isLatexStyle ? writer.marginX + 4 : writer.marginX
    const leftMaxWidth = dateLabel ? writer.pageWidth - writer.marginX - itemX - dateColumnWidth - 4 : writer.pageWidth - writer.marginX - itemX
    const bullets = item.bullets || item.highlights || []
    const keepTogetherHeight =
      writer.estimateWrappedHeight(roleText, {
        fontSize: writer.tokens.itemTitleFontSize,
        fontStyle: 'bold',
        maxWidth: leftMaxWidth,
        after: writer.tokens.titleAfter,
        lineMultiplier: 1.12,
      }) +
      (companyLine ? writer.estimateWrappedHeight(companyLine, {
        fontSize: writer.tokens.metaFontSize,
        maxWidth: leftMaxWidth,
        after: writer.tokens.companyAfter,
      }) : 0) +
      (writer.dateLayout === 'inline' && dateLabel
        ? writer.estimateWrappedHeight(dateLabel, {
            fontSize: writer.tokens.metaFontSize,
            after: writer.tokens.companyAfter,
          })
        : 0) +
      Math.min(
        writer.estimateBulletListHeight(bullets.slice(0, 2), 4.5, writer.tokens.bodyFontSize),
        writer.tokens.blockMinHeight,
      )

    writer.ensureSpace(Math.max(writer.tokens.blockMinHeight, keepTogetherHeight))
    const startY = writer.getY()

    if (roleText) {
      writer.writeWrappedText(roleText, {
        fontSize: writer.tokens.itemTitleFontSize,
        fontStyle: 'bold',
        color: writer.isLatexStyle ? [0, 0, 0] : [17, 24, 39],
        x: itemX,
        maxWidth: leftMaxWidth,
        after: writer.tokens.titleAfter,
        lineMultiplier: 1.12,
      })
    }
    const afterRoleY = writer.getY()

    if (showRightDate) {
      writer.setY(startY)
      writer.writeRightAlignedText(dateLabel, writer.pageWidth - writer.marginX, {
        fontSize: writer.tokens.metaFontSize,
        color: writer.isLatexStyle ? [0, 0, 0] : [107, 114, 128],
      })
      writer.setY(Math.max(afterRoleY, startY + 4.8))
    }

    if (companyLine || locationLine) {
      const companyStartY = writer.getY()
      writer.writeWrappedText(companyLine, {
        fontSize: writer.tokens.metaFontSize,
        fontStyle: writer.isLatexStyle ? 'italic' : 'normal',
        color: writer.isLatexStyle ? [0, 0, 0] : [107, 114, 128],
        x: itemX,
        maxWidth: leftMaxWidth,
        after: writer.tokens.companyAfter,
      })
      const afterCompanyY = writer.getY()
      if (locationLine) {
        writer.setY(companyStartY)
        writer.writeRightAlignedText(locationLine, writer.pageWidth - writer.marginX, {
          fontSize: writer.tokens.metaFontSize,
          fontStyle: 'italic',
          color: [0, 0, 0],
        })
        writer.setY(Math.max(afterCompanyY, companyStartY + 4.8))
      }
    }

    if (!showRightDate && dateLabel) {
      writer.writeWrappedText(dateLabel, {
        fontSize: writer.tokens.metaFontSize,
        color: [107, 114, 128],
        after: writer.tokens.companyAfter,
      })
    }

    if (item.summary) {
      writer.writeWrappedText(item.summary, {
        fontSize: writer.tokens.bodyFontSize,
        color: writer.isLatexStyle ? [0, 0, 0] : [55, 65, 81],
        x: itemX,
        maxWidth: writer.pageWidth - writer.marginX - itemX,
        after: writer.tokens.paragraphGap,
      })
    }

    writer.writeBulletList(bullets, 4.5, writer.tokens.bodyFontSize)
    writer.setY(writer.getY() + writer.tokens.itemGap)
  }
}

function renderEducationSection(writer, items) {
  if (!items?.length) return

  writer.writeSectionHeading('Education', writer.sectionHeadingStyle)

  for (const item of items) {
    const degreeLine = [item.degree, item.field].filter(Boolean).join(' - ')
    const educationDate = getEducationDateLabel(item)

    if (writer.isLatexStyle) {
      const itemX = writer.marginX + 4
      const leftMaxWidth = writer.pageWidth - writer.marginX - itemX - (educationDate ? writer.tokens.dateColumnWidth : 0) - 4

      writer.ensureSpace(writer.tokens.blockMinHeight - 2)
      writer.writeWrappedText(item.institution || '', {
        fontSize: writer.tokens.itemTitleFontSize,
        fontStyle: 'bold',
        color: [0, 0, 0],
        x: itemX,
        maxWidth: writer.pageWidth - writer.marginX - itemX,
        after: writer.tokens.titleAfter,
      })
      const afterInstitutionY = writer.getY()

      const detail = `${degreeLine}${item.gpa ? `${degreeLine ? ', ' : ''}GPA: ${item.gpa}` : ''}`
      const detailStartY = writer.getY()

      if (detail) {
        writer.writeWrappedText(detail, {
          fontSize: writer.tokens.metaFontSize,
          fontStyle: 'italic',
          color: [0, 0, 0],
          x: itemX,
          maxWidth: leftMaxWidth,
          after: writer.tokens.companyAfter,
        })
      }
      const afterDetailY = writer.getY()

      if (educationDate) {
        writer.setY(detailStartY)
        writer.writeRightAlignedText(educationDate, writer.pageWidth - writer.marginX, {
          fontSize: writer.tokens.metaFontSize,
          fontStyle: 'italic',
          color: [0, 0, 0],
        })
        writer.setY(Math.max(afterDetailY, afterInstitutionY, detailStartY + 4.8))
      }

      writer.setY(writer.getY() + writer.tokens.itemGap)
      continue
    }

    const showRightDate = writer.dateLayout === 'right' && Boolean(educationDate)
    const dateColumnWidth = showRightDate ? writer.tokens.dateColumnWidth : 0
    const leftMaxWidth = educationDate ? writer.contentWidth - dateColumnWidth - 4 : writer.contentWidth
    const keepTogetherHeight =
      writer.estimateWrappedHeight(item.institution || '', {
        fontSize: writer.tokens.itemTitleFontSize - 0.2,
        fontStyle: 'bold',
        maxWidth: leftMaxWidth,
        after: writer.tokens.titleAfter,
      }) +
      ((degreeLine || item.gpa) ? writer.estimateWrappedHeight(
        `${degreeLine}${item.gpa ? `${degreeLine ? '  |  ' : ''}GPA: ${item.gpa}` : ''}`,
        {
          fontSize: writer.tokens.bodyFontSize - 0.4,
          maxWidth: leftMaxWidth,
          after: writer.tokens.detailAfter,
        }
      ) : 0) +
      (!showRightDate && educationDate
        ? writer.estimateWrappedHeight(educationDate, {
            fontSize: writer.tokens.metaFontSize,
            after: writer.tokens.companyAfter,
          })
        : 0)

    writer.ensureSpace(Math.max(writer.tokens.blockMinHeight - 2, keepTogetherHeight))
    const startY = writer.getY()
    writer.writeWrappedText(item.institution || '', {
      fontSize: writer.tokens.itemTitleFontSize - 0.2,
      fontStyle: 'bold',
      color: [17, 24, 39],
      maxWidth: leftMaxWidth,
      after: writer.tokens.titleAfter,
    })
    const afterInstitutionY = writer.getY()

    if (showRightDate) {
      writer.setY(startY)
      writer.writeRightAlignedText(educationDate, writer.pageWidth - writer.marginX, {
        fontSize: writer.tokens.metaFontSize,
        color: [107, 114, 128],
      })
      writer.setY(Math.max(afterInstitutionY, startY + 4.8))
    }

    if (!showRightDate && educationDate) {
      writer.writeWrappedText(educationDate, {
        fontSize: writer.tokens.metaFontSize,
        color: [107, 114, 128],
        after: writer.tokens.companyAfter,
      })
    }

    if (degreeLine || item.gpa) {
      const detail = `${degreeLine}${item.gpa ? `${degreeLine ? '  |  ' : ''}GPA: ${item.gpa}` : ''}`
      writer.writeWrappedText(detail, {
        fontSize: writer.tokens.bodyFontSize - 0.4,
        color: [55, 65, 81],
        maxWidth: leftMaxWidth,
        after: writer.tokens.detailAfter,
      })
    }
  }
}

function renderProjectsSection(writer, items) {
  if (!items?.length) return

  writer.writeSectionHeading('Projects', writer.sectionHeadingStyle)

  for (const item of items) {
    const bullets = getProjectBullets(item)

    if (writer.isLatexStyle) {
      const itemX = writer.marginX + 4
      const technologies = item.technologies?.length ? ` | ${item.technologies.join(', ')}` : ''

      writer.ensureSpace(writer.tokens.blockMinHeight)
      writer.writeWrappedText(`${item.name || ''}${technologies}`, {
        fontSize: writer.tokens.metaFontSize,
        fontStyle: 'normal',
        color: [0, 0, 0],
        x: itemX,
        maxWidth: writer.pageWidth - writer.marginX - itemX,
        after: writer.tokens.titleAfter,
        lineMultiplier: 1.12,
      })

      if (item.description) {
        writer.writeWrappedText(item.description, {
          fontSize: writer.tokens.bodyFontSize,
          color: [0, 0, 0],
          x: itemX,
          maxWidth: writer.pageWidth - writer.marginX - itemX,
          after: writer.tokens.paragraphGap,
        })
      }

      writer.writeBulletList(bullets, 4.5, writer.tokens.bodyFontSize)
      writer.setY(writer.getY() + writer.tokens.itemGap)
      continue
    }

    const keepTogetherHeight =
      writer.estimateWrappedHeight(item.name || '', {
        fontSize: writer.tokens.itemTitleFontSize - 0.2,
        fontStyle: 'bold',
        after: writer.tokens.titleAfter,
        lineMultiplier: 1.12,
      }) +
      (item.description ? writer.estimateWrappedHeight(item.description, {
        fontSize: writer.tokens.bodyFontSize,
        after: writer.tokens.paragraphGap,
      }) : 0) +
      Math.min(
        writer.estimateBulletListHeight(bullets.slice(0, 2), 4.5, writer.tokens.bodyFontSize),
        writer.tokens.blockMinHeight,
      )

    writer.ensureSpace(Math.max(writer.tokens.blockMinHeight, keepTogetherHeight))
    writer.writeWrappedText(item.name || '', {
      fontSize: writer.tokens.itemTitleFontSize - 0.2,
      fontStyle: 'bold',
      color: [17, 24, 39],
      after: writer.tokens.titleAfter,
      lineMultiplier: 1.12,
    })

    if (item.description) {
      writer.writeWrappedText(item.description, {
        fontSize: writer.tokens.bodyFontSize,
        color: [55, 65, 81],
        after: writer.tokens.paragraphGap,
      })
    }

    writer.writeBulletList(bullets, 4.5, writer.tokens.bodyFontSize)

    if (item.technologies?.length) {
      writer.writeWrappedText(item.technologies.join(', '), {
        fontSize: writer.tokens.metaFontSize,
        fontStyle: 'italic',
        color: [107, 114, 128],
        after: writer.tokens.detailAfter,
      })
    } else {
      writer.setY(writer.getY() + writer.tokens.itemGap)
    }
  }
}

function renderSimpleListSection(writer, title, items, formatter) {
  if (!items?.length) return
  writer.writeSectionHeading(title, writer.sectionHeadingStyle)
  for (const item of items) {
    const text = formatter(item)
    if (!text) continue
    writer.writeWrappedText(text, {
      fontSize: writer.tokens.bodyFontSize,
      color: [55, 65, 81],
      after: writer.tokens.paragraphGap,
    })
  }
  writer.setY(writer.getY() + writer.tokens.itemGap)
}

function renderSection(writer, data, id) {
  switch (id) {
    case 'summary':
      if (!data.summary) return
      writer.writeSectionHeading('Summary', writer.sectionHeadingStyle)
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
      renderSkillsSection(writer, data)
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

      writer.writeSectionHeading(custom.title, writer.sectionHeadingStyle)

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

function renderSkillsSection(writer, data) {
  const sections = normalizeSkillSections(data.skillSections, getResumeSkills(data))
  if (!sections.length) return

  writer.writeSectionHeading('Skills', writer.sectionHeadingStyle)

  const separator = writer.skillsStyle === 'divider' ? '  •  ' : ', '

  for (const section of sections) {
    const label = section.title ? `${section.title}${section.tag ? ` (${section.tag})` : ''}` : ''
    const skills = section.skills ?? []
    if (!skills.length && !label) continue

    if (writer.skillsStyle === 'stacked') {
      if (label) {
        writer.writeWrappedText(label, {
          fontSize: writer.tokens.metaFontSize,
          fontStyle: 'bold',
          color: [75, 85, 99],
          after: 0.5,
        })
      }
      for (const skill of skills) {
        writer.writeWrappedText(skill, {
          fontSize: writer.tokens.bodyFontSize,
          color: [55, 65, 81],
          x: writer.marginX + 4.5,
          maxWidth: writer.contentWidth - 4.5,
          after: 0.35,
        })
      }
      writer.setY(writer.getY() + writer.tokens.paragraphGap)
      continue
    }

    const line = label ? `${label}: ${skills.join(separator)}` : skills.join(separator)
    writer.writeWrappedText(line, {
      fontSize: writer.tokens.bodyFontSize,
      color: writer.isLatexStyle ? [0, 0, 0] : [55, 65, 81],
      x: writer.isLatexStyle ? writer.marginX + 4 : writer.marginX,
      maxWidth: writer.isLatexStyle ? writer.contentWidth - 4 : writer.contentWidth,
      after: writer.tokens.paragraphGap,
    })
  }

  writer.setY(writer.getY() + writer.tokens.itemGap)
}

export async function generateResumePdfBlob({ data, config, sectionOrder, sidebarSectionOrder }) {
  const { jsPDF } = await import('jspdf')
  const safeConfig = sanitizeUniversalConfig(config || {})
  const accent = hexToRgb(safeConfig.accentColor || '#026d32')
  const fontName = getBaseFont(safeConfig.fontFamily)
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

  const writer = createPdfWriter(doc, [accent.r, accent.g, accent.b], fontName, safeConfig)
  writer.sectionHeadingStyle = safeConfig.sectionHeadingStyle
  writer.writeHeader(data, safeConfig)

  const orderedSections = buildOrderedSectionIds(sectionOrder, sidebarSectionOrder)
    .filter(id => hasSectionContent(data, id))

  for (const id of orderedSections) {
    renderSection(writer, data, id)
  }

  return doc.output('blob')
}

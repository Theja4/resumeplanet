import React from 'react'
import { Document, Link, Page, StyleSheet, Text, View, pdf } from 'open-resume/node_modules/@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    color: '#111827',
    fontFamily: 'Helvetica',
    fontSize: 10,
    lineHeight: 1.45,
  },
  banner: {
    minHeight: 110,
    paddingTop: 26,
    paddingBottom: 26,
    paddingHorizontal: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  bannerLeft: {
    width: '62%',
  },
  bannerName: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  bannerRole: {
    color: '#d1d5db',
    fontSize: 12,
    fontWeight: 700,
    marginTop: 6,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  bannerContact: {
    width: '34%',
    alignItems: 'flex-end',
    gap: 4,
  },
  bannerContactText: {
    color: '#f3f4f6',
    fontSize: 9,
    textAlign: 'right',
  },
  content: {
    flexDirection: 'row',
    flexGrow: 1,
  },
  main: {
    flexGrow: 1,
    paddingTop: 22,
    paddingBottom: 26,
    paddingHorizontal: 28,
  },
  mainSidebar: {
    paddingTop: 24,
    paddingBottom: 26,
    paddingHorizontal: 28,
  },
  sidebar: {
    paddingTop: 24,
    paddingBottom: 26,
    paddingHorizontal: 20,
  },
  minimalistHeader: {
    marginBottom: 18,
  },
  name: {
    fontSize: 24,
    fontWeight: 700,
    textTransform: 'uppercase',
  },
  role: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  contactsRow: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  contactText: {
    fontSize: 9,
    color: '#6b7280',
  },
  section: {
    marginTop: 14,
  },
  sectionHeading: {
    fontSize: 9,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginBottom: 8,
  },
  bodyText: {
    fontSize: 9.5,
    color: '#374151',
  },
  experienceBlock: {
    marginBottom: 10,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  itemTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: '#111827',
  },
  itemSubtitle: {
    marginTop: 2,
    fontSize: 9,
    color: '#6b7280',
  },
  itemDate: {
    fontSize: 8.5,
    color: '#9ca3af',
    textAlign: 'right',
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  bullet: {
    width: 8,
    fontSize: 10,
  },
  bulletText: {
    flex: 1,
    fontSize: 9.2,
    color: '#374151',
  },
  sidebarText: {
    fontSize: 9,
    color: '#374151',
  },
  sidebarListItem: {
    marginTop: 3,
  },
})

function hexToRgb(hex) {
  const normalized = (hex || '#4F46E5').replace('#', '').trim()
  const six = normalized.length === 3
    ? normalized.split('').map((char) => char + char).join('')
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

function rgba(hex, alpha) {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function buildContactLines(data) {
  return [data.email, data.phone, data.linkedin, data.location, data.website].filter(Boolean)
}

function SidebarList({ items }) {
  return (
    <View>
      {items.map((item, index) => (
        <Text key={`${item}-${index}`} style={[styles.sidebarText, styles.sidebarListItem]}>
          {item}
        </Text>
      ))}
    </View>
  )
}

function SectionHeading({ title, accent }) {
  return <Text style={[styles.sectionHeading, { color: accent }]}>{title}</Text>
}

function ExperienceSection({ title, items, accent }) {
  if (!items.length) return null

  return (
    <View style={styles.section}>
      <SectionHeading title={title} accent={accent} />
      {items.map((item, index) => {
        const bullets = item.bullets || item.highlights || []
        const dateLabel = [item.startDate || item.date, item.endDate].filter(Boolean).join(' - ')

        return (
          <View key={`${title}-${index}`} style={styles.experienceBlock} wrap={false}>
            <View style={styles.rowBetween}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>{item.title || item.name || ''}</Text>
                {item.company ? <Text style={styles.itemSubtitle}>{item.company}</Text> : null}
                {item.location ? <Text style={styles.itemSubtitle}>{item.location}</Text> : null}
              </View>
              {dateLabel ? <Text style={styles.itemDate}>{dateLabel}</Text> : null}
            </View>
            {bullets.map((bulletText, bulletIndex) => (
              <View key={`${title}-${index}-${bulletIndex}`} style={styles.bulletRow}>
                <Text style={[styles.bullet, { color: accent }]}>•</Text>
                <Text style={styles.bulletText}>{bulletText}</Text>
              </View>
            ))}
          </View>
        )
      })}
    </View>
  )
}

function GeneratedResumePdf({ data, config, sectionOrder, sidebarSectionOrder }) {
  const accent = config.accentColor || '#4F46E5'
  const isSidebar = config.layout === 'sidebar' || config.layout === 'sidebar-left' || config.layout === 'sidebar-right'
  const isSidebarRight = config.layout === 'sidebar-right'
  const showBanner = config.headerStyle === 'banner'
  const mainSections = sectionOrder.filter((id) => id !== 'contact' && !sidebarSectionOrder.includes(id))
  const mergedSections = [...mainSections, ...sidebarSectionOrder.filter((id) => !mainSections.includes(id))]
  const contactLines = buildContactLines(data)
  const sidebarWidth = config.density === 'compressed' ? '24%' : '30%'

  const renderSection = (id, sidebarContext) => {
    switch (id) {
      case 'summary':
        return data.summary ? (
          <View style={styles.section}>
            <SectionHeading title="Summary" accent={accent} />
            <Text style={sidebarContext ? styles.sidebarText : styles.bodyText}>{data.summary}</Text>
          </View>
        ) : null
      case 'experience':
        return <ExperienceSection title="Experience" items={data.experience} accent={accent} />
      case 'volunteer':
        return <ExperienceSection title="Volunteer" items={data.volunteer} accent={accent} />
      case 'education':
        return data.education.length ? (
          <View style={styles.section}>
            <SectionHeading title="Education" accent={accent} />
            {data.education.map((item, index) => (
              <View key={`education-${index}`} style={styles.experienceBlock} wrap={false}>
                <View style={styles.rowBetween}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>{item.institution}</Text>
                    <Text style={styles.itemSubtitle}>{[item.degree, item.field].filter(Boolean).join(' - ')}</Text>
                    {item.gpa ? <Text style={styles.itemSubtitle}>GPA: {item.gpa}</Text> : null}
                  </View>
                  {item.graduationDate ? <Text style={styles.itemDate}>{item.graduationDate}</Text> : null}
                </View>
              </View>
            ))}
          </View>
        ) : null
      case 'projects':
        return data.projects.length ? (
          <View style={styles.section}>
            <SectionHeading title="Projects" accent={accent} />
            {data.projects.map((item, index) => (
              <View key={`project-${index}`} style={styles.experienceBlock} wrap={false}>
                <Text style={styles.itemTitle}>{item.name}</Text>
                <Text style={styles.bodyText}>{item.description}</Text>
                {item.technologies?.length ? (
                  <Text style={styles.itemSubtitle}>{item.technologies.join(', ')}</Text>
                ) : null}
              </View>
            ))}
          </View>
        ) : null
      case 'skills':
        return data.skills.length ? (
          <View style={styles.section}>
            <SectionHeading title="Skills" accent={accent} />
            <Text style={sidebarContext ? styles.sidebarText : styles.bodyText}>{data.skills.join(', ')}</Text>
          </View>
        ) : null
      case 'certifications':
        return data.certifications.length ? (
          <View style={styles.section}>
            <SectionHeading title="Certifications" accent={accent} />
            {data.certifications.map((item, index) => (
              <Text key={`cert-${index}`} style={[styles.sidebarText, styles.sidebarListItem]}>
                {[item.name, item.issuer, item.date].filter(Boolean).join(' - ')}
              </Text>
            ))}
          </View>
        ) : null
      case 'languages':
        return data.languages.length ? (
          <View style={styles.section}>
            <SectionHeading title="Languages" accent={accent} />
            <SidebarList items={data.languages} />
          </View>
        ) : null
      case 'interests':
        return data.interests.length ? (
          <View style={styles.section}>
            <SectionHeading title="Interests" accent={accent} />
            <SidebarList items={data.interests} />
          </View>
        ) : null
      case 'awards':
        return data.awards.length ? (
          <View style={styles.section}>
            <SectionHeading title="Awards" accent={accent} />
            {data.awards.map((item, index) => (
              <Text key={`award-${index}`} style={[styles.sidebarText, styles.sidebarListItem]}>
                {[item.title, item.issuer, item.date].filter(Boolean).join(' - ')}
              </Text>
            ))}
          </View>
        ) : null
      case 'publications':
        return data.publications.length ? (
          <View style={styles.section}>
            <SectionHeading title="Publications" accent={accent} />
            {data.publications.map((item, index) => (
              <Text key={`publication-${index}`} style={[styles.sidebarText, styles.sidebarListItem]}>
                {[item.title, item.publisher, item.date].filter(Boolean).join(' - ')}
              </Text>
            ))}
          </View>
        ) : null
      case 'references':
        return data.references.length ? (
          <View style={styles.section}>
            <SectionHeading title="References" accent={accent} />
            <SidebarList items={data.references} />
          </View>
        ) : null
      default: {
        const custom = data.customSections?.find((section) => section.id === id)
        if (!custom) return null

        if (custom.type === 'text' && custom.text) {
          return (
            <View style={styles.section}>
              <SectionHeading title={custom.title} accent={accent} />
              <Text style={sidebarContext ? styles.sidebarText : styles.bodyText}>{custom.text}</Text>
            </View>
          )
        }

        if (custom.type === 'tags' && custom.tags?.length) {
          return (
            <View style={styles.section}>
              <SectionHeading title={custom.title} accent={accent} />
              <Text style={sidebarContext ? styles.sidebarText : styles.bodyText}>{custom.tags.join(', ')}</Text>
            </View>
          )
        }

        if (custom.type === 'complex' && custom.items?.length) {
          return <ExperienceSection title={custom.title} items={custom.items} accent={accent} />
        }

        return null
      }
    }
  }

  return (
    <Document title={`${data.name || 'Resume'} Resume`} author={data.name || 'ResumePlanet'}>
      <Page size="A4" style={styles.page}>
        {showBanner ? (
          <View style={[styles.banner, { backgroundColor: accent }]}>
            <View style={styles.bannerLeft}>
              <Text style={styles.bannerName}>{data.name || 'Your Name'}</Text>
              <Text style={styles.bannerRole}>{data.currentRole || 'Your Professional Title'}</Text>
            </View>
            <View style={styles.bannerContact}>
              {contactLines.map((line, index) => (
                line.startsWith('http') || line.includes('linkedin.com') ? (
                  <Link key={`contact-${index}`} src={line.startsWith('http') ? line : `https://${line}`} style={styles.bannerContactText}>
                    {line}
                  </Link>
                ) : (
                  <Text key={`contact-${index}`} style={styles.bannerContactText}>{line}</Text>
                )
              ))}
            </View>
          </View>
        ) : null}

        {isSidebar ? (
          <View style={[styles.content, isSidebarRight ? { flexDirection: 'row-reverse' } : null]}>
            <View style={[styles.sidebar, { width: sidebarWidth, backgroundColor: rgba(accent, 0.08) }]}>
              {!showBanner ? (
                <View style={styles.minimalistHeader}>
                  <Text style={styles.name}>{data.name || 'Your Name'}</Text>
                  <Text style={[styles.role, { color: accent }]}>{data.currentRole || 'Your Professional Title'}</Text>
                  <View style={styles.contactsRow}>
                    {contactLines.map((line, index) => (
                      <Text key={`sidebar-contact-${index}`} style={styles.contactText}>{line}</Text>
                    ))}
                  </View>
                </View>
              ) : null}
              {sidebarSectionOrder.map((id) => (
                <React.Fragment key={`sidebar-${id}`}>{renderSection(id, true)}</React.Fragment>
              ))}
            </View>

            <View style={[styles.main, styles.mainSidebar]}>
              {mainSections.map((id) => (
                <React.Fragment key={`main-${id}`}>{renderSection(id, false)}</React.Fragment>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.main}>
            {!showBanner ? (
              <View style={styles.minimalistHeader}>
                <Text style={styles.name}>{data.name || 'Your Name'}</Text>
                <Text style={[styles.role, { color: accent }]}>{data.currentRole || 'Your Professional Title'}</Text>
                <View style={styles.contactsRow}>
                  {contactLines.map((line, index) => (
                    <Text key={`contact-row-${index}`} style={styles.contactText}>{line}</Text>
                  ))}
                </View>
              </View>
            ) : null}
            {mergedSections.map((id) => (
              <React.Fragment key={`merged-${id}`}>{renderSection(id, false)}</React.Fragment>
            ))}
          </View>
        )}
      </Page>
    </Document>
  )
}

export async function generateResumePdfBlob(props) {
  return pdf(<GeneratedResumePdf {...props} />).toBlob()
}

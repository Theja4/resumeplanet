'use client'

import React from 'react'
import { sanitizeUniversalConfig } from '@/lib/templateOptions'
import { getEducationDateLabel, normalizeSkillSections } from '@/lib/resume-data'
import EditableText from './EditableText'
import type { TemplateProps, UniversalConfig } from '@/types'
import { DEFAULT_VISIBILITY } from '@/types'

interface UniversalTemplateProps extends TemplateProps {
  config: UniversalConfig
  onNavigateToField?: (path: string) => void
}

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim())
}

function hasExperienceItemContent(item: {
  company?: string
  title?: string
  name?: string
  location?: string
  startDate?: string
  endDate?: string
  date?: string
  summary?: string
  bullets?: string[]
  highlights?: string[]
}) {
  return (
    hasText(item.company) ||
    hasText(item.title) ||
    hasText(item.name) ||
    hasText(item.location) ||
    hasText(item.startDate) ||
    hasText(item.endDate) ||
    hasText(item.date) ||
    hasText(item.summary) ||
    Boolean(item.bullets?.some(hasText)) ||
    Boolean(item.highlights?.some(hasText))
  )
}

function hasEducationItemContent(item: {
  institution?: string
  degree?: string
  field?: string
  startDate?: string
  endDate?: string
  graduationDate?: string
  gpa?: string
}) {
  return (
    hasText(item.institution) ||
    hasText(item.degree) ||
    hasText(item.field) ||
    hasText(item.startDate) ||
    hasText(item.endDate) ||
    hasText(item.graduationDate) ||
    hasText(item.gpa)
  )
}

function hasProjectItemContent(item: {
  name?: string
  description?: string
  bullets?: string[]
  technologies?: string[]
}) {
  return (
    hasText(item.name) ||
    hasText(item.description) ||
    Boolean(item.bullets?.some(hasText)) ||
    Boolean(item.technologies?.some(hasText))
  )
}

export default function UniversalTemplate({
  data,
  isEditing,
  showEmptyStateGuidance,
  highlightedSectionId,
  onFieldChange,
  sectionOrder,
  sidebarSectionOrder,
  config,
  onNavigateToField,
}: UniversalTemplateProps) {
  const safeConfig = sanitizeUniversalConfig(config)
  const {
    layout,
    headerStyle,
    bulletStyle,
    skillsStyle,
    sectionHeadingStyle,
    contactStyle,
    dateLayout,
    nameSize,
    accentColor,
    fontFamily,
    density = 'relaxed',
  } = safeConfig

  const accent = accentColor || '#4F46E5'
  const isCompressed = density === 'compressed'
  const isSidebar = layout === 'sidebar' || layout === 'sidebar-left' || layout === 'sidebar-right'
  const isSidebarRight = layout === 'sidebar-right'
  const isBannerHeader = headerStyle === 'banner'
  const isTimelessHeader = headerStyle === 'timeless'
  const isLatexStyle = isTimelessHeader || bulletStyle === 'latex' || sectionHeadingStyle === 'latex-rule'
  const isCenteredHeader = headerStyle === 'centered' || isTimelessHeader
  const isClassicHeader = headerStyle === 'classic'
  const isCompactHeader = headerStyle === 'compact'
  const nameClassName = isTimelessHeader
    ? nameSize === 'hero'
      ? 'text-[34px]'
      : nameSize === 'large'
        ? 'text-[31px]'
        : 'text-[28px]'
    : nameSize === 'hero'
      ? 'text-[44px]'
      : nameSize === 'large'
        ? 'text-4xl'
        : 'text-[32px]'
  const roleClassName =
    nameSize === 'hero'
      ? 'text-[17px]'
      : nameSize === 'large'
        ? 'text-base'
        : 'text-sm'
  const shouldShowSectionGuidance = Boolean(showEmptyStateGuidance)
  const normalizedSkillSections = normalizeSkillSections(data.skillSections, data.skills)

  function renderSectionFrame(
    sectionId: string,
    content: React.ReactNode,
    isSidebarContext: boolean = false,
    isDarkSurface: boolean = false
  ) {
    if (!content) return null

    return (
      <SectionFocusFrame
        isActive={highlightedSectionId === sectionId}
        isSidebarContext={isSidebarContext}
        isDarkSurface={isDarkSurface}
      >
        {content}
      </SectionFocusFrame>
    )
  }

  function renderTags(tags: string[], pathPrefix: string) {
    return tags.map((tag, i) => (
      <React.Fragment key={i}>
        <EditableText value={tag} path={`${pathPrefix}.${i}`} isEditing={isEditing} onFieldChange={onFieldChange} onNavigateToField={onNavigateToField} className="text-sm text-gray-700" />
        {i < tags.length - 1 && <span className="text-gray-400">, </span>}
      </React.Fragment>
    ))
  }

  function renderSkills(
    sections: Array<{ title: string; tag?: string; skills: string[] }>,
    isSidebarContext: boolean,
    accentValue: string
  ) {
    const normalizedSections = normalizeSkillSections(sections)

    if (!isSidebarContext && isLatexStyle) {
      return (
        <div className="mt-0.5 text-[13px] leading-[1.25] text-black">
          {normalizedSections.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              {section.title && (
                <>
                  <EditableText
                    value={section.title}
                    path={`skillSections.${sectionIndex}.title`}
                    isEditing={isEditing}
                    onFieldChange={onFieldChange}
                    onNavigateToField={onNavigateToField}
                    className="font-bold text-black"
                  />
                  {section.tag ? (
                    <span>
                      {' ('}
                      <EditableText
                        value={section.tag}
                        path={`skillSections.${sectionIndex}.tag`}
                        isEditing={isEditing}
                        onFieldChange={onFieldChange}
                        onNavigateToField={onNavigateToField}
                        className="font-bold text-black"
                      />
                      {')'}
                    </span>
                  ) : null}
                  <span>{': '}</span>
                </>
              )}
              {section.skills.map((skill, skillIndex) => (
                <React.Fragment key={skillIndex}>
                  <EditableText
                    value={skill}
                    path={`skillSections.${sectionIndex}.skills.${skillIndex}`}
                    isEditing={isEditing}
                    onFieldChange={onFieldChange}
                    onNavigateToField={onNavigateToField}
                    className="text-black"
                  />
                  {skillIndex < section.skills.length - 1 && <span>, </span>}
                </React.Fragment>
              ))}
            </div>
          ))}
        </div>
      )
    }

    if (skillsStyle === 'stacked') {
      return (
        <div className={`${isSidebarContext ? 'mt-1 space-y-2' : 'mt-1.5 space-y-2'}`}>
          {normalizedSections.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              {section.title && (
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <EditableText
                    value={section.title}
                    path={`skillSections.${sectionIndex}.title`}
                    isEditing={isEditing}
                    onFieldChange={onFieldChange}
                    onNavigateToField={onNavigateToField}
                    className={`${isSidebarContext ? 'text-[10px]' : 'text-xs'} font-semibold uppercase tracking-[0.14em] text-gray-500`}
                  />
                  {section.tag ? (
                    <span
                      className={`${isSidebarContext ? 'text-[10px]' : 'text-xs'} font-medium text-gray-500 ${!isEditing && onNavigateToField ? 'cursor-text' : ''}`}
                      onClick={
                        !isEditing && onNavigateToField
                          ? (event) => {
                              event.stopPropagation()
                              onNavigateToField(`skillSections.${sectionIndex}.tag`)
                            }
                          : undefined
                      }
                    >
                      ({section.tag})
                    </span>
                  ) : null}
                </div>
              )}
              <div className="mt-1 space-y-1">
                {section.skills.map((skill, skillIndex) => (
                  <div key={skillIndex} className="flex gap-2">
                    <span style={{ color: accentValue, opacity: 0.7 }} className="shrink-0 text-xs leading-5">•</span>
                    <EditableText
                      value={skill}
                      path={`skillSections.${sectionIndex}.skills.${skillIndex}`}
                      isEditing={isEditing}
                      onFieldChange={onFieldChange}
                      onNavigateToField={onNavigateToField}
                      className={isSidebarContext ? 'text-[11px] text-gray-700 leading-tight' : 'text-sm text-gray-700 leading-tight'}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )
    }

    const separator = skillsStyle === 'divider' ? ' • ' : ', '

    return (
      <div className="mt-1 space-y-1.5">
        {normalizedSections.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            {section.title && (
              <>
                <EditableText
                  value={section.title}
                  path={`skillSections.${sectionIndex}.title`}
                  isEditing={isEditing}
                  onFieldChange={onFieldChange}
                  onNavigateToField={onNavigateToField}
                  className={`${isSidebarContext ? 'text-[10px]' : 'text-xs'} mr-2 font-semibold uppercase tracking-[0.14em] text-gray-500`}
                />
                {section.tag ? (
                  <span
                    className={`${isSidebarContext ? 'text-[10px]' : 'text-xs'} mr-2 font-medium text-gray-500 ${!isEditing && onNavigateToField ? 'cursor-text' : ''}`}
                    onClick={
                      !isEditing && onNavigateToField
                        ? (event) => {
                            event.stopPropagation()
                            onNavigateToField(`skillSections.${sectionIndex}.tag`)
                          }
                        : undefined
                    }
                  >
                    ({section.tag})
                  </span>
                ) : null}
              </>
            )}
            {section.skills.map((skill, skillIndex) => (
              <React.Fragment key={skillIndex}>
                <EditableText
                  value={skill}
                  path={`skillSections.${sectionIndex}.skills.${skillIndex}`}
                  isEditing={isEditing}
                  onFieldChange={onFieldChange}
                  onNavigateToField={onNavigateToField}
                />
                {skillIndex < section.skills.length - 1 && <span className="text-gray-400">{separator}</span>}
              </React.Fragment>
            ))}
          </div>
        ))}
      </div>
    )
  }

  const contactItems = [
    { value: data.email, path: 'email' },
    { value: data.phone, path: 'phone' },
    { value: data.location, path: 'location' },
    { value: data.linkedin, path: 'linkedin' },
    { value: data.website, path: 'website' },
  ].filter((item): item is { value: string; path: string } => Boolean(item.value))

  const bannerContactItems = [
    { value: data.email, path: 'email' },
    { value: data.phone, path: 'phone' },
    { value: data.linkedin, path: 'linkedin' },
    { value: data.website, path: 'website' },
    { value: data.location, path: 'location' },
  ].filter((item): item is { value: string; path: string } => Boolean(item.value))

  const timelessContactItems = [
    { value: data.phone, path: 'phone' },
    { value: data.email, path: 'email' },
    { value: data.linkedin, path: 'linkedin' },
    { value: data.website, path: 'website' },
    { value: data.location, path: 'location' },
  ].filter((item): item is { value: string; path: string } => Boolean(item.value))

  function renderContactInfo(centered: boolean) {
    const resolvedContactItems = isTimelessHeader ? timelessContactItems : contactItems
    if (resolvedContactItems.length === 0) return null

    if (isTimelessHeader) {
      return (
        <div className="mt-1 flex flex-wrap justify-center gap-x-1 text-center text-[13px] leading-[1.15] text-black">
          {resolvedContactItems.map((item, index) => {
            const isLink = item.path === 'email' || item.path === 'linkedin' || item.path === 'website'

            return (
              <React.Fragment key={item.path}>
                {index > 0 && <span aria-hidden="true" className="px-1 text-black">|</span>}
                <EditableText
                  value={item.value}
                  path={item.path}
                  isEditing={isEditing}
                  onFieldChange={onFieldChange}
                  onNavigateToField={onNavigateToField}
                  className={`break-words text-black ${isLink ? 'underline underline-offset-2' : ''}`}
                />
              </React.Fragment>
            )
          })}
        </div>
      )
    }

    const baseClassName = isCompressed ? 'text-xs text-gray-500 break-words' : 'text-sm text-gray-500 break-words'

    if (contactStyle === 'stacked') {
      return (
        <div className={`mt-3 space-y-1 ${centered ? 'text-center' : ''}`}>
          {resolvedContactItems.map((item) => (
            <EditableText
              key={item.path}
              value={item.value}
              path={item.path}
              isEditing={isEditing}
              onFieldChange={onFieldChange}
              onNavigateToField={onNavigateToField}
              className={baseClassName}
            />
          ))}
        </div>
      )
    }

    return (
      <div className={`mt-3 flex flex-wrap gap-x-4 gap-y-1 ${centered ? 'justify-center' : ''}`}>
        {resolvedContactItems.map((item) => (
          <EditableText
            key={item.path}
            value={item.value}
            path={item.path}
            isEditing={isEditing}
            onFieldChange={onFieldChange}
            onNavigateToField={onNavigateToField}
            className={baseClassName}
          />
        ))}
      </div>
    )
  }

  function renderBannerHeaderBlock() {
    return (
      <div
        className={`flex items-center justify-between gap-10 ${isCompressed ? 'min-h-[184px] px-10 py-10' : 'min-h-[228px] px-12 py-14'}`}
        style={{ backgroundColor: accent }}
      >
        <div className="min-w-0 flex-1">
          <EditableText
            value={data.name}
            path="name"
            isEditing={isEditing}
            onFieldChange={onFieldChange}
            onNavigateToField={onNavigateToField}
            className={`${nameClassName} font-bold break-words tracking-tight leading-[0.95] text-white`}
            as="h1"
            fallback="Your Name"
          />
          <EditableText
            value={data.currentRole}
            path="currentRole"
            isEditing={isEditing}
            onFieldChange={onFieldChange}
            onNavigateToField={onNavigateToField}
            className={`${roleClassName} mt-3 block break-words font-semibold uppercase tracking-[0.18em] text-white/75`}
            fallback="Your Professional Title"
          />
        </div>

        {bannerContactItems.length > 0 && (
          <div className="w-[240px] shrink-0 space-y-1 text-right">
            {bannerContactItems.map((item) => (
              <EditableText
                key={item.path}
                value={item.value}
                path={item.path}
                isEditing={isEditing}
                onFieldChange={onFieldChange}
                onNavigateToField={onNavigateToField}
                className={`${isCompressed ? 'text-xs' : 'text-sm'} block break-words text-white/90`}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  function renderHeaderBlock() {
    const headerMarginClassName = isTimelessHeader
      ? 'mb-4 text-center'
      : isCenteredHeader
        ? 'mb-7 text-center'
        : isCompactHeader
          ? 'mb-4'
          : isCompressed
            ? 'mb-5'
            : 'mb-7'
    const headerNameClassName = isTimelessHeader
      ? `${nameClassName} font-bold text-black break-words leading-none text-center`
      : `${nameClassName} font-bold text-gray-900 break-words tracking-tight leading-[0.95] ${isCenteredHeader ? 'text-center' : ''}`

    return (
      <div className={headerMarginClassName}>
        <EditableText
          value={data.name}
          path="name"
          isEditing={isEditing}
          onFieldChange={onFieldChange}
          onNavigateToField={onNavigateToField}
          style={isTimelessHeader ? { fontVariantCaps: 'small-caps' } : undefined}
          className={headerNameClassName}
          as="h1"
          fallback="Your Name"
        />
        {!isTimelessHeader && (
          <EditableText
            value={data.currentRole}
            path="currentRole"
            isEditing={isEditing}
            onFieldChange={onFieldChange}
            onNavigateToField={onNavigateToField}
            style={{ color: accent }}
            className={`${roleClassName} ${isCompactHeader ? 'mt-1.5' : 'mt-2'} block font-semibold uppercase break-words tracking-[0.18em] ${isCenteredHeader ? 'text-center' : ''}`}
            fallback="Your Professional Title"
          />
        )}

        {isClassicHeader && <div className="mt-4 h-px w-full bg-gray-200" />}

        {renderContactInfo(isCenteredHeader)}
      </div>
    )
  }

  function renderLatexEducationItems() {
    return (
      <div className="space-y-[5px]">
        {data.education.map((edu, i) => {
          if (!hasEducationItemContent(edu)) return null

          const degreeLine = [edu.degree, edu.field].filter(Boolean).join(', ')
          const educationDate = getEducationDateLabel(edu)

          return (
            <div key={i} className="pl-[14px] text-black">
              <div className="flex items-start justify-between gap-4">
                <EditableText
                  value={edu.institution}
                  path={`education.${i}.institution`}
                  isEditing={isEditing}
                  onFieldChange={onFieldChange}
                  onNavigateToField={onNavigateToField}
                  className="min-w-0 flex-1 break-words text-[15px] font-bold leading-[1.12] text-black"
                />
              </div>

              {(degreeLine || educationDate || edu.gpa) && (
                <div className="mt-[1px] flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 break-words text-[13px] italic leading-[1.15] text-black">
                    {degreeLine ? (
                      <>
                        <EditableText
                          value={edu.degree}
                          path={`education.${i}.degree`}
                          isEditing={isEditing}
                          onFieldChange={onFieldChange}
                          onNavigateToField={onNavigateToField}
                          className="text-[13px] italic leading-[1.15] text-black"
                        />
                        {edu.field ? <span>, </span> : null}
                        {edu.field ? (
                          <EditableText
                            value={edu.field}
                            path={`education.${i}.field`}
                            isEditing={isEditing}
                            onFieldChange={onFieldChange}
                            onNavigateToField={onNavigateToField}
                            className="text-[13px] italic leading-[1.15] text-black"
                          />
                        ) : null}
                      </>
                    ) : null}
                    {edu.gpa ? <span>{degreeLine ? ', ' : ''}GPA: {edu.gpa}</span> : null}
                  </div>
                  {educationDate && (
                    <EditableText
                      value={educationDate}
                      path={`education.${i}.endDate`}
                      isEditing={isEditing}
                      onFieldChange={onFieldChange}
                      onNavigateToField={onNavigateToField}
                      className="ml-4 shrink-0 text-right text-[13px] italic leading-[1.15] text-black"
                    />
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  function renderLatexProjectItems() {
    return (
      <div className="space-y-[5px]">
        {data.projects.map((project, projectIndex) => {
          if (!hasProjectItemContent(project)) return null

          const technologies = project.technologies?.filter(hasText) ?? []

          return (
            <div key={projectIndex} className="pl-[14px] text-black">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1 break-words text-[13px] leading-[1.15] text-black">
                  <EditableText
                    value={project.name}
                    path={`projects.${projectIndex}.name`}
                    isEditing={isEditing}
                    onFieldChange={onFieldChange}
                    onNavigateToField={onNavigateToField}
                    className="font-bold text-black"
                  />
                  {technologies.length > 0 && (
                    <>
                      <span> | </span>
                      <span className="italic">
                        {technologies.map((technology, technologyIndex) => (
                          <React.Fragment key={technologyIndex}>
                            <EditableText
                              value={technology}
                              path={`projects.${projectIndex}.technologies.${technologyIndex}`}
                              isEditing={isEditing}
                              onFieldChange={onFieldChange}
                              onNavigateToField={onNavigateToField}
                              className="italic text-black"
                            />
                            {technologyIndex < technologies.length - 1 && <span>, </span>}
                          </React.Fragment>
                        ))}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {project.description && (
                <EditableText
                  value={project.description}
                  path={`projects.${projectIndex}.description`}
                  isEditing={isEditing}
                  onFieldChange={onFieldChange}
                  onNavigateToField={onNavigateToField}
                  className="mt-[2px] block break-words text-[13px] leading-[1.22] text-black"
                  as="p"
                />
              )}

              {(project.bullets?.length ?? 0) > 0 && (
                <ul className="mt-[2px] list-disc space-y-0 pl-[22px] text-[13px] leading-[1.22] text-black">
                  {(project.bullets ?? []).map((bullet, bulletIndex) => (
                    <li key={bulletIndex}>
                      <EditableText
                        value={bullet}
                        path={`projects.${projectIndex}.bullets.${bulletIndex}`}
                        isEditing={isEditing}
                        onFieldChange={onFieldChange}
                        onNavigateToField={onNavigateToField}
                        className="break-words text-[13px] leading-[1.22] text-black"
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  function renderSection(id: string, isSidebarContext: boolean = false) {
    const shouldRenderGuidance = shouldShowSectionGuidance

    if (id.startsWith('custom_')) {
      const custom = data.customSections?.find(c => c.id === id)
      if (!custom) return null

      if (custom.type === 'text' && custom.text && custom.text.trim()) {
        return (
          <div className={isSidebarContext ? 'mt-4' : ''}>
            {isSidebarContext ? <SidebarLabel text={custom.title} accent={accent} /> : <SectionHeading title={custom.title} accent={accent} density={density} styleVariant={sectionHeadingStyle} />}
            <EditableText value={custom.text} path={`${id}.text`} isEditing={isEditing} onFieldChange={onFieldChange} onNavigateToField={onNavigateToField} className={`${isSidebarContext ? 'text-[11px]' : 'text-sm'} text-gray-700 break-words ${isCompressed ? 'leading-snug' : 'leading-relaxed'}`} as="p" />
          </div>
        )
      }

      if (custom.type === 'tags' && custom.tags && custom.tags.length > 0) {
        return (
          <div className={isSidebarContext ? 'mt-4' : ''}>
            {isSidebarContext ? <SidebarLabel text={custom.title} accent={accent} /> : <SectionHeading title={custom.title} accent={accent} density={density} styleVariant={sectionHeadingStyle} />}
            <p className={`${isSidebarContext ? 'text-[11px]' : 'text-sm'} text-gray-700`}>
              <span className={isCompressed ? 'leading-tight' : 'leading-normal'}>
                {renderTags(custom.tags, `${id}.tags`)}
              </span>
            </p>
          </div>
        )
      }

      if (custom.type === 'complex' && custom.items && custom.items.length > 0) {
        return (
          <div className={isSidebarContext ? 'mt-4' : ''}>
            {isSidebarContext ? <SidebarLabel text={custom.title} accent={accent} /> : <SectionHeading title={custom.title} accent={accent} density={density} styleVariant={sectionHeadingStyle} />}
            <div className={isLatexStyle && !isSidebarContext ? 'space-y-[5px]' : isCompressed ? 'space-y-3' : 'space-y-5'}>
              {custom.items.map((exp, ei) => (
                <ExperienceItem
                  key={ei}
                  exp={exp}
                  ei={ei}
                  pathPrefix={`${id}.items`}
                  isEditing={isEditing}
                  onFieldChange={onFieldChange}
                  accent={accent}
                  density={density}
                  bulletStyle={bulletStyle}
                  dateLayout={dateLayout}
                  onNavigateToField={onNavigateToField}
                />
              ))}
            </div>
          </div>
        )
      }
      return null
    }

    switch (id) {
      case 'summary':
        return hasText(data.summary) ? (
          <div>
            {isSidebarContext ? <SidebarLabel text="Summary" accent={accent} /> : <SectionHeading title="Summary" accent={accent} density={density} styleVariant={sectionHeadingStyle} />}
            <EditableText value={data.summary} path="summary" isEditing={isEditing} onFieldChange={onFieldChange} onNavigateToField={onNavigateToField} className={`${isSidebarContext ? 'text-[11px]' : 'text-sm'} text-gray-700 break-words ${isCompressed ? 'leading-snug' : 'leading-relaxed'}`} as="p" />
          </div>
        ) : shouldRenderGuidance ? (
          <div>
            {isSidebarContext ? <SidebarLabel text="Summary" accent={accent} /> : <SectionHeading title="Summary" accent={accent} density={density} styleVariant={sectionHeadingStyle} />}
            <GhostHintText isSidebarContext={isSidebarContext} navigatePath="summary" onNavigateToField={onNavigateToField}>
              Tip: lead with your target role, years of experience, and the outcomes you deliver.
            </GhostHintText>
            <GhostHintText isSidebarContext={isSidebarContext} className="mt-1" navigatePath="summary" onNavigateToField={onNavigateToField}>
              Example: Growth marketer with 5+ years improving retention, acquisition, and lifecycle conversion across SaaS.
            </GhostHintText>
          </div>
        ) : null

      case 'experience':
        return data.experience.some(hasExperienceItemContent) ? (
          <div>
            {isSidebarContext ? <SidebarLabel text="Work Experience" accent={accent} /> : <SectionHeading title="Work Experience" accent={accent} density={density} styleVariant={sectionHeadingStyle} />}
            <div className={isLatexStyle && !isSidebarContext ? 'space-y-[5px]' : isCompressed ? 'space-y-3' : 'space-y-5'}>
              {data.experience.map((exp, ei) =>
                hasExperienceItemContent(exp) ? (
                  <ExperienceItem
                    key={ei}
                    exp={exp}
                    ei={ei}
                    pathPrefix="experience"
                    isEditing={isEditing}
                    onFieldChange={onFieldChange}
                    accent={accent}
                    density={density}
                    bulletStyle={bulletStyle}
                    dateLayout={dateLayout}
                    onNavigateToField={onNavigateToField}
                  />
                ) : null
              )}
            </div>
          </div>
        ) : shouldRenderGuidance ? (
          <div>
            {isSidebarContext ? <SidebarLabel text="Work Experience" accent={accent} /> : <SectionHeading title="Work Experience" accent={accent} density={density} styleVariant={sectionHeadingStyle} />}
            <div className={isCompressed ? 'space-y-2' : 'space-y-3'}>
              <div>
                <GhostHintText isSidebarContext={isSidebarContext} className="font-semibold" navigatePath="experience.0.title" onNavigateToField={onNavigateToField}>
                  Your Job Title
                </GhostHintText>
                <GhostHintText isSidebarContext={isSidebarContext} className="mt-0.5" navigatePath="experience.0.company" onNavigateToField={onNavigateToField}>
                  Company Name · City, ST · 2022 - Present
                </GhostHintText>
                <GhostHintList
                  isSidebarContext={isSidebarContext}
                  navigatePath="experience.0.bullets.0"
                  onNavigateToField={onNavigateToField}
                  items={[
                    'Start bullets with action + outcome + metric.',
                    'Example: Increased trial-to-paid conversion by 18% by redesigning onboarding emails.',
                  ]}
                />
              </div>
            </div>
          </div>
        ) : null

      case 'education':
        return data.education.some(hasEducationItemContent) ? (
          <div>
            {isSidebarContext ? <SidebarLabel text="Education" accent={accent} /> : <SectionHeading title="Education" accent={accent} density={density} styleVariant={sectionHeadingStyle} />}
            {isLatexStyle && !isSidebarContext ? renderLatexEducationItems() : (
            <div className={isCompressed ? 'space-y-1.5' : 'space-y-3'}>
              {data.education.map((edu, i) =>
                hasEducationItemContent(edu) ? (
                  <div key={i} className={dateLayout === 'right' ? 'flex justify-between items-start gap-4' : ''}>
                    <div className="min-w-0 flex-1">
                      <EditableText
                        value={edu.institution}
                        path={`education.${i}.institution`}
                        isEditing={isEditing}
                        onFieldChange={onFieldChange}
                        onNavigateToField={onNavigateToField}
                        className={isSidebarContext ? 'text-[11px] font-semibold text-gray-900 break-words' : 'text-sm font-semibold text-gray-900 break-words'}
                      />
                      <div className="flex flex-wrap gap-x-2">
                        <EditableText
                          value={edu.degree}
                          path={`education.${i}.degree`}
                          isEditing={isEditing}
                          onFieldChange={onFieldChange}
                          onNavigateToField={onNavigateToField}
                          className={isSidebarContext ? 'text-[10px] text-gray-600' : 'text-sm text-gray-600'}
                        />
                        {edu.field && (
                          <EditableText
                            value={edu.field}
                            path={`education.${i}.field`}
                            isEditing={isEditing}
                            onFieldChange={onFieldChange}
                            onNavigateToField={onNavigateToField}
                            className={isSidebarContext ? 'text-[10px] text-gray-500 italic' : 'text-sm text-gray-500 italic'}
                          />
                        )}
                      </div>
                      {edu.gpa && <p className={`text-gray-400 ${isSidebarContext || isCompressed ? 'text-[10px]' : 'text-xs'}`}>GPA: {edu.gpa}</p>}
                    </div>
                    {dateLayout === 'right' && getEducationDateLabel(edu) && (
                      <EditableText
                        value={getEducationDateLabel(edu)}
                        path={`education.${i}.endDate`}
                        isEditing={isEditing}
                        onFieldChange={onFieldChange}
                        onNavigateToField={onNavigateToField}
                        className={`text-gray-400 shrink-0 ml-4 ${isSidebarContext || isCompressed ? 'text-[10px]' : 'text-xs'}`}
                      />
                    )}
                    {dateLayout === 'inline' && getEducationDateLabel(edu) && (
                      <EditableText
                        value={getEducationDateLabel(edu)}
                        path={`education.${i}.endDate`}
                        isEditing={isEditing}
                        onFieldChange={onFieldChange}
                        onNavigateToField={onNavigateToField}
                        className={`mt-0.5 block text-gray-400 ${isSidebarContext || isCompressed ? 'text-[10px]' : 'text-xs'}`}
                      />
                    )}
                  </div>
                ) : null
              )}
            </div>
            )}
          </div>
        ) : shouldRenderGuidance ? (
          <div>
            {isSidebarContext ? <SidebarLabel text="Education" accent={accent} /> : <SectionHeading title="Education" accent={accent} density={density} styleVariant={sectionHeadingStyle} />}
            <GhostHintText isSidebarContext={isSidebarContext} className="font-semibold" navigatePath="education.0.institution" onNavigateToField={onNavigateToField}>
              Degree / Program
            </GhostHintText>
            <GhostHintText isSidebarContext={isSidebarContext} className="mt-0.5" navigatePath="education.0.degree" onNavigateToField={onNavigateToField}>
              School Name · Graduation Date
            </GhostHintText>
            <GhostHintText isSidebarContext={isSidebarContext} className="mt-1" navigatePath="education.0.gpa" onNavigateToField={onNavigateToField}>
              Add GPA only if it strengthens the application.
            </GhostHintText>
          </div>
        ) : null

      case 'skills':
        return normalizedSkillSections.length > 0 ? (
          <div>
            {isSidebarContext ? <SidebarLabel text="Skills" accent={accent} /> : <SectionHeading title="Skills" accent={accent} density={density} styleVariant={sectionHeadingStyle} />}
            <div className={`${isSidebarContext ? 'text-[11px]' : 'text-sm'} text-gray-700 leading-relaxed`}>
              {renderSkills(normalizedSkillSections, isSidebarContext, accent)}
            </div>
          </div>
        ) : null

      case 'certifications':
        return data.certifications.length > 0 ? (
          <div>
            {isSidebarContext ? <SidebarLabel text="Certifications" accent={accent} /> : <SectionHeading title="Certifications" accent={accent} density={density} styleVariant={sectionHeadingStyle} />}
            <div className={isSidebarContext ? 'mt-1 space-y-1' : (isCompressed ? 'space-y-1' : 'space-y-2')}>
              {data.certifications.map((c, i) => (
                <p key={i} className={`${isSidebarContext ? 'text-[11px]' : 'text-sm'} text-gray-700 leading-tight`}>
                  <EditableText value={c.name} path={`certifications.${i}.name`} isEditing={isEditing} onFieldChange={onFieldChange} onNavigateToField={onNavigateToField} className="font-medium break-words" />
                  {c.date ? (
                    <>
                      {' ('}
                      <EditableText
                        value={c.date}
                        path={`certifications.${i}.date`}
                        isEditing={isEditing}
                        onFieldChange={onFieldChange}
                        onNavigateToField={onNavigateToField}
                      />
                      {')'}
                    </>
                  ) : null}
                </p>
              ))}
            </div>
          </div>
        ) : null

      case 'volunteer':
        return data.volunteer.length > 0 ? (
          <div>
            {isSidebarContext ? <SidebarLabel text="Volunteer" accent={accent} /> : <SectionHeading title="Volunteer" accent={accent} density={density} styleVariant={sectionHeadingStyle} />}
            <div className={isLatexStyle && !isSidebarContext ? 'space-y-[5px]' : isCompressed ? 'space-y-3' : 'space-y-5'}>
              {data.volunteer.map((exp, ei) => (
                <ExperienceItem
                  key={ei}
                  exp={exp}
                  ei={ei}
                  pathPrefix="volunteer"
                  isEditing={isEditing}
                  onFieldChange={onFieldChange}
                  onNavigateToField={onNavigateToField}
                  accent={accent}
                  density={density}
                  bulletStyle={bulletStyle}
                  dateLayout={dateLayout}
                />
              ))}
            </div>
          </div>
        ) : null

      case 'languages':
        return data.languages.length > 0 ? (
          <div>
            {isSidebarContext ? <SidebarLabel text="Languages" accent={accent} /> : <SectionHeading title="Languages" accent={accent} density={density} styleVariant={sectionHeadingStyle} />}
            <div className={`${isSidebarContext ? 'text-[11px] mt-1' : 'text-sm'} text-gray-700`}>
              {data.languages.map((lang, i) => (
                <React.Fragment key={i}>
                  <EditableText value={lang} path={`languages.${i}`} isEditing={isEditing} onFieldChange={onFieldChange} onNavigateToField={onNavigateToField} className={isSidebarContext ? 'text-[11px] text-gray-700' : 'text-sm text-gray-700'} />
                  {i < data.languages.length - 1 && <span className="text-gray-400">, </span>}
                </React.Fragment>
              ))}
            </div>
          </div>
        ) : null

      case 'projects':
        return data.projects.some(hasProjectItemContent) ? (
          <div>
            {isSidebarContext ? <SidebarLabel text="Projects" accent={accent} /> : <SectionHeading title="Projects" accent={accent} density={density} styleVariant={sectionHeadingStyle} />}
            {isLatexStyle && !isSidebarContext ? renderLatexProjectItems() : (
            <div className={isCompressed ? 'space-y-3' : 'space-y-5'}>
              {data.projects.map((proj, i) =>
                hasProjectItemContent(proj) ? (
                  <div key={i}>
                    <div className="flex justify-between items-start">
                      <EditableText value={proj.name} path={`projects.${i}.name`} isEditing={isEditing} onFieldChange={onFieldChange} onNavigateToField={onNavigateToField} className={isSidebarContext ? 'text-[11px] font-semibold text-gray-900' : 'text-sm font-semibold text-gray-900'} />
                    </div>
                    {proj.description && (
                      <EditableText value={proj.description} path={`projects.${i}.description`} isEditing={isEditing} onFieldChange={onFieldChange} onNavigateToField={onNavigateToField} className={`${isSidebarContext ? 'text-[10px]' : 'text-sm'} text-gray-600 mt-0.5 leading-relaxed`} as="p" />
                    )}
                    {(proj.bullets?.length ?? 0) > 0 && (
                      <div className="mt-1.5 space-y-1">
                        {(proj.bullets ?? []).map((bullet, bulletIndex) => (
                          <div key={bulletIndex} className="flex gap-2">
                            <span style={{ color: accent, opacity: 0.7 }} className="shrink-0 text-xs leading-5">•</span>
                            <EditableText
                              value={bullet}
                              path={`projects.${i}.bullets.${bulletIndex}`}
                              isEditing={isEditing}
                              onFieldChange={onFieldChange}
                              onNavigateToField={onNavigateToField}
                              className={`${isSidebarContext ? 'text-[10px]' : 'text-sm'} text-gray-600 leading-relaxed`}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null
              )}
            </div>
            )}
          </div>
        ) : shouldRenderGuidance ? (
          <div>
            {isSidebarContext ? <SidebarLabel text="Projects" accent={accent} /> : <SectionHeading title="Projects" accent={accent} density={density} styleVariant={sectionHeadingStyle} />}
            <GhostHintText isSidebarContext={isSidebarContext} className="font-semibold" navigatePath="projects.0.name" onNavigateToField={onNavigateToField}>
              Project Name
            </GhostHintText>
            <GhostHintText isSidebarContext={isSidebarContext} className="mt-0.5" navigatePath="projects.0.description" onNavigateToField={onNavigateToField}>
              Add one line on what you built, who it helped, and the result.
            </GhostHintText>
            <GhostHintText isSidebarContext={isSidebarContext} className="mt-1" navigatePath="projects.0.description" onNavigateToField={onNavigateToField}>
              Example: Built an internal dashboard that cut weekly reporting time by 6 hours.
            </GhostHintText>
          </div>
        ) : null

      case 'awards':
        return data.awards.length > 0 ? (
          <div>
            {isSidebarContext ? <SidebarLabel text="Awards" accent={accent} /> : <SectionHeading title="Awards" accent={accent} density={density} styleVariant={sectionHeadingStyle} />}
            <div className={isSidebarContext ? 'mt-1' : ''}>
              {data.awards.map((award, i) => (
                <p key={i} className={`${isSidebarContext ? 'text-[11px]' : 'text-sm'} text-gray-700 leading-tight`}>
                  <EditableText value={award.title} path={`awards.${i}.title`} isEditing={isEditing} onFieldChange={onFieldChange} onNavigateToField={onNavigateToField} className="font-medium break-words" />
                  {award.date ? (
                    <>
                      {' ('}
                      <EditableText
                        value={award.date}
                        path={`awards.${i}.date`}
                        isEditing={isEditing}
                        onFieldChange={onFieldChange}
                        onNavigateToField={onNavigateToField}
                      />
                      {')'}
                    </>
                  ) : null}
                </p>
              ))}
            </div>
          </div>
        ) : null

      case 'interests':
        return data.interests.length > 0 ? (
          <div>
            {isSidebarContext ? <SidebarLabel text="Interests" accent={accent} /> : <SectionHeading title="Interests" accent={accent} density={density} styleVariant={sectionHeadingStyle} />}
            <div className={`${isSidebarContext ? 'text-[11px] mt-1' : 'text-sm'} text-gray-700`}>
              {data.interests.map((interest, i) => (
                <React.Fragment key={i}>
                  <EditableText value={interest} path={`interests.${i}`} isEditing={isEditing} onFieldChange={onFieldChange} onNavigateToField={onNavigateToField} className={isSidebarContext ? 'text-[11px] text-gray-700' : 'text-sm text-gray-700'} />
                  {i < data.interests.length - 1 && <span className="text-gray-400">, </span>}
                </React.Fragment>
              ))}
            </div>
          </div>
        ) : null

      case 'publications':
        return data.publications.length > 0 ? (
          <div>
            {isSidebarContext ? <SidebarLabel text="Publications" accent={accent} /> : <SectionHeading title="Publications" accent={accent} density={density} styleVariant={sectionHeadingStyle} />}
            <div className={isSidebarContext ? 'mt-1 space-y-1' : 'space-y-2'}>
              {data.publications.map((p, i) => (
                <div key={i} className={`${isSidebarContext ? 'text-[11px]' : 'text-sm'} text-gray-700 leading-tight`}>
                  <EditableText value={p.title} path={`publications.${i}.title`} isEditing={isEditing} onFieldChange={onFieldChange} onNavigateToField={onNavigateToField} className="font-medium break-words" />
                  {(p.publisher || p.date) && (
                    <span className="text-gray-500 block text-[10px] italic">
                      {p.publisher ? (
                        <EditableText
                          value={p.publisher}
                          path={`publications.${i}.publisher`}
                          isEditing={isEditing}
                          onFieldChange={onFieldChange}
                          onNavigateToField={onNavigateToField}
                        />
                      ) : null}
                      {p.publisher && p.date ? ' · ' : null}
                      {p.date ? (
                        <EditableText
                          value={p.date}
                          path={`publications.${i}.date`}
                          isEditing={isEditing}
                          onFieldChange={onFieldChange}
                          onNavigateToField={onNavigateToField}
                        />
                      ) : null}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : null

      case 'references':
        return data.references.length > 0 ? (
          <div>
            {isSidebarContext ? <SidebarLabel text="References" accent={accent} /> : <SectionHeading title="References" accent={accent} density={density} styleVariant={sectionHeadingStyle} />}
            <div className={`${isSidebarContext ? 'text-[11px] mt-1' : 'text-sm'} text-gray-700 italic`}>
              {data.references.map((ref, i) => (
                <div key={i} className="mb-2 last:mb-0">
                   <EditableText value={ref} path={`references.${i}`} isEditing={isEditing} onFieldChange={onFieldChange} onNavigateToField={onNavigateToField} />
                </div>
              ))}
            </div>
          </div>
        ) : null

      default:
        return null
    }
  }

  const sidebarWidth = isCompressed ? 'w-48' : 'w-64'
  const singleColumnSectionIds = [...(sectionOrder || DEFAULT_VISIBILITY.sectionOrder || []), ...(sidebarSectionOrder || DEFAULT_VISIBILITY.sidebarSectionOrder || [])]
    .filter((value, index, array) => array.indexOf(value) === index)
    .filter(id => id !== 'contact')
  const pagePaddingClassName = isLatexStyle ? 'p-12' : isCompressed ? 'p-8' : 'p-12'
  const bodyContent = isSidebar ? (
    <div className={`flex flex-1 ${isSidebarRight ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Sidebar */}
      <div style={{ backgroundColor: `${accent}15` }} className={`${sidebarWidth} shrink-0 text-gray-900 p-8 flex flex-col gap-1 min-h-full`}>
        {(sidebarSectionOrder || DEFAULT_VISIBILITY.sidebarSectionOrder || []).map(id => (
          <React.Fragment key={id}>
            {renderSectionFrame(id, renderSection(id, true), true)}
          </React.Fragment>
        ))}
      </div>

      {/* Main Column */}
      <div className="flex-1 p-10 pt-12 text-gray-900">
        {renderSectionFrame('contact', renderHeaderBlock())}
        {(sectionOrder || DEFAULT_VISIBILITY.sectionOrder || [])
          .filter(id => id !== 'contact') // Safety filter for redundant contact sections
          .filter(id => !(sidebarSectionOrder || DEFAULT_VISIBILITY.sidebarSectionOrder || []).includes(id))
          .map(id => (
            <React.Fragment key={id}>
              {renderSectionFrame(id, renderSection(id))}
            </React.Fragment>
          ))}
      </div>
    </div>
  ) : isBannerHeader ? (
    <div className="flex flex-col">
      {renderSectionFrame('contact', renderBannerHeaderBlock(), false, true)}
      <div className={pagePaddingClassName}>
        {singleColumnSectionIds.map(id => (
          <React.Fragment key={id}>
            {renderSectionFrame(id, renderSection(id))}
          </React.Fragment>
        ))}
      </div>
    </div>
  ) : (
    <div className={pagePaddingClassName}>
      {renderSectionFrame('contact', renderHeaderBlock())}
      {singleColumnSectionIds.map(id => (
        <React.Fragment key={id}>
          {renderSectionFrame(id, renderSection(id))}
        </React.Fragment>
      ))}
    </div>
  )

  return (
    <div style={{ fontFamily: fontFamily || undefined }} className="w-[794px] min-h-[1123px] bg-white flex flex-col">
      {bodyContent}
    </div>
  )
}

// ─── Helper Components ───────────────────────────────────────────────────────────

function SectionHeading({
  title,
  accent,
  density,
  styleVariant,
}: {
  title: string
  accent: string
  density: 'compressed' | 'relaxed'
  styleVariant: UniversalConfig['sectionHeadingStyle']
}) {
  const isCompressed = density === 'compressed'
  const spacingClassName = isCompressed ? 'mt-3 mb-1.5' : 'mt-6 mb-3'

  if (styleVariant === 'latex-rule') {
    return (
      <h2
        className="mt-3 mb-1 border-b border-black pb-[1px] text-[18px] font-normal leading-none text-black"
        style={{ fontVariantCaps: 'small-caps' }}
      >
        {title}
      </h2>
    )
  }

  if (styleVariant === 'minimal') {
    return (
      <h2 className={`text-[13px] font-semibold text-gray-900 ${spacingClassName}`}>
        {title}
      </h2>
    )
  }

  if (styleVariant === 'label') {
    return (
      <div className={`flex items-center gap-3 ${spacingClassName}`}>
        <span style={{ color: accent }} className="text-[10px] font-bold uppercase tracking-[0.22em]">
          {title}
        </span>
        <span className="h-px flex-1 bg-gray-200" />
      </div>
    )
  }

  return (
    <h2 style={{ color: accent }} className={`text-xs font-bold uppercase tracking-widest border-b border-gray-200 pb-1 ${spacingClassName}`}>
      {title}
    </h2>
  )
}

function SidebarLabel({ text, accent }: { text: string; accent: string }) {
  return (
    <p style={{ color: accent }} className="text-[10px] font-bold uppercase tracking-widest opacity-70 mt-3 mb-0.5">
      {text}
    </p>
  )
}

function GhostHintText({
  children,
  isSidebarContext,
  className = '',
  navigatePath,
  onNavigateToField,
}: {
  children: React.ReactNode
  isSidebarContext: boolean
  className?: string
  navigatePath?: string
  onNavigateToField?: (path: string) => void
}) {
  const baseClassName = `${isSidebarContext ? 'text-[10px]' : 'text-sm'} break-words italic text-gray-300 ${className}`

  if (navigatePath && onNavigateToField) {
    return (
      <button
        type="button"
        onClick={() => onNavigateToField(navigatePath)}
        className={`${baseClassName} block w-full cursor-text text-left transition-colors hover:text-gray-400 focus:outline-none`}
      >
        {children}
      </button>
    )
  }

  return <p aria-hidden="true" className={`${baseClassName} pointer-events-none select-none`}>{children}</p>
}

function GhostHintList({
  items,
  isSidebarContext,
  navigatePath,
  onNavigateToField,
}: {
  items: string[]
  isSidebarContext: boolean
  navigatePath?: string
  onNavigateToField?: (path: string) => void
}) {
  const isInteractive = Boolean(navigatePath && onNavigateToField)

  return (
    <ul aria-hidden={isInteractive ? undefined : 'true'} className={`${isSidebarContext ? 'mt-1 space-y-1' : 'mt-1.5 space-y-1'}`}>
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="shrink-0 text-gray-300">•</span>
          <GhostHintText
            isSidebarContext={isSidebarContext}
            className="min-w-0"
            navigatePath={navigatePath}
            onNavigateToField={onNavigateToField}
          >
            {item}
          </GhostHintText>
        </li>
      ))}
    </ul>
  )
}

function SectionFocusFrame({
  children,
  isActive,
  isSidebarContext,
  isDarkSurface,
}: {
  children: React.ReactNode
  isActive: boolean
  isSidebarContext?: boolean
  isDarkSurface?: boolean
}) {
  if (!isActive) {
    return <>{children}</>
  }

  const insetClassName = isSidebarContext ? '-inset-x-3 -inset-y-2.5' : '-inset-x-4 -inset-y-3'
  const surfaceClassName = isDarkSurface
    ? 'border-white/65 bg-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.16),0_16px_36px_rgba(15,23,42,0.18)]'
    : 'border-emerald-300/80 bg-emerald-50/70 shadow-[0_0_0_1px_rgba(16,185,129,0.12),0_16px_36px_rgba(16,185,129,0.12)]'

  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute ${insetClassName} rounded-[22px] border transition-all duration-150 ${surfaceClassName}`}
      />
      <div className="pointer-events-none absolute -top-2 right-0 z-10">
        <span className="rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white shadow-sm">
          Editing
        </span>
      </div>
      <div className="relative z-[1]">{children}</div>
    </div>
  )
}

interface ExperienceItemProps {
  exp: {
    company?: string
    title?: string
    name?: string
    location?: string
    startDate?: string
    endDate?: string
    date?: string
    bullets?: string[]
    highlights?: string[]
  }
  ei: number
  pathPrefix: string
  isEditing?: boolean
  onFieldChange?: (path: string, value: string) => void
  accent: string
  density: 'compressed' | 'relaxed'
  bulletStyle: UniversalConfig['bulletStyle']
  dateLayout: UniversalConfig['dateLayout']
  onNavigateToField?: (path: string) => void
}

function ExperienceItem({
  exp,
  ei,
  pathPrefix,
  isEditing,
  onFieldChange,
  accent,
  density,
  bulletStyle,
  dateLayout,
  onNavigateToField,
}: ExperienceItemProps) {
  const isCompressed = density === 'compressed'
  const bulletMarker = bulletStyle === 'dash' ? '–' : bulletStyle === 'square' ? '▪' : '•'
  const showRightDate = dateLayout === 'right'
  const dateContent = (exp.startDate || exp.endDate || exp.date) ? (
    <>
      {exp.startDate ? (
        <EditableText
          value={exp.startDate}
          path={`${pathPrefix}.${ei}.startDate`}
          isEditing={isEditing}
          onFieldChange={onFieldChange}
          onNavigateToField={onNavigateToField}
        />
      ) : exp.date ? (
        <EditableText
          value={exp.date}
          path={`${pathPrefix}.${ei}.date`}
          isEditing={isEditing}
          onFieldChange={onFieldChange}
          onNavigateToField={onNavigateToField}
        />
      ) : null}
      {exp.endDate ? (
        <>
          {' - '}
          <EditableText
            value={exp.endDate}
            path={`${pathPrefix}.${ei}.endDate`}
            isEditing={isEditing}
            onFieldChange={onFieldChange}
            onNavigateToField={onNavigateToField}
          />
        </>
      ) : null}
    </>
  ) : null

  if (bulletStyle === 'latex') {
    const bulletItems = exp.bullets && exp.bullets.length > 0 ? exp.bullets : exp.highlights ?? []
    const bulletPath = exp.bullets && exp.bullets.length > 0 ? 'bullets' : 'highlights'

    return (
      <div className="pl-[14px] text-black">
        <div className="flex items-start justify-between gap-4">
          <EditableText
            value={exp.title || exp.name}
            path={`${pathPrefix}.${ei}.title`}
            isEditing={isEditing}
            onFieldChange={onFieldChange}
            onNavigateToField={onNavigateToField}
            className="min-w-0 flex-1 break-words text-[15px] font-bold leading-[1.12] text-black"
          />
          {dateContent && (
            <span className="ml-4 shrink-0 text-right text-[15px] leading-[1.12] text-black">
              {dateContent}
            </span>
          )}
        </div>

        {(exp.company || exp.location) && (
          <div className="mt-[1px] flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              {exp.company && (
                <EditableText
                  value={exp.company}
                  path={`${pathPrefix}.${ei}.company`}
                  isEditing={isEditing}
                  onFieldChange={onFieldChange}
                  onNavigateToField={onNavigateToField}
                  className="block break-words text-[13px] italic leading-[1.15] text-black"
                />
              )}
            </div>
            {exp.location && (
              <EditableText
                value={exp.location}
                path={`${pathPrefix}.${ei}.location`}
                isEditing={isEditing}
                onFieldChange={onFieldChange}
                onNavigateToField={onNavigateToField}
                className="ml-4 shrink-0 text-right text-[13px] italic leading-[1.15] text-black"
              />
            )}
          </div>
        )}

        {bulletItems.length > 0 && (
          <ul className="mt-[2px] list-disc space-y-0 pl-[22px] text-[13px] leading-[1.22] text-black">
            {bulletItems.map((b: string, bi: number) => (
              <li key={bi} className="pl-0">
                <EditableText
                  value={b}
                  path={`${pathPrefix}.${ei}.${bulletPath}.${bi}`}
                  isEditing={isEditing}
                  onFieldChange={onFieldChange}
                  onNavigateToField={onNavigateToField}
                  className="break-words text-[13px] leading-[1.22] text-black"
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className={`items-start ${showRightDate ? 'flex justify-between gap-4' : ''}`}>
        <div className="min-w-0 flex-1">
          <EditableText value={exp.title || exp.name} path={`${pathPrefix}.${ei}.title`} isEditing={isEditing} onFieldChange={onFieldChange} onNavigateToField={onNavigateToField} className="text-sm font-semibold text-gray-900 break-words" />
          {exp.company && (
            <EditableText value={exp.company} path={`${pathPrefix}.${ei}.company`} isEditing={isEditing} onFieldChange={onFieldChange} onNavigateToField={onNavigateToField} className="text-sm text-gray-600 break-words block" />
          )}
        </div>
        {showRightDate && dateContent && (
          <span className={`text-gray-400 shrink-0 ml-4 ${isCompressed ? 'text-[11px]' : 'text-xs'}`}>
            {dateContent}
          </span>
        )}
      </div>

      {exp.location && <p className={`text-gray-400 ${isCompressed ? 'text-[11px] mt-0.5' : 'text-xs mt-0.5'}`}>{exp.location}</p>}
      {!showRightDate && dateContent && (
        <span className={`mt-0.5 block text-gray-400 ${isCompressed ? 'text-[11px]' : 'text-xs'}`}>
          {dateContent}
        </span>
      )}

      {exp.bullets && exp.bullets.length > 0 && (
        <ul className={`${isCompressed ? 'mt-0.5 space-y-0.5' : 'mt-1.5 space-y-1'}`}>
          {exp.bullets.map((b: string, bi: number) => (
            <li key={bi} className="flex gap-2">
              <span style={{ color: accent, opacity: 0.7 }} className={`shrink-0 text-base ${isCompressed ? 'mt-0' : 'mt-0.5'}`}>{bulletMarker}</span>
              <EditableText value={b} path={`${pathPrefix}.${ei}.bullets.${bi}`} isEditing={isEditing} onFieldChange={onFieldChange} onNavigateToField={onNavigateToField} className={`text-sm text-gray-700 break-words ${isCompressed ? 'leading-tight' : 'leading-normal'}`} />
            </li>
          ))}
        </ul>
      )}
      {exp.highlights && exp.highlights.length > 0 && (
        <ul className={`${isCompressed ? 'mt-0.5 space-y-0.5' : 'mt-1.5 space-y-1'}`}>
          {exp.highlights.map((b: string, bi: number) => (
            <li key={bi} className="flex gap-2">
              <span style={{ color: accent, opacity: 0.7 }} className={`shrink-0 text-base ${isCompressed ? 'mt-0' : 'mt-0.5'}`}>{bulletMarker}</span>
              <EditableText value={b} path={`${pathPrefix}.${ei}.highlights.${bi}`} isEditing={isEditing} onFieldChange={onFieldChange} onNavigateToField={onNavigateToField} className={`text-sm text-gray-700 break-words ${isCompressed ? 'leading-tight' : 'leading-normal'}`} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

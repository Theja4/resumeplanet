'use client'

import React from 'react'
import { sanitizeUniversalConfig } from '@/lib/templateOptions'
import { getEducationDateLabel, getProjectBullets, normalizeSkillSections } from '@/lib/resume-data'
import EditableText from './EditableText'
import type { TemplateProps, UniversalConfig } from '@/types'
import { DEFAULT_VISIBILITY } from '@/types'

interface UniversalTemplateProps extends TemplateProps {
  config: UniversalConfig
  onNavigateToField?: (path: string) => void
}

export default function UniversalTemplate({
  data,
  isEditing,
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
  const isCenteredHeader = headerStyle === 'centered'
  const isClassicHeader = headerStyle === 'classic'
  const isCompactHeader = headerStyle === 'compact'
  const nameClassName =
    nameSize === 'hero'
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

  function renderTags(tags: string[], pathPrefix: string) {
    return tags.map((tag, i) => (
      <React.Fragment key={i}>
        <EditableText value={tag} path={`${pathPrefix}.${i}`} isEditing={isEditing} onFieldChange={onFieldChange} onNavigateToField={onNavigateToField} className="text-sm text-gray-700" />
        {i < tags.length - 1 && <span className="text-gray-400">, </span>}
      </React.Fragment>
    ))
  }

  function renderSkills(
    sections: Array<{ title: string; skills: string[] }>,
    isSidebarContext: boolean,
    accentValue: string
  ) {
    const normalizedSections = normalizeSkillSections(sections)

    if (skillsStyle === 'stacked') {
      return (
        <div className={`${isSidebarContext ? 'mt-1 space-y-2' : 'mt-1.5 space-y-2'}`}>
          {normalizedSections.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              {section.title && (
                <EditableText
                  value={section.title}
                  path={`skillSections.${sectionIndex}.title`}
                  isEditing={isEditing}
                  onFieldChange={onFieldChange}
                  onNavigateToField={onNavigateToField}
                  className={`${isSidebarContext ? 'text-[10px]' : 'text-xs'} font-semibold uppercase tracking-[0.14em] text-gray-500`}
                />
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
              <EditableText
                value={section.title}
                path={`skillSections.${sectionIndex}.title`}
                isEditing={isEditing}
                onFieldChange={onFieldChange}
                onNavigateToField={onNavigateToField}
                className={`${isSidebarContext ? 'text-[10px]' : 'text-xs'} mr-2 font-semibold uppercase tracking-[0.14em] text-gray-500`}
              />
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

  function renderContactInfo(centered: boolean) {
    if (contactItems.length === 0) return null

    const baseClassName = isCompressed ? 'text-xs text-gray-500 break-words' : 'text-sm text-gray-500 break-words'

    if (contactStyle === 'stacked') {
      return (
        <div className={`mt-3 space-y-1 ${centered ? 'text-center' : ''}`}>
          {contactItems.map((item) => (
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
        {contactItems.map((item) => (
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
    return (
      <div className={isCenteredHeader ? 'mb-7 text-center' : isCompactHeader ? 'mb-4' : isCompressed ? 'mb-5' : 'mb-7'}>
        <EditableText
          value={data.name}
          path="name"
          isEditing={isEditing}
          onFieldChange={onFieldChange}
          onNavigateToField={onNavigateToField}
          className={`${nameClassName} font-bold text-gray-900 break-words tracking-tight leading-[0.95] ${isCenteredHeader ? 'text-center' : ''}`}
          as="h1"
          fallback="Your Name"
        />
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

        {isClassicHeader && <div className="mt-4 h-px w-full bg-gray-200" />}

        {renderContactInfo(isCenteredHeader)}
      </div>
    )
  }

  function renderSection(id: string, isSidebarContext: boolean = false) {
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
            <div className={isCompressed ? 'space-y-3' : 'space-y-5'}>
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
        return data.summary ? (
          <div>
            {isSidebarContext ? <SidebarLabel text="Summary" accent={accent} /> : <SectionHeading title="Summary" accent={accent} density={density} styleVariant={sectionHeadingStyle} />}
            <EditableText value={data.summary} path="summary" isEditing={isEditing} onFieldChange={onFieldChange} onNavigateToField={onNavigateToField} className={`${isSidebarContext ? 'text-[11px]' : 'text-sm'} text-gray-700 break-words ${isCompressed ? 'leading-snug' : 'leading-relaxed'}`} as="p" />
          </div>
        ) : null

      case 'experience':
        return data.experience.length > 0 ? (
          <div>
            {isSidebarContext ? <SidebarLabel text="Work Experience" accent={accent} /> : <SectionHeading title="Work Experience" accent={accent} density={density} styleVariant={sectionHeadingStyle} />}
            <div className={isCompressed ? 'space-y-3' : 'space-y-5'}>
              {data.experience.map((exp, ei) => (
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
              ))}
            </div>
          </div>
        ) : null

      case 'education':
        return data.education.length > 0 ? (
          <div>
            {isSidebarContext ? <SidebarLabel text="Education" accent={accent} /> : <SectionHeading title="Education" accent={accent} density={density} styleVariant={sectionHeadingStyle} />}
            <div className={isCompressed ? 'space-y-1.5' : 'space-y-3'}>
              {data.education.map((edu, i) => (
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
              ))}
            </div>
          </div>
        ) : null

      case 'skills':
        return ((data.skillSections?.length ?? 0) > 0 || data.skills.length > 0) ? (
          <div>
            {isSidebarContext ? <SidebarLabel text="Skills" accent={accent} /> : <SectionHeading title="Skills" accent={accent} density={density} styleVariant={sectionHeadingStyle} />}
            <div className={`${isSidebarContext ? 'text-[11px]' : 'text-sm'} text-gray-700 leading-relaxed`}>
              {renderSkills(data.skillSections?.length ? data.skillSections : [{ title: 'Core Skills', skills: data.skills }], isSidebarContext, accent)}
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
            <div className={isCompressed ? 'space-y-3' : 'space-y-5'}>
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
        return data.projects.length > 0 ? (
          <div>
            {isSidebarContext ? <SidebarLabel text="Projects" accent={accent} /> : <SectionHeading title="Projects" accent={accent} density={density} styleVariant={sectionHeadingStyle} />}
            <div className={isCompressed ? 'space-y-3' : 'space-y-5'}>
              {data.projects.map((proj, i) => (
                <div key={i}>
                  <div className="flex justify-between items-start">
                    <EditableText value={proj.name} path={`projects.${i}.name`} isEditing={isEditing} onFieldChange={onFieldChange} onNavigateToField={onNavigateToField} className={isSidebarContext ? 'text-[11px] font-semibold text-gray-900' : 'text-sm font-semibold text-gray-900'} />
                  </div>
                  {proj.description && (
                    <EditableText value={proj.description} path={`projects.${i}.description`} isEditing={isEditing} onFieldChange={onFieldChange} onNavigateToField={onNavigateToField} className={`${isSidebarContext ? 'text-[10px]' : 'text-sm'} text-gray-600 mt-0.5 leading-relaxed`} as="p" />
                  )}
                  {getProjectBullets(proj).length > 0 && (
                    <div className="mt-1.5 space-y-1">
                      {getProjectBullets(proj).map((bullet, bulletIndex) => (
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
              ))}
            </div>
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
  const bodyContent = isSidebar ? (
    <div className={`flex flex-1 ${isSidebarRight ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Sidebar */}
      <div style={{ backgroundColor: `${accent}15` }} className={`${sidebarWidth} shrink-0 text-gray-900 p-8 flex flex-col gap-1 min-h-full`}>
        {(sidebarSectionOrder || DEFAULT_VISIBILITY.sidebarSectionOrder || []).map(id => (
          <React.Fragment key={id}>
            {renderSection(id, true)}
          </React.Fragment>
        ))}
      </div>

      {/* Main Column */}
      <div className="flex-1 p-10 pt-12 text-gray-900">
        {renderHeaderBlock()}
        {(sectionOrder || DEFAULT_VISIBILITY.sectionOrder || [])
          .filter(id => id !== 'contact') // Safety filter for redundant contact sections
          .filter(id => !(sidebarSectionOrder || DEFAULT_VISIBILITY.sidebarSectionOrder || []).includes(id))
          .map(id => (
            <React.Fragment key={id}>
              {renderSection(id)}
            </React.Fragment>
          ))}
      </div>
    </div>
  ) : isBannerHeader ? (
    <div className="flex flex-col">
      {renderBannerHeaderBlock()}
      <div className={isCompressed ? 'p-8' : 'p-12'}>
        {singleColumnSectionIds.map(id => (
          <React.Fragment key={id}>
            {renderSection(id)}
          </React.Fragment>
        ))}
      </div>
    </div>
  ) : (
    <div className={isCompressed ? 'p-8' : 'p-12'}>
      {renderHeaderBlock()}
      {singleColumnSectionIds.map(id => (
        <React.Fragment key={id}>
          {renderSection(id)}
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

'use client'

import React from 'react'
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
  const {
    layout,
    headerStyle,
    bulletStyle,
    skillsStyle,
    accentColor,
    fontFamily,
    density = 'relaxed',
  } = config

  const accent = accentColor || '#4F46E5'
  const isCompressed = density === 'compressed'
  const isSidebar = layout === 'sidebar' || layout === 'sidebar-left' || layout === 'sidebar-right'
  const isSidebarRight = layout === 'sidebar-right'
  const showBanner = headerStyle === 'banner'

  function renderTags(tags: string[], pathPrefix: string) {
    return tags.map((tag, i) => (
      <React.Fragment key={i}>
        <EditableText value={tag} path={`${pathPrefix}.${i}`} isEditing={isEditing} onFieldChange={onFieldChange} onNavigateToField={onNavigateToField} className="text-sm text-gray-700" />
        {i < tags.length - 1 && <span className="text-gray-400">, </span>}
      </React.Fragment>
    ))
  }

  function renderSkills(skills: string[], compressed: boolean, accent: string) {
    if (skillsStyle === 'badges') {
      return (
        <div className="flex flex-wrap gap-1 mt-1">
          {skills.map((skill, i) => (
            <span key={i} style={{ backgroundColor: `${accent}15`, color: accent }} className="inline-block text-[10px] px-2 py-0.5 rounded font-medium">
              <EditableText value={skill} path={`skills.${i}`} isEditing={isEditing} onFieldChange={onFieldChange} onNavigateToField={onNavigateToField} />
            </span>
          ))}
        </div>
      )
    }
    return (
      <div className="mt-1">
        {skills.map((skill, i) => (
          <React.Fragment key={i}>
            <EditableText value={skill} path={`skills.${i}`} isEditing={isEditing} onFieldChange={onFieldChange} onNavigateToField={onNavigateToField} />
            {i < skills.length - 1 && <span className="text-gray-400">, </span>}
          </React.Fragment>
        ))}
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
            {isSidebarContext ? <SidebarLabel text={custom.title} accent={accent} /> : <SectionHeading title={custom.title} accent={accent} density={density} />}
            <EditableText value={custom.text} path={`${id}.text`} isEditing={isEditing} onFieldChange={onFieldChange} onNavigateToField={onNavigateToField} className={`${isSidebarContext ? 'text-[11px]' : 'text-sm'} text-gray-700 break-words ${isCompressed ? 'leading-snug' : 'leading-relaxed'}`} as="p" />
          </div>
        )
      }

      if (custom.type === 'tags' && custom.tags && custom.tags.length > 0) {
        return (
          <div className={isSidebarContext ? 'mt-4' : ''}>
            {isSidebarContext ? <SidebarLabel text={custom.title} accent={accent} /> : <SectionHeading title={custom.title} accent={accent} density={density} />}
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
            {isSidebarContext ? <SidebarLabel text={custom.title} accent={accent} /> : <SectionHeading title={custom.title} accent={accent} density={density} />}
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
            {isSidebarContext ? <SidebarLabel text="Summary" accent={accent} /> : <SectionHeading title="Summary" accent={accent} density={density} />}
            <EditableText value={data.summary} path="summary" isEditing={isEditing} onFieldChange={onFieldChange} onNavigateToField={onNavigateToField} className={`${isSidebarContext ? 'text-[11px]' : 'text-sm'} text-gray-700 break-words ${isCompressed ? 'leading-snug' : 'leading-relaxed'}`} as="p" />
          </div>
        ) : null

      case 'experience':
        return data.experience.length > 0 ? (
          <div>
            {isSidebarContext ? <SidebarLabel text="Experience" accent={accent} /> : <SectionHeading title="Experience" accent={accent} density={density} />}
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
                  onNavigateToField={onNavigateToField}
                />
              ))}
            </div>
          </div>
        ) : null

      case 'education':
        return data.education.length > 0 ? (
          <div>
            {isSidebarContext ? <SidebarLabel text="Education" accent={accent} /> : <SectionHeading title="Education" accent={accent} density={density} />}
            <div className={isCompressed ? 'space-y-1.5' : 'space-y-3'}>
              {data.education.map((edu, i) => (
                <div key={i} className="flex justify-between items-start">
                  <div>
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
                  {edu.graduationDate && (
                    <EditableText
                      value={edu.graduationDate}
                      path={`education.${i}.graduationDate`}
                      isEditing={isEditing}
                      onFieldChange={onFieldChange}
                      onNavigateToField={onNavigateToField}
                      className={`text-gray-400 shrink-0 ml-4 ${isSidebarContext || isCompressed ? 'text-[10px]' : 'text-xs'}`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : null

      case 'skills':
        return data.skills.length > 0 ? (
          <div>
            {isSidebarContext ? <SidebarLabel text="Skills" accent={accent} /> : <SectionHeading title="Skills" accent={accent} density={density} />}
            <div className={`${isSidebarContext ? 'text-[11px]' : 'text-sm'} text-gray-700 leading-relaxed`}>
              {renderSkills(data.skills, isCompressed || isSidebarContext, accent)}
            </div>
          </div>
        ) : null

      case 'certifications':
        return data.certifications.length > 0 ? (
          <div>
            {isSidebarContext ? <SidebarLabel text="Certifications" accent={accent} /> : <SectionHeading title="Certifications" accent={accent} density={density} />}
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
            {isSidebarContext ? <SidebarLabel text="Volunteer" accent={accent} /> : <SectionHeading title="Volunteer" accent={accent} density={density} />}
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
                />
              ))}
            </div>
          </div>
        ) : null

      case 'languages':
        return data.languages.length > 0 ? (
          <div>
            {isSidebarContext ? <SidebarLabel text="Languages" accent={accent} /> : <SectionHeading title="Languages" accent={accent} density={density} />}
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
            {isSidebarContext ? <SidebarLabel text="Projects" accent={accent} /> : <SectionHeading title="Projects" accent={accent} density={density} />}
            <div className={isCompressed ? 'space-y-3' : 'space-y-5'}>
              {data.projects.map((proj, i) => (
                <div key={i}>
                  <div className="flex justify-between items-start">
                    <EditableText value={proj.name} path={`projects.${i}.name`} isEditing={isEditing} onFieldChange={onFieldChange} onNavigateToField={onNavigateToField} className={isSidebarContext ? 'text-[11px] font-semibold text-gray-900' : 'text-sm font-semibold text-gray-900'} />
                  </div>
                  <EditableText value={proj.description} path={`projects.${i}.description`} isEditing={isEditing} onFieldChange={onFieldChange} onNavigateToField={onNavigateToField} className={`${isSidebarContext ? 'text-[10px]' : 'text-sm'} text-gray-600 mt-0.5 leading-relaxed`} as="p" />
                </div>
              ))}
            </div>
          </div>
        ) : null

      case 'awards':
        return data.awards.length > 0 ? (
          <div>
            {isSidebarContext ? <SidebarLabel text="Awards" accent={accent} /> : <SectionHeading title="Awards" accent={accent} density={density} />}
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
            {isSidebarContext ? <SidebarLabel text="Interests" accent={accent} /> : <SectionHeading title="Interests" accent={accent} density={density} />}
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
            {isSidebarContext ? <SidebarLabel text="Publications" accent={accent} /> : <SectionHeading title="Publications" accent={accent} density={density} />}
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
            {isSidebarContext ? <SidebarLabel text="References" accent={accent} /> : <SectionHeading title="References" accent={accent} density={density} />}
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

  // Render Header
  let headerElement: React.ReactNode = null

  if (showBanner) {
    headerElement = (
      <div style={{ backgroundColor: accent }} className="w-full min-h-[160px] py-10 px-12 flex items-start justify-between gap-8 text-white overflow-hidden shrink-0">
        <div className="flex flex-col flex-1 min-w-0 max-w-[62%] pr-4">
          <EditableText
            value={data.name}
            path="name"
            isEditing={isEditing}
            onFieldChange={onFieldChange}
            onNavigateToField={onNavigateToField}
            className="block m-0 text-4xl font-black leading-[0.95] break-words uppercase tracking-tight"
            as="h1"
            fallback="Your Name"
          />
          <EditableText
            value={data.currentRole}
            path="currentRole"
            isEditing={isEditing}
            onFieldChange={onFieldChange}
            onNavigateToField={onNavigateToField}
            className="block m-0 mt-3 text-base font-bold leading-tight text-white/80 uppercase tracking-[0.18em] break-words"
            fallback="Your Professional Title"
          />
        </div>

        <div className="flex w-[190px] shrink-0 flex-col items-end gap-1 text-right text-[11px] font-medium leading-tight text-white/90">
          {data.email && <EditableText value={data.email} path="email" isEditing={isEditing} onFieldChange={onFieldChange} onNavigateToField={onNavigateToField} className="hover:text-white transition-colors" />}
          {data.phone && <EditableText value={data.phone} path="phone" isEditing={isEditing} onFieldChange={onFieldChange} onNavigateToField={onNavigateToField} className="hover:text-white transition-colors" />}
          {data.linkedin && <EditableText value={data.linkedin} path="linkedin" isEditing={isEditing} onFieldChange={onFieldChange} onNavigateToField={onNavigateToField} className="hover:text-white transition-colors" />}
          {data.location && <EditableText value={data.location} path="location" isEditing={isEditing} onFieldChange={onFieldChange} onNavigateToField={onNavigateToField} className="hover:text-white transition-colors" />}
          {data.website && <EditableText value={data.website} path="website" isEditing={isEditing} onFieldChange={onFieldChange} onNavigateToField={onNavigateToField} className="hover:text-white transition-colors" />}
        </div>
      </div>
    )
  }

  const sidebarWidth = isCompressed ? 'w-48' : 'w-64'
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
        {!showBanner && (
          <div className="mb-8">
            <EditableText value={data.name} path="name" isEditing={isEditing} onFieldChange={onFieldChange} onNavigateToField={onNavigateToField} className="text-3xl font-bold text-gray-900 break-words leading-tight" as="h1" fallback="Your Name" />
            <EditableText value={data.currentRole} path="currentRole" isEditing={isEditing} onFieldChange={onFieldChange} onNavigateToField={onNavigateToField} style={{ color: accent }} className="text-base font-semibold mt-1 uppercase tracking-wide block" fallback="Your Professional Title" />
            <div className={`flex flex-wrap ${isCompressed ? 'gap-x-3 gap-y-1 mt-2' : 'gap-x-4 gap-y-1.5 mt-4'}`}>
              {data.email && <EditableText value={data.email} path="email" isEditing={isEditing} onFieldChange={onFieldChange} onNavigateToField={onNavigateToField} className="text-sm text-gray-500 break-words" />}
              {data.phone && <EditableText value={data.phone} path="phone" isEditing={isEditing} onFieldChange={onFieldChange} onNavigateToField={onNavigateToField} className="text-sm text-gray-500 break-words" />}
              {data.location && <EditableText value={data.location} path="location" isEditing={isEditing} onFieldChange={onFieldChange} onNavigateToField={onNavigateToField} className="text-sm text-gray-500 break-words" />}
            </div>
          </div>
        )}
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
  ) : (
    <div className={isCompressed ? 'p-8' : 'p-12'}>
      {!showBanner && (
        <div className="mb-6 text-center">
          <EditableText value={data.name} path="name" isEditing={isEditing} onFieldChange={onFieldChange} onNavigateToField={onNavigateToField} className="text-4xl font-bold text-gray-900 break-words tracking-tight" as="h1" fallback="Your Name" />
          <EditableText value={data.currentRole} path="currentRole" isEditing={isEditing} onFieldChange={onFieldChange} onNavigateToField={onNavigateToField} style={{ color: accent }} className="text-lg font-semibold mt-1 uppercase tracking-widest block" fallback="Your Professional Title" />
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-3">
             {data.email && <EditableText value={data.email} path="email" isEditing={isEditing} onFieldChange={onFieldChange} onNavigateToField={onNavigateToField} className="text-sm text-gray-500" />}
             {data.phone && <EditableText value={data.phone} path="phone" isEditing={isEditing} onFieldChange={onFieldChange} onNavigateToField={onNavigateToField} className="text-sm text-gray-500" />}
          </div>
        </div>
      )}
      {[...(sectionOrder || DEFAULT_VISIBILITY.sectionOrder || []), ...(sidebarSectionOrder || DEFAULT_VISIBILITY.sidebarSectionOrder || [])]
        .filter((v, i, a) => a.indexOf(v) === i)
        .filter(id => id !== 'contact') // Safety filter
        .map(id => (
          <React.Fragment key={id}>
            {renderSection(id)}
          </React.Fragment>
        ))}
    </div>
  )

  return (
    <div style={{ fontFamily: fontFamily || undefined }} className="w-[794px] min-h-[1123px] bg-white flex flex-col">
      {headerElement}
      {bodyContent}
    </div>
  )
}

// ─── Helper Components ───────────────────────────────────────────────────────────

function SectionHeading({ title, accent, density }: { title: string; accent: string; density: 'compressed' | 'relaxed' }) {
  const isCompressed = density === 'compressed'
  return (
    <h2 style={{ color: accent }} className={`text-xs font-bold uppercase tracking-widest border-b border-gray-200 pb-1 transition-all duration-300 ${isCompressed ? 'mt-3 mb-1.5' : 'mt-6 mb-3'}`}>
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
  exp: any
  ei: number
  pathPrefix: string
  isEditing?: boolean
  onFieldChange?: (path: string, value: string) => void
  accent: string
  density: 'compressed' | 'relaxed'
  bulletStyle: 'plain' | 'timeline'
  onNavigateToField?: (path: string) => void
}

function ExperienceItem({ exp, ei, pathPrefix, isEditing, onFieldChange, accent, density, bulletStyle, onNavigateToField }: ExperienceItemProps) {
  const isCompressed = density === 'compressed'
  const isTimeline = bulletStyle === 'timeline'

  return (
    <div className={isTimeline ? 'relative border-l-2 border-gray-200 ml-2 pl-5 pb-5' : ''}>
      {isTimeline && <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full" style={{ backgroundColor: accent }} />}

      <div className="flex justify-between items-start">
        <div>
          <EditableText value={exp.title || exp.name} path={`${pathPrefix}.${ei}.title`} isEditing={isEditing} onFieldChange={onFieldChange} onNavigateToField={onNavigateToField} className="text-sm font-semibold text-gray-900 break-words" />
          {exp.company && (
            <EditableText value={exp.company} path={`${pathPrefix}.${ei}.company`} isEditing={isEditing} onFieldChange={onFieldChange} onNavigateToField={onNavigateToField} className="text-sm text-gray-600 break-words block" />
          )}
        </div>
        {(exp.startDate || exp.endDate || exp.date) && (
          <span className={`text-gray-400 shrink-0 ml-4 ${isCompressed ? 'text-[11px]' : 'text-xs'}`}>
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
          </span>
        )}
      </div>

      {exp.location && <p className={`text-gray-400 ${isCompressed ? 'text-[11px] mt-0.5' : 'text-xs mt-0.5'}`}>{exp.location}</p>}

      {exp.bullets && exp.bullets.length > 0 && (
        <ul className={`${isCompressed ? 'mt-0.5 space-y-0.5' : 'mt-1.5 space-y-1'}`}>
          {exp.bullets.map((b: string, bi: number) => (
            <li key={bi} className="flex gap-2">
              <span style={{ color: accent, opacity: 0.7 }} className={`shrink-0 text-base ${isCompressed ? 'mt-0' : 'mt-0.5'}`}>•</span>
              <EditableText value={b} path={`${pathPrefix}.${ei}.bullets.${bi}`} isEditing={isEditing} onFieldChange={onFieldChange} onNavigateToField={onNavigateToField} className={`text-sm text-gray-700 break-words ${isCompressed ? 'leading-tight' : 'leading-normal'}`} />
            </li>
          ))}
        </ul>
      )}
      {exp.highlights && exp.highlights.length > 0 && (
        <ul className={`${isCompressed ? 'mt-0.5 space-y-0.5' : 'mt-1.5 space-y-1'}`}>
          {exp.highlights.map((b: string, bi: number) => (
            <li key={bi} className="flex gap-2">
              <span style={{ color: accent, opacity: 0.7 }} className={`shrink-0 text-base ${isCompressed ? 'mt-0' : 'mt-0.5'}`}>•</span>
              <EditableText value={b} path={`${pathPrefix}.${ei}.highlights.${bi}`} isEditing={isEditing} onFieldChange={onFieldChange} onNavigateToField={onNavigateToField} className={`text-sm text-gray-700 break-words ${isCompressed ? 'leading-tight' : 'leading-normal'}`} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

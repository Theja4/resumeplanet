import React from 'react'
import EditableText from './EditableText'
import type { TemplateProps } from '@/types'

function SectionHeading({ title }: { title: string }) {
  return (
    <h2 className="text-sm font-bold uppercase tracking-wide text-gray-800 border-b border-gray-300 pb-1 mt-4 mb-3">
      {title}
    </h2>
  )
}

const DEFAULT_SECTION_ORDER = [
  'summary', 'education', 'skills', 'experience',
  'projects', 'certifications', 'languages', 'volunteer',
  'awards', 'publications', 'interests', 'references',
]

export default function GraduateEntry({ data, isEditing, onFieldChange, sectionOrder }: TemplateProps) {
  function renderSection(id: string) {
    if (id.startsWith('custom_')) {
      const custom = data.customSections?.find(c => c.id === id)
      if (!custom) return null

      if (custom.type === 'text' && custom.text && custom.text.trim()) {
        return (
          <>
            <SectionHeading title={custom.title} />
            <EditableText value={custom.text} path={`custom_${id}.text`} isEditing={isEditing} onFieldChange={onFieldChange} className="text-sm text-gray-700 leading-relaxed break-words" as="p" />
          </>
        )
      }
      
      if (custom.type === 'tags' && custom.tags && custom.tags.length > 0) {
        return (
          <>
            <SectionHeading title={custom.title} />
            {custom.tags.length > 8 ? (
              <div className="grid grid-cols-2 gap-x-8 gap-y-0.5">
                {custom.tags.map((tag, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-emerald-500 shrink-0" />
                    <EditableText value={tag} path={`custom_${id}.tags.${i}`} isEditing={isEditing} onFieldChange={onFieldChange} className="text-sm text-gray-700 break-words" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-700">
                <span>
                  {custom.tags.map((tag, i) => (
                    <React.Fragment key={i}>
                      <EditableText value={tag} path={`custom_${id}.tags.${i}`} isEditing={isEditing} onFieldChange={onFieldChange} className="text-sm text-gray-700" />
                      {i < (custom.tags?.length || 0) - 1 && <span className="text-gray-400">, </span>}
                    </React.Fragment>
                  ))}
                </span>
              </p>
            )}
          </>
        )
      }

      if (custom.type === 'complex' && custom.items && custom.items.length > 0) {
        return (
          <>
            <SectionHeading title={custom.title} />
            <div className="space-y-4">
              {custom.items.map((exp, ei) => (
                <div key={ei}>
                  <div className="flex justify-between items-start">
                    <div>
                      <EditableText value={exp.title} path={`custom_${id}.items.${ei}.title`} isEditing={isEditing} onFieldChange={onFieldChange} className="text-sm font-semibold text-gray-900 break-words" />
                      {exp.company && (
                        <>
                          <span className="text-sm text-gray-500"> · </span>
                          <EditableText value={exp.company} path={`custom_${id}.items.${ei}.company`} isEditing={isEditing} onFieldChange={onFieldChange} className="text-sm text-gray-600 break-words" />
                        </>
                      )}
                    </div>
                    {(exp.startDate || exp.endDate) && (
                      <span className="text-xs text-gray-400 shrink-0 ml-4">{exp.startDate}{exp.endDate ? ` – ${exp.endDate}` : ''}</span>
                    )}
                  </div>
                  {exp.location && <p className="text-xs text-gray-400">{exp.location}</p>}
                  {exp.bullets.length > 0 && (
                    <ul className="mt-1 space-y-1">
                      {exp.bullets.map((b, bi) => (
                        <li key={bi} className="flex gap-1.5">
                          <span className="text-emerald-500 shrink-0 mt-0.5">›</span>
                          <EditableText value={b} path={`custom_${id}.items.${ei}.bullets.${bi}`} isEditing={isEditing} onFieldChange={onFieldChange} className="text-sm text-gray-700 break-words" />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </>
        )
      }
      return null
    }

    switch (id) {
      case 'summary':
        return data.summary ? (
          <>
            <SectionHeading title="Summary" />
            <EditableText
              value={data.summary}
              path="summary"
              isEditing={isEditing}
              onFieldChange={onFieldChange}
              className="text-sm text-gray-700 leading-relaxed break-words"
              as="p"
            />
          </>
        ) : null

      case 'education':
        return data.education.length > 0 ? (
          <>
            <SectionHeading title="Education" />
            <div className="space-y-3">
              {data.education.map((edu, i) => (
                <div key={i} className="flex justify-between items-start">
                  <div>
                    <EditableText
                      value={edu.institution}
                      path={`education.${i}.institution`}
                      isEditing={isEditing}
                      onFieldChange={onFieldChange}
                      className="text-base font-bold text-gray-900 break-words"
                    />
                    <p className="text-sm text-gray-700">
                      {edu.degree}{edu.field ? ` in ${edu.field}` : ''}
                    </p>
                    {edu.gpa && (
                      <p className="text-xs text-gray-500">GPA: {edu.gpa}</p>
                    )}
                  </div>
                  {edu.graduationDate && (
                    <span className="text-sm text-gray-500 shrink-0 ml-4">
                      {edu.graduationDate}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : null

      case 'skills':
        return data.skills.length > 0 ? (
          <>
            <SectionHeading title="Skills" />
            {data.skills.length > 8 ? (
              <div className="grid grid-cols-2 gap-x-8 gap-y-0.5">
                {data.skills.map((skill, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-emerald-500 shrink-0" />
                    <EditableText
                      value={skill}
                      path={`skills.${i}`}
                      isEditing={isEditing}
                      onFieldChange={onFieldChange}
                      className="text-sm text-gray-700 break-words"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-700">
                <span>
                  {data.skills.map((skill, i) => (
                    <React.Fragment key={i}>
                      <EditableText
                        value={skill}
                        path={`skills.${i}`}
                        isEditing={isEditing}
                        onFieldChange={onFieldChange}
                        className="text-sm text-gray-700"
                      />
                      {i < data.skills.length - 1 && <span className="text-gray-400">, </span>}
                    </React.Fragment>
                  ))}
                </span>
              </p>
            )}
          </>
        ) : null

      case 'experience':
        return data.experience.length > 0 ? (
          <>
            <SectionHeading title="Experience" />
            <div className="space-y-4">
              {data.experience.map((exp, ei) => (
                <div key={ei}>
                  <div className="flex justify-between items-start">
                    <div>
                      <EditableText
                        value={exp.title}
                        path={`experience.${ei}.title`}
                        isEditing={isEditing}
                        onFieldChange={onFieldChange}
                        className="text-sm font-semibold text-gray-900 break-words"
                      />
                      {exp.company && (
                        <>
                          <span className="text-sm text-gray-500"> · </span>
                          <EditableText
                            value={exp.company}
                            path={`experience.${ei}.company`}
                            isEditing={isEditing}
                            onFieldChange={onFieldChange}
                            className="text-sm text-gray-600 break-words"
                          />
                        </>
                      )}
                    </div>
                    {(exp.startDate || exp.endDate) && (
                      <span className="text-xs text-gray-400 shrink-0 ml-4">
                        {exp.startDate}{exp.endDate ? ` – ${exp.endDate}` : ''}
                      </span>
                    )}
                  </div>
                  {exp.location && (
                    <p className="text-xs text-gray-400">{exp.location}</p>
                  )}
                  {exp.bullets.length > 0 && (
                    <ul className="mt-1 space-y-1">
                      {exp.bullets.map((b, bi) => (
                        <li key={bi} className="flex gap-1.5">
                          <span className="text-emerald-500 shrink-0 mt-0.5">›</span>
                          <EditableText
                            value={b}
                            path={`experience.${ei}.bullets.${bi}`}
                            isEditing={isEditing}
                            onFieldChange={onFieldChange}
                            className="text-sm text-gray-700 break-words"
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : null

      case 'projects':
        return data.projects.length > 0 ? (
          <>
            <SectionHeading title="Projects" />
            <div className="space-y-2">
              {data.projects.map((p, i) => (
                <div key={i}>
                  <EditableText value={p.name} path={`projects.${i}.name`} isEditing={isEditing} onFieldChange={onFieldChange} className="text-sm font-semibold text-gray-900 break-words" />
                  {p.description && (
                    <EditableText value={p.description} path={`projects.${i}.description`} isEditing={isEditing} onFieldChange={onFieldChange} className="text-sm text-gray-600 break-words" as="p" />
                  )}
                  {p.technologies.length > 0 && (
                    <p className="text-xs text-gray-400">{p.technologies.join(', ')}</p>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : null

      case 'certifications':
        return data.certifications.length > 0 ? (
          <>
            <SectionHeading title="Certifications" />
            <div className="space-y-1">
              {data.certifications.map((c, i) => (
                <p key={i} className="text-sm text-gray-700">
                  <EditableText value={c.name} path={`certifications.${i}.name`} isEditing={isEditing} onFieldChange={onFieldChange} className="font-medium break-words" />
                  {c.issuer && ` · ${c.issuer}`}
                  {c.date && ` (${c.date})`}
                </p>
              ))}
            </div>
          </>
        ) : null

      case 'languages':
        return data.languages.length > 0 ? (
          <>
            <SectionHeading title="Languages" />
            <p className="text-sm text-gray-700">
              <span>
                {data.languages.map((lang, i) => (
                  <React.Fragment key={i}>
                    <EditableText
                      value={lang}
                      path={`languages.${i}`}
                      isEditing={isEditing}
                      onFieldChange={onFieldChange}
                      className="text-sm text-gray-700"
                    />
                    {i < data.languages.length - 1 && <span className="text-gray-400">, </span>}
                  </React.Fragment>
                ))}
              </span>
            </p>
          </>
        ) : null

      case 'volunteer':
        return data.volunteer.length > 0 ? (
          <>
            <SectionHeading title="Volunteer Work" />
            <div className="space-y-4">
              {data.volunteer.map((volunteer, vi) => (
                <div key={vi}>
                  <div className="flex justify-between items-start">
                    <div>
                      <EditableText
                        value={volunteer.title}
                        path={`volunteer.${vi}.title`}
                        isEditing={isEditing}
                        onFieldChange={onFieldChange}
                        className="text-sm font-semibold text-gray-900 break-words"
                      />
                      {volunteer.company && (
                        <>
                          <span className="text-sm text-gray-500"> · </span>
                          <EditableText
                            value={volunteer.company}
                            path={`volunteer.${vi}.company`}
                            isEditing={isEditing}
                            onFieldChange={onFieldChange}
                            className="text-sm text-gray-600 break-words"
                          />
                        </>
                      )}
                    </div>
                    {(volunteer.startDate || volunteer.endDate) && (
                      <span className="text-xs text-gray-400 shrink-0 ml-4">
                        {volunteer.startDate}{volunteer.endDate ? ` – ${volunteer.endDate}` : ''}
                      </span>
                    )}
                  </div>
                  {volunteer.bullets.length > 0 && (
                    <ul className="mt-1 space-y-1">
                      {volunteer.bullets.map((b, bi) => (
                        <li key={bi} className="flex gap-1.5">
                          <span className="text-emerald-500 shrink-0 mt-0.5">›</span>
                          <EditableText
                            value={b}
                            path={`volunteer.${vi}.bullets.${bi}`}
                            isEditing={isEditing}
                            onFieldChange={onFieldChange}
                            className="text-sm text-gray-700 break-words"
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : null

      case 'awards':
        return data.awards.length > 0 ? (
          <>
            <SectionHeading title="Awards" />
            <div className="space-y-1">
              {data.awards.map((award, i) => (
                <p key={i} className="text-sm text-gray-700">
                  <EditableText value={award.title} path={`awards.${i}.title`} isEditing={isEditing} onFieldChange={onFieldChange} className="font-medium break-words" />
                  {award.issuer && ` · ${award.issuer}`}
                  {award.date && ` (${award.date})`}
                </p>
              ))}
            </div>
          </>
        ) : null

      case 'publications':
        return data.publications.length > 0 ? (
          <>
            <SectionHeading title="Publications" />
            <div className="space-y-1">
              {data.publications.map((pub, i) => (
                <p key={i} className="text-sm text-gray-700">
                  <EditableText value={pub.title} path={`publications.${i}.title`} isEditing={isEditing} onFieldChange={onFieldChange} className="font-medium break-words" />
                  {pub.publisher && ` · ${pub.publisher}`}
                  {pub.date && ` (${pub.date})`}
                </p>
              ))}
            </div>
          </>
        ) : null

      case 'interests':
        return data.interests.length > 0 ? (
          <>
            <SectionHeading title="Interests" />
            <p className="text-sm text-gray-700">
              <span>
                {data.interests.map((interest, i) => (
                  <React.Fragment key={i}>
                    <EditableText
                      value={interest}
                      path={`interests.${i}`}
                      isEditing={isEditing}
                      onFieldChange={onFieldChange}
                      className="text-sm text-gray-700"
                    />
                    {i < data.interests.length - 1 && <span className="text-gray-400">, </span>}
                  </React.Fragment>
                ))}
              </span>
            </p>
          </>
        ) : null

      case 'references':
        return data.references.length > 0 ? (
          <>
            <SectionHeading title="References" />
            <div className="space-y-1">
              {data.references.map((ref, i) => (
                <p key={i} className="text-sm text-gray-700">
                  <EditableText
                    value={ref}
                    path={`references.${i}`}
                    isEditing={isEditing}
                    onFieldChange={onFieldChange}
                    className="text-sm text-gray-700 break-words"
                  />
                </p>
              ))}
            </div>
          </>
        ) : null

      default:
        return null
    }
  }

  return (
    <div className="w-[794px] bg-white p-10 min-h-[1123px]">
      {/* Compact header */}
      <div className="mb-2">
        <EditableText
          value={data.name}
          path="name"
          isEditing={isEditing}
          onFieldChange={onFieldChange}
          className="text-2xl font-bold text-gray-900 break-words"
          as="h1"
          fallback="Your Name"
        />
        <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
          <EditableText value={data.email} path="email" isEditing={isEditing} onFieldChange={onFieldChange} className="text-xs text-gray-500 break-words" />
          <EditableText value={data.phone} path="phone" isEditing={isEditing} onFieldChange={onFieldChange} className="text-xs text-gray-500 break-words" />
          <EditableText value={data.location} path="location" isEditing={isEditing} onFieldChange={onFieldChange} className="text-xs text-gray-500 break-words" />
          <EditableText value={data.linkedin} path="linkedin" isEditing={isEditing} onFieldChange={onFieldChange} className="text-xs text-gray-500 break-words" />
          <EditableText value={data.website} path="website" isEditing={isEditing} onFieldChange={onFieldChange} className="text-xs text-gray-500 break-words" />
        </div>
      </div>

      {(sectionOrder ?? DEFAULT_SECTION_ORDER).map(id => (
        <React.Fragment key={id}>
          {renderSection(id)}
        </React.Fragment>
      ))}
    </div>
  )
}

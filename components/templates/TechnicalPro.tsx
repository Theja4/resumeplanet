import React from 'react'
import EditableText from './EditableText'
import type { TemplateProps } from '@/types'

function SectionHeading({ title }: { title: string }) {
  return (
    <h2 className="text-xs font-bold uppercase tracking-widest text-sky-600 border-b border-gray-200 pb-1 mt-6 mb-3">
      {title}
    </h2>
  )
}

const DEFAULT_SECTION_ORDER = [
  'summary', 'skills', 'experience', 'projects',
  'education', 'certifications', 'languages', 'volunteer',
  'awards', 'publications', 'interests', 'references',
]

export default function TechnicalPro({ data, isEditing, onFieldChange, sectionOrder }: TemplateProps) {
  const isGrouped = data.skills.length > 0 && data.skills[0].includes(': ')

  function renderSection(id: string) {
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

      case 'skills':
        return data.skills.length > 0 ? (
          <>
            <SectionHeading title="Technical Skills" />
            {isGrouped ? (
              <div className="bg-gray-50 rounded p-3 space-y-2">
                {data.skills.map((group, i) => {
                  const colonIdx = group.indexOf(': ')
                  const cat = colonIdx > -1 ? group.slice(0, colonIdx) : group
                  const items = colonIdx > -1 ? group.slice(colonIdx + 2) : ''
                  return (
                    <div key={i} className="flex gap-2 text-sm">
                      <span className="font-medium text-gray-700 shrink-0 min-w-[120px]">
                        {cat}:
                      </span>
                      <span className="text-gray-600">{items}</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="font-mono text-sm text-gray-700">
                <span>
                  {data.skills.map((skill, i) => (
                    <React.Fragment key={i}>
                      <EditableText
                        value={skill}
                        path={`skills.${i}`}
                        isEditing={isEditing}
                        onFieldChange={onFieldChange}
                        className="font-mono text-sm text-gray-700"
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
            <div className="space-y-5">
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
                            className="text-sm text-sky-700 break-words"
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
                    <p className="text-xs text-gray-400 mt-0.5">{exp.location}</p>
                  )}
                  {exp.bullets.length > 0 && (
                    <ul className="mt-1.5 space-y-1">
                      {exp.bullets.map((b, bi) => (
                        <li key={bi} className="flex gap-2">
                          <span className="text-sky-400 shrink-0">▹</span>
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
            <div className="space-y-3">
              {data.projects.map((p, i) => (
                <div key={i}>
                  <EditableText value={p.name} path={`projects.${i}.name`} isEditing={isEditing} onFieldChange={onFieldChange} className="text-sm font-semibold text-gray-900 break-words" />
                  {p.description && (
                    <EditableText value={p.description} path={`projects.${i}.description`} isEditing={isEditing} onFieldChange={onFieldChange} className="text-sm text-gray-600 break-words" as="p" />
                  )}
                  {p.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {p.technologies.map((tech, ti) => (
                        <span
                          key={ti}
                          className="bg-sky-50 text-sky-700 text-xs px-1.5 py-0.5 rounded"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : null

      case 'education':
        return data.education.length > 0 ? (
          <>
            <SectionHeading title="Education" />
            <div className="space-y-2">
              {data.education.map((edu, i) => (
                <div key={i} className="flex justify-between items-start">
                  <div>
                    <EditableText
                      value={edu.institution}
                      path={`education.${i}.institution`}
                      isEditing={isEditing}
                      onFieldChange={onFieldChange}
                      className="text-sm font-bold text-gray-900 break-words"
                    />
                    <p className="text-sm text-gray-600">
                      {edu.degree}{edu.field ? ` in ${edu.field}` : ''}
                      {edu.gpa ? ` · GPA ${edu.gpa}` : ''}
                    </p>
                  </div>
                  {edu.graduationDate && (
                    <span className="text-xs text-gray-400 shrink-0 ml-4">
                      {edu.graduationDate}
                    </span>
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
            <div className="space-y-5">
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
                            className="text-sm text-sky-700 break-words"
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
                    <ul className="mt-1.5 space-y-1">
                      {volunteer.bullets.map((b, bi) => (
                        <li key={bi} className="flex gap-2">
                          <span className="text-sky-400 shrink-0">▹</span>
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
    <div className="w-[794px] bg-white p-11 min-h-[1123px]">
      {/* Header */}
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

        {/* Technical links row */}
        <div className="flex flex-wrap gap-3 mt-1 text-sm text-sky-600">
          <EditableText value={data.email} path="email" isEditing={isEditing} onFieldChange={onFieldChange} className="text-sm text-sky-600 break-words" />
          <EditableText value={data.phone} path="phone" isEditing={isEditing} onFieldChange={onFieldChange} className="text-sm text-gray-500 break-words" />
          <EditableText value={data.linkedin} path="linkedin" isEditing={isEditing} onFieldChange={onFieldChange} className="text-sm text-sky-600 break-words" />
          <EditableText value={data.website} path="website" isEditing={isEditing} onFieldChange={onFieldChange} className="text-sm text-sky-600 break-words" />
          <EditableText value={data.location} path="location" isEditing={isEditing} onFieldChange={onFieldChange} className="text-sm text-gray-500 break-words" />
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

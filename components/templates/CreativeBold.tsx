import React from 'react'
import EditableText from './EditableText'
import type { TemplateProps } from '@/types'

function SectionHeading({ title }: { title: string }) {
  return (
    <h2 className="text-xs font-bold uppercase tracking-widest text-red-600 border-b-2 border-red-600 pb-1 mt-6 mb-4">
      {title}
    </h2>
  )
}

const DEFAULT_SECTION_ORDER = [
  'summary', 'experience', 'skills', 'education',
  'certifications', 'projects', 'languages', 'volunteer',
  'awards', 'publications', 'interests', 'references',
]

export default function CreativeBold({ data, isEditing, onFieldChange, sectionOrder }: TemplateProps) {
  const currentTitle = data.experience[0]?.title ?? ''

  function renderSection(id: string) {
    switch (id) {
      case 'summary':
        return data.summary ? (
          <>
            <SectionHeading title="Profile" />
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

      case 'experience':
        return data.experience.length > 0 ? (
          <>
            <SectionHeading title="Experience" />
            <div className="space-y-0">
              {data.experience.map((exp, ei) => (
                <div key={ei} className="relative border-l-2 border-red-100 ml-2 pl-5 pb-5">
                  {/* Timeline dot */}
                  <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-red-500" />
                  <div className="flex justify-between items-start">
                    <div>
                      <EditableText
                        value={exp.title}
                        path={`experience.${ei}.title`}
                        isEditing={isEditing}
                        onFieldChange={onFieldChange}
                        className="font-semibold text-gray-900 break-words"
                      />
                      {exp.company && (
                        <EditableText
                          value={`${exp.company}${exp.location ? ` · ${exp.location}` : ''}`}
                          path={`experience.${ei}.company`}
                          isEditing={isEditing}
                          onFieldChange={onFieldChange}
                          className="text-sm text-gray-500 break-words"
                          as="p"
                        />
                      )}
                    </div>
                    {(exp.startDate || exp.endDate) && (
                      <span className="text-xs text-gray-400 shrink-0 ml-4">
                        {exp.startDate}{exp.endDate ? ` – ${exp.endDate}` : ''}
                      </span>
                    )}
                  </div>
                  {exp.bullets.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {exp.bullets.map((b, bi) => (
                        <li key={bi} className="flex gap-2">
                          <span className="text-red-300 shrink-0">–</span>
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

      case 'skills':
        return data.skills.length > 0 ? (
          <>
            <SectionHeading title="Skills" />
            <div>
              {data.skills.map((skill, i) => (
                <span
                  key={i}
                  className="inline-block bg-red-50 text-red-700 text-xs px-2 py-0.5 rounded-full mr-1 mb-1"
                >
                  <EditableText
                    value={skill}
                    path={`skills.${i}`}
                    isEditing={isEditing}
                    onFieldChange={onFieldChange}
                    className="text-xs text-red-700"
                  />
                </span>
              ))}
            </div>
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
                      className="font-bold text-gray-900 text-sm break-words"
                    />
                    <p className="text-sm text-gray-600">
                      {edu.degree}{edu.field ? ` in ${edu.field}` : ''}
                      {edu.gpa ? ` · GPA ${edu.gpa}` : ''}
                    </p>
                  </div>
                  {edu.graduationDate && (
                    <span className="text-xs text-gray-400 shrink-0">{edu.graduationDate}</span>
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
                    {i < data.languages.length - 1 && <span className="text-gray-400"> · </span>}
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
            <div className="space-y-0">
              {data.volunteer.map((volunteer, vi) => (
                <div key={vi} className="relative border-l-2 border-red-100 ml-2 pl-5 pb-5">
                  <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-red-500" />
                  <div className="flex justify-between items-start">
                    <div>
                      <EditableText
                        value={volunteer.title}
                        path={`volunteer.${vi}.title`}
                        isEditing={isEditing}
                        onFieldChange={onFieldChange}
                        className="font-semibold text-gray-900 break-words"
                      />
                      {volunteer.company && (
                        <EditableText
                          value={`${volunteer.company}${volunteer.location ? ` · ${volunteer.location}` : ''}`}
                          path={`volunteer.${vi}.company`}
                          isEditing={isEditing}
                          onFieldChange={onFieldChange}
                          className="text-sm text-gray-500 break-words"
                          as="p"
                        />
                      )}
                    </div>
                    {(volunteer.startDate || volunteer.endDate) && (
                      <span className="text-xs text-gray-400 shrink-0 ml-4">
                        {volunteer.startDate}{volunteer.endDate ? ` – ${volunteer.endDate}` : ''}
                      </span>
                    )}
                  </div>
                  {volunteer.bullets.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {volunteer.bullets.map((b, bi) => (
                        <li key={bi} className="flex gap-2">
                          <span className="text-red-300 shrink-0">–</span>
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
    <div className="w-[794px] bg-white min-h-[1123px]">
      {/* Bold header */}
      <div className="bg-red-600 px-12 py-10">
        <EditableText
          value={data.name}
          path="name"
          isEditing={isEditing}
          onFieldChange={onFieldChange}
          className="text-4xl font-bold text-white break-words"
          as="h1"
          fallback="Your Name"
        />
        {currentTitle && (
          <p className="text-lg text-red-100 mt-1">{currentTitle}</p>
        )}
        <div className="flex flex-wrap gap-4 mt-3 text-sm text-red-100">
          <EditableText value={data.email} path="email" isEditing={isEditing} onFieldChange={onFieldChange} className="text-sm text-red-100 break-words" />
          <EditableText value={data.phone} path="phone" isEditing={isEditing} onFieldChange={onFieldChange} className="text-sm text-red-100 break-words" />
          <EditableText value={data.location} path="location" isEditing={isEditing} onFieldChange={onFieldChange} className="text-sm text-red-100 break-words" />
          <EditableText value={data.website} path="website" isEditing={isEditing} onFieldChange={onFieldChange} className="text-sm text-red-100 break-words" />
        </div>
      </div>

      {/* Content */}
      <div className="px-12 py-8">
        {(sectionOrder ?? DEFAULT_SECTION_ORDER).map(id => (
          <React.Fragment key={id}>
            {renderSection(id)}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

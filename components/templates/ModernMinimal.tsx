import React from 'react'
import EditableText from './EditableText'
import type { TemplateProps } from '@/types'

function SectionHeading({ title }: { title: string }) {
  return (
    <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 border-b border-gray-200 pb-1 mt-6 mb-3">
      {title}
    </h2>
  )
}

const DEFAULT_SECTION_ORDER = [
  'summary', 'experience', 'education', 'skills',
  'projects', 'volunteer', 'certifications', 'awards',
  'publications', 'languages', 'interests', 'references',
]

export default function ModernMinimal({ data, isEditing, onFieldChange, sectionOrder }: TemplateProps) {
  function renderSection(id: string) {
    switch (id) {
      case 'summary':
        return data.summary ? (
          <>
            <SectionHeading title="Summary" />
            <EditableText value={data.summary} path="summary" isEditing={isEditing} onFieldChange={onFieldChange} className="text-sm text-gray-700 leading-relaxed break-words" as="p" />
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
                      <EditableText value={exp.title} path={`experience.${ei}.title`} isEditing={isEditing} onFieldChange={onFieldChange} className="text-sm font-semibold text-gray-900 break-words" />
                      {exp.company && (
                        <>
                          <span className="text-sm text-gray-500"> · </span>
                          <EditableText value={exp.company} path={`experience.${ei}.company`} isEditing={isEditing} onFieldChange={onFieldChange} className="text-sm text-gray-600 break-words" />
                        </>
                      )}
                    </div>
                    {(exp.startDate || exp.endDate) && (
                      <span className="text-xs text-gray-400 shrink-0 ml-4">{exp.startDate}{exp.endDate ? ` – ${exp.endDate}` : ''}</span>
                    )}
                  </div>
                  {exp.location && <p className="text-xs text-gray-400 mt-0.5">{exp.location}</p>}
                  {exp.bullets.length > 0 && (
                    <ul className="mt-1.5 space-y-1">
                      {exp.bullets.map((b, bi) => (
                        <li key={bi} className="flex gap-2">
                          <span className="text-indigo-400 mt-1 shrink-0">·</span>
                          <EditableText value={b} path={`experience.${ei}.bullets.${bi}`} isEditing={isEditing} onFieldChange={onFieldChange} className="text-sm text-gray-700 break-words" />
                        </li>
                      ))}
                    </ul>
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
            <div className="space-y-3">
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
                    <EditableText
                      value={`${edu.degree}${edu.field ? ` in ${edu.field}` : ''}`}
                      path={`education.${i}.degree`}
                      isEditing={isEditing}
                      onFieldChange={onFieldChange}
                      className="text-sm text-gray-600 break-words"
                      as="p"
                    />
                    {edu.gpa && <p className="text-xs text-gray-400">GPA: {edu.gpa}</p>}
                  </div>
                  {edu.graduationDate && (
                    <span className="text-xs text-gray-400 shrink-0 ml-4">{edu.graduationDate}</span>
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
            <p className="text-sm text-gray-700">
              <span>
                {data.skills.map((skill, i) => (
                  <React.Fragment key={i}>
                    <EditableText value={skill} path={`skills.${i}`} isEditing={isEditing} onFieldChange={onFieldChange} className="text-sm text-gray-700" />
                    {i < data.skills.length - 1 && <span className="text-gray-400">, </span>}
                  </React.Fragment>
                ))}
              </span>
            </p>
          </>
        ) : null

      case 'projects':
        return data.projects.length > 0 ? (
          <>
            <SectionHeading title="Projects" />
            <div className="space-y-2">
              {data.projects.map((p, i) => (
                <div key={i}>
                  <EditableText value={p.name} path={`projects.${i}.name`} isEditing={isEditing} onFieldChange={onFieldChange} className="text-sm font-medium text-gray-900 break-words" />
                  {p.description && (
                    <>
                      <span className="text-sm text-gray-600"> — </span>
                      <EditableText value={p.description} path={`projects.${i}.description`} isEditing={isEditing} onFieldChange={onFieldChange} className="text-sm text-gray-600 break-words" />
                    </>
                  )}
                  {p.technologies.length > 0 && (
                    <p className="text-xs text-gray-400 mt-0.5">{p.technologies.join(', ')}</p>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : null

      case 'volunteer':
        return data.volunteer.length > 0 ? (
          <>
            <SectionHeading title="Volunteer Work" />
            <div className="space-y-4">
              {data.volunteer.map((v, vi) => (
                <div key={vi}>
                  <div className="flex justify-between items-start">
                    <div>
                      <EditableText value={v.title} path={`volunteer.${vi}.title`} isEditing={isEditing} onFieldChange={onFieldChange} className="text-sm font-semibold text-gray-900 break-words" />
                      {v.company && (
                        <>
                          <span className="text-sm text-gray-500"> · </span>
                          <EditableText value={v.company} path={`volunteer.${vi}.company`} isEditing={isEditing} onFieldChange={onFieldChange} className="text-sm text-gray-600 break-words" />
                        </>
                      )}
                    </div>
                    {(v.startDate || v.endDate) && (
                      <span className="text-xs text-gray-400 shrink-0 ml-4">{v.startDate}{v.endDate ? ` – ${v.endDate}` : ''}</span>
                    )}
                  </div>
                  {v.bullets.length > 0 && (
                    <ul className="mt-1 space-y-1">
                      {v.bullets.map((b, bi) => (
                        <li key={bi} className="flex gap-2">
                          <span className="text-indigo-400 mt-1 shrink-0">·</span>
                          <EditableText value={b} path={`volunteer.${vi}.bullets.${bi}`} isEditing={isEditing} onFieldChange={onFieldChange} className="text-sm text-gray-700 break-words" />
                        </li>
                      ))}
                    </ul>
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

      case 'awards':
        return data.awards.length > 0 ? (
          <>
            <SectionHeading title="Awards" />
            <div className="space-y-1">
              {data.awards.map((a, i) => (
                <p key={i} className="text-sm text-gray-700">
                  <EditableText value={a.title} path={`awards.${i}.title`} isEditing={isEditing} onFieldChange={onFieldChange} className="font-medium break-words" />
                  {a.issuer && ` · ${a.issuer}`}
                  {a.date && ` (${a.date})`}
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
              {data.publications.map((p, i) => (
                <p key={i} className="text-sm text-gray-700">
                  <EditableText value={p.title} path={`publications.${i}.title`} isEditing={isEditing} onFieldChange={onFieldChange} className="font-medium break-words" />
                  {p.publisher && ` · ${p.publisher}`}
                  {p.date && ` (${p.date})`}
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
                    <EditableText value={lang} path={`languages.${i}`} isEditing={isEditing} onFieldChange={onFieldChange} className="text-sm text-gray-700" />
                    {i < data.languages.length - 1 && <span className="text-gray-400">, </span>}
                  </React.Fragment>
                ))}
              </span>
            </p>
          </>
        ) : null

      case 'interests':
        return data.interests.length > 0 ? (
          <>
            <SectionHeading title="Interests" />
            <p className="text-sm text-gray-700">
              <span>
                {data.interests.map((item, i) => (
                  <React.Fragment key={i}>
                    <EditableText value={item} path={`interests.${i}`} isEditing={isEditing} onFieldChange={onFieldChange} className="text-sm text-gray-700" />
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
                <EditableText key={i} value={ref} path={`references.${i}`} isEditing={isEditing} onFieldChange={onFieldChange} className="text-sm text-gray-700 break-words" as="p" />
              ))}
            </div>
          </>
        ) : null

      default:
        return null
    }
  }

  return (
    <div className="w-[794px] min-h-[1123px] bg-white p-12">
      {/* Header */}
      <div className="border-l-4 border-indigo-600 pl-3">
        <EditableText
          value={data.name}
          path="name"
          isEditing={isEditing}
          onFieldChange={onFieldChange}
          className="text-3xl font-bold text-gray-900 break-words"
          as="h1"
          fallback="Your Name"
        />
      </div>

      {/* Contact row */}
      <div className="flex flex-wrap gap-4 mt-2">
        <EditableText value={data.email} path="email" isEditing={isEditing} onFieldChange={onFieldChange} className="text-sm text-gray-500 break-words" />
        <EditableText value={data.phone} path="phone" isEditing={isEditing} onFieldChange={onFieldChange} className="text-sm text-gray-500 break-words" />
        <EditableText value={data.location} path="location" isEditing={isEditing} onFieldChange={onFieldChange} className="text-sm text-gray-500 break-words" />
        <EditableText value={data.linkedin} path="linkedin" isEditing={isEditing} onFieldChange={onFieldChange} className="text-sm text-gray-500 break-words" />
        <EditableText value={data.website} path="website" isEditing={isEditing} onFieldChange={onFieldChange} className="text-sm text-gray-500 break-words" />
      </div>

      {(sectionOrder ?? DEFAULT_SECTION_ORDER).map(id => (
        <React.Fragment key={id}>
          {renderSection(id)}
        </React.Fragment>
      ))}
    </div>
  )
}

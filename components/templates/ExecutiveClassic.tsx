import React from 'react'
import EditableText from './EditableText'
import type { TemplateProps } from '@/types'

function SidebarLabel({ text }: { text: string }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 mt-3 mb-0.5">
      {text}
    </p>
  )
}

function Divider() {
  return <div className="border-t border-white/20 my-4" />
}

const DEFAULT_SECTION_ORDER = [
  'summary', 'experience', 'projects', 'volunteer',
]

export default function ExecutiveClassic({ data, isEditing, onFieldChange, sectionOrder, accentColor, fontFamily }: TemplateProps) {
  const currentTitle = data.experience[0]?.title ?? ''
  const accent = accentColor || '#1e3a5f'

  function renderSection(id: string) {
    if (id.startsWith('custom_')) {
      const custom = data.customSections?.find(c => c.id === id)
      if (!custom) return null

      if (custom.type === 'text' && custom.text && custom.text.trim()) {
        return (
          <div className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#1e3a5f] border-b border-gray-200 pb-1 mb-4">
              {custom.title}
            </h2>
            <EditableText value={custom.text} path={`custom_${id}.text`} isEditing={isEditing} onFieldChange={onFieldChange} className="italic text-sm text-gray-600 leading-relaxed break-words" as="p" />
          </div>
        )
      }
      
      if (custom.type === 'tags' && custom.tags && custom.tags.length > 0) {
        return (
          <div className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#1e3a5f] border-b border-gray-200 pb-1 mb-4">
              {custom.title}
            </h2>
            <p className="text-sm text-gray-700">
              {custom.tags.map((tag, i) => (
                <span key={i} className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded-full mr-1 mb-1">
                  <EditableText value={tag} path={`custom_${id}.tags.${i}`} isEditing={isEditing} onFieldChange={onFieldChange} className="text-xs text-gray-800" />
                </span>
              ))}
            </p>
          </div>
        )
      }

      if (custom.type === 'complex' && custom.items && custom.items.length > 0) {
        return (
          <div className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#1e3a5f] border-b border-gray-200 pb-1 mb-4">
              {custom.title}
            </h2>
            <div className="space-y-6">
              {custom.items.map((exp, ei) => (
                <div key={ei}>
                  <div className="flex justify-between items-start">
                    <div>
                      <EditableText value={exp.title} path={`custom_${id}.items.${ei}.title`} isEditing={isEditing} onFieldChange={onFieldChange} className="text-sm font-semibold font-serif text-gray-900 break-words" />
                      {exp.company && (
                        <EditableText value={`${exp.company}${exp.location ? ` · ${exp.location}` : ''}`} path={`custom_${id}.items.${ei}.company`} isEditing={isEditing} onFieldChange={onFieldChange} className="text-sm text-[#1e3a5f] break-words" as="p" />
                      )}
                    </div>
                    {(exp.startDate || exp.endDate) && (
                      <span className="text-xs text-gray-400 shrink-0 ml-4">{exp.startDate}{exp.endDate ? ` – ${exp.endDate}` : ''}</span>
                    )}
                  </div>
                  {exp.bullets.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {exp.bullets.map((b, bi) => (
                        <li key={bi} className="flex gap-2">
                          <span className="text-[#1e3a5f] shrink-0 mt-1">›</span>
                          <EditableText value={b} path={`custom_${id}.items.${ei}.bullets.${bi}`} isEditing={isEditing} onFieldChange={onFieldChange} className="text-sm text-gray-700 break-words" />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
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
          <div className="mb-6">
            <EditableText
              value={data.summary}
              path="summary"
              isEditing={isEditing}
              onFieldChange={onFieldChange}
              className="italic text-sm text-gray-600 leading-relaxed break-words"
              as="p"
            />
          </div>
        ) : null

      case 'experience':
        return data.experience.length > 0 ? (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#1e3a5f] border-b border-gray-200 pb-1 mb-4">
              Experience
            </h2>
            <div className="space-y-6">
              {data.experience.map((exp, ei) => (
                <div key={ei}>
                  <div className="flex justify-between items-start">
                    <div>
                      <EditableText
                        value={exp.title}
                        path={`experience.${ei}.title`}
                        isEditing={isEditing}
                        onFieldChange={onFieldChange}
                        className="text-sm font-semibold font-serif text-gray-900 break-words"
                      />
                      {exp.company && (
                        <EditableText
                          value={exp.company}
                          path={`experience.${ei}.company`}
                          isEditing={isEditing}
                          onFieldChange={onFieldChange}
                          className="text-sm text-[#1e3a5f] break-words"
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
                  {exp.location && (
                    <p className="text-xs text-gray-400 mt-0.5">{exp.location}</p>
                  )}
                  {exp.bullets.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {exp.bullets.map((b, bi) => (
                        <li key={bi} className="flex gap-2">
                          <span className="text-[#1e3a5f] shrink-0 mt-1">›</span>
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
          </div>
        ) : null

      case 'projects':
        return data.projects.length > 0 ? (
          <div className="mt-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#1e3a5f] border-b border-gray-200 pb-1 mb-4">
              Projects
            </h2>
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
          </div>
        ) : null

      case 'volunteer':
        return data.volunteer.length > 0 ? (
          <div className="mt-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#1e3a5f] border-b border-gray-200 pb-1 mb-4">
              Volunteer Work
            </h2>
            <div className="space-y-6">
              {data.volunteer.map((volunteer, vi) => (
                <div key={vi}>
                  <div className="flex justify-between items-start">
                    <div>
                      <EditableText
                        value={volunteer.title}
                        path={`volunteer.${vi}.title`}
                        isEditing={isEditing}
                        onFieldChange={onFieldChange}
                        className="text-sm font-semibold font-serif text-gray-900 break-words"
                      />
                      {volunteer.company && (
                        <EditableText
                          value={volunteer.company}
                          path={`volunteer.${vi}.company`}
                          isEditing={isEditing}
                          onFieldChange={onFieldChange}
                          className="text-sm text-[#1e3a5f] break-words"
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
                  {volunteer.location && (
                    <p className="text-xs text-gray-400 mt-0.5">{volunteer.location}</p>
                  )}
                  {volunteer.bullets.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {volunteer.bullets.map((b, bi) => (
                        <li key={bi} className="flex gap-2">
                          <span className="text-[#1e3a5f] shrink-0 mt-1">›</span>
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
          </div>
        ) : null

      default:
        return null
    }
  }

  return (
    <div style={{ fontFamily: fontFamily || undefined }} className="w-[794px] bg-white flex min-h-[1123px]">
      {/* Left sidebar */}
      <div style={{ backgroundColor: accent }} className="w-56 text-white p-8 shrink-0 flex flex-col">
        {/* Name + title */}
        <EditableText
          value={data.name}
          path="name"
          isEditing={isEditing}
          onFieldChange={onFieldChange}
          className="text-xl font-semibold font-serif text-white leading-tight break-words"
          as="h1"
          fallback="Your Name"
        />
        {currentTitle && (
          <p className="text-xs text-blue-200 mt-1">{currentTitle}</p>
        )}

        <Divider />

        {/* Contact */}
        {data.email && (
          <>
            <SidebarLabel text="Email" />
            <EditableText value={data.email} path="email" isEditing={isEditing} onFieldChange={onFieldChange} className="text-xs text-blue-100 break-all" />
          </>
        )}
        {data.phone && (
          <>
            <SidebarLabel text="Phone" />
            <EditableText value={data.phone} path="phone" isEditing={isEditing} onFieldChange={onFieldChange} className="text-xs text-blue-100 break-words" />
          </>
        )}
        {data.location && (
          <>
            <SidebarLabel text="Location" />
            <EditableText value={data.location} path="location" isEditing={isEditing} onFieldChange={onFieldChange} className="text-xs text-blue-100 break-words" />
          </>
        )}
        {data.linkedin && (
          <>
            <SidebarLabel text="LinkedIn" />
            <EditableText value={data.linkedin} path="linkedin" isEditing={isEditing} onFieldChange={onFieldChange} className="text-xs text-blue-100 break-all" />
          </>
        )}
        {data.website && (
          <>
            <SidebarLabel text="Website" />
            <EditableText value={data.website} path="website" isEditing={isEditing} onFieldChange={onFieldChange} className="text-xs text-blue-100 break-all" />
          </>
        )}

        {/* Skills */}
        {data.skills.length > 0 && (
          <>
            <Divider />
            <SidebarLabel text="Skills" />
            <p className="text-xs text-blue-100 leading-relaxed mt-1">
              <span>
                {data.skills.map((skill, i) => (
                  <React.Fragment key={i}>
                    <EditableText
                      value={skill}
                      path={`skills.${i}`}
                      isEditing={isEditing}
                      onFieldChange={onFieldChange}
                      className="text-xs text-blue-100"
                    />
                    {i < data.skills.length - 1 && <span className="text-blue-300"> · </span>}
                  </React.Fragment>
                ))}
              </span>
            </p>
          </>
        )}

        {/* Education */}
        {data.education.length > 0 && (
          <>
            <Divider />
            <SidebarLabel text="Education" />
            {data.education.map((edu, i) => (
              <div key={i} className="mt-1">
                <p className="text-xs font-bold text-blue-100">{edu.institution}</p>
                <p className="text-xs text-blue-200">
                  {edu.degree}{edu.field ? `, ${edu.field}` : ''}
                </p>
                {edu.graduationDate && (
                  <p className="text-[10px] text-blue-400">{edu.graduationDate}</p>
                )}
              </div>
            ))}
          </>
        )}

        {/* Certifications */}
        {data.certifications.length > 0 && (
          <>
            <Divider />
            <SidebarLabel text="Certifications" />
            {data.certifications.map((c, i) => (
              <p key={i} className="text-xs text-blue-100 mt-1">
                <EditableText value={c.name} path={`certifications.${i}.name`} isEditing={isEditing} onFieldChange={onFieldChange} className="font-medium break-words" />
                {c.date ? ` (${c.date})` : ''}
              </p>
            ))}
          </>
        )}

        {/* Languages */}
        {data.languages.length > 0 && (
          <>
            <Divider />
            <SidebarLabel text="Languages" />
            <p className="text-xs text-blue-100 mt-1">
              <span>
                {data.languages.map((lang, i) => (
                  <React.Fragment key={i}>
                    <EditableText
                      value={lang}
                      path={`languages.${i}`}
                      isEditing={isEditing}
                      onFieldChange={onFieldChange}
                      className="text-xs text-blue-100"
                    />
                    {i < data.languages.length - 1 && <span className="text-blue-300">, </span>}
                  </React.Fragment>
                ))}
              </span>
            </p>
          </>
        )}

        {/* Awards */}
        {data.awards.length > 0 && (
          <>
            <Divider />
            <SidebarLabel text="Awards" />
            {data.awards.map((award, i) => (
              <p key={i} className="text-xs text-blue-100 mt-1">
                <EditableText value={award.title} path={`awards.${i}.title`} isEditing={isEditing} onFieldChange={onFieldChange} className="font-medium break-words" />
                {award.issuer && ` · ${award.issuer}`}
                {award.date && ` (${award.date})`}
              </p>
            ))}
          </>
        )}

        {/* Publications */}
        {data.publications.length > 0 && (
          <>
            <Divider />
            <SidebarLabel text="Publications" />
            {data.publications.map((pub, i) => (
              <p key={i} className="text-xs text-blue-100 mt-1">
                <EditableText value={pub.title} path={`publications.${i}.title`} isEditing={isEditing} onFieldChange={onFieldChange} className="font-medium break-words" />
                {pub.publisher && ` · ${pub.publisher}`}
                {pub.date && ` (${pub.date})`}
              </p>
            ))}
          </>
        )}

        {/* Interests */}
        {data.interests.length > 0 && (
          <>
            <Divider />
            <SidebarLabel text="Interests" />
            <p className="text-xs text-blue-100 mt-1">
              <span>
                {data.interests.map((interest, i) => (
                  <React.Fragment key={i}>
                    <EditableText
                      value={interest}
                      path={`interests.${i}`}
                      isEditing={isEditing}
                      onFieldChange={onFieldChange}
                      className="text-xs text-blue-100"
                    />
                    {i < data.interests.length - 1 && <span className="text-blue-300">, </span>}
                  </React.Fragment>
                ))}
              </span>
            </p>
          </>
        )}

        {/* References */}
        {data.references.length > 0 && (
          <>
            <Divider />
            <SidebarLabel text="References" />
            {data.references.map((ref, i) => (
              <p key={i} className="text-xs text-blue-100 mt-1">
                <EditableText
                  value={ref}
                  path={`references.${i}`}
                  isEditing={isEditing}
                  onFieldChange={onFieldChange}
                  className="text-xs text-blue-100 break-words"
                />
              </p>
            ))}
          </>
        )}
      </div>

      {/* Right content */}
      <div className="flex-1 p-10">
        {(sectionOrder ?? DEFAULT_SECTION_ORDER).map(id => (
          <React.Fragment key={id}>
            {renderSection(id)}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

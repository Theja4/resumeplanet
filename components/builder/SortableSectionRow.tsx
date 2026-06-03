'use client'

import { useState } from 'react'
import { defaultAnimateLayoutChanges, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Eye, EyeOff, Trash2, Pencil,
  User, AlignLeft, Briefcase, GraduationCap, Zap,
  Code, Award, Heart, Globe, Star, Trophy, BookOpen, Users,
  List, Tags, Component, SeparatorHorizontal
} from 'lucide-react'
import type { ResumeData, BuilderVisibility } from '@/types'
import ContactEditor from './ContactEditor'
import SummaryEditor from './SummaryEditor'
import SkillsEditor from './SkillsEditor'
import LanguagesEditor from './LanguagesEditor'
import InterestsEditor from './InterestsEditor'
import VolunteerEditor from './VolunteerEditor'
import AwardsEditor from './AwardsEditor'
import PublicationsEditor from './PublicationsEditor'
import ReferencesEditor from './ReferencesEditor'
import SubItemList from './SubItemList'
import CustomTextEditor from './CustomTextEditor'
import CustomTagsEditor from './CustomTagsEditor'
import { getResumeSkills } from '@/lib/resume-data'

const SECTION_CONFIG: Record<string, { label: string; Icon: React.ComponentType<{ size?: number; className?: string }> }> = {
  contact:        { label: 'Contact Info',    Icon: User },
  summary:        { label: 'Summary',         Icon: AlignLeft },
  experience:     { label: 'Work Experience', Icon: Briefcase },
  education:      { label: 'Education',       Icon: GraduationCap },
  skills:         { label: 'Skills',          Icon: Zap },
  projects:       { label: 'Projects',        Icon: Code },
  certifications: { label: 'Certificates',    Icon: Award },
  volunteer:      { label: 'Volunteer Work',  Icon: Heart },
  languages:      { label: 'Languages',       Icon: Globe },
  interests:      { label: 'Interests',       Icon: Star },
  awards:         { label: 'Awards',          Icon: Trophy },
  publications:   { label: 'Publications',    Icon: BookOpen },
  references:     { label: 'References',      Icon: Users },
}

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim())
}

function hasExperienceItemData(item: ResumeData['experience'][number]) {
  return (
    hasText(item.company) ||
    hasText(item.title) ||
    hasText(item.location) ||
    hasText(item.startDate) ||
    hasText(item.endDate) ||
    hasText(item.summary) ||
    hasText(item.url) ||
    item.bullets.some(hasText)
  )
}

function hasEducationItemData(item: ResumeData['education'][number]) {
  return (
    hasText(item.institution) ||
    hasText(item.degree) ||
    hasText(item.field) ||
    hasText(item.startDate) ||
    hasText(item.endDate) ||
    hasText(item.graduationDate) ||
    hasText(item.gpa) ||
    hasText(item.url)
  )
}

function hasProjectItemData(item: ResumeData['projects'][number]) {
  return (
    hasText(item.name) ||
    hasText(item.description) ||
    hasText(item.url) ||
    item.bullets?.some(hasText) === true ||
    item.technologies.some(hasText)
  )
}

function hasCertificationItemData(item: ResumeData['certifications'][number]) {
  return hasText(item.name) || hasText(item.issuer) || hasText(item.date) || hasText(item.url)
}

function hasAwardItemData(item: ResumeData['awards'][number]) {
  return hasText(item.title) || hasText(item.issuer) || hasText(item.date) || hasText(item.url)
}

function hasPublicationItemData(item: ResumeData['publications'][number]) {
  return hasText(item.title) || hasText(item.publisher) || hasText(item.date) || hasText(item.url)
}

function sectionHasData(sectionId: string, data: ResumeData): boolean {
  if (sectionId.startsWith('custom_')) {
    const custom = data.customSections?.find(c => c.id === sectionId)
    if (!custom) return false
    if (custom.type === 'text') return hasText(custom.text)
    if (custom.type === 'tags') return custom.tags?.some(hasText) === true
    if (custom.type === 'complex') return custom.items?.some(hasExperienceItemData) === true
    if (custom.type === 'pageBreak') return true // marker is always "active"
    return false
  }

  switch (sectionId) {
    case 'contact':        return [data.name, data.email, data.phone, data.location, data.linkedin, data.website, data.currentRole].some(hasText)
    case 'summary':        return hasText(data.summary)
    case 'experience':     return data.experience.some(hasExperienceItemData)
    case 'education':      return data.education.some(hasEducationItemData)
    case 'skills':         return getResumeSkills(data).some(hasText)
    case 'projects':       return data.projects.some(hasProjectItemData)
    case 'certifications': return data.certifications.some(hasCertificationItemData)
    case 'volunteer':      return data.volunteer.some(hasExperienceItemData)
    case 'languages':      return data.languages.some(hasText)
    case 'interests':      return data.interests.some(hasText)
    case 'awards':         return data.awards.some(hasAwardItemData)
    case 'publications':   return data.publications.some(hasPublicationItemData)
    case 'references':     return data.references.some(hasText)
    default:               return false
  }
}

interface Props {
  sectionId: string
  resumeData: ResumeData
  visibility: BuilderVisibility
  isExpanded: boolean
  hasHint: boolean
  onDataChange: (updated: ResumeData) => void
  onVisibilityChange: (updated: BuilderVisibility) => void
  onExpand: () => void
  focusPath?: string | null
  onFocusHandled?: () => void
  isDragDisabled?: boolean
  onSectionAction?: (
    sectionType: string,
    action: 'edit' | 'reorder' | 'toggle_visibility' | 'add' | 'delete'
  ) => void
  onSubSectionEditorOpened?: (sectionType: string, subSectionId: string) => void
}

export default function SortableSectionRow({
  sectionId,
  resumeData,
  visibility,
  isExpanded,
  hasHint,
  onDataChange,
  onVisibilityChange,
  onExpand,
  focusPath,
  onFocusHandled,
  isDragDisabled,
  onSectionAction,
  onSubSectionEditorOpened,
}: Props) {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({
    id: sectionId,
    disabled: isDragDisabled,
    animateLayoutChanges(args) {
      return defaultAnimateLayoutChanges({
        ...args,
        wasDragging: true,
      })
    },
    transition: {
      duration: 240,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
    willChange: isDragging ? 'transform' : undefined,
  }

  const isCustom = sectionId.startsWith('custom_')
  const customConfig = isCustom ? resumeData.customSections?.find(c => c.id === sectionId) : null

  let label = ''
  let Icon: React.ComponentType<{ size?: number; className?: string }> = Component

  if (isCustom) {
    if (!customConfig) return null
    label = customConfig.title
    if (customConfig.type === 'complex') Icon = List
    else if (customConfig.type === 'tags') Icon = Tags
    else if (customConfig.type === 'text') Icon = AlignLeft
    else if (customConfig.type === 'pageBreak') Icon = SeparatorHorizontal
  } else {
    const config = SECTION_CONFIG[sectionId]
    if (!config) return null
    label = config.label
    Icon = config.Icon
  }

  const isHidden = visibility.sections[sectionId] === false
  const hasData = sectionHasData(sectionId, resumeData)

  function toggleVisibility() {
    onVisibilityChange({
      ...visibility,
      sections: { ...visibility.sections, [sectionId]: !(!isHidden) },
    })
  }

  function handleTitleChange(newTitle: string) {
    if (!isCustom) return
    const newSections = [...(resumeData.customSections || [])]
    const idx = newSections.findIndex(c => c.id === sectionId)
    if (idx === -1) return
    newSections[idx] = { ...newSections[idx], title: newTitle }
    onDataChange({ ...resumeData, customSections: newSections })
  }

  function handleDeleteSection() {
    if (!isCustom) return
    // Page break is a single invisible marker — no "contents" to warn about,
    // and the confirm prompt sounds overdramatic for a one-click action.
    if (customConfig?.type !== 'pageBreak') {
      if (!window.confirm(`Are you sure you want to delete the "${label}" section and all its contents?`)) return
    }
    
    // 1. Remove from data.customSections
    const newCustom = (resumeData.customSections || []).filter(c => c.id !== sectionId)
    onDataChange({ ...resumeData, customSections: newCustom })

    // 2. Remove from visibility.sectionOrder and sidebarSectionOrder
    const newOrder = visibility.sectionOrder.filter(id => id !== sectionId)
    const newSidebarOrder = (visibility.sidebarSectionOrder || []).filter(id => id !== sectionId)

    // 3. Remove from visibility.sections
    const newSections = { ...visibility.sections }
    delete newSections[sectionId]

    // 4. Remove from visibility.items
    const newItems = { ...visibility.items }
    delete newItems[sectionId]

    onVisibilityChange({
      ...visibility,
      sectionOrder: newOrder,
      sidebarSectionOrder: newSidebarOrder,
      sections: newSections,
      items: newItems,
    })
    onSectionAction?.(sectionId, 'delete')
  }

  const isComplex = ['experience', 'education', 'projects', 'certifications'].includes(sectionId)

  function renderEditor() {
    if (isCustom) {
      if (customConfig?.type === 'complex') {
        return (
          <SubItemList
            sectionId={sectionId}
            resumeData={resumeData}
            visibility={visibility}
            onDataChange={onDataChange}
            onVisibilityChange={onVisibilityChange}
            focusPath={focusPath}
            onFocusHandled={onFocusHandled}
            onItemAdd={sectionType => onSectionAction?.(sectionType, 'add')}
            onItemDelete={sectionType => onSectionAction?.(sectionType, 'delete')}
            onItemEditorOpen={onSubSectionEditorOpened}
          />
        )
      } else if (customConfig?.type === 'tags') {
        return (
          <CustomTagsEditor
            sectionId={sectionId}
            data={resumeData}
            onChange={onDataChange}
            focusPath={focusPath}
            onFocusHandled={onFocusHandled}
          />
        )
      } else if (customConfig?.type === 'pageBreak') {
        return (
          <div className="p-4 text-sm text-zinc-600 bg-zinc-50/60 rounded-lg border border-dashed border-zinc-200">
            Content after this marker will start on a new page. Drag this row to position the break, or delete it to remove.
          </div>
        )
      } else {
        return (
          <CustomTextEditor
            sectionId={sectionId}
            data={resumeData}
            onChange={onDataChange}
            focusPath={focusPath}
            onFocusHandled={onFocusHandled}
          />
        )
      }
    }

    if (isComplex) {
      const sectionKey = sectionId as 'experience' | 'education' | 'projects' | 'certifications'
      return (
        <SubItemList
          sectionId={sectionKey}
          resumeData={resumeData}
          visibility={visibility}
          onDataChange={onDataChange}
          onVisibilityChange={onVisibilityChange}
          focusPath={focusPath}
          onFocusHandled={onFocusHandled}
          onItemAdd={sectionType => onSectionAction?.(sectionType, 'add')}
          onItemDelete={sectionType => onSectionAction?.(sectionType, 'delete')}
          onItemEditorOpen={onSubSectionEditorOpened}
        />
      )
    }
    switch (sectionId) {
      case 'contact':      return <ContactEditor data={resumeData} onChange={onDataChange} focusPath={focusPath} onFocusHandled={onFocusHandled} />
      case 'summary':      return <SummaryEditor data={resumeData} onChange={onDataChange} focusPath={focusPath} onFocusHandled={onFocusHandled} />
      case 'skills':       return <SkillsEditor data={resumeData} onChange={onDataChange} focusPath={focusPath} onFocusHandled={onFocusHandled} />
      case 'languages':    return <LanguagesEditor data={resumeData} onChange={onDataChange} focusPath={focusPath} onFocusHandled={onFocusHandled} />
      case 'interests':    return <InterestsEditor data={resumeData} onChange={onDataChange} focusPath={focusPath} onFocusHandled={onFocusHandled} />
      case 'volunteer':    return <VolunteerEditor data={resumeData} onChange={onDataChange} focusPath={focusPath} onFocusHandled={onFocusHandled} />
      case 'awards':       return <AwardsEditor data={resumeData} onChange={onDataChange} focusPath={focusPath} onFocusHandled={onFocusHandled} />
      case 'publications': return <PublicationsEditor data={resumeData} onChange={onDataChange} focusPath={focusPath} onFocusHandled={onFocusHandled} />
      case 'references':   return <ReferencesEditor data={resumeData} onChange={onDataChange} focusPath={focusPath} onFocusHandled={onFocusHandled} />
      default:             return null
    }
  }

  return (
    <div 
      ref={setNodeRef} 
      id={`section-row-${sectionId}`}
      style={style} 
      className={`relative mb-2 last:mb-0 overflow-hidden rounded-[1.15rem] border transition-all duration-200 ${
        isExpanded
          ? 'border-emerald-200 bg-white shadow-[0_18px_38px_rgba(15,23,42,0.08)]'
          : isHidden
            ? 'border-transparent bg-white/45 shadow-sm hover:border-zinc-200 hover:bg-white/70'
            : 'border-white/80 bg-white/78 shadow-[0_10px_26px_rgba(15,23,42,0.045)] hover:-translate-y-0.5 hover:border-emerald-100 hover:bg-white hover:shadow-[0_18px_38px_rgba(16,185,129,0.08)]'
      }`}
    >
      {isExpanded && (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-lime-300 to-emerald-500" />
      )}
      {/* Section row header */}
      <div className={`group flex cursor-pointer items-center justify-between gap-3 px-3 py-3.5 transition-all ${isExpanded ? 'text-emerald-800' : 'text-zinc-700'} ${isHidden ? 'opacity-70' : ''}`} onClick={(e) => {
        // Prevent expand if clicking visibility toggle or drag handle
        if ((e.target as HTMLElement).closest('button[data-action="prevent-expand"]')) return
        onExpand()
      }}>
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          {/* Drag handle */}
          {!isDragDisabled && (
            <button
              {...attributes}
              {...listeners}
              data-action="prevent-expand"
              className={`flex h-9 w-6 shrink-0 cursor-grab select-none items-center justify-center rounded-full transition-colors active:cursor-grabbing ${
                isExpanded
                  ? 'text-emerald-400 hover:bg-emerald-50 hover:text-emerald-600'
                  : 'text-zinc-300 hover:bg-zinc-100 hover:text-zinc-500 group-hover:text-zinc-400'
              }`}
              tabIndex={-1}
              aria-label="Drag to reorder"
            >
              <GripVertical size={16} />
            </button>
          )}

          {/* Icon & Label */}
          <div className={`flex min-w-0 flex-1 items-center gap-3 transition-opacity ${!hasData && !isExpanded && !isHidden ? 'opacity-60' : ''}`}>
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition-colors ${
              isExpanded
                ? 'bg-emerald-100 text-emerald-700'
                : isHidden
                  ? 'bg-zinc-100 text-zinc-400'
                  : hasData
                    ? 'bg-zinc-100 text-zinc-700 group-hover:bg-emerald-50 group-hover:text-emerald-700'
                    : 'bg-zinc-50 text-zinc-400 group-hover:bg-zinc-100 group-hover:text-zinc-500'
            }`}>
              <Icon size={18} className="shrink-0" />
            </div>
            {isEditingTitle && isCustom ? (
              <input
                value={label}
                maxLength={80}
                onChange={(e) => handleTitleChange(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => { if (e.key === 'Enter') setIsEditingTitle(false) }}
                onClick={(e) => e.stopPropagation()}
                data-action="prevent-expand"
                className="w-full border-none bg-transparent p-0 text-sm font-semibold text-emerald-700 placeholder:text-emerald-200 focus:ring-0"
                placeholder="Section Title"
                autoFocus
              />
            ) : (
              <div className="group/title flex min-w-0 flex-1 flex-col overflow-hidden">
                <div className="flex min-w-0 items-center gap-2">
                  <span className={`min-w-0 truncate text-[14px] leading-tight ${isExpanded ? 'font-black text-emerald-950' : 'font-semibold'}`}>{label}</span>
                  {hasHint && (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.8)]" />
                  )}
                  {isExpanded && isCustom && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsEditingTitle(true)
                      }}
                      data-action="prevent-expand"
                      className="rounded-full p-1 text-zinc-400 opacity-0 transition-opacity hover:bg-black/5 group-hover/title:opacity-100"
                      title="Edit Title"
                    >
                      <Pencil size={12} />
                    </button>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${
                    isHidden ? 'bg-zinc-300' : hasData ? 'bg-emerald-500' : 'bg-zinc-300'
                  }`} />
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">
                    {isHidden ? 'Hidden' : hasData ? 'Ready' : 'Empty'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right actions */}
        <div className="flex shrink-0 items-center gap-1.5">
          {/* Visibility toggle — hidden for page-break markers because a hidden
              page break is an invisible time bomb: the user can't see why their
              pagination is behaving oddly. Page breaks are delete-only. */}
          {customConfig?.type !== 'pageBreak' && (
            <button
              onClick={toggleVisibility}
              data-action="prevent-expand"
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                isHidden
                  ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                  : 'bg-zinc-100 text-zinc-400 hover:bg-emerald-50 hover:text-emerald-700'
              }`}
              title={isHidden ? 'Show section' : 'Hide section'}
              aria-label={isHidden ? 'Show section' : 'Hide section'}
            >
              {isHidden
                ? <EyeOff size={15} />
                : <Eye size={15} className="opacity-75 transition-opacity group-hover:opacity-100" />
              }
            </button>
          )}

          {/* Delete button (only for custom sections) */}
          {isCustom && (
            <button
              onClick={handleDeleteSection}
              data-action="prevent-expand"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-300 transition-colors hover:bg-red-50 hover:text-red-500"
              title="Delete Section"
            >
              <Trash2 size={15} />
            </button>
          )}

          {/* The Optic "Hover Pill" + Chevron */}
          <div className="ml-1 flex items-center gap-1.5">
            {!isExpanded && (
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase transition-opacity ${
                hasData
                  ? 'bg-emerald-100 text-emerald-700 opacity-100'
                  : 'bg-zinc-100 text-zinc-400 opacity-0 group-hover:opacity-100'
              }`}>
                {hasData ? 'Edit' : 'Add'}
              </span>
            )}
            
            <svg 
              className={`h-4 w-4 text-zinc-300 transition-transform duration-200 group-hover:text-zinc-500 ${isExpanded ? 'rotate-90 text-emerald-500' : ''}`} 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </div>
        </div>
      </div>

      {/* Hidden indicator */}
      {isHidden && !isExpanded && (
        <div className="px-[4.6rem] pb-3 text-[11px] font-semibold tracking-tight text-amber-600">
          Hidden from resume output
        </div>
      )}

      {/* Expanded editor */}
      {isExpanded && (
        <div className="border-t border-emerald-100 bg-gradient-to-b from-emerald-50/35 to-white">
          {renderEditor()}
        </div>
      )}
    </div>
  )
}

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

function sectionHasData(sectionId: string, data: ResumeData): boolean {
  if (sectionId.startsWith('custom_')) {
    const custom = data.customSections?.find(c => c.id === sectionId)
    if (!custom) return false
    if (custom.type === 'text') return !!custom.text?.trim()
    if (custom.type === 'tags') return !!custom.tags && custom.tags.length > 0
    if (custom.type === 'complex') return !!custom.items && custom.items.length > 0
    if (custom.type === 'pageBreak') return true // marker is always "active"
    return false
  }

  switch (sectionId) {
    case 'contact':        return !!(data.name || data.email || data.phone)
    case 'summary':        return !!data.summary
    case 'experience':     return data.experience.length > 0
    case 'education':      return data.education.length > 0
    case 'skills':         return getResumeSkills(data).length > 0
    case 'projects':       return data.projects.length > 0
    case 'certifications': return data.certifications.length > 0
    case 'volunteer':      return data.volunteer.length > 0
    case 'languages':      return data.languages.length > 0
    case 'interests':      return data.interests.length > 0
    case 'awards':         return data.awards.length > 0
    case 'publications':   return data.publications.length > 0
    case 'references':     return data.references.length > 0
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
      className={`mb-2 last:mb-0 transition-all ${isExpanded ? 'rounded-xl shadow-sm border border-emerald-100/50 bg-surface-container-lowest' : 'rounded-xl hover:bg-zinc-100'}`}
    >
      {/* Section row header */}
      <div className={`group flex items-center justify-between px-4 py-3 cursor-pointer transition-all ${isExpanded ? 'text-emerald-700' : 'text-zinc-600'} ${isHidden ? 'opacity-50' : ''}`} onClick={(e) => {
        // Prevent expand if clicking visibility toggle or drag handle
        if ((e.target as HTMLElement).closest('button[data-action="prevent-expand"]')) return
        onExpand()
      }}>
        <div className="flex items-center gap-3">
          {/* Drag handle */}
          {!isDragDisabled && (
            <button
              {...attributes}
              {...listeners}
              data-action="prevent-expand"
              className={`cursor-grab active:cursor-grabbing p-0.5 select-none transition-colors ${isExpanded ? 'text-emerald-300 hover:text-emerald-500' : 'text-zinc-300 hover:text-zinc-500 group-hover:text-zinc-400'}`}
              tabIndex={-1}
              aria-label="Drag to reorder"
            >
              <GripVertical size={16} />
            </button>
          )}

          {/* Icon & Label */}
          <div className={`flex min-w-0 flex-1 items-center gap-2 transition-opacity ${!hasData && !isExpanded ? 'opacity-35' : ''}`}>
            <Icon size={18} className={`shrink-0 ${isExpanded ? 'text-primary' : ''}`} />
            {isEditingTitle && isCustom ? (
              <input
                value={label}
                maxLength={80}
                onChange={(e) => handleTitleChange(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => { if (e.key === 'Enter') setIsEditingTitle(false) }}
                onClick={(e) => e.stopPropagation()}
                data-action="prevent-expand"
                className="bg-transparent border-none p-0 text-sm font-semibold text-emerald-700 focus:ring-0 w-full placeholder:text-emerald-200"
                placeholder="Section Title"
                autoFocus
              />
            ) : (
              <div className="flex-1 flex items-center gap-2 group/title min-w-0 overflow-hidden">
                <span className={`min-w-0 text-sm break-words ${isExpanded ? 'font-semibold' : 'font-medium'}`}>{label}</span>
                {isExpanded && isCustom && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsEditingTitle(true)
                    }}
                    data-action="prevent-expand"
                    className="p-1 rounded hover:bg-black/5 text-zinc-400 opacity-0 group-hover/title:opacity-100 transition-opacity"
                    title="Edit Title"
                  >
                    <Pencil size={12} />
                  </button>
                )}
              </div>
            )}
            {hasHint && (
              <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0 ml-1" />
            )}
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Visibility toggle — hidden for page-break markers because a hidden
              page break is an invisible time bomb: the user can't see why their
              pagination is behaving oddly. Page breaks are delete-only. */}
          {customConfig?.type !== 'pageBreak' && (
            <button
              onClick={toggleVisibility}
              data-action="prevent-expand"
              className="p-1 rounded-md hover:bg-black/5 transition-colors"
              title={isHidden ? 'Show section' : 'Hide section'}
              aria-label={isHidden ? 'Show section' : 'Hide section'}
            >
              {isHidden
                ? <EyeOff size={15} className="text-zinc-400" />
                : <Eye size={15} className="text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              }
            </button>
          )}

          {/* Delete button (only for custom sections) */}
          {isCustom && (
            <button
              onClick={handleDeleteSection}
              data-action="prevent-expand"
              className="p-1 rounded-md hover:bg-red-50 text-zinc-300 hover:text-red-500 transition-colors"
              title="Delete Section"
            >
              <Trash2 size={15} />
            </button>
          )}

          {/* The Optic "Hover Pill" + Chevron */}
          <div className="flex items-center gap-1.5 ml-1">
            {!isExpanded && (
              <span className={`text-[10px] font-bold text-primary uppercase bg-primary-container px-1.5 py-0.5 rounded transition-opacity ${hasData ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                {hasData ? 'Edit' : 'Add'}
              </span>
            )}
            
            <svg 
              className={`w-4 h-4 text-zinc-300 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} 
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
        <div className="px-12 pb-2 text-[11px] text-amber-500 font-medium tracking-tight">
          Hidden from resume output
        </div>
      )}

      {/* Expanded editor */}
      {isExpanded && (
        <div className="border-t border-emerald-50 bg-white bg-opacity-50">
          {renderEditor()}
        </div>
      )}
    </div>
  )
}

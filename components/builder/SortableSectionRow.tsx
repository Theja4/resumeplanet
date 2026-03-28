'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Eye, EyeOff, Plus, Pencil,
  User, AlignLeft, Briefcase, GraduationCap, Zap,
  Code, Award, Heart, Globe, Star, Trophy, BookOpen, Users,
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
  switch (sectionId) {
    case 'contact':        return !!(data.name || data.email || data.phone)
    case 'summary':        return !!data.summary
    case 'experience':     return data.experience.length > 0
    case 'education':      return data.education.length > 0
    case 'skills':         return data.skills.length > 0
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
}: Props) {
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: sectionId })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const config = SECTION_CONFIG[sectionId]
  if (!config) return null
  const { label, Icon } = config

  const isHidden = visibility.sections[sectionId] === false
  const hasData = sectionHasData(sectionId, resumeData)

  function toggleVisibility() {
    onVisibilityChange({
      ...visibility,
      sections: { ...visibility.sections, [sectionId]: !(!isHidden) },
    })
  }

  // For complex sections: use SubItemList; for simple: use existing editors
  const isComplex = ['experience', 'education', 'projects', 'certifications'].includes(sectionId)

  function renderEditor() {
    if (isComplex) {
      const sectionKey = sectionId as 'experience' | 'education' | 'projects' | 'certifications'
      return (
        <SubItemList
          sectionId={sectionKey}
          resumeData={resumeData}
          visibility={visibility}
          onDataChange={onDataChange}
          onVisibilityChange={onVisibilityChange}
        />
      )
    }
    switch (sectionId) {
      case 'contact':      return <ContactEditor data={resumeData} onChange={onDataChange} />
      case 'summary':      return <SummaryEditor data={resumeData} onChange={onDataChange} />
      case 'skills':       return <SkillsEditor data={resumeData} onChange={onDataChange} />
      case 'languages':    return <LanguagesEditor data={resumeData} onChange={onDataChange} />
      case 'interests':    return <InterestsEditor data={resumeData} onChange={onDataChange} />
      case 'volunteer':    return <VolunteerEditor data={resumeData} onChange={onDataChange} />
      case 'awards':       return <AwardsEditor data={resumeData} onChange={onDataChange} />
      case 'publications': return <PublicationsEditor data={resumeData} onChange={onDataChange} />
      case 'references':   return <ReferencesEditor data={resumeData} onChange={onDataChange} />
      default:             return null
    }
  }

  return (
    <div ref={setNodeRef} style={style} className="border-b border-gray-100 last:border-b-0">
      {/* Section row header */}
      <div className={`flex items-center px-3 py-2.5 hover:bg-gray-50 transition-colors group ${isHidden ? 'opacity-60' : ''}`}>
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 text-gray-300 hover:text-gray-500 mr-1 shrink-0"
          tabIndex={-1}
          aria-label="Drag to reorder"
        >
          <GripVertical size={14} />
        </button>

        {/* Section icon + label — clicking expands */}
        <button
          onClick={onExpand}
          className="flex items-center gap-2 flex-1 text-left min-w-0"
        >
          <Icon size={14} className="text-gray-500 shrink-0" />
          <span className="flex-1 text-sm font-medium text-gray-700 truncate">{label}</span>
          {hasHint && (
            <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0" />
          )}
        </button>

        {/* Right actions */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Visibility toggle */}
          <button
            onClick={toggleVisibility}
            className="p-1.5 rounded hover:bg-gray-200 transition-colors"
            title={isHidden ? 'Show section' : 'Hide section'}
          >
            {isHidden
              ? <EyeOff size={14} className="text-gray-300" />
              : <Eye size={14} className="text-gray-400" />
            }
          </button>

          {/* EDIT / + ADD */}
          <button
            onClick={onExpand}
            className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded transition-colors ${
              hasData
                ? 'text-indigo-600 hover:bg-indigo-50'
                : 'text-gray-400 hover:bg-gray-100'
            }`}
          >
            {hasData ? <><Pencil size={11} /> EDIT</> : <><Plus size={11} /> ADD</>}
          </button>
        </div>
      </div>

      {/* Hidden indicator */}
      {isHidden && !isExpanded && (
        <div className="px-10 pb-1.5 text-xs text-gray-400 italic">
          Hidden from resume
        </div>
      )}

      {/* Expanded editor */}
      {isExpanded && (
        <div className="border-t border-gray-100 bg-gray-50">
          {renderEditor()}
        </div>
      )}
    </div>
  )
}

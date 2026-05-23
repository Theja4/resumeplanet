'use client'

import { useRef } from 'react'
import { Link as LinkIcon } from 'lucide-react'
import type { ContactLinkField, ContactLinkToggles, ResumeData } from '@/types'
import { CONTACT_LINK_FIELDS } from '@/types'
import { useFocusFieldPath } from './useFocusFieldPath'

interface EditorProps {
  data: ResumeData
  onChange: (updated: ResumeData) => void
  focusPath?: string | null
  onFocusHandled?: () => void
  /**
   * Per-field "render this as a hyperlink in the resume" toggles. The
   * inline toggle button next to each link-eligible field flips its entry
   * in this record. When undefined the editor still renders but the link
   * toggle buttons are no-ops (defensive — should always be provided).
   */
  contactLinkToggles?: ContactLinkToggles
  onContactLinkTogglesChange?: (toggles: ContactLinkToggles) => void
}

// Hard caps prevent paste-bombing a 4MB image-data-URI into an email field
// (it gets converted to a string and would torch save performance + DB rows).
const FIELDS: { key: keyof ResumeData; label: string; type: string; placeholder?: string; maxLength: number; linkField?: ContactLinkField }[] = [
  { key: 'name', label: 'Full Name', type: 'text', maxLength: 120 },
  { key: 'currentRole', label: 'Current Role', type: 'text', placeholder: 'e.g. Senior Software Engineer', maxLength: 120 },
  { key: 'email', label: 'Email', type: 'email', maxLength: 254, linkField: 'email' },
  { key: 'phone', label: 'Phone', type: 'tel', maxLength: 40, linkField: 'phone' },
  { key: 'location', label: 'Location', type: 'text', placeholder: 'City, Country', maxLength: 120 },
  { key: 'linkedin', label: 'LinkedIn URL', type: 'url', maxLength: 500, linkField: 'linkedin' },
  { key: 'website', label: 'Website URL', type: 'url', maxLength: 500, linkField: 'website' },
]

export default function ContactEditor({
  data,
  onChange,
  focusPath,
  onFocusHandled,
  contactLinkToggles,
  onContactLinkTogglesChange,
}: EditorProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  useFocusFieldPath({ focusPath, rootRef, onHandled: onFocusHandled })

  function handleChange(key: keyof ResumeData, value: string) {
    onChange({ ...data, [key]: value })
  }

  function toggleLinkField(field: ContactLinkField) {
    if (!onContactLinkTogglesChange) return
    const next: ContactLinkToggles = { ...(contactLinkToggles ?? {}) }
    if (next[field]) {
      delete next[field]
    } else {
      next[field] = true
    }
    onContactLinkTogglesChange(next)
  }

  return (
    <div ref={rootRef} className="space-y-4 p-4">
      {FIELDS.map(({ key, label, type, placeholder, maxLength, linkField }) => {
        const inputId = `field-contact-${key}`
        const isLinkActive = Boolean(linkField && contactLinkToggles?.[linkField])
        return (
          <div key={key}>
            <label htmlFor={inputId} className="block text-sm font-medium text-gray-600 mb-1.5">
              {label}
            </label>
            <div className="flex items-stretch gap-2">
              <input
                id={inputId}
                type={type}
                value={(data[key] as string) ?? ''}
                data-field-path={key}
                placeholder={placeholder}
                maxLength={maxLength}
                onChange={(e) => handleChange(key, e.target.value)}
                className="flex-1 min-w-0 rounded-md border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              {linkField && (
                <button
                  type="button"
                  onClick={() => toggleLinkField(linkField)}
                  title={isLinkActive ? `Showing ${label} as a clickable link` : `Render ${label} as plain text`}
                  aria-pressed={isLinkActive}
                  aria-label={`${isLinkActive ? 'Disable' : 'Enable'} hyperlink for ${label}`}
                  className={`shrink-0 flex items-center justify-center w-10 rounded-md border transition-all ${
                    isLinkActive
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                      : 'border-gray-200 bg-white text-gray-400 hover:border-gray-300 hover:text-gray-600'
                  }`}
                >
                  <LinkIcon size={15} />
                </button>
              )}
            </div>
          </div>
        )
      })}
      {CONTACT_LINK_FIELDS.length > 0 && (
        <p className="text-[11px] text-gray-500 leading-relaxed">
          Click the <LinkIcon size={11} className="inline align-text-bottom mx-0.5" /> next to a field to render it as a clickable hyperlink in the resume preview and PDF. Off by default — some ATS systems strip <code>&lt;a&gt;</code> tags.
        </p>
      )}
    </div>
  )
}

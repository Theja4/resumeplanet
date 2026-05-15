'use client'

import type { ResumeLioSocialLinks } from '@/types'
import type { ComponentType } from 'react'
import { Globe, Mail, Phone } from 'lucide-react'
import { useResumeLioEdit } from './edit/ResumeLioEditContext'
import { EditableLink } from './edit/EditableLink'

function LinkedInIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  )
}

function GitHubIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
    </svg>
  )
}

function GitLabIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="m23.6004 9.5927-.0337-.0862L20.3.9814a.851.851 0 0 0-.3362-.405.8748.8748 0 0 0-.9997.0539.8748.8748 0 0 0-.29.4399l-2.2055 6.748H7.5375l-2.2057-6.748a.8573.8573 0 0 0-.29-.4412.8748.8748 0 0 0-.9997-.0537.8585.8585 0 0 0-.3362.4049L.4332 9.5015l-.0325.0862a6.0657 6.0657 0 0 0 2.0119 7.0105l.0113.0087.03.0213 4.976 3.7264 2.462 1.8633 1.4995 1.1321a1.0085 1.0085 0 0 0 1.2197 0l1.4995-1.1321 2.4619-1.8633 5.006-3.7489.0125-.01a6.0682 6.0682 0 0 0 2.0094-7.003z" />
    </svg>
  )
}

const ALL_LINK_SLOTS: { key: keyof ResumeLioSocialLinks; label: string; Icon: ComponentType<{ size?: number }>; hrefPrefix?: string }[] = [
  { key: 'linkedin', label: 'LinkedIn', Icon: LinkedInIcon },
  { key: 'github', label: 'GitHub', Icon: GitHubIcon },
  { key: 'gitlab', label: 'GitLab', Icon: GitLabIcon },
  { key: 'website', label: 'Website', Icon: Globe },
  { key: 'email', label: 'Email', Icon: Mail, hrefPrefix: 'mailto:' },
  { key: 'phone', label: 'Phone', Icon: Phone, hrefPrefix: 'tel:' },
]

export interface SocialLinksBarProps {
  links: ResumeLioSocialLinks
  className?: string
  iconClassName?: string
  textClassName?: string
  style?: React.CSSProperties
}

export function SocialLinksBar({ links, className = '', iconClassName = '', textClassName = '', style }: SocialLinksBarProps) {
  const ctx = useResumeLioEdit()
  const isEditing = !!ctx?.editMode

  // In edit mode: show all slots (even empty) so user can add links
  // In view mode: only show populated links
  const items = isEditing
    ? ALL_LINK_SLOTS.map(slot => ({
        ...slot,
        value: (links[slot.key] as string) || '',
        href: (links[slot.key] as string)
          ? (slot.hrefPrefix || '') + links[slot.key]
          : '#',
      }))
    : ALL_LINK_SLOTS
        .filter(slot => links[slot.key])
        .map(slot => ({
          ...slot,
          value: links[slot.key] as string,
          href: (slot.hrefPrefix || '') + links[slot.key],
        }))

  if (items.length === 0) return null

  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`} style={style}>
      {items.map(({ key, href, value, label, Icon }) => {
        const content = (
          <>
            <span className={iconClassName}>
              <Icon size={14} />
            </span>
            <span className="text-sm">{value || `Add ${label}`}</span>
          </>
        )

        if (isEditing) {
          return (
            <EditableLink
              key={key}
              linkField={`social.${key}`}
              href={href}
              className={`inline-flex items-center gap-1.5 transition-colors ${textClassName} ${!value ? 'opacity-40 border border-dashed border-current rounded-full px-2 py-0.5' : ''}`}
            >
              {content}
            </EditableLink>
          )
        }

        return (
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noopener noreferrer nofollow ugc"
            className={`inline-flex items-center gap-1.5 transition-colors ${textClassName}`}
          >
            {content}
          </a>
        )
      })}
    </div>
  )
}

'use client'

import { sanitizeUniversalConfig } from '@/lib/templateOptions'
import type { UniversalConfig } from '@/types'

interface TemplatePresetThumbnailProps {
  config: UniversalConfig
}

function SectionHeadingPreview({
  title,
  style,
  accent,
}: {
  title: string
  style: UniversalConfig['sectionHeadingStyle']
  accent: string
}) {
  if (style === 'latex-rule') {
    return (
      <div className="space-y-0.5">
        <div className="text-[7px] font-normal leading-none text-black" style={{ fontVariantCaps: 'small-caps' }}>
          {title}
        </div>
        <div className="h-px bg-black" />
      </div>
    )
  }

  if (style === 'minimal') {
    return <div className="text-[6px] font-semibold uppercase tracking-[0.16em] text-zinc-700">{title}</div>
  }

  if (style === 'label') {
    return (
      <div className="flex items-center gap-1.5">
        <div className="text-[6px] font-semibold uppercase tracking-[0.16em] text-zinc-700">{title}</div>
        <div className="h-px flex-1 bg-zinc-200" />
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <div className="text-[6px] font-bold uppercase tracking-[0.18em]" style={{ color: accent }}>
        {title}
      </div>
      <div className="h-px bg-zinc-200" />
    </div>
  )
}

function ContactPreview({
  centered,
  stacked,
}: {
  centered: boolean
  stacked: boolean
}) {
  const className = `text-[5px] leading-[1.35] text-zinc-500 ${centered ? 'text-center' : ''}`

  if (stacked) {
    return (
      <div className={`mt-1 space-y-0.5 ${centered ? 'items-center' : ''}`}>
        <div className={className}>alex@email.com</div>
        <div className={className}>linkedin.com/in/alex</div>
      </div>
    )
  }

  return (
    <div className={`mt-1 flex flex-wrap gap-x-1.5 gap-y-0.5 ${centered ? 'justify-center' : ''}`}>
      <span className={className}>alex@email.com</span>
      <span className={className}>Seattle, WA</span>
      <span className={className}>linkedin.com/in/alex</span>
    </div>
  )
}

function HeaderPreview({
  config,
  accent,
}: {
  config: UniversalConfig
  accent: string
}) {
  const isBanner = config.headerStyle === 'banner'
  const isTimeless = config.headerStyle === 'timeless'
  const isCentered = config.headerStyle === 'centered' || isTimeless
  const isCompact = config.headerStyle === 'compact'
  const titleClassName =
    isTimeless
      ? 'text-[9px]'
      : config.nameSize === 'hero'
      ? 'text-[8px]'
      : config.nameSize === 'large'
        ? 'text-[7px]'
        : 'text-[6.5px]'
  const roleClassName =
    config.nameSize === 'hero'
      ? 'text-[5.5px]'
      : config.nameSize === 'large'
        ? 'text-[5px]'
        : 'text-[4.5px]'

  const content = isTimeless ? (
    <div className="text-center font-serif text-black">
      <div className={`${titleClassName} font-bold leading-none`} style={{ fontVariantCaps: 'small-caps' }}>
        Alexandra Reed
      </div>
      <div className="mt-1 flex flex-wrap justify-center gap-x-0.5 text-[4.8px] leading-tight text-black">
        <span>(555) 123-4567</span>
        <span>|</span>
        <span className="underline">alex@email.com</span>
        <span>|</span>
        <span className="underline">linkedin.com/in/alex</span>
      </div>
    </div>
  ) : (
    <>
      <div className={`${titleClassName} font-black uppercase tracking-[0.16em] text-zinc-900 ${isCentered ? 'text-center' : ''}`}>
        Alexandra Reed
      </div>
      <div
        className={`${roleClassName} mt-0.5 font-semibold uppercase tracking-[0.18em] ${isCentered ? 'text-center' : ''}`}
        style={{ color: accent }}
      >
        Product Marketing Lead
      </div>
      {config.headerStyle === 'classic' && <div className="mt-1.5 h-px bg-zinc-200" />}
      <ContactPreview centered={isCentered} stacked={config.contactStyle === 'stacked'} />
    </>
  )

  if (isBanner) {
    return (
      <div
        className="flex min-h-[58px] items-center justify-between gap-2 px-3 py-2.5"
        style={{ backgroundColor: accent }}
      >
        <div className="min-w-0 flex-1">
          <div className={`${titleClassName} font-black uppercase tracking-[0.16em] text-white`}>
            Alexandra Reed
          </div>
          <div className={`${roleClassName} mt-0.5 font-semibold uppercase tracking-[0.18em] text-white/75`}>
            Product Marketing Lead
          </div>
        </div>

        <div className="w-[44px] shrink-0 space-y-0.5 text-right">
          <div className="text-[4.5px] leading-[1.35] text-white/90">alex@email.com</div>
          <div className="text-[4.5px] leading-[1.35] text-white/90">(555) 123-4567</div>
          <div className="text-[4.5px] leading-[1.35] text-white/90">linkedin.com/in/alex</div>
          <div className="text-[4.5px] leading-[1.35] text-white/90">Seattle, WA</div>
        </div>
      </div>
    )
  }

  return <div className={`${isCompact ? 'space-y-0.5' : 'space-y-1'}`}>{content}</div>
}

function ExperiencePreview({
  config,
  accent,
  bulletGlyph,
}: {
  config: UniversalConfig
  accent: string
  bulletGlyph: string
}) {
  const dateText = '2022-Present'
  const isLatex = config.bulletStyle === 'latex' || config.sectionHeadingStyle === 'latex-rule'

  if (isLatex) {
    return (
      <div className="space-y-0.5 pl-1.5 font-serif text-black">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="text-[6px] font-bold leading-tight text-black">Senior Product Manager</div>
            <div className="text-[5px] italic leading-tight text-black">Northwind Systems</div>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-[5.5px] leading-tight text-black">{dateText}</div>
            <div className="text-[5px] italic leading-tight text-black">Seattle, WA</div>
          </div>
        </div>
        <div className="space-y-0 pl-2">
          {['Scaled onboarding conversion', 'Reduced manual reporting'].map((line) => (
            <div key={line} className="flex items-start gap-1">
              <span className="text-[5px] leading-tight text-black">{bulletGlyph}</span>
              <span className="text-[5px] leading-tight text-black">{line}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <div className={config.dateLayout === 'right' ? 'flex items-start justify-between gap-2' : 'space-y-0.5'}>
        <div className="min-w-0 flex-1">
          <div className="text-[6px] font-semibold text-zinc-900">Senior Product Manager</div>
          <div className="text-[5px] text-zinc-500">Northwind Systems</div>
        </div>
        {config.dateLayout === 'right' && (
          <div className="shrink-0 text-right text-[4.5px] uppercase tracking-[0.12em] text-zinc-400">
            <div>{dateText}</div>
            <div>Seattle, WA</div>
          </div>
        )}
      </div>

      {config.dateLayout === 'inline' && (
        <div className="text-[4.5px] uppercase tracking-[0.12em] text-zinc-400">
          <div>{dateText}</div>
          <div>Seattle, WA</div>
        </div>
      )}

      <div className="space-y-0.5">
        {['Scaled onboarding conversion', 'Reduced manual reporting'].map((line) => (
          <div key={line} className="flex items-start gap-1.5">
            <span className="text-[6px] font-semibold leading-none" style={{ color: accent }}>
              {bulletGlyph}
            </span>
            <span className="text-[5px] leading-[1.35] text-zinc-500">{line}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SkillsPreview({
  config,
}: {
  config: UniversalConfig
}) {
  return (
    <div className="text-[5px] leading-[1.35] text-zinc-500">
      {config.skillsStyle === 'divider' ? 'SQL • Figma • Python' : 'SQL, Figma, Python'}
    </div>
  )
}

export default function TemplatePresetThumbnail({
  config,
}: TemplatePresetThumbnailProps) {
  const safeConfig = sanitizeUniversalConfig(config)
  const accent = safeConfig.accentColor || '#1e293b'
  const bulletGlyph =
    safeConfig.bulletStyle === 'dash'
      ? '-'
      : safeConfig.bulletStyle === 'square'
        ? '■'
        : '•'
  const isTimeless = safeConfig.headerStyle === 'timeless'

  return (
    <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.08)]">
      <div className="h-full bg-[linear-gradient(180deg,#ffffff_0%,#fafafa_100%)]">
        {safeConfig.headerStyle === 'banner' ? (
          <div className="flex h-full flex-col">
            <HeaderPreview config={safeConfig} accent={accent} />
            <div className="flex-1 p-3">
              <div className="space-y-2.5">
                <div className="space-y-1.5">
                  <SectionHeadingPreview title="Work Experience" style={safeConfig.sectionHeadingStyle} accent={accent} />
                  <ExperiencePreview config={safeConfig} accent={accent} bulletGlyph={bulletGlyph} />
                </div>

                <div className="space-y-1.5">
                  <SectionHeadingPreview title="Education" style={safeConfig.sectionHeadingStyle} accent={accent} />
                  <div className={safeConfig.dateLayout === 'right' ? 'flex items-start justify-between gap-2' : 'space-y-0.5'}>
                    <div className="min-w-0 flex-1">
                      <div className="text-[6px] font-semibold text-zinc-900">University of Washington</div>
                      <div className="text-[5px] text-zinc-500">B.S. Marketing Analytics</div>
                    </div>
                    {safeConfig.dateLayout === 'right' && (
                      <div className="shrink-0 text-[4.5px] uppercase tracking-[0.12em] text-zinc-400">2021</div>
                    )}
                  </div>
                  {safeConfig.dateLayout === 'inline' && (
                    <div className="text-[4.5px] uppercase tracking-[0.12em] text-zinc-400">2021</div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <SectionHeadingPreview title="Skills" style={safeConfig.sectionHeadingStyle} accent={accent} />
                  <SkillsPreview config={safeConfig} />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={`flex h-full flex-col ${isTimeless ? 'gap-2.5 p-3 font-serif' : safeConfig.headerStyle === 'compact' ? 'gap-2.5 p-3' : 'gap-3 p-3'}`}>
            <HeaderPreview config={safeConfig} accent={accent} />

            <div className="space-y-2.5">
              <div className="space-y-1.5">
                <SectionHeadingPreview title="Work Experience" style={safeConfig.sectionHeadingStyle} accent={accent} />
                <ExperiencePreview config={safeConfig} accent={accent} bulletGlyph={bulletGlyph} />
              </div>

              <div className="space-y-1.5">
                <SectionHeadingPreview title="Education" style={safeConfig.sectionHeadingStyle} accent={accent} />
                <div className={safeConfig.dateLayout === 'right' ? 'flex items-start justify-between gap-2' : 'space-y-0.5'}>
                  <div className="min-w-0 flex-1">
                    <div className="text-[6px] font-semibold text-zinc-900">University of Washington</div>
                    <div className="text-[5px] text-zinc-500">B.S. Marketing Analytics</div>
                  </div>
                  {safeConfig.dateLayout === 'right' && (
                    <div className="shrink-0 text-[4.5px] uppercase tracking-[0.12em] text-zinc-400">2021</div>
                  )}
                </div>
                {safeConfig.dateLayout === 'inline' && (
                  <div className="text-[4.5px] uppercase tracking-[0.12em] text-zinc-400">2021</div>
                )}
              </div>

              <div className="space-y-1.5">
                <SectionHeadingPreview title="Skills" style={safeConfig.sectionHeadingStyle} accent={accent} />
                <SkillsPreview config={safeConfig} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

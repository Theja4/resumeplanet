import { DEFAULT_UNIVERSAL_CONFIG } from '@/types'
import type {
  UniversalBulletStyle,
  UniversalConfig,
  UniversalContactStyle,
  UniversalDateLayout,
  UniversalHeaderStyle,
  UniversalNameSize,
  UniversalSectionHeadingStyle,
  UniversalSkillsStyle,
} from '@/types'

export interface FontOption {
  id: string
  label: string
  value: string
}

export interface ColorTheme {
  id: string
  label: string
  accent: string
  swatches: string[]
}

export interface TemplateOption<T extends string> {
  value: T
  label: string
  description: string
}

export interface TemplatePreset {
  id: string
  label: string
  description: string
  config: UniversalConfig
}

export const FONT_OPTIONS: FontOption[] = [
  { id: 'inter', label: 'Inter', value: 'Inter, ui-sans-serif, system-ui, sans-serif' },
  { id: 'calibri', label: 'Calibri', value: 'Calibri, Candara, "Segoe UI", sans-serif' },
  { id: 'arial', label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { id: 'helvetica', label: 'Helvetica', value: 'Helvetica, Arial, sans-serif' },
  { id: 'cambria', label: 'Cambria', value: 'Cambria, Georgia, serif' },
  { id: 'georgia', label: 'Georgia', value: 'Georgia, "Times New Roman", Times, serif' },
  { id: 'garamond', label: 'Garamond', value: 'Garamond, "EB Garamond", serif' },
  { id: 'times', label: 'Times New Roman', value: '"Times New Roman", Times, Georgia, serif' },
  { id: 'verdana', label: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
  { id: 'trebuchet', label: 'Trebuchet MS', value: '"Trebuchet MS", Helvetica, sans-serif' },
]

export const COLOR_THEMES: ColorTheme[] = [
  {
    id: 'none',
    label: 'Default',
    accent: '',
    swatches: ['#4F46E5', '#818cf8', '#e0e7ff'],
  },
  {
    id: 'slate',
    label: 'Slate',
    accent: '#1e293b',
    swatches: ['#1e293b', '#475569', '#f1f5f9'],
  },
  {
    id: 'forest',
    label: 'Forest',
    accent: '#026d32',
    swatches: ['#026d32', '#16a34a', '#dcfce7'],
  },
  {
    id: 'ocean',
    label: 'Ocean',
    accent: '#0369a1',
    swatches: ['#0369a1', '#0ea5e9', '#e0f2fe'],
  },
  {
    id: 'navy',
    label: 'Navy',
    accent: '#1e3a5f',
    swatches: ['#1e3a5f', '#2563eb', '#dbeafe'],
  },
  {
    id: 'crimson',
    label: 'Crimson',
    accent: '#b91c1c',
    swatches: ['#b91c1c', '#ef4444', '#fee2e2'],
  },
  {
    id: 'plum',
    label: 'Plum',
    accent: '#7c3aed',
    swatches: ['#7c3aed', '#a78bfa', '#ede9fe'],
  },
  {
    id: 'amber',
    label: 'Amber',
    accent: '#92400e',
    swatches: ['#92400e', '#d97706', '#fef3c7'],
  },
  {
    id: 'teal',
    label: 'Teal',
    accent: '#0f766e',
    swatches: ['#0f766e', '#14b8a6', '#ccfbf1'],
  },
  {
    id: 'rose',
    label: 'Rose',
    accent: '#9f1239',
    swatches: ['#9f1239', '#f43f5e', '#ffe4e6'],
  },
]

export const HEADER_STYLE_OPTIONS: Array<TemplateOption<UniversalHeaderStyle>> = [
  { value: 'classic', label: 'Classic', description: 'Left-aligned with a clear divider.' },
  { value: 'banner', label: 'Banner', description: 'Tinted header block, still single-column.' },
  { value: 'minimal', label: 'Minimal', description: 'Plain hierarchy with more white space.' },
  { value: 'centered', label: 'Centered', description: 'Centered header with a formal body.' },
  { value: 'compact', label: 'Compact', description: 'Tighter top section for one-page resumes.' },
]

export const SECTION_HEADING_OPTIONS: Array<TemplateOption<UniversalSectionHeadingStyle>> = [
  { value: 'rule', label: 'Rule', description: 'Uppercase heading with an underline.' },
  { value: 'label', label: 'Label', description: 'Label treatment with a trailing rule.' },
  { value: 'minimal', label: 'Minimal', description: 'Simple title-case headings.' },
]

export const BULLET_STYLE_OPTIONS: Array<TemplateOption<UniversalBulletStyle>> = [
  { value: 'plain', label: 'Dot', description: 'Standard ATS-safe bullets.' },
  { value: 'dash', label: 'Dash', description: 'Flat, understated bullets.' },
  { value: 'square', label: 'Square', description: 'Sharper bullet marker.' },
]

export const SKILLS_STYLE_OPTIONS: Array<TemplateOption<UniversalSkillsStyle>> = [
  { value: 'inline', label: 'Comma', description: 'Runs inline like a sentence.' },
  { value: 'divider', label: 'Divider', description: 'Inline skills split by centered dots.' },
  { value: 'stacked', label: 'Stacked', description: 'Each skill sits on its own line.' },
]

export const CONTACT_STYLE_OPTIONS: Array<TemplateOption<UniversalContactStyle>> = [
  { value: 'inline', label: 'Inline', description: 'Wraps across one row.' },
  { value: 'stacked', label: 'Stacked', description: 'One contact detail per line.' },
]

export const DATE_LAYOUT_OPTIONS: Array<TemplateOption<UniversalDateLayout>> = [
  { value: 'right', label: 'Right Aligned', description: 'Keeps dates on the far right.' },
  { value: 'inline', label: 'Inline', description: 'Places dates below the role block.' },
]

export const NAME_SIZE_OPTIONS: Array<TemplateOption<UniversalNameSize>> = [
  { value: 'standard', label: 'Standard', description: 'Leaves more room for body copy.' },
  { value: 'large', label: 'Large', description: 'Balanced emphasis.' },
  { value: 'hero', label: 'Hero', description: 'Strongest top-line presence.' },
]

export const DEFAULT_FONT_ID = 'inter'
export const DEFAULT_THEME_ID = 'none'

const HEX_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3}){1,2}$/

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function normalizeHeaderStyle(value: unknown): UniversalHeaderStyle {
  if (value === 'sidebar-integrated') return 'compact'
  if (value === 'classic' || value === 'banner' || value === 'minimal' || value === 'centered' || value === 'compact') {
    return value
  }
  return DEFAULT_UNIVERSAL_CONFIG.headerStyle
}

function normalizeBulletStyle(value: unknown): UniversalBulletStyle {
  if (value === 'timeline') return 'plain'
  if (value === 'plain' || value === 'dash' || value === 'square') return value
  return DEFAULT_UNIVERSAL_CONFIG.bulletStyle
}

function normalizeSkillsStyle(value: unknown): UniversalSkillsStyle {
  if (value === 'badges') return 'inline'
  if (value === 'inline' || value === 'divider' || value === 'stacked') return value
  return DEFAULT_UNIVERSAL_CONFIG.skillsStyle
}

function normalizeSectionHeadingStyle(value: unknown): UniversalSectionHeadingStyle {
  if (value === 'rule' || value === 'label' || value === 'minimal') return value
  return DEFAULT_UNIVERSAL_CONFIG.sectionHeadingStyle
}

function normalizeContactStyle(value: unknown): UniversalContactStyle {
  if (value === 'inline' || value === 'stacked') return value
  return DEFAULT_UNIVERSAL_CONFIG.contactStyle
}

function normalizeDateLayout(value: unknown): UniversalDateLayout {
  if (value === 'right' || value === 'inline') return value
  return DEFAULT_UNIVERSAL_CONFIG.dateLayout
}

function normalizeNameSize(value: unknown): UniversalNameSize {
  if (value === 'standard' || value === 'large' || value === 'hero') return value
  return DEFAULT_UNIVERSAL_CONFIG.nameSize
}

export function sanitizeUniversalConfig(value: Partial<UniversalConfig> | null | undefined): UniversalConfig {
  return {
    layout: 'single-column',
    headerStyle: normalizeHeaderStyle(value?.headerStyle),
    bulletStyle: normalizeBulletStyle(value?.bulletStyle),
    skillsStyle: normalizeSkillsStyle(value?.skillsStyle),
    sectionHeadingStyle: normalizeSectionHeadingStyle(value?.sectionHeadingStyle),
    contactStyle: normalizeContactStyle(value?.contactStyle),
    dateLayout: normalizeDateLayout(value?.dateLayout),
    nameSize: normalizeNameSize(value?.nameSize),
    accentColor: isNonEmptyString(value?.accentColor) && HEX_COLOR_PATTERN.test(value.accentColor)
      ? value.accentColor
      : DEFAULT_UNIVERSAL_CONFIG.accentColor,
    fontFamily: isNonEmptyString(value?.fontFamily)
      ? value.fontFamily
      : DEFAULT_UNIVERSAL_CONFIG.fontFamily,
    density: value?.density === 'compressed' || value?.density === 'relaxed'
      ? value.density
      : DEFAULT_UNIVERSAL_CONFIG.density,
  }
}

export function updateUniversalConfig(
  current: UniversalConfig,
  patch: Partial<UniversalConfig>
): UniversalConfig {
  return sanitizeUniversalConfig({ ...current, ...patch })
}

function createPreset(
  id: string,
  label: string,
  description: string,
  config: Partial<UniversalConfig>
): TemplatePreset {
  return {
    id,
    label,
    description,
    config: sanitizeUniversalConfig({ ...DEFAULT_UNIVERSAL_CONFIG, ...config }),
  }
}

export const ATS_TEMPLATE_PRESETS: TemplatePreset[] = [
  createPreset('executive', 'Executive', 'Strong hierarchy with a formal divider and clean dates.', {
    accentColor: '#1e293b',
    fontFamily: FONT_OPTIONS.find(font => font.id === 'cambria')?.value ?? DEFAULT_UNIVERSAL_CONFIG.fontFamily,
    headerStyle: 'classic',
    sectionHeadingStyle: 'rule',
    bulletStyle: 'plain',
    skillsStyle: 'inline',
    contactStyle: 'inline',
    dateLayout: 'right',
    nameSize: 'large',
    density: 'relaxed',
  }),
  createPreset('banner', 'Banner', 'Tinted top block with a clean ATS-safe body.', {
    accentColor: '#1e3a5f',
    fontFamily: FONT_OPTIONS.find(font => font.id === 'helvetica')?.value ?? DEFAULT_UNIVERSAL_CONFIG.fontFamily,
    headerStyle: 'banner',
    sectionHeadingStyle: 'minimal',
    bulletStyle: 'plain',
    skillsStyle: 'divider',
    contactStyle: 'inline',
    dateLayout: 'right',
    nameSize: 'hero',
    density: 'relaxed',
  }),
  createPreset('modern', 'Modern', 'Crisp sans-serif spacing with a lighter section treatment.', {
    accentColor: '#0369a1',
    fontFamily: FONT_OPTIONS.find(font => font.id === 'inter')?.value ?? DEFAULT_UNIVERSAL_CONFIG.fontFamily,
    headerStyle: 'classic',
    sectionHeadingStyle: 'label',
    bulletStyle: 'plain',
    skillsStyle: 'divider',
    contactStyle: 'inline',
    dateLayout: 'right',
    nameSize: 'large',
    density: 'relaxed',
  }),
  createPreset('compact', 'Compact', 'Built for tight one-page resumes without using columns.', {
    accentColor: '#026d32',
    fontFamily: FONT_OPTIONS.find(font => font.id === 'calibri')?.value ?? DEFAULT_UNIVERSAL_CONFIG.fontFamily,
    headerStyle: 'compact',
    sectionHeadingStyle: 'label',
    bulletStyle: 'dash',
    skillsStyle: 'inline',
    contactStyle: 'inline',
    dateLayout: 'inline',
    nameSize: 'standard',
    density: 'compressed',
  }),
  createPreset('centered', 'Centered', 'Symmetrical top section with a conservative single-column body.', {
    accentColor: '#1e3a5f',
    fontFamily: FONT_OPTIONS.find(font => font.id === 'helvetica')?.value ?? DEFAULT_UNIVERSAL_CONFIG.fontFamily,
    headerStyle: 'centered',
    sectionHeadingStyle: 'rule',
    bulletStyle: 'plain',
    skillsStyle: 'divider',
    contactStyle: 'stacked',
    dateLayout: 'right',
    nameSize: 'hero',
    density: 'relaxed',
  }),
  createPreset('analyst', 'Analyst', 'Dense but highly legible formatting with inline dates.', {
    accentColor: '#0f766e',
    fontFamily: FONT_OPTIONS.find(font => font.id === 'arial')?.value ?? DEFAULT_UNIVERSAL_CONFIG.fontFamily,
    headerStyle: 'compact',
    sectionHeadingStyle: 'minimal',
    bulletStyle: 'dash',
    skillsStyle: 'divider',
    contactStyle: 'inline',
    dateLayout: 'inline',
    nameSize: 'standard',
    density: 'compressed',
  }),
  createPreset('classic', 'Classic', 'Traditional serif profile with understated headings.', {
    accentColor: '#92400e',
    fontFamily: FONT_OPTIONS.find(font => font.id === 'georgia')?.value ?? DEFAULT_UNIVERSAL_CONFIG.fontFamily,
    headerStyle: 'minimal',
    sectionHeadingStyle: 'rule',
    bulletStyle: 'plain',
    skillsStyle: 'inline',
    contactStyle: 'stacked',
    dateLayout: 'right',
    nameSize: 'large',
    density: 'relaxed',
  }),
  createPreset('operator', 'Operator', 'Fast-scanning operational layout with stronger bullets.', {
    accentColor: '#b91c1c',
    fontFamily: FONT_OPTIONS.find(font => font.id === 'trebuchet')?.value ?? DEFAULT_UNIVERSAL_CONFIG.fontFamily,
    headerStyle: 'classic',
    sectionHeadingStyle: 'label',
    bulletStyle: 'square',
    skillsStyle: 'stacked',
    contactStyle: 'inline',
    dateLayout: 'inline',
    nameSize: 'large',
    density: 'compressed',
  }),
  createPreset('scholar', 'Scholar', 'Serif-led layout with spacious body copy and formal dates.', {
    accentColor: '#7c3aed',
    fontFamily: FONT_OPTIONS.find(font => font.id === 'times')?.value ?? DEFAULT_UNIVERSAL_CONFIG.fontFamily,
    headerStyle: 'minimal',
    sectionHeadingStyle: 'minimal',
    bulletStyle: 'plain',
    skillsStyle: 'inline',
    contactStyle: 'stacked',
    dateLayout: 'right',
    nameSize: 'hero',
    density: 'relaxed',
  }),
  createPreset('balanced', 'Balanced', 'Middle-ground template for most professional resumes.', {
    accentColor: '#9f1239',
    fontFamily: FONT_OPTIONS.find(font => font.id === 'verdana')?.value ?? DEFAULT_UNIVERSAL_CONFIG.fontFamily,
    headerStyle: 'classic',
    sectionHeadingStyle: 'rule',
    bulletStyle: 'plain',
    skillsStyle: 'divider',
    contactStyle: 'inline',
    dateLayout: 'right',
    nameSize: 'large',
    density: 'relaxed',
  }),
  createPreset('focused', 'Focused', 'High-density ATS-safe layout that still keeps strong hierarchy.', {
    accentColor: '#026d32',
    fontFamily: FONT_OPTIONS.find(font => font.id === 'cambria')?.value ?? DEFAULT_UNIVERSAL_CONFIG.fontFamily,
    headerStyle: 'compact',
    sectionHeadingStyle: 'rule',
    bulletStyle: 'square',
    skillsStyle: 'stacked',
    contactStyle: 'stacked',
    dateLayout: 'inline',
    nameSize: 'standard',
    density: 'compressed',
  }),
]

export function findMatchingTemplatePreset(config: UniversalConfig): string | null {
  const sanitizedConfig = sanitizeUniversalConfig(config)
  const serialized = JSON.stringify(sanitizedConfig)
  return ATS_TEMPLATE_PRESETS.find(preset => JSON.stringify(preset.config) === serialized)?.id ?? null
}

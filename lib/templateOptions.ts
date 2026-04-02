export interface FontOption {
  id: string
  label: string
  value: string
}

export interface ColorTheme {
  id: string
  label: string
  accent: string      // Primary accent color passed to templates
  swatches: string[]  // 3 swatches shown in the picker
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

export const DEFAULT_FONT_ID = 'inter'
export const DEFAULT_THEME_ID = 'none'

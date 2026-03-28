import { ComponentType } from 'react'
import type { TemplateProps, TemplateConfig, TemplateId } from '@/types'

import ModernMinimal from './ModernMinimal'
import ExecutiveClassic from './ExecutiveClassic'
import CreativeBold from './CreativeBold'
import GraduateEntry from './GraduateEntry'
import TechnicalPro from './TechnicalPro'

// ─── Registry entry type ──────────────────────────────────────────────────────

export interface TemplateRegistryEntry {
  config: TemplateConfig
  component: ComponentType<TemplateProps>
}

// ─── THE REGISTRY ─────────────────────────────────────────────────────────────
// To add a new template:
//   1. Create the component file in this folder
//   2. Import it above
//   3. Add an entry below
// That is all. Nothing else in the codebase needs to change.

export const TEMPLATE_REGISTRY: Record<TemplateId, TemplateRegistryEntry> = {
  'modern-minimal': {
    component: ModernMinimal,
    config: {
      id: 'modern-minimal',
      name: 'Modern Minimal',
      description: 'Clean single-column with indigo accents',
      targetRole: 'Tech & Product',
      accentColor: '#4F46E5',
      tags: ['clean', 'minimal', 'tech'],
    },
  },

  'executive-classic': {
    component: ExecutiveClassic,
    config: {
      id: 'executive-classic',
      name: 'Executive Classic',
      description: 'Two-column navy sidebar layout',
      targetRole: 'Finance & Consulting',
      accentColor: '#1E3A5F',
      tags: ['professional', 'two-column', 'executive'],
    },
  },

  'creative-bold': {
    component: CreativeBold,
    config: {
      id: 'creative-bold',
      name: 'Creative Bold',
      description: 'Bold colour header with timeline',
      targetRole: 'Marketing & Sales',
      accentColor: '#DC2626',
      tags: ['creative', 'bold', 'colourful'],
    },
  },

  'graduate-entry': {
    component: GraduateEntry,
    config: {
      id: 'graduate-entry',
      name: 'Graduate Entry',
      description: 'Education-first compact layout',
      targetRole: 'Fresh Graduates',
      accentColor: '#059669',
      tags: ['graduate', 'entry-level', 'compact'],
    },
  },

  'technical-pro': {
    component: TechnicalPro,
    config: {
      id: 'technical-pro',
      name: 'Technical Pro',
      description: 'Skills-grouped engineering layout',
      targetRole: 'Software Engineering',
      accentColor: '#0EA5E9',
      tags: ['technical', 'engineering', 'skills'],
    },
  },
}

// ─── Helper functions ─────────────────────────────────────────────────────────
// These never need updating when templates are added.

export function getAllTemplates(): TemplateRegistryEntry[] {
  return Object.values(TEMPLATE_REGISTRY)
}

export function getTemplate(id: TemplateId): TemplateRegistryEntry | undefined {
  return TEMPLATE_REGISTRY[id]
}

export function getTemplateComponent(id: TemplateId): ComponentType<TemplateProps> | undefined {
  return TEMPLATE_REGISTRY[id]?.component
}

export function getTemplateConfig(id: TemplateId): TemplateConfig | undefined {
  return TEMPLATE_REGISTRY[id]?.config
}

export function getAllTemplateConfigs(): TemplateConfig[] {
  return getAllTemplates().map(t => t.config)
}

export function isValidTemplateId(id: string): id is TemplateId {
  return id in TEMPLATE_REGISTRY
}

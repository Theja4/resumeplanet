import { sanitizeUniversalConfig } from '@/lib/templateOptions'
import type { BuilderVisibility, ResumeData, UniversalConfig, ExperienceItem, EducationItem, CertificationItem, ProjectItem, AwardItem, PublicationItem, CustomSection } from '@/types'

const MARKER_VERSION = 1
const MARKER_FIELDS = ['keywords', 'subject', 'creator'] as const
const MARKER_PREFIX = 'x1'
const MARKER_CHUNK_SIZE = 6000

type MarkerFieldName = (typeof MARKER_FIELDS)[number]

type ResumeMarkerPayload = {
  v: number
  d: ResumeData
  c: UniversalConfig | null
  s: string[]
  b: string[]
}

type MetadataMap = Partial<Record<MarkerFieldName, string>>

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

function normalizeExperienceItem(value: unknown): ExperienceItem | null {
  if (!isRecord(value)) return null

  return {
    company: stringValue(value.company),
    title: stringValue(value.title),
    location: stringValue(value.location),
    startDate: stringValue(value.startDate),
    endDate: stringValue(value.endDate),
    bullets: stringArray(value.bullets),
    bulletVisibility: undefined,
    summary: undefined,
  }
}

function normalizeEducationItem(value: unknown): EducationItem | null {
  if (!isRecord(value)) return null

  return {
    institution: stringValue(value.institution),
    degree: stringValue(value.degree),
    field: stringValue(value.field),
    graduationDate: stringValue(value.graduationDate),
    gpa: stringValue(value.gpa),
  }
}

function normalizeCertificationItem(value: unknown): CertificationItem | null {
  if (!isRecord(value)) return null

  return {
    name: stringValue(value.name),
    issuer: stringValue(value.issuer),
    date: stringValue(value.date),
  }
}

function normalizeProjectItem(value: unknown): ProjectItem | null {
  if (!isRecord(value)) return null

  return {
    name: stringValue(value.name),
    description: stringValue(value.description),
    technologies: stringArray(value.technologies),
  }
}

function normalizeAwardItem(value: unknown): AwardItem | null {
  if (!isRecord(value)) return null

  return {
    title: stringValue(value.title),
    issuer: stringValue(value.issuer),
    date: stringValue(value.date),
  }
}

function normalizePublicationItem(value: unknown): PublicationItem | null {
  if (!isRecord(value)) return null

  return {
    title: stringValue(value.title),
    publisher: stringValue(value.publisher),
    date: stringValue(value.date),
  }
}

function normalizeCustomSection(value: unknown): CustomSection | null {
  if (!isRecord(value)) return null

  const type = value.type
  if (type !== 'text' && type !== 'tags' && type !== 'complex') {
    return null
  }

  const items = Array.isArray(value.items)
    ? value.items.map(normalizeExperienceItem).filter((item): item is ExperienceItem => Boolean(item))
    : undefined

  return {
    id: stringValue(value.id),
    title: stringValue(value.title),
    type,
    text: stringValue(value.text) || undefined,
    tags: stringArray(value.tags),
    items,
  }
}

function normalizeResumeData(value: unknown): ResumeData | null {
  if (!isRecord(value)) return null

  return {
    name: stringValue(value.name),
    email: stringValue(value.email),
    phone: stringValue(value.phone),
    location: stringValue(value.location),
    linkedin: stringValue(value.linkedin),
    website: stringValue(value.website),
    summary: stringValue(value.summary),
    currentRole: stringValue(value.currentRole),
    experience: Array.isArray(value.experience)
      ? value.experience.map(normalizeExperienceItem).filter((item): item is ExperienceItem => Boolean(item))
      : [],
    education: Array.isArray(value.education)
      ? value.education.map(normalizeEducationItem).filter((item): item is EducationItem => Boolean(item))
      : [],
    skills: stringArray(value.skills),
    certifications: Array.isArray(value.certifications)
      ? value.certifications.map(normalizeCertificationItem).filter((item): item is CertificationItem => Boolean(item))
      : [],
    projects: Array.isArray(value.projects)
      ? value.projects.map(normalizeProjectItem).filter((item): item is ProjectItem => Boolean(item))
      : [],
    languages: stringArray(value.languages),
    volunteer: Array.isArray(value.volunteer)
      ? value.volunteer.map(normalizeExperienceItem).filter((item): item is ExperienceItem => Boolean(item))
      : [],
    interests: stringArray(value.interests),
    awards: Array.isArray(value.awards)
      ? value.awards.map(normalizeAwardItem).filter((item): item is AwardItem => Boolean(item))
      : [],
    publications: Array.isArray(value.publications)
      ? value.publications.map(normalizePublicationItem).filter((item): item is PublicationItem => Boolean(item))
      : [],
    references: stringArray(value.references),
    customSections: Array.isArray(value.customSections)
      ? value.customSections.map(normalizeCustomSection).filter((item): item is CustomSection => Boolean(item))
      : [],
  }
}

function normalizeConfig(value: unknown): UniversalConfig | null {
  if (!isRecord(value)) return null
  const hasAnyConfigField = [
    'layout',
    'headerStyle',
    'bulletStyle',
    'skillsStyle',
    'sectionHeadingStyle',
    'contactStyle',
    'dateLayout',
    'nameSize',
    'accentColor',
    'fontFamily',
    'density',
  ].some((key) => key in value)

  if (!hasAnyConfigField) return null

  return sanitizeUniversalConfig({
    layout: stringValue(value.layout) as UniversalConfig['layout'],
    headerStyle: stringValue(value.headerStyle) as UniversalConfig['headerStyle'],
    bulletStyle: stringValue(value.bulletStyle) as UniversalConfig['bulletStyle'],
    skillsStyle: stringValue(value.skillsStyle) as UniversalConfig['skillsStyle'],
    sectionHeadingStyle: stringValue(value.sectionHeadingStyle) as UniversalConfig['sectionHeadingStyle'],
    contactStyle: stringValue(value.contactStyle) as UniversalConfig['contactStyle'],
    dateLayout: stringValue(value.dateLayout) as UniversalConfig['dateLayout'],
    nameSize: stringValue(value.nameSize) as UniversalConfig['nameSize'],
    accentColor: stringValue(value.accentColor),
    fontFamily: stringValue(value.fontFamily),
    density: stringValue(value.density) as UniversalConfig['density'],
  })
}

function bytesToBase64Url(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '')
  }

  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function base64UrlToBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const paddingLength = (4 - (normalized.length % 4 || 4)) % 4
  const padded = normalized + '='.repeat(paddingLength)

  if (typeof Buffer !== 'undefined') {
    return Uint8Array.from(Buffer.from(padded, 'base64'))
  }

  const binary = atob(padded)
  return Uint8Array.from(binary, char => char.charCodeAt(0))
}

function serializePayload(payload: ResumeMarkerPayload): string {
  const bytes = new TextEncoder().encode(JSON.stringify(payload))
  return bytesToBase64Url(bytes)
}

function deserializePayload(encoded: string): ResumeMarkerPayload | null {
  try {
    const bytes = base64UrlToBytes(encoded)
    const raw = new TextDecoder().decode(bytes)
    const parsed = JSON.parse(raw) as Partial<ResumeMarkerPayload>

    if (!isRecord(parsed) || parsed.v !== MARKER_VERSION) {
      return null
    }

    const data = normalizeResumeData(parsed.d)
    if (!data) return null

    return {
      v: MARKER_VERSION,
      d: data,
      c: normalizeConfig(parsed.c ?? null),
      s: stringArray(parsed.s),
      b: stringArray(parsed.b),
    }
  } catch {
    return null
  }
}

function chunkToken(token: string): string[] {
  const chunks: string[] = []

  for (let index = 0; index < token.length; index += MARKER_CHUNK_SIZE) {
    chunks.push(token.slice(index, index + MARKER_CHUNK_SIZE))
  }

  return chunks
}

function encodeChunk(chunk: string, index: number, total: number): string {
  return `${MARKER_PREFIX}.${index + 1}.${total}.${chunk}`
}

function decodeChunk(value: string): { index: number; total: number; chunk: string } | null {
  const match = value.match(/^([a-z0-9]+)\.(\d+)\.(\d+)\.([A-Za-z0-9_-]+)$/i)
  if (!match || match[1] !== MARKER_PREFIX) {
    return null
  }

  const index = Number(match[2])
  const total = Number(match[3])
  if (!Number.isInteger(index) || !Number.isInteger(total) || index < 1 || total < 1 || index > total) {
    return null
  }

  return {
    index,
    total,
    chunk: match[4],
  }
}

function getMetadataValue(source: unknown, key: string): string | null {
  if (!source) return null

  if (isRecord(source)) {
    const direct = source[key]
    if (typeof direct === 'string' && direct.trim()) {
      return direct.trim()
    }

    const foundKey = Object.keys(source).find(entry => entry.toLowerCase() === key.toLowerCase())
    if (foundKey && typeof source[foundKey] === 'string' && source[foundKey].trim()) {
      return source[foundKey].trim()
    }
  }

  if (
    typeof source === 'object' &&
    source !== null &&
    'get' in source &&
    typeof (source as { get?: unknown }).get === 'function'
  ) {
    const getter = (source as { get: (name: string) => unknown }).get
    const value = getter(key)
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }

  return null
}

function hasSectionContent(data: ResumeData, sectionId: string): boolean {
  switch (sectionId) {
    case 'contact':
      return Boolean(data.name || data.email || data.phone || data.location || data.linkedin || data.website)
    case 'summary':
      return Boolean(data.summary.trim())
    case 'experience':
      return data.experience.length > 0
    case 'education':
      return data.education.length > 0
    case 'skills':
      return data.skills.length > 0
    case 'certifications':
      return data.certifications.length > 0
    case 'projects':
      return data.projects.length > 0
    case 'languages':
      return data.languages.length > 0
    case 'volunteer':
      return data.volunteer.length > 0
    case 'interests':
      return data.interests.length > 0
    case 'awards':
      return data.awards.length > 0
    case 'publications':
      return data.publications.length > 0
    case 'references':
      return data.references.length > 0
    default: {
      const custom = data.customSections?.find(section => section.id === sectionId)
      if (!custom) return false
      if (custom.type === 'text') return Boolean(custom.text?.trim())
      if (custom.type === 'tags') return (custom.tags?.length ?? 0) > 0
      return (custom.items?.length ?? 0) > 0
    }
  }
}

function uniqueOrdered(ids: string[]): string[] {
  return Array.from(new Set(ids.filter(Boolean)))
}

export interface FirstPartyResumeSnapshot {
  data: ResumeData
  config: UniversalConfig | null
  sectionOrder: string[]
  sidebarSectionOrder: string[]
}

export function buildFirstPartyResumeMetadata(snapshot: FirstPartyResumeSnapshot): MetadataMap {
  const payload: ResumeMarkerPayload = {
    v: MARKER_VERSION,
    d: snapshot.data,
    c: snapshot.config,
    s: uniqueOrdered(snapshot.sectionOrder),
    b: uniqueOrdered(snapshot.sidebarSectionOrder),
  }

  const token = serializePayload(payload)
  const chunks = chunkToken(token)

  if (chunks.length === 0 || chunks.length > MARKER_FIELDS.length) {
    return {}
  }

  return chunks.reduce<MetadataMap>((accumulator, chunk, index) => {
    const field = MARKER_FIELDS[index]
    accumulator[field] = encodeChunk(chunk, index, chunks.length)
    return accumulator
  }, {})
}

export function decodeFirstPartyResumeMetadata(source: { info?: unknown; metadata?: unknown } | null | undefined): FirstPartyResumeSnapshot | null {
  if (!source) return null

  const foundChunks = MARKER_FIELDS
    .map(field => getMetadataValue(source.info, field) ?? getMetadataValue(source.metadata, field))
    .filter((value): value is string => Boolean(value))
    .map(decodeChunk)
    .filter((value): value is { index: number; total: number; chunk: string } => Boolean(value))

  if (foundChunks.length === 0) {
    return null
  }

  const total = foundChunks[0].total
  if (foundChunks.length !== total || foundChunks.some(chunk => chunk.total !== total)) {
    return null
  }

  const ordered = [...foundChunks].sort((left, right) => left.index - right.index)
  if (ordered.some((chunk, index) => chunk.index !== index + 1)) {
    return null
  }

  const payload = deserializePayload(ordered.map(chunk => chunk.chunk).join(''))
  if (!payload) {
    return null
  }

  return {
    data: payload.d,
    config: payload.c,
    sectionOrder: payload.s,
    sidebarSectionOrder: payload.b,
  }
}

export function buildRoundTripVisibility(
  data: ResumeData,
  sectionOrder: string[],
  sidebarSectionOrder: string[],
  density: BuilderVisibility['density'] = 'relaxed',
): BuilderVisibility {
  const customSectionIds = data.customSections?.map(section => section.id) ?? []
  const sidebarIds = uniqueOrdered(sidebarSectionOrder).filter(id => hasSectionContent(data, id))
  const mainIds = uniqueOrdered(sectionOrder)
    .filter(id => !sidebarIds.includes(id))
    .filter(id => hasSectionContent(data, id))
  const trailingCustom = customSectionIds.filter(id => !mainIds.includes(id) && !sidebarIds.includes(id) && hasSectionContent(data, id))

  const allKnownIds = uniqueOrdered([
    'contact',
    'summary',
    'experience',
    'education',
    'skills',
    'projects',
    'volunteer',
    'certifications',
    'languages',
    'interests',
    'awards',
    'publications',
    'references',
    ...customSectionIds,
  ])

  const sections = allKnownIds.reduce<Record<string, boolean>>((accumulator, id) => {
    accumulator[id] = id === 'contact' ? true : hasSectionContent(data, id)
    return accumulator
  }, {})

  const items: BuilderVisibility['items'] = {
    experience: data.experience.map(() => true),
    education: data.education.map(() => true),
    projects: data.projects.map(() => true),
    certifications: data.certifications.map(() => true),
    volunteer: data.volunteer.map(() => true),
  }

  for (const custom of data.customSections ?? []) {
    if (custom.type === 'complex' && custom.items) {
      items[custom.id] = custom.items.map(() => true)
    }
  }

  return {
    sections,
    items,
    sectionOrder: mainIds.length > 0 ? [...mainIds, ...trailingCustom] : trailingCustom,
    sidebarSectionOrder: sidebarIds,
    density,
  }
}

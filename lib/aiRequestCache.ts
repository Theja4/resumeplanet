import { createHash } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'

export type AIRequestCacheFeature =
  | 'ats_basic'
  | 'ats_pro'
  | 'match_pro'
  | 'cover_letter'
  | 'linkedin_rewrite'

interface AIRequestCacheRow<T> {
  payload: {
    version: number
    data: T
  } | null
}

function normalizeText(value: string) {
  return value
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function stableSerialize(value: unknown): string {
  if (value === null || value === undefined) return 'null'

  if (typeof value === 'string') {
    return JSON.stringify(normalizeText(value))
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return JSON.stringify(value)
  }

  if (Array.isArray(value)) {
    return `[${value.map(item => stableSerialize(item)).join(',')}]`
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entryValue]) => entryValue !== undefined)
      .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))

    return `{${entries.map(([key, entryValue]) => `${JSON.stringify(key)}:${stableSerialize(entryValue)}`).join(',')}}`
  }

  return JSON.stringify(String(value))
}

export function buildAIRequestSignature(input: unknown) {
  return createHash('sha256').update(stableSerialize(input)).digest('hex')
}

export async function readAIRequestCache<T>({
  supabase,
  userId,
  feature,
  signature,
  version,
}: {
  supabase: SupabaseClient
  userId: string
  feature: AIRequestCacheFeature
  signature: string
  version: number
}) {
  const { data, error } = await supabase
    .from('ai_request_cache')
    .select('payload')
    .eq('user_id', userId)
    .eq('feature', feature)
    .eq('signature', signature)
    .maybeSingle()

  if (error) {
    console.error(`readAIRequestCache failed [${feature}]:`, error.message)
    return null
  }

  const row = data as AIRequestCacheRow<T> | null
  if (!row?.payload) return null
  if (row.payload.version !== version) return null
  return row.payload.data
}

export async function writeAIRequestCache<T>({
  supabase,
  userId,
  feature,
  signature,
  version,
  data,
}: {
  supabase: SupabaseClient
  userId: string
  feature: AIRequestCacheFeature
  signature: string
  version: number
  data: T
}) {
  const { error } = await supabase
    .from('ai_request_cache')
    .upsert(
      {
        user_id: userId,
        feature,
        signature,
        payload: {
          version,
          data,
        },
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,feature,signature',
      }
    )

  if (error) {
    console.error(`writeAIRequestCache failed [${feature}]:`, error.message)
  }
}

// lib/claude.ts - Shared LLM gateway.
// Microsoft Foundry is the primary provider when configured; OpenRouter remains
// the secondary provider. The exported Claude-named helpers are retained so the
// rest of the app does not need to know which provider served a request.
export const DEEPSEEK_V4_FLASH = 'deepseek/deepseek-v4-flash'
export const GEMINI_25_FLASH = 'google/gemini-2.5-flash'
const FOUNDRY_GPT_54_MINI = 'gpt-5.4-mini'
const FOUNDRY_DEEPSEEK_V4_FLASH = 'DeepSeek-V4-Flash'
export const CLAUDE_STANDARD = process.env.ANTHROPIC_MODEL || DEEPSEEK_V4_FLASH
export const CLAUDE_PREMIUM = process.env.ANTHROPIC_MODEL_PREMIUM || DEEPSEEK_V4_FLASH

// Default OpenRouter fallback models appended after the caller's requested
// model in callClaudeJSONFallback.
const FALLBACK_CHAIN = [
  DEEPSEEK_V4_FLASH,
  GEMINI_25_FLASH,
]

type LLMProviderName = 'foundry' | 'openrouter'

type ProviderConfig = {
  name: LLMProviderName
  baseUrl: string
  headers: Record<string, string>
  model: string
  timeoutMs?: number
}

function env(...names: string[]) {
  for (const name of names) {
    const value = process.env[name]?.trim()
    if (value) return value
  }
  return ''
}

function normalizeBaseUrl(rawUrl: string, suffix: string) {
  let withoutTrailingSlash = rawUrl.replace(/\/+$/, '')

  if (suffix === '/openai/v1') {
    withoutTrailingSlash = withoutTrailingSlash
      .replace(/\/openai\/v1$/i, '')
      .replace(/\/api\/projects\/[^/]+$/i, '')
  }

  return withoutTrailingSlash.endsWith(suffix)
    ? withoutTrailingSlash
    : `${withoutTrailingSlash}${suffix}`
}

function envList(...names: string[]) {
  return names
    .flatMap(name => (process.env[name] ?? '').split(','))
    .map(value => value.trim())
    .filter(Boolean)
}

function uniq(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)))
}

function numberEnv(name: string, fallback: number) {
  const value = Number(process.env[name])
  return Number.isFinite(value) && value > 0 ? value : fallback
}

function resolveFoundryModels(requestedModel: string) {
  const configuredChain = envList(
    'AZURE_AI_FOUNDRY_MODELS',
    'AZURE_AI_FOUNDRY_DEPLOYMENTS',
    'MICROSOFT_FOUNDRY_MODELS',
    'MICROSOFT_FOUNDRY_DEPLOYMENTS',
    'FOUNDRY_MODELS',
    'FOUNDRY_DEPLOYMENTS',
  )
  if (configuredChain.length > 0) return uniq(configuredChain)

  const primaryModel = env(
    'AZURE_AI_FOUNDRY_PRIMARY_MODEL',
    'AZURE_AI_FOUNDRY_PRIMARY_DEPLOYMENT',
    'MICROSOFT_FOUNDRY_PRIMARY_MODEL',
    'MICROSOFT_FOUNDRY_PRIMARY_DEPLOYMENT',
    'FOUNDRY_PRIMARY_MODEL',
    'FOUNDRY_PRIMARY_DEPLOYMENT',
  )
  const secondaryModel = env(
    'AZURE_AI_FOUNDRY_SECONDARY_MODEL',
    'AZURE_AI_FOUNDRY_SECONDARY_DEPLOYMENT',
    'MICROSOFT_FOUNDRY_SECONDARY_MODEL',
    'MICROSOFT_FOUNDRY_SECONDARY_DEPLOYMENT',
    'FOUNDRY_SECONDARY_MODEL',
    'FOUNDRY_SECONDARY_DEPLOYMENT',
  )
  if (primaryModel || secondaryModel) {
    return uniq([primaryModel, secondaryModel])
  }

  const standardModel = env(
    'AZURE_AI_FOUNDRY_MODEL',
    'AZURE_AI_FOUNDRY_DEPLOYMENT',
    'MICROSOFT_FOUNDRY_MODEL',
    'MICROSOFT_FOUNDRY_DEPLOYMENT',
  )
  const premiumModel = env(
    'AZURE_AI_FOUNDRY_MODEL_PREMIUM',
    'AZURE_AI_FOUNDRY_DEPLOYMENT_PREMIUM',
    'MICROSOFT_FOUNDRY_MODEL_PREMIUM',
    'MICROSOFT_FOUNDRY_DEPLOYMENT_PREMIUM',
  )

  if (requestedModel === CLAUDE_PREMIUM && premiumModel) {
    return uniq([premiumModel, secondaryModel, standardModel, FOUNDRY_DEEPSEEK_V4_FLASH])
  }
  if (requestedModel === CLAUDE_STANDARD && standardModel) {
    return uniq([standardModel, secondaryModel, premiumModel, FOUNDRY_DEEPSEEK_V4_FLASH])
  }

  return uniq([standardModel, premiumModel, FOUNDRY_GPT_54_MINI, FOUNDRY_DEEPSEEK_V4_FLASH])
}

function getProviderOrder(): LLMProviderName[] {
  const configured = env('LLM_PROVIDER_ORDER', 'AI_PROVIDER_ORDER')
  if (!configured) return ['foundry', 'openrouter']

  const providers = configured
    .split(',')
    .map(provider => provider.trim().toLowerCase())
    .filter((provider): provider is LLMProviderName => provider === 'foundry' || provider === 'openrouter')

  return providers.length > 0 ? providers : ['foundry', 'openrouter']
}

function getProviderConfigs(requestedModel: string): ProviderConfig[] {
  const foundryEndpoint = env('AZURE_AI_FOUNDRY_ENDPOINT', 'MICROSOFT_FOUNDRY_ENDPOINT', 'FOUNDRY_ENDPOINT')
  const foundryKey = env('AZURE_AI_FOUNDRY_API_KEY', 'MICROSOFT_FOUNDRY_API_KEY', 'FOUNDRY_API_KEY')
  const foundryModels = resolveFoundryModels(requestedModel)

  const openRouterBaseUrl = env('OPENROUTER_BASE_URL') || 'https://openrouter.ai/api/v1'
  const openRouterKey = env('OPENROUTER_API_KEY', 'ANTHROPIC_AUTH_TOKEN')

  const available: Partial<Record<LLMProviderName, ProviderConfig[]>> = {}

  if (foundryEndpoint && foundryKey && foundryModels.length > 0) {
    // GPT-5.x reasoning models generating large JSON payloads regularly need
    // more than 30s; a too-tight primary timeout silently downgrades every
    // premium request to the secondary (DeepSeek) model.
    const primaryTimeoutMs = numberEnv('FOUNDRY_PRIMARY_TIMEOUT_MS', 90000)
    const secondaryTimeoutMs = numberEnv('FOUNDRY_SECONDARY_TIMEOUT_MS', 45000)

    available.foundry = foundryModels.map((model, index) => ({
      name: 'foundry',
      baseUrl: normalizeBaseUrl(foundryEndpoint, '/openai/v1'),
      model,
      timeoutMs: index === 0 ? primaryTimeoutMs : secondaryTimeoutMs,
      headers: {
        'api-key': foundryKey,
      },
    }))
  }

  if (openRouterKey) {
    available.openrouter = [{
      name: 'openrouter',
      baseUrl: normalizeBaseUrl(openRouterBaseUrl, '/api/v1'),
      model: requestedModel,
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'HTTP-Referer': env('OPENROUTER_SITE_URL', 'NEXT_PUBLIC_SITE_URL', 'NEXT_PUBLIC_APP_URL') || 'https://rezoomed.com',
        'X-Title': env('OPENROUTER_APP_TITLE', 'OPENROUTER_SITE_NAME') || 'Rezoomed',
      },
    }]
  }

  return getProviderOrder()
    .flatMap(provider => available[provider] ?? [])
    .filter((provider): provider is ProviderConfig => Boolean(provider))
}

export function hasConfiguredLLMProvider() {
  return getProviderConfigs(CLAUDE_STANDARD).length > 0
}

function providerErrorPrefix(provider: LLMProviderName) {
  return provider === 'foundry' ? 'FOUNDRY_API_ERROR' : 'OPENROUTER_API_ERROR'
}

// GPT-5.x on Foundry are reasoning models with different parameter rules:
// - `max_completion_tokens` instead of `max_tokens` (includes reasoning tokens)
// - `temperature`/`top_p` are rejected with a 400
// - `reasoning_effort`, `verbosity`, and strict `json_schema` outputs are supported
// See https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/reasoning
function isFoundryReasoningModel(provider: ProviderConfig) {
  return provider.name === 'foundry' && /^gpt-5/i.test(provider.model)
}

export type ReasoningEffort = 'none' | 'low' | 'medium' | 'high'
export type OutputVerbosity = 'low' | 'medium' | 'high'

// Strict structured-output schema. Applied as `json_schema` (strict) on
// Foundry GPT-5.x; downgraded to `json_object` mode on providers where strict
// schema support is not guaranteed (DeepSeek, OpenRouter fallbacks) — the
// brace-scan parseJSON still covers those.
export interface JSONSchemaSpec {
  name: string
  schema: Record<string, unknown>
}

interface LLMCallOptions {
  system: string
  prompt: string
  maxTokens?: number
  timeoutMs?: number
  temperature?: number
  jsonMode?: boolean
  jsonSchema?: JSONSchemaSpec
  reasoningEffort?: ReasoningEffort
  verbosity?: OutputVerbosity
  /** Pipeline label for [LLM:served] telemetry, e.g. 'tailor_analysis'. */
  label?: string
}

function providerKey(provider: ProviderConfig) {
  return `${provider.name}:${provider.baseUrl}:${provider.model}`
}

/**
 * Resolve the model chain to concrete provider attempts, deduped. With
 * Foundry configured, every requested model resolves to the same Foundry
 * deployments — without dedupe a fallback loop over N models would retry the
 * identical Foundry chain N times before OpenRouter differs.
 */
function resolveProviderAttempts(models: string[]): ProviderConfig[] {
  const attempts: ProviderConfig[] = []
  const seen = new Set<string>()
  for (const model of models) {
    for (const provider of getProviderConfigs(model)) {
      const key = providerKey(provider)
      if (seen.has(key)) continue
      seen.add(key)
      attempts.push(provider)
    }
  }
  return attempts
}

/** Single request against one concrete provider. Throws on any failure. */
async function requestProvider(provider: ProviderConfig, options: LLMCallOptions): Promise<string> {
  const { system, prompt, maxTokens = 4096, timeoutMs = 90000, temperature, jsonMode, jsonSchema, reasoningEffort, verbosity, label } = options

  const controller = new AbortController()
  const requestTimeoutMs = Math.min(timeoutMs, provider.timeoutMs ?? timeoutMs)
  const timeoutId = setTimeout(() => controller.abort(), requestTimeoutMs)
  const startedAt = Date.now()

  try {
    const requestBody: Record<string, unknown> = {
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
      model: provider.model,
    }

    if (isFoundryReasoningModel(provider)) {
      // Reasoning tokens are billed against this cap, so callers must
      // budget for reasoning + output. temperature would 400 here.
      requestBody.max_completion_tokens = Number(maxTokens)
      if (reasoningEffort) requestBody.reasoning_effort = reasoningEffort
      if (verbosity) requestBody.verbosity = verbosity
      if (jsonSchema) {
        requestBody.response_format = {
          type: 'json_schema',
          json_schema: { name: jsonSchema.name, strict: true, schema: jsonSchema.schema },
        }
      } else if (jsonMode) {
        requestBody.response_format = { type: 'json_object' }
      }
    } else {
      requestBody.max_tokens = Number(maxTokens)
      if (temperature !== undefined) requestBody.temperature = temperature
      if (jsonMode || jsonSchema) requestBody.response_format = { type: 'json_object' }
    }

    console.log(`[LLM] provider=${provider.name} | model=${provider.model} | timeoutMs=${requestTimeoutMs} | url=${provider.baseUrl}/chat/completions`)
    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...provider.headers,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`${provider.name} LLM error:`, errorText)
      throw new Error(`${providerErrorPrefix(provider.name)}: ${response.status}${errorText ? ` ${errorText}` : ''}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) {
      throw new Error(`${provider.name.toUpperCase()}_EMPTY_RESPONSE`)
    }

    // Model-served telemetry: one structured line per successful response so
    // Vercel logs can answer "which model is actually serving each pipeline".
    console.log(`[LLM:served] ${JSON.stringify({
      label: label ?? 'unlabeled',
      provider: provider.name,
      model: provider.model,
      durationMs: Date.now() - startedAt,
      reasoningTokens: data.usage?.completion_tokens_details?.reasoning_tokens ?? null,
      completionTokens: data.usage?.completion_tokens ?? null,
    })}`)

    return content
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('CLAUDE_TIMEOUT')
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

function throwAggregatedFailures(
  failures: Array<{ provider: string; model: string; reason: string }>,
  label?: string
): never {
  console.error(`[LLM:failed] ${JSON.stringify({ label: label ?? 'unlabeled', failures })}`)
  if (failures.length > 0 && failures.every(failure => failure.reason === 'CLAUDE_TIMEOUT')) {
    throw new Error('CLAUDE_TIMEOUT')
  }
  throw new Error(failures.map(failure => `${failure.provider}/${failure.model}: ${failure.reason}`).join(' | '))
}

export async function callClaude(options: LLMCallOptions & { model: string }): Promise<string> {
  const providers = getProviderConfigs(options.model)
  if (providers.length === 0) {
    throw new Error('OPENROUTER_API_KEY_MISSING')
  }

  const failures: Array<{ provider: string; model: string; reason: string }> = []

  for (const provider of providers) {
    try {
      return await requestProvider(provider, options)
    } catch (error) {
      failures.push({
        provider: provider.name,
        model: provider.model,
        reason: error instanceof Error ? error.message : String(error),
      })
      continue
    }
  }

  throwAggregatedFailures(failures, options.label)
}

function parseJSON<T>(raw: string): T {
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()

  try {
    return JSON.parse(cleaned) as T
  } catch {
    const firstBrace = cleaned.indexOf('{')
    const lastBrace = cleaned.lastIndexOf('}')

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const candidate = cleaned.slice(firstBrace, lastBrace + 1)
      return JSON.parse(candidate) as T
    }

    throw new Error('JSON_PARSE_FAILED')
  }
}

export async function callClaudeJSON<T>(options: LLMCallOptions & { model: string }): Promise<T> {
  return callClaudeJSONFallback<T>(options)
}

export async function callClaudeJSONFallback<T>(options: LLMCallOptions & {
  model: string
  fallbackModels?: string[]
  perModelTimeoutMs?: number
  jsonRetryTimeoutMs?: number
}): Promise<T> {
  // Respect the caller's chosen model: try it first, then explicit fallbacks,
  // then DeepSeek as an ultimate safety net. The model chain is resolved to
  // concrete provider attempts up front and deduped so the same Foundry
  // deployment is never retried once per fallback model.
  const models = Array.from(new Set([
    options.model,
    ...(options.fallbackModels ?? FALLBACK_CHAIN),
    DEEPSEEK_V4_FLASH,
  ].filter(Boolean)))

  const attempts = resolveProviderAttempts(models)
  if (attempts.length === 0) {
    throw new Error('OPENROUTER_API_KEY_MISSING')
  }

  // Tighter per-call budgets so a single failing AI request can't hang the
  // route past Vercel's serverless timeout.
  //
  // Resolution priority: explicit perModelTimeoutMs > caller's timeoutMs > 25s default.
  const perModelTimeoutMs = options.perModelTimeoutMs ?? options.timeoutMs ?? 25000
  const jsonRetryTimeoutMs = options.jsonRetryTimeoutMs ?? Math.min(15000, perModelTimeoutMs)
  const failures: Array<{ provider: string; model: string; reason: string }> = []

  for (const provider of attempts) {
    try {
      const raw = await requestProvider(provider, {
        ...options,
        timeoutMs: perModelTimeoutMs,
      })

      try {
        return parseJSON<T>(raw)
      } catch {
        try {
          const retryRaw = await requestProvider(provider, {
            ...options,
            prompt: `${options.prompt}\n\nReturn only valid JSON. No markdown, no explanation.`,
            timeoutMs: jsonRetryTimeoutMs,
          })
          return parseJSON<T>(retryRaw)
        } catch (retryError) {
          failures.push({
            provider: provider.name,
            model: provider.model,
            reason: retryError instanceof Error ? retryError.message : String(retryError),
          })
          continue
        }
      }
    } catch (error) {
      failures.push({
        provider: provider.name,
        model: provider.model,
        reason: error instanceof Error ? error.message : String(error),
      })
      continue
    }
  }

  console.error(`[LLM:failed] ${JSON.stringify({ label: options.label ?? 'unlabeled', failures })}`)

  if (failures.length > 0 && failures.every(failure => failure.reason === 'CLAUDE_TIMEOUT')) {
    throw new Error('CLAUDE_TIMEOUT')
  }

  if (failures.length > 0 && failures.every(failure => failure.reason === 'CLAUDE_JSON_PARSE_FAILED' || failure.reason === 'JSON_PARSE_FAILED')) {
    throw new Error('CLAUDE_JSON_PARSE_FAILED')
  }

  throw new Error('OPENROUTER_FALLBACK_FAILED')
}

/** Calls the standard chain with extended timeout; Gemini as explicit fallback. */
export async function callClaudeJSONRace<T>(options: LLMCallOptions & { model: string }): Promise<T> {
  return callClaudeJSONFallback<T>({
    ...options,
    model: options.model ?? CLAUDE_STANDARD,
    fallbackModels: [GEMINI_25_FLASH],
    timeoutMs: options.timeoutMs ?? 300000,
  })
}

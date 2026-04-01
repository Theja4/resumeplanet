// lib/claude.ts - Refactored for OpenRouter support
export const CLAUDE_STANDARD = process.env.ANTHROPIC_MODEL || 'qwen/qwen3.6-plus-preview:free'
export const CLAUDE_PREMIUM = process.env.ANTHROPIC_MODEL_PREMIUM || 'anthropic/claude-3.5-sonnet'

export async function callClaude(options: {
  model: string
  system: string
  prompt: string
  maxTokens?: number
  timeoutMs?: number
}): Promise<string> {
  const { model, system, prompt, maxTokens = 4096, timeoutMs = 90000 } = options

  const OPENROUTER_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'
  const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN

  if (!OPENROUTER_KEY) {
    throw new Error('OPENROUTER_API_KEY_MISSING')
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  const body = {
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: prompt },
    ],
    max_tokens: Number(maxTokens),
  }

  try {
    console.log(`[OpenRouter] Sending request to ${OPENROUTER_URL}/chat/completions`)
    const response = await fetch(`${OPENROUTER_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_KEY}`,
        'HTTP-Referer': 'https://resumeplanet.ai',
        'X-Title': 'ResumePlanet',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenRouter Error:', errorText)
      throw new Error(`OPENROUTER_API_ERROR: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) {
      throw new Error('OPENROUTER_EMPTY_RESPONSE')
    }

    return content
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('CLAUDE_TIMEOUT')
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function callClaudeJSON<T>(options: {
  model: string
  system: string
  prompt: string
  maxTokens?: number
  timeoutMs?: number
}): Promise<T> {
  const parseJSON = (raw: string): T => {
    const cleaned = raw
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim()
    return JSON.parse(cleaned) as T
  }

  const raw = await callClaude(options)

  try {
    return parseJSON(raw)
  } catch {
    // Retry once with an explicit JSON instruction
    const retryRaw = await callClaude({
      ...options,
      prompt: options.prompt + '\n\nReturn only valid JSON. No markdown, no explanation.',
    })
    try {
      return parseJSON(retryRaw)
    } catch {
      throw new Error('CLAUDE_JSON_PARSE_FAILED')
    }
  }
}

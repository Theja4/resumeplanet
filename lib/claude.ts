import Anthropic from '@anthropic-ai/sdk'

export const CLAUDE_STANDARD = 'claude-sonnet-4-6'
export const CLAUDE_PREMIUM = 'claude-opus-4-6'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function callClaude(options: {
  model: string
  system: string
  prompt: string
  maxTokens?: number
  timeoutMs?: number
}): Promise<string> {
  const { model, system, prompt, maxTokens = 4096, timeoutMs = 30000 } = options

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('CLAUDE_TIMEOUT')), timeoutMs)
  )

  const claudePromise = client.messages.create({
    model,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: prompt }],
  })

  const message = await Promise.race([claudePromise, timeoutPromise])

  const firstBlock = message.content[0]
  if (firstBlock.type !== 'text') {
    throw new Error('Unexpected content block type from Claude')
  }
  return firstBlock.text
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

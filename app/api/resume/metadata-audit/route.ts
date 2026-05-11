import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callClaudeJSON } from '@/lib/claude'
import { isPro } from '@/lib/planUtils'
import { extractPDFItems, extractPDFMetadata, pagesToLines } from '@/lib/pdfExtractor'
import { consumeRateLimit, createRateLimitResponse } from '@/lib/rateLimit'
import { MAX_RESUME_UPLOAD_BYTES } from '@/lib/uploadLimits'
import type { Profile } from '@/types'

// ── Types ─────────────────────────────────────────────────────────────────────

export type MetadataFieldStatus = 'good' | 'weak' | 'critical'

export interface MetadataField {
  id: string
  label: string
  currentValue: string
  status: MetadataFieldStatus
  issue: string | null
  explanation: string
  suggestedValue: string
}

export interface MetadataAuditResult {
  fields: MetadataField[]
  sourceMode: 'upload' | 'saved'
  candidateName: string | null
}

const METADATA_AUDIT_MODELS = [
  'deepseek/deepseek-v4-flash',
  'google/gemini-2.5-flash',
] as const

// ── LLM System Prompt ─────────────────────────────────────────────────────────

const AUDIT_SYSTEM = `You are a PDF resume metadata auditor for job-search documents. You understand how document metadata can affect file clarity, searchability, recruiter trust, and some ATS parsing workflows.

Your task: audit the provided PDF metadata fields against the resume content and return structured JSON identifying issues and optimized values.

METADATA FIELDS TO AUDIT (always return all 6):
1. title — PDF document title. Should reflect the candidate's name and target role (e.g. "Jane Smith – Senior Product Manager Resume"). Blank or "Untitled" is critical.
2. author — PDF author field. Must be the candidate's real name. "Microsoft Word", "Adobe Acrobat", "Google Docs", "Unknown", blank = critical. Generic tool names signal a template or agency submission to ATS parsers.
3. subject — A brief descriptor (e.g. "Product Management Resume" or "Software Engineer – Backend"). Blank = weak.
4. keywords — Comma-separated searchable keywords drawn from the resume: skills, tools, certifications, job titles, domains. Empty = critical because it wastes a useful metadata field, but do not claim it overrides resume content.
5. creator — The software that produced the PDF. If it matches a known word processor or resume tool, flag it as weak (not critical) since some ATS flag non-neutral creators. Suggest "Rezoomed" or leave blank.
6. language — ISO 639 language code (e.g. "en-US"). If unset or wrong for an English resume, mark weak.

STATUS RULES:
- critical: Field is blank/empty/clearly wrong and will hurt ATS parsing or recruiter trust.
- weak: Field has a value but it's suboptimal (generic, off-brand, or missing detail).
- good: Field is appropriate and complete.

GOOD METADATA EXAMPLES:
- Product resume: title "Jane Smith - Product Manager Resume"; author "Jane Smith"; subject "Product Management Resume"; keywords "product management, roadmap planning, stakeholder management, analytics, agile".
- Engineering resume: title "Arjun Rao - Backend Software Engineer Resume"; author "Arjun Rao"; subject "Backend Software Engineering Resume"; keywords "Java, Spring Boot, APIs, distributed systems, AWS, PostgreSQL".
- Early-career resume: title "Maya Chen - Data Analyst Resume"; author "Maya Chen"; subject "Data Analytics Resume"; keywords "SQL, Excel, dashboards, reporting, data analysis, Python".

AUDIT PRIORITY:
- Keywords, title, and author are the highest-signal fields.
- Creator and language are lower-signal; flag them accurately but do not overstate their impact.
- Suggested values must be derived from resume text. Do not invent target roles or keywords that are not supported.
- Extract the best possible metadata from the visible resume content. Prefer accurate, specific values over generic "Resume" labels.
- If the resume does not clearly state a target role, use the current or most recent role/function from the resume instead of guessing.

OUTPUT CONTRACT:
- Return ONLY valid JSON, no markdown fences.
- Always return all 6 fields, even if they are good.
- issue must be null when status is "good".
- explanation must always be present (1-3 sentences explaining why this field matters for ATS and what the problem is or why it's fine).
- suggestedValue must always be a concrete string — even for "good" fields, echo back the current value.
- candidateName: extract the candidate's full name from the resume text. null if not found.
- keywords: generate 10-20 comma-separated keywords from the resume content. Prioritize technical skills, certifications, job titles, industry terms, tools.
- Never include unsupported keywords, invented target roles, or guessed certifications.
- Keep explanations accurate: metadata is a supporting signal, not a replacement for clean resume content.

JSON schema:
{
  "candidateName": "<string|null>",
  "fields": [
    {
      "id": "<string>",
      "label": "<string>",
      "currentValue": "<string>",
      "status": "good|weak|critical",
      "issue": "<string|null>",
      "explanation": "<string>",
      "suggestedValue": "<string>"
    }
  ]
}`

async function callMetadataAuditWithFallback(
  system: string,
  prompt: string
): Promise<{ candidateName: string | null; fields: MetadataField[] }> {
  const failures: Array<{ model: string; reason: string }> = []

  for (const model of METADATA_AUDIT_MODELS) {
    try {
      return await callClaudeJSON<{ candidateName: string | null; fields: MetadataField[] }>({
        model,
        system,
        prompt,
        maxTokens: 1000,
        timeoutMs: model === 'deepseek/deepseek-v4-flash' ? 120000 : 45000,
      })
    } catch (error) {
      failures.push({
        model,
        reason: error instanceof Error ? error.message : String(error),
      })
    }
  }

  throw new Error(`METADATA_AUDIT_MODELS_FAILED: ${JSON.stringify(failures)}`)
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profileData } = await supabase
    .from('profiles')
    .select('id, plan')
    .eq('id', user.id)
    .single()

  const profile = profileData as Pick<Profile, 'id' | 'plan'> | null

  if (!isPro(profile as Profile | null)) {
    return NextResponse.json({ success: false, error: 'PRO_REQUIRED' }, { status: 403 })
  }

  const rateLimit = await consumeRateLimit({
    request,
    userId: user.id,
    scope: 'metadata_audit_authenticated',
    limit: 20,
    windowSeconds: 60 * 60,
  })

  if (!rateLimit.allowed) {
    return createRateLimitResponse(rateLimit, 'TOO_MANY_METADATA_AUDIT_REQUESTS')
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 })
  }

  const file = formData.get('file')
  const resumeId = formData.get('resumeId') as string | null

  let resumeText = ''
  let rawMetadata: Record<string, string> = {}
  let sourceMode: 'upload' | 'saved' = 'saved'

  if (file && file instanceof File) {
    // ── Upload mode ────────────────────────────────────────────────────────────
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ success: false, error: 'INVALID_FILE_TYPE' }, { status: 400 })
    }

    if (file.size > MAX_RESUME_UPLOAD_BYTES) {
      return NextResponse.json({ success: false, error: 'FILE_TOO_LARGE' }, { status: 400 })
    }

    sourceMode = 'upload'
    const buffer = Buffer.from(await file.arrayBuffer())

    try {
      const [pages, meta] = await Promise.all([
        extractPDFItems(buffer),
        extractPDFMetadata(buffer),
      ])
      resumeText = pagesToLines(pages).map(l => l.text).join('\n')
      rawMetadata = extractRawMetadataFields(meta.info ?? {})
    } catch (err) {
      console.error('PDF extraction error:', err)
      return NextResponse.json({ success: false, error: 'EXTRACTION_FAILED' }, { status: 500 })
    }
  } else if (resumeId) {
    // ── Saved resume mode ──────────────────────────────────────────────────────
    const { data: resume } = await supabase
      .from('resumes')
      .select('raw_text, parsed_data')
      .eq('id', resumeId)
      .eq('user_id', user.id)
      .single()

    if (!resume) {
      return NextResponse.json({ success: false, error: 'RESUME_NOT_FOUND' }, { status: 404 })
    }

    resumeText = resume.raw_text ?? ''
    rawMetadata = {} // saved resumes have no PDF metadata — all fields will be empty
    sourceMode = 'saved'
  } else {
    return NextResponse.json({ success: false, error: 'No file or resumeId provided' }, { status: 400 })
  }

  if (resumeText.trim().length < 50) {
    return NextResponse.json({ success: false, error: 'INSUFFICIENT_RESUME_TEXT' }, { status: 422 })
  }

  const metadataSummary = Object.entries(rawMetadata)
    .map(([k, v]) => `${k}: ${v || '(empty)'}`)
    .join('\n') || '(no metadata fields found — all empty)'

  const prompt = `CURRENT PDF METADATA:
${metadataSummary}

RESUME TEXT:
${resumeText.slice(0, 2500)}`

  try {
    const result = await callMetadataAuditWithFallback(AUDIT_SYSTEM, prompt)

    const response: MetadataAuditResult = {
      fields: result.fields,
      sourceMode,
      candidateName: result.candidateName ?? null,
    }

    return NextResponse.json({ success: true, ...response })
  } catch (err) {
    console.error('Metadata audit LLM error:', err)
    const message = err instanceof Error ? err.message : 'AUDIT_FAILED'

    if (message === 'OPENROUTER_API_KEY_MISSING') {
      return NextResponse.json({ success: false, error: 'LLM_NOT_CONFIGURED' }, { status: 500 })
    }

    if (message === 'CLAUDE_TIMEOUT') {
      return NextResponse.json({ success: false, error: 'AUDIT_TIMEOUT' }, { status: 504 })
    }

    if (message.startsWith('OPENROUTER_API_ERROR')) {
      return NextResponse.json({ success: false, error: 'LLM_PROVIDER_ERROR' }, { status: 502 })
    }

    if (message.startsWith('METADATA_AUDIT_MODELS_FAILED')) {
      return NextResponse.json({ success: false, error: 'LLM_PROVIDER_ERROR' }, { status: 502 })
    }

    return NextResponse.json({ success: false, error: 'AUDIT_FAILED' }, { status: 500 })
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractRawMetadataFields(info: Record<string, unknown>): Record<string, string> {
  const fieldMap: Record<string, string> = {
    title: '',
    author: '',
    subject: '',
    keywords: '',
    creator: '',
    language: '',
  }

  const keys: Record<string, string> = {
    Title: 'title',
    Author: 'author',
    Subject: 'subject',
    Keywords: 'keywords',
    Creator: 'creator',
    Language: 'language',
  }

  for (const [rawKey, mappedKey] of Object.entries(keys)) {
    const val = info[rawKey]
    if (typeof val === 'string' && val.trim()) {
      fieldMap[mappedKey] = val.trim()
    }
  }

  return fieldMap
}

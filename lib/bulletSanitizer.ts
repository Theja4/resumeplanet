// lib/bulletSanitizer.ts
//
// Shared guard for bullets that get written back into a resume by an AI path
// (Tailor AI, ATS insights, the impact interview). Models occasionally prefix a
// rewritten bullet with the employer it belongs to ("Acme Corp: Managed ...",
// "At Acme, managed ..."), and parser segmentation bugs can leave a bare
// company name sitting in the bullet list. Both render as a bullet that just
// repeats the header directly above it.
//
// The rules here are deliberately narrow. A company mentioned INSIDE a bullet
// ("Migrated Acme Corp's billing platform to ...") is real resume content and
// must survive untouched, so leading echoes are only stripped when an explicit
// delimiter or the "At X," form makes the echo unambiguous.

export interface BulletSanitizeContext {
  company?: string | null
  title?: string | null
}

/**
 * Legal-form suffixes stripped before comparing a bullet against a company
 * name, so "Acme Corp" and "Acme" are treated as the same entity. Ordered
 * longest-first is unnecessary — stripping runs in a loop, which also handles
 * stacked suffixes like "... Private Limited".
 */
const COMPANY_SUFFIX_TOKENS = new Set([
  'ltd', 'limited',
  'pvt', 'private',
  'inc', 'incorporated',
  'corp', 'corporation',
  'llc', 'llp', 'plc',
  'co', 'company',
  'gmbh',
])

/** Delimiters that make a leading company/title mention an unambiguous echo. */
const ECHO_DELIMITER_CLASS = '[:\\-–—|•·,]'

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function collapseWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

/**
 * lowercase, trim, collapse whitespace, drop surrounding punctuation, then
 * strip trailing legal-form suffixes. Used only for the equality check that
 * drops a bullet which IS the company name — never for stripping text.
 */
export function normalizeCompanyName(value: string | null | undefined): string {
  let normalized = collapseWhitespace((value ?? '').toLowerCase())
    .replace(/^[^\p{L}\p{N}]+/u, '')
    .replace(/[^\p{L}\p{N}]+$/u, '')

  if (!normalized) return ''

  // Strip legal-form suffixes repeatedly: "acme technology private limited"
  // → "acme technology". Stops as soon as a non-suffix token is on the end so
  // a company literally named "Limited Brands" keeps its leading token.
  for (;;) {
    const tokens = normalized.split(' ').filter(Boolean)
    if (tokens.length <= 1) break

    const last = tokens[tokens.length - 1].replace(/[.]/g, '')
    if (!COMPANY_SUFFIX_TOKENS.has(last)) break

    tokens.pop()
    normalized = tokens.join(' ')
  }

  return normalized
}

/**
 * Candidate surface forms for one entity: the literal name plus its
 * suffix-stripped form, because models shorten "Acme Corp" to "Acme" when
 * echoing. Both are still delimiter-gated at strip time.
 */
function echoCandidates(entity: string | null | undefined): string[] {
  const literal = collapseWhitespace(entity ?? '')
  if (literal.length < 2) return []

  const candidates = new Set<string>([literal])

  const withoutSuffix = normalizeCompanyName(literal)
  // Recover the original casing/spacing of the suffix-stripped prefix so the
  // pattern still matches the bullet's actual text (matching is case-insensitive,
  // but this keeps the token boundaries honest).
  if (withoutSuffix && withoutSuffix.length >= 2 && withoutSuffix !== literal.toLowerCase()) {
    const wordCount = withoutSuffix.split(' ').length
    const prefix = literal.split(/\s+/).slice(0, wordCount).join(' ')
    if (prefix.length >= 2) candidates.add(prefix)
  }

  return Array.from(candidates)
}

function buildEchoPatterns(context: BulletSanitizeContext): RegExp[] {
  const entities = [
    ...echoCandidates(context.company),
    ...echoCandidates(context.title),
  ]

  return entities.map(
    entity => new RegExp(`^(?:at\\s+)?${escapeRegExp(entity)}\\s*${ECHO_DELIMITER_CLASS}\\s*`, 'i')
  )
}

function stripLeadingEchoes(bullet: string, patterns: RegExp[]): string {
  let working = bullet.trim()

  // Looping keeps the function idempotent — "Acme: Acme - text" collapses in
  // one pass rather than leaving work for a second call. Bounded so a
  // pathological pattern can't spin.
  for (let pass = 0; pass < 5; pass++) {
    let stripped = false

    for (const pattern of patterns) {
      const next = working.replace(pattern, '')
      if (next !== working) {
        working = next.trim()
        stripped = true
      }
    }

    if (!stripped) break
  }

  return working
}

/**
 * Sanitize one AI-generated bullet. Returns '' when the bullet should be
 * dropped entirely (it was nothing but the employer name, or nothing survived
 * the strip).
 */
export function sanitizeGeneratedBullet(
  bullet: string,
  context: BulletSanitizeContext
): string {
  if (typeof bullet !== 'string') return ''

  const patterns = buildEchoPatterns(context)
  const stripped = patterns.length > 0 ? stripLeadingEchoes(bullet, patterns) : bullet.trim()

  if (!stripped) return ''

  const normalizedCompany = normalizeCompanyName(context.company)
  if (normalizedCompany && normalizeCompanyName(stripped) === normalizedCompany) {
    return ''
  }

  return stripped
}

/**
 * Sanitize a list of AI-generated bullets for one experience/project entry.
 * Dropped bullets are removed from the result rather than left as empty
 * strings, so callers can compare lengths to detect a drop.
 */
export function sanitizeGeneratedBullets(
  bullets: string[],
  context: BulletSanitizeContext
): string[] {
  if (!Array.isArray(bullets)) return []

  return bullets
    .map(bullet => sanitizeGeneratedBullet(bullet, context))
    .filter(bullet => bullet.length > 0)
}

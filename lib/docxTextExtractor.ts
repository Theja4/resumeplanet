/**
 * Extract plain text from a DOCX buffer while preserving bullet/list markers.
 *
 * mammoth.extractRawText() can omit generated list markers when bullets are
 * represented as DOCX list formatting instead of literal characters. This
 * helper uses convertToHtml() and converts <li> elements into "• "-prefixed
 * lines so downstream parsers can detect them.
 */
export async function extractDocxText(buffer: Buffer): Promise<string> {
  const mammoth = await import('mammoth')
  const { value: html } = await mammoth.convertToHtml({ buffer })

  return html
    // Turn each <li> into a bullet-prefixed line
    .replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi, (_match, inner: string) => {
      const text = stripTags(inner).trim()
      return text ? `\n• ${text}\n` : '\n'
    })
    // Block-level elements → newlines
    .replace(/<\/?(p|div|br|h[1-6]|tr|ul|ol|table)\b[^>]*\/?>/gi, '\n')
    // Strip remaining tags
    .replace(/<[^>]+>/g, '')
    // Decode common HTML entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    // Collapse excessive blank lines
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, '')
}

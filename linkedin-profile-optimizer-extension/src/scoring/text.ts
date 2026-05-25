const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "from",
  "are",
  "you",
  "your",
  "will",
  "have",
  "has",
  "our",
  "their",
  "they",
  "work",
  "role",
  "team",
  "job",
  "candidate",
  "experience",
  "skills",
  "years",
  "using",
  "including",
  "across",
  "within",
  "about",
  "into",
  "such",
]);

export function extractKeywords(text: string, limit = 35): string[] {
  const counts = new Map<string, number>();

  for (const token of text
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean)) {
    if (token.length < 3 || STOP_WORDS.has(token)) continue;
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([word]) => word);
}

export function containsKeyword(haystack: string, keyword: string): boolean {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9+#.])${escaped}([^a-z0-9+#.]|$)`, "i").test(haystack);
}

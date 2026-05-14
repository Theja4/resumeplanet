export function normalizeIsoDate(value: unknown) {
  if (typeof value !== 'string' || !value) return null

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  return date.toISOString()
}

export function isPeriodEndInFuture(periodEnd: string | null | undefined, now = new Date()) {
  if (!periodEnd) return false

  const date = new Date(periodEnd)
  return !Number.isNaN(date.getTime()) && date > now
}

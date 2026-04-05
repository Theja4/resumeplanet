export function countWords(value: string | null | undefined) {
  return (value ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
}

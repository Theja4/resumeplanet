// Shared avatar helpers — initials + a deterministic color picked from the
// user's name/email so the same person always gets the same swatch.

export const AVATAR_COLORS = [
  'bg-pink-100 text-pink-600 border-pink-200',
  'bg-violet-100 text-violet-600 border-violet-200',
  'bg-sky-100 text-sky-600 border-sky-200',
  'bg-emerald-100 text-emerald-600 border-emerald-200',
  'bg-amber-100 text-amber-600 border-amber-200',
  'bg-rose-100 text-rose-600 border-rose-200',
  'bg-teal-100 text-teal-600 border-teal-200',
  'bg-indigo-100 text-indigo-600 border-indigo-200',
]

export function getInitials(name: string | null, email: string): string {
  if (name) {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  return email[0]?.toUpperCase() ?? '?'
}

export function getAvatarColor(name: string | null, email: string): string {
  const char = (name?.[0] ?? email[0] ?? '?').toUpperCase()
  const index = char.charCodeAt(0) % AVATAR_COLORS.length
  return AVATAR_COLORS[index]
}

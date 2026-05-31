// Multicolor Google Chrome logo (tri-color wedges + blue center).
export default function ChromeLogo({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path fill="#ea4335" d="M24 24 L3.22 12 A24 24 0 0 1 44.78 12 Z" />
      <path fill="#fbbc04" d="M24 24 L44.78 12 A24 24 0 0 1 24 48 Z" />
      <path fill="#34a853" d="M24 24 L24 48 A24 24 0 0 1 3.22 12 Z" />
      <circle cx="24" cy="24" r="11" fill="#fff" />
      <circle cx="24" cy="24" r="9.2" fill="#4285f4" />
    </svg>
  )
}

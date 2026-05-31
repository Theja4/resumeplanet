import { CHROME_STORE_URL } from '@/lib/site'
import ChromeLogo from '@/components/icons/ChromeLogo'

/**
 * "Available in the Chrome Web Store" badge — official-style lockup
 * (colorful Chrome mark + two-line label) rendered as a real link so it
 * stays crisp at any size and theme-matched. Links to the store listing.
 */
export default function ChromeStoreBadge({ className = '' }: { className?: string }) {
  return (
    <a
      href={CHROME_STORE_URL}
      target="_blank"
      rel="noreferrer noopener"
      aria-label="Available in the Chrome Web Store"
      className={`group inline-flex items-center gap-3 rounded-xl border border-zinc-300/80 bg-white px-4 py-2.5 shadow-sm transition hover:border-zinc-400 hover:shadow-md ${className}`}
    >
      <ChromeLogo className="h-7 w-7 shrink-0" />
      <span className="flex flex-col leading-tight">
        <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-500">
          Available in the
        </span>
        <span className="text-sm font-bold tracking-tight text-zinc-900">Chrome Web Store</span>
      </span>
    </a>
  )
}

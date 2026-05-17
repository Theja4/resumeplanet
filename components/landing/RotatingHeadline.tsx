'use client'

/**
 * RotatingHeadline
 * ────────────────────────────────────────────────────────────────────
 * Drop-in client component that types each word in `words`, holds it,
 * deletes it, and rolls onto the next. Designed to slot into the
 * hero's existing .hero-typewriter-text wrapper so all of the
 * typography and italic-safe styling continues to apply.
 *
 * SSR safe: renders the initial word as plain text on the server, so
 * crawlers / first paint always see real headline content. The
 * cycling kicks in once hydrated. Honors prefers-reduced-motion by
 * keeping the initial word static.
 */

import { useEffect, useState } from 'react'

interface Props {
  words: string[]
  /** ms between keystrokes while typing */
  typeMs?: number
  /** ms between keystrokes while deleting */
  deleteMs?: number
  /** ms to hold a fully-typed word before deleting */
  holdMs?: number
  /** Which word to render on first paint (used by SSR + hydration) */
  initialIndex?: number
}

type Mode = 'holding' | 'deleting' | 'typing'

export default function RotatingHeadline({
  words,
  typeMs = 65,
  deleteMs = 32,
  holdMs = 1800,
  initialIndex = 0,
}: Props) {
  const safeInitial = ((initialIndex % words.length) + words.length) % words.length
  const [wordIndex, setWordIndex] = useState(safeInitial)
  const [text, setText] = useState(words[safeInitial] ?? '')
  // Start in "holding" so the SSR'd initial word remains on screen
  // for one full hold cycle before the first deletion begins.
  const [mode, setMode] = useState<Mode>('holding')

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return

    const word = words[wordIndex] ?? ''
    let timeout: ReturnType<typeof setTimeout>

    if (mode === 'holding') {
      timeout = setTimeout(() => setMode('deleting'), holdMs)
    } else if (mode === 'deleting') {
      if (text.length > 0) {
        timeout = setTimeout(
          () => setText(word.slice(0, text.length - 1)),
          deleteMs,
        )
      } else {
        setWordIndex((i) => (i + 1) % words.length)
        setMode('typing')
      }
    } else {
      if (text.length < word.length) {
        timeout = setTimeout(
          () => setText(word.slice(0, text.length + 1)),
          typeMs,
        )
      } else {
        setMode('holding')
      }
    }

    return () => clearTimeout(timeout)
  }, [text, mode, wordIndex, words, typeMs, deleteMs, holdMs])

  return (
    <span className="hero-typewriter-text italic landing-italic-safe">
      {/* Zero-width space keeps the line height stable while text is empty */}
      {text || '\u200B'}
    </span>
  )
}

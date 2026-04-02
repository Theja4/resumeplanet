'use client'

import { useEffect, type RefObject } from 'react'

interface FocusFieldOptions {
  focusPath?: string | null
  rootRef: RefObject<HTMLElement | null>
  fallbackSelector?: string
  onHandled?: () => void
}

export function useFocusFieldPath({
  focusPath,
  rootRef,
  fallbackSelector = 'input, textarea',
  onHandled,
}: FocusFieldOptions) {
  useEffect(() => {
    if (!focusPath || !rootRef.current) return

    const id = window.requestAnimationFrame(() => {
      const root = rootRef.current
      if (!root) return

      const escapedPath = typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(focusPath) : focusPath
      const exact = root.querySelector<HTMLElement>(`[data-field-path="${escapedPath}"]`)
      const fallback = exact ?? root.querySelector<HTMLElement>(fallbackSelector)

      if (fallback instanceof HTMLInputElement || fallback instanceof HTMLTextAreaElement) {
        fallback.focus()
        fallback.select?.()
        onHandled?.()
      }
    })

    return () => window.cancelAnimationFrame(id)
  }, [focusPath, rootRef, fallbackSelector, onHandled])
}

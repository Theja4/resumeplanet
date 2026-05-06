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
      let exact = root.querySelector<HTMLElement>(`[data-field-path="${escapedPath}"]`)
      
      // If no exact match, try stripping the last segment (e.g. .0 or .title) to find a parent container/input
      if (!exact && focusPath.includes('.')) {
        const segments = focusPath.split('.')
        while (segments.length > 1 && !exact) {
          segments.pop()
          const parentPath = segments.join('.')
          const escapedParent = typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(parentPath) : parentPath
          exact = root.querySelector<HTMLElement>(`[data-field-path="${escapedParent}"]`)
        }
      }

      const fallback = exact ?? root.querySelector<HTMLElement>(fallbackSelector)

      if (fallback instanceof HTMLInputElement || fallback instanceof HTMLTextAreaElement) {
        fallback.scrollIntoView({ behavior: 'smooth', block: 'center' })
        fallback.focus({ preventScroll: true })
        fallback.select?.()
        onHandled?.()
      }
    })

    return () => window.cancelAnimationFrame(id)
  }, [focusPath, rootRef, fallbackSelector, onHandled])
}

'use client'

import { forwardRef, useLayoutEffect, useRef } from 'react'

/**
 * Textarea that automatically grows to fit its content, capped at half the
 * viewport height. Users can still drag the resize handle to override the
 * auto-grown height; once they do, the user's height wins until the content
 * grows past it (we never shrink below the user's manual choice).
 *
 * The bottom-right resize handle is enlarged via a CSS class (`agt-resizer`)
 * applied to a wrapper. The native resizer is styled by ::-webkit-resizer in
 * globals.css; the wrapper adds a visible visual hint in all browsers.
 */
interface AutoGrowTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Max height in px. Defaults to 50% of window.innerHeight at render time. */
  maxHeight?: number
  /** Minimum height — useful so empty textareas don't collapse to one line. */
  minHeight?: number
}

const AutoGrowTextarea = forwardRef<HTMLTextAreaElement, AutoGrowTextareaProps>(
  function AutoGrowTextarea({ maxHeight, minHeight = 64, style, ...props }, forwardedRef) {
    const innerRef = useRef<HTMLTextAreaElement>(null)
    const userResizedRef = useRef<number | null>(null)

    function setRef(node: HTMLTextAreaElement | null) {
      innerRef.current = node
      if (typeof forwardedRef === 'function') forwardedRef(node)
      else if (forwardedRef) forwardedRef.current = node
    }

    useLayoutEffect(() => {
      const el = innerRef.current
      if (!el) return
      const computedMax =
        maxHeight ??
        (typeof window !== 'undefined' ? Math.round(window.innerHeight * 0.5) : 600)
      const userMin = userResizedRef.current ?? minHeight

      // Reset to 0 so scrollHeight reflects actual content height, not the
      // previously-set explicit height.
      el.style.height = 'auto'
      const contentHeight = el.scrollHeight
      const target = Math.max(userMin, Math.min(computedMax, contentHeight))
      el.style.height = `${target}px`
    }, [props.value, maxHeight, minHeight])

    // Detect manual resize via mouse drag — when the user drags the handle,
    // record their height so auto-grow doesn't override their preference.
    function handleMouseDown(e: React.MouseEvent<HTMLTextAreaElement>) {
      const el = innerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      // Resize handle is in the bottom-right 16x16 corner.
      const isOnHandle =
        e.clientX > rect.right - 16 && e.clientY > rect.bottom - 16
      if (!isOnHandle) return
      const startHeight = el.offsetHeight
      function onMove() {
        if (!el) return
        const newHeight = el.offsetHeight
        if (newHeight !== startHeight) {
          userResizedRef.current = newHeight
        }
      }
      function onUp() {
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
      }
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
    }

    return (
      <textarea
        ref={setRef}
        {...props}
        onMouseDown={(e) => {
          handleMouseDown(e)
          props.onMouseDown?.(e)
        }}
        // Explicit min/max heights respected by browser resize too.
        style={{
          minHeight: `${minHeight}px`,
          maxHeight: maxHeight
            ? `${maxHeight}px`
            : 'calc(50vh)',
          resize: 'vertical',
          // Mark this textarea so globals.css can style its native resizer.
          // Using a custom class instead of relying on selector specificity.
          ...style,
        }}
        className={`agt-textarea ${props.className ?? ''}`}
      />
    )
  }
)

export default AutoGrowTextarea

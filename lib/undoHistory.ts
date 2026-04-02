import { useRef, useCallback } from 'react'
import type { ResumeData, BuilderVisibility } from '@/types'

const MAX_HISTORY = 20

export function useUndoHistory() {
  const undoRef = useRef<Array<{ data: ResumeData; visibility: BuilderVisibility }>>([])
  const redoRef = useRef<Array<{ data: ResumeData; visibility: BuilderVisibility }>>([])

  const pushHistory = useCallback(
    (data: ResumeData, visibility: BuilderVisibility) => {
      const next = [
        ...undoRef.current,
        { data: structuredClone(data), visibility: structuredClone(visibility) },
      ]
      if (next.length > MAX_HISTORY) {
        undoRef.current = next.slice(next.length - MAX_HISTORY)
      } else {
        undoRef.current = next
      }
      redoRef.current = [] // New change clears redo stack
    },
    [],
  )

  const undo = useCallback((): { data: ResumeData; visibility: BuilderVisibility } | null => {
    if (undoRef.current.length === 0) return null
    const entry = undoRef.current.pop()!
    redoRef.current.push({ data: structuredClone(entry.data), visibility: structuredClone(entry.visibility) })
    return entry
  }, [])

  const redo = useCallback((): { data: ResumeData; visibility: BuilderVisibility } | null => {
    if (redoRef.current.length === 0) return null
    const entry = redoRef.current.pop()!
    undoRef.current.push({ data: structuredClone(entry.data), visibility: structuredClone(entry.visibility) })
    return entry
  }, [])

  const canUndo = undoRef.current.length > 0
  const canRedo = redoRef.current.length > 0

  return { canUndo, canRedo, pushHistory, undo, redo }
}

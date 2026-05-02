import { useRef, useCallback, useState } from 'react'
import type { ResumeData, BuilderVisibility } from '@/types'

const MAX_HISTORY = 20

export function useUndoHistory() {
  const undoRef = useRef<Array<{ data: ResumeData; visibility: BuilderVisibility }>>([])
  const redoRef = useRef<Array<{ data: ResumeData; visibility: BuilderVisibility }>>([])
  const [undoCount, setUndoCount] = useState(0)
  const [redoCount, setRedoCount] = useState(0)

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
      setUndoCount(undoRef.current.length)
      setRedoCount(0)
    },
    [],
  )

  const undo = useCallback((
    currentData: ResumeData,
    currentVisibility: BuilderVisibility,
  ): { data: ResumeData; visibility: BuilderVisibility } | null => {
    if (undoRef.current.length === 0) return null
    const entry = undoRef.current.pop()!
    redoRef.current.push({
      data: structuredClone(currentData),
      visibility: structuredClone(currentVisibility),
    })
    setUndoCount(undoRef.current.length)
    setRedoCount(redoRef.current.length)
    return entry
  }, [])

  const redo = useCallback((
    currentData: ResumeData,
    currentVisibility: BuilderVisibility,
  ): { data: ResumeData; visibility: BuilderVisibility } | null => {
    if (redoRef.current.length === 0) return null
    const entry = redoRef.current.pop()!
    undoRef.current.push({
      data: structuredClone(currentData),
      visibility: structuredClone(currentVisibility),
    })
    setUndoCount(undoRef.current.length)
    setRedoCount(redoRef.current.length)
    return entry
  }, [])

  return { canUndo: undoCount > 0, canRedo: redoCount > 0, pushHistory, undo, redo }
}

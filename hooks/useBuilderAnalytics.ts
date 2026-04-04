'use client'

import { useCallback, useEffect, useRef } from 'react'
import { Analytics, type BuilderSource, type DownloadFormat } from '@/lib/analytics'

interface UseBuilderAnalyticsOptions {
  templateId: string
  source: BuilderSource
  activeSection: string | null
}

export function useBuilderAnalytics({
  templateId,
  source,
  activeSection,
}: UseBuilderAnalyticsOptions) {
  const initialTemplateIdRef = useRef(templateId)
  const initialSourceRef = useRef(source)
  const sessionStartedAtRef = useRef(0)
  const latestTemplateIdRef = useRef(templateId)
  const currentSectionRef = useRef<string>(activeSection ?? 'contact')
  const currentSectionStartedAtRef = useRef(0)
  const editedSectionsRef = useRef<Set<string>>(new Set())
  const hasDownloadedRef = useRef(false)
  const lastActiveSectionRef = useRef<string>(activeSection ?? 'contact')
  const idleTimeoutRef = useRef<number | null>(null)
  const idleStateRef = useRef(false)
  const sessionEndedRef = useRef(false)

  const markInteraction = useCallback((sectionType?: string) => {
    if (sectionType) {
      lastActiveSectionRef.current = sectionType
    }

    idleStateRef.current = false

    if (idleTimeoutRef.current) {
      window.clearTimeout(idleTimeoutRef.current)
    }

    idleTimeoutRef.current = window.setTimeout(() => {
      idleStateRef.current = true
      Analytics.builderIdleDetected({
        idleDurationMs: 60_000,
        lastActiveSection: lastActiveSectionRef.current,
      })
    }, 60_000)
  }, [])

  const flushCurrentSectionTime = useCallback(
    (nextSection?: string | null) => {
      const previousSection = currentSectionRef.current
      if (previousSection) {
        const durationMs = Date.now() - currentSectionStartedAtRef.current
        if (durationMs >= 250) {
          Analytics.builderSectionTimeSpent({
            sectionType: previousSection,
            durationMs,
          })
        }
      }

      currentSectionRef.current = nextSection ?? previousSection
      currentSectionStartedAtRef.current = Date.now()
    },
    []
  )

  const endSession = useCallback(
    (transport: 'sendBeacon' | 'fetch' = 'fetch') => {
      if (sessionEndedRef.current) return
      sessionEndedRef.current = true

      flushCurrentSectionTime(currentSectionRef.current)

      Analytics.builderSessionEnded(
        {
          durationMs: Date.now() - sessionStartedAtRef.current,
          sectionsEdited: editedSectionsRef.current.size,
          templateId: latestTemplateIdRef.current,
          downloaded: hasDownloadedRef.current,
        },
        { transport }
      )
    },
    [flushCurrentSectionTime]
  )

  useEffect(() => {
    latestTemplateIdRef.current = templateId
  }, [templateId])

  useEffect(() => {
    Analytics.builderOpened({
      templateId: initialTemplateIdRef.current,
      source: initialSourceRef.current,
    })

    Analytics.builderPreviewOpened({
      templateId: initialTemplateIdRef.current,
    })

    const startedAt = Date.now()
    sessionStartedAtRef.current = startedAt
    currentSectionStartedAtRef.current = startedAt
    markInteraction(currentSectionRef.current)

    const interactionEvents: Array<keyof WindowEventMap> = [
      'click',
      'keydown',
      'mousemove',
      'touchstart',
      'scroll',
    ]

    function handleInteraction() {
      markInteraction(currentSectionRef.current)
    }

    function handlePageHide() {
      endSession('sendBeacon')
    }

    interactionEvents.forEach(eventName => {
      window.addEventListener(eventName, handleInteraction, { passive: true })
    })
    window.addEventListener('pagehide', handlePageHide)

    return () => {
      interactionEvents.forEach(eventName => {
        window.removeEventListener(eventName, handleInteraction)
      })
      window.removeEventListener('pagehide', handlePageHide)

      if (idleTimeoutRef.current) {
        window.clearTimeout(idleTimeoutRef.current)
      }

      endSession('sendBeacon')
    }
  }, [endSession, markInteraction])

  useEffect(() => {
    if ((activeSection ?? 'contact') === currentSectionRef.current) return
    flushCurrentSectionTime(activeSection ?? 'contact')
    markInteraction(activeSection ?? 'contact')
  }, [activeSection, flushCurrentSectionTime, markInteraction])

  const trackSectionEdit = useCallback(
    (
      sectionType: string,
      action: 'edit' | 'reorder' | 'toggle_visibility' | 'add' | 'delete'
    ) => {
      editedSectionsRef.current.add(sectionType)
      markInteraction(sectionType)
      Analytics.builderSectionEdited({
        sectionType,
        action,
      })
    },
    [markInteraction]
  )

  const trackTemplateChange = useCallback(
    (fromTemplateId: string, toTemplateId: string) => {
      markInteraction(lastActiveSectionRef.current)
      latestTemplateIdRef.current = toTemplateId
      Analytics.builderTemplateChanged({
        fromTemplateId,
        toTemplateId,
      })
      Analytics.templateSelected({
        templateId: toTemplateId,
        source: 'builder',
      })
    },
    [markInteraction]
  )

  const trackDragReorder = useCallback(
    (sectionType: string, fromIndex: number, toIndex: number) => {
      editedSectionsRef.current.add(sectionType)
      markInteraction(sectionType)
      Analytics.builderDragReorder({
        sectionType,
        fromIndex,
        toIndex,
      })
    },
    [markInteraction]
  )

  const trackVisibilityToggle = useCallback(
    (sectionType: string, visible: boolean) => {
      editedSectionsRef.current.add(sectionType)
      markInteraction(sectionType)
      Analytics.builderVisibilityToggled({
        sectionType,
        visible,
      })
    },
    [markInteraction]
  )

  const trackDownload = useCallback(
    (
      action: 'clicked' | 'completed' | 'failed',
      format: DownloadFormat,
      error?: string
    ) => {
      markInteraction(lastActiveSectionRef.current)

      if (action === 'clicked') {
        Analytics.builderDownloadClicked({ templateId, format })
        return
      }

      if (action === 'completed') {
        hasDownloadedRef.current = true
        Analytics.builderDownloadCompleted({ templateId, format })
        return
      }

      Analytics.builderDownloadFailed({
        templateId,
        error: error ?? 'Unknown download error',
      })
    },
    [markInteraction, templateId]
  )

  const trackUndoRedo = useCallback(
    (action: 'undo' | 'redo') => {
      markInteraction(lastActiveSectionRef.current)
      Analytics.builderUndoRedoUsed({ action })
    },
    [markInteraction]
  )

  const trackSubSectionEditorOpened = useCallback(
    (sectionType: string, subSectionId: string) => {
      markInteraction(sectionType)
      Analytics.builderSubSectionEditorOpened({
        sectionType,
        subSectionId,
      })
    },
    [markInteraction]
  )

  return {
    trackSectionEdit,
    trackTemplateChange,
    trackDragReorder,
    trackVisibilityToggle,
    trackDownload,
    trackUndoRedo,
    trackSubSectionEditorOpened,
  }
}

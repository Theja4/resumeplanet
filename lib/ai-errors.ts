/**
 * Standardized error mapping for AI-powered features.
 * Maps technical error codes or response types to user-friendly, actionable messages.
 */

export type AIErrorType = 
  | 'TIMEOUT' 
  | 'MALFORMED_JSON' 
  | 'RATE_LIMIT' 
  | 'CONTEXT_TOO_LARGE' 
  | 'PROVIDER_ERROR'
  | 'UNKNOWN'

export interface AIErrorDetails {
  title: string
  message: string
  isRetryable: boolean
}

export function getAIErrorMessage(error: string | unknown): AIErrorDetails {
  const errorCode = typeof error === 'string' ? error : (error as any)?.error || 'UNKNOWN'

  const errorMap: Record<string, AIErrorDetails> = {
    'CLAUDE_TIMEOUT': {
      title: 'Analysis Timed Out',
      message: 'This analysis is taking longer than expected. Try again with a shorter resume or simpler job description.',
      isRetryable: true
    },
    'TIMEOUT': {
      title: 'Analysis Timed Out',
      message: 'The AI took too long to respond. This usually resolves on retry.',
      isRetryable: true
    },
    'MALFORMED_JSON': {
      title: 'Formatting Error',
      message: 'The AI response was malformed. This usually resolves on retry.',
      isRetryable: true
    },
    'TOO_MANY_REQUESTS': {
      title: 'Rate Limit Reached',
      message: "You've sent too many requests. Please wait a few minutes before trying again.",
      isRetryable: false
    },
    'JOB_DESCRIPTION_TOO_SHORT': {
      title: 'Description Too Short',
      message: 'Job description must be at least 20 words. Try copying the full responsibilities and requirements.',
      isRetryable: false
    },
    'RESUME_TEXT_TOO_LONG': {
      title: 'Resume Too Long',
      message: 'Your resume text is too long for the AI to process in one go. Try removing some older sections.',
      isRetryable: false
    },
    'PRO_REQUIRED': {
      title: 'Pro Feature',
      message: 'This advanced AI analysis requires a Pro plan.',
      isRetryable: false
    }
  }

  return errorMap[errorCode] || {
    title: 'AI Error',
    message: 'All AI providers are temporarily unavailable or returned an error. Please try again in a few minutes.',
    isRetryable: true
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/planEnforcement'
import type { Profile } from '@/types'
import type { User } from '@supabase/supabase-js'
import type { createClient } from '@/lib/supabase/server'
import { isPro } from '@/lib/planUtils'

export interface APIAuthContext {
  userId: string
  profile: Profile
  supabase: Awaited<ReturnType<typeof createClient>>
  user: User
}

type APIHandler = (req: NextRequest, ctx: APIAuthContext) => Promise<NextResponse>

/**
 * Standardized error handler for API routes.
 * Wraps the handler in a try-catch and returns a consistent 500 error.
 */
export function withErrorHandling(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    try {
      return await handler(req)
    } catch (error) {
      console.error(`[API ERROR] ${req.nextUrl.pathname}:`, error)
      
      // Check if it's a known error type or if we should be generic
      const message = error instanceof Error ? error.message : 'An unexpected error occurred'
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'INTERNAL_ERROR', 
          message: process.env.NODE_ENV === 'development' ? message : 'Internal Server Error' 
        },
        { status: 500 }
      )
    }
  }
}

/**
 * Ensures the user is authenticated before running the handler.
 * Includes global error handling.
 */
export function withAuth(handler: APIHandler) {
  return withErrorHandling(async (req: NextRequest) => {
    const result = await requireAuth()
    
    if (result instanceof NextResponse) {
      return result
    }

    return handler(req, result as APIAuthContext)
  })
}

/**
 * Ensures the user is authenticated AND has a Pro plan.
 * Includes global error handling.
 */
export function withPro(handler: APIHandler) {
  return withAuth(async (req, ctx) => {
    if (!isPro(ctx.profile)) {
      return NextResponse.json(
        { success: false, error: 'PRO_REQUIRED' },
        { status: 403 }
      )
    }
    return handler(req, ctx)
  })
}

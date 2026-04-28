import type { User } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/types'

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>
type SupabaseResultWithError = { error: { message: string } | null }

export interface AuthenticatedUserContext {
  supabase: ServerSupabaseClient
  user: User
  userId: string
  profile: Profile
}

function isRetryableSupabaseError(error: SupabaseResultWithError['error']) {
  if (!error?.message) return false

  const message = error.message.toLowerCase()
  return (
    message.includes('fetch failed') ||
    message.includes('networkerror') ||
    message.includes('econnreset') ||
    message.includes('enotfound') ||
    message.includes('etimedout')
  )
}

async function retrySupabaseRequest<T extends SupabaseResultWithError>(
  request: () => PromiseLike<T>,
  maxRetries = 2
) {
  let lastResult = await request()

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    if (!isRetryableSupabaseError(lastResult.error)) {
      return lastResult
    }

    await new Promise((resolve) => setTimeout(resolve, 250 * Math.pow(2, attempt - 1)))
    lastResult = await request()
  }

  return lastResult
}

const readAuthenticatedUserContext = cache(async (): Promise<AuthenticatedUserContext | null> => {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await retrySupabaseRequest(() => supabase.auth.getUser())

  if (userError) {
    if (userError.message.toLowerCase().includes('auth session missing')) {
      return null
    }

    throw new Error(`Failed to load authenticated user: ${userError.message}`)
  }

  if (!user) {
    return null
  }

  const { data: profile, error: profileError } = await retrySupabaseRequest(() =>
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
  )

  if (profileError) {
    throw new Error(`Failed to load authenticated profile: ${profileError.message}`)
  }

  if (!profile) {
    return null
  }

  return {
    supabase,
    user,
    userId: user.id,
    profile: profile as Profile,
  }
})

export async function getOptionalAuthenticatedUserContext() {
  return readAuthenticatedUserContext()
}

export async function getAuthenticatedUserContext() {
  const context = await readAuthenticatedUserContext()

  if (!context) {
    redirect('/auth/login')
  }

  return context
}

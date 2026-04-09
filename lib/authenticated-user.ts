import type { User } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/types'

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>

export interface AuthenticatedUserContext {
  supabase: ServerSupabaseClient
  user: User
  userId: string
  profile: Profile
}

const readAuthenticatedUserContext = cache(async (): Promise<AuthenticatedUserContext | null> => {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    if (userError.message.toLowerCase().includes('auth session missing')) {
      return null
    }

    throw new Error(`Failed to load authenticated user: ${userError.message}`)
  }

  if (!user) {
    return null
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

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

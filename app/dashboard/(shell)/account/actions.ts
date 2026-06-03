'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type UpdateNameState = {
  status: 'idle' | 'success' | 'error'
  message?: string
  name?: string
}

const MAX_NAME_LENGTH = 80

export async function updateProfileName(
  _prevState: UpdateNameState,
  formData: FormData
): Promise<UpdateNameState> {
  const rawName = formData.get('full_name')
  const fullName = typeof rawName === 'string' ? rawName.trim() : ''

  if (!fullName) {
    return { status: 'error', message: 'Please enter your name.' }
  }

  if (fullName.length > MAX_NAME_LENGTH) {
    return { status: 'error', message: `Name must be ${MAX_NAME_LENGTH} characters or fewer.` }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { status: 'error', message: 'Your session expired. Please sign in again.' }
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ full_name: fullName })
    .eq('id', user.id)

  if (profileError) {
    return { status: 'error', message: 'Could not save your name. Please try again.' }
  }

  // Keep the auth metadata in sync so the name is consistent across the app.
  await supabase.auth.updateUser({ data: { full_name: fullName } })

  revalidatePath('/dashboard/account')
  revalidatePath('/dashboard')

  return { status: 'success', message: 'Saved', name: fullName }
}

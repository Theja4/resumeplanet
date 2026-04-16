'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { syncResumeData } from '@/lib/resume-data'
import type { ResumeData } from '@/types'

export async function deleteResume(id: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  // Fetch the storage path before deleting
  const { data: resume } = await supabase
    .from('resumes')
    .select('original_file_url')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  // Delete DB row (cascades to ats_scores)
  await supabase.from('resumes').delete().eq('id', id).eq('user_id', user.id)

  // Delete from storage if path exists
  if (resume?.original_file_url) {
    await supabase.storage.from('resumes').remove([resume.original_file_url])
  }

  revalidatePath('/dashboard/resumes')
}

export async function renameResume(id: string, title: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('resumes')
    .update({ title: title.trim() })
    .eq('id', id)
    .eq('user_id', user.id)

  revalidatePath('/dashboard/resumes')
  revalidatePath(`/dashboard/resumes/${id}`)
}

export async function updateResumeData(id: string, parsedData: ResumeData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('resumes')
    .update({ parsed_data: syncResumeData(parsedData) })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/resumes/${id}`)
  return { success: true }
}

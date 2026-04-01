import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function BuilderIndexPage() {
  // The user wants the 'Resume Builder' tab to always start a new resume
  redirect('/dashboard/builder/new')
}

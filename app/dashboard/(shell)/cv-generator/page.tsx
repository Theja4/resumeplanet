import { createClient } from '@/lib/supabase/server'
import CVGeneratorClient from '@/components/cv/CVGeneratorClient'
import type { Resume } from '@/types'

export const dynamic = 'force-dynamic'

export default async function CVGeneratorPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: resumesData } = await supabase
    .from('resumes')
    .select('id, title, parsed_data')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  const resumes = (resumesData ?? []) as Pick<Resume, 'id' | 'title' | 'parsed_data'>[]

  return <CVGeneratorClient resumes={resumes} />
}

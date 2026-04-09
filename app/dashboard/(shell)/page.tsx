import DashboardHomeClient from './DashboardHomeClient'
import { getAuthenticatedUserContext } from '@/lib/authenticated-user'

export default async function DashboardPage() {
  const { profile } = await getAuthenticatedUserContext()

  return <DashboardHomeClient profile={profile} />
}

import { redirect } from 'next/navigation'

export default function MisspelledAffiliateDashboardRedirect() {
  redirect('/affiliate/dashboard')
}

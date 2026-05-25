import { redirect } from 'next/navigation'
import { getOptionalAuthenticatedUserContext } from '@/lib/authenticated-user'
import HandshakeClient from './HandshakeClient'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ ext_id?: string; req?: string }>
}

// Chrome extension IDs are always 32 lowercase letters a–p. Reject anything
// else so a malicious link can't try to coerce this page into talking to an
// arbitrary "extension."
const EXTENSION_ID = /^[a-p]{32}$/
// Request ID is a UUIDv4 we generated in the background worker.
const REQUEST_ID = /^[0-9a-f-]{36}$/

export default async function ExtensionAuthPage({ searchParams }: PageProps) {
  const { ext_id: extId, req: requestId } = await searchParams

  if (!extId || !EXTENSION_ID.test(extId) || !requestId || !REQUEST_ID.test(requestId)) {
    return (
      <main className="mx-auto max-w-md p-8 text-center">
        <h1 className="text-xl font-semibold">Invalid extension request</h1>
        <p className="mt-2 text-sm text-gray-600">
          This page can only be opened by the Rezoomed Chrome extension.
        </p>
      </main>
    )
  }

  const context = await getOptionalAuthenticatedUserContext()
  if (!context) {
    const next = `/extension-auth?ext_id=${extId}&req=${requestId}`
    redirect(`/auth/login?next=${encodeURIComponent(next)}`)
  }

  return <HandshakeClient extId={extId} requestId={requestId} />
}

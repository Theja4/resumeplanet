import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <h1 className="text-4xl font-bold tracking-tight text-gray-900">
        Resum<span className="text-indigo-600">AI</span>
      </h1>
      <p className="mt-3 text-gray-400 text-sm">
        Landing page coming in Session 6.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
      >
        Go to app →
      </Link>
    </main>
  )
}

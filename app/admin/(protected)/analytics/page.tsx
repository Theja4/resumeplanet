import { AlertCircle, BrainCircuit, FileStack, Sparkles, Wand2 } from 'lucide-react'
import { DashboardPageIntro, DashboardSurface } from '@/components/layout/DashboardSurface'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export const dynamic = 'force-dynamic'

type ParseSource = 'marker' | 'fast' | 'client' | 'repair'

type ResumeParseRow = {
  created_at: string
  parse_selected_source: ParseSource | null
  parse_selected_score: number | null
  parse_fast_score: number | null
  parse_client_score: number | null
  parse_repair_score: number | null
  parse_repair_attempted: boolean | null
  parse_source_text_length: number | null
}

type DailyBucket = {
  dateKey: string
  label: string
  total: number
  marker: number
  fast: number
  client: number
  repair: number
  repairAttempted: number
}

function startOfDay(daysAgo: number) {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() - daysAgo)
  return date
}

function formatPct(value: number, total: number) {
  if (!total) return '0%'
  return `${Math.round((value / total) * 100)}%`
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value)
}

function buildDailyBuckets(rows: ResumeParseRow[], days: number) {
  const buckets: DailyBucket[] = []
  const lookup = new Map<string, DailyBucket>()

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = startOfDay(offset)
    const dateKey = date.toISOString().slice(0, 10)
    const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const bucket: DailyBucket = {
      dateKey,
      label,
      total: 0,
      marker: 0,
      fast: 0,
      client: 0,
      repair: 0,
      repairAttempted: 0,
    }
    buckets.push(bucket)
    lookup.set(dateKey, bucket)
  }

  for (const row of rows) {
    const dateKey = row.created_at.slice(0, 10)
    const bucket = lookup.get(dateKey)
    if (!bucket) continue

    bucket.total += 1
    if (row.parse_repair_attempted) bucket.repairAttempted += 1

    if (row.parse_selected_source === 'marker') bucket.marker += 1
    if (row.parse_selected_source === 'fast') bucket.fast += 1
    if (row.parse_selected_source === 'client') bucket.client += 1
    if (row.parse_selected_source === 'repair') bucket.repair += 1
  }

  return buckets
}

function StatCard({
  label,
  value,
  helper,
  icon: Icon,
}: {
  label: string
  value: string
  helper: string
  icon: typeof FileStack
}) {
  return (
    <DashboardSurface variant="subtle" className="px-5 py-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">{label}</p>
          <p className="mt-3 text-2xl font-black tracking-tight text-zinc-900">{value}</p>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">{helper}</p>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] bg-primary-container/60 text-on-primary-container">
          <Icon size={20} />
        </div>
      </div>
    </DashboardSurface>
  )
}

function SourcePill({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-black/5 bg-white/70 px-4 py-3">
      <p className="text-sm font-semibold text-zinc-700">{label}</p>
      <span className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-[0.16em] ${tone}`}>{value}</span>
    </div>
  )
}

export default async function AdminAnalyticsPage() {
  const supabase = createServiceRoleClient()
  const since30 = startOfDay(29).toISOString()

  const [totalResult] = await Promise.all([
    supabase
      .from('resumes')
      .select('id', { count: 'exact', head: true }),
  ])

  if (totalResult.error) {
    throw new Error(`Failed to load total resume count: ${totalResult.error.message}`)
  }

  const analyticsRowsResult = await supabase
    .from('resumes')
    .select('created_at, parse_selected_source, parse_selected_score, parse_fast_score, parse_client_score, parse_repair_score, parse_repair_attempted, parse_source_text_length')
    .gte('created_at', since30)
    .order('created_at', { ascending: true })

  let rows: ResumeParseRow[]

  if (analyticsRowsResult.error) {
    const fallbackResult = await supabase
      .from('resumes')
      .select('created_at')
      .gte('created_at', since30)
      .order('created_at', { ascending: true })

    if (fallbackResult.error) {
      throw new Error(`Failed to load parser analytics: ${fallbackResult.error.message}`)
    }

    rows = (fallbackResult.data ?? []).map(row => ({
      created_at: row.created_at,
      parse_selected_source: null,
      parse_selected_score: null,
      parse_fast_score: null,
      parse_client_score: null,
      parse_repair_score: null,
      parse_repair_attempted: null,
      parse_source_text_length: null,
    }))
  } else {
    rows = (analyticsRowsResult.data ?? []) as ResumeParseRow[]
  }
  const instrumentedRows = rows.filter(row => row.parse_selected_source)
  const totalLast30 = rows.length
  const instrumentedLast30 = instrumentedRows.length
  const markerSelected = instrumentedRows.filter(row => row.parse_selected_source === 'marker').length
  const fastSelected = instrumentedRows.filter(row => row.parse_selected_source === 'fast').length
  const clientSelected = instrumentedRows.filter(row => row.parse_selected_source === 'client').length
  const repairSelected = instrumentedRows.filter(row => row.parse_selected_source === 'repair').length
  const repairAttempted = instrumentedRows.filter(row => row.parse_repair_attempted).length
  const avgSelectedScore = instrumentedRows.length
    ? Math.round(
        instrumentedRows.reduce((sum, row) => sum + (row.parse_selected_score ?? 0), 0) / instrumentedRows.length
      )
    : 0

  const dailyBuckets = buildDailyBuckets(rows, 14)
  const chartMax = Math.max(...dailyBuckets.map(bucket => bucket.total), 1)
  const instrumentedCoverage = formatPct(instrumentedLast30, totalLast30)

  return (
    <div className="space-y-6">
      <DashboardPageIntro
        kicker="Analytics"
        title="Resume parse funnel"
        description="Track how often uploads stay on the fast parser versus escalating to AI repair, and watch how parser quality trends over time."
        aside={
          <div className="space-y-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Coverage</p>
              <p className="mt-2 text-2xl font-black tracking-tight text-zinc-900">{instrumentedCoverage}</p>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                {formatNumber(instrumentedLast30)} of {formatNumber(totalLast30)} uploads in the last 30 days carry parse telemetry.
              </p>
            </div>
            {instrumentedLast30 < totalLast30 ? (
              <div className="rounded-2xl border border-amber-200/70 bg-amber-50/90 px-4 py-3 text-sm text-amber-800">
                Older resume rows predate instrumentation. Rates below describe newly instrumented uploads only.
              </div>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-4 xl:grid-cols-4">
        <StatCard
          label="Uploads 30d"
          value={formatNumber(totalLast30)}
          helper="All resume uploads created in the last 30 days."
          icon={FileStack}
        />
        <StatCard
          label="AI Attempt Rate"
          value={formatPct(repairAttempted, instrumentedLast30)}
          helper={`${formatNumber(repairAttempted)} uploads triggered repair parsing after confidence checks.`}
          icon={Wand2}
        />
        <StatCard
          label="AI Selected Rate"
          value={formatPct(repairSelected, instrumentedLast30)}
          helper={`${formatNumber(repairSelected)} uploads ended up using the repair parser output.`}
          icon={BrainCircuit}
        />
        <StatCard
          label="Avg Selected Score"
          value={instrumentedLast30 ? `${avgSelectedScore}/100` : '0/100'}
          helper="Average confidence score of the parser candidate that actually got saved."
          icon={Sparkles}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.7fr)]">
        <DashboardSurface variant="default" className="px-6 py-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Last 14 Days</p>
              <h2 className="mt-3 text-2xl font-black tracking-tight text-zinc-900">Daily parse source mix</h2>
              <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                Each bar shows daily upload volume, stacked by the parser source that ultimately won.
              </p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-14 items-end gap-3">
            {dailyBuckets.map(bucket => {
              const markerHeight = (bucket.marker / chartMax) * 100
              const fastHeight = (bucket.fast / chartMax) * 100
              const clientHeight = (bucket.client / chartMax) * 100
              const repairHeight = (bucket.repair / chartMax) * 100

              return (
                <div key={bucket.dateKey} className="flex flex-col items-center gap-2">
                  <div className="flex h-56 w-full max-w-[3rem] items-end">
                    <div className="flex h-full w-full flex-col justify-end overflow-hidden rounded-[1.2rem] border border-black/5 bg-zinc-100/80">
                      {repairHeight > 0 ? <div className="bg-zinc-900" style={{ height: `${Math.max(repairHeight, 6)}%` }} /> : null}
                      {clientHeight > 0 ? <div className="bg-emerald-300" style={{ height: `${Math.max(clientHeight, 6)}%` }} /> : null}
                      {fastHeight > 0 ? <div className="bg-emerald-600" style={{ height: `${Math.max(fastHeight, 6)}%` }} /> : null}
                      {markerHeight > 0 ? <div className="bg-sky-400" style={{ height: `${Math.max(markerHeight, 6)}%` }} /> : null}
                    </div>
                  </div>
                  <div className="space-y-1 text-center">
                    <p className="text-xs font-bold text-zinc-900">{bucket.total}</p>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">{bucket.label}</p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-6 flex flex-wrap gap-3 text-xs font-semibold text-zinc-600">
            <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-sky-400" /> Marker</span>
            <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-600" /> Fast parser</span>
            <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-300" /> Client parser</span>
            <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-zinc-900" /> AI repair</span>
          </div>
        </DashboardSurface>

        <DashboardSurface variant="subtle" className="px-5 py-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Selection Mix</p>
          <div className="mt-4 space-y-3">
            <SourcePill label="Marker-selected" value={`${formatNumber(markerSelected)} · ${formatPct(markerSelected, instrumentedLast30)}`} tone="bg-sky-100 text-sky-700" />
            <SourcePill label="Fast-selected" value={`${formatNumber(fastSelected)} · ${formatPct(fastSelected, instrumentedLast30)}`} tone="bg-emerald-100 text-emerald-700" />
            <SourcePill label="Client-selected" value={`${formatNumber(clientSelected)} · ${formatPct(clientSelected, instrumentedLast30)}`} tone="bg-emerald-50 text-emerald-700" />
            <SourcePill label="Repair-selected" value={`${formatNumber(repairSelected)} · ${formatPct(repairSelected, instrumentedLast30)}`} tone="bg-zinc-900 text-white" />
          </div>

          <div className="mt-6 rounded-[1.4rem] border border-black/5 bg-white/70 px-4 py-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-amber-100 p-2 text-amber-700">
                <AlertCircle size={16} />
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-900">Repair trigger volume</p>
                <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                  AI repair was attempted on {formatNumber(repairAttempted)} out of {formatNumber(instrumentedLast30)} instrumented uploads in the last 30 days.
                </p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                  Attempt rate: {formatPct(repairAttempted, instrumentedLast30)}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-[1.4rem] border border-black/5 bg-white/70 px-4 py-4 text-sm leading-7 text-on-surface-variant">
            Total lifetime uploads: <span className="font-bold text-zinc-900">{formatNumber(totalResult.count ?? 0)}</span>
          </div>
        </DashboardSurface>
      </div>
    </div>
  )
}

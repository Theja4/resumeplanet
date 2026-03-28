export default function TemplateSkeleton() {
  return (
    <div className="w-[794px] min-h-[1000px] bg-white p-12 animate-pulse">
      {/* Header */}
      <div className="h-9 w-64 bg-gray-200 rounded mb-3" />
      <div className="flex gap-4 mb-8">
        <div className="h-4 w-36 bg-gray-100 rounded" />
        <div className="h-4 w-28 bg-gray-100 rounded" />
        <div className="h-4 w-32 bg-gray-100 rounded" />
      </div>

      {/* Summary */}
      <div className="h-3 w-24 bg-gray-200 rounded mb-3" />
      <div className="space-y-2 mb-8">
        <div className="h-3 w-full bg-gray-100 rounded" />
        <div className="h-3 w-5/6 bg-gray-100 rounded" />
      </div>

      {/* Experience heading */}
      <div className="h-3 w-28 bg-gray-200 rounded mb-4" />

      {/* Job 1 */}
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <div className="h-4 w-48 bg-gray-200 rounded" />
          <div className="h-3 w-28 bg-gray-100 rounded" />
        </div>
        <div className="h-3 w-36 bg-gray-100 rounded mb-3" />
        <div className="space-y-1.5 pl-4">
          <div className="h-3 w-full bg-gray-100 rounded" />
          <div className="h-3 w-5/6 bg-gray-100 rounded" />
          <div className="h-3 w-4/5 bg-gray-100 rounded" />
        </div>
      </div>

      {/* Job 2 */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          <div className="h-4 w-40 bg-gray-200 rounded" />
          <div className="h-3 w-28 bg-gray-100 rounded" />
        </div>
        <div className="h-3 w-32 bg-gray-100 rounded mb-3" />
        <div className="space-y-1.5 pl-4">
          <div className="h-3 w-full bg-gray-100 rounded" />
          <div className="h-3 w-4/6 bg-gray-100 rounded" />
        </div>
      </div>

      {/* Education */}
      <div className="h-3 w-24 bg-gray-200 rounded mb-4" />
      <div className="mb-2">
        <div className="h-4 w-52 bg-gray-200 rounded mb-2" />
        <div className="h-3 w-40 bg-gray-100 rounded" />
      </div>

      {/* Skills */}
      <div className="mt-8 h-3 w-16 bg-gray-200 rounded mb-3" />
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-6 w-16 bg-gray-100 rounded-full" />
        ))}
      </div>
    </div>
  )
}

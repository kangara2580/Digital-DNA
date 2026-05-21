import { SkeletonLine } from "@/components/PageSkeleton";

export default function AnalyticsLoading() {
  return (
    <div className="min-h-screen bg-slate-100 px-5 py-6 lg:px-8">
      <div className="mx-auto max-w-[1600px]">
        {/* Header skeleton */}
        <div className="mb-6 flex items-center gap-3">
          <div className="h-9 w-9 animate-pulse rounded-md bg-slate-200" />
          <div>
            <SkeletonLine width="w-48" height="h-6" />
            <SkeletonLine width="w-32" height="h-3" className="mt-2" />
          </div>
        </div>

        {/* Today summary cards */}
        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={`sum-${i}`}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <SkeletonLine width="w-20" height="h-3" />
              <SkeletonLine width="w-32" height="h-8" className="mt-3" />
              <SkeletonLine width="w-16" height="h-3" className="mt-2" />
            </div>
          ))}
        </div>

        {/* Chart area */}
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <SkeletonLine width="w-32" height="h-5" className="mb-4" />
          <div className="h-64 animate-pulse rounded-lg bg-slate-100" />
        </div>

        {/* Two-column grid */}
        <div className="grid gap-6 xl:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={`sec-${i}`}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <SkeletonLine width="w-28" height="h-5" className="mb-4" />
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, j) => (
                  <div key={`row-${j}`} className="flex justify-between">
                    <SkeletonLine width="w-40" height="h-3" />
                    <SkeletonLine width="w-16" height="h-3" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

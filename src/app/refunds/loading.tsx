import { SkeletonLine } from "@/components/PageSkeleton";

export default function RefundsLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <SkeletonLine width="w-32" height="h-7" className="mb-2" />
      <SkeletonLine width="w-64" height="h-4" className="mb-6" />

      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={`ref-sk-${i}`}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-4 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-100/70"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <SkeletonLine width="w-40" height="h-4" />
                <SkeletonLine width="w-24" height="h-3" />
              </div>
              <SkeletonLine width="w-20" height="h-8" className="rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

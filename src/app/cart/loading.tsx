import { SkeletonLine, SkeletonPageHeader } from "@/components/PageSkeleton";

export default function CartLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <SkeletonPageHeader />

      {/* Cart items */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={`cart-${i}`}
            className="flex gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-100/70"
          >
            <div className="h-24 w-16 animate-pulse rounded-lg bg-zinc-800/70 [html[data-theme='light']_&]:bg-zinc-200" />
            <div className="flex-1 space-y-2">
              <SkeletonLine width="w-48" height="h-4" />
              <SkeletonLine width="w-24" height="h-3" />
              <SkeletonLine width="w-16" height="h-5" />
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-8 rounded-xl border border-white/10 bg-white/[0.03] p-6 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-100/70">
        <div className="space-y-3">
          <div className="flex justify-between">
            <SkeletonLine width="w-20" height="h-4" />
            <SkeletonLine width="w-24" height="h-4" />
          </div>
          <div className="flex justify-between">
            <SkeletonLine width="w-16" height="h-5" />
            <SkeletonLine width="w-28" height="h-5" />
          </div>
        </div>
        <div className="mt-4 h-12 w-full animate-pulse rounded-lg bg-zinc-800/70 [html[data-theme='light']_&]:bg-zinc-200" />
      </div>
    </div>
  );
}

import { SkeletonLine, SkeletonVideoGrid } from "@/components/PageSkeleton";

export default function VideoDetailLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Video player */}
        <div className="flex-1">
          <div className="aspect-[9/16] max-h-[70vh] w-full animate-pulse rounded-2xl bg-zinc-800/70 [html[data-theme='light']_&]:bg-zinc-200" />
        </div>

        {/* Info panel */}
        <div className="w-full space-y-4 lg:w-80">
          <SkeletonLine width="w-full" height="h-6" />
          <SkeletonLine width="w-3/4" height="h-4" />

          {/* Creator */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 animate-pulse rounded-full bg-zinc-800/70 [html[data-theme='light']_&]:bg-zinc-200" />
            <div className="space-y-1">
              <SkeletonLine width="w-24" height="h-4" />
              <SkeletonLine width="w-16" height="h-3" />
            </div>
          </div>

          {/* Price & CTA */}
          <div className="space-y-3 pt-4">
            <SkeletonLine width="w-28" height="h-8" />
            <div className="h-12 w-full animate-pulse rounded-lg bg-zinc-800/70 [html[data-theme='light']_&]:bg-zinc-200" />
          </div>

          {/* Stats */}
          <div className="flex gap-6 pt-4">
            <SkeletonLine width="w-16" height="h-4" />
            <SkeletonLine width="w-16" height="h-4" />
            <SkeletonLine width="w-16" height="h-4" />
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="mt-12">
        <SkeletonLine width="w-40" height="h-6" className="mb-4" />
        <SkeletonVideoGrid count={5} cols="grid-cols-2 sm:grid-cols-3 lg:grid-cols-5" />
      </div>
    </div>
  );
}

import { SkeletonLine, SkeletonVideoGrid } from "@/components/PageSkeleton";

export default function SearchLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Search bar skeleton */}
      <div className="mb-8">
        <div className="mx-auto h-12 max-w-xl animate-pulse rounded-full bg-zinc-800/70 [html[data-theme='light']_&]:bg-zinc-200" />
      </div>

      {/* Filter chips */}
      <div className="mb-6 flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonLine key={`chip-${i}`} width="w-16" height="h-7" className="rounded-full" />
        ))}
      </div>

      {/* Results grid */}
      <SkeletonVideoGrid count={12} />
    </div>
  );
}

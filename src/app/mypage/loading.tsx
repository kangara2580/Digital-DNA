import {
  SkeletonLine,
  SkeletonPageHeader,
  SkeletonVideoGrid,
} from "@/components/PageSkeleton";

export default function MyPageLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <SkeletonPageHeader />

      {/* Stats cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={`stat-${i}`}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-4 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-100/70"
          >
            <SkeletonLine width="w-16" height="h-3" className="mb-2" />
            <SkeletonLine width="w-24" height="h-6" />
          </div>
        ))}
      </div>

      {/* Video grid */}
      <SkeletonVideoGrid count={8} cols="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" />
    </div>
  );
}

/**
 * Reusable skeleton primitives for loading.tsx pages.
 * Dark/light theme aware via Tailwind data-theme selectors.
 */

export function SkeletonLine({
  width = "w-full",
  height = "h-3",
  className = "",
}: {
  width?: string;
  height?: string;
  className?: string;
}) {
  return (
    <div
      className={`${width} ${height} animate-pulse rounded bg-zinc-800/70 [html[data-theme='light']_&]:bg-zinc-300 ${className}`}
    />
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-100/70 ${className}`}
    >
      <div className="aspect-[9/16] animate-pulse bg-zinc-800/70 [html[data-theme='light']_&]:bg-zinc-200" />
      <div className="space-y-2 px-3 py-3">
        <SkeletonLine width="w-3/4" />
        <SkeletonLine width="w-1/2" />
      </div>
    </div>
  );
}

export function SkeletonVideoGrid({
  count = 10,
  cols = "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
}: {
  count?: number;
  cols?: string;
}) {
  return (
    <div
      className={`grid ${cols} gap-3`}
      role="status"
      aria-live="polite"
      aria-label="Loading..."
    >
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={`sk-card-${i}`} />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3" role="status" aria-live="polite" aria-label="Loading...">
      {/* Header */}
      <div className="flex gap-4 border-b border-white/10 pb-3 [html[data-theme='light']_&]:border-zinc-200">
        {[...Array(4)].map((_, i) => (
          <SkeletonLine key={`th-${i}`} width="w-24" height="h-4" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={`tr-${r}`} className="flex gap-4 py-2">
          {[...Array(4)].map((_, c) => (
            <SkeletonLine
              key={`td-${r}-${c}`}
              width={c === 0 ? "w-32" : "w-20"}
              height="h-3"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonPageHeader() {
  return (
    <div className="mb-6 space-y-3">
      <SkeletonLine width="w-48" height="h-7" />
      <SkeletonLine width="w-72" height="h-4" />
    </div>
  );
}

export function SkeletonSidebar() {
  return (
    <div className="space-y-4 pr-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonLine key={`nav-${i}`} width="w-32" height="h-4" />
      ))}
    </div>
  );
}

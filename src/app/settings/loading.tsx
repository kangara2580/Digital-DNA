import { SkeletonLine, SkeletonPageHeader } from "@/components/PageSkeleton";

export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <SkeletonPageHeader />

      {/* Tab bar */}
      <div className="mb-8 flex gap-4 border-b border-white/10 pb-3 [html[data-theme='light']_&]:border-zinc-200">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonLine key={`tab-${i}`} width="w-20" height="h-4" />
        ))}
      </div>

      {/* Form fields */}
      <div className="space-y-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={`field-${i}`} className="space-y-2">
            <SkeletonLine width="w-24" height="h-3" />
            <div className="h-10 w-full animate-pulse rounded-lg bg-zinc-800/70 [html[data-theme='light']_&]:bg-zinc-200" />
          </div>
        ))}
      </div>
    </div>
  );
}

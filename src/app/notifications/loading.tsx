import { SkeletonLine } from "@/components/PageSkeleton";

export default function NotificationsLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <SkeletonLine width="w-24" height="h-7" className="mb-6" />
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={`notif-sk-${i}`}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-4 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-100/70"
          >
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 animate-pulse rounded-full bg-zinc-800/70 [html[data-theme='light']_&]:bg-zinc-200" />
              <div className="flex-1 space-y-2">
                <SkeletonLine width="w-48" height="h-4" />
                <SkeletonLine width="w-full" height="h-3" />
                <SkeletonLine width="w-24" height="h-3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

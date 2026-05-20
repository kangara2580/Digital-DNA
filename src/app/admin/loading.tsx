import { SkeletonPageHeader, SkeletonTable, SkeletonSidebar } from "@/components/PageSkeleton";

export default function AdminLoading() {
  return (
    <div className="flex min-h-screen gap-6 p-6">
      <SkeletonSidebar />
      <div className="flex-1">
        <SkeletonPageHeader />
        <SkeletonTable rows={8} />
      </div>
    </div>
  );
}

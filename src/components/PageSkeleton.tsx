import { GlobalLoading, PageLoadingShell } from "@/components/GlobalLoading";

/**
 * @deprecated Gray skeleton primitives — use GlobalLoading / PageLoadingShell instead.
 * Kept as thin wrappers so existing imports keep working.
 */

export function SkeletonLine({ className = "" }: { width?: string; height?: string; className?: string }) {
  return <GlobalLoading size="sm" className={`py-2 ${className}`} />;
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return <GlobalLoading size="md" className={`py-8 ${className}`} />;
}

export function SkeletonVideoGrid({
  className = "",
}: {
  count?: number;
  cols?: string;
  className?: string;
}) {
  return <GlobalLoading size="lg" className={`w-full py-12 ${className}`} />;
}

export function SkeletonTable({ className = "" }: { rows?: number; className?: string }) {
  return <GlobalLoading size="lg" className={`w-full py-12 ${className}`} />;
}

export function SkeletonPageHeader({ className = "" }: { className?: string }) {
  return <GlobalLoading size="md" className={className} />;
}

export function SkeletonSidebar({ className = "" }: { className?: string }) {
  return <GlobalLoading size="md" className={className} />;
}

export { PageLoadingShell };

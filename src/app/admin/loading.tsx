import { PageLoadingShell } from "@/components/GlobalLoading";

export default function AdminLoading() {
  return (
    <div className="mx-auto flex max-w-6xl gap-8 px-4 py-8">
      <PageLoadingShell className="w-full" />
    </div>
  );
}

import Link from "next/link";
import { GenerationResultView } from "@/components/GenerationResultView";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "생성 결과 — ARA",
  description: "AI 맞춤 리스킨 생성이 완료된 영상을 확인합니다.",
};

export default async function GenerationResultPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  const decoded = decodeURIComponent(jobId);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6 lg:px-8">
        <nav className="mb-8 flex flex-wrap items-center gap-2 font-mono text-[11px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
          <Link href="/" className="text-reels-cyan/90 hover:text-reels-cyan">
            홈
          </Link>
          <span className="text-zinc-700 [html[data-theme='light']_&]:text-zinc-500">/</span>
          <span className="text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
            생성 결과
          </span>
        </nav>
        <GenerationResultView jobId={decoded} />
      </div>
    </div>
  );
}

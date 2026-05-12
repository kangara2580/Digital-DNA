import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PurchaseCompleteClient } from "@/components/purchase/PurchaseCompleteClient";
import { getMarketVideoById } from "@/data/videoCommerce";
import { prisma } from "@/lib/prisma";
import { hasPaidPurchase } from "@/lib/purchases";
import { getCurrentUser } from "@/lib/serverSession";
import { getSiteMetadataBase } from "@/lib/siteMetadataBase";

export const dynamic = "force-dynamic";

export default async function PurchaseCompletePage({
  params,
}: {
  params: Promise<{ videoId: string }>;
}) {
  const { videoId: raw } = await params;
  let videoId = raw;
  try {
    videoId = decodeURIComponent(raw);
  } catch {
    notFound();
  }

  const user = await getCurrentUser();
  if (!user) {
    redirect(
      `/login?redirect=${encodeURIComponent(`/purchase/complete/${encodeURIComponent(videoId)}`)}`,
    );
  }

  const paid = await hasPaidPurchase({ userId: user.id, videoId });
  if (!paid) {
    notFound();
  }

  const row = await prisma.video.findUnique({
    where: { id: videoId },
    select: { title: true, src: true, processedVideoUrl: true },
  });
  const feed = getMarketVideoById(videoId);
  const title = row?.title?.trim() || feed?.title || `영상 ${videoId}`;
  const downloadUrl =
    (row?.processedVideoUrl && row.processedVideoUrl.trim()) ||
    row?.src?.trim() ||
    (feed?.processedVideoUrl && feed.processedVideoUrl.trim()) ||
    feed?.src?.trim() ||
    "";

  if (!downloadUrl) {
    notFound();
  }

  const base = getSiteMetadataBase();
  const sharePageUrl = new URL(`/video/${encodeURIComponent(videoId)}`, base).toString();

  return (
    <main className="min-h-[70vh] bg-zinc-950 px-4 py-14 text-zinc-100 [html[data-theme='light']_&]:bg-zinc-50 [html[data-theme='light']_&]:text-zinc-900">
      <div className="mx-auto max-w-lg rounded-2xl border border-white/10 bg-zinc-900/50 p-8 shadow-xl [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[color:var(--reels-point)]">
          구매 완료
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">결제가 완료되었습니다</h1>
        <p className="mt-3 text-[14px] leading-relaxed text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
          아래에서 원본 영상을 내려받거나, 상세 페이지로 이동해 공유할 수 있어요. 구매 내역은 마이페이지에 반영되어 있습니다.
        </p>
        <p className="mt-4 line-clamp-3 text-[15px] font-semibold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
          {title}
        </p>
        <PurchaseCompleteClient title={title} downloadUrl={downloadUrl} sharePageUrl={sharePageUrl} />
        <div className="mt-10 flex flex-wrap justify-center gap-4 border-t border-white/10 pt-8 text-[13px] [html[data-theme='light']_&]:border-zinc-200">
          <Link href="/mypage?tab=purchases" className="font-semibold text-[color:var(--reels-point)] hover:underline">
            구매 내역 보기
          </Link>
          <Link href={`/video/${encodeURIComponent(videoId)}`} className="text-zinc-400 hover:text-zinc-200">
            영상 상세로
          </Link>
          <Link href="/" className="text-zinc-400 hover:text-zinc-200">
            홈
          </Link>
        </div>
      </div>
    </main>
  );
}

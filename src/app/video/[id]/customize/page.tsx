import Link from "next/link";
import { notFound } from "next/navigation";
import { buildPageMetadata } from "@/lib/i18n/buildPageMetadata";
import { PurchaseCustomizeStudio } from "@/components/PurchaseCustomizeStudio";
import { ALL_MARKET_VIDEO_IDS, getMarketVideoById } from "@/data/videoCommerce";

export function generateStaticParams() {
  return ALL_MARKET_VIDEO_IDS.map((id) => ({ id }));
}

export async function generateMetadata() {
  return buildPageMetadata({
    titleKey: "meta.customize",
    descriptionKey: "meta.customizeDescription",
  });
}

export default async function VideoCustomizePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const video = getMarketVideoById(id);
  if (!video) notFound();

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto max-w-[1100px] py-8 pl-4 sm:pl-6 lg:pl-8 reels-pr-safe-fixed">
        <nav className="mb-6 flex flex-wrap items-center gap-2 font-mono text-[11px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
          <Link href="/" className="text-reels-cyan/90 hover:text-reels-cyan">
            홈
          </Link>
          <span className="text-zinc-700 [html[data-theme='light']_&]:text-zinc-500">/</span>
          <Link href={`/video/${video.id}`} className="text-reels-cyan/90 hover:text-reels-cyan">
            동영상 상세
          </Link>
          <span className="text-zinc-700 [html[data-theme='light']_&]:text-zinc-500">/</span>
          <span className="text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">맞춤 리스킨</span>
        </nav>
        <PurchaseCustomizeStudio video={video} />
      </div>
    </div>
  );
}

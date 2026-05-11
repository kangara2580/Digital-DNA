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
    <main className="min-h-[60vh] bg-zinc-950 text-zinc-100 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-900">
      <div className="mx-auto max-w-[1500px] px-4 py-10 sm:px-6 sm:py-12 lg:px-10 reels-pr-safe-fixed">
        <nav
          aria-label="breadcrumb"
          className="mb-8 flex flex-wrap items-center gap-2 border-b border-white/10 pb-6 text-[13px] font-medium text-zinc-500 [html[data-theme='light']_&]:border-zinc-100 [html[data-theme='light']_&]:text-zinc-600"
        >
          <Link href="/" className="text-zinc-400 transition-colors hover:text-zinc-100 [html[data-theme='light']_&]:text-zinc-600 [html[data-theme='light']_&]:hover:text-zinc-900">
            홈
          </Link>
          <span className="text-zinc-600 [html[data-theme='light']_&]:text-zinc-400">/</span>
          <Link
            href={`/video/${video.id}`}
            className="text-zinc-400 transition-colors hover:text-zinc-100 [html[data-theme='light']_&]:text-zinc-600 [html[data-theme='light']_&]:hover:text-zinc-900"
          >
            동영상 상세
          </Link>
          <span className="text-zinc-600 [html[data-theme='light']_&]:text-zinc-400">/</span>
          <span className="text-zinc-300 [html[data-theme='light']_&]:text-zinc-800">맞춤 리스킨</span>
        </nav>
        <PurchaseCustomizeStudio video={video} />
      </div>
    </main>
  );
}

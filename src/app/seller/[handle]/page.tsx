import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { VideoCard } from "@/components/VideoCard";
import {
  ALL_MARKET_VIDEOS,
  getCreatorBySellerHandle,
  getSellerNickname,
  getVideosBySellerHandle,
  normalizeSellerHandle,
} from "@/data/videoCatalog";
import { buildNotionistsAvatarUrl } from "@/data/reelsAvatarPresets";

export const dynamic = "force-static";

export function generateStaticParams() {
  const handles = new Set<string>();
  for (const video of ALL_MARKET_VIDEOS) {
    handles.add(normalizeSellerHandle(video.creator));
  }
  return Array.from(handles).map((handle) => ({ handle }));
}

export default async function SellerPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const normalized = normalizeSellerHandle(handle);
  const videos = getVideosBySellerHandle(normalized);
  if (videos.length === 0) notFound();

  const creator = getCreatorBySellerHandle(normalized) ?? `@${normalized}`;
  const nickname = getSellerNickname(creator);

  return (
    <div className="min-h-screen bg-transparent text-zinc-100 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-900">
      <div className="mx-auto max-w-[1800px] px-4 py-8 sm:px-6 lg:px-8">
        <nav className="mb-6 font-mono text-[11px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
          <Link href="/" className="text-reels-cyan/90 hover:text-reels-cyan">
            홈
          </Link>
          <span className="mx-1.5 text-zinc-700 [html[data-theme='light']_&]:text-zinc-500">/</span>
          <span className="text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">판매자</span>
        </nav>

        <section className="reels-glass-card rounded-2xl border border-white/10 bg-white/[0.04] p-4 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-100/80 sm:p-5">
          <div className="flex items-center gap-3 sm:gap-4">
            <Image
              src={buildNotionistsAvatarUrl(nickname)}
              width={56}
              height={56}
              alt=""
              unoptimized
              className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-white/10 [html[data-theme='light']_&]:ring-zinc-200"
            />
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-extrabold tracking-tight text-zinc-100 [html[data-theme='light']_&]:text-zinc-900 sm:text-3xl">
                {nickname}
              </h1>
              <p className="mt-1 text-[12px] font-medium text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
                현재 판매 중인 영상 {videos.length}개
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-reels-cyan/90 [html[data-theme='light']_&]:text-reels-cyan">
            Seller Clips
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {videos.map((video) => (
              <VideoCard
                key={`seller-${normalized}-${video.id}`}
                video={video}
                reelLayout
                dense
                disableHoverScale
                className="min-w-0"
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

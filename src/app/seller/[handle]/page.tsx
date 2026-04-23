import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SellerFeedBioEditor } from "@/components/SellerFeedBioEditor";
import { VideoCard } from "@/components/VideoCard";
import type { FeedVideo } from "@/data/videos";
import {
  getSellerNickname,
  getVideosBySellerHandle,
  normalizeSellerHandle,
} from "@/data/videoCatalog";
import { buildNotionistsAvatarUrl } from "@/data/reelsAvatarPresets";
import { ensureProfileSellerBioColumn } from "@/lib/ensureProfileSellerBioColumn";
import { videoRowToFeedVideo } from "@/lib/flashSaleVideos";
import { prisma } from "@/lib/prisma";
import { getSupabaseServiceRoleClient } from "@/lib/supabaseServiceRole";
import { supabaseTables } from "@/lib/supabaseTableNames";

export const dynamic = "force-dynamic";

export default async function SellerPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  let sellerKey = handle.trim();
  try {
    sellerKey = decodeURIComponent(handle).trim();
  } catch {
    sellerKey = handle.trim();
  }
  if (!sellerKey) notFound();

  let profileNickname: string | null = null;
  let profileBio: string | null = null;
  try {
    await ensureProfileSellerBioColumn();
    const admin = getSupabaseServiceRoleClient();
    if (admin) {
      const { data } = await admin
        .from(supabaseTables.profiles)
        .select("nickname,seller_bio")
        .eq("user_id", sellerKey)
        .maybeSingle();
      const row = (data ?? null) as { nickname?: string | null; seller_bio?: string | null } | null;
      profileNickname = row?.nickname?.trim() || null;
      profileBio = row?.seller_bio?.trim() || null;
    }
  } catch {
    profileNickname = null;
    profileBio = null;
  }

  let videos: FeedVideo[] = [];
  try {
    const rows = await prisma.video.findMany({
      where: { sellerId: sellerKey },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    videos = rows.map(videoRowToFeedVideo);
  } catch {
    videos = [];
  }

  const isDbSeller = videos.length > 0;
  if (!isDbSeller) {
    const normalized = normalizeSellerHandle(sellerKey);
    videos = getVideosBySellerHandle(normalized);
  }
  const hasProfileOnly = Boolean(profileNickname || profileBio);
  if (videos.length === 0 && !hasProfileOnly) notFound();

  const nickname = profileNickname || (videos[0] ? getSellerNickname(videos[0].creator) : sellerKey.slice(0, 8));

  return (
    <div className="min-h-screen bg-transparent text-zinc-100 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-900">
      <div className="mx-auto max-w-[1800px] px-4 py-8 sm:px-6 lg:px-8">
        <nav className="mb-6 font-mono text-[11px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
          <Link href="/" className="text-reels-cyan/90 hover:text-reels-cyan">
            홈
          </Link>
          <span className="mx-1.5 text-zinc-700 [html[data-theme='light']_&]:text-zinc-500">/</span>
          <span className="text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">{nickname}</span>
        </nav>

        <section className="reels-glass-card rounded-2xl border border-white/10 bg-white/[0.04] p-4 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-100/80 sm:p-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,34rem)] lg:items-center">
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
                  현재 판매 중인 영상 {videos.length}개{isDbSeller ? " · 실데이터" : ""}
                </p>
              </div>
            </div>
            <SellerFeedBioEditor sellerId={sellerKey} initialBio={profileBio} />
          </div>
        </section>

        <section className="mt-8">
          <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-reels-cyan/90 [html[data-theme='light']_&]:text-reels-cyan">
            Seller Clips
          </h2>
          {videos.length > 0 ? (
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {videos.map((video) => (
                <VideoCard
                  key={`seller-${sellerKey}-${video.id}`}
                  video={video}
                  reelLayout
                  dense
                  disableHoverScale
                  className="min-w-0"
                />
              ))}
            </div>
          ) : (
            <div className="mt-3 rounded-xl border border-white/10 bg-black/20 px-4 py-5 text-sm text-zinc-400 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50 [html[data-theme='light']_&]:text-zinc-600">
              아직 등록된 판매 영상이 없습니다.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

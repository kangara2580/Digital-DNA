import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SellerFeedBioEditor } from "@/components/SellerFeedBioEditor";
import {
  SellerFeedClipsHeading,
  SellerFeedEmptyListings,
  SellerFeedListingCount,
} from "@/components/SellerFeedI18n";
import { SellerFeedSellCta } from "@/components/SellerFeedSellCta";
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
import { translate } from "@/lib/i18n/dictionaries";
import { socialMetadataFields } from "@/lib/i18n/socialMetadata";
import { getSiteLocale } from "@/lib/i18n/serverLocale";
import { resolveSellerDisplayNameForSeo } from "@/lib/seo/sellerSeo";

/** Supabase `auth.users` id style; used so “내 피드” (`/seller/{userId}`) never 404s when there are no listings yet. */
function isProbablySellerUserId(key: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key);
}

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  let sellerKey = handle.trim();
  try {
    sellerKey = decodeURIComponent(handle).trim();
  } catch {
    sellerKey = handle.trim();
  }
  const name = await resolveSellerDisplayNameForSeo(sellerKey);
  const locale = await getSiteLocale();
  const title = translate(locale, "meta.sellerTitle", { name });
  const description = translate(locale, "meta.sellerDescription", { name });
  return {
    title,
    description,
    ...socialMetadataFields(locale, title, description),
  };
}

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
  const allowEmptyOwnSellerPage = isProbablySellerUserId(sellerKey);
  if (videos.length === 0 && !hasProfileOnly && !allowEmptyOwnSellerPage) notFound();

  const nickname = profileNickname || (videos[0] ? getSellerNickname(videos[0].creator) : sellerKey.slice(0, 8));

  return (
    <div className="min-h-screen bg-transparent text-white [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-900">
      <div className="mx-auto max-w-[1800px] px-4 pb-14 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        <SellerFeedSellCta sellerId={sellerKey} />
        <section className="relative overflow-hidden rounded-[1.35rem] border border-white/[0.09] bg-gradient-to-br from-white/[0.065] via-white/[0.02] to-transparent p-5 shadow-[0_0_0_1px_rgba(228,41,128,0.06),inset_0_1px_0_0_rgba(255,255,255,0.06)] backdrop-blur-xl sm:rounded-[1.65rem] sm:p-7 [html[data-theme='light']_&]:border-zinc-200/70 [html[data-theme='light']_&]:from-white [html[data-theme='light']_&]:via-white [html[data-theme='light']_&]:to-zinc-50/90 [html[data-theme='light']_&]:shadow-[0_20px_50px_-28px_rgba(15,23,42,0.18),0_0_0_1px_rgba(228,41,128,0.07)]">
          <div
            className="pointer-events-none absolute -left-24 -top-24 h-48 w-48 rounded-full bg-[color:var(--reels-point)]/12 blur-[80px]"
            aria-hidden
          />
          <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,36rem)] lg:items-start lg:gap-8">
            <div className="flex min-w-0 gap-4 sm:items-center sm:gap-5">
              <div className="relative shrink-0">
                <div
                  className="absolute inset-0 rounded-full bg-[color:var(--reels-point)]/25 blur-lg [html[data-theme='light']_&]:bg-[color:var(--reels-point)]/15"
                  aria-hidden
                />
                <Image
                  src={buildNotionistsAvatarUrl(nickname)}
                  width={72}
                  height={72}
                  alt=""
                  unoptimized
                  className="relative h-[4.25rem] w-[4.25rem] rounded-full object-cover ring-2 ring-white/20 ring-offset-2 ring-offset-[#070a12] sm:h-[4.75rem] sm:w-[4.75rem] [html[data-theme='light']_&]:ring-zinc-200/80 [html[data-theme='light']_&]:ring-offset-white"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-2xl font-extrabold tracking-tight sm:text-[1.85rem] sm:leading-tight">
                  {nickname}
                </h1>
                <SellerFeedListingCount videoCount={videos.length} isDbSeller={isDbSeller} />
              </div>
            </div>
            <div className="min-w-0 border-t border-white/[0.08] pt-5 lg:border-t-0 lg:border-l lg:pl-8 lg:pt-0 [html[data-theme='light']_&]:border-zinc-200/75">
              <SellerFeedBioEditor sellerId={sellerKey} initialBio={profileBio} />
            </div>
          </div>
        </section>

        <section className="mt-10 sm:mt-12">
          <div className="mb-4 flex items-center gap-3">
            <span
              className="h-9 w-[3px] shrink-0 rounded-full bg-[color:var(--reels-point)] shadow-[0_0_14px_-2px_rgba(228,41,128,0.55)]"
              aria-hidden
            />
            <SellerFeedClipsHeading />
          </div>
          {videos.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-3.5 lg:grid-cols-5 xl:gap-4">
              {videos.map((video) => (
                <VideoCard
                  key={`seller-${sellerKey}-${video.id}`}
                  video={video}
                  reelLayout
                  dense
                  disableHoverScale
                  className="min-w-0"
                  detailHref={`/video/${encodeURIComponent(video.id)}?fromSeller=${encodeURIComponent(sellerKey)}`}
                />
              ))}
            </div>
          ) : (
            <SellerFeedEmptyListings />
          )}
        </section>
      </div>
    </div>
  );
}

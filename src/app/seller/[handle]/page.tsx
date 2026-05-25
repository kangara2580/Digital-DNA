import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  SellerFeedEmptyListings,
} from "@/components/SellerFeedI18n";
import { SellerFeedListingsGrid } from "@/components/SellerFeedListingsGrid";
import { SellerFeedProfileCard } from "@/components/SellerFeedProfileCard";
import { SellerFeedSellCta } from "@/components/SellerFeedSellCta";
import type { FeedVideo } from "@/data/videos";
import {
  getSellerNickname,
  getVideosBySellerHandle,
  normalizeSellerHandle,
} from "@/data/videoCatalog";
import { sellerProfileColorFromRecord } from "@/lib/sellerProfile";
import { loadSellerFeedProfile } from "@/lib/loadSellerFeedProfile";
import { isProbablySellerUserId } from "@/lib/sellerUserId";
import { videoRowToFeedVideo } from "@/lib/flashSaleVideos";
import { prisma } from "@/lib/prisma";
import type { TrendingRankMetrics } from "@/data/trendingStats";
import { listingMetricsPayloadForFeeds } from "@/lib/sellerListingCardMetrics";
import { socialMetadataFields } from "@/lib/i18n/socialMetadata";
import { translate } from "@/lib/i18n/dictionaries";
import { getSiteLocale } from "@/lib/i18n/serverLocale";
import { resolveSellerDisplayNameForSeo } from "@/lib/seo/sellerSeo";

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

  const feedProfile = await loadSellerFeedProfile(sellerKey);
  const profileNickname = feedProfile.nickname;
  const profileBio = feedProfile.sellerBio;
  const profileAvatarKind = feedProfile.avatarKind;
  const profileAvatarSeed = feedProfile.avatarSeed;
  const profileAvatarCustom = feedProfile.avatarCustom;
  const sellerSocialLinks = feedProfile.sellerSocialLinks;

  let videos: FeedVideo[] = [];
  try {
    const rows = await prisma.video.findMany({
      where: { sellerId: sellerKey },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    videos = rows.map((row) => ({
      ...videoRowToFeedVideo(row),
      sellerSocialLinks,
    }));
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

  let listingMetricsByVideoId: Record<string, TrendingRankMetrics> = {};
  if (isDbSeller && videos.length > 0) {
    listingMetricsByVideoId = await listingMetricsPayloadForFeeds(videos);
  }

  const nickname = profileNickname || (videos[0] ? getSellerNickname(videos[0].creator) : sellerKey.slice(0, 8));
  const profileColor = sellerProfileColorFromRecord(
    {
      user_id: sellerKey,
      avatar_kind: profileAvatarKind,
      avatar_seed: profileAvatarSeed,
    },
    sellerKey,
  );
  const profileUploadUrl =
    profileAvatarKind === "upload" && profileAvatarCustom ? profileAvatarCustom : null;

  return (
    <div className="min-h-screen bg-transparent text-white [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-900">
      <div className="mx-auto max-w-[1800px] px-4 pb-14 pt-[calc(var(--mobile-top-float-pad)+0.75rem)] sm:px-6 md:pt-14 lg:px-8 lg:pt-16">
        <SellerFeedSellCta sellerId={sellerKey} />
        <SellerFeedProfileCard
          sellerId={sellerKey}
          nickname={nickname}
          videoCount={videos.length}
          isDbSeller={isDbSeller}
          profileBio={profileBio}
          profileColor={profileColor}
          profileUploadUrl={profileUploadUrl}
          sellerSocialLinks={sellerSocialLinks}
          titleAs="h1"
        />

        <section className="mt-8 sm:mt-10">
          {videos.length > 0 ? (
            <SellerFeedListingsGrid
              sellerId={sellerKey}
              isDbSeller={isDbSeller}
              initialVideos={videos}
              initialMetricsByVideoId={listingMetricsByVideoId}
            />
          ) : (
            <SellerFeedEmptyListings />
          )}
        </section>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ShoppingCart } from "lucide-react";
import { SellerIdentityLink } from "@/components/SellerIdentityLink";
import { VideoDetailRecommendations } from "@/components/VideoDetailRecommendations";
import { VideoDetailReviewsSection } from "@/components/VideoDetailReviewsSection";
import { TrendingVideoStatsFooter } from "@/components/TrendingVideoStatsFooter";
import { getMetricsForVideoDetail } from "@/data/trendingStats";
import { useDopamineBasket } from "@/context/DopamineBasketContext";
import { usePurchasedVideos } from "@/context/PurchasedVideosContext";
import { useRecentClips } from "@/context/RecentClipsContext";
import { useAuthSession } from "@/hooks/useAuthSession";
import type { FeedVideo } from "@/data/videos";
import {
  clonesRemaining,
  getCommerceMeta,
  getFreshnessForVideoId,
  isLimitedFamily,
} from "@/data/videoCommerce";
import { sanitizePosterSrc } from "@/lib/videoPoster";

function buildTikTokDetailPlayerUrl(videoId: string): string {
  const u = new URL(`https://www.tiktok.com/player/v1/${videoId}`);
  u.searchParams.set("autoplay", "1");
  u.searchParams.set("muted", "1");
  u.searchParams.set("loop", "1");
  // 상세에서는 마우스 오버 시 기본 플레이어 컨트롤이 보이도록 유지
  u.searchParams.set("controls", "1");
  u.searchParams.set("progress_bar", "1");
  u.searchParams.set("play_button", "1");
  u.searchParams.set("volume_control", "1");
  u.searchParams.set("fullscreen_button", "0");
  u.searchParams.set("timestamp", "0");
  u.searchParams.set("description", "0");
  u.searchParams.set("music_info", "0");
  u.searchParams.set("rel", "0");
  u.searchParams.set("native_context_menu", "0");
  return u.toString();
}

export function VideoDetailView({ video }: { video: FeedVideo }) {
  const router = useRouter();
  const { user } = useAuthSession();
  const dopamine = useDopamineBasket();
  const { hasPurchased, markPurchased } = usePurchasedVideos();
  const { recordView } = useRecentClips();
  const owned = hasPurchased(video.id);
  const isOwner = Boolean(
    user?.id && video.listing?.sellerId && user.id === video.listing.sellerId,
  );

  useEffect(() => {
    recordView(video.id);
  }, [video.id, recordView]);

  const meta = useMemo(
    () =>
      video.listing
        ? { salesCount: video.listing.salesCount, edition: "open" as const }
        : getCommerceMeta(video.id),
    [video],
  );
  const remaining = clonesRemaining(meta);
  const fresh = useMemo(() => {
    if (video.listing) {
      return {
        tier: "active" as const,
        label: "",
        subline: "판매자가 등록한 릴스 조각입니다.",
      };
    }
    return getFreshnessForVideoId(video.id);
  }, [video]);
  const showFreshMeta = fresh.tier !== "archived";
  const price = video.priceWon ?? 0;
  const soldOut = remaining === 0 && isLimitedFamily(meta.edition);

  const ctaLabel =
    price === 100
      ? "[커피 한 잔보다 싼 영감 수집하기]"
      : soldOut
        ? "품절"
        : "바로 구매하기";

  const rankMetrics = useMemo(() => {
    if (video.listing) {
      const views = video.listing.views;
      const sales = video.listing.salesCount;
      const p = video.priceWon ?? 0;
      return {
        cumulativeRevenueWon: p * sales,
        totalViews: Math.max(0, views),
        totalLikes: Math.max(0, Math.floor(views * 0.028)),
        growthPercent: 0,
      };
    }
    return getMetricsForVideoDetail(video.id);
  }, [video]);
  const [liveStats, setLiveStats] = useState<{
    playCount: number;
    diggCount: number;
  } | null>(null);
  const isPexelsBlockedVideo = /^https?:\/\/videos\.pexels\.com\//i.test(video.src);
  const posterSrc = sanitizePosterSrc(video.poster);
  const isTikTokEmbed = Boolean(video.tiktokEmbedId);
  const detailMetrics = useMemo(
    () =>
      liveStats
        ? {
            ...rankMetrics,
            totalViews: liveStats.playCount,
            totalLikes: liveStats.diggCount,
          }
        : rankMetrics,
    [liveStats, rankMetrics],
  );

  useEffect(() => {
    if (!video.tiktokEmbedId) {
      setLiveStats(null);
      return;
    }

    let cancelled = false;
    const fetchLiveStats = async () => {
      try {
        const res = await fetch(
          `/api/tiktok/live-stats?videoId=${encodeURIComponent(video.tiktokEmbedId!)}`,
          { cache: "no-store" },
        );
        if (!res.ok) return;
        const j = (await res.json()) as {
          playCount?: number;
          diggCount?: number;
        };
        if (
          cancelled ||
          typeof j.playCount !== "number" ||
          typeof j.diggCount !== "number"
        ) {
          return;
        }
        setLiveStats({
          playCount: j.playCount,
          diggCount: j.diggCount,
        });
      } catch {
        /* ignore and keep fallback metrics */
      }
    };

    void fetchLiveStats();
    const t = window.setInterval(() => {
      void fetchLiveStats();
    }, 45_000);

    return () => {
      cancelled = true;
      window.clearInterval(t);
    };
  }, [video.tiktokEmbedId]);

  return (
    <div className="min-h-screen bg-transparent text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
      <div className="mx-auto max-w-[1800px] px-4 pb-8 pt-0.5 sm:px-6 sm:pt-1 lg:px-8">
        <div className="flex flex-col gap-7 lg:flex-row lg:items-start lg:justify-center lg:gap-12">
          <div
            className={`min-w-0 lg:-mt-2 ${
              video.orientation === "portrait"
                ? "w-full lg:w-[23rem] lg:flex-none"
                : "w-full lg:flex-1"
            }`}
          >
            <div
              className={`reels-glass-card relative overflow-hidden rounded-xl ${
                video.orientation === "portrait"
                  ? "mx-auto lg:mx-0 w-full aspect-[9/16]"
                  : "aspect-video w-full"
              }`}
            >
              {isTikTokEmbed ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <iframe
                    title={video.title}
                    src={buildTikTokDetailPlayerUrl(video.tiktokEmbedId!)}
                    className="h-full w-full border-0"
                    allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                    allowFullScreen
                    loading="eager"
                    scrolling="no"
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                </div>
              ) : (
                <video
                  className="video-detail-player h-full w-full object-cover"
                  poster={posterSrc}
                  src={isPexelsBlockedVideo ? undefined : video.src}
                  controls
                  controlsList="nodownload noplaybackrate noremoteplayback nofullscreen"
                  autoPlay
                  muted
                  loop
                  disablePictureInPicture
                  playsInline
                  preload={isPexelsBlockedVideo ? "none" : "auto"}
                  onContextMenu={(e) => e.preventDefault()}
                />
              )}
            </div>
          </div>

          <div className="flex w-full min-w-0 flex-col gap-6 lg:max-w-md">
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {showFreshMeta && fresh.label ? (
                    <span className="mb-2 inline-block rounded border border-reels-crimson/35 bg-reels-crimson/10 px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wider text-reels-crimson">
                      {fresh.label}
                    </span>
                  ) : null}
                  <SellerIdentityLink
                    creator={video.creator}
                    size="compact"
                    className="mb-2 w-fit"
                  />
                  <h1 className="min-w-0 text-2xl font-extrabold tracking-tight text-zinc-100 sm:text-3xl [html[data-theme='light']_&]:text-zinc-900">
                    {video.title}
                  </h1>
                  {video.description ? (
                    <p className="mt-3 whitespace-pre-wrap text-[14px] leading-relaxed text-zinc-300 [html[data-theme='light']_&]:text-zinc-700">
                      {video.description}
                    </p>
                  ) : null}
                  {video.hashtags ? (
                    <p className="mt-2 text-[13px] leading-relaxed text-reels-cyan/95 [html[data-theme='light']_&]:text-[#6d28d9]">
                      {video.hashtags
                        .split(",")
                        .map((t) => t.trim())
                        .filter(Boolean)
                        .join(" ")}
                    </p>
                  ) : null}
                  {showFreshMeta ? (
                    <p className="mt-2 text-[12px] leading-relaxed text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
                      {fresh.subline}
                    </p>
                  ) : null}
                </div>
                {isOwner ? (
                  <Link
                    href={`/video/${encodeURIComponent(video.id)}/edit`}
                    className="shrink-0 rounded-full border border-white/20 bg-white/[0.08] px-3 py-1.5 text-[12px] font-extrabold text-zinc-100 transition hover:border-reels-cyan/45 hover:text-reels-cyan [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-900"
                  >
                    수정하기
                  </Link>
                ) : null}
              </div>
            </div>

            <section className="reels-glass-card overflow-hidden rounded-xl">
              <TrendingVideoStatsFooter
                metrics={detailMetrics}
                salePriceWon={video.priceWon}
                salesCount={meta.salesCount}
                stockRow={
                  meta.edition === "open"
                    ? null
                    : {
                        remaining,
                        soldOut,
                      }
                }
              />
            </section>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
              <button
                type="button"
                disabled={soldOut}
                onClick={() => {
                  if (soldOut) return;
                  if (!owned) markPurchased(video.id);
                  router.push(`/create?videoId=${encodeURIComponent(video.id)}`);
                }}
                className="h-[48px] w-full flex-1 rounded-full bg-reels-crimson px-5 text-[13px] font-extrabold text-white shadow-reels-crimson transition-[transform,opacity] duration-300 ease-in-out hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {ctaLabel}
              </button>
              <button
                type="button"
                title="장바구니 담기"
                onClick={(e) => {
                  if (soldOut) return;
                  dopamine.launchFromCartButton(e.currentTarget, video, posterSrc);
                }}
                className="inline-flex h-[48px] w-[48px] shrink-0 items-center justify-center self-center rounded-full border border-white/15 bg-white/[0.06] text-zinc-200 transition-colors hover:border-reels-cyan/40 hover:text-reels-cyan disabled:cursor-not-allowed disabled:opacity-40 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-100 [html[data-theme='light']_&]:text-zinc-800 sm:self-stretch"
                disabled={soldOut}
                aria-label="장바구니 담기"
              >
                <ShoppingCart className="h-5 w-5" />
              </button>
            </div>

          </div>
        </div>

        <VideoDetailReviewsSection videoId={video.id} />
        <VideoDetailRecommendations video={video} />
      </div>
    </div>
  );
}

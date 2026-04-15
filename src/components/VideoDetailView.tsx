"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { ShoppingCart } from "lucide-react";
import { RelatedDnaQuilt } from "@/components/RelatedDnaQuilt";
import { SellerIdentityLink } from "@/components/SellerIdentityLink";
import { VideoDetailRecommendations } from "@/components/VideoDetailRecommendations";
import { VideoDetailReviewsSection } from "@/components/VideoDetailReviewsSection";
import { TrendingVideoStatsFooter } from "@/components/TrendingVideoStatsFooter";
import { getMetricsForVideoDetail } from "@/data/trendingStats";
import { useDopamineBasket } from "@/context/DopamineBasketContext";
import { usePurchasedVideos } from "@/context/PurchasedVideosContext";
import { useRecentClips } from "@/context/RecentClipsContext";
import type { FeedVideo } from "@/data/videos";
import {
  clonesRemaining,
  getCommerceMeta,
  getFreshnessForVideoId,
  isLimitedFamily,
} from "@/data/videoCommerce";
import { sanitizePosterSrc } from "@/lib/videoPoster";

export function VideoDetailView({ video }: { video: FeedVideo }) {
  const router = useRouter();
  const dopamine = useDopamineBasket();
  const { hasPurchased, markPurchased } = usePurchasedVideos();
  const { recordView } = useRecentClips();
  const owned = hasPurchased(video.id);

  useEffect(() => {
    recordView(video.id);
  }, [video.id, recordView]);
  const meta = getCommerceMeta(video.id);
  const remaining = clonesRemaining(meta);
  const fresh = getFreshnessForVideoId(video.id);
  const showFreshMeta = fresh.tier !== "archived";
  const price = video.priceWon ?? 0;
  const soldOut = remaining === 0 && isLimitedFamily(meta.edition);

  const ctaLabel =
    price === 100
      ? "[커피 한 잔보다 싼 영감 수집하기]"
      : soldOut
        ? "품절"
        : "바로 구매하기";

  const rankMetrics = useMemo(
    () => getMetricsForVideoDetail(video.id),
    [video.id],
  );
  const isPexelsBlockedVideo = /^https?:\/\/videos\.pexels\.com\//i.test(video.src);
  const posterSrc = sanitizePosterSrc(video.poster);

  return (
    <div className="min-h-screen bg-transparent text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
      <div className="mx-auto max-w-[1800px] px-4 py-8 sm:px-6 lg:px-8">
        <nav className="mb-6 font-mono text-[11px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
          <Link href="/" className="text-reels-cyan/90 hover:text-reels-cyan">
            홈
          </Link>
          <span className="mx-1.5 text-zinc-700 [html[data-theme='light']_&]:text-zinc-500">/</span>
          <span className="text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">릴스 상세</span>
        </nav>

        <div className="flex flex-col gap-10 lg:flex-row lg:gap-12">
          <div className="min-w-0 flex-1">
            <div
              className={`reels-glass-card relative overflow-hidden rounded-xl ${
                video.orientation === "portrait"
                  ? "mx-auto max-w-md aspect-[3/4]"
                  : "aspect-video w-full"
              }`}
            >
              <video
                className="video-detail-player h-full w-full object-cover"
                poster={posterSrc}
                src={isPexelsBlockedVideo ? undefined : video.src}
                controls
                controlsList="nodownload noplaybackrate noremoteplayback"
                disablePictureInPicture
                playsInline
                preload={isPexelsBlockedVideo ? "none" : "metadata"}
                onContextMenu={(e) => e.preventDefault()}
              />
            </div>
          </div>

          <div className="flex w-full min-w-0 flex-col gap-6 lg:max-w-md">
            <div>
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
              {showFreshMeta ? (
                <p className="mt-2 text-[12px] leading-relaxed text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
                  {fresh.subline}
                </p>
              ) : null}
            </div>

            <section
              className="reels-glass-card overflow-hidden rounded-xl"
              aria-labelledby="video-stats-heading"
            >
              <h2
                id="video-stats-heading"
                className="border-b border-white/10 bg-black/20 px-3 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-400 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50 [html[data-theme='light']_&]:text-zinc-600 sm:px-3.5 sm:text-[12px]"
              >
                실시간 성과 · 지표
              </h2>
              <TrendingVideoStatsFooter
                metrics={rankMetrics}
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
                className="w-full flex-1 rounded-full bg-reels-crimson px-5 py-3.5 text-[14px] font-extrabold text-white shadow-reels-crimson transition-[transform,opacity] duration-300 ease-in-out hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
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
                className="inline-flex h-[52px] w-[52px] shrink-0 items-center justify-center self-center rounded-full border border-white/15 bg-white/[0.06] text-zinc-200 transition-colors hover:border-reels-cyan/40 hover:text-reels-cyan disabled:cursor-not-allowed disabled:opacity-40 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-100 [html[data-theme='light']_&]:text-zinc-800 sm:self-stretch"
                disabled={soldOut}
                aria-label="장바구니 담기"
              >
                <ShoppingCart className="h-5 w-5" />
              </button>
            </div>

            <div className="pt-1">
              <RelatedDnaQuilt video={video} />
            </div>
          </div>
        </div>

        <VideoDetailReviewsSection videoId={video.id} />
        <VideoDetailRecommendations video={video} />
      </div>
    </div>
  );
}

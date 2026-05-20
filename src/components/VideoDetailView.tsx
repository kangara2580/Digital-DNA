"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bookmark, ChevronLeft, ChevronRight, Heart, ShoppingCart } from "lucide-react";
import { useAuthPromptModal } from "@/components/AuthPromptModalProvider";
import { TossCheckoutButton } from "@/components/payments/TossCheckoutButton";
import { VideoSourcePlatformIcon } from "@/components/VideoSourcePlatformIcon";
import { SellerSocialLinkIcons } from "@/components/SellerSocialLinkIcons";
import { useSellerSocialLinks } from "@/hooks/useSellerSocialLinks";
import { SellerIdentityLink } from "@/components/SellerIdentityLink";
import { VideoDetailRecommendations } from "@/components/VideoDetailRecommendations";
import { VideoDetailReviewsSection } from "@/components/VideoDetailReviewsSection";
import { TrendingVideoStatsFooter } from "@/components/TrendingVideoStatsFooter";
import { getMetricsForVideoDetail } from "@/data/trendingStats";
import { useDopamineBasket } from "@/context/DopamineBasketContext";
import { usePurchasedVideos } from "@/context/PurchasedVideosContext";
import { useRecentClips } from "@/context/RecentClipsContext";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useTranslation } from "@/hooks/useTranslation";
import { useVideoCartAction } from "@/hooks/useVideoCartAction";
import { useVideoDisplayTitle } from "@/hooks/useVideoDisplayTitle";
import { useVideoLike } from "@/hooks/useVideoLike";
import { useVideoWishlistAction } from "@/hooks/useVideoWishlistAction";
import type { FeedVideo } from "@/data/videos";
import {
  clonesRemaining,
  getCommerceMeta,
  getFreshnessForVideoId,
  isLimitedFamily,
} from "@/data/videoCommerce";
import { getVideosForCategory } from "@/data/videoCatalog";
import {
  getExternalIframeForDetail,
  getExternalLiveStatsPageUrl,
} from "@/lib/externalEmbed/playerUrls";
import {
  EXTERNAL_EMBED_IFRAME_ALLOW,
  EXTERNAL_EMBED_IFRAME_SANDBOX,
} from "@/lib/externalEmbed/iframeSandbox";
import { sanitizePosterSrc } from "@/lib/videoPoster";
import {
  EXPLORE_RAIL_ACTION_BTN,
  EXPLORE_RAIL_ACTION_BTN_ACTIVE_TINT,
  EXPLORE_RAIL_ACTION_ICON,
  EXPLORE_RAIL_ACTION_ICON_FILLED,
} from "@/lib/exploreRailActionTokens";
import { getVideoContentSource } from "@/lib/videoSourcePlatform";

export function VideoDetailView({
  video,
  fromCategory,
  fromSeller,
}: {
  video: FeedVideo;
  fromCategory?: string;
  /** `/seller/[handle]` 리스트에서 진입 시 — 해당 판매자 클립만 이전/다음 */
  fromSeller?: string;
}) {
  const router = useRouter();
  const detailVideoRef = useRef<HTMLVideoElement | null>(null);
  const { openAuthModal } = useAuthPromptModal();
  const { user, loading: authLoading, supabaseConfigured } = useAuthSession();
  const dopamine = useDopamineBasket();
  const { hasPurchased } = usePurchasedVideos();
  const { recordView } = useRecentClips();
  const { t, locale } = useTranslation();
  const displayTitle = useVideoDisplayTitle();
  const owned = hasPurchased(video.id);
  const isOwner = Boolean(
    user?.id && video.listing?.sellerId && user.id === video.listing.sellerId,
  );
  const [sellerFeedIds, setSellerFeedIds] = useState<string[] | null>(null);

  const requireAuth = useCallback(() => {
    if (authLoading) return false;
    if (!supabaseConfigured || !user) {
      openAuthModal();
      return false;
    }
    return true;
  }, [authLoading, openAuthModal, supabaseConfigured, user]);

  useEffect(() => {
    recordView(video.id);
  }, [video.id, recordView]);

  /** DB에 등록된 마켓 영상만 — 세션당 1회 조회수 반영 */
  useEffect(() => {
    const id = video.id?.trim();
    if (!id) return;
    if (/^(tiktok-|youtube-|instagram-)/i.test(id)) return;
    if (typeof window === "undefined") return;
    const key = `araRecordedDetailView:${id}`;
    if (sessionStorage.getItem(key)) return;
    void fetch("/api/videos/record-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId: id }),
      keepalive: true,
    }).then((res) => {
      if (res.ok) sessionStorage.setItem(key, "1");
    });
  }, [video.id]);

  const sellerHandle = useMemo(() => (fromSeller ?? "").trim(), [fromSeller]);

  /** 판매자 페이지(fromSeller) 또는 검색·직링크 등: 같은 판매자 DB 영상 순서로 이전/다음 */
  useEffect(() => {
    const key = sellerHandle;
    if (key) {
      let cancelled = false;
      setSellerFeedIds(null);
      void fetch(`/api/seller/clips?handle=${encodeURIComponent(key)}`, { cache: "no-store" })
        .then(async (res) => {
          const body = (await res.json().catch(() => ({}))) as {
            ok?: boolean;
            videoIds?: string[];
          };
          if (!res.ok || !body.ok || !Array.isArray(body.videoIds)) return;
          if (!cancelled) setSellerFeedIds(body.videoIds);
        })
        .catch(() => {
          if (!cancelled) setSellerFeedIds([]);
        });
      return () => {
        cancelled = true;
      };
    }

    if (fromCategory) {
      setSellerFeedIds(null);
      return;
    }

    const sellerId = video.listing?.sellerId?.trim();
    if (!sellerId) {
      setSellerFeedIds(null);
      return;
    }

    let cancelled = false;
    setSellerFeedIds(null);
    void fetch(`/api/seller/videos?sellerId=${encodeURIComponent(sellerId)}`, {
      cache: "no-store",
    })
      .then(async (res) => {
        const body = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          videos?: { id: string }[];
        };
        if (!res.ok || !body.ok || !Array.isArray(body.videos)) return;
        if (!cancelled) setSellerFeedIds(body.videos.map((v) => v.id));
      })
      .catch(() => {
        if (!cancelled) setSellerFeedIds([]);
      });
    return () => {
      cancelled = true;
    };
  }, [sellerHandle, fromCategory, video.listing?.sellerId]);

  const detailQuerySuffix = useMemo(() => {
    const params = new URLSearchParams();
    if (fromCategory) params.set("from", fromCategory);
    const fs = sellerHandle;
    if (fs) params.set("fromSeller", fs);
    const s = params.toString();
    return s ? `?${s}` : "";
  }, [fromCategory, sellerHandle]);

  /* ── 카테고리 순환 네비게이션 ── */
  const categoryVideos = useMemo(() => {
    if (!fromCategory) return [];
    // 탐색에서 진입 시 best 풀로 순환
    const slug = fromCategory === "explore" ? "best" : fromCategory;
    const pool = getVideosForCategory(slug);
    if (pool.length > 0) return pool;
    // 풀이 비어있으면 best 폴백
    return getVideosForCategory("best");
  }, [fromCategory]);
  const currentIndex = useMemo(() => {
    const idx = categoryVideos.findIndex((v) => v.id === video.id);
    // 탐색에서 진입 시 현재 영상이 풀에 없을 수 있음 → 0번부터 시작
    return idx >= 0 ? idx : (fromCategory ? 0 : -1);
  }, [categoryVideos, video.id, fromCategory]);
  const hasCategoryNav = categoryVideos.length > 1 && currentIndex >= 0;
  const prevVideo = hasCategoryNav
    ? categoryVideos[(currentIndex - 1 + categoryVideos.length) % categoryVideos.length]
    : null;
  const nextVideo = hasCategoryNav
    ? categoryVideos[(currentIndex + 1) % categoryVideos.length]
    : null;

  const goToVideo = useCallback(
    (target: FeedVideo) => {
      router.push(`/video/${encodeURIComponent(target.id)}${detailQuerySuffix}`);
    },
    [router, detailQuerySuffix],
  );

  const goToVideoId = useCallback(
    (videoId: string) => {
      router.push(`/video/${encodeURIComponent(videoId)}${detailQuerySuffix}`);
    },
    [router, detailQuerySuffix],
  );

  const sellerIndex = useMemo(() => {
    if (!sellerFeedIds || sellerFeedIds.length === 0) return -1;
    return sellerFeedIds.indexOf(video.id);
  }, [sellerFeedIds, video.id]);

  const sellerPrevId =
    sellerIndex > 0 && sellerFeedIds ? (sellerFeedIds[sellerIndex - 1] ?? null) : null;
  const sellerNextId =
    sellerIndex >= 0 && sellerFeedIds && sellerIndex < sellerFeedIds.length - 1
      ? (sellerFeedIds[sellerIndex + 1] ?? null)
      : null;

  /** 카테고리 진입(from)이 아니면 같은 판매자 목록으로 좌우 이동 (검색·홈 등 포함) */
  const prioritizeSellerFeed =
    sellerHandle.length > 0 ||
    (!fromCategory && Boolean(video.listing?.sellerId?.trim()));

  const useSellerFeedNav =
    prioritizeSellerFeed &&
    sellerFeedIds !== null &&
    sellerFeedIds.length > 1 &&
    sellerIndex >= 0;

  const showPrevNav = prioritizeSellerFeed
    ? Boolean(useSellerFeedNav && sellerPrevId)
    : Boolean(hasCategoryNav && prevVideo);
  const showNextNav = prioritizeSellerFeed
    ? Boolean(useSellerFeedNav && sellerNextId)
    : Boolean(hasCategoryNav && nextVideo);
  const showNavChrome = showPrevNav || showNextNav;

  useEffect(() => {
    if (!showNavChrome) return;
    const onKey = (e: KeyboardEvent) => {
      if (prioritizeSellerFeed && useSellerFeedNav) {
        if (e.key === "ArrowLeft" && sellerPrevId) goToVideoId(sellerPrevId);
        if (e.key === "ArrowRight" && sellerNextId) goToVideoId(sellerNextId);
        return;
      }
      if (hasCategoryNav) {
        if (e.key === "ArrowLeft" && prevVideo) goToVideo(prevVideo);
        if (e.key === "ArrowRight" && nextVideo) goToVideo(nextVideo);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    showNavChrome,
    prioritizeSellerFeed,
    useSellerFeedNav,
    sellerPrevId,
    sellerNextId,
    goToVideoId,
    hasCategoryNav,
    prevVideo,
    nextVideo,
    goToVideo,
  ]);

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
        subline: t("video.detail.sellerListingSubline"),
      };
    }
    return getFreshnessForVideoId(video.id);
  }, [video, t]);
  const showFreshMeta = fresh.tier !== "archived";
  const price = video.priceWon ?? 0;
  const soldOut = remaining === 0 && isLimitedFamily(meta.edition);
  const { wishlisted, toggleWishlist } = useVideoWishlistAction(video, requireAuth);
  const { inCart, toggleCartFromButton } = useVideoCartAction(video, dopamine, requireAuth);
  const [wishlistPulse, setWishlistPulse] = useState(false);
  const [likePulse, setLikePulse] = useState(false);
  const [likeBurst, setLikeBurst] = useState(false);
  const { internalLikeCount, likedByMe, likeBusy, toggleLike } = useVideoLike({
    videoId: video.id,
    requireAuth,
    onError: () => {
      if (typeof window !== "undefined") {
        window.alert(t("explore.likeFailed"));
      }
    },
  });

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
  const sellerSocialLinks = useSellerSocialLinks(
    video.listing?.sellerId,
    video.sellerSocialLinks,
  );
  const isPexelsBlockedVideo = /^https?:\/\/videos\.pexels\.com\//i.test(video.src);
  const canLoadDirectVideo =
    video.src.startsWith("/") ||
    /\.(mp4|webm|mov|m4v)(\?|$)/i.test(video.src) ||
    /^blob:/i.test(video.src) ||
    /^data:video\//i.test(video.src);
  const posterSrc = sanitizePosterSrc(video.poster);
  const externalEmbed = useMemo(
    () => {
      const raw = getExternalIframeForDetail(video);
      if (process.env.NODE_ENV !== "production" && raw?.kind === "tiktok") {
        return null;
      }
      return raw;
    },
    [video],
  );
  const statsPageUrl = useMemo(
    () =>
      process.env.NODE_ENV !== "production" && video.tiktokEmbedId
        ? null
        : getExternalLiveStatsPageUrl(video),
    [video],
  );
  const videoContentSource = useMemo(() => getVideoContentSource(video), [video]);
  const externalLikeCount = liveStats?.diggCount ?? rankMetrics.totalLikes;
  const totalLikeCount = useMemo(
    () => Math.max(0, externalLikeCount + internalLikeCount),
    [externalLikeCount, internalLikeCount],
  );
  const detailMetrics = useMemo(
    () =>
      liveStats
        ? {
            ...rankMetrics,
            totalViews: liveStats.playCount,
            totalLikes: totalLikeCount,
          }
        : {
            ...rankMetrics,
            totalLikes: totalLikeCount,
          },
    [liveStats, rankMetrics, totalLikeCount],
  );

  useEffect(() => {
    if (!statsPageUrl) {
      setLiveStats(null);
      return;
    }

    let cancelled = false;
    const fetchLiveStats = async () => {
      try {
        const res = await fetch(
          `/api/embed/live-stats?url=${encodeURIComponent(statsPageUrl)}`,
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
  }, [statsPageUrl]);

  const toggleInternalLike = useCallback(async () => {
    const nextLiked = !likedByMe;
    setLikePulse(true);
    if (nextLiked) {
      setLikeBurst(true);
      window.setTimeout(() => setLikeBurst(false), 420);
    }
    window.setTimeout(() => setLikePulse(false), 170);
    await toggleLike();
  }, [
    likedByMe,
    toggleLike,
  ]);

  const toggleDetailVideoPlayback = useCallback(() => {
    const el = detailVideoRef.current;
    if (!el) return;
    if (el.paused) {
      void el.play().catch(() => {
        /* autoplay/user-gesture 정책에 막히면 기본 controls에 위임 */
      });
      return;
    }
    el.pause();
  }, []);

  /** 로컬/스테이징에서 토스 없이 스튜디오 UI만 개발할 때 — `.env.local` 에 `NEXT_PUBLIC_DEV_BYPASS_CHECKOUT_TO_STUDIO=1` */
  const devBypassCheckoutToStudio =
    process.env.NEXT_PUBLIC_DEV_BYPASS_CHECKOUT_TO_STUDIO === "1";
  const buyStudioCtaClassName =
    "relative h-[60px] w-full rounded-full border-[3px] border-white/40 bg-transparent text-[17px] font-extrabold tracking-widest text-white shadow-[0_0_24px_rgba(255,255,255,0.06),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-white/70 hover:bg-white/5 hover:shadow-[0_0_32px_rgba(255,255,255,0.12)] active:scale-[0.99] active:translate-y-0 [html[data-theme='light']_&]:border-zinc-900/60 [html[data-theme='light']_&]:text-zinc-900";

  return (
    <div className="relative min-h-screen bg-transparent text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">

      <div className="mx-auto max-w-[1600px] px-2 pb-8 pt-8 sm:px-4 sm:pt-10 lg:px-6">
        <div className="flex flex-col gap-7 lg:flex-row lg:items-start lg:justify-center lg:gap-36">
          {/* 영상 + 좌우 화살표 묶음 */}
          <div
            className={`relative min-w-0 lg:-mt-2 ${
              video.orientation === "portrait"
                ? "w-full lg:w-[23rem] lg:flex-none"
                : "w-full lg:flex-1"
            }`}
          >
            {showNavChrome && (
              <>
                {showPrevNav ? (
                  <button
                    type="button"
                    aria-label={t("explore.prevVideo")}
                    onClick={() => {
                      if (prioritizeSellerFeed && sellerPrevId) {
                        goToVideoId(sellerPrevId);
                        return;
                      }
                      if (prevVideo) goToVideo(prevVideo);
                    }}
                    className="group absolute left-0 top-1/2 z-[70] -translate-x-[calc(100%+1.5rem)] -translate-y-1/2"
                  >
                    <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-black/60 text-zinc-200 shadow-xl backdrop-blur-sm transition-all duration-200 group-hover:border-white/35 group-hover:bg-black/80 group-hover:text-white group-hover:scale-110 [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:bg-white/90 [html[data-theme='light']_&]:text-zinc-700">
                      <ChevronLeft className="h-7 w-7" />
                    </span>
                  </button>
                ) : null}
                {showNextNav ? (
                  <button
                    type="button"
                    aria-label={t("explore.nextVideo")}
                    onClick={() => {
                      if (prioritizeSellerFeed && sellerNextId) {
                        goToVideoId(sellerNextId);
                        return;
                      }
                      if (nextVideo) goToVideo(nextVideo);
                    }}
                    className="group absolute right-0 top-1/2 z-[70] translate-x-[calc(100%+1.5rem)] -translate-y-1/2"
                  >
                    <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-black/60 text-zinc-200 shadow-xl backdrop-blur-sm transition-all duration-200 group-hover:border-white/35 group-hover:bg-black/80 group-hover:text-white group-hover:scale-110 [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:bg-white/90 [html[data-theme='light']_&]:text-zinc-700">
                      <ChevronRight className="h-7 w-7" />
                    </span>
                  </button>
                ) : null}
              </>
            )}
            <div
              className={`reels-glass-card relative overflow-hidden rounded-xl ${
                video.orientation === "portrait"
                  ? "mx-auto lg:mx-0 w-full aspect-[9/16]"
                  : "aspect-video w-full"
              }`}
            >
              {externalEmbed ? (
                <div className="absolute inset-0 overflow-hidden">
                  <iframe
                    title={displayTitle(video)}
                    src={externalEmbed.src}
                    sandbox={EXTERNAL_EMBED_IFRAME_SANDBOX}
                    className={`border-0 ${
                      externalEmbed.kind === "instagram"
                        ? "absolute left-1/2 top-[2%] h-[118%] w-[112%] max-w-none -translate-x-1/2"
                        : externalEmbed.kind === "youtube"
                          ? "absolute left-1/2 top-1/2 h-[110%] w-[110%] max-w-none -translate-x-1/2 -translate-y-1/2"
                          : "absolute inset-0 h-full w-full"
                    }`}
                    allow={EXTERNAL_EMBED_IFRAME_ALLOW}
                    allowFullScreen
                    loading="eager"
                    scrolling="no"
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                </div>
              ) : (
                <video
                  ref={detailVideoRef}
                  className="video-detail-player h-full w-full cursor-pointer object-cover transition-[filter,opacity] duration-200 hover:brightness-105 active:brightness-95"
                  poster={posterSrc}
                  src={isPexelsBlockedVideo || !canLoadDirectVideo ? undefined : video.src}
                  controls
                  controlsList="nodownload noplaybackrate noremoteplayback nofullscreen"
                  autoPlay
                  muted
                  loop
                  disablePictureInPicture
                  playsInline
                  preload={isPexelsBlockedVideo || !canLoadDirectVideo ? "none" : "auto"}
                  onContextMenu={(e) => e.preventDefault()}
                  onClick={toggleDetailVideoPlayback}
                />
              )}
            </div>
          </div>

          <div className="flex w-full min-w-0 flex-col gap-6 lg:max-w-md pl-16 lg:pl-3 lg:pt-16">
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {showFreshMeta && fresh.label ? (
                    <span className="mb-2 inline-block rounded border border-reels-crimson/35 bg-reels-crimson/10 px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wider text-reels-crimson">
                      {fresh.label}
                    </span>
                  ) : null}
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <div className="flex min-w-0 max-w-full items-center gap-2">
                      <VideoSourcePlatformIcon
                        source={videoContentSource}
                        className="h-4 w-4 shrink-0 text-zinc-400 [html[data-theme='light']_&]:text-zinc-600"
                      />
                      <SellerIdentityLink
                        creator={video.creator}
                        sellerId={video.listing?.sellerId}
                        size="compact"
                        className="min-w-0 flex-1"
                      />
                    </div>
                    <SellerSocialLinkIcons links={sellerSocialLinks} size="md" />
                  </div>
                  <h1 className="min-w-0 text-center text-2xl font-extrabold tracking-tight text-zinc-100 sm:text-3xl [html[data-theme='light']_&]:text-zinc-900">
                    {displayTitle(video)}
                  </h1>
                  {video.description ? (
                    <p className="mt-3 whitespace-pre-wrap text-[14px] leading-relaxed text-zinc-300 [html[data-theme='light']_&]:text-zinc-700">
                      {video.description}
                    </p>
                  ) : null}
                  {video.hashtags ? (
                    <p className="mt-2 text-[13px] leading-relaxed text-reels-cyan/95 [html[data-theme='light']_&]:text-[color:var(--reels-point)]">
                      {video.hashtags
                        .split(",")
                        .map((tag) => tag.trim())
                        .filter(Boolean)
                        .join(" ")}
                    </p>
                  ) : null}
                </div>
                {isOwner ? (
                  <Link
                    href={`/video/${encodeURIComponent(video.id)}/edit`}
                    className="shrink-0 rounded-full border border-white/20 bg-white/[0.08] px-3 py-1.5 text-[12px] font-extrabold text-zinc-100 transition hover:border-reels-cyan/45 hover:text-reels-cyan [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-900"
                  >
                    {t("video.detail.editListing")}
                  </Link>
                ) : null}
              </div>
            </div>

            {/* 스탯 — 미니멀 카드 */}
            <section className="w-fit mx-auto">
              <TrendingVideoStatsFooter
                revenueFullWon
                metrics={detailMetrics}
                salesCount={meta.salesCount}
                stockRow={
                  meta.edition === "open"
                    ? null
                    : { remaining, soldOut }
                }
              />
            </section>

            {/* 가격 표시 */}
            {price > 0 && (
              <div className="text-center">
                <span className="font-black tabular-nums tracking-tight text-[length:calc(36px_+_5pt)] text-white [html[data-theme='light']_&]:text-zinc-900">
                  {locale === "en" ? (
                    <>₩{price.toLocaleString("en-US")}</>
                  ) : (
                    <>
                      {price.toLocaleString("ko-KR")}
                      <span className="ml-1.5 font-extrabold text-[length:calc(22px_+_5pt)]">
                        {t("video.detail.currencySuffix")}
                      </span>
                    </>
                  )}
                </span>
              </div>
            )}

            {/* 구매 버튼 — 운영: 미보유 시 Toss. 개발: NEXT_PUBLIC_DEV_BYPASS_CHECKOUT_TO_STUDIO=1 이면 토스 없이 스튜디오로 */}
            <div className="px-8">
              {owned || isOwner ? (
                <button
                  type="button"
                  onClick={() => {
                    if (!requireAuth()) return;
                    router.push(`/create?videoId=${encodeURIComponent(video.id)}`);
                  }}
                  className={buyStudioCtaClassName}
                >
                  {t("video.detail.buyNow")}
                </button>
              ) : devBypassCheckoutToStudio ? (
                <button
                  type="button"
                  disabled={soldOut}
                  onClick={() => {
                    if (soldOut) return;
                    if (!requireAuth()) return;
                    router.push(`/create?videoId=${encodeURIComponent(video.id)}`);
                  }}
                  className={`${buyStudioCtaClassName} disabled:cursor-not-allowed disabled:opacity-40`}
                >
                  {soldOut ? t("video.detail.soldOut") : t("video.detail.buyNow")}
                </button>
              ) : (
                <TossCheckoutButton
                  productType="video"
                  videoId={video.id}
                  onUnauthorized={openAuthModal}
                  className={`${buyStudioCtaClassName} disabled:cursor-wait disabled:opacity-40`}
                  disabled={soldOut}
                >
                  {soldOut ? t("video.detail.soldOut") : t("video.detail.buyNow")}
                </TossCheckoutButton>
              )}
            </div>

            {/* 액션 아이콘 — 탐색 레일과 동일 실루엣 */}
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                title={inCart ? t("explore.rail.cartRemove") : t("explore.rail.cartAdd")}
                onClick={(e) => {
                  if (soldOut) return;
                  if (!requireAuth()) return;
                  toggleCartFromButton(e.currentTarget, posterSrc ?? undefined);
                }}
                className={`${EXPLORE_RAIL_ACTION_BTN} disabled:cursor-not-allowed disabled:opacity-40 ${
                  inCart ? EXPLORE_RAIL_ACTION_BTN_ACTIVE_TINT : ""
                }`}
                disabled={soldOut}
                aria-label={inCart ? t("explore.rail.cartRemove") : t("explore.rail.cartAdd")}
                aria-pressed={inCart}
              >
                <ShoppingCart
                  strokeWidth={2.25}
                  className={
                    inCart ? EXPLORE_RAIL_ACTION_ICON_FILLED : `${EXPLORE_RAIL_ACTION_ICON} stroke-current`
                  }
                />
              </button>
              <button
                type="button"
                title={likedByMe ? t("explore.rail.likeUndo") : t("explore.rail.like")}
                onClick={(e) => {
                  e.preventDefault();
                  void toggleInternalLike();
                }}
                className={`relative ${EXPLORE_RAIL_ACTION_BTN} ${
                  likedByMe ? EXPLORE_RAIL_ACTION_BTN_ACTIVE_TINT : ""
                } disabled:cursor-not-allowed disabled:opacity-40`}
                aria-label={likedByMe ? t("explore.rail.likeUndo") : t("explore.rail.like")}
                aria-pressed={likedByMe}
                disabled={likeBusy}
              >
                {likeBurst ? (
                  <span className="pointer-events-none absolute inset-0 rounded-full bg-[var(--reels-point)]/28 animate-ping" />
                ) : null}
                <Heart
                  strokeWidth={2.25}
                  className={`relative z-[1] transition-transform duration-150 ${
                    likedByMe ? EXPLORE_RAIL_ACTION_ICON_FILLED : `${EXPLORE_RAIL_ACTION_ICON} stroke-current`
                  } ${likePulse || likeBurst ? "scale-110" : "scale-100"}`}
                />
              </button>
              <button
                type="button"
                title={wishlisted ? t("video.detail.wishlistRemove") : t("video.detail.wishlistAdd")}
                onClick={(e) => {
                  e.preventDefault();
                  if (!requireAuth()) return;
                  setWishlistPulse(true);
                  window.setTimeout(() => setWishlistPulse(false), 170);
                  toggleWishlist();
                }}
                className={`${EXPLORE_RAIL_ACTION_BTN} ${
                  wishlisted ? EXPLORE_RAIL_ACTION_BTN_ACTIVE_TINT : ""
                } transition-transform duration-200 ${wishlistPulse ? "scale-110" : "scale-100"}`}
                aria-label={wishlisted ? t("video.detail.wishlistRemove") : t("video.detail.wishlistAdd")}
                aria-pressed={wishlisted}
              >
                <Bookmark
                  strokeWidth={2.25}
                  className={
                    wishlisted ? EXPLORE_RAIL_ACTION_ICON_FILLED : `${EXPLORE_RAIL_ACTION_ICON} stroke-current`
                  }
                />
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

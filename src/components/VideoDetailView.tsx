"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Heart,
  Pause,
  Play,
  ShoppingCart,
} from "lucide-react";
import { useAuthPromptModal } from "@/components/AuthPromptModalProvider";
import { CreditPurchaseButton } from "@/components/payments/CreditPurchaseButton";
import { InsufficientCreditsModal } from "@/components/InsufficientCreditsModal";
import { VideoSourcePlatformIcon } from "@/components/VideoSourcePlatformIcon";
import { SellerSocialLinkIcons } from "@/components/SellerSocialLinkIcons";
import { useSellerSocialLinks } from "@/hooks/useSellerSocialLinks";
import { SellerIdentityLink } from "@/components/SellerIdentityLink";
import { VideoDetailRecommendations } from "@/components/VideoDetailRecommendations";
import { VideoDetailReviewsSection } from "@/components/VideoDetailReviewsSection";
import { TrendingVideoStatsFooter } from "@/components/TrendingVideoStatsFooter";
import { getGridCardMetrics } from "@/data/trendingStats";
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
import { getVideosForCategory, normalizeSellerHandle } from "@/data/videoCatalog";
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
import { GemAmount } from "@/components/PaymentDiamondIcon";
import { toGemPrice, formatGems } from "@/lib/gemPrice";

const SELLER_FEED_CACHE_PREFIX = "araSellerFeedIds:";
const sellerFeedMemoryCache = new Map<string, string[]>();

function readSellerFeedCache(key: string): string[] | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(`${SELLER_FEED_CACHE_PREFIX}${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) && parsed.every((id) => typeof id === "string")
      ? parsed
      : null;
  } catch {
    return null;
  }
}

function writeSellerFeedCache(key: string, ids: string[]) {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(`${SELLER_FEED_CACHE_PREFIX}${key}`, JSON.stringify(ids));
  } catch {
    /* ignore quota */
  }
}

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
  const sellerFeedFetchKeyRef = useRef<string | null>(null);
  const stableSellerFeedIdsRef = useRef<string[] | null>(null);

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

  const sellerNavKey = useMemo(
    () =>
      sellerHandle ||
      video.listing?.sellerId?.trim() ||
      normalizeSellerHandle(video.creator) ||
      "",
    [sellerHandle, video.listing?.sellerId, video.creator],
  );

  /** 판매자 페이지(fromSeller) 또는 검색·직링크 등: 같은 판매자 DB 영상 순서로 이전/다음 */
  useEffect(() => {
    const key = sellerHandle || sellerNavKey;
    if (key) {
      let cancelled = false;
      if (sellerFeedFetchKeyRef.current !== key) {
        sellerFeedFetchKeyRef.current = key;
        const cached =
          sellerFeedMemoryCache.get(key) ?? readSellerFeedCache(key) ?? null;
        if (cached && cached.length > 0) {
          setSellerFeedIds(cached);
          stableSellerFeedIdsRef.current = cached;
          sellerFeedMemoryCache.set(key, cached);
        }
      }
      void fetch(`/api/seller/clips?handle=${encodeURIComponent(key)}`, { cache: "no-store" })
        .then(async (res) => {
          const body = (await res.json().catch(() => ({}))) as {
            ok?: boolean;
            videoIds?: string[];
          };
          if (!res.ok || !body.ok || !Array.isArray(body.videoIds)) return;
          if (!cancelled) {
            setSellerFeedIds(body.videoIds);
            stableSellerFeedIdsRef.current = body.videoIds;
            sellerFeedMemoryCache.set(key, body.videoIds);
            writeSellerFeedCache(key, body.videoIds);
          }
        })
        .catch(() => {
          if (!cancelled && !stableSellerFeedIdsRef.current) setSellerFeedIds([]);
        });
      return () => {
        cancelled = true;
      };
    }

    if (fromCategory) {
      sellerFeedFetchKeyRef.current = null;
      setSellerFeedIds(null);
      stableSellerFeedIdsRef.current = null;
      return;
    }

    const sellerId = video.listing?.sellerId?.trim();
    if (!sellerId) {
      sellerFeedFetchKeyRef.current = null;
      setSellerFeedIds(null);
      stableSellerFeedIdsRef.current = null;
      return;
    }

    let cancelled = false;
    const fallbackKey = `sellerId:${sellerId}`;
    if (sellerFeedFetchKeyRef.current !== fallbackKey) {
      sellerFeedFetchKeyRef.current = fallbackKey;
      const cached =
        sellerFeedMemoryCache.get(fallbackKey) ?? readSellerFeedCache(fallbackKey) ?? null;
      if (cached && cached.length > 0) {
        setSellerFeedIds(cached);
        stableSellerFeedIdsRef.current = cached;
      }
    }
    void fetch(`/api/seller/videos?sellerId=${encodeURIComponent(sellerId)}`, {
      cache: "no-store",
    })
      .then(async (res) => {
        const body = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          videos?: { id: string }[];
        };
        if (!res.ok || !body.ok || !Array.isArray(body.videos)) return;
        const ids = body.videos.map((v) => v.id);
        if (!cancelled) {
          setSellerFeedIds(ids);
          stableSellerFeedIdsRef.current = ids;
          sellerFeedMemoryCache.set(fallbackKey, ids);
          writeSellerFeedCache(fallbackKey, ids);
        }
      })
      .catch(() => {
        if (!cancelled && !stableSellerFeedIdsRef.current) setSellerFeedIds([]);
      });
    return () => {
      cancelled = true;
    };
  }, [sellerHandle, sellerNavKey, fromCategory, video.listing?.sellerId]);

  useEffect(() => {
    if (sellerFeedIds && sellerFeedIds.length > 0) {
      stableSellerFeedIdsRef.current = sellerFeedIds;
    }
  }, [sellerFeedIds]);

  const activeSellerFeedIds = sellerFeedIds ?? stableSellerFeedIdsRef.current;

  const detailQuerySuffix = useMemo(() => {
    if (sellerHandle) {
      return `?fromSeller=${encodeURIComponent(sellerHandle)}`;
    }
    const params = new URLSearchParams();
    if (fromCategory) params.set("from", fromCategory);
    else if (sellerNavKey) params.set("fromSeller", sellerNavKey);
    const s = params.toString();
    return s ? `?${s}` : "";
  }, [fromCategory, sellerHandle, sellerNavKey]);

  /** 하단 추천 카드·판매자 순환 — 항상 판매자 피드 쿼리로 진입 */
  const sellerRecoHrefSuffix = useMemo(() => {
    if (!sellerNavKey) return detailQuerySuffix;
    return `?fromSeller=${encodeURIComponent(sellerNavKey)}`;
  }, [sellerNavKey, detailQuerySuffix]);

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
    if (!activeSellerFeedIds || activeSellerFeedIds.length === 0) return -1;
    return activeSellerFeedIds.indexOf(video.id);
  }, [activeSellerFeedIds, video.id]);

  const sellerPrevId = useMemo(() => {
    if (!activeSellerFeedIds || activeSellerFeedIds.length < 2 || sellerIndex < 0) {
      return null;
    }
    const idx =
      (sellerIndex - 1 + activeSellerFeedIds.length) % activeSellerFeedIds.length;
    return activeSellerFeedIds[idx] ?? null;
  }, [activeSellerFeedIds, sellerIndex]);

  const sellerNextId = useMemo(() => {
    if (!activeSellerFeedIds || activeSellerFeedIds.length < 2 || sellerIndex < 0) {
      return null;
    }
    const idx = (sellerIndex + 1) % activeSellerFeedIds.length;
    return activeSellerFeedIds[idx] ?? null;
  }, [activeSellerFeedIds, sellerIndex]);

  /** 카테고리 진입(from)이 아니면 같은 판매자 목록으로 좌우 이동 (검색·홈 등 포함) */
  const prioritizeSellerFeed =
    sellerHandle.length > 0 ||
    (!fromCategory && Boolean(video.listing?.sellerId?.trim()));

  const navLayoutActive = prioritizeSellerFeed
    ? Boolean(activeSellerFeedIds && activeSellerFeedIds.length > 1)
    : hasCategoryNav;

  const canGoPrev = prioritizeSellerFeed ? Boolean(sellerPrevId) : Boolean(prevVideo);
  const canGoNext = prioritizeSellerFeed ? Boolean(sellerNextId) : Boolean(nextVideo);

  const navBtnDisabledClass =
    "pointer-events-none opacity-40 cursor-default group-hover:scale-100 group-hover:border-white/15 group-hover:bg-black/60 [html[data-theme='light']_&]:group-hover:border-zinc-300 [html[data-theme='light']_&]:group-hover:bg-white/90";

  const showSellerFeedBanner =
    sellerHandle.length > 0 ||
    (!fromCategory && Boolean(sellerNavKey && video.listing?.sellerId));

  const handlePrevNav = useCallback(() => {
    if (prioritizeSellerFeed && sellerPrevId) {
      goToVideoId(sellerPrevId);
      return;
    }
    if (prevVideo) goToVideo(prevVideo);
  }, [prioritizeSellerFeed, sellerPrevId, goToVideoId, prevVideo, goToVideo]);

  const handleNextNav = useCallback(() => {
    if (prioritizeSellerFeed && sellerNextId) {
      goToVideoId(sellerNextId);
      return;
    }
    if (nextVideo) goToVideo(nextVideo);
  }, [prioritizeSellerFeed, sellerNextId, goToVideoId, nextVideo, goToVideo]);

  const desktopNavShell =
    "flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/60 text-zinc-200 shadow-xl backdrop-blur-sm transition-all duration-200 group-hover:border-white/35 group-hover:bg-black/80 group-hover:text-white group-hover:scale-110 [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:bg-white/90 [html[data-theme='light']_&]:text-zinc-700";

  useEffect(() => {
    if (!navLayoutActive) return;
    const onKey = (e: KeyboardEvent) => {
      if (prioritizeSellerFeed) {
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
    navLayoutActive,
    prioritizeSellerFeed,
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
  const [insufficientModal, setInsufficientModal] = useState<{
    required: number;
    balance: number;
  } | null>(null);
  const { internalLikeCount, likedByMe, likeBusy, toggleLike } = useVideoLike({
    videoId: video.id,
    requireAuth,
    onError: () => {
      if (typeof window !== "undefined") {
        window.alert(t("explore.likeFailed"));
      }
    },
  });

  const rankMetrics = useMemo(() => getGridCardMetrics(video), [video]);
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

  const [useNativeVideoControls, setUseNativeVideoControls] = useState(false);
  const [detailVideoPaused, setDetailVideoPaused] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const apply = () => setUseNativeVideoControls(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const toggleDetailVideoPlayback = useCallback(() => {
    const el = detailVideoRef.current;
    if (!el) return;
    if (el.paused) {
      void el.play()
        .then(() => setDetailVideoPaused(false))
        .catch(() => {
          /* autoplay/user-gesture 정책에 막히면 기본 controls에 위임 */
        });
      return;
    }
    el.pause();
    setDetailVideoPaused(true);
  }, []);

  /** 로컬/스테이징에서 토스 없이 스튜디오 UI만 개발할 때 — `.env.local` 에 `NEXT_PUBLIC_DEV_BYPASS_CHECKOUT_TO_STUDIO=1` */
  const devBypassCheckoutToStudio =
    process.env.NEXT_PUBLIC_DEV_BYPASS_CHECKOUT_TO_STUDIO === "1";
  const buyStudioCtaClassName =
    "relative flex w-full min-w-0 items-center justify-center rounded-full border-[3px] border-white/40 bg-transparent px-6 py-3.5 min-h-[52px] text-[16px] font-extrabold tracking-[0.14em] text-white shadow-[0_0_24px_rgba(255,255,255,0.06),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-white/70 hover:bg-white/5 hover:shadow-[0_0_32px_rgba(255,255,255,0.12)] active:scale-[0.99] active:translate-y-0 sm:min-h-[60px] sm:text-[17px] sm:tracking-widest [html[data-theme='light']_&]:border-zinc-900/60 [html[data-theme='light']_&]:text-zinc-900";

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-transparent text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">

      <div className="mx-auto max-w-[1600px] min-w-0 px-2 pb-8 pt-8 sm:px-4 sm:pt-10 lg:px-6">
        <div className="flex flex-col gap-7 lg:flex-row lg:items-start lg:justify-center lg:gap-36">
          {/* 영상 + 좌우 화살표 (데스크톱: 인라인 여백, 모바일: 영상 아래) */}
          <div
            className={`relative min-w-0 lg:-mt-2 ${
              video.orientation === "portrait"
                ? "w-full lg:max-w-none"
                : "w-full lg:flex-1 lg:max-w-4xl"
            }`}
          >
            <div className="flex w-full min-w-0 items-center justify-center gap-3 sm:gap-4 lg:gap-6 xl:gap-8">
              {navLayoutActive ? (
                <button
                  type="button"
                  aria-label={t("explore.prevVideo")}
                  onClick={handlePrevNav}
                  disabled={!canGoPrev}
                  className={`group z-[70] hidden shrink-0 self-center lg:flex ${!canGoPrev ? navBtnDisabledClass : ""}`}
                >
                  <span className={desktopNavShell}>
                    <ChevronLeft className="h-7 w-7" />
                  </span>
                </button>
              ) : (
                <span className="hidden h-14 w-14 shrink-0 lg:block" aria-hidden />
              )}
            <div
              className={`min-w-0 shrink-0 ${
                video.orientation === "portrait"
                  ? "mx-auto w-full max-w-[23rem] lg:mx-0"
                  : "w-full flex-1"
              }`}
            >
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
                  controls={useNativeVideoControls}
                  controlsList="nodownload noplaybackrate noremoteplayback nofullscreen"
                  autoPlay
                  muted
                  loop
                  disablePictureInPicture
                  playsInline
                  preload={isPexelsBlockedVideo || !canLoadDirectVideo ? "none" : "auto"}
                  onContextMenu={(e) => e.preventDefault()}
                  onPlay={() => setDetailVideoPaused(false)}
                  onPause={() => setDetailVideoPaused(true)}
                  onClick={(e) => {
                    e.preventDefault();
                    toggleDetailVideoPlayback();
                  }}
                />
              )}
              {!externalEmbed && !useNativeVideoControls && detailVideoPaused ? (
                <button
                  type="button"
                  className="reel-video-play-overlay absolute inset-0 z-[6] flex items-center justify-center"
                  onClick={(e) => {
                    e.preventDefault();
                    toggleDetailVideoPlayback();
                  }}
                  aria-label={t("explore.player.play")}
                >
                  <span className="flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-full border border-white/25 bg-black/55 text-white shadow-lg backdrop-blur-sm transition active:scale-95">
                    <Play className="ml-1 h-9 w-9 fill-current" aria-hidden />
                  </span>
                </button>
              ) : null}
            </div>
            {navLayoutActive ? (
              <div className="mt-3 flex items-center justify-between gap-3 lg:hidden">
                <button
                  type="button"
                  aria-label={t("explore.prevVideo")}
                  onClick={handlePrevNav}
                  disabled={!canGoPrev}
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/60 text-zinc-200 shadow-lg backdrop-blur-sm [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:bg-white/90 [html[data-theme='light']_&]:text-zinc-700 ${!canGoPrev ? "pointer-events-none opacity-40" : ""}`}
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  aria-label={t("explore.nextVideo")}
                  onClick={handleNextNav}
                  disabled={!canGoNext}
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/60 text-zinc-200 shadow-lg backdrop-blur-sm [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:bg-white/90 [html[data-theme='light']_&]:text-zinc-700 ${!canGoNext ? "pointer-events-none opacity-40" : ""}`}
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </div>
            ) : null}
            </div>
              {navLayoutActive ? (
                <button
                  type="button"
                  aria-label={t("explore.nextVideo")}
                  onClick={handleNextNav}
                  disabled={!canGoNext}
                  className={`group z-[70] hidden shrink-0 self-center lg:flex ${!canGoNext ? navBtnDisabledClass : ""}`}
                >
                  <span className={desktopNavShell}>
                    <ChevronRight className="h-7 w-7" />
                  </span>
                </button>
              ) : (
                <span className="hidden h-14 w-14 shrink-0 lg:block" aria-hidden />
              )}
            </div>
          </div>

          <div className="mx-auto flex w-full min-w-0 max-w-md flex-col items-stretch gap-6 px-3 sm:px-4 lg:max-w-md lg:px-0 lg:pl-3 lg:pt-16">
            <div className="w-full">
              <div className="flex w-full flex-col items-center gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 w-full flex-1 text-center lg:text-left">
                  {showFreshMeta && fresh.label ? (
                    <span className="mb-2 inline-block rounded border border-reels-crimson/35 bg-reels-crimson/10 px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wider text-reels-crimson">
                      {fresh.label}
                    </span>
                  ) : null}
                  <div className="mb-4 flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 lg:justify-start">
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
                    {showSellerFeedBanner ? (
                      <span
                        className="shrink-0 text-[11px] font-extrabold uppercase tracking-[0.2em] text-[color:var(--reels-point)]"
                        role="status"
                      >
                        {t("video.detail.sellerFeedBadge")}
                      </span>
                    ) : null}
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
            <section className="mx-auto w-full max-w-sm">
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

            {/* 가격 표시 (보석) */}
            {price > 0 && (
              <div className="text-center">
                <GemAmount
                  value={toGemPrice(price).toLocaleString()}
                  className="font-black tabular-nums tracking-tight text-[length:calc(36px_+_5pt)] text-white [html[data-theme='light']_&]:text-zinc-900"
                  gapClassName="gap-1"
                  iconClassName="h-[1.05em] w-[1.05em] shrink-0 text-[color:var(--reels-point)]"
                />
              </div>
            )}

            {/* 구매 버튼 — 보석 결제 (모바일 가로 전폭) */}
            <div className="w-full min-w-0">
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
              ) : (
                <CreditPurchaseButton
                  videoId={video.id}
                  priceWon={price}
                  onUnauthorized={openAuthModal}
                  onInsufficientCredits={(required, balance) =>
                    setInsufficientModal({ required, balance })
                  }
                  className={`${buyStudioCtaClassName} disabled:cursor-wait disabled:opacity-40`}
                  disabled={soldOut}
                >
                  {soldOut
                    ? t("video.detail.soldOut")
                    : t("explore.rail.buy")}
                </CreditPurchaseButton>
              )}
            </div>

            {insufficientModal && (
              <InsufficientCreditsModal
                required={insufficientModal.required}
                balance={insufficientModal.balance}
                onClose={() => setInsufficientModal(null)}
              />
            )}

            {/* 액션 아이콘 — 탐색 레일과 동일 실루엣 */}
            <div className="flex w-full items-center justify-center gap-3">
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
        <VideoDetailRecommendations
          video={video}
          detailHrefSuffix={sellerRecoHrefSuffix}
        />
      </div>
    </div>
  );
}

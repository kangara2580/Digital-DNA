"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bookmark, ChevronLeft, ChevronRight, Heart, ShoppingCart } from "lucide-react";
import { AuthPromptModal } from "@/components/AuthPromptModal";
import { VideoSourcePlatformIcon } from "@/components/VideoSourcePlatformIcon";
import { SellerSocialPlatformIcon } from "@/components/SellerSocialPlatformIcon";
import { SellerIdentityLink } from "@/components/SellerIdentityLink";
import { VideoDetailRecommendations } from "@/components/VideoDetailRecommendations";
import { VideoDetailReviewsSection } from "@/components/VideoDetailReviewsSection";
import { TrendingVideoStatsFooter } from "@/components/TrendingVideoStatsFooter";
import { getMetricsForVideoDetail } from "@/data/trendingStats";
import { useDopamineBasket } from "@/context/DopamineBasketContext";
import { useWishlist } from "@/context/WishlistContext";
import { usePurchasedVideos } from "@/context/PurchasedVideosContext";
import { useRecentClips } from "@/context/RecentClipsContext";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useTranslation } from "@/hooks/useTranslation";
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
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { buildAuthCallbackRedirectTo } from "@/lib/authOAuthRedirect";
import { canonicalFavoriteVideoId } from "@/lib/favoriteVideoId";
import { sanitizePosterSrc } from "@/lib/videoPoster";
import type { SellerSocialLink } from "@/lib/sellerSocialLinks";
import { getVideoContentSource } from "@/lib/videoSourcePlatform";

const sellerSocialLinksCache = new Map<string, SellerSocialLink[]>();
const sellerSocialLinksInFlight = new Map<string, Promise<SellerSocialLink[]>>();

async function loadSellerSocialLinks(sellerId: string): Promise<SellerSocialLink[]> {
  const cached = sellerSocialLinksCache.get(sellerId);
  if (cached) return cached;
  const inflight = sellerSocialLinksInFlight.get(sellerId);
  if (inflight) return inflight;

  const req = fetch(
    `/api/sellers/social-links?sellerIds=${encodeURIComponent(sellerId)}`,
    { cache: "no-store" },
  )
    .then(async (res) => {
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        linksBySellerId?: Record<string, SellerSocialLink[]>;
      };
      if (!res.ok || !body.ok) return [];
      const links = Array.isArray(body.linksBySellerId?.[sellerId])
        ? body.linksBySellerId?.[sellerId] ?? []
        : [];
      sellerSocialLinksCache.set(sellerId, links);
      return links;
    })
    .catch(() => [])
    .finally(() => {
      sellerSocialLinksInFlight.delete(sellerId);
    });

  sellerSocialLinksInFlight.set(sellerId, req);
  return req;
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
  const authPromptScrollYRef = useRef(0);
  const { user, loading: authLoading, supabaseConfigured } = useAuthSession();
  const dopamine = useDopamineBasket();
  const { isSaved, toggle: toggleWishlist } = useWishlist();
  const { hasPurchased, markPurchased } = usePurchasedVideos();
  const { recordView } = useRecentClips();
  const { t, locale } = useTranslation();
  const owned = hasPurchased(video.id);
  const isOwner = Boolean(
    user?.id && video.listing?.sellerId && user.id === video.listing.sellerId,
  );
  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [sellerFeedIds, setSellerFeedIds] = useState<string[] | null>(null);

  const requireAuth = useCallback(() => {
    if (authLoading) return false;
    if (!supabaseConfigured || !user) {
      authPromptScrollYRef.current = window.scrollY;
      setAuthPromptOpen(true);
      return false;
    }
    return true;
  }, [authLoading, supabaseConfigured, user]);

  const startGoogleAuth = useCallback(async () => {
    const next =
      typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}${window.location.hash}`
        : "/";
    const redirectTo = buildAuthCallbackRedirectTo(next);
    const supabase = getSupabaseBrowserClient();
    if (supabase && redirectTo) {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: { prompt: "select_account" },
        },
      });
      if (!error && data.url) {
        window.location.assign(data.url);
        return;
      }
    }
    window.location.assign(`/api/auth/google/start?next=${encodeURIComponent(next)}`);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!authPromptOpen) return;
    const scrollY = authPromptScrollYRef.current;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAuthPromptOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      requestAnimationFrame(() => window.scrollTo(0, scrollY));
      window.removeEventListener("keydown", onKey);
    };
  }, [authPromptOpen]);

  useEffect(() => {
    recordView(video.id);
  }, [video.id, recordView]);

  const sellerHandle = useMemo(() => (fromSeller ?? "").trim(), [fromSeller]);

  useEffect(() => {
    const key = sellerHandle;
    if (!key) {
      setSellerFeedIds(null);
      return;
    }
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
  }, [sellerHandle]);

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

  const useSellerFeedNav =
    sellerHandle.length > 0 &&
    sellerFeedIds !== null &&
    sellerFeedIds.length > 1 &&
    sellerIndex >= 0;

  /** 판매자 피드에서 들어왔으면 카테고리 순환 폴백 없음 */
  const prioritizeSellerFeed = sellerHandle.length > 0;

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
  const wishlisted = isSaved(video.id);
  const inCart = dopamine.isVideoInCart(video.id);
  const [wishlistPulse, setWishlistPulse] = useState(false);
  const [likePulse, setLikePulse] = useState(false);
  const [internalLikeCount, setInternalLikeCount] = useState(0);
  const [likedByMe, setLikedByMe] = useState(false);
  const [likeBusy, setLikeBusy] = useState(false);
  const [likeBurst, setLikeBurst] = useState(false);

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
  const [sellerSocialLinks, setSellerSocialLinks] = useState<SellerSocialLink[]>(
    video.sellerSocialLinks ?? [],
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

  useEffect(() => {
    setSellerSocialLinks(video.sellerSocialLinks ?? []);
  }, [video.sellerSocialLinks]);

  useEffect(() => {
    const sellerId = video.listing?.sellerId;
    if (!sellerId || (video.sellerSocialLinks?.length ?? 0) > 0) return;
    let cancelled = false;
    void loadSellerSocialLinks(sellerId).then((links) => {
      if (cancelled) return;
      setSellerSocialLinks(links);
    });
    return () => {
      cancelled = true;
    };
  }, [video.listing?.sellerId, video.sellerSocialLinks]);

  useEffect(() => {
    const sellerId = video.listing?.sellerId;
    if (!sellerId) return;
    const handler = (
      evt: Event,
    ) => {
      const detail = (
        evt as CustomEvent<{
          sellerId?: string;
          links?: SellerSocialLink[];
        }>
      ).detail;
      if (!detail || detail.sellerId !== sellerId || !Array.isArray(detail.links)) return;
      sellerSocialLinksCache.set(sellerId, detail.links);
      setSellerSocialLinks(detail.links);
    };
    window.addEventListener("seller-social-links-updated", handler as EventListener);
    return () => {
      window.removeEventListener("seller-social-links-updated", handler as EventListener);
    };
  }, [video.listing?.sellerId]);

  const loadInternalLikes = useCallback(async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      const session = supabase ? await supabase.auth.getSession() : null;
      const token = session?.data.session?.access_token;
      const headers = token
        ? { Authorization: `Bearer ${token}` }
        : undefined;
      const res = await fetch(
        `/api/video/likes?videoId=${encodeURIComponent(canonicalFavoriteVideoId(video.id))}`,
        {
          cache: "no-store",
          headers,
        },
      );
      if (!res.ok) return;
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        internalLikes?: number;
        likedByMe?: boolean;
      };
      if (!body.ok) return;
      setInternalLikeCount(
        typeof body.internalLikes === "number" ? Math.max(0, body.internalLikes) : 0,
      );
      setLikedByMe(Boolean(body.likedByMe));
    } catch {
      /* ignore */
    }
  }, [video.id]);

  useEffect(() => {
    setInternalLikeCount(0);
    setLikedByMe(false);
    void loadInternalLikes();
  }, [video.id, loadInternalLikes]);

  const toggleInternalLike = useCallback(async () => {
    if (likeBusy || authLoading) return;
    if (!requireAuth()) return;

    const nextLiked = !likedByMe;
    const prevLiked = likedByMe;
    const prevCount = internalLikeCount;
    setLikedByMe(nextLiked);
    setInternalLikeCount((prev) => Math.max(0, prev + (nextLiked ? 1 : -1)));
    setLikePulse(true);
    if (nextLiked) {
      setLikeBurst(true);
      window.setTimeout(() => setLikeBurst(false), 420);
    }
    window.setTimeout(() => setLikePulse(false), 170);
    setLikeBusy(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const session = supabase ? await supabase.auth.getSession() : null;
      const token = session?.data.session?.access_token;
      if (!token) throw new Error("no_token");
      const res = await fetch("/api/video/likes", {
        method: nextLiked ? "POST" : "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ videoId: canonicalFavoriteVideoId(video.id) }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        internalLikes?: number;
        likedByMe?: boolean;
      };
      if (!res.ok || !body.ok) throw new Error("like_toggle_failed");
      if (typeof body.internalLikes === "number") {
        setInternalLikeCount(Math.max(0, body.internalLikes));
      }
      setLikedByMe(Boolean(body.likedByMe));
    } catch {
      setLikedByMe(prevLiked);
      setInternalLikeCount(prevCount);
      void loadInternalLikes();
      if (typeof window !== "undefined") {
        window.alert(t("explore.likeFailed"));
      }
    } finally {
      setLikeBusy(false);
    }
  }, [
    likeBusy,
    authLoading,
    requireAuth,
    likedByMe,
    internalLikeCount,
    video.id,
    loadInternalLikes,
    t,
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
                <div className="absolute inset-0 flex items-center justify-center">
                  <iframe
                    title={video.title}
                    src={externalEmbed.src}
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
                    {sellerSocialLinks.length > 0 ? (
                      <div className="flex items-center gap-1.5">
                        {sellerSocialLinks.slice(0, 4).map((link) => (
                          <a
                            key={`${link.platform}-${link.url}`}
                            href={link.url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/[0.04] text-zinc-300 transition hover:border-reels-cyan/45 hover:text-reels-cyan [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-700"
                            aria-label={t("video.detail.openPlatformLink", {
                              platform: link.platform,
                            })}
                            title={link.url}
                          >
                            <SellerSocialPlatformIcon
                              platform={link.platform}
                              className="h-4 w-4"
                            />
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <h1 className="min-w-0 text-center text-2xl font-extrabold tracking-tight text-zinc-100 sm:text-3xl [html[data-theme='light']_&]:text-zinc-900">
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

            {/* 구매 버튼 */}
            <div className="px-8">
            <button
              type="button"
              disabled={soldOut}
              onClick={() => {
                if (soldOut) return;
                if (!requireAuth()) return;
                if (!owned) markPurchased(video.id);
                router.push(`/create?videoId=${encodeURIComponent(video.id)}`);
              }}
              className="relative w-full h-[60px] rounded-full border-[3px] border-white/40 bg-transparent text-[17px] font-extrabold tracking-widest text-white backdrop-blur-sm shadow-[0_0_24px_rgba(255,255,255,0.06),inset_0_1px_0_rgba(255,255,255,0.12)] transition-all duration-300 hover:border-white/70 hover:bg-white/5 hover:shadow-[0_0_32px_rgba(255,255,255,0.12)] hover:-translate-y-0.5 active:scale-[0.99] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40 [html[data-theme='light']_&]:border-zinc-900/60 [html[data-theme='light']_&]:text-zinc-900"
            >
              {soldOut ? t("video.detail.soldOut") : t("video.detail.buyNow")}
            </button>
            </div>

            {/* 액션 아이콘 */}
            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                title={inCart ? t("explore.rail.cartRemove") : t("explore.rail.cartAdd")}
                onClick={(e) => {
                  if (soldOut) return;
                  if (!requireAuth()) return;
                  dopamine.launchFromCartButton(e.currentTarget, video, posterSrc);
                }}
                className={`inline-flex h-[44px] w-[44px] items-center justify-center rounded-full border border-white/10 bg-white/[0.04] transition-colors hover:border-white/25 hover:text-zinc-100 disabled:opacity-40 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-100 ${
                  inCart
                    ? "border-[var(--reels-point)]/55 text-[var(--reels-point)] hover:border-[var(--reels-point)]/75 [html[data-theme='light']_&]:text-[var(--reels-point)]"
                    : "text-zinc-400 [html[data-theme='light']_&]:text-zinc-600"
                }`}
                disabled={soldOut}
                aria-label={inCart ? t("explore.rail.cartRemove") : t("explore.rail.cartAdd")}
                aria-pressed={inCart}
              >
                <ShoppingCart className="h-[18px] w-[18px]" />
              </button>
              <button
                type="button"
                title={likedByMe ? t("explore.rail.likeUndo") : t("explore.rail.like")}
                onClick={(e) => {
                  e.preventDefault();
                  void toggleInternalLike();
                }}
                className={`relative inline-flex h-[44px] w-[44px] items-center justify-center rounded-full border transition-all duration-200 [html[data-theme='light']_&]:bg-zinc-100 ${
                  likedByMe
                    ? "border-[var(--reels-point)]/60 bg-[var(--reels-point)]/[0.14] text-[var(--reels-point)] [html[data-theme='light']_&]:border-[var(--reels-point)]/45 [html[data-theme='light']_&]:bg-[var(--reels-point)]/[0.10] [html[data-theme='light']_&]:text-[var(--reels-point)]"
                    : "border-white/10 bg-white/[0.04] text-zinc-400 hover:border-white/25 hover:text-zinc-100 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:text-zinc-600"
                } ${likePulse ? "scale-110" : "scale-100"}`}
                aria-label={likedByMe ? t("explore.rail.likeUndo") : t("explore.rail.like")}
                aria-pressed={likedByMe}
                disabled={likeBusy}
              >
                {likeBurst ? (
                  <span className="pointer-events-none absolute inset-0 rounded-full bg-[var(--reels-point)]/30 animate-ping" />
                ) : null}
                <Heart
                  className={`relative z-[1] h-[18px] w-[18px] transition-transform duration-300 ${
                    likedByMe ? "fill-current text-[var(--reels-point)]" : ""
                  } ${likeBurst ? "scale-125" : "scale-100"}`}
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
                  toggleWishlist(video);
                }}
                className={`inline-flex h-[44px] w-[44px] items-center justify-center rounded-full border transition-all duration-200 [html[data-theme='light']_&]:bg-zinc-100 ${
                  wishlisted
                    ? "border-reels-cyan/50 bg-reels-cyan/10 text-reels-cyan"
                    : "border-white/10 bg-white/[0.04] text-zinc-400 hover:border-white/25 hover:text-zinc-100 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:text-zinc-600"
                } ${wishlistPulse ? "scale-110" : "scale-100"}`}
                aria-label={wishlisted ? t("video.detail.wishlistRemove") : t("video.detail.wishlistAdd")}
                aria-pressed={wishlisted}
              >
                <Bookmark className={`h-[18px] w-[18px] ${wishlisted ? "fill-current" : ""}`} />
              </button>
            </div>

          </div>
        </div>

        <VideoDetailReviewsSection videoId={video.id} />
        <VideoDetailRecommendations video={video} />
      </div>
      {mounted ? (
        <AuthPromptModal
          open={authPromptOpen}
          onClose={() => setAuthPromptOpen(false)}
          onGoogleStart={startGoogleAuth}
        />
      ) : null}
    </div>
  );
}

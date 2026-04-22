"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bookmark, Heart, ShoppingCart } from "lucide-react";
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
import type { FeedVideo } from "@/data/videos";
import {
  clonesRemaining,
  getCommerceMeta,
  getFreshnessForVideoId,
  isLimitedFamily,
} from "@/data/videoCommerce";
import {
  getExternalIframeForDetail,
  getExternalLiveStatsPageUrl,
} from "@/lib/externalEmbed/playerUrls";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { sanitizePosterSrc } from "@/lib/videoPoster";
import type { SellerSocialLink, SellerSocialPlatform } from "@/lib/sellerSocialLinks";

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

export function VideoDetailView({ video }: { video: FeedVideo }) {
  const router = useRouter();
  const detailVideoRef = useRef<HTMLVideoElement | null>(null);
  const { user, loading: authLoading, supabaseConfigured } = useAuthSession();
  const dopamine = useDopamineBasket();
  const { isSaved, toggle: toggleWishlist } = useWishlist();
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
  const wishlisted = isSaved(video.id);
  const [wishlistPulse, setWishlistPulse] = useState(false);
  const [likePulse, setLikePulse] = useState(false);
  const [internalLikeCount, setInternalLikeCount] = useState(0);
  const [likedByMe, setLikedByMe] = useState(false);
  const [likeBusy, setLikeBusy] = useState(false);

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
  const [sellerSocialLinks, setSellerSocialLinks] = useState<SellerSocialLink[]>(
    video.sellerSocialLinks ?? [],
  );
  const isPexelsBlockedVideo = /^https?:\/\/videos\.pexels\.com\//i.test(video.src);
  const posterSrc = sanitizePosterSrc(video.poster);
  const externalEmbed = useMemo(
    () => getExternalIframeForDetail(video),
    [video],
  );
  const statsPageUrl = useMemo(
    () => getExternalLiveStatsPageUrl(video),
    [video],
  );
  const externalLikeCount = liveStats?.diggCount ?? rankMetrics.totalLikes;
  const externalLikePlatform = useMemo<SellerSocialPlatform>(() => {
    if (video.tiktokEmbedId) return "tiktok";
    if (video.instagramShortcode) return "instagram";
    if (video.youtubeVideoId) return "youtube";
    return "website";
  }, [video.tiktokEmbedId, video.instagramShortcode, video.youtubeVideoId]);
  const externalLikeLabel = useMemo(() => {
    if (externalLikePlatform === "tiktok") return "TikTok";
    if (externalLikePlatform === "instagram") return "Instagram";
    if (externalLikePlatform === "youtube") return "YouTube";
    return "외부";
  }, [externalLikePlatform]);
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
        `/api/video/likes?videoId=${encodeURIComponent(video.id)}`,
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
    if (!supabaseConfigured || !user) {
      if (typeof window !== "undefined") {
        window.alert("좋아요 기능은 로그인 후 이용할 수 있어요.");
      }
      return;
    }

    const nextLiked = !likedByMe;
    const prevLiked = likedByMe;
    const prevCount = internalLikeCount;
    setLikedByMe(nextLiked);
    setInternalLikeCount((prev) => Math.max(0, prev + (nextLiked ? 1 : -1)));
    setLikePulse(true);
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
        body: JSON.stringify({ videoId: video.id }),
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
        window.alert("좋아요 처리 중 문제가 발생했어요. 다시 시도해 주세요.");
      }
    } finally {
      setLikeBusy(false);
    }
  }, [
    likeBusy,
    authLoading,
    supabaseConfigured,
    user,
    likedByMe,
    internalLikeCount,
    video.id,
    loadInternalLikes,
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
                  onClick={toggleDetailVideoPlayback}
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
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <SellerIdentityLink
                      creator={video.creator}
                      size="compact"
                      className="w-fit"
                    />
                    {sellerSocialLinks.length > 0 ? (
                      <div className="flex items-center gap-1.5">
                        {sellerSocialLinks.slice(0, 4).map((link) => (
                          <a
                            key={`${link.platform}-${link.url}`}
                            href={link.url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/[0.04] text-zinc-300 transition hover:border-reels-cyan/45 hover:text-reels-cyan [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-700"
                            aria-label={`${link.platform} 링크 열기`}
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
            <section className="reels-glass-card rounded-xl border border-white/10 p-3 [html[data-theme='light']_&]:border-zinc-200">
              <div className="flex items-center justify-between text-[12px] font-semibold text-zinc-300 [html[data-theme='light']_&]:text-zinc-700">
                <span className="inline-flex items-center gap-1.5">
                  <SellerSocialPlatformIcon
                    platform={externalLikePlatform}
                    className="h-3.5 w-3.5"
                  />
                  {externalLikeLabel} 외부 좋아요
                </span>
                <span className="text-[18px] font-extrabold leading-none text-cyan-300 [html[data-theme='light']_&]:text-cyan-600">
                  {externalLikeCount.toLocaleString()}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[12px] font-semibold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
                <span className="inline-flex items-center gap-1.5">
                  <Heart className="h-3.5 w-3.5" />
                  릴스마켓 좋아요
                </span>
                <span className="text-[18px] font-extrabold leading-none text-reels-crimson [html[data-theme='light']_&]:text-reels-crimson">
                  {internalLikeCount.toLocaleString()}
                </span>
              </div>
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
                className="h-[48px] w-full min-w-0 flex-1 rounded-full bg-reels-crimson px-5 text-[13px] font-extrabold text-white shadow-reels-crimson transition-[transform,opacity] duration-300 ease-in-out hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 sm:max-w-[min(22rem,calc(100%-7.5rem))]"
              >
                {ctaLabel}
              </button>
              <div className="flex shrink-0 items-center justify-center gap-2 self-center sm:self-stretch">
                <button
                  type="button"
                  title="장바구니 담기"
                  onClick={(e) => {
                    if (soldOut) return;
                    dopamine.launchFromCartButton(e.currentTarget, video, posterSrc);
                  }}
                  className="inline-flex h-[48px] w-[48px] items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-zinc-200 transition-colors hover:border-reels-cyan/40 hover:text-reels-cyan disabled:cursor-not-allowed disabled:opacity-40 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-100 [html[data-theme='light']_&]:text-zinc-800"
                  disabled={soldOut}
                  aria-label="장바구니 담기"
                >
                  <ShoppingCart className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  title={likedByMe ? "좋아요 취소" : "좋아요"}
                  onClick={(e) => {
                    e.preventDefault();
                    void toggleInternalLike();
                  }}
                  className={`inline-flex h-[48px] w-[48px] items-center justify-center rounded-full border border-white/15 bg-white/[0.06] transition-all duration-200 hover:border-reels-crimson/50 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-100 ${
                    likedByMe
                      ? "text-reels-crimson [html[data-theme='light']_&]:text-reels-crimson"
                      : "text-zinc-200 hover:text-reels-crimson [html[data-theme='light']_&]:text-zinc-800"
                  } ${likePulse ? "scale-110" : "scale-100"}`}
                  aria-label={likedByMe ? "좋아요 취소" : "좋아요"}
                  aria-pressed={likedByMe}
                  disabled={likeBusy}
                >
                  <Heart className={`h-5 w-5 ${likedByMe ? "fill-current" : ""}`} />
                </button>
                <button
                  type="button"
                  title={wishlisted ? "찜 해제" : "찜하기"}
                  onClick={(e) => {
                    e.preventDefault();
                    setWishlistPulse(true);
                    window.setTimeout(() => setWishlistPulse(false), 170);
                    toggleWishlist(video);
                  }}
                  className={`inline-flex h-[48px] w-[48px] items-center justify-center rounded-full border border-white/15 bg-white/[0.06] transition-all duration-200 hover:border-reels-cyan/50 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-100 ${
                    wishlisted
                      ? "text-reels-cyan [html[data-theme='light']_&]:text-reels-cyan"
                      : "text-zinc-200 hover:text-reels-cyan [html[data-theme='light']_&]:text-zinc-800"
                  } ${wishlistPulse ? "scale-110" : "scale-100"}`}
                  aria-label={wishlisted ? "찜 해제" : "찜하기"}
                  aria-pressed={wishlisted}
                >
                  <Bookmark
                    className={`h-5 w-5 ${wishlisted ? "fill-current" : ""}`}
                  />
                </button>
              </div>
            </div>

          </div>
        </div>

        <VideoDetailReviewsSection videoId={video.id} />
        <VideoDetailRecommendations video={video} />
      </div>
    </div>
  );
}

"use client";

import { Bookmark, Heart, ShoppingCart, Volume2, VolumeX } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AuthPromptModal } from "@/components/AuthPromptModal";
import { useDopamineBasket } from "@/context/DopamineBasketContext";
import { usePurchasedVideos } from "@/context/PurchasedVideosContext";
import { useWishlist } from "@/context/WishlistContext";
import { getMetricsForVideoDetail } from "@/data/trendingStats";
import {
  clonesRemaining,
  getCommerceMeta,
  isLimitedFamily,
} from "@/data/videoCommerce";
import type { FeedVideo } from "@/data/videos";
import { useAuthSession } from "@/hooks/useAuthSession";
import { buildAuthCallbackRedirectTo } from "@/lib/authOAuthRedirect";
import { safePlayVideo } from "@/lib/safeVideoPlay";
import { sellerProfileHrefFromVideo } from "@/lib/sellerProfile";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { getExternalLiveStatsPageUrl } from "@/lib/externalEmbed/playerUrls";
import { sanitizePosterSrc } from "@/lib/videoPoster";

function formatCompactWon(n: number): string {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  if (n >= 10_000) return `${Math.round(n / 10_000)}만`;
  return `${n.toLocaleString("ko-KR")}원`;
}

function formatCompactCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${(n / 10_000).toFixed(1)}만`;
  if (n >= 1_000) return `${(n / 1000).toFixed(1)}k`;
  return `${n}`;
}

/** 탐색 레일 좋아요 수 — 1k 이상은 k/M 축약 */
function formatLikeCountShortK(n: number): string {
  const v = Math.max(0, Math.floor(n));
  if (v < 1000) return `${v}`;
  if (v < 1_000_000) {
    const k = v / 1000;
    const s = k >= 10 ? k.toFixed(0) : k.toFixed(1);
    return `${s.replace(/\.0$/, "")}k`;
  }
  const m = v / 1_000_000;
  const s = m >= 10 ? m.toFixed(0) : m.toFixed(1);
  return `${s.replace(/\.0$/, "")}M`;
}

type ReelSlideProps = {
  video: FeedVideo;
  scrollRootRef: React.RefObject<HTMLDivElement | null>;
  /** 탐색 세션 전체에서 공유 — 영상 넘겨도 유지 */
  muted: boolean;
  onMutedChange: (muted: boolean) => void;
};

const railBuyButtonClass =
  "relative inline-flex shrink-0 min-h-[40px] items-center justify-center rounded-full border-2 border-white/38 bg-transparent px-3.5 py-1.5 text-[13px] font-extrabold tracking-normal text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-all duration-200 hover:border-white/65 hover:bg-white/[0.06] hover:shadow-[0_0_20px_rgba(255,255,255,0.08)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 [html[data-theme='light']_&]:border-zinc-900/55 [html[data-theme='light']_&]:text-zinc-900";

/** 좋아요 전용 원 — 카트·찜과 시각 무게 맞춤 */
const railLikeCircleBase =
  "inline-flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full border-2 border-white/42 bg-white/[0.06] shadow-[inset_0_1px_3px_rgba(255,255,255,0.08)] transition-all duration-200 hover:border-white/60 hover:bg-white/[0.1] active:scale-[0.94] [html[data-theme='light']_&]:border-zinc-400/60 [html[data-theme='light']_&]:bg-zinc-100";

const railLikeIcon =
  "h-[22px] w-[22px] shrink-0 pointer-events-none [html[data-theme='light']_&]:stroke-zinc-700";

/** 액션 hit 영역 통일 (카트·찜) */
const railActionPlainBtn =
  "inline-flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full border-0 bg-transparent p-0 text-white/92 transition-colors duration-200 hover:text-white active:scale-[0.92] [html[data-theme='light']_&]:text-zinc-600 [html[data-theme='light']_&]:hover:text-zinc-900";

const railActionIcon =
  "h-[21px] w-[21px] shrink-0 pointer-events-none stroke-[2.5] [html[data-theme='light']_&]:stroke-zinc-700";

/** 레일 바깥 패딩만 (테두리 없음) */
const railDeckClass = "shrink-0 pb-6 pt-4";

/** 라벨 (가격 블록·집계 공통 음영) */
const railLabelMuted =
  "font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600";

/** 집계 숫자 */
const railStatNum =
  "text-[13px] font-bold tabular-nums tracking-tight text-zinc-100 [html[data-theme='light']_&]:text-zinc-900";

function RailStatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-0.5 text-center">
      <span className={railLabelMuted}>{label}</span>
      <span className={`${railStatNum} leading-snug`}>{value}</span>
    </div>
  );
}

/** 데스크톱: 틱톡 웹 우측 컬럼 — 마켓 수치 + 바로 장바구니·좋아요·찜 */
function ReelDesktopRail({
  video,
  className,
}: {
  video: FeedVideo;
  className?: string;
}) {
  const router = useRouter();
  const dopamine = useDopamineBasket();
  const { isSaved, toggle: toggleWishlist } = useWishlist();
  const { hasPurchased, markPurchased } = usePurchasedVideos();
  const { user, loading: authLoading, supabaseConfigured } = useAuthSession();
  const owned = hasPurchased(video.id);

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

  const meta = useMemo(
    () =>
      video.listing
        ? { salesCount: video.listing.salesCount, edition: "open" as const }
        : getCommerceMeta(video.id),
    [video],
  );
  const statsPageUrl = useMemo(
    () =>
      process.env.NODE_ENV !== "production" && video.tiktokEmbedId
        ? null
        : getExternalLiveStatsPageUrl(video),
    [video],
  );

  const [liveStats, setLiveStats] = useState<{ playCount: number; diggCount: number } | null>(
    null,
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
        const j = (await res.json().catch(() => ({}))) as {
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
        setLiveStats({ playCount: j.playCount, diggCount: j.diggCount });
      } catch {
        /* ignore */
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

  const displayedViews = liveStats?.playCount ?? rankMetrics.totalViews;
  const externalLikeCount = liveStats?.diggCount ?? rankMetrics.totalLikes;

  const remaining = clonesRemaining(meta);
  const soldOut = remaining === 0 && isLimitedFamily(meta.edition);
  const wishlisted = isSaved(video.id);
  const posterSrc = sanitizePosterSrc(video.poster);

  const authPromptScrollYRef = useRef(0);
  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [internalLikeCount, setInternalLikeCount] = useState(0);
  const [likedByMe, setLikedByMe] = useState(false);
  const likeInFlightRef = useRef(false);
  const [likePulse, setLikePulse] = useState(false);
  const [likeBurst, setLikeBurst] = useState(false);
  const [wishlistPulse, setWishlistPulse] = useState(false);

  const displayedLikeTotal = Math.max(0, externalLikeCount + internalLikeCount);

  const requireAuth = useCallback(() => {
    if (authLoading) return false;
    if (!supabaseConfigured || !user) {
      authPromptScrollYRef.current =
        typeof window !== "undefined" ? window.scrollY : 0;
      setAuthPromptOpen(true);
      return false;
    }
    return true;
  }, [authLoading, supabaseConfigured, user]);

  const onBuyClick = useCallback(() => {
    if (soldOut || authLoading) return;
    if (!requireAuth()) return;
    if (!owned) markPurchased(video.id);
    router.push(`/create?videoId=${encodeURIComponent(video.id)}`);
  }, [
    authLoading,
    owned,
    markPurchased,
    requireAuth,
    router,
    soldOut,
    video.id,
  ]);

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
        { cache: "no-store", headers },
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
    if (authLoading) return;
    if (!requireAuth()) return;
    if (likeInFlightRef.current) return;

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

    likeInFlightRef.current = true;
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
      likeInFlightRef.current = false;
    }
  }, [
    authLoading,
    requireAuth,
    likedByMe,
    internalLikeCount,
    video.id,
    loadInternalLikes,
  ]);

  return (
    <aside
      className={`${railDeckClass} flex w-[min(7rem,16.5vw)] shrink-0 flex-col items-center gap-4 [html[data-theme='light']_&]:text-zinc-900 ${className ?? ""}`}
      aria-label="판매·반응 정보"
    >
      <div className="flex w-full flex-col items-center gap-2.5" aria-label="집계 수치">
        <RailStatRow label="수익" value={formatCompactWon(rankMetrics.cumulativeRevenueWon)} />
        <RailStatRow label="조회수" value={formatCompactCount(displayedViews)} />
        <RailStatRow label="구매" value={meta.salesCount.toLocaleString("ko-KR")} />
      </div>

      <div className="flex flex-col items-center gap-1 text-center">
        <span className={railLabelMuted}>가격</span>
        {video.priceWon != null ? (
          <span className="text-[15px] font-extrabold tabular-nums tracking-tight text-[#9DB9FF]">
            {video.priceWon.toLocaleString("ko-KR")}
          </span>
        ) : (
          <span className={`${railStatNum} text-zinc-500`}>—</span>
        )}
      </div>

      {soldOut ? (
        <span
          className={`inline-flex cursor-not-allowed opacity-45 ${railBuyButtonClass}`}
          aria-disabled
        >
          품절
        </span>
      ) : (
        <button type="button" onClick={onBuyClick} className={railBuyButtonClass}>
          구매
        </button>
      )}

      <div role="group" aria-label="작업" className="flex w-full flex-col items-center gap-2.5">
        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            title={likedByMe ? "좋아요 취소" : "좋아요"}
            onClick={(e) => {
              e.preventDefault();
              void toggleInternalLike();
            }}
            className={`relative ${railLikeCircleBase} ${
              likedByMe
                ? "!border-[#7aa6f0]/85 !bg-[#121c33] !shadow-[inset_0_1px_6px_rgba(122,166,240,0.15)] hover:!border-[#9bbaf5]"
                : ""
            } ${likePulse ? "scale-105" : "scale-100"}`}
            aria-label={likedByMe ? "좋아요 취소" : "좋아요"}
            aria-pressed={likedByMe}
          >
            {likeBurst ? (
              <span className="pointer-events-none absolute inset-0 rounded-full bg-[#79adff]/30 animate-ping" />
            ) : null}
            <Heart
              strokeWidth={2.5}
              className={`relative z-[1] ${railLikeIcon} transition-transform duration-300 ${
                likedByMe
                  ? "fill-current stroke-[#a8c9ff] text-[#a8c9ff]"
                  : "stroke-white/95"
              } ${likeBurst ? "scale-110" : "scale-100"} [html[data-theme='light']_&]:stroke-zinc-700 ${likedByMe ? "[html[data-theme='light']_&]:stroke-sky-500 [html[data-theme='light']_&]:fill-sky-400/90" : ""}`}
            />
          </button>
          <span className="font-mono text-[12px] font-bold tabular-nums text-zinc-200 [html[data-theme='light']_&]:text-zinc-800">
            {formatLikeCountShortK(displayedLikeTotal)}
          </span>
        </div>

        <button
          type="button"
          title="장바구니 담기"
          onClick={(e) => {
            if (soldOut) return;
            if (!requireAuth()) return;
            dopamine.launchFromCartButton(e.currentTarget, video, posterSrc ?? undefined);
          }}
          className={`${railActionPlainBtn} disabled:cursor-not-allowed disabled:opacity-40`}
          disabled={soldOut}
          aria-label="장바구니 담기"
        >
          <ShoppingCart strokeWidth={2.5} className={`${railActionIcon} stroke-current`} />
        </button>
        <button
          type="button"
          title={wishlisted ? "찜 해제" : "찜하기"}
          onClick={(e) => {
            e.preventDefault();
            if (!requireAuth()) return;
            setWishlistPulse(true);
            window.setTimeout(() => setWishlistPulse(false), 170);
            toggleWishlist(video);
          }}
          className={`${railActionPlainBtn} ${
            wishlisted ? "!text-reels-cyan hover:!text-reels-cyan" : ""
          } ${wishlistPulse ? "scale-[1.05]" : "scale-100"}`}
          aria-label={wishlisted ? "찜 해제" : "찜하기"}
          aria-pressed={wishlisted}
        >
          <Bookmark
            strokeWidth={2.5}
            className={`${railActionIcon} stroke-current ${wishlisted ? "fill-current" : ""}`}
          />
        </button>
      </div>

      {mounted ? (
        <AuthPromptModal
          open={authPromptOpen}
          onClose={() => setAuthPromptOpen(false)}
          onGoogleStart={startGoogleAuth}
        />
      ) : null}
    </aside>
  );
}

/** 모바일: 하단 한 줄 요약 (쇼츠·릴스 하단 메타와 유사) */
function ReelMobileCommerceBar({ video }: { video: FeedVideo }) {
  const metrics = useMemo(() => getMetricsForVideoDetail(video.id), [video.id]);
  const commerce = useMemo(() => getCommerceMeta(video.id), [video.id]);

  return (
    <div className="flex shrink-0 items-center justify-between gap-2 border-t border-white/10 bg-black/50 px-3 py-2.5 backdrop-blur-md [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white/90">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-bold text-zinc-300 [html[data-theme='light']_&]:text-zinc-700">
          수익 {formatCompactWon(metrics.cumulativeRevenueWon)} · 구매{" "}
          {commerce.salesCount.toLocaleString("ko-KR")}
        </p>
        <p className="truncate font-mono text-[10px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
          조회 {formatCompactCount(metrics.totalViews)} · 반응 {formatCompactCount(metrics.totalLikes)}
        </p>
      </div>
      <span className="shrink-0 rounded-full border border-reels-cyan/30 bg-reels-cyan/10 px-3 py-1.5 text-[11px] font-bold text-reels-cyan">
        재생 중
      </span>
    </div>
  );
}

export function ExploreReelSlide({
  video,
  scrollRootRef,
  muted,
  onMutedChange,
}: ReelSlideProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const blockRef = useRef<HTMLDivElement>(null);
  const progressRailRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [volume, setVolume] = useState(0.75);
  const [volumeUiVisible, setVolumeUiVisible] = useState(false);
  const previewSrc = video.previewSrc ?? video.src;
  const isPexelsBlockedVideo = /^https?:\/\/videos\.pexels\.com\//i.test(previewSrc);
  const posterSrc = sanitizePosterSrc(video.poster);
  const posterFallback =
    posterSrc ?? (video.poster?.trim() || undefined);
  const sellerHref = useMemo(() => sellerProfileHrefFromVideo(video), [video]);

  useEffect(() => {
    const block = blockRef.current;
    const root = scrollRootRef.current;
    if (!block) return;

    const io = new IntersectionObserver(
      (entries) => {
        const el = videoRef.current;
        if (!el) return;
        const e = entries[0];
        if (!e) return;
        if (e.isIntersecting && e.intersectionRatio >= 0.38) {
          safePlayVideo(el);
        } else {
          try {
            el.pause();
          } catch {
            /* noop */
          }
        }
      },
      { root: root ?? undefined, threshold: [0, 0.35, 0.55, 0.85, 1] },
    );
    io.observe(block);
    return () => io.disconnect();
  }, [scrollRootRef, video.id]);

  const onTimeUpdate = useCallback(() => {
    if (isScrubbing) return;
    const el = videoRef.current;
    if (!el?.duration) return;
    setProgress(el.currentTime / el.duration);
  }, [isScrubbing]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    let rafId = 0;
    const sync = () => {
      if (!isScrubbing && el.duration) {
        setProgress(el.currentTime / el.duration);
      }
      if (!el.paused && !el.ended) {
        rafId = window.requestAnimationFrame(sync);
      }
    };
    const onPlay = () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(sync);
    };
    const onPauseLike = () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      rafId = 0;
    };
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPauseLike);
    el.addEventListener("ended", onPauseLike);
    if (!el.paused && !el.ended) onPlay();
    return () => {
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPauseLike);
      el.removeEventListener("ended", onPauseLike);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [isScrubbing]);

  const toggleMute = useCallback(() => {
    setVolumeUiVisible(true);
    onMutedChange(!muted);
  }, [muted, onMutedChange]);

  const onVolumeChange = useCallback(
    (nextValue: number) => {
      const safe = Number.isFinite(nextValue) ? Math.min(1, Math.max(0, nextValue)) : 0;
      setVolume(safe);
      setVolumeUiVisible(true);
      onMutedChange(safe <= 0.001);
    },
    [onMutedChange],
  );

  const togglePlayPause = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      safePlayVideo(el);
      return;
    }
    try {
      el.pause();
    } catch {
      /* noop */
    }
  }, []);

  const syncProgressFromVideo = useCallback(() => {
    const el = videoRef.current;
    if (!el?.duration) return;
    setProgress(el.currentTime / el.duration);
  }, []);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.volume = volume;
    el.muted = muted;
  }, [muted, volume]);

  const seekByClientX = useCallback((clientX: number) => {
    const rail = progressRailRef.current;
    const el = videoRef.current;
    if (!rail || !el?.duration) return;
    const rect = rail.getBoundingClientRect();
    if (rect.width <= 0) return;
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    setProgress(ratio);
    el.currentTime = ratio * el.duration;
  }, []);

  useEffect(() => {
    if (!isScrubbing) return;
    const onPointerMove = (e: PointerEvent) => seekByClientX(e.clientX);
    const onPointerUp = () => {
      setIsScrubbing(false);
    };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [isScrubbing, seekByClientX]);

  useEffect(() => {
    if (!volumeUiVisible) return;
    const timer = window.setTimeout(() => {
      setVolumeUiVisible(false);
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [volumeUiVisible, muted, volume]);

  return (
    <div
      ref={blockRef}
      className="flex h-[calc(100dvh-var(--header-height,4.5rem))] w-full shrink-0 snap-start snap-always flex-col bg-[#050508] [html[data-theme='light']_&]:bg-zinc-100"
    >
      <div className="flex min-h-0 w-full flex-1 items-center justify-center px-2 pt-2 md:px-4 md:pt-0">
        {/*
          영상 열에 명시적 max-width를 두어 aspect-[9/16] + w-full 이 0으로 무너지지 않게 함.
          레일은 같은 flex 줄에서 영상 바로 옆에만 붙음(가운데 단독 정렬 방지).
        */}
        <div className="flex w-full max-w-[min(56rem,calc(100vw-var(--reels-rail-w,0px)-1.5rem))] flex-row items-center justify-center gap-1 md:gap-1.5 lg:gap-2">
          <div className="relative w-[min(100%,min(420px,calc(100vw-var(--reels-rail-w,0px)-16rem)))] shrink-0">
            <div
              className="relative aspect-[9/16] w-full max-h-[min(78dvh,calc(100dvh-var(--header-height)-7rem))] overflow-hidden rounded-2xl border border-white/12 bg-black shadow-[0_24px_80px_-30px_rgba(0,0,0,0.85)] md:max-h-[min(92dvh,calc(100dvh-var(--header-height)-2rem))] [html[data-theme='light']_&]:border-zinc-200"
            >
            <video
              ref={videoRef}
              className="absolute inset-0 z-0 h-full w-full cursor-pointer object-cover"
              poster={posterFallback || undefined}
              src={isPexelsBlockedVideo ? undefined : previewSrc}
              muted={muted}
              playsInline
              loop
              preload={isPexelsBlockedVideo ? "none" : "metadata"}
              onTimeUpdate={onTimeUpdate}
              onLoadedMetadata={syncProgressFromVideo}
              onCanPlay={syncProgressFromVideo}
              onClick={togglePlayPause}
            />
            <div
              className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-black/85 via-black/10 to-black/35"
              aria-hidden
            />

            <button
              type="button"
              onClick={toggleMute}
              className="pointer-events-auto absolute right-3 top-3 z-[3] flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/45 text-white backdrop-blur-md transition hover:bg-black/60"
              aria-label={muted ? "소리 켜기" : "음소거"}
            >
              {muted ? (
                <VolumeX className="h-4 w-4" strokeWidth={2} aria-hidden />
              ) : (
                <Volume2 className="h-4 w-4" strokeWidth={2} aria-hidden />
              )}
            </button>
            {volumeUiVisible ? (
              <div className="pointer-events-auto absolute right-[0.7rem] top-[3.6rem] z-[3] flex h-28 w-9 items-center justify-center rounded-full border border-white/15 bg-black/45 backdrop-blur-md">
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={muted ? 0 : volume}
                  onChange={(e) => onVolumeChange(e.currentTarget.valueAsNumber)}
                  className="h-6 w-20 -rotate-90 cursor-pointer appearance-none bg-transparent [&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-white/30 [&::-webkit-slider-thumb]:-mt-[5px] [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#9DB9FF] [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(157,185,255,0.85)] [&::-moz-range-track]:h-1.5 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-white/30 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-[#9DB9FF]"
                  aria-label="볼륨 조절"
                />
              </div>
            ) : null}

            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] space-y-2 p-4 pb-5">
              <Link
                href={sellerHref}
                className="pointer-events-auto inline-flex text-[13px] font-semibold text-white/90 underline-offset-2 hover:text-reels-cyan hover:underline"
              >
                {video.creator}
              </Link>
              <p className="line-clamp-3 text-left text-[15px] font-bold leading-snug text-white sm:text-[16px]">
                {video.title}
              </p>
            </div>

            {/* 진행 바 (틱톡 스타일) */}
            <div
              ref={progressRailRef}
              className="pointer-events-auto absolute inset-x-0 bottom-0 z-[4] h-[5px] cursor-ew-resize bg-transparent"
              onPointerDown={(e) => {
                setIsScrubbing(true);
                seekByClientX(e.clientX);
              }}
              aria-label="재생 구간 이동"
              role="slider"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round((progress || 0) * 100)}
            >
              <div
                className="h-full rounded-r-full"
                style={{
                  width: `${progress > 0 ? Math.max(0.8, Math.min(100, progress * 100)) : 0}%`,
                  background:
                    "linear-gradient(90deg, #7F8FA8 0%, #F4F2E8 38%, #D6DFEE 66%, #8C9DB8 100%)",
                  boxShadow: "0 0 10px rgba(214,223,238,0.45)",
                  transition: isScrubbing ? "none" : "width 90ms linear",
                }}
              />
            </div>
          </div>
          </div>

          <ReelDesktopRail video={video} className="hidden shrink-0 md:flex" />
        </div>
      </div>

      <div className="md:hidden">
        <ReelMobileCommerceBar video={video} />
      </div>
    </div>
  );
}

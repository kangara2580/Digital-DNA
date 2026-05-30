"use client";

import {
  Eye,
  Heart,
  ShoppingBag,
  ShoppingCart,
  TrendingUp,
  Play,
  Volume2,
  VolumeX,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AuthPromptModal } from "@/components/AuthPromptModal";
import { BookmarkButton } from "@/components/BookmarkButton";
import { useDopamineBasket } from "@/context/DopamineBasketContext";
import { usePurchasedVideos } from "@/context/PurchasedVideosContext";
import { getGridCardMetrics } from "@/data/trendingStats";
import {
  clonesRemaining,
  getCommerceMeta,
  isLimitedFamily,
} from "@/data/videoCommerce";
import type { FeedVideo } from "@/data/videos";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useVideoCartAction } from "@/hooks/useVideoCartAction";
import { useVideoLike } from "@/hooks/useVideoLike";
import { buildAuthCallbackRedirectTo } from "@/lib/authOAuthRedirect";
import { safePlayVideo } from "@/lib/safeVideoPlay";
import { sellerProfileHrefFromVideo } from "@/lib/sellerProfile";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { getExternalLiveStatsPageUrl } from "@/lib/externalEmbed/playerUrls";
import {
  explorePurchaseButtonClass,
  explorePurchaseButtonMobileClass,
} from "@/lib/explorePurchaseButtonClass";
import { GemAmount } from "@/components/PaymentDiamondIcon";
import {
  EXPLORE_RAIL_ACTION_BTN,
  EXPLORE_RAIL_ACTION_BTN_ACTIVE_TINT,
  EXPLORE_RAIL_ACTION_ICON,
  EXPLORE_RAIL_ACTION_ICON_FILLED,
} from "@/lib/exploreRailActionTokens";
import {
  revenueTrendDeltaGlyphClass,
  revenueTrendDownClass,
  revenueTrendUpClass,
} from "@/lib/revenueDisplayTokens";
import { sanitizePosterSrc } from "@/lib/videoPoster";
import { VideoSourcePlatformIcon } from "@/components/VideoSourcePlatformIcon";
import { getVideoContentSource } from "@/lib/videoSourcePlatform";
import { getExploreFormatters } from "@/lib/exploreLocaleFormat";
import { toGemPrice } from "@/lib/gemPrice";
import { useTranslation } from "@/hooks/useTranslation";
import { useVideoDisplayTitle } from "@/hooks/useVideoDisplayTitle";
import { SellerSocialLinkIcons } from "@/components/SellerSocialLinkIcons";
import { useSellerSocialLinks } from "@/hooks/useSellerSocialLinks";

type ReelSlideProps = {
  video: FeedVideo;
  scrollRootRef: React.RefObject<HTMLDivElement | null>;
  /** 탐색 세션 전체에서 공유 — 영상 넘겨도 유지 */
  muted: boolean;
  onMutedChange: (muted: boolean) => void;
};

/** 레일 바깥 패딩만 (테두리 없음) */
const railDeckClass = "shrink-0 pb-6 pt-4";

/** 행: 메인 아이콘 36px 박스 · 수익 줄 ▼는 옆 고정 칸(조회 등과 세로 정렬) */
const railExploreRow =
  "flex w-max max-w-full items-center gap-2 py-2.5 [html[data-theme='light']_&]:text-zinc-900";

/** 수치: 고정폭 유지 + 왼쪽 정렬 */
const railExploreStatValueCol =
  "inline-flex min-h-[1.4em] w-[11rem] shrink-0 items-center justify-start tabular-nums text-left sm:w-[12.25rem]";

/** 탐색 레일 구매 버튼 (가격 블록과 분리) — `explorePurchaseButtonClass` */
const railExploreBuyButtonClass = explorePurchaseButtonClass;

const railStatValueWhite =
  "text-[14px] font-semibold tabular-nums text-white [html[data-theme='light']_&]:text-zinc-900";

/** 모바일 탐색 — 아이콘 위 · Compact 숫자 아래 (#B3B3B3 톤) */
const reelMobileStatValueClass =
  "text-[11px] font-semibold tabular-nums text-[#B3B3B3]/90 [html[data-theme='light']_&]:text-zinc-500/85";

function ReelMobileMetricStack({
  icon,
  value,
  "aria-label": ariaLabel,
}: {
  icon: React.ReactNode;
  value: string;
  "aria-label"?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5" aria-label={ariaLabel}>
      <span className="flex h-8 w-8 items-center justify-center text-white/85 [&_svg]:h-[20px] [&_svg]:w-[20px] [html[data-theme='light']_&]:text-zinc-600">
        {icon}
      </span>
      <span className={reelMobileStatValueClass}>{value}</span>
    </div>
  );
}

function ReelMobileRevenueMetric({
  value,
  revenueUp,
  "aria-label": ariaLabel,
}: {
  value: string;
  revenueUp: boolean;
  "aria-label"?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5" aria-label={ariaLabel}>
      <span className="flex flex-col items-center justify-center text-white/85">
        <TrendingUp strokeWidth={2.25} className="h-[18px] w-[18px] shrink-0" aria-hidden />
        <span
          className={`${revenueTrendDeltaGlyphClass} mt-0.5 text-[10px] font-bold leading-none ${
            revenueUp ? revenueTrendUpClass : revenueTrendDownClass
          }`}
          aria-hidden
        >
          {revenueUp ? "▲" : "▼"}
        </span>
      </span>
      <span className={reelMobileStatValueClass}>{value}</span>
    </div>
  );
}

/** TikTok형 — 아이콘 + 숫자(선택) */
const reelMobileActionColClass =
  "flex flex-col items-center gap-0.5 border-0 bg-transparent p-0 text-white/90 transition active:scale-95 [html[data-theme='light']_&]:text-zinc-800";

function ReelExploreStatLine({
  icon,
  iconAdornment,
  value,
  valueClassName,
  valueColClassName = railExploreStatValueCol,
  as = "div",
  onClick,
  "aria-label": ariaLabel,
  "aria-pressed": ariaPressed,
}: {
  icon: React.ReactNode;
  iconAdornment?: React.ReactNode;
  value: string;
  valueClassName: string;
  valueColClassName?: string;
  as?: "div" | "button";
  onClick?: () => void;
  "aria-label"?: string;
  "aria-pressed"?: boolean | "mixed";
}) {
  const Body = (
    <>
      <span className="flex shrink-0 items-center gap-1">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center text-white/[0.78] [&_svg]:h-[20px] [&_svg]:w-[20px] [html[data-theme='light']_&]:text-zinc-600">
          {icon}
        </span>
        <span
          className="flex h-9 w-3 shrink-0 items-center justify-center"
          aria-hidden={iconAdornment ? undefined : true}
        >
          {iconAdornment ?? <span className="block w-3" />}
        </span>
      </span>
      <span className={`${valueColClassName} ${valueClassName}`}>{value}</span>
    </>
  );
  if (as === "button" && onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        aria-pressed={ariaPressed}
        className={`${railExploreRow} rounded-lg text-left transition hover:bg-white/[0.06] active:scale-[0.99] [html[data-theme='light']_&]:hover:bg-zinc-200/60`}
      >
        {Body}
      </button>
    );
  }
  return (
    <div className={railExploreRow} {...(ariaLabel ? { "aria-label": ariaLabel } : {})}>
      {Body}
    </div>
  );
}

type ExploreReelSidebarMetrics = {
  rankMetrics: {
    cumulativeRevenueWon: number;
    totalViews: number;
    totalLikes: number;
    growthPercent: number;
  };
  meta:
    | { salesCount: number; edition: "open" }
    | ReturnType<typeof getCommerceMeta>;
  displayedViews: number;
  externalLikeCount: number;
};

function useExploreReelSidebarMetrics(video: FeedVideo): ExploreReelSidebarMetrics {
  const rankMetrics = useMemo(() => getGridCardMetrics(video), [video]);

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

  return { rankMetrics, meta, displayedViews, externalLikeCount };
}

/** 데스크톱: 틱톡 웹 우측 컬럼 — 집계·가격·구매·액션 */
function ReelDesktopRail({
  video,
  sidebarMetrics,
  className,
  mobileOverlay = false,
}: {
  video: FeedVideo;
  sidebarMetrics: ExploreReelSidebarMetrics;
  className?: string;
  /** 모바일: 영상 위 우측 오버레이(하단 텍스트 바 대신) */
  mobileOverlay?: boolean;
}) {
  const router = useRouter();
  const dopamine = useDopamineBasket();
  const { hasPurchased } = usePurchasedVideos();
  const { user, loading: authLoading, supabaseConfigured } = useAuthSession();
  const owned = hasPurchased(video.id);

  const { rankMetrics, meta, displayedViews, externalLikeCount } = sidebarMetrics;

  const { t, locale } = useTranslation();
  const fmt = useMemo(() => getExploreFormatters(locale), [locale]);

  const remaining = clonesRemaining(meta);
  const soldOut = remaining === 0 && isLimitedFamily(meta.edition);
  const posterSrc = sanitizePosterSrc(video.poster);

  const authPromptScrollYRef = useRef(0);
  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [likePulse, setLikePulse] = useState(false);
  const [likeBurst, setLikeBurst] = useState(false);

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
  const { inCart, toggleCartFromButton } = useVideoCartAction(video, dopamine, requireAuth);
  const { internalLikeCount, likedByMe, likeBusy, toggleLike } = useVideoLike({
    videoId: video.id,
    requireAuth,
    onError: () => {
      if (typeof window !== "undefined") {
        window.alert(t("explore.likeFailed"));
      }
    },
  });
  const displayedLikeTotal = Math.max(0, externalLikeCount + internalLikeCount);
  const sellerSocialLinks = useSellerSocialLinks(
    video.listing?.sellerId,
    video.sellerSocialLinks,
  );

  const onBuyClick = useCallback(() => {
    if (soldOut || authLoading) return;
    if (!requireAuth()) return;
    router.push(
      owned
        ? `/create?videoId=${encodeURIComponent(video.id)}`
        : `/video/${encodeURIComponent(video.id)}`,
    );
  }, [
    authLoading,
    owned,
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

  const revenueUp = rankMetrics.growthPercent >= 0;

  const revRounded = Math.round(Math.max(0, rankMetrics.cumulativeRevenueWon));
  const revAriaVal = revRounded.toLocaleString(fmt.numberLocale);

  if (mobileOverlay) {
    const revNums = fmt.formatCompactCount(revRounded);
    const viewsStr = fmt.formatCompactCount(displayedViews);
    const likesStr = fmt.formatCompactCount(displayedLikeTotal);
    const salesStr = fmt.formatCompactCount(meta.salesCount);
    return (
      <>
        <aside
          className={`pointer-events-none absolute bottom-[max(2.75rem,calc(var(--mobile-bottom-nav-h,0px)+0.5rem))] right-2.5 top-14 z-30 flex w-11 flex-col items-center justify-end gap-3 md:hidden ${className ?? ""}`}
          aria-label={t("explore.rail.metricsAside")}
        >
          <div
            className="pointer-events-auto flex w-full flex-col items-center gap-3"
            aria-label={t("explore.rail.statsGroup")}
          >
            <ReelMobileRevenueMetric
              value={revNums}
              revenueUp={revenueUp}
              aria-label={t("explore.rail.revenueAria", { v: revAriaVal })}
            />
            <ReelMobileMetricStack
              icon={<Eye strokeWidth={2.25} className="shrink-0" />}
              value={viewsStr}
              aria-label={t("explore.rail.viewsAria", { v: viewsStr })}
            />
            <ReelMobileMetricStack
              icon={<ShoppingBag strokeWidth={2.25} className="shrink-0" />}
              value={salesStr}
              aria-label={t("explore.rail.purchasesAria", { n: salesStr })}
            />
          </div>

          <div
            role="group"
            aria-label={t("explore.rail.actions")}
            className="pointer-events-auto flex w-full flex-col items-center gap-3"
          >
            <button
              type="button"
              title={inCart ? t("explore.rail.cartRemove") : t("explore.rail.cartAdd")}
              onClick={(e) => {
                if (soldOut) return;
                if (!requireAuth()) return;
                toggleCartFromButton(e.currentTarget, posterSrc ?? undefined);
              }}
              className={`${reelMobileActionColClass} disabled:opacity-40`}
              disabled={soldOut}
              aria-label={inCart ? t("explore.rail.cartRemove") : t("explore.rail.cartAdd")}
              aria-pressed={inCart}
            >
              <ShoppingCart
                strokeWidth={2.25}
                className={`h-[26px] w-[26px] ${inCart ? "stroke-[var(--reels-point)] fill-[var(--reels-point)]" : "stroke-current"}`}
              />
            </button>

            <button
              type="button"
              title={likedByMe ? t("explore.rail.likeUndo") : t("explore.rail.like")}
              onClick={(e) => {
                e.preventDefault();
                void toggleInternalLike();
              }}
              className={`${reelMobileActionColClass} relative ${likedByMe ? "text-[var(--reels-point)]" : ""}`}
              aria-label={likedByMe ? t("explore.rail.likeUndo") : t("explore.rail.like")}
              aria-pressed={likedByMe}
            >
              {likeBurst ? (
                <span className="pointer-events-none absolute inset-0 rounded-full bg-[var(--reels-point)]/28 animate-ping" />
              ) : null}
              <Heart
                strokeWidth={2.25}
                className={`relative z-[1] h-[26px] w-[26px] transition-transform ${
                  likedByMe
                    ? "fill-[var(--reels-point)] stroke-[var(--reels-point)]"
                    : "stroke-current"
                } ${likePulse || likeBurst ? "scale-110" : "scale-100"}`}
              />
              <span className="text-[11px] font-semibold tabular-nums text-white/90 [html[data-theme='light']_&]:text-zinc-800">
                {likesStr}
              </span>
            </button>

            <BookmarkButton
              video={video}
              beforeToggle={requireAuth}
              buttonClassNameBase={reelMobileActionColClass}
              buttonClassWhenBookmarked="text-[var(--reels-point)]"
              iconClassWhenBookmarked="h-[26px] w-[26px] stroke-[var(--reels-point)] fill-[var(--reels-point)]"
              iconClassWhenDefault="h-[26px] w-[26px] stroke-current"
            />
          </div>
        </aside>

        {mounted ? (
          <AuthPromptModal
            open={authPromptOpen}
            onClose={() => setAuthPromptOpen(false)}
            onGoogleStart={startGoogleAuth}
          />
        ) : null}
      </>
    );
  }

  const revNums = revRounded.toLocaleString(fmt.numberLocale);
  const viewsStr = fmt.formatViewCountRail(displayedViews);
  const likesStr = fmt.formatLikeApprox(displayedLikeTotal);
  const salesStr = meta.salesCount.toLocaleString(fmt.numberLocale);

  return (
    <aside
      className={`${railDeckClass} flex w-max max-w-[min(15rem,38vw)] shrink-0 flex-col items-center gap-5 px-2 [html[data-theme='light']_&]:text-zinc-900 ${className ?? ""}`}
      aria-label={t("explore.rail.metricsAside")}
    >
      <div
        className="flex flex-col items-center pl-9 sm:pl-10"
        aria-label={t("explore.rail.statsGroup")}
      >
        <ReelExploreStatLine
          icon={<TrendingUp strokeWidth={2.25} className="shrink-0" />}
          iconAdornment={
            <span
              className={`${revenueTrendDeltaGlyphClass} flex h-[12px] min-w-[1.15rem] items-center justify-center text-[12px] font-semibold leading-none ${
                revenueUp ? revenueTrendUpClass : revenueTrendDownClass
              }`}
              aria-hidden
            >
              {revenueUp ? "▲" : "▼"}
            </span>
          }
          value={revNums}
          valueClassName={railStatValueWhite}
          aria-label={t("explore.rail.revenueAria", { v: revAriaVal })}
        />
        <ReelExploreStatLine
          icon={<Eye strokeWidth={2.25} className="shrink-0" />}
          value={viewsStr}
          valueClassName={railStatValueWhite}
          aria-label={t("explore.rail.viewsAria", { v: viewsStr })}
        />
        <ReelExploreStatLine
          icon={
            <Heart
              strokeWidth={2.25}
              className="shrink-0 stroke-white/[0.9] [html[data-theme='light']_&]:stroke-zinc-700"
              aria-hidden
            />
          }
          value={likesStr}
          valueClassName={railStatValueWhite}
          aria-label={t("explore.rail.likesAria", { v: likesStr })}
        />
        <ReelExploreStatLine
          icon={<ShoppingBag strokeWidth={2.25} className="shrink-0" />}
          value={locale === "ko" ? `${salesStr}명` : salesStr}
          valueClassName={railStatValueWhite}
          aria-label={t("explore.rail.purchasesAria", { n: salesStr })}
        />
      </div>

      <SellerSocialLinkIcons
        links={sellerSocialLinks}
        size="sm"
        className="justify-center px-2"
      />

      {video.priceWon != null ? (
        soldOut ? (
          <div className="flex w-full flex-col items-center gap-3 px-2 text-center">
            <div className="opacity-45">
              <GemAmount
                value={Math.round(video.priceWon / 6).toLocaleString()}
                className="justify-center text-[clamp(1.5rem,3.8vw,2.35rem)] font-black tabular-nums tracking-tight text-white [html[data-theme='light']_&]:text-zinc-900"
                iconClassName="h-[0.95em] w-[0.95em] shrink-0 text-[color:var(--reels-point)]"
                gapClassName="gap-1"
              />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{t("explore.rail.soldOut")}</span>
          </div>
        ) : (
          <div className="flex w-full flex-col items-stretch gap-3 px-2">
            <div className="text-center">
              <GemAmount
                value={Math.round(video.priceWon / 6).toLocaleString()}
                className="justify-center text-[clamp(1.55rem,4vw,2.85rem)] font-black tabular-nums tracking-tighter text-white [html[data-theme='light']_&]:text-zinc-900"
                iconClassName="h-[0.95em] w-[0.95em] shrink-0 text-[color:var(--reels-point)] sm:h-[1.05em] sm:w-[1.05em]"
                gapClassName="gap-1"
              />
            </div>
            <button
              type="button"
              onClick={onBuyClick}
              className={railExploreBuyButtonClass}
              aria-label={t("explore.rail.buyAria")}
            >
              {t("explore.rail.buy")}
            </button>
          </div>
        )
      ) : (
        <span className="font-mono text-sm font-semibold tabular-nums text-zinc-500">{t("explore.rail.priceTbd")}</span>
      )}

      <div
        role="group"
        aria-label={t("explore.rail.actions")}
        className="flex w-full flex-row flex-wrap items-center justify-center gap-3 px-2"
      >
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
            className={inCart ? EXPLORE_RAIL_ACTION_ICON_FILLED : `${EXPLORE_RAIL_ACTION_ICON} stroke-current`}
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
          }`}
          aria-label={likedByMe ? t("explore.rail.likeUndo") : t("explore.rail.like")}
          aria-pressed={likedByMe}
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
        <BookmarkButton
          video={video}
          beforeToggle={requireAuth}
          buttonClassNameBase={EXPLORE_RAIL_ACTION_BTN}
          buttonClassWhenBookmarked={EXPLORE_RAIL_ACTION_BTN_ACTIVE_TINT}
          iconClassWhenBookmarked={EXPLORE_RAIL_ACTION_ICON_FILLED}
          iconClassWhenDefault={`${EXPLORE_RAIL_ACTION_ICON} stroke-current`}
        />
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

/** 모바일 탐색 — 제목 옆 💎 가격 + 구매 (우측 레일에서 분리) */
function ExploreReelMobileTitlePurchaseRow({
  video,
  title,
}: {
  video: FeedVideo;
  title: string;
}) {
  const router = useRouter();
  const { hasPurchased } = usePurchasedVideos();
  const { user, loading: authLoading, supabaseConfigured } = useAuthSession();
  const owned = hasPurchased(video.id);
  const { t, locale } = useTranslation();
  const fmt = useMemo(() => getExploreFormatters(locale), [locale]);
  const meta = useMemo(
    () =>
      video.listing
        ? { salesCount: video.listing.salesCount, edition: "open" as const }
        : getCommerceMeta(video.id),
    [video],
  );
  const remaining = clonesRemaining(meta);
  const soldOut = remaining === 0 && isLimitedFamily(meta.edition);
  const authPromptScrollYRef = useRef(0);
  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

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
    router.push(
      owned
        ? `/create?videoId=${encodeURIComponent(video.id)}`
        : `/video/${encodeURIComponent(video.id)}`,
    );
  }, [authLoading, owned, requireAuth, router, soldOut, video.id]);

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

  const gemCount =
    video.priceWon != null ? Math.round(video.priceWon / 6) : null;
  const gemLabel =
    gemCount != null ? fmt.formatFullCount(gemCount) : null;

  return (
    <>
      <div className="pointer-events-auto flex w-full min-w-0 flex-col gap-2 md:hidden">
        <div className="flex min-w-0 items-center gap-2">
          <p className="explore-reel-on-video-text min-w-0 flex-1 line-clamp-2 text-left text-[14px] font-bold leading-snug text-white">
            {title}
          </p>
          {gemLabel ? (
            <GemAmount
              value={gemLabel}
              className="inline-flex shrink-0 tabular-nums text-[13px] font-bold text-white"
              iconClassName="h-4 w-4 shrink-0 text-[color:var(--reels-point)]"
              gapClassName="gap-0.5"
            />
          ) : null}
        </div>
        {video.priceWon != null && !soldOut ? (
          <button
            type="button"
            onClick={onBuyClick}
            className={explorePurchaseButtonMobileClass}
            aria-label={t("explore.rail.buyAria")}
          >
            {t("explore.rail.buy")}
          </button>
        ) : null}
        {video.priceWon != null && soldOut ? (
          <span className="w-full text-center text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
            {t("explore.rail.soldOut")}
          </span>
        ) : null}
      </div>
      {mounted ? (
        <AuthPromptModal
          open={authPromptOpen}
          onClose={() => setAuthPromptOpen(false)}
          onGoogleStart={startGoogleAuth}
        />
      ) : null}
    </>
  );
}

export function ExploreReelSlide({
  video,
  scrollRootRef,
  muted,
  onMutedChange,
}: ReelSlideProps) {
  const { t } = useTranslation();
  const displayTitle = useVideoDisplayTitle();
  const videoRef = useRef<HTMLVideoElement>(null);
  const blockRef = useRef<HTMLDivElement>(null);
  const progressRailRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  useEffect(() => {
    setProgress(0);
  }, [video.id]);
  const [volume, setVolume] = useState(0.75);
  const [volumeUiVisible, setVolumeUiVisible] = useState(false);
  const [reelPaused, setReelPaused] = useState(true);
  const previewSrc = video.previewSrc ?? video.src;
  const isPexelsBlockedVideo = /^https?:\/\/videos\.pexels\.com\//i.test(previewSrc);
  const posterSrc = sanitizePosterSrc(video.poster);
  const posterFallback =
    posterSrc ?? (video.poster?.trim() || undefined);
  const sellerHref = useMemo(() => sellerProfileHrefFromVideo(video), [video]);
  const videoContentSource = useMemo(() => getVideoContentSource(video), [video]);
  const sellerSocialLinks = useSellerSocialLinks(
    video.listing?.sellerId,
    video.sellerSocialLinks,
  );

  const sidebarMetrics = useExploreReelSidebarMetrics(video);

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
    if (el == null) return;
    const d = el.duration;
    if (!Number.isFinite(d) || d <= 0) return;
    setProgress(el.currentTime / d);
  }, [isScrubbing]);

  const syncProgressFromVideo = useCallback(() => {
    const el = videoRef.current;
    if (el == null) return;
    const d = el.duration;
    if (!Number.isFinite(d) || d <= 0) return;
    setProgress(Math.min(1, Math.max(0, el.currentTime / d)));
  }, []);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    let rafId = 0;
    const tick = () => {
      if (!isScrubbing) {
        const d = el.duration;
        if (Number.isFinite(d) && d > 0) {
          setProgress(Math.min(1, Math.max(0, el.currentTime / d)));
        }
      }
      if (!el.paused && !el.ended) {
        rafId = window.requestAnimationFrame(tick);
      }
    };
    const startRaf = () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(tick);
    };
    const stopRaf = () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      rafId = 0;
    };
    const onDurationChange = () => {
      syncProgressFromVideo();
      if (!el.paused && !el.ended) startRaf();
    };
    el.addEventListener("play", startRaf);
    el.addEventListener("playing", startRaf);
    el.addEventListener("pause", stopRaf);
    el.addEventListener("ended", stopRaf);
    el.addEventListener("durationchange", onDurationChange);
    if (!el.paused && !el.ended) startRaf();
    return () => {
      el.removeEventListener("play", startRaf);
      el.removeEventListener("playing", startRaf);
      el.removeEventListener("pause", stopRaf);
      el.removeEventListener("ended", stopRaf);
      el.removeEventListener("durationchange", onDurationChange);
      stopRaf();
    };
  }, [isScrubbing, syncProgressFromVideo]);

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

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.volume = volume;
    el.muted = muted;
  }, [muted, volume]);

  const seekByClientX = useCallback((clientX: number) => {
    const rail = progressRailRef.current;
    const el = videoRef.current;
    if (!rail || el == null) return;
    const d = el.duration;
    if (!Number.isFinite(d) || d <= 0) return;
    const rect = rail.getBoundingClientRect();
    if (rect.width <= 0) return;
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    setProgress(ratio);
    el.currentTime = ratio * d;
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
      className="flex h-[100dvh] w-full shrink-0 snap-start snap-always flex-col bg-black [html[data-theme='light']_&]:max-md:bg-zinc-950 md:h-[calc(100dvh-var(--header-height,4.5rem)-var(--mobile-bottom-nav-h,0px))] md:bg-[#050508] md:[--mobile-bottom-nav-h:0px] [html[data-theme='light']_&]:md:bg-zinc-100"
    >
      <div className="flex min-h-0 w-full flex-1 items-center justify-center px-0 pt-0 max-md:relative max-md:items-stretch max-md:px-0 md:px-4 md:pt-0">
        <div className="relative flex w-full max-w-none flex-row items-center justify-center gap-1 max-md:h-full max-md:min-h-0 max-md:max-w-none max-md:items-stretch md:max-w-[min(56rem,100%)] md:gap-1.5 md:items-center lg:gap-2">
          <div className="relative w-full shrink-0 max-md:absolute max-md:inset-0 max-md:h-full max-md:w-full md:w-[min(100%,min(var(--explore-reel-video-max-w,26.25rem),calc(100%-15rem)))]">
            <div
              className="relative aspect-[9/16] w-full overflow-hidden max-md:h-full max-md:max-h-none max-md:rounded-none max-md:border-0 max-md:shadow-none max-md:aspect-auto max-h-[min(78dvh,calc(100dvh-var(--header-height)-7rem))] rounded-2xl border border-white/12 bg-black shadow-[0_24px_80px_-30px_rgba(0,0,0,0.85)] md:max-h-[min(92dvh,calc(100dvh-var(--header-height)-2rem))] [html[data-theme='light']_&]:max-md:border-0 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:shadow-none"
            >
            <video
              ref={videoRef}
              className="absolute inset-0 z-0 h-full w-full cursor-pointer object-contain md:object-cover"
              poster={posterFallback || undefined}
              src={isPexelsBlockedVideo ? undefined : previewSrc}
              muted={muted}
              playsInline
              loop
              preload={isPexelsBlockedVideo ? "none" : "metadata"}
              onTimeUpdate={onTimeUpdate}
              onLoadedMetadata={syncProgressFromVideo}
              onCanPlay={syncProgressFromVideo}
              onPlay={() => setReelPaused(false)}
              onPause={() => setReelPaused(true)}
              onClick={togglePlayPause}
            />
            {/* 하단 캡션 가독용만 — 전체 화면 딤 제거(원본 밝기 유지) */}
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[34%] max-h-[11rem] bg-gradient-to-t from-black/42 to-transparent max-md:h-[40%] max-md:max-h-[13rem] max-md:from-black/48"
              aria-hidden
            />
            {reelPaused ? (
              <button
                type="button"
                className="reel-video-play-overlay absolute inset-0 z-[4] flex items-center justify-center"
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlayPause();
                }}
                aria-label={t("explore.player.play")}
              >
                <span className="flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-full border border-white/25 bg-black/50 text-white shadow-lg backdrop-blur-sm">
                  <Play className="ml-1 h-9 w-9 fill-current" aria-hidden />
                </span>
              </button>
            ) : null}

            <button
              type="button"
              onClick={toggleMute}
              className="explore-reel-mute-btn pointer-events-auto absolute left-3 top-3 z-[3] flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/45 text-white backdrop-blur-md transition hover:bg-black/60 max-md:left-3 max-md:right-auto md:right-3 md:left-auto"
              aria-label={muted ? t("explore.player.unmute") : t("explore.player.mute")}
            >
              {muted ? (
                <VolumeX
                  className="explore-reel-mute-icon h-4 w-4 text-white"
                  strokeWidth={2}
                  aria-hidden
                />
              ) : (
                <Volume2
                  className="explore-reel-mute-icon h-4 w-4 text-white"
                  strokeWidth={2}
                  aria-hidden
                />
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
                  className="h-6 w-20 -rotate-90 cursor-pointer appearance-none bg-transparent [&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-white/30 [&::-webkit-slider-thumb]:-mt-[5px] [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--reels-point)] [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(255,45,141,0.85)] [&::-moz-range-track]:h-1.5 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-white/30 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-[var(--reels-point)] [&::-moz-range-thumb]:shadow-[0_0_10px_rgba(255,45,141,0.85)]"
                  aria-label={t("explore.player.volume")}
                />
              </div>
            ) : null}

            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] space-y-2 p-4 pb-5 max-md:bottom-[max(2.5rem,calc(var(--mobile-bottom-nav-h,0px)+0.35rem))] max-md:right-14 max-md:px-3 max-md:pb-2">
              <div className="pointer-events-auto flex flex-wrap items-center gap-2 max-md:block max-md:space-y-1.5">
                <Link
                  href={sellerHref}
                  className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-white/90 underline-offset-2 hover:text-reels-cyan hover:underline max-md:text-white/95"
                >
                  <VideoSourcePlatformIcon
                    source={videoContentSource}
                    className="h-3.5 w-3.5 shrink-0 text-white/85"
                  />
                  {video.creator}
                </Link>
                <SellerSocialLinkIcons links={sellerSocialLinks} size="sm" stopPropagation />
              </div>
              <ExploreReelMobileTitlePurchaseRow
                video={video}
                title={displayTitle(video)}
              />
              <p className="explore-reel-on-video-text hidden line-clamp-3 text-left text-[15px] font-bold leading-snug text-white sm:text-[16px] md:block">
                {displayTitle(video)}
              </p>
            </div>

            {/* 진행 바 — 단색 화이트(그라데이션·글로우 없음) */}
            <div
              ref={progressRailRef}
              className="pointer-events-auto absolute inset-x-0 bottom-0 z-[4] h-[7px] cursor-ew-resize bg-white/25"
              onPointerDown={(e) => {
                setIsScrubbing(true);
                seekByClientX(e.clientX);
              }}
              aria-label={t("explore.player.seek")}
              role="slider"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round((progress || 0) * 100)}
            >
              <div
                className="h-full bg-white"
                style={{
                  width: `${Math.min(100, Math.max(0, (progress || 0) * 100))}%`,
                }}
              />
            </div>

            <ReelDesktopRail
              video={video}
              sidebarMetrics={sidebarMetrics}
              mobileOverlay
            />
            </div>
          </div>

          <ReelDesktopRail
            video={video}
            sidebarMetrics={sidebarMetrics}
            className="hidden shrink-0 md:flex"
          />
        </div>
      </div>
    </div>
  );
}

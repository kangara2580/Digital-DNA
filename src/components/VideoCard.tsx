"use client";

import { motion, useReducedMotion } from "framer-motion";
import { AtSign, Bookmark, Camera, Heart, Link as LinkIcon, Music2, Play } from "lucide-react";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { RelatedDnaQuilt } from "@/components/RelatedDnaQuilt";
import { useDopamineBasketOptional } from "@/context/DopamineBasketContext";
import { useWishlist } from "@/context/WishlistContext";
import type { FeedVideo } from "@/data/videos";
import { useHoverInstantPreview } from "@/hooks/useHoverInstantPreview";
import { useLocalSamplePlayback } from "@/hooks/useLocalSamplePlayback";
import {
  clonesRemaining,
  getCommerceMeta,
} from "@/data/videoCommerce";
import { getExternalIframeForCard } from "@/lib/externalEmbed/playerUrls";
import { isLocalPublicVideo } from "@/lib/localVideoHighlight";
import { CartIcon } from "@/components/CartIcon";
import { VideoSourcePlatformIcon } from "@/components/VideoSourcePlatformIcon";
import type { SellerSocialLink } from "@/lib/sellerSocialLinks";
import {
  sellerDisplayNameFromVideo,
  sellerProfileHrefFromVideo,
} from "@/lib/sellerProfile";
import { getVideoContentSource } from "@/lib/videoSourcePlatform";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { useAuthSession } from "@/hooks/useAuthSession";
import { buildAuthCallbackRedirectTo } from "@/lib/authOAuthRedirect";
import { canonicalFavoriteVideoId } from "@/lib/favoriteVideoId";
import { AuthModalGoogleStartButton } from "@/components/AuthModalGoogleStartButton";
import { AuthModalPortal } from "@/components/AuthModalPortal";
import {
  authModalDialogSurface,
  authModalDismissButtonCls,
  authModalGlowBottom,
  authModalGlowTop,
} from "@/lib/authModalTheme";

type Props = {
  video: FeedVideo;
  className?: string;
  flush?: boolean;
  /** 촘촘한 그리드(할인 DNA 등) */
  dense?: boolean;
  /** Micro DNA 탐색 그리드: 호버 시 살짝 확대·z-index로 인접 카드 위에 겹침 */
  overlapOnHover?: boolean;
  /** 썸네일 좌상단 배지 문구(다른 배지와 겹치면 우측으로 이동) */
  topBadge?: string;
  /** 앵커 링크용 (연관 릴스에서 스크롤) */
  domId?: string;
  /** 같은 무드 연관 조각 퀼트 */
  showRelatedQuilt?: boolean;
  /** 300원 이하 Micro DNA 배지 숨김 */
  hideMicroDnaBadge?: boolean;
  /** 썸네일 하단 복제 지수 줄 숨김 */
  hideCloneStrip?: boolean;
  /**
   * true: 호버 시 무음·약 3초 구간을 반복(인스턴트 프리뷰)
   * false: 호버 시 전체 영상 루프(카테고리 등)
   */
  instantPreview?: boolean;
  /**
   * 홈 인기순위·실패 섹션 등 — 세로 9:16·여백·타이포를 릴스 마켓형으로
   */
  reelLayout?: boolean;
  /**
   * reelLayout + 인기순위 한 줄 5열 등 — 9:16 대신 3:4로 높이를 줄여 가로 스트립에 맞춤
   */
  reelStrip?: boolean;
  /**
   * 가로 스트립 + 상단 해시태그 등이 있을 때 — 호버 확대를 약하게·위 기준으로 잘림 방지
   */
  subtleHover?: boolean;
  /** true면 카드 전체 호버 시 확대(scale)만 끔 — 인기순위 스트립 등 */
  disableHoverScale?: boolean;
  /** 제목·가격 아래 추가 블록(인기순위 지표 등) */
  footerExtension?: ReactNode;
  /** 기본 `/video/{id}` 대신 사용할 상세·창작 링크 (인기순위 → 맞춤 리스킨 등) */
  detailHref?: string;
  /** 지정 시 썸네일 전체 클릭이 상세 링크 대신 이 콜백(탐색 → 세로 릴 등) */
  onPick?: () => void;
  /** 비디오 preload 전략 제어 (기본 metadata) */
  preloadMode?: "none" | "metadata" | "auto";
  /** 카드 폭이 작은 구간(연관 릴스 등)에서 hover 액션 아이콘만 축소 */
  compactHoverActions?: boolean;
  /** true면 호버 액션에서 좋아요(하트) 아이콘 숨김 */
  hideLikeAction?: boolean;
  /** true면 호버 액션(장바구니/좋아요/찜) 전체 숨김 */
  hideHoverActions?: boolean;
  /** true면 작성자(아이디) 한 줄 숨김 */
  hideCreatorMeta?: boolean;
  /** true면 하단 정보 바(아이디·제목·가격) 전체 숨김 */
  hideInfoBar?: boolean;
  /** 홈 인기순위 그리드만 — 가격 글자 흰색·한 단계 크게 */
  trendingRankCardPrice?: boolean;
};

function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

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

function iconForSocialPlatform(platform: SellerSocialLink["platform"]) {
  switch (platform) {
    case "instagram":
      return Camera;
    case "youtube":
      return Play;
    case "twitter":
      return AtSign;
    case "tiktok":
      return Music2;
    default:
      return LinkIcon;
  }
}

function AuthRequiredModal({
  open,
  onClose,
  onGoogleStart,
}: {
  open: boolean;
  onClose: () => void;
  onGoogleStart: () => void;
}) {
  if (!open) return null;

  return createPortal(
    <AuthModalPortal onDismiss={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="로그인 또는 회원가입"
        className={`relative w-full rounded-[24px] px-5 pb-8 pt-8 shadow-[0_60px_130px_-40px_rgba(0,0,0,0.95)] sm:rounded-[28px] sm:px-7 sm:pb-10 sm:pt-10 ${authModalDialogSurface}`}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className={authModalGlowTop} aria-hidden />
        <div className={authModalGlowBottom} aria-hidden />
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          className={authModalDismissButtonCls}
          aria-label="닫기"
        >
          ×
        </button>
        <p className="relative text-center text-[clamp(1.85rem,6vw,2.65rem)] font-black tracking-tight text-white">
          ARA
        </p>
        <p className="relative mt-3 text-center text-[clamp(1.15rem,4.6vw,1.85rem)] font-semibold leading-tight text-zinc-100">
          로그인/회원가입
        </p>
        <AuthModalGoogleStartButton onClick={onGoogleStart} />
      </div>
    </AuthModalPortal>,
    document.body,
  );
}

export function VideoCard({
  video,
  className,
  flush,
  dense,
  overlapOnHover,
  topBadge,
  domId,
  showRelatedQuilt,
  hideMicroDnaBadge,
  hideCloneStrip,
  instantPreview = true,
  reelLayout = false,
  reelStrip = false,
  subtleHover = false,
  disableHoverScale = false,
  footerExtension,
  detailHref,
  onPick,
  preloadMode = "metadata",
  compactHoverActions = false,
  hideLikeAction = false,
  hideHoverActions = false,
  hideCreatorMeta = false,
  hideInfoBar = false,
  trendingRankCardPrice = false,
}: Props) {
  const dopamine = useDopamineBasketOptional();
  const { user, loading: authLoading, supabaseConfigured } = useAuthSession();
  const wishlist = useWishlist();
  const reduceMotion = useReducedMotion() ?? false;
  const externalIframe = useMemo(
    () => {
      const raw = getExternalIframeForCard(video);
      // 개발 환경에서는 TikTok iframe SDK(webmssdk) 에러가 과도해 카드에서는 비활성화합니다.
      if (process.env.NODE_ENV !== "production" && raw?.kind === "tiktok") {
        return null;
      }
      return raw;
    },
    [video],
  );
  const commerce = getCommerceMeta(video.id);
  const remaining = clonesRemaining(commerce);
  // 정책 변경: MICRO DNA 배지는 모든 화면에서 노출하지 않음.
  const showMicro = false;
  const showAiBadge = false;
  const cartBtnRef = useRef<HTMLButtonElement>(null);
  const wishlisted = wishlist.isSaved(video.id);
  const inCart = dopamine?.isVideoInCart(video.id) ?? false;
  const [likedByMe, setLikedByMe] = useState(false);
  const [likeBusy, setLikeBusy] = useState(false);
  const [likePulse, setLikePulse] = useState(false);
  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const authPromptScrollYRef = useRef(0);
  const reelAspectPortrait =
    reelLayout && reelStrip ? "aspect-[3/4] w-full" : "aspect-[9/16] w-full";
  const reelAspectLandscape =
    reelLayout && reelStrip ? "aspect-[4/5] w-full" : "aspect-[9/16] w-full";
  const aspectClass =
    video.orientation === "portrait"
      ? reelLayout
        ? reelAspectPortrait
        : "aspect-[3/4] w-full"
      : reelLayout
        ? reelAspectLandscape
        : "aspect-video w-full";
  const previewSrc = video.previewSrc ?? video.src;
  const isPexelsBlockedVideo = /^https?:\/\/videos\.pexels\.com\//i.test(previewSrc);
  const isDirectVideoLikeSource =
    previewSrc.startsWith("/") ||
    /\.(mp4|webm|mov|m4v)(\?|$)/i.test(previewSrc) ||
    /^blob:/i.test(previewSrc) ||
    /^data:video\//i.test(previewSrc);
  const canLoadPreviewVideo = !isPexelsBlockedVideo && isDirectVideoLikeSource;
  const segmentPreview = instantPreview === true;
  const fallbackPoster = useMemo(() => {
    const hash = Array.from(video.id).reduce(
      (acc, ch) => (acc * 33 + ch.charCodeAt(0)) >>> 0,
      11,
    );
    const hueA = hash % 360;
    const hueB = (hueA + 64) % 360;
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='720' height='1280' viewBox='0 0 720 1280'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='hsl(${hueA},82%,44%)'/><stop offset='100%' stop-color='hsl(${hueB},88%,55%)'/></linearGradient></defs><rect width='720' height='1280' fill='#050505'/><rect x='24' y='24' width='672' height='1232' rx='42' fill='url(#g)' opacity='0.86'/><text x='70' y='1188' fill='rgba(255,255,255,0.95)' font-family='Inter,Arial,sans-serif' font-size='46' font-weight='700'>PREVIEW</text></svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }, [video.id]);
  const normalizedPoster = useMemo(() => {
    const poster = video.poster?.trim();
    if (poster) return poster;
    // 로컬 샘플은 포스터가 없으면 비디오 첫 프레임을 그대로 사용.
    if (isLocalPublicVideo(previewSrc)) return "";
    return poster;
  }, [video.poster, previewSrc]);
  /**
   * 원격 등 포스터가 없을 때만 SVG 그라데이션.
   * 로컬 public MP4는 그라데이션 img를 쓰면 z-index로 실제 프레임 위를 덮어 썸네일이 색만 보임 → 비워 두고 비디오+시크만 사용.
   */
  const defaultThumbnail = useMemo(() => {
    if (normalizedPoster) return normalizedPoster;
    // TikTok iframe은 카드에서 정지 프레임이 보일 수 있어 포스터가 없을 때만 비움.
    if (externalIframe?.kind === "tiktok") return "";
    if (isLocalPublicVideo(previewSrc)) return "";
    return fallbackPoster;
  }, [normalizedPoster, previewSrc, fallbackPoster, externalIframe?.kind]);
  const [thumbnailSrc, setThumbnailSrc] = useState(defaultThumbnail);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [sellerSocialLinks, setSellerSocialLinks] = useState<SellerSocialLink[]>(
    video.sellerSocialLinks ?? [],
  );

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
    setThumbnailSrc(defaultThumbnail);
    setIsPreviewing(false);
  }, [defaultThumbnail]);

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
    const handler = (evt: Event) => {
      const detail = (evt as CustomEvent<{ sellerId?: string; links?: SellerSocialLink[] }>).detail;
      if (!detail || detail.sellerId !== sellerId || !Array.isArray(detail.links)) return;
      sellerSocialLinksCache.set(sellerId, detail.links);
      setSellerSocialLinks(detail.links);
    };
    window.addEventListener("seller-social-links-updated", handler as EventListener);
    return () => {
      window.removeEventListener("seller-social-links-updated", handler as EventListener);
    };
  }, [video.listing?.sellerId]);

  useEffect(() => {
    let cancelled = false;
    setLikedByMe(false);
    if (authLoading || !user || !supabaseConfigured) return;
    void (async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const session = supabase ? await supabase.auth.getSession() : null;
        const token = session?.data.session?.access_token;
        const headers = token
          ? { Authorization: `Bearer ${token}` }
          : undefined;
        const res = await fetch(
          `/api/video/likes?videoId=${encodeURIComponent(canonicalFavoriteVideoId(video.id))}`,
          { cache: "no-store", headers },
        );
        if (!res.ok || cancelled) return;
        const body = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          likedByMe?: boolean;
        };
        if (!body.ok || cancelled) return;
        setLikedByMe(Boolean(body.likedByMe));
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [video.id, user?.id, authLoading, supabaseConfigured, user]);

  const toggleInternalLike = useCallback(async () => {
    if (likeBusy || authLoading) return;
    if (!requireAuth()) return;
    const nextLiked = !likedByMe;
    const prevLiked = likedByMe;
    setLikedByMe(nextLiked);
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
        body: JSON.stringify({ videoId: canonicalFavoriteVideoId(video.id) }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        likedByMe?: boolean;
      };
      if (!res.ok || !body.ok) throw new Error("toggle_failed");
      setLikedByMe(Boolean(body.likedByMe));
    } catch {
      setLikedByMe(prevLiked);
      if (typeof window !== "undefined") {
        window.alert("좋아요 처리 중 문제가 발생했어요. 다시 시도해 주세요.");
      }
    } finally {
      setLikeBusy(false);
    }
  }, [likeBusy, authLoading, requireAuth, likedByMe, video.id]);

  const segmentPreviewEffective = segmentPreview && !externalIframe;
  const isLocal = canLoadPreviewVideo && isLocalPublicVideo(previewSrc);

  const hoverPreview = useHoverInstantPreview(
    segmentPreviewEffective && !isLocal && canLoadPreviewVideo,
    video,
    reduceMotion,
  );

  const localPlayback = useLocalSamplePlayback(video.id, previewSrc, {
    enableHoverLoop: isLocal && segmentPreviewEffective,
    reduceMotion,
  });

  const play = useCallback(() => {
    setIsPreviewing(true);
    hoverPreview.onEnter();
  }, [hoverPreview]);

  const pause = useCallback(() => {
    setIsPreviewing(false);
    hoverPreview.onLeave();
  }, [hoverPreview]);

  const playTikTok = useCallback(() => {
    setIsPreviewing(true);
  }, []);

  const pauseTikTok = useCallback(() => {
    setIsPreviewing(false);
  }, []);

  const videoRef = isLocal ? localPlayback.ref : hoverPreview.ref;
  const onVidTimeUpdate =
    isLocal && segmentPreviewEffective
      ? localPlayback.onTimeUpdate
      : segmentPreviewEffective
        ? hoverPreview.onTimeUpdate
        : undefined;

  const shell = flush
    ? "rounded-none border-0 bg-transparent shadow-none"
    : dense
      ? "rounded-lg border border-white/10 bg-white/[0.055] shadow-none backdrop-blur-md hover:border-reels-cyan/25 hover:shadow-reels-cyan/20 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:hover:border-reels-cyan/40"
      : "rounded-xl border border-white/10 bg-white/[0.055] shadow-none backdrop-blur-md hover:border-reels-crimson/20 hover:shadow-reels-crimson/25 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:hover:border-reels-crimson/35";

  const priceLabel =
    video.priceWon != null
      ? `${video.priceWon.toLocaleString("ko-KR")}원`
      : null;
  const socialLinksToShow =
    (video.sellerSocialLinks?.length ?? 0) > 0 ? video.sellerSocialLinks! : sellerSocialLinks;
  const sellerHref = useMemo(() => sellerProfileHrefFromVideo(video), [video]);
  const sellerName = useMemo(() => sellerDisplayNameFromVideo(video), [video]);
  const videoContentSource = useMemo(() => getVideoContentSource(video), [video]);

  const quilt =
    showRelatedQuilt && !dense ? <RelatedDnaQuilt video={video} /> : null;

  const topBadgePos = showMicro
    ? "right-1.5 top-1.5 max-w-[min(100%-12px,6rem)] sm:right-2 sm:top-2 sm:max-w-[7rem]"
    : "left-1.5 top-1.5 max-w-[min(100%-12px,7rem)] sm:left-2 sm:top-2 sm:max-w-[9rem]";

  const transitionCls =
    overlapOnHover === true
      ? "transition-[transform,box-shadow] duration-[400ms] ease-in-out motion-reduce:transition-none"
      : !dense && !flush
        ? "transition-[transform,box-shadow] duration-[400ms] ease-in-out motion-reduce:transition-none"
        : "transition-[box-shadow] duration-[400ms] ease-in-out";

  const overlapHover =
    overlapOnHover === true
      ? "relative z-0 hover:z-[30] hover:overflow-visible hover:-translate-y-0.5 hover:scale-[1.06] hover:shadow-xl motion-reduce:hover:translate-y-0 motion-reduce:hover:scale-100 motion-reduce:hover:shadow-md"
      : "";

  const gridHoverScale =
    disableHoverScale || dense || flush || overlapOnHover === true
      ? ""
      : subtleHover
        ? "origin-top hover:z-[2] hover:scale-[1.02] motion-reduce:hover:scale-100"
        : "hover:z-[2] hover:scale-[1.05] motion-reduce:hover:scale-100";
  const compactActions = compactHoverActions && !dense;
  const actionOverlayPadding = "p-0";
  const actionStackGap = dense
    ? "gap-1"
    : compactActions
      ? "gap-1"
      : reelStrip
        ? "gap-1.5"
        : reelLayout
          ? "gap-2"
          : "gap-1.5";
  const actionButtonSize = dense
    ? "h-7 w-7"
    : compactActions
      ? "h-8 w-8 sm:h-9 sm:w-9"
    : reelStrip
      ? "h-8 w-8 sm:h-9 sm:w-9"
      : reelLayout
        ? "h-9 w-9 sm:h-10 sm:w-10"
        : "h-8 w-8 sm:h-9 sm:w-9";
  const actionIconSize = dense
    ? "h-[22px] w-[22px]"
    : compactActions
      ? "h-[22px] w-[22px] sm:h-6 sm:w-6"
    : reelStrip
      ? "h-6 w-6 sm:h-[26px] sm:w-[26px]"
      : reelLayout
        ? "h-[26px] w-[26px] sm:h-7 sm:w-7"
        : "h-6 w-6 sm:h-[26px] sm:w-[26px]";
  const actionHoverScale = compactActions ? "hover:scale-100" : "hover:scale-110";
  const actionStackPos = showMicro
    ? "left-1.5 top-9 sm:left-2 sm:top-10"
    : !showMicro && (showAiBadge || topBadge)
      ? "left-1.5 top-12 sm:left-2 sm:top-[3.2rem]"
      : "left-1.5 top-[2.2rem] sm:left-2 sm:top-[2.35rem]";

  return (
    <>
    <article
      id={domId}
      className={`group flex flex-col overflow-hidden ${transitionCls} ${shell} ${overlapHover} ${gridHoverScale} ${className ?? ""}`}
      onMouseEnter={
        externalIframe
          ? playTikTok
          : !canLoadPreviewVideo
            ? undefined
          : isLocal && segmentPreviewEffective
            ? () => {
                setIsPreviewing(true);
                localPlayback.onEnter?.();
              }
            : !isLocal
              ? play
              : undefined
      }
      onMouseLeave={
        externalIframe
          ? pauseTikTok
          : !canLoadPreviewVideo
            ? undefined
          : isLocal && segmentPreviewEffective
            ? () => {
                setIsPreviewing(false);
                localPlayback.onLeave?.();
              }
            : !isLocal
              ? pause
              : undefined
      }
      onMouseMove={externalIframe ? playTikTok : undefined}
    >
      <div className={`relative overflow-hidden bg-black/40 ${aspectClass}`}>
        {externalIframe ? (
          <div className="absolute inset-0 z-0 flex items-center justify-center">
            <iframe
              title={`${video.title}-${externalIframe.kind}`}
              src={externalIframe.src}
              className="pointer-events-none h-full w-full border-0"
              allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
              allowFullScreen
              loading="eager"
              scrolling="no"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        ) : (
          <video
            ref={videoRef}
            className="absolute inset-0 z-0 h-full w-full object-cover"
            src={canLoadPreviewVideo ? previewSrc : undefined}
            poster={thumbnailSrc || undefined}
            playsInline
            muted
            disablePictureInPicture
            disableRemotePlayback
            controlsList="noremoteplayback nodownload nofullscreen"
            loop={!segmentPreviewEffective}
            /** 로컬은 첫 프레임 시크용 데이터가 필요해 auto. 원격은 metadata로 그리드 부하 완화 */
            preload={isLocal ? "auto" : preloadMode}
            onTimeUpdate={onVidTimeUpdate}
          />
        )}

        {thumbnailSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnailSrc}
            alt=""
            className={`pointer-events-none absolute inset-0 z-[2] h-full w-full transition-opacity duration-200 ${
              isPreviewing ? "opacity-0" : "opacity-100"
            } ${
              externalIframe
                ? "object-cover bg-black duration-75"
                : "object-cover"
            }`}
            loading={reelStrip ? "eager" : "lazy"}
            decoding="async"
            onError={() => {
              if (thumbnailSrc === fallbackPoster) return;
              if (isLocalPublicVideo(previewSrc)) setThumbnailSrc("");
              else setThumbnailSrc(fallbackPoster);
            }}
          />
        ) : null}
        <div
          className="pointer-events-none absolute inset-0 z-[1] bg-black/0 transition-colors duration-300 ease-out group-hover:bg-black/50 motion-reduce:group-hover:bg-black/40"
          aria-hidden
        />
        {onPick ? (
          <button
            type="button"
            onClick={onPick}
            className="absolute inset-0 z-[3] cursor-pointer border-0 bg-transparent p-0"
            aria-label={`${video.title} — 세로 릴로 보기`}
          />
        ) : (
          <Link
            href={detailHref ?? `/video/${video.id}`}
            className="absolute inset-0 z-[3]"
            aria-label={
              detailHref?.endsWith("/customize")
                ? `${video.title} 맞춤 리스킨 스튜디오`
                : `${video.title} 상세 페이지`
            }
          />
        )}
        {showMicro ? (
          <span className="pointer-events-none absolute left-1.5 top-1.5 z-[6] rounded border border-reels-cyan/40 bg-black/55 px-1 py-[1px] text-[6.5px] font-bold uppercase leading-tight tracking-[0.06em] text-reels-cyan sm:left-2 sm:top-2 sm:px-1.5 sm:text-[7.5px]">
            Micro DNA
          </span>
        ) : null}
        {showAiBadge && showMicro ? (
          <span
            className="video-card-ai-badge pointer-events-none absolute left-1.5 top-8 z-[6] sm:left-2 sm:top-9"
            aria-label="AI 생성 영상"
          >
            AI
          </span>
        ) : null}
        {!showMicro && (showAiBadge || topBadge) ? (
          <div className="pointer-events-none absolute left-1.5 top-1.5 z-[6] flex max-w-[min(100%-12px,calc(100%-3rem))] flex-wrap items-center gap-1 sm:left-2 sm:top-2">
            {showAiBadge ? (
              <span className="video-card-ai-badge" aria-label="AI 생성 영상">
                AI
              </span>
            ) : null}
            {topBadge ? (
              <span className="truncate rounded-full border border-reels-crimson/35 bg-reels-crimson/85 px-1.5 py-0.5 text-[9px] font-bold leading-none text-white sm:px-2 sm:text-[10px]">
                {topBadge}
              </span>
            ) : null}
          </div>
        ) : null}
        {showMicro && topBadge ? (
          <span
            className={`pointer-events-none absolute z-[6] truncate rounded-full border border-reels-crimson/35 bg-reels-crimson/85 px-1.5 py-0.5 text-[9px] font-bold leading-none text-white sm:px-2 sm:text-[10px] ${topBadgePos}`}
          >
            {topBadge}
          </span>
        ) : null}
        {video.durationSec != null ? (
          <span
            className={`pointer-events-none absolute right-2 top-2 z-[6] font-medium tabular-nums leading-none text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.75),0_0_8px_rgba(0,0,0,0.35)] sm:right-2.5 sm:top-2.5 ${
              dense ? "text-[9px]" : "text-[10px] sm:text-[11px]"
            }`}
          >
            {formatDuration(video.durationSec)}
          </span>
        ) : null}
        {!hideCloneStrip && remaining != null ? (
          <div
            className={`pointer-events-none absolute inset-x-0 bottom-0 z-[6] bg-gradient-to-t from-black/55 via-black/25 to-transparent px-1.5 pb-1 sm:px-2 sm:pb-1.5 ${
              reelStrip && !dense ? "pt-6 sm:pt-7" : "pt-5 sm:pt-6"
            }`}
          >
            {remaining > 0 ? (
              <p
                className={`font-mono font-semibold leading-snug text-amber-100/95 ${
                  reelStrip && !dense
                    ? "text-[10px] sm:text-[11px]"
                    : "text-[7px] sm:text-[8px]"
                }`}
              >
                Only {remaining} clones left
              </p>
            ) : (
              <p
                className={`font-mono font-semibold leading-snug text-red-200/95 ${
                  reelStrip && !dense
                    ? "text-[10px] sm:text-[11px]"
                    : "text-[7px] sm:text-[8px]"
                }`}
              >
                Sold out
              </p>
            )}
          </div>
        ) : null}
        {!hideHoverActions ? (
          <div
            className={`pointer-events-none absolute z-[7] ${actionStackPos} ${actionOverlayPadding}`}
          >
            <div
              className={`flex flex-col items-center justify-center opacity-100 transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:duration-200 max-lg:translate-y-0 max-lg:opacity-100 translate-y-1 lg:translate-y-1 lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100 ${actionStackGap}`}
            >
            <button
              ref={cartBtnRef}
              type="button"
              className={`pointer-events-auto relative z-[8] inline-flex items-center justify-center rounded-full border backdrop-blur-[1px] transition-[transform,background-color,border-color,color,box-shadow] duration-300 ease-out ${actionHoverScale} active:scale-[0.94] ${actionButtonSize} ${
                inCart
                  ? "border-[color:var(--reels-point)]/80 bg-[var(--reels-point)]/15 text-[var(--reels-point)] shadow-[0_0_0_1px_rgba(228,41,128,0.28)]"
                  : "border-white/20 bg-black/35 text-white opacity-90"
              }`}
              aria-label={inCart ? "장바구니에서 빼기" : "장바구니에 담기"}
              aria-pressed={inCart}
              title={inCart ? "장바구니에서 빼기" : "장바구니 담기"}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!requireAuth()) return;
                const el = cartBtnRef.current;
                if (el && dopamine) {
                  dopamine.launchFromCartButton(el, video, thumbnailSrc);
                }
              }}
            >
              <CartIcon
                className={`shrink-0 drop-shadow-md ${actionIconSize} ${inCart ? "text-[var(--reels-point)]" : "text-white"}`}
              />
            </button>
            {!hideLikeAction ? (
              <button
                type="button"
                className={`pointer-events-auto relative z-[8] inline-flex items-center justify-center rounded-full border border-white/20 bg-black/35 text-white opacity-90 backdrop-blur-[1px] transition-transform duration-300 ease-out ${actionHoverScale} ${actionButtonSize}`}
                aria-label={likedByMe ? "좋아요 취소" : "좋아요"}
                aria-pressed={likedByMe}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  void toggleInternalLike();
                }}
                disabled={likeBusy}
              >
                <Heart
                  className={`shrink-0 drop-shadow-md transition-all duration-200 ${actionIconSize} ${likedByMe ? "fill-current text-[var(--reels-point)]" : "text-white"} ${
                    likePulse ? "scale-110" : "scale-100"
                  }`}
                />
              </button>
            ) : null}
            <button
              type="button"
              className={`pointer-events-auto relative z-[8] inline-flex items-center justify-center rounded-full border backdrop-blur-[1px] transition-[transform,background-color,border-color,color] duration-300 ease-out ${actionHoverScale} active:scale-[0.94] ${actionButtonSize} ${
                wishlisted
                  ? "border-[color:var(--reels-point)]/80 bg-[var(--reels-point)]/15 text-[var(--reels-point)] shadow-[0_0_0_1px_rgba(228,41,128,0.28)]"
                  : "border-white/20 bg-black/35 text-white opacity-90"
              }`}
              aria-label={wishlisted ? "찜 해제" : "찜하기"}
              aria-pressed={wishlisted}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!requireAuth()) return;
                wishlist.toggle(video);
              }}
            >
              <span
                className={`relative isolate block shrink-0 ${
                  actionIconSize
                }`}
              >
                {/* 찜(북마크) 클릭 시에만 아래→위 채움 */}
                <motion.span
                  className="absolute inset-0 overflow-hidden"
                  initial={false}
                  animate={{
                    clipPath: wishlisted
                      ? "inset(0% 0% 0% 0%)"
                      : "inset(0% 0% 100% 0%)",
                  }}
                  transition={{
                    duration: reduceMotion ? 0 : 0.52,
                    ease: [0.22, 0.99, 0.36, 1],
                  }}
                >
                  <Bookmark
                    className="block h-full w-full text-[var(--reels-point)]"
                    fill="currentColor"
                    stroke="none"
                    strokeWidth={0}
                    aria-hidden
                  />
                </motion.span>
                <Bookmark
                  className={`pointer-events-none absolute inset-0 z-[1] block h-full w-full drop-shadow-md ${
                    wishlisted ? "text-[var(--reels-point)]" : "text-white"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.75}
                  aria-hidden
                />
              </span>
            </button>
            </div>
          </div>
        ) : null}
      </div>

      {hideInfoBar ? null : <div
        className={`border-t border-white/10 bg-black/25 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50 ${
          dense
            ? "min-h-[34px] px-1.5 py-1 sm:min-h-[36px]"
            : reelStrip
              ? hideCreatorMeta
                ? "min-h-[34px] px-2 py-1.5 sm:min-h-[36px] sm:px-2.5 sm:py-2"
                : "min-h-[44px] px-2 py-2 sm:min-h-[48px] sm:px-2.5 sm:py-2.5"
              : reelLayout
                ? "min-h-[48px] px-2.5 py-2 sm:min-h-[52px] sm:px-3 sm:py-2.5"
                : "min-h-[40px] px-2 py-1.5 sm:min-h-[44px] sm:px-2.5 sm:py-2"
        }`}
      >
        <div className={`flex min-w-0 flex-col ${hideCreatorMeta ? "gap-0.5" : "gap-1"}`}>
          {!hideCreatorMeta ? (
            <Link
              href={sellerHref}
              className={`w-fit max-w-full truncate text-left font-medium text-zinc-400 underline-offset-2 hover:text-[#86B4FF] hover:underline [html[data-theme='light']_&]:text-zinc-600 ${
                dense ? "text-[9px]" : "text-[10px] sm:text-[11px]"
              }`}
              aria-label={`${sellerName} 판매자 페이지`}
            >
              {sellerName}
            </Link>
          ) : null}
          <div className={`flex min-w-0 items-center ${dense ? "gap-1" : "gap-2"}`}>
            <VideoSourcePlatformIcon
              source={videoContentSource}
              className={`shrink-0 text-zinc-500 [html[data-theme='light']_&]:text-zinc-600 ${
                dense ? "h-3 w-3" : "h-3.5 w-3.5"
              }`}
            />
            <h3
              className={`line-clamp-2 min-w-0 flex-1 text-left font-semibold leading-snug text-zinc-100 [html[data-theme='light']_&]:text-zinc-900 ${
                dense
                  ? "text-[10px] sm:text-[10px]"
                  : reelStrip
                    ? "text-[12px] sm:text-[13px]"
                    : reelLayout
                      ? "text-[12px] sm:text-[13px]"
                      : "text-[11px] sm:text-[12px]"
              }`}
            >
              {video.title}
            </h3>
            {priceLabel ? (
              <span
                className={
                  trendingRankCardPrice
                    ? "shrink-0 rounded-md px-2 py-0.5 text-right text-[13px] font-extrabold tabular-nums text-zinc-50 transition-colors duration-200 motion-reduce:transition-none [html[data-theme='light']_&]:text-zinc-950 sm:text-[15px] group-hover:bg-white/[0.08] group-hover:text-white motion-reduce:group-hover:bg-transparent"
                    : `shrink-0 rounded-md px-1.5 py-0.5 text-right font-extrabold tabular-nums text-[#64E3FF] transition-[transform,background-color,color,box-shadow,font-weight] duration-[300ms] ease-out motion-reduce:transition-none group-hover:scale-[1.03] group-hover:bg-[#2348A8]/35 group-hover:text-[#BFE0FF] group-hover:shadow-[0_0_14px_-4px_rgba(79,140,255,0.7)] motion-reduce:group-hover:scale-100 motion-reduce:group-hover:bg-transparent motion-reduce:group-hover:font-extrabold motion-reduce:group-hover:text-[#64E3FF] motion-reduce:group-hover:shadow-none [html[data-theme='light']_&]:text-[#2A62D8] ${
                        dense
                          ? "text-[10px]"
                          : reelStrip
                            ? "text-[12px] sm:text-[13px]"
                            : reelLayout
                              ? "text-[12px] sm:text-[13px]"
                              : "text-[11px] sm:text-[12px]"
                      }`
                }
              >
                {priceLabel}
              </span>
            ) : null}
          </div>
          {socialLinksToShow.length > 0 ? (
            <div className="flex items-center gap-1.5">
              {socialLinksToShow.slice(0, 4).map((link) => {
                const Icon = iconForSocialPlatform(link.platform);
                return (
                  <a
                    key={`${link.platform}-${link.url}`}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    onClick={(e) => e.stopPropagation()}
                    className="relative z-[9] inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/20 bg-white/[0.06] text-zinc-300 transition hover:border-reels-cyan/45 hover:text-reels-cyan [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-700"
                    aria-label={`${link.platform} 링크 열기`}
                    title={link.url}
                  >
                    <Icon className="h-3 w-3" aria-hidden />
                  </a>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>}
      {!hideInfoBar && footerExtension}
      {quilt}
    </article>
    {mounted ? (
      <AuthRequiredModal
        open={authPromptOpen}
        onClose={() => setAuthPromptOpen(false)}
        onGoogleStart={startGoogleAuth}
      />
    ) : null}
    </>
  );
}

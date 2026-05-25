"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Bookmark, Heart } from "lucide-react";
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
import type { FeedVideo } from "@/data/videos";
import { useVideoCartAction } from "@/hooks/useVideoCartAction";
import { useHoverInstantPreview } from "@/hooks/useHoverInstantPreview";
import { useVideoLike } from "@/hooks/useVideoLike";
import { useLocalSamplePlayback } from "@/hooks/useLocalSamplePlayback";
import { useTranslation } from "@/hooks/useTranslation";
import { useVideoDisplayTitle } from "@/hooks/useVideoDisplayTitle";
import { formatGem } from "@/components/assets/assetsFormat";
import { toGemPrice } from "@/lib/gemPrice";
import type { SiteLocale } from "@/lib/sitePreferences";
import { useVideoWishlistAction } from "@/hooks/useVideoWishlistAction";
import {
  clonesRemaining,
  getCommerceMeta,
} from "@/data/videoCommerce";
import { getExternalIframeForCard } from "@/lib/externalEmbed/playerUrls";
import {
  EXTERNAL_EMBED_IFRAME_ALLOW,
  EXTERNAL_EMBED_IFRAME_SANDBOX,
} from "@/lib/externalEmbed/iframeSandbox";
import { isLocalPublicVideo } from "@/lib/localVideoHighlight";
import { CartIcon } from "@/components/CartIcon";
import { VideoSourcePlatformIcon } from "@/components/VideoSourcePlatformIcon";
import { SellerSocialLinkIcons } from "@/components/SellerSocialLinkIcons";
import { useSellerSocialLinks } from "@/hooks/useSellerSocialLinks";
import { SellerProfileAvatarLink } from "@/components/SellerProfileAvatarLink";
import {
  sellerDisplayNameFromVideo,
  sellerProfileHrefFromVideo,
} from "@/lib/sellerProfile";
import { getVideoContentSource } from "@/lib/videoSourcePlatform";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { useAuthSession } from "@/hooks/useAuthSession";
import { buildAuthCallbackRedirectTo } from "@/lib/authOAuthRedirect";
import { AuthModalGoogleStartButton } from "@/components/AuthModalGoogleStartButton";
import { AuthModalPortal } from "@/components/AuthModalPortal";
import {
  araAuthDialogWordmarkClassName,
  araWordmarkFontStyle,
  authModalBrandHeadlineClassName,
} from "@/lib/araBrandTypography";
import {
  authModalDialogSurface,
  authModalDismissButtonCls,
  authModalGlowBottom,
  authModalGlowTop,
} from "@/lib/authModalTheme";
import {
  reelActionBtn,
  reelActionBtnActive,
  reelActionBtnCompact,
  reelActionBtnDense,
  reelActionIcon,
  reelActionIconColorClass,
  reelActionIconCompact,
  reelActionIconDense,
  reelActionRailColumn,
  reelActionRailOuter,
  videoCardDurationBadgeClass,
  videoReelMediaRootClassName,
  videoShortFormAspectClassName,
} from "@/lib/videoReelActionStyles";

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
  /** 앵커 링크용 (연관 동영상에서 스크롤) */
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
   * 홈 인기순위·실패 섹션 등 — 세로 9:16·여백·타이포를 동영상 마켓형으로
   */
  reelLayout?: boolean;
  /** reelLayout + 몰·카테고리 그리드 등 — 세로 스트립 타일(9:16과 동일 프레임) */
  reelStrip?: boolean;
  /**
   * 가로 스트립 + 상단 해시태그 등이 있을 때 — 호버 확대를 약하게·위 기준으로 잘림 방지
   */
  subtleHover?: boolean;
  /** true면 카드 전체 호버 시 확대(scale)만 끔. `reelLayout`+`reelStrip`+`trendingRankCardPrice`(몰 타일)는 항상 끔 */
  disableHoverScale?: boolean;
  /** 제목·가격 아래 추가 블록(인기순위 지표 등) */
  footerExtension?: ReactNode;
  /** 기본 `/video/{id}` 대신 사용할 상세·창작 링크 (인기순위 → 맞춤 리스킨 등) */
  detailHref?: string;
  /** 지정 시 썸네일 전체 클릭이 상세 링크 대신 이 콜백(탐색 → 세로 릴 등) */
  onPick?: () => void;
  /** 비디오 preload 전략 제어 (기본 metadata) */
  preloadMode?: "none" | "metadata" | "auto";
  /** 카드 폭이 작은 구간(연관 동영상 등)에서 hover 액션 아이콘만 축소 */
  compactHoverActions?: boolean;
  /** true면 호버 액션에서 좋아요(하트) 아이콘 숨김 */
  hideLikeAction?: boolean;
  /** true면 호버 액션(장바구니/좋아요/찜) 전체 숨김 */
  hideHoverActions?: boolean;
  /** true면 작성자(아이디) 한 줄 숨김 */
  hideCreatorMeta?: boolean;
  /** hideCreatorMeta일 때 제목 앞 판매자 프로필(쇼핑몰 그리드 등) */
  showSellerAvatar?: boolean;
  /** true면 하단 정보 바(아이디·제목·가격) 전체 숨김 */
  hideInfoBar?: boolean;
  /** 홈 인기순위 그리드만 — 가격 글자 흰색·한 단계 크게 */
  trendingRankCardPrice?: boolean;
  /** 마이 찜/좋아요 목록 그리드 — 가격 흰색·호버 네온·카드 확대 없음 */
  mypageListCard?: boolean;
  /**
   * 릴 카드 우측 호버 액션(장바구니·좋아요·찜) **위**에 렌더 — 동일 레일 스타일·정렬.
   * `hideHoverActions`가 true면 무시됩니다.
   */
  reelHoverRailLead?: ReactNode;
};

function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
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
  const { t } = useTranslation();
  if (!open) return null;

  return createPortal(
    <AuthModalPortal onDismiss={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("auth.dialogAria")}
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
          aria-label={t("a11y.close")}
        >
          ×
        </button>
        <p
          className={`${araAuthDialogWordmarkClassName} ${authModalBrandHeadlineClassName}`}
          style={araWordmarkFontStyle}
        >
          ARA
        </p>
        <p
          className={`relative mt-3 text-center text-[clamp(1.15rem,4.6vw,1.85rem)] font-semibold leading-tight text-zinc-100 ${authModalBrandHeadlineClassName}`}
        >
          {t("auth.loginSignupTitle")}
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
  showSellerAvatar = false,
  hideInfoBar = false,
  trendingRankCardPrice = false,
  mypageListCard = false,
  reelHoverRailLead,
}: Props) {
  const { t, locale } = useTranslation();
  const dopamine = useDopamineBasketOptional();
  const { user, loading: authLoading, supabaseConfigured } = useAuthSession();
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
  const [likePulse, setLikePulse] = useState(false);
  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const authPromptScrollYRef = useRef(0);
  const displayTitle = useVideoDisplayTitle();
  const aspectClass = videoShortFormAspectClassName;
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
  const sellerSocialLinks = useSellerSocialLinks(
    video.listing?.sellerId,
    video.sellerSocialLinks,
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
  const { wishlisted, toggleWishlist } = useVideoWishlistAction(video, requireAuth);
  const { inCart, toggleCartFromButton } = useVideoCartAction(
    video,
    dopamine ?? undefined,
    requireAuth,
  );
  const { likedByMe, likeBusy, toggleLike } = useVideoLike({
    videoId: video.id,
    requireAuth,
    onError: () => {
      if (typeof window !== "undefined") {
        window.alert(t("explore.likeFailed"));
      }
    },
  });

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

  const toggleInternalLike = useCallback(async () => {
    const nextLiked = !likedByMe;
    setLikePulse(true);
    window.setTimeout(() => setLikePulse(false), 170);
    await toggleLike();
  }, [likedByMe, toggleLike]);

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
      ? "rounded-lg border border-white/10 bg-white/[0.055] shadow-none backdrop-blur-md hover:border-white/25 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:hover:border-zinc-300"
      : mypageListCard
        ? "rounded-xl border border-white/10 bg-white/[0.055] shadow-none backdrop-blur-md transition-[border-color,background-color] duration-200 ease-out hover:border-white/16 hover:bg-white/[0.07] [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:hover:border-zinc-300 [html[data-theme='light']_&]:hover:bg-zinc-50"
        : "rounded-xl border border-white/10 bg-white/[0.055] shadow-none backdrop-blur-md hover:border-white/20 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:hover:border-zinc-300";

  const priceLabel =
    video.priceWon != null && video.priceWon > 0
      ? formatGem(toGemPrice(video.priceWon), locale as SiteLocale)
      : null;
  const socialLinksToShow = sellerSocialLinks;
  const sellerHref = useMemo(() => sellerProfileHrefFromVideo(video), [video]);
  const sellerName = useMemo(() => sellerDisplayNameFromVideo(video), [video]);
  const videoContentSource = useMemo(() => getVideoContentSource(video), [video]);

  const quilt =
    showRelatedQuilt && !dense ? <RelatedDnaQuilt video={video} /> : null;

  const topBadgePos = showMicro
    ? "right-1.5 top-1.5 max-w-[min(100%-12px,6rem)] sm:right-2 sm:top-2 sm:max-w-[7rem]"
    : "left-1.5 top-1.5 max-w-[min(100%-12px,7rem)] sm:left-2 sm:top-2 sm:max-w-[9rem]";

  const transitionCls = mypageListCard
    ? "transition-[border-color,background-color] duration-200 ease-out motion-reduce:transition-none"
    : overlapOnHover === true
      ? "transition-[transform,box-shadow] duration-[400ms] ease-in-out motion-reduce:transition-none"
      : !dense && !flush
        ? "transition-[transform,box-shadow] duration-[400ms] ease-in-out motion-reduce:transition-none"
        : "transition-[box-shadow] duration-[400ms] ease-in-out";

  const overlapHover =
    overlapOnHover === true
      ? "relative z-0 hover:z-[30] hover:overflow-visible hover:-translate-y-0.5 hover:scale-[1.06] hover:shadow-xl motion-reduce:hover:translate-y-0 motion-reduce:hover:scale-100 motion-reduce:hover:shadow-md"
      : "";

  /** 쇼핑·카테고리 그리드 등 세로 타일 — 카드 전체 scale 호버는 끔(영상만 커지는 느낌 방지) */
  const mallStripTile = reelLayout && reelStrip && trendingRankCardPrice;
  const gridHoverScale =
    disableHoverScale ||
    dense ||
    flush ||
    overlapOnHover === true ||
    mypageListCard ||
    mallStripTile
      ? ""
      : subtleHover
        ? "origin-top hover:z-[2] hover:scale-[1.02] motion-reduce:hover:scale-100"
        : "hover:z-[2] hover:scale-[1.05] motion-reduce:hover:scale-100";
  const compactActions = compactHoverActions && !dense;
  const reelBtnShell = dense
    ? reelActionBtnDense
    : compactActions
      ? reelActionBtnCompact
      : reelActionBtn;
  const reelIconCls = dense
    ? reelActionIconDense
    : compactActions
      ? reelActionIconCompact
      : reelActionIcon;

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
      <div
        className={`${videoReelMediaRootClassName} relative overflow-hidden bg-black/40 ${aspectClass}`}
      >
        {externalIframe ? (
          <div className="absolute inset-0 z-0 overflow-hidden">
            <iframe
              title={`${displayTitle(video)}-${externalIframe.kind}`}
              src={externalIframe.src}
              sandbox={EXTERNAL_EMBED_IFRAME_SANDBOX}
              className={`pointer-events-none border-0 ${
                externalIframe.kind === "instagram"
                  ? "absolute left-1/2 top-[2%] h-[118%] w-[112%] max-w-none -translate-x-1/2"
                  : externalIframe.kind === "youtube"
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
            aria-label={t("video.card.reelViewAria", { title: displayTitle(video) })}
          />
        ) : (
          <Link
            href={detailHref ?? `/video/${video.id}`}
            className="absolute inset-0 z-[3]"
            aria-label={
              detailHref?.endsWith("/customize")
                ? t("video.card.customizeAria", { title: displayTitle(video) })
                : t("video.card.detailAria", { title: displayTitle(video) })
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
              <span className="truncate rounded-full border border-[color:var(--reels-point)]/40 bg-[color:var(--reels-point)] px-1.5 py-0.5 text-[9px] font-bold leading-none text-white sm:px-2 sm:text-[10px]">
                {topBadge}
              </span>
            ) : null}
          </div>
        ) : null}
        {showMicro && topBadge ? (
          <span
            className={`pointer-events-none absolute z-[6] truncate rounded-full border border-[color:var(--reels-point)]/40 bg-[color:var(--reels-point)] px-1.5 py-0.5 text-[9px] font-bold leading-none text-white sm:px-2 sm:text-[10px] ${topBadgePos}`}
          >
            {topBadge}
          </span>
        ) : null}
        {video.durationSec != null ? (
          <span
            className={`${videoCardDurationBadgeClass} pointer-events-none absolute right-2 top-2 z-[6] font-semibold tabular-nums leading-none text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.92),0_0_12px_rgba(0,0,0,0.55)] sm:right-2.5 sm:top-2.5 ${
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
          <div className={reelActionRailOuter}>
            <div className={reelActionRailColumn}>
              {reelHoverRailLead ?? null}
              <button
                ref={cartBtnRef}
                type="button"
                className={`${reelBtnShell} ${inCart ? reelActionBtnActive : ""}`}
                aria-label={inCart ? "장바구니에서 빼기" : "장바구니에 담기"}
                aria-pressed={inCart}
                title={inCart ? "장바구니에서 빼기" : "장바구니 담기"}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!requireAuth()) return;
                  const el = cartBtnRef.current;
                  if (el) {
                    toggleCartFromButton(el, thumbnailSrc);
                  }
                }}
              >
                <CartIcon
                  className={`${reelIconCls} ${reelActionIconColorClass(inCart)}`}
                />
              </button>
              {!hideLikeAction ? (
                <button
                  type="button"
                  className={reelBtnShell}
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
                    strokeWidth={1.5}
                    className={`${reelIconCls} transition-transform duration-200 ${likedByMe ? `fill-current ${reelActionIconColorClass(true)}` : reelActionIconColorClass(false)} ${
                      likePulse ? "scale-110" : "scale-100"
                    }`}
                  />
                </button>
              ) : null}
              <button
                type="button"
                className={`${reelBtnShell} ${wishlisted ? reelActionBtnActive : ""}`}
                aria-label={wishlisted ? "찜 해제" : "찜하기"}
                aria-pressed={wishlisted}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!requireAuth()) return;
                  toggleWishlist();
                }}
              >
                <span className={`relative isolate block ${reelIconCls}`}>
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
                    className={`pointer-events-none absolute inset-0 z-[1] block h-full w-full ${reelActionIconColorClass(wishlisted)}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    aria-hidden
                  />
                </span>
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {hideInfoBar ? null : (
      <div
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
          <div className={`flex min-w-0 items-center ${dense ? "gap-1" : "gap-1.5"}`}>
            {hideCreatorMeta && showSellerAvatar ? (
              <SellerProfileAvatarLink video={video} size="sm" />
            ) : null}
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
              {displayTitle(video)}
            </h3>
            {priceLabel ? (
              <span
                className={
                  trendingRankCardPrice
                    ? "video-card-mall-price shrink-0 rounded-md px-2 py-0.5 text-right text-[13px] font-extrabold tabular-nums text-zinc-50 transition-colors duration-200 motion-reduce:transition-none [html[data-theme='light']_&]:text-zinc-950 sm:text-[15px] group-hover:bg-white/[0.08] group-hover:text-white motion-reduce:group-hover:bg-transparent"
                    : mypageListCard
                      ? `video-card-mall-price shrink-0 rounded-md px-1.5 py-0.5 text-right font-semibold tabular-nums text-white transition-colors duration-200 ease-out motion-reduce:transition-none group-hover:bg-white/[0.06] [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:group-hover:bg-zinc-200/45 ${
                          dense
                            ? "text-[10px]"
                            : reelStrip
                              ? "text-[12px] sm:text-[13px]"
                              : reelLayout
                                ? "text-[12px] sm:text-[13px]"
                                : "text-[11px] sm:text-[12px]"
                        }`
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
          <SellerSocialLinkIcons
            links={socialLinksToShow}
            size="xs"
            stopPropagation
          />
        </div>
      </div>
      )}
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

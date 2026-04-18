"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Heart } from "lucide-react";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { RelatedDnaQuilt } from "@/components/RelatedDnaQuilt";
import { useDopamineBasketOptional } from "@/context/DopamineBasketContext";
import { useWishlistOptional } from "@/context/WishlistContext";
import type { FeedVideo } from "@/data/videos";
import { useHoverInstantPreview } from "@/hooks/useHoverInstantPreview";
import { useLocalSamplePlayback } from "@/hooks/useLocalSamplePlayback";
import {
  clonesRemaining,
  getCommerceMeta,
  isMicroDna,
} from "@/data/videoCommerce";
import { isLocalPublicVideo } from "@/lib/localVideoHighlight";
import { CartIcon } from "@/components/CartIcon";

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
};

function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
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
}: Props) {
  const dopamine = useDopamineBasketOptional();
  const wishlist = useWishlistOptional();
  const reduceMotion = useReducedMotion() ?? false;
  const commerce = getCommerceMeta(video.id);
  const remaining = clonesRemaining(commerce);
  const showMicro = !hideMicroDnaBadge && isMicroDna(video);
  const showAiBadge = video.isAiGenerated === true;
  const cartBtnRef = useRef<HTMLButtonElement>(null);
  const liked = wishlist?.isSaved(video.id) ?? false;
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
  const canLoadPreviewVideo = !isPexelsBlockedVideo;
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
    // TikTok iframe은 카드를 그릴 때 정지 프레임을 이미 보여줄 수 있으므로
    // 그라데이션 fallback을 쓰지 않습니다.
    if (video.tiktokEmbedId) return "";
    if (isLocalPublicVideo(previewSrc)) return "";
    return fallbackPoster;
  }, [normalizedPoster, previewSrc, fallbackPoster, video.tiktokEmbedId]);
  const [thumbnailSrc, setThumbnailSrc] = useState(defaultThumbnail);
  const [isPreviewing, setIsPreviewing] = useState(false);

  useEffect(() => {
    setThumbnailSrc(defaultThumbnail);
    setIsPreviewing(false);
  }, [defaultThumbnail]);

  const segmentPreviewEffective = segmentPreview && !video.tiktokEmbedId;
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

  return (
    <article
      id={domId}
      className={`group flex flex-col overflow-hidden ${transitionCls} ${shell} ${overlapHover} ${gridHoverScale} ${className ?? ""}`}
      onMouseEnter={
        video.tiktokEmbedId
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
        video.tiktokEmbedId
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
      onMouseMove={video.tiktokEmbedId ? playTikTok : undefined}
    >
      <div className={`relative overflow-hidden bg-black/40 ${aspectClass}`}>
        {video.tiktokEmbedId ? (
          <div className="absolute inset-0 z-0 flex items-center justify-center">
            <iframe
              title={`${video.title}-tiktok`}
              src={`https://www.tiktok.com/embed/v2/${video.tiktokEmbedId}?autoplay=1&mute=1&controls=0`}
              className="h-full w-auto max-w-full border-0 aspect-[9/16]"
              allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
              allowFullScreen
              loading="eager"
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
              video.tiktokEmbedId
                ? "object-contain bg-black duration-75"
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
          className="pointer-events-none absolute inset-0 z-[1] bg-black/0 transition-colors duration-300 ease-out group-hover:bg-black/30 motion-reduce:group-hover:bg-black/25"
          aria-hidden
        />
        {video.tiktokEmbedId ? null : onPick ? (
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
        <div
          className={`pointer-events-none absolute inset-0 z-[7] flex items-center justify-center ${
            dense ? "p-2" : reelStrip ? "p-2 sm:p-3" : reelLayout ? "p-4 sm:p-6" : "p-4"
          }`}
        >
          <div
            className={`flex items-center justify-center opacity-0 transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:duration-200 translate-y-1 group-hover:translate-y-0 group-hover:opacity-100 ${
              dense ? "gap-5" : reelStrip ? "gap-4 sm:gap-6" : reelLayout ? "gap-8 sm:gap-12" : "gap-10"
            }`}
          >
            <button
              ref={cartBtnRef}
              type="button"
              className={`pointer-events-auto relative z-[8] inline-flex items-center justify-center rounded-full text-white opacity-90 transition-transform duration-300 ease-out hover:scale-110 ${
                dense
                  ? "h-8 w-8"
                  : reelStrip
                    ? "h-9 w-9 sm:h-10 sm:w-10"
                    : reelLayout
                      ? "h-11 w-11 sm:h-12 sm:w-12"
                      : "h-10 w-10"
              }`}
              aria-label="장바구니에 담기"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const el = cartBtnRef.current;
                if (el && dopamine) {
                  dopamine.launchFromCartButton(el, video, thumbnailSrc);
                }
              }}
            >
              <CartIcon
                className={`shrink-0 drop-shadow-md ${
                  dense
                    ? "h-6 w-6"
                    : reelStrip
                      ? "h-7 w-7 sm:h-8 sm:w-8"
                      : reelLayout
                        ? "h-9 w-9 sm:h-10 sm:w-10"
                        : "h-8 w-8"
                }`}
              />
            </button>
            <button
              type="button"
              className={`pointer-events-auto relative z-[8] inline-flex items-center justify-center rounded-full text-white opacity-90 transition-transform duration-300 ease-out hover:scale-110 ${
                dense
                  ? "h-8 w-8"
                  : reelStrip
                    ? "h-9 w-9 sm:h-10 sm:w-10"
                    : reelLayout
                      ? "h-11 w-11 sm:h-12 sm:w-12"
                      : "h-10 w-10"
              }`}
              aria-label={liked ? "찜 해제" : "찜하기"}
              aria-pressed={liked}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                wishlist?.toggle(video);
              }}
            >
              <span
                className={`relative isolate block shrink-0 ${
                  dense
                    ? "h-6 w-6"
                    : reelStrip
                      ? "h-7 w-7 sm:h-8 sm:w-8"
                      : reelLayout
                        ? "h-9 w-9 sm:h-10 sm:w-10"
                        : "h-8 w-8"
                }`}
              >
                {/* 찜 클릭 시에만 아래→위 채움 — fill만 써서 바깥 stroke와 동일 실루엣 */}
                <motion.span
                  className="absolute inset-0 overflow-hidden"
                  initial={false}
                  animate={{
                    clipPath: liked
                      ? "inset(0% 0% 0% 0%)"
                      : "inset(0% 0% 100% 0%)",
                  }}
                  transition={{
                    duration: reduceMotion ? 0 : 0.52,
                    ease: [0.22, 0.99, 0.36, 1],
                  }}
                >
                  <Heart
                    className="block h-full w-full"
                    fill="white"
                    stroke="none"
                    strokeWidth={0}
                    aria-hidden
                  />
                </motion.span>
                <Heart
                  className="pointer-events-none absolute inset-0 z-[1] block h-full w-full drop-shadow-md"
                  fill="none"
                  stroke="white"
                  strokeWidth={1.75}
                  aria-hidden
                />
              </span>
            </button>
          </div>
        </div>
      </div>

      <div
        className={`flex items-stretch border-t border-white/10 bg-black/25 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50 ${
          dense
            ? "min-h-[34px] px-1.5 py-1 sm:min-h-[36px]"
            : reelStrip
              ? "min-h-[44px] px-2 py-2 sm:min-h-[48px] sm:px-2.5 sm:py-2.5"
              : reelLayout
                ? "min-h-[48px] px-2.5 py-2 sm:min-h-[52px] sm:px-3 sm:py-2.5"
                : "min-h-[40px] px-2 py-1.5 sm:min-h-[44px] sm:px-2.5 sm:py-2"
        }`}
      >
        <div className={`flex min-w-0 flex-1 items-center ${dense ? "gap-1" : "gap-2"}`}>
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
              className={`shrink-0 rounded-md px-1.5 py-0.5 text-right font-extrabold tabular-nums text-reels-cyan transition-[transform,background-color,color,box-shadow,font-weight] duration-[400ms] ease-in-out motion-reduce:transition-none group-hover:scale-[1.07] group-hover:bg-reels-crimson group-hover:font-extrabold group-hover:text-white group-hover:shadow-reels-crimson motion-reduce:group-hover:scale-100 motion-reduce:group-hover:bg-transparent motion-reduce:group-hover:font-extrabold motion-reduce:group-hover:text-reels-cyan motion-reduce:group-hover:shadow-none [html[data-theme='light']_&]:text-[#00a8b5] ${
                dense
                  ? "text-[10px]"
                  : reelStrip
                    ? "text-[12px] sm:text-[13px]"
                    : reelLayout
                      ? "text-[12px] sm:text-[13px]"
                      : "text-[11px] sm:text-[12px]"
              }`}
            >
              {priceLabel}
            </span>
          ) : null}
        </div>
      </div>
      {footerExtension}
      {quilt}
    </article>
  );
}

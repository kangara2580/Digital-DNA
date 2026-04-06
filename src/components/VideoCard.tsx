"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Heart } from "lucide-react";
import Link from "next/link";
import { useCallback, useRef, type ReactNode } from "react";
import { CloneCountAnimation } from "@/components/CloneCountAnimation";
import { RelatedDnaQuilt } from "@/components/RelatedDnaQuilt";
import { useDopamineBasketOptional } from "@/context/DopamineBasketContext";
import { useWishlistOptional } from "@/context/WishlistContext";
import type { FeedVideo } from "@/data/videos";
import { useHoverInstantPreview } from "@/hooks/useHoverInstantPreview";
import {
  clonesRemaining,
  getCommerceMeta,
  isMicroDna,
} from "@/data/videoCommerce";

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
  /** 앵커 링크용 (연관 DNA에서 스크롤) */
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
  /** 제목·가격 아래 추가 블록(인기순위 지표 등) */
  footerExtension?: ReactNode;
};

function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

function CartIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M6 7h15l-1.5 9h-12L6 7z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M6 7 5 3H2"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <circle cx="9" cy="20" r="1.35" fill="currentColor" />
      <circle cx="17" cy="20" r="1.35" fill="currentColor" />
    </svg>
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
  footerExtension,
}: Props) {
  const dopamine = useDopamineBasketOptional();
  const wishlist = useWishlistOptional();
  const reduceMotion = useReducedMotion() ?? false;
  const commerce = getCommerceMeta(video.id);
  const remaining = clonesRemaining(commerce);
  const showMicro = !hideMicroDnaBadge && isMicroDna(video);
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
  const segmentPreview = instantPreview === true;

  const {
    ref,
    onTimeUpdate,
    onEnter: previewEnter,
    onLeave: previewLeave,
  } = useHoverInstantPreview(segmentPreview, video, reduceMotion);

  const play = useCallback(() => {
    previewEnter();
  }, [previewEnter]);

  const pause = useCallback(() => {
    previewLeave();
  }, [previewLeave]);

  const shell = flush
    ? "rounded-none border-0 bg-transparent shadow-none"
    : dense
      ? "rounded-lg border border-white/10 bg-white/[0.055] shadow-none backdrop-blur-md hover:border-reels-cyan/25 hover:shadow-reels-cyan/20"
      : "rounded-xl border border-white/10 bg-white/[0.055] shadow-none backdrop-blur-md hover:border-reels-crimson/20 hover:shadow-reels-crimson/25";

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
    !dense && !flush && overlapOnHover !== true
      ? "hover:z-[2] hover:scale-[1.05] motion-reduce:hover:scale-100"
      : "";

  return (
    <article
      id={domId}
      className={`group flex flex-col overflow-hidden ${transitionCls} ${shell} ${overlapHover} ${gridHoverScale} ${className ?? ""}`}
      onMouseEnter={play}
      onMouseLeave={pause}
    >
      <div className={`relative bg-black/40 ${aspectClass}`}>
        <video
          ref={ref}
          className="absolute inset-0 z-0 h-full w-full object-cover"
          poster={video.poster}
          playsInline
          muted
          loop={!segmentPreview}
          preload={segmentPreview ? "auto" : "metadata"}
          onTimeUpdate={segmentPreview ? onTimeUpdate : undefined}
        >
          <source src={previewSrc} type="video/mp4" />
        </video>
        <div
          className="pointer-events-none absolute inset-0 z-[1] bg-black/0 transition-colors duration-300 ease-out group-hover:bg-black/30 motion-reduce:group-hover:bg-black/25"
          aria-hidden
        />
        <Link
          href={`/video/${video.id}`}
          className="absolute inset-0 z-[3]"
          aria-label={`${video.title} 상세 페이지`}
        />
        {showMicro ? (
          <span className="pointer-events-none absolute left-1.5 top-1.5 z-[6] rounded border border-reels-cyan/40 bg-black/55 px-1 py-[1px] text-[6.5px] font-bold uppercase leading-tight tracking-[0.06em] text-reels-cyan sm:left-2 sm:top-2 sm:px-1.5 sm:text-[7.5px]">
            Micro DNA
          </span>
        ) : null}
        {topBadge ? (
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
        {!hideCloneStrip ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[6] bg-gradient-to-t from-black/55 via-black/25 to-transparent px-1.5 pb-1 pt-5 sm:px-2 sm:pb-1.5 sm:pt-6">
            {remaining == null ? (
              <p className="font-mono text-[7px] font-medium leading-tight text-slate-200/95 sm:text-[8px]">
                <span className="text-slate-300/90">Cloned: </span>
                {dense ? (
                  <span className="tabular-nums text-slate-100">
                    {commerce.salesCount.toLocaleString("en-US")}
                  </span>
                ) : (
                  <CloneCountAnimation value={commerce.salesCount} />
                )}
                <span className="text-slate-300/90"> times</span>
              </p>
            ) : remaining > 0 ? (
              <p className="font-mono text-[7px] font-semibold leading-tight text-amber-100/95 sm:text-[8px]">
                Only {remaining} clones left
              </p>
            ) : (
              <p className="font-mono text-[7px] font-semibold leading-tight text-red-200/95 sm:text-[8px]">
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
                  dopamine.launchFromCartButton(el, video, video.poster);
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
        className={`flex items-stretch border-t border-white/10 bg-black/25 ${
          dense
            ? "min-h-[34px] px-1.5 py-1 sm:min-h-[36px]"
            : reelStrip
              ? "min-h-[40px] px-1.5 py-1.5 sm:min-h-[42px] sm:px-2 sm:py-2"
              : reelLayout
                ? "min-h-[48px] px-2.5 py-2 sm:min-h-[52px] sm:px-3 sm:py-2.5"
                : "min-h-[40px] px-2 py-1.5 sm:min-h-[44px] sm:px-2.5 sm:py-2"
        }`}
      >
        <div className={`flex min-w-0 flex-1 items-center ${dense ? "gap-1" : "gap-2"}`}>
          <h3
            className={`line-clamp-2 min-w-0 flex-1 text-left font-semibold leading-snug text-zinc-100 ${
              dense
                ? "text-[10px] sm:text-[10px]"
                : reelStrip
                  ? "text-[10px] sm:text-[11px]"
                  : reelLayout
                    ? "text-[12px] sm:text-[13px]"
                    : "text-[11px] sm:text-[12px]"
            }`}
          >
            {video.title}
          </h3>
          {priceLabel ? (
            <span
              className={`shrink-0 rounded-md px-1 py-0.5 text-right font-extrabold tabular-nums text-reels-cyan transition-[transform,background-color,color,box-shadow,font-weight] duration-[400ms] ease-in-out motion-reduce:transition-none group-hover:scale-[1.07] group-hover:bg-reels-crimson group-hover:font-extrabold group-hover:text-white group-hover:shadow-reels-crimson motion-reduce:group-hover:scale-100 motion-reduce:group-hover:bg-transparent motion-reduce:group-hover:font-extrabold motion-reduce:group-hover:text-reels-cyan motion-reduce:group-hover:shadow-none ${
                dense
                  ? "text-[10px]"
                  : reelStrip
                    ? "text-[10px] sm:text-[11px]"
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

"use client";

import { Heart } from "lucide-react";
import Link from "next/link";
import { useCallback, useRef } from "react";
import { CloneCountAnimation } from "@/components/CloneCountAnimation";
import { RelatedDnaQuilt } from "@/components/RelatedDnaQuilt";
import { useDopamineBasketOptional } from "@/context/DopamineBasketContext";
import type { FeedVideo } from "@/data/videos";
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
  topBadge,
  domId,
  showRelatedQuilt,
  hideMicroDnaBadge,
  hideCloneStrip,
}: Props) {
  const dopamine = useDopamineBasketOptional();
  const commerce = getCommerceMeta(video.id);
  const remaining = clonesRemaining(commerce);
  const showMicro = !hideMicroDnaBadge && isMicroDna(video);
  const cartBtnRef = useRef<HTMLButtonElement>(null);
  const aspectClass =
    video.orientation === "portrait"
      ? "aspect-[4/5] w-full"
      : "aspect-video w-full";
  const ref = useRef<HTMLVideoElement>(null);

  const play = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.muted = true;
    void el.play().catch(() => {});
  }, []);

  const pause = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.pause();
    el.currentTime = 0;
  }, []);

  const shell = flush
    ? "rounded-none border-0 bg-white shadow-none"
    : dense
      ? "rounded-lg border border-slate-200/85 bg-white shadow-sm hover:shadow-md"
      : "rounded-xl border border-slate-200/90 bg-white shadow-sm hover:shadow-md";

  const priceLabel =
    video.priceWon != null
      ? `${video.priceWon.toLocaleString("ko-KR")}원`
      : null;

  const quilt =
    showRelatedQuilt && !dense ? <RelatedDnaQuilt video={video} /> : null;

  const topBadgePos = showMicro
    ? "right-1.5 top-1.5 max-w-[min(100%-12px,6rem)] sm:right-2 sm:top-2 sm:max-w-[7rem]"
    : "left-1.5 top-1.5 max-w-[min(100%-12px,7rem)] sm:left-2 sm:top-2 sm:max-w-[9rem]";

  return (
    <article
      id={domId}
      className={`group flex flex-col overflow-hidden transition-shadow duration-300 ${shell} ${className ?? ""}`}
      onMouseEnter={play}
      onMouseLeave={pause}
    >
      <div className={`relative bg-slate-100 ${aspectClass}`}>
        <video
          ref={ref}
          className="absolute inset-0 z-0 h-full w-full object-cover"
          poster={video.poster}
          playsInline
          muted
          loop
          preload="metadata"
        >
          <source src={video.src} type="video/mp4" />
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
          <span className="pointer-events-none absolute left-1.5 top-1.5 z-[6] rounded border border-slate-300/95 bg-transparent px-1 py-[1px] text-[6.5px] font-semibold uppercase leading-tight tracking-[0.06em] text-slate-600 sm:left-2 sm:top-2 sm:px-1.5 sm:text-[7.5px]">
            Micro DNA
          </span>
        ) : null}
        {topBadge ? (
          <span
            className={`pointer-events-none absolute z-[6] truncate rounded-full bg-slate-900/90 px-1.5 py-0.5 text-[9px] font-semibold leading-none text-white sm:px-2 sm:text-[10px] ${topBadgePos}`}
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
          className={`pointer-events-none absolute inset-0 z-[7] flex items-center justify-center ${dense ? "p-2" : "p-4"}`}
        >
          <div
            className={`flex items-center justify-center opacity-0 transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:duration-200 translate-y-1 group-hover:translate-y-0 group-hover:opacity-100 ${
              dense ? "gap-5" : "gap-10"
            }`}
          >
            <button
              ref={cartBtnRef}
              type="button"
              className={`pointer-events-auto relative z-[8] inline-flex items-center justify-center rounded-full text-white opacity-90 transition-transform duration-300 ease-out hover:scale-110 ${
                dense ? "h-8 w-8" : "h-10 w-10"
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
                className={`shrink-0 drop-shadow-md ${dense ? "h-6 w-6" : "h-8 w-8"}`}
              />
            </button>
            <button
              type="button"
              className={`pointer-events-auto relative z-[8] inline-flex items-center justify-center rounded-full text-white opacity-90 transition-transform duration-300 ease-out hover:scale-110 ${
                dense ? "h-8 w-8" : "h-10 w-10"
              }`}
              aria-label="찜하기"
              onClick={(e) => e.preventDefault()}
            >
              <Heart
                className={`shrink-0 fill-none drop-shadow-md ${dense ? "h-6 w-6" : "h-8 w-8"}`}
                strokeWidth={1.75}
                aria-hidden
              />
            </button>
          </div>
        </div>
      </div>

      <div
        className={`flex items-stretch border-t border-slate-200/80 bg-white ${
          dense
            ? "min-h-[34px] px-1.5 py-1 sm:min-h-[36px]"
            : "min-h-[40px] px-2 py-1.5 sm:min-h-[44px] sm:px-2.5 sm:py-2"
        }`}
      >
        <div className={`flex min-w-0 flex-1 items-center ${dense ? "gap-1" : "gap-2"}`}>
          <h3
            className={`line-clamp-2 min-w-0 flex-1 text-left font-medium leading-snug text-slate-800 ${
              dense ? "text-[10px] sm:text-[10px]" : "text-[11px] sm:text-[12px]"
            }`}
          >
            {video.title}
          </h3>
          {priceLabel ? (
            <span
              className={`shrink-0 rounded-md px-1 py-0.5 text-right font-semibold tabular-nums text-slate-900 transition-[transform,background-color,color,box-shadow,font-weight] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none group-hover:scale-[1.07] group-hover:bg-slate-900 group-hover:font-bold group-hover:text-white group-hover:shadow-md motion-reduce:group-hover:scale-100 motion-reduce:group-hover:bg-transparent motion-reduce:group-hover:font-semibold motion-reduce:group-hover:text-slate-900 motion-reduce:group-hover:shadow-none ${
                dense ? "text-[10px]" : "text-[11px] sm:text-[12px]"
              }`}
            >
              {priceLabel}
            </span>
          ) : null}
        </div>
      </div>
      {quilt}
    </article>
  );
}

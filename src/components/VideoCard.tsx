"use client";

import { useCallback, useRef } from "react";
import type { FeedVideo } from "@/data/videos";

type Props = { video: FeedVideo; className?: string; flush?: boolean };

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

/** 하트 대신 대칭 북마크 — 장바구니 아이콘과 같은 24×24·선 굵기로 수직 정렬 맞춤 */
function BookmarkIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M6 3.5h12a1.5 1.5 0 011.5 1.5v15.5l-7.5-4.5L4.5 20.5V5A1.5 1.5 0 016 3.5z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function VideoCard({ video, className, flush }: Props) {
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
    : "rounded-xl border border-slate-200/90 bg-white shadow-sm hover:shadow-md";

  const priceLabel =
    video.priceWon != null
      ? `${video.priceWon.toLocaleString("ko-KR")}원`
      : null;

  return (
    <article
      className={`group flex flex-col overflow-hidden transition-shadow duration-300 ${shell} ${className ?? ""}`}
      onMouseEnter={play}
      onMouseLeave={pause}
    >
      <div className={`relative bg-slate-100 ${aspectClass}`}>
        {video.durationSec != null ? (
          <span className="absolute right-2 top-2 z-[4] rounded bg-black/72 px-1.5 py-px text-[10px] font-medium tabular-nums leading-tight text-white/95 ring-1 ring-white/12 sm:right-2.5 sm:top-2.5 sm:text-[11px]">
            {formatDuration(video.durationSec)}
          </span>
        ) : null}
        <video
          ref={ref}
          className="absolute inset-0 h-full w-full object-cover"
          poster={video.poster}
          playsInline
          muted
          loop
          preload="metadata"
        >
          <source src={video.src} type="video/mp4" />
        </video>

        <div
          className="pointer-events-none absolute inset-0 z-[1] bg-black/0 transition-colors duration-300 ease-out group-hover:bg-black/38 motion-reduce:group-hover:bg-black/30"
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 z-[2] flex items-center justify-center p-4">
          <div className="flex items-center justify-center gap-10 opacity-0 transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:duration-200 translate-y-1 group-hover:translate-y-0 group-hover:opacity-100">
            <button
              type="button"
              className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full text-white opacity-90 transition-transform duration-300 ease-out hover:scale-110"
              aria-label="장바구니"
              onClick={(e) => e.preventDefault()}
            >
              <CartIcon className="h-8 w-8 shrink-0 drop-shadow-md" />
            </button>
            <button
              type="button"
              className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full text-white opacity-90 transition-transform duration-300 ease-out hover:scale-110"
              aria-label="찜하기"
              onClick={(e) => e.preventDefault()}
            >
              <BookmarkIcon className="h-8 w-8 shrink-0 drop-shadow-md" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex min-h-[40px] items-stretch border-t border-slate-200/80 bg-white px-2 py-1.5 sm:min-h-[44px] sm:px-2.5 sm:py-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <h3 className="line-clamp-2 min-w-0 flex-1 text-left text-[11px] font-medium leading-snug text-slate-800 sm:text-[12px]">
            {video.title}
          </h3>
          {priceLabel ? (
            <span className="shrink-0 rounded-md px-1.5 py-0.5 text-right text-[11px] font-semibold tabular-nums text-slate-900 transition-[transform,background-color,color,box-shadow,font-weight] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none sm:text-[12px] group-hover:scale-[1.07] group-hover:bg-slate-900 group-hover:font-bold group-hover:text-white group-hover:shadow-md motion-reduce:group-hover:scale-100 motion-reduce:group-hover:bg-transparent motion-reduce:group-hover:font-semibold motion-reduce:group-hover:text-slate-900 motion-reduce:group-hover:shadow-none">
              {priceLabel}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

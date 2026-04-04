"use client";

import { useCallback, useRef } from "react";
import type { FeedVideo } from "@/data/videos";

type Props = { video: FeedVideo; className?: string; flush?: boolean };

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
    ? "border-0 bg-white shadow-none"
    : "border border-slate-200/90 bg-white shadow-sm hover:shadow-md";

  return (
    <article
      className={`group relative overflow-hidden transition-shadow duration-300 ${shell} ${className ?? ""}`}
      onMouseEnter={play}
      onMouseLeave={pause}
    >
      <div className={`relative bg-slate-100 ${aspectClass}`}>
        {video.priceWon != null ? (
          <span className="absolute right-2 top-2 z-[4] rounded-md bg-black/78 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-white ring-1 ring-white/15 sm:right-2.5 sm:top-2.5 sm:text-[12px]">
            {video.priceWon.toLocaleString("ko-KR")}원
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
          className="pointer-events-none absolute inset-0 z-[1] bg-black/0 transition-colors duration-300 ease-out group-hover:bg-black/40"
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 z-[2] flex flex-col justify-between p-4">
          <div className="flex flex-1 items-center justify-center gap-10 opacity-0 transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:duration-200 translate-y-1 group-hover:translate-y-0 group-hover:opacity-100">
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
          <div className="opacity-0 transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:duration-200 translate-y-1.5 group-hover:translate-y-0 group-hover:opacity-100">
            <h3 className="line-clamp-2 text-sm font-semibold text-white drop-shadow">
              {video.title}
            </h3>
            <p className="mt-1 text-xs text-white/90">{video.creator}</p>
          </div>
        </div>
      </div>
    </article>
  );
}

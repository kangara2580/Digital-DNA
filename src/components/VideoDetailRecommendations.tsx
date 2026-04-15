"use client";

import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { VideoCard } from "@/components/VideoCard";
import { getShopRecommendations } from "@/data/videoCatalog";
import type { FeedVideo } from "@/data/videos";
import { usePassVerticalWheelToPage } from "@/hooks/usePassVerticalWheelToPage";

type Props = {
  video: FeedVideo;
};

const STRIP_CAP = 30;
const INITIAL_GRID = 12;
const STEP = 12;

const STRIP_CARD_WRAP =
  "w-[42vw] max-w-[200px] shrink-0 sm:w-[180px]";

const ARROW_BTN =
  "pointer-events-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/60 text-zinc-200 shadow-lg shadow-black/40 backdrop-blur-md transition hover:border-reels-cyan/35 hover:text-white active:scale-[0.97] motion-reduce:transition-none [html[data-theme='light']_&]:border-zinc-300/40 [html[data-theme='light']_&]:bg-white/90 [html[data-theme='light']_&]:text-zinc-800 [html[data-theme='light']_&]:shadow-zinc-400/25";

/** 글로벌 이커머스 흔한 패턴: 상단 가로 스트립 + 아래 그리드(중복 없음) + 더보기 */
export function VideoDetailRecommendations({ video }: Props) {
  const pool = useMemo(() => getShopRecommendations(video.id, 72), [video.id]);
  const [gridVisible, setGridVisible] = useState(INITIAL_GRID);

  const stripItems = pool.slice(0, Math.min(STRIP_CAP, pool.length));
  const showStripMore = pool.length > STRIP_CAP;
  const afterStrip = pool.slice(STRIP_CAP);
  const grid = afterStrip.slice(0, gridVisible);

  const scrollRef = useRef<HTMLDivElement>(null);
  usePassVerticalWheelToPage(scrollRef);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const [atEnd, setAtEnd] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, clientWidth, scrollWidth } = el;
    const max = scrollWidth - clientWidth;
    setCanLeft(scrollLeft > 6);
    setCanRight(max > 6 && scrollLeft < max - 6);
    setAtEnd(max <= 6 || scrollLeft >= max - 8);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const ro = new ResizeObserver(() => updateScrollState());
    ro.observe(el);
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    updateScrollState();
    requestAnimationFrame(() => updateScrollState());

    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState, stripItems.length, showStripMore]);

  const scrollByDir = (dir: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    if (max <= 0) return;
    const step = Math.min(Math.max(el.clientWidth * 0.32, 220), max / 3.15);
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  if (pool.length === 0) return null;

  return (
    <section
      className="border-t border-white/10 pt-10 [html[data-theme='light']_&]:border-zinc-200"
      aria-labelledby="video-reco-heading"
    >
      <h2
        id="video-reco-heading"
        className="text-xl font-extrabold tracking-tight text-reels-cyan/90 [html[data-theme='light']_&]:text-reels-cyan"
      >
        연관릴스
      </h2>

      <div className="relative mt-6">
        {canLeft ? (
          <div
            className="pointer-events-none absolute inset-y-2 left-0 z-10 w-11 bg-gradient-to-r from-[#050505] via-[#050505]/88 to-transparent [html[data-theme='light']_&]:from-zinc-50 [html[data-theme='light']_&]:via-zinc-50/90"
            aria-hidden
          />
        ) : null}
        {canRight ? (
          <div
            className="pointer-events-none absolute inset-y-2 right-0 z-10 w-11 bg-gradient-to-l from-[#050505] via-[#050505]/88 to-transparent [html[data-theme='light']_&]:from-zinc-50 [html[data-theme='light']_&]:via-zinc-50/90"
            aria-hidden
          />
        ) : null}

        <div
          ref={scrollRef}
          className="feed-scroll -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:-mx-0 sm:px-0"
          role="region"
          aria-label="연관 릴스 가로 목록"
          tabIndex={0}
        >
          {stripItems.map((v) => (
            <div key={`strip-${video.id}-${v.id}`} className={STRIP_CARD_WRAP}>
              <VideoCard video={v} reelLayout disableHoverScale className="min-w-0" />
            </div>
          ))}
          {showStripMore ? (
            <div className={STRIP_CARD_WRAP}>
              <Link
                href="/category/recommend"
                className={`flex h-full min-h-[280px] w-full flex-col items-center justify-center gap-1 rounded-xl border border-white/15 bg-white/[0.04] px-3 py-4 text-center backdrop-blur-sm transition-colors hover:border-reels-cyan/35 hover:bg-white/[0.07] motion-reduce:transition-none [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-100/80 [html[data-theme='light']_&]:hover:border-reels-cyan/40 [html[data-theme='light']_&]:hover:bg-zinc-100 ${
                  atEnd ? "reels-trending-more-sparkle" : ""
                }`}
                aria-label="추천 카테고리에서 연관 릴스 더 보기"
              >
                <span className="text-[12px] font-extrabold leading-tight tracking-tight text-zinc-100 sm:text-[13px] [html[data-theme='light']_&]:text-zinc-900">
                  더보기
                </span>
                <span className="text-[10px] font-medium leading-snug text-zinc-500 sm:text-[11px] [html[data-theme='light']_&]:text-zinc-600">
                  추천 클립
                </span>
              </Link>
            </div>
          ) : null}
        </div>

        {canLeft ? (
          <button
            type="button"
            className={`${ARROW_BTN} absolute left-0 top-1/2 z-20 -translate-y-1/2`}
            aria-label="이전 연관 릴스"
            onClick={() => scrollByDir(-1)}
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2} aria-hidden />
          </button>
        ) : null}
        {canRight ? (
          <button
            type="button"
            className={`${ARROW_BTN} absolute right-0 top-1/2 z-20 -translate-y-1/2`}
            aria-label="다음 연관 릴스"
            onClick={() => scrollByDir(1)}
          >
            <ChevronRight className="h-5 w-5" strokeWidth={2} aria-hidden />
          </button>
        ) : null}
      </div>

      {afterStrip.length > 0 ? (
        <>
          <h3 className="mt-8 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
            More clips to shop
          </h3>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {grid.map((v) => (
              <VideoCard
                key={`grid-${video.id}-${v.id}`}
                video={v}
                reelLayout
                dense
                disableHoverScale
                className="min-w-0"
              />
            ))}
          </div>
        </>
      ) : null}

      {gridVisible < afterStrip.length ? (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => setGridVisible((n) => Math.min(n + STEP, afterStrip.length))}
            aria-label="추천 영상 더 보기"
            title="추천 영상 더 보기"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-reels-cyan/40 bg-reels-cyan/10 text-reels-cyan shadow-[0_0_20px_-6px_rgba(0,242,234,0.45)] transition hover:border-reels-cyan/60 hover:bg-reels-cyan/18 hover:shadow-[0_0_28px_-4px_rgba(0,242,234,0.55)] active:scale-[0.97] [html[data-theme='light']_&]:border-reels-cyan/45 [html[data-theme='light']_&]:bg-reels-cyan/12 [html[data-theme='light']_&]:text-reels-cyan"
          >
            <ChevronDown className="h-5 w-5" strokeWidth={2.25} aria-hidden />
          </button>
        </div>
      ) : null}
    </section>
  );
}

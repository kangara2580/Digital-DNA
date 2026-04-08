"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { TRENDING_RANK_CLIPS } from "@/data/videos";
import { useTrendingLiveRanking } from "@/hooks/useTrendingLiveRanking";
import { TrendingPlayIcon } from "./icons/SectionPlayIcons";
import { SectionMoreLink } from "./SectionMoreLink";
import { TrendingVideoStatsFooter } from "./TrendingVideoStatsFooter";
import { VideoCard } from "./VideoCard";

/** Top 10 + 끝 더보기 — 가로 스크롤 */
const TRENDING_STRIP =
  "no-scrollbar -mx-4 flex snap-x snap-mandatory items-stretch gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:gap-2.5 sm:px-0 md:gap-3 lg:gap-4";

const CARD_SLOT =
  "relative w-[148px] min-w-[148px] max-w-[220px] shrink-0 snap-center sm:w-[168px] sm:min-w-[168px] md:w-[180px] md:min-w-[180px]";

const ARROW_BTN =
  "pointer-events-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/60 text-zinc-200 shadow-lg shadow-black/40 backdrop-blur-md transition hover:border-reels-cyan/35 hover:text-white active:scale-[0.97] motion-reduce:transition-none";

const LAYOUT_EASE = [0.22, 1, 0.36, 1] as const;

export function TrendingRankSection() {
  const reduceMotion = useReducedMotion() ?? false;
  const liveRows = useTrendingLiveRanking(TRENDING_RANK_CLIPS, {
    reducedMotion: reduceMotion,
  });

  const scrollRef = useRef<HTMLDivElement>(null);
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
  }, [updateScrollState]);

  const scrollByDir = (dir: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    const step = Math.max(el.clientWidth * 0.65, 200);
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  return (
    <section className="border-t border-white/10 bg-transparent" aria-labelledby="trending-rank-heading">
      <div className="mx-auto max-w-[1800px] px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-14 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="min-w-0 text-left">
            <h2
              id="trending-rank-heading"
              className="flex flex-wrap items-center gap-2.5 text-[22px] font-extrabold leading-snug tracking-tight text-zinc-100 sm:gap-3 sm:text-[26px] md:text-[28px]"
            >
              <TrendingPlayIcon className="h-7 w-7 shrink-0 text-reels-crimson sm:h-8 sm:w-8" />
              실시간 인기순위 영상
              <span className="inline-flex items-center gap-1.5 rounded-full border border-reels-cyan/35 bg-reels-cyan/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-reels-cyan/95 sm:text-[11px]">
                <span
                  className="relative flex h-2 w-2 shrink-0"
                  aria-hidden
                >
                  <span className="absolute inset-0 animate-ping rounded-full bg-reels-cyan/70 motion-reduce:animate-none" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-reels-cyan shadow-[0_0_10px_rgba(0,242,234,0.8)]" />
                </span>
                LIVE
              </span>
            </h2>
            <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-zinc-500 sm:text-[16px]">
              Top 10 클립 — 구매 누적수익이 틱마다 변동하고 순위가 자동 재정렬됩니다. (데모: 클라이언트 시뮬레이션)
            </p>
          </div>
          <SectionMoreLink
            category="best"
            className="shrink-0 self-stretch sm:self-center"
          />
        </div>

        <div className="relative mt-4 sm:mt-5">
          {canLeft ? (
            <div
              className="pointer-events-none absolute inset-y-2 left-0 z-10 w-11 bg-gradient-to-r from-[#050505] via-[#050505]/88 to-transparent"
              aria-hidden
            />
          ) : null}
          {canRight ? (
            <div
              className="pointer-events-none absolute inset-y-2 right-0 z-10 w-11 bg-gradient-to-l from-[#050505] via-[#050505]/88 to-transparent"
              aria-hidden
            />
          ) : null}

          <LayoutGroup id="trending-live-board">
            <div
              ref={scrollRef}
              className={TRENDING_STRIP}
              role="list"
              aria-label="인기순위 영상 목록, 누적수익 기준 실시간 정렬"
            >
              {liveRows.map((entry, rankIndex) => (
                <motion.div
                  key={entry.instanceId}
                  layout={!reduceMotion}
                  transition={{
                    layout: {
                      duration: reduceMotion ? 0 : 0.48,
                      ease: LAYOUT_EASE,
                    },
                  }}
                  className={CARD_SLOT}
                  role="listitem"
                >
                  <span
                    className="absolute left-1.5 top-1.5 z-[25] flex h-6 min-w-[1.5rem] items-center justify-center rounded-full border border-white/20 bg-white/10 px-1.5 text-[11px] font-extrabold tabular-nums text-zinc-100 shadow-lg shadow-reels-crimson/10 backdrop-blur-md sm:left-2 sm:top-2 sm:h-7 sm:min-w-[1.75rem] sm:px-2 sm:text-[12px] md:left-2.5 md:top-2.5 md:h-8 md:min-w-[2rem] md:text-[13px]"
                    aria-label={`${rankIndex + 1}위`}
                  >
                    {rankIndex + 1}
                  </span>
                  <VideoCard
                    video={entry.video}
                    reelLayout
                    reelStrip
                    className="h-full min-w-0"
                    footerExtension={
                      <TrendingVideoStatsFooter
                        metrics={entry.metrics}
                        salePriceWon={entry.video.priceWon}
                      />
                    }
                  />
                </motion.div>
              ))}

              <div
                className={`relative flex min-w-[76px] max-w-[76px] shrink-0 snap-center flex-col items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] px-2 py-3 backdrop-blur-sm sm:min-w-[84px] sm:max-w-[84px] ${
                  atEnd ? "reels-trending-more-sparkle" : ""
                }`}
                role="listitem"
              >
                <Link
                  href="/category/best"
                  className="reels-trending-more-label text-center text-[11px] font-extrabold leading-tight tracking-tight text-zinc-100 transition-colors hover:text-reels-cyan motion-reduce:transition-none"
                  aria-label="인기순위 더 많은 영상 보기"
                >
                  더보기
                </Link>
                <span className="mt-1 text-center text-[9px] font-medium leading-tight text-zinc-500">
                  전체
                  <br />
                  랭킹
                </span>
              </div>
            </div>
          </LayoutGroup>

          {canLeft ? (
            <button
              type="button"
              className={`${ARROW_BTN} absolute left-0 top-1/2 z-20 -translate-y-1/2`}
              aria-label="이전 인기 영상"
              onClick={() => scrollByDir(-1)}
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={2} aria-hidden />
            </button>
          ) : null}
          {canRight ? (
            <button
              type="button"
              className={`${ARROW_BTN} absolute right-0 top-1/2 z-20 -translate-y-1/2`}
              aria-label="다음 인기 영상"
              onClick={() => scrollByDir(1)}
            >
              <ChevronRight className="h-5 w-5" strokeWidth={2} aria-hidden />
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}

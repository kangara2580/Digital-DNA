"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FAILURE_OOPS_CLIPS } from "@/data/videos";
import { SectionMoreLink } from "./SectionMoreLink";
import { VideoCard } from "./VideoCard";

const FAILURE_STRIP =
  "no-scrollbar -mx-4 flex w-full snap-x snap-mandatory items-stretch gap-2 overflow-x-auto px-4 pb-1 pt-2 sm:mx-0 sm:gap-3 sm:px-0 md:gap-3 lg:gap-4";
const CARD_SLOT =
  "relative shrink-0 snap-center " +
  "w-[min(48vw,260px)] min-w-[min(48vw,168px)] max-w-[260px] " +
  "sm:w-[min(42vw,280px)] sm:max-w-[280px] " +
  "lg:w-[calc((100%-3rem)/4)] lg:min-w-[calc((100%-3rem)/4)] lg:max-w-[calc((100%-3rem)/4)]";
const MORE_CELL =
  "relative shrink-0 snap-center " +
  "w-[min(48vw,260px)] min-w-[min(48vw,168px)] max-w-[260px] " +
  "sm:w-[min(42vw,280px)] sm:max-w-[280px] " +
  "lg:w-[calc((100%-3rem)/4)] lg:min-w-[calc((100%-3rem)/4)] lg:max-w-[calc((100%-3rem)/4)]";
const ARROW_BTN =
  "pointer-events-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/60 text-zinc-200 shadow-lg shadow-black/40 backdrop-blur-md transition hover:border-reels-cyan/35 hover:text-white active:scale-[0.97] motion-reduce:transition-none";

const FAILURE_HASHTAGS = [
  "#실패",
  "#실수",
  "#NG컷",
  "#망한영상",
  "#인생은실전",
  "#0점짜리하루",
  "#B급감성",
] as const;

export function FailureOopsSection() {
  const stripItems = useMemo(
    () => Array.from({ length: 10 }, (_, i) => FAILURE_OOPS_CLIPS[i % FAILURE_OOPS_CLIPS.length]),
    [],
  );
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
    const max = el.scrollWidth - el.clientWidth;
    if (max <= 0) return;
    const step = Math.min(Math.max(el.clientWidth * 0.32, 220), max / 3.15);
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  return (
    <section
      className="border-t border-white/10 bg-transparent"
      aria-labelledby="failure-oops-heading"
    >
      <div className="mx-auto max-w-[1800px] px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-14 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="min-w-0 text-left">
            <h2
              id="failure-oops-heading"
              className="whitespace-nowrap text-[20px] font-extrabold leading-snug tracking-tight text-zinc-100 sm:text-[24px] md:text-[28px]"
            >
              누군가의 실패와 실수 영상
            </h2>
            <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-zinc-500 sm:text-[16px]">
              오히려 좋아, 0.1%의 완벽함보다 99.9%의 리얼함
            </p>
          </div>
          <SectionMoreLink
            category="comedy"
            className="shrink-0 self-stretch sm:self-center"
          />
        </div>
        <div className="mt-3 text-left sm:mt-3">
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {FAILURE_HASHTAGS.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full border border-dashed border-reels-cyan/35 bg-white/[0.04] px-3 py-1 text-[13px] font-bold tracking-tight text-zinc-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:px-3.5 sm:py-1.5 sm:text-[14px]"
              >
                {tag}
              </span>
            ))}
          </div>
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
          <div
            ref={scrollRef}
            className={FAILURE_STRIP}
            role="list"
            aria-label="실패와 실수 영상 목록"
          >
            {stripItems.map((video, idx) => (
              <div key={`${video.id}-${idx}`} className={CARD_SLOT} role="listitem">
                <span className="absolute left-1.5 top-1.5 z-[25] flex h-6 min-w-[1.5rem] items-center justify-center rounded-full border border-white/20 bg-white/10 px-1.5 text-[11px] font-extrabold tabular-nums text-zinc-100 shadow-lg shadow-reels-cyan/10 backdrop-blur-md sm:left-2 sm:top-2 sm:h-7 sm:min-w-[1.75rem] sm:px-2 sm:text-[12px] md:left-2.5 md:top-2.5 md:h-8 md:min-w-[2rem] md:text-[13px]">
                  {idx + 1}
                </span>
                <VideoCard
                  video={video}
                  reelLayout
                  subtleHover
                  className="h-full min-w-0"
                />
              </div>
            ))}
            <div className={MORE_CELL} role="listitem">
              <Link
                href="/category/comedy"
                className={`reels-trending-more-label flex h-full min-h-[280px] w-full flex-col items-center justify-center gap-1 rounded-xl border border-white/15 bg-white/[0.04] px-3 py-4 text-center backdrop-blur-sm transition-colors hover:border-reels-cyan/35 hover:bg-white/[0.07] ${
                  atEnd ? "reels-trending-more-sparkle" : ""
                }`}
                aria-label="실패와 실수 더 많은 영상 보기"
              >
                <span className="text-[12px] font-extrabold leading-tight tracking-tight text-zinc-100 sm:text-[13px]">
                  더보기
                </span>
                <span className="text-[10px] font-medium leading-snug text-zinc-500 sm:text-[11px]">
                  전체 랭킹
                </span>
              </Link>
            </div>
          </div>
          {canLeft ? (
            <button
              type="button"
              className={`${ARROW_BTN} absolute left-0 top-1/2 z-20 -translate-y-1/2`}
              aria-label="이전 실패/실수 영상"
              onClick={() => scrollByDir(-1)}
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={2} aria-hidden />
            </button>
          ) : null}
          {canRight ? (
            <button
              type="button"
              className={`${ARROW_BTN} absolute right-0 top-1/2 z-20 -translate-y-1/2`}
              aria-label="다음 실패/실수 영상"
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

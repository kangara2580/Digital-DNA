"use client";

import { ArrowLeft, ChevronDown, ChevronUp, LayoutGrid } from "lucide-react";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { ExploreReelSlide } from "@/components/ExploreReelSlide";
import { VideoCard } from "@/components/VideoCard";
import type { FeedVideo } from "@/data/videos";

const BATCH = 6;
/** 세로 릴: 풀을 순환해 이 개수까지 슬라이드 추가 (과도한 DOM 방지로 상한 유지) */
const MAX_SLIDES = 200;
/** 그리드 초기·추가 로드 — 스크롤 하단에서 자동으로 더 불러옴 */
const GRID_INITIAL = 24;
const GRID_BATCH = 20;
/** 순환 로드로 스크롤 끝없이 이어지게 하되, DOM·메모리 상한 */
const MAX_GRID_ITEMS = 800;

/** 그리드 모드만 — 훅을 watch와 분리해 규칙 위반·리컨실 오류 방지 */
function ExploreBrowseGrid({
  pool,
  visibleGridCount,
  setVisibleGridCount,
  onEnterWatch,
}: {
  pool: FeedVideo[];
  visibleGridCount: number;
  setVisibleGridCount: Dispatch<SetStateAction<number>>;
  onEnterWatch: (video: FeedVideo, gridIndex: number) => void;
}) {
  const browseVideos = useMemo(() => {
    if (pool.length === 0) return [];
    const n = Math.min(visibleGridCount, MAX_GRID_ITEMS);
    return Array.from({ length: n }, (_, i) => {
      const video = pool[i % pool.length]!;
      return { video, rowKey: `${video.id}-${i}` };
    });
  }, [pool, visibleGridCount]);
  const gridSentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = gridSentinelRef.current;
    if (!el || pool.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        setVisibleGridCount((n) => {
          if (n >= MAX_GRID_ITEMS) return n;
          return Math.min(n + GRID_BATCH, MAX_GRID_ITEMS);
        });
      },
      { root: null, rootMargin: "320px 0px", threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [pool.length, setVisibleGridCount]);

  return (
    <div className="mx-auto max-w-[1800px] px-4 pb-20 pt-4 sm:px-6 md:pl-[calc(var(--reels-rail-w,0px)+1rem)] lg:px-8">
      <div
        className="grid grid-cols-2 gap-3 sm:gap-3 md:grid-cols-3 xl:grid-cols-4 xl:gap-4"
        role="list"
        aria-label="탐색 그리드"
      >
        {browseVideos.map(({ video, rowKey }, gridIndex) => (
          <div key={rowKey} className="min-w-0" role="listitem">
            <VideoCard
              video={video}
              reelLayout
              reelStrip
              disableHoverScale
              onPick={() => onEnterWatch(video, gridIndex)}
              className="h-full min-w-0"
            />
          </div>
        ))}
      </div>
      {pool.length > 0 && visibleGridCount < MAX_GRID_ITEMS ? (
        <div
          ref={gridSentinelRef}
          className="h-32 w-full shrink-0"
          aria-hidden
        />
      ) : null}
    </div>
  );
}

/** 세로 릴 시청만 */
function ExploreWatchReels({
  pool,
  watchOffset,
  onBackToBrowse,
}: {
  pool: FeedVideo[];
  watchOffset: number;
  onBackToBrowse: () => void;
}) {
  const [count, setCount] = useState(BATCH);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const slides = useMemo(() => {
    const n = Math.min(count, MAX_SLIDES);
    const out: FeedVideo[] = [];
    for (let i = 0; i < n; i++) {
      out.push(pool[(watchOffset + i) % pool.length]);
    }
    return out;
  }, [pool, count, watchOffset]);

  const loadMore = useCallback(() => {
    setCount((c) => Math.min(c + BATCH, MAX_SLIDES));
  }, []);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
    });
    return () => window.cancelAnimationFrame(id);
  }, [watchOffset]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const root = scrollRef.current;
    if (!sentinel || !root) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { root, rootMargin: "0px 0px 65% 0px", threshold: 0 },
    );
    io.observe(sentinel);
    return () => io.disconnect();
  }, [loadMore, count]);

  /** 틱톡 웹처럼 한 칸씩 스냅 이동 — 뷰포트 높이와 슬라이드 한 장 높이 일치 */
  const scrollByOneSlide = useCallback((dir: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    const h = el.clientHeight;
    if (h <= 0) return;
    el.scrollBy({ top: dir * h, behavior: "smooth" });
  }, []);

  const goNextReel = useCallback(() => scrollByOneSlide(1), [scrollByOneSlide]);
  const goPrevReel = useCallback(() => scrollByOneSlide(-1), [scrollByOneSlide]);

  return (
    <>
      <div className="pointer-events-none fixed left-3 top-[calc(var(--header-height,4.5rem)+0.5rem)] z-[45] flex flex-col gap-2 sm:left-4 md:left-[calc(var(--reels-rail-w)+0.75rem)]">
        <Link
          href="/"
          className="pointer-events-auto inline-flex h-10 items-center gap-1.5 rounded-full border border-white/20 bg-black/45 px-3.5 text-[13px] font-semibold text-zinc-100 shadow-lg backdrop-blur-md transition hover:border-reels-cyan/40 hover:bg-black/60 hover:text-white [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white/90 [html[data-theme='light']_&]:text-zinc-900"
          aria-label="홈으로"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2.25} aria-hidden />
          홈
        </Link>
        <button
          type="button"
          onClick={onBackToBrowse}
          className="pointer-events-auto inline-flex h-10 items-center gap-1.5 rounded-full border border-white/20 bg-black/45 px-3.5 text-[13px] font-semibold text-zinc-100 shadow-lg backdrop-blur-md transition hover:border-reels-cyan/40 hover:bg-black/60 hover:text-white [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white/90 [html[data-theme='light']_&]:text-zinc-900"
          aria-label="그리드 목록으로"
        >
          <LayoutGrid className="h-4 w-4" strokeWidth={2.25} aria-hidden />
          목록
        </button>
      </div>

      {/* 틱톡 스타일: 위·아래로 한 영상씩 이동 */}
      <div className="pointer-events-none fixed bottom-[max(8rem,calc(env(safe-area-inset-bottom)+5.5rem))] right-3 z-[101] flex flex-col gap-2 sm:right-5 md:right-6">
        <button
          type="button"
          onClick={goPrevReel}
          className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/50 text-zinc-100 shadow-lg backdrop-blur-md transition hover:border-reels-cyan/45 hover:bg-black/65 hover:text-white [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white/92 [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:hover:border-reels-cyan/50"
          aria-label="이전 영상"
          title="이전 영상"
        >
          <ChevronUp className="h-6 w-6" strokeWidth={2.25} aria-hidden />
        </button>
        <button
          type="button"
          onClick={goNextReel}
          className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/50 text-zinc-100 shadow-lg backdrop-blur-md transition hover:border-reels-cyan/45 hover:bg-black/65 hover:text-white [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white/92 [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:hover:border-reels-cyan/50"
          aria-label="다음 영상"
          title="다음 영상"
        >
          <ChevronDown className="h-6 w-6" strokeWidth={2.25} aria-hidden />
        </button>
      </div>

      <div
        ref={scrollRef}
        className="fixed inset-x-0 bottom-0 top-[var(--header-height,4.5rem)] z-[30] overflow-y-auto overflow-x-hidden overscroll-y-contain snap-y snap-mandatory md:left-[var(--reels-rail-w)]"
        style={{ WebkitOverflowScrolling: "touch" }}
        role="feed"
        aria-label="세로 탐색 릴스 피드 — 아래로 스크롤해 계속 보기"
      >
        {slides.map((video, i) => (
          <ExploreReelSlide
            key={`${video.id}-${watchOffset}-${i}`}
            video={video}
            scrollRootRef={scrollRef}
          />
        ))}
        <div
          ref={sentinelRef}
          className="h-px w-full shrink-0 snap-none"
          aria-hidden
        />
      </div>
    </>
  );
}

export function ExploreReelsFeed({ pool }: { pool: FeedVideo[] }) {
  const [mode, setMode] = useState<"browse" | "watch">("browse");
  const [watchOffset, setWatchOffset] = useState(0);
  const [visibleGridCount, setVisibleGridCount] = useState(GRID_INITIAL);

  const enterWatch = useCallback((_video: FeedVideo, gridIndex: number) => {
    if (pool.length === 0) return;
    setWatchOffset(gridIndex % pool.length);
    setMode("watch");
  }, [pool]);

  const backToBrowse = useCallback(() => {
    setMode("browse");
  }, []);

  useEffect(() => {
    if (mode === "browse") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [mode]);

  if (mode === "browse") {
    return (
      <ExploreBrowseGrid
        pool={pool}
        visibleGridCount={visibleGridCount}
        setVisibleGridCount={setVisibleGridCount}
        onEnterWatch={enterWatch}
      />
    );
  }

  return (
    <ExploreWatchReels
      pool={pool}
      watchOffset={watchOffset}
      onBackToBrowse={backToBrowse}
    />
  );
}

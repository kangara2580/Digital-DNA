"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
import { buildWishlistVideoLookup } from "@/data/videoCatalog";
import type { FeedVideo } from "@/data/videos";

const BATCH = 6;
/** 세로 릴: 풀을 순환해 이 개수까지 슬라이드 추가 (과도한 DOM 방지로 상한 유지) */
const MAX_SLIDES = 200;
/** 그리드 초기·추가 로드 — 스크롤 하단에서 자동으로 더 불러옴 */
const GRID_INITIAL = 24;
const GRID_BATCH = 20;
/** 순환 로드로 스크롤 끝없이 이어지게 하되, DOM·메모리 상한 */
const MAX_GRID_ITEMS = 800;

/** 탐색 세로 릴: 소리 켠 상태를 영상 전환·재진입 후에도 유지 */
const EXPLORE_AUDIO_UNLOCKED_KEY = "reels-explore-audio-unlocked";

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
        className="grid grid-cols-2 gap-2 border border-white/10 p-2 [html[data-theme='light']_&]:border-zinc-200 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
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
}: {
  pool: FeedVideo[];
  watchOffset: number;
}) {
  const [count, setCount] = useState(BATCH);
  const [reelMuted, setReelMutedState] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem(EXPLORE_AUDIO_UNLOCKED_KEY) === "true") {
        setReelMutedState(false);
      }
    } catch {
      /* noop */
    }
  }, []);

  const setReelMuted = useCallback((muted: boolean) => {
    setReelMutedState(muted);
    try {
      if (muted) localStorage.removeItem(EXPLORE_AUDIO_UNLOCKED_KEY);
      else localStorage.setItem(EXPLORE_AUDIO_UNLOCKED_KEY, "true");
    } catch {
      /* noop */
    }
  }, []);

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

  // 키보드 이동만 커스텀 처리(휠/트랙패드는 네이티브 스크롤로 버벅임 최소화)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        goNextReel();
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        goPrevReel();
      } else if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        if (e.shiftKey) goPrevReel();
        else goNextReel();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [goNextReel, goPrevReel]);

  return (
    <>
      {/* 틱톡 스타일: 위·아래로 한 영상씩 이동 */}
      <div className="pointer-events-none fixed right-3 top-1/2 z-[101] flex -translate-y-1/2 flex-col gap-2 sm:right-5 md:right-6">
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
        className="fixed inset-x-0 bottom-0 top-[var(--header-height,4.5rem)] z-[30] overflow-y-auto overflow-x-hidden overscroll-y-contain scroll-smooth snap-y snap-mandatory md:left-[var(--reels-rail-w)]"
        style={{ WebkitOverflowScrolling: "touch" }}
        role="feed"
        aria-label="세로 탐색 릴스 피드 — 아래로 스크롤해 계속 보기"
      >
        {slides.map((video, i) => (
          <ExploreReelSlide
            key={`${video.id}-${watchOffset}-${i}`}
            video={video}
            scrollRootRef={scrollRef}
            muted={reelMuted}
            onMutedChange={setReelMuted}
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

export function ExploreReelsFeed({
  pool,
  initialMode = "browse",
  browseCardTarget = "watch",
}: {
  pool: FeedVideo[];
  initialMode?: "browse" | "watch";
  browseCardTarget?: "watch" | "purchase";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const videoById = useMemo(() => buildWishlistVideoLookup(), []);
  const [sessionTargetVideo, setSessionTargetVideo] = useState<FeedVideo | null>(null);
  const [mode, setMode] = useState<"browse" | "watch">(initialMode);
  const [watchOffset, setWatchOffset] = useState(0);
  const [visibleGridCount, setVisibleGridCount] = useState(GRID_INITIAL);
  const requestedVideoId = searchParams.get("videoId");

  useEffect(() => {
    if (!requestedVideoId) {
      setSessionTargetVideo(null);
      return;
    }
    try {
      const raw = window.sessionStorage.getItem(`reels:explore:target:${requestedVideoId}`);
      if (!raw) {
        setSessionTargetVideo(null);
        return;
      }
      const parsed = JSON.parse(raw) as FeedVideo;
      if (!parsed || parsed.id !== requestedVideoId) {
        setSessionTargetVideo(null);
        return;
      }
      setSessionTargetVideo(parsed);
    } catch {
      setSessionTargetVideo(null);
    }
  }, [requestedVideoId]);

  const watchPool = useMemo(() => {
    if (!requestedVideoId) return pool;
    if (pool.some((v) => v.id === requestedVideoId)) return pool;
    const target = videoById.get(requestedVideoId);
    if (target) return [target, ...pool];
    if (sessionTargetVideo && sessionTargetVideo.id === requestedVideoId) {
      return [sessionTargetVideo, ...pool];
    }
    return pool;
  }, [pool, requestedVideoId, videoById, sessionTargetVideo]);

  useEffect(() => {
    const view = searchParams.get("view");
    const videoId = searchParams.get("videoId");
    const idx = videoId ? watchPool.findIndex((v) => v.id === videoId) : -1;

    if (initialMode === "watch") {
      setWatchOffset(idx >= 0 ? idx : 0);
      setMode("watch");
      return;
    }

    if (view !== "watch") {
      setMode("browse");
      return;
    }
    setWatchOffset(idx >= 0 ? idx : 0);
    setMode("watch");
  }, [initialMode, watchPool, searchParams]);

  const enterWatch = useCallback((_video: FeedVideo, gridIndex: number) => {
    if (watchPool.length === 0) return;
    const normalized = gridIndex % watchPool.length;
    const target = watchPool[normalized];

    if (browseCardTarget === "purchase") {
      router.push(`/video/${encodeURIComponent(target.id)}`);
      return;
    }

    setWatchOffset(normalized);
    setMode("watch");
    router.replace(
      `${pathname}?view=watch&videoId=${encodeURIComponent(target.id)}`,
      { scroll: false },
    );
  }, [browseCardTarget, pathname, router, watchPool]);

  useEffect(() => {
    if (mode === "browse") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [mode]);

  useEffect(() => {
    if (typeof document === "undefined" || typeof window === "undefined") return;
    document.documentElement.dataset.exploreMode = mode;
    window.dispatchEvent(new Event("reels:explore-mode"));
    return () => {
      delete document.documentElement.dataset.exploreMode;
      window.dispatchEvent(new Event("reels:explore-mode"));
    }
  }, [mode]);

  if (mode === "browse") {
    return (
      <ExploreBrowseGrid
        pool={watchPool}
        visibleGridCount={visibleGridCount}
        setVisibleGridCount={setVisibleGridCount}
        onEnterWatch={enterWatch}
      />
    );
  }

  return (
    <ExploreWatchReels
      pool={watchPool}
      watchOffset={watchOffset}
    />
  );
}

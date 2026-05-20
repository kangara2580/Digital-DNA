"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { ExploreReelSlide } from "@/components/ExploreReelSlide";
import { TrendingVideoStatsFooter } from "@/components/TrendingVideoStatsFooter";
import { VideoCard } from "@/components/VideoCard";
import { buildWishlistVideoLookup } from "@/data/videoCatalog";
import { getMetricsForVideoDetail } from "@/data/trendingStats";
import type { FeedVideo } from "@/data/videos";
import { useTranslation } from "@/hooks/useTranslation";

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
  browseCardTarget,
}: {
  pool: FeedVideo[];
  visibleGridCount: number;
  setVisibleGridCount: Dispatch<SetStateAction<number>>;
  onEnterWatch: (video: FeedVideo, gridIndex: number) => void;
  browseCardTarget: "watch" | "purchase";
}) {
  const { t } = useTranslation();
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
    <div className="mx-auto max-w-[1800px] px-4 pb-20 pt-[max(3.75rem,1rem)] sm:px-6 md:pl-[calc(var(--reels-rail-w,0px)+1rem)] lg:px-8">
      <div
        className={
          browseCardTarget === "purchase"
            ? "grid grid-cols-2 gap-3 p-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5"
            : "grid grid-cols-2 gap-3 border border-white/10 p-3 [html[data-theme='light']_&]:border-zinc-200 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5"
        }
        role="list"
        aria-label={t("explore.gridAria")}
      >
        {browseVideos.map(({ video, rowKey }, gridIndex) => (
          <div key={rowKey} className="min-w-0" role="listitem">
            <VideoCard
              video={video}
              reelLayout
              reelStrip
              disableHoverScale
              hideCreatorMeta
              showSellerAvatar={browseCardTarget === "purchase"}
              preloadMode="metadata"
              trendingRankCardPrice
              onPick={() => onEnterWatch(video, gridIndex)}
              className="h-full min-w-0"
              footerExtension={
                <TrendingVideoStatsFooter
                  hideMetricLabels
                  metrics={getMetricsForVideoDetail(video.id)}
                />
              }
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
  const { t } = useTranslation();
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
    el.scrollBy({ top: dir * h, behavior: "auto" });
  }, []);

  const goNextReel = useCallback(() => scrollByOneSlide(1), [scrollByOneSlide]);
  const goPrevReel = useCallback(() => scrollByOneSlide(-1), [scrollByOneSlide]);

  /** 브라우저/탭 전체화면(F11)·Fullscreen API·거의 전체 뷰포트일 때만 방향키를 가격 레일 쪽으로 더 당김 */
  const [chevronFullscreenNudge, setChevronFullscreenNudge] = useState(false);
  useEffect(() => {
    const readFullscreenLayout = () => {
      const doc = document;
      const fsEl =
        doc.fullscreenElement ??
        (doc as Document & { webkitFullscreenElement?: Element | null })
          .webkitFullscreenElement ??
        null;
      if (fsEl) {
        setChevronFullscreenNudge(true);
        return;
      }
      if (typeof window === "undefined" || typeof window.screen === "undefined") {
        setChevronFullscreenNudge(false);
        return;
      }
      const pwa =
        window.matchMedia?.("(display-mode: fullscreen)")?.matches === true;
      if (pwa) {
        setChevronFullscreenNudge(true);
        return;
      }
      const { innerWidth: iw, innerHeight: ih } = window;
      const { availWidth: aw, availHeight: ah } = window.screen;
      const fillsViewport =
        iw >= aw - 4 && ih >= ah - 56;
      setChevronFullscreenNudge(fillsViewport);
    };

    readFullscreenLayout();
    const onResize = () => readFullscreenLayout();
    document.addEventListener("fullscreenchange", readFullscreenLayout);
    document.addEventListener(
      "webkitfullscreenchange",
      readFullscreenLayout as EventListener,
    );
    window.addEventListener("resize", onResize);
    window.visualViewport?.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("fullscreenchange", readFullscreenLayout);
      document.removeEventListener(
        "webkitfullscreenchange",
        readFullscreenLayout as EventListener,
      );
      window.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
    };
  }, []);

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

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
    };
  }, []);

  const chevronRail = (
    /*
     * 슬라이드(ExploreReelSlide)와 동일한 가로 기준: md 레일 inset + max-w 56rem + px-2/md:px-4.
     * 뷰포트 우측 고정(pr vw 계산) 대신 콘텐츠 열 안에서 정렬해 해상도가 커져도 가격 레일과 겹치지 않음.
     */
    <div className="pointer-events-none fixed inset-x-0 bottom-0 top-[var(--header-height,4.5rem)] z-[101] box-border flex justify-center md:pl-[var(--reels-rail-w)]">
      <div className="pointer-events-none flex h-full w-full max-w-[min(56rem,100%)] items-center justify-end px-2 sm:px-4 md:px-4">
        <div
          className={
            chevronFullscreenNudge
              ? "pointer-events-none flex flex-col gap-2 pr-[env(safe-area-inset-right,0px)] transition-transform duration-150 md:-translate-x-8 2xl:-translate-x-14"
              : "pointer-events-none flex flex-col gap-2 pr-[env(safe-area-inset-right,0px)] transition-transform duration-150"
          }
        >
        <button
          type="button"
          onClick={goPrevReel}
          className="group pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/50 text-zinc-100 shadow-lg backdrop-blur-md transition hover:border-white hover:bg-black/65 hover:text-white [html[data-theme='light']_&]:border-black [html[data-theme='light']_&]:bg-transparent [html[data-theme='light']_&]:text-black [html[data-theme='light']_&]:shadow-none [html[data-theme='light']_&]:backdrop-blur-none [html[data-theme='light']_&]:hover:border-black [html[data-theme='light']_&]:hover:bg-transparent"
          aria-label={t("explore.prevVideo")}
          title={t("explore.prevVideo")}
        >
          <ChevronUp
            className="h-6 w-6 text-white transition-colors group-hover:text-white [html[data-theme='light']_&]:text-black [html[data-theme='light']_&]:group-hover:text-black"
            strokeWidth={2.85}
            aria-hidden
          />
        </button>
        <button
          type="button"
          onClick={goNextReel}
          className="group pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/50 text-zinc-100 shadow-lg backdrop-blur-md transition hover:border-white hover:bg-black/65 hover:text-white [html[data-theme='light']_&]:border-black [html[data-theme='light']_&]:bg-transparent [html[data-theme='light']_&]:text-black [html[data-theme='light']_&]:shadow-none [html[data-theme='light']_&]:backdrop-blur-none [html[data-theme='light']_&]:hover:border-black [html[data-theme='light']_&]:hover:bg-transparent"
          aria-label={t("explore.nextVideo")}
          title={t("explore.nextVideo")}
        >
          <ChevronDown
            className="h-6 w-6 text-white transition-colors group-hover:text-white [html[data-theme='light']_&]:text-black [html[data-theme='light']_&]:group-hover:text-black"
            strokeWidth={2.85}
            aria-hidden
          />
        </button>
      </div>
      </div>
    </div>
  );

  return (
    <>
      {chevronRail}

      <div
        ref={scrollRef}
        className="explore-reels-feed no-scrollbar fixed inset-x-0 bottom-0 top-[var(--header-height,4.5rem)] z-[30] overflow-y-auto overflow-x-hidden overscroll-y-contain snap-y snap-mandatory"
        style={{ WebkitOverflowScrolling: "touch" }}
        role="feed"
        aria-label={t("explore.feedAria")}
      >
        {/* 스크롤 트랙은 뷰포트 전폭(스크롤바가 화면 맨 오른쪽), 콘텐츠만 레일 폭만큼 들여 레이아웃은 기존과 동일 */}
        <div className="md:pl-[var(--reels-rail-w)]">
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
      router.push(`/create?videoId=${encodeURIComponent(target.id)}`);
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

  useLayoutEffect(() => {
    if (typeof document === "undefined" || typeof window === "undefined") return;
    document.documentElement.dataset.exploreMode = mode;
    window.dispatchEvent(new Event("reels:explore-mode"));
    return () => {
      delete document.documentElement.dataset.exploreMode;
      window.dispatchEvent(new Event("reels:explore-mode"));
    };
  }, [mode]);

  if (mode === "browse") {
    return (
      <ExploreBrowseGrid
        pool={watchPool}
        visibleGridCount={visibleGridCount}
        setVisibleGridCount={setVisibleGridCount}
        onEnterWatch={enterWatch}
        browseCardTarget={browseCardTarget}
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

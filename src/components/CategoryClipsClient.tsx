"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const INITIAL_VISIBLE = 20;
const BATCH_SIZE = 20;
import { SlidersHorizontal, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { TrendingVideoStatsFooter } from "@/components/TrendingVideoStatsFooter";
import { VideoCard } from "@/components/VideoCard";
import { getMetricsForVideoDetail } from "@/data/trendingStats";
import type { CategorySlug } from "@/data/videoCatalog";
import type { FeedVideo } from "@/data/videos";
import {
  CATEGORY_LABEL,
  getVideoCatalogMeta,
  getVideosForCategory,
} from "@/data/videoCatalog";

type OrientationFilter = "all" | "portrait" | "landscape";
type PriceFilter = "all" | "high" | "low";
type NewestFilter = "all" | "newest" | "oldest";
const CATEGORY_FEED_CACHE_TTL_MS = 120_000;

/** 사이드 필터 버튼 — 다크 / 라이트 */
const filterBtnActive =
  "bg-white/10 text-zinc-100 [html[data-theme='light']_&]:bg-zinc-200 [html[data-theme='light']_&]:text-zinc-900";
const filterBtnInactive =
  "text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-300 [html[data-theme='light']_&]:text-zinc-600 [html[data-theme='light']_&]:hover:bg-zinc-100 [html[data-theme='light']_&]:hover:text-zinc-900";

const filterSectionLabel =
  "mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-600 [html[data-theme='light']_&]:text-zinc-500";

export function CategoryClipsClient({ slug }: { slug: CategorySlug }) {
  const router = useRouter();
  const label = CATEGORY_LABEL[slug];
  const categoryStory = null;
  const staticBase = useMemo(() => getVideosForCategory(slug), [slug]);
  const [fetchedVideos, setFetchedVideos] = useState<FeedVideo[] | null>(null);
  useEffect(() => {
    setFetchedVideos(null);
    const cacheKey = `reels:category:feed:${slug}`;
    try {
      const raw = window.sessionStorage.getItem(cacheKey);
      if (raw) {
        const parsed = JSON.parse(raw) as { savedAt?: number; videos?: FeedVideo[] };
        const savedAt = typeof parsed.savedAt === "number" ? parsed.savedAt : 0;
        if (
          Array.isArray(parsed.videos) &&
          Date.now() - savedAt < CATEGORY_FEED_CACHE_TTL_MS
        ) {
          setFetchedVideos(parsed.videos);
        }
      }
    } catch {
      /* ignore cache parse errors */
    }
    const ctrl = new AbortController();
    let alive = true;
    void (async () => {
      try {
        const res = await fetch(`/api/category/feed?slug=${encodeURIComponent(slug)}`, {
          cache: "no-store",
          signal: ctrl.signal,
        });
        if (!res.ok) return;
        const body = (await res.json()) as { ok?: boolean; videos?: FeedVideo[] };
        if (!alive || body.ok !== true || !Array.isArray(body.videos)) return;
        setFetchedVideos(body.videos);
        try {
          window.sessionStorage.setItem(
            cacheKey,
            JSON.stringify({ savedAt: Date.now(), videos: body.videos }),
          );
        } catch {
          /* ignore */
        }
      } catch {
        /* staticBase 폴백 유지 */
      }
    })();
    return () => {
      alive = false;
      ctrl.abort();
    };
  }, [slug]);

  const base = useMemo(
    () => fetchedVideos ?? staticBase,
    [fetchedVideos, staticBase],
  );
  const [orientationFilter, setOrientationFilter] =
    useState<OrientationFilter>("all");
  const [priceFilter, setPriceFilter] = useState<PriceFilter>("all");
  const [newestFilter, setNewestFilter] = useState<NewestFilter>("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const filterWrapRef = useRef<HTMLDivElement | null>(null);
  const orientationCounts = useMemo(
    () => ({
      portrait: base.filter((v) => v.orientation === "portrait").length,
      landscape: base.filter((v) => v.orientation === "landscape").length,
    }),
    [base],
  );
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (orientationFilter !== "all") count += 1;
    if (priceFilter !== "all") count += 1;
    if (newestFilter !== "all") count += 1;
    return count;
  }, [newestFilter, orientationFilter, priceFilter]);
  const filtered = useMemo(
    () =>
      base.filter(
        (v) => orientationFilter === "all" || v.orientation === orientationFilter,
      ),
    [base, orientationFilter],
  );

  const sorted = useMemo(() => {
    let next = [...filtered];
    const newestMs = (video: FeedVideo) => {
      const uploadedAt = video.listing?.createdAtMs;
      if (typeof uploadedAt === "number" && Number.isFinite(uploadedAt) && uploadedAt > 0) {
        return uploadedAt;
      }
      const listedAt = Date.parse(getVideoCatalogMeta(video.id).listedAt);
      return Number.isFinite(listedAt) ? listedAt : 0;
    };
    if (priceFilter === "high") {
      next.sort((a, b) => (b.priceWon ?? 0) - (a.priceWon ?? 0));
    } else if (priceFilter === "low") {
      next.sort((a, b) => (a.priceWon ?? 0) - (b.priceWon ?? 0));
    }

    if (newestFilter === "newest") {
      next.sort((a, b) => newestMs(b) - newestMs(a));
    } else if (newestFilter === "oldest") {
      next.sort((a, b) => newestMs(a) - newestMs(b));
    }
    return next;
  }, [filtered, newestFilter, priceFilter]);

  const portraitSorted = useMemo(
    () => sorted.filter((v) => v.orientation === "portrait"),
    [sorted],
  );
  const landscapeSorted = useMemo(
    () => sorted.filter((v) => v.orientation === "landscape"),
    [sorted],
  );

  const openExploreWatch = useCallback(
    (video: FeedVideo) => {
      router.push(`/video/${encodeURIComponent(video.id)}?from=${encodeURIComponent(slug)}`);
    },
    [router, slug],
  );

  /* ── 무한 스크롤 ── */
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // 필터/슬러그 바뀌면 카운트 리셋
  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE);
  }, [slug, orientationFilter, priceFilter, newestFilter]);

  // sorted가 바뀌어도 카운트 유지 (단 0이면 초기화)
  useEffect(() => {
    if (sorted.length === 0) setVisibleCount(INITIAL_VISIBLE);
  }, [sorted.length]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || sorted.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((n) => n + BATCH_SIZE);
        }
      },
      { rootMargin: "0px 0px 60% 0px", threshold: 0 },
    );
    io.observe(sentinel);
    return () => io.disconnect();
  }, [sorted.length]);

  // 순환 아이템 목록 — pool을 필요한 만큼 반복해 채움
  const visibleItems = useMemo(() => {
    if (sorted.length === 0) return [];
    const items: Array<{ video: FeedVideo; key: string }> = [];
    for (let i = 0; i < visibleCount; i++) {
      const video = sorted[i % sorted.length];
      items.push({ video, key: `${video.id}-${Math.floor(i / sorted.length)}-${i}` });
    }
    return items;
  }, [sorted, visibleCount]);

  const renderMosaicGrid = (items: Array<{ video: FeedVideo; key: string }>) => (
    <div
      className="grid grid-cols-2 gap-3 border border-white/10 p-3 [html[data-theme='light']_&]:border-zinc-200 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5"
      role="list"
      aria-label={`${label} 영상 목록`}
    >
      {items.map(({ video, key }) => (
        <div key={key} className="relative min-w-0" role="listitem">
          <VideoCard
            video={video}
            reelLayout
            reelStrip
            hideCreatorMeta
            preloadMode="metadata"
            trendingRankCardPrice
            onPick={() => openExploreWatch(video)}
            domId={`clip-${key}`}
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
  );

  useEffect(() => {
    if (!filterOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (filterWrapRef.current?.contains(target)) return;
      setFilterOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFilterOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [filterOpen]);

  return (
    <div className="min-h-screen bg-transparent text-zinc-100 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-900">
      <div className="mx-auto max-w-[1800px]">
        <main className="min-w-0 [html[data-theme='light']_&]:bg-white">
          <header className="border-b border-white/10 [border-bottom-width:0.5px] px-4 py-6 sm:px-6 lg:px-8 [html[data-theme='light']_&]:border-zinc-200">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-zinc-100 sm:text-2xl [html[data-theme='light']_&]:text-zinc-900">
                  {label}
                </h1>
                {categoryStory ? (
                  <p className="mt-3 max-w-3xl text-[13px] leading-relaxed text-zinc-400 [html[data-theme='light']_&]:text-zinc-700 sm:text-[14px]">
                    {categoryStory}
                  </p>
                ) : null}
              </div>
              <div ref={filterWrapRef} className="relative">
                <button
                  type="button"
                  onClick={() => setFilterOpen((open) => !open)}
                  aria-expanded={filterOpen}
                  aria-controls="category-filter-popover"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-2 text-[12px] font-bold text-zinc-200 transition hover:border-white/25 hover:bg-white/[0.1] [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-100 [html[data-theme='light']_&]:text-zinc-800"
                >
                  <SlidersHorizontal className="h-[18px] w-[18px] shrink-0" aria-hidden />
                  필터
                  {activeFilterCount > 0 ? (
                    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-reels-crimson/85 px-1.5 py-0.5 text-[10px] font-extrabold text-white">
                      {activeFilterCount}
                    </span>
                  ) : null}
                </button>

                {filterOpen ? (
                  <section
                    id="category-filter-popover"
                    className="absolute right-0 top-[calc(100%+0.6rem)] z-30 w-[min(16rem,calc(100vw-1rem))] rounded-2xl border border-white/10 bg-[#030816]/95 px-3 py-4 shadow-[0_18px_48px_-20px_rgba(0,0,0,0.55)] backdrop-blur-sm [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white"
                    aria-label="카테고리 필터"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-[13px] font-extrabold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
                        상세 필터
                      </p>
                      <button
                        type="button"
                        onClick={() => setFilterOpen(false)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/15 text-zinc-400 transition hover:border-white/25 hover:text-zinc-200 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:text-zinc-700"
                        aria-label="필터 닫기"
                      >
                        <X className="h-4 w-4" aria-hidden />
                      </button>
                    </div>

                    <p className={filterSectionLabel}>방향</p>
                    <div className="space-y-1">
                      <button
                        type="button"
                        onClick={() => setOrientationFilter("all")}
                        className={`w-full rounded-md px-2.5 py-2 text-left font-mono text-[11px] transition-colors ${
                          orientationFilter === "all" ? filterBtnActive : filterBtnInactive
                        }`}
                      >
                        전체
                      </button>
                      <button
                        type="button"
                        onClick={() => setOrientationFilter("portrait")}
                        className={`w-full rounded-md px-2.5 py-2 text-left font-mono text-[11px] transition-colors ${
                          orientationFilter === "portrait" ? filterBtnActive : filterBtnInactive
                        }`}
                      >
                        세로
                      </button>
                      <button
                        type="button"
                        onClick={() => setOrientationFilter("landscape")}
                        disabled={orientationCounts.landscape === 0}
                        className={`w-full rounded-md px-2.5 py-2 text-left font-mono text-[11px] transition-colors ${
                          orientationCounts.landscape === 0
                            ? "cursor-not-allowed text-zinc-600 opacity-45 [html[data-theme='light']_&]:text-zinc-400"
                            : orientationFilter === "landscape"
                              ? filterBtnActive
                              : filterBtnInactive
                        }`}
                      >
                        가로
                      </button>
                    </div>

                    <p className={`mt-5 ${filterSectionLabel}`}>가격</p>
                    <div className="space-y-1">
                      <button
                        type="button"
                        onClick={() => setPriceFilter("all")}
                        className={`w-full rounded-md px-2.5 py-2 text-left font-mono text-[11px] transition-colors ${
                          priceFilter === "all" ? filterBtnActive : filterBtnInactive
                        }`}
                      >
                        전체
                      </button>
                      <button
                        type="button"
                        onClick={() => setPriceFilter("high")}
                        className={`w-full rounded-md px-2.5 py-2 text-left font-mono text-[11px] transition-colors ${
                          priceFilter === "high" ? filterBtnActive : filterBtnInactive
                        }`}
                      >
                        높은순
                      </button>
                      <button
                        type="button"
                        onClick={() => setPriceFilter("low")}
                        className={`w-full rounded-md px-2.5 py-2 text-left font-mono text-[11px] transition-colors ${
                          priceFilter === "low" ? filterBtnActive : filterBtnInactive
                        }`}
                      >
                        낮은순
                      </button>
                    </div>

                    <p className={`mt-5 ${filterSectionLabel}`}>최신</p>
                    <div className="space-y-1">
                      <button
                        type="button"
                        onClick={() => setNewestFilter("all")}
                        className={`w-full rounded-md px-2.5 py-2 text-left font-mono text-[11px] transition-colors ${
                          newestFilter === "all" ? filterBtnActive : filterBtnInactive
                        }`}
                      >
                        전체
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewestFilter("newest")}
                        className={`w-full rounded-md px-2.5 py-2 text-left font-mono text-[11px] transition-colors ${
                          newestFilter === "newest" ? filterBtnActive : filterBtnInactive
                        }`}
                      >
                        최신순
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewestFilter("oldest")}
                        className={`w-full rounded-md px-2.5 py-2 text-left font-mono text-[11px] transition-colors ${
                          newestFilter === "oldest" ? filterBtnActive : filterBtnInactive
                        }`}
                      >
                        오래된순
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setOrientationFilter("all");
                        setPriceFilter("all");
                        setNewestFilter("all");
                      }}
                      className="mt-5 w-full rounded-full border border-white/40 bg-transparent py-2 text-[12px] font-bold text-white transition hover:border-white/70 hover:bg-white/[0.06] [html[data-theme='light']_&]:border-zinc-800 [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:hover:border-zinc-950 [html[data-theme='light']_&]:hover:bg-zinc-100"
                    >
                      필터 초기화
                    </button>
                  </section>
                ) : null}
              </div>
            </div>
          </header>

          {sorted.length === 0 ? (
            <p className="px-4 py-16 text-center font-mono text-[12px] text-zinc-500 sm:px-6 [html[data-theme='light']_&]:text-zinc-600">
              이 조건에 맞는 릴스가 없어요.
            </p>
          ) : (
            <>
              {renderMosaicGrid(visibleItems)}
              {/* 무한 스크롤 sentinel */}
              <div
                ref={sentinelRef}
                className="flex items-center justify-center py-8"
                aria-hidden
              >
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/20 [html[data-theme='light']_&]:bg-zinc-300" />
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

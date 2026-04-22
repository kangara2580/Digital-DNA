"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
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

/** 사이드 필터 버튼 — 다크 / 라이트 */
const filterBtnActive =
  "bg-white/10 text-zinc-100 [html[data-theme='light']_&]:bg-zinc-200 [html[data-theme='light']_&]:text-zinc-900";
const filterBtnInactive =
  "text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-300 [html[data-theme='light']_&]:text-zinc-600 [html[data-theme='light']_&]:hover:bg-zinc-100 [html[data-theme='light']_&]:hover:text-zinc-900";

const filterSectionLabel =
  "mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-600 [html[data-theme='light']_&]:text-zinc-500";

type EndlessFeedItem = {
  instanceId: string;
  video: FeedVideo;
};

function BestEndlessRankFeed({ videos }: { videos: FeedVideo[] }) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [items, setItems] = useState<EndlessFeedItem[]>([]);

  const appendBatch = useCallback(() => {
    if (videos.length === 0) return;
    setItems((prev) => {
      const start = prev.length;
      const next: EndlessFeedItem[] = [];
      for (let i = 0; i < 8; i++) {
        const idx = (start + i) % videos.length;
        const loop = Math.floor((start + i) / videos.length);
        const v = videos[idx];
        next.push({
          instanceId: `${v.id}-loop-${loop}-slot-${i}`,
          video: v,
        });
      }
      return [...prev, ...next];
    });
  }, [videos]);

  useEffect(() => {
    setItems([]);
  }, [videos]);

  useEffect(() => {
    if (videos.length === 0) return;
    if (items.length === 0) appendBatch();
  }, [appendBatch, items.length, videos.length]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || videos.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) appendBatch();
      },
      { rootMargin: "1400px 0px 1200px 0px" },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [appendBatch, videos.length]);

  return (
    <section className="px-4 py-5 sm:px-6 lg:px-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item, idx) => (
          <article
            key={item.instanceId}
            className="reels-glass-card overflow-hidden rounded-xl"
          >
            <VideoCard
              video={item.video}
              reelLayout
              reelStrip
              hideCloneStrip
              className="h-full min-w-0"
              footerExtension={
                <TrendingVideoStatsFooter
                  metrics={getMetricsForVideoDetail(item.video.id)}
                  salePriceWon={item.video.priceWon}
                />
              }
            />
            <div className="border-t border-white/10 bg-black/25 px-3 py-2 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50">
              <p className="text-[11px] font-medium text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
                인기 피드 #{idx + 1}
              </p>
            </div>
          </article>
        ))}
      </div>
      <div ref={sentinelRef} className="h-10 w-full" aria-hidden />
      <p className="mt-2 text-center text-[12px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
        인기 영상을 계속 불러오는 중...
      </p>
    </section>
  );
}

export function CategoryClipsClient({ slug }: { slug: CategorySlug }) {
  const label = CATEGORY_LABEL[slug];
  const categoryStory = useMemo(() => {
    if (slug === "oops") {
      return "완벽하지 않아 더 끌리는, 인간적인 실수의 순간들만 모았습니다.";
    }
    if (slug === "best") {
      return "지금 가장 반응이 큰 릴스들을 한눈에 보고, 바로 구매/활용할 수 있어요.";
    }
    return null;
  }, [slug]);
  const base = useMemo(() => getVideosForCategory(slug), [slug]);
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
    if (priceFilter === "high") {
      next.sort((a, b) => (b.priceWon ?? 0) - (a.priceWon ?? 0));
    } else if (priceFilter === "low") {
      next.sort((a, b) => (a.priceWon ?? 0) - (b.priceWon ?? 0));
    }

    if (newestFilter === "newest") {
      next.sort((a, b) =>
        getVideoCatalogMeta(b.id).listedAt.localeCompare(
          getVideoCatalogMeta(a.id).listedAt,
        ),
      );
    } else if (newestFilter === "oldest") {
      next.sort((a, b) =>
        getVideoCatalogMeta(a.id).listedAt.localeCompare(
          getVideoCatalogMeta(b.id).listedAt,
        ),
      );
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

  const renderMosaicGrid = (videos: FeedVideo[]) => (
    <div className="grid grid-cols-2 gap-2 border border-white/10 p-2 [html[data-theme='light']_&]:border-zinc-200 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {videos.map((video) => (
        <div
          key={video.id}
          className="overflow-hidden rounded-lg border border-white/10 bg-black/20 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50"
        >
          <div className={video.orientation === "landscape" ? "aspect-video" : "aspect-[9/16]"}>
            <VideoCard
              video={video}
              flush
              instantPreview={false}
              domId={`clip-${video.id}`}
              className="h-full w-full"
            />
          </div>
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
                <p className="mt-2 font-mono text-[11px] leading-none text-zinc-500 sm:text-[12px] [html[data-theme='light']_&]:text-zinc-600">
                  {orientationFilter === "all" ? (
                    <>
                      세로 {portraitSorted.length}개 · 가로 {landscapeSorted.length}개
                      <span className="text-zinc-600 [html[data-theme='light']_&]:text-zinc-500">
                        {" "}
                        (총 {sorted.length}개)
                      </span>
                    </>
                  ) : (
                    <>등록된 릴스 {sorted.length}개</>
                  )}
                </p>
                {categoryStory ? (
                  <p
                    className={`mt-3 max-w-3xl text-[13px] leading-relaxed text-zinc-400 [html[data-theme='light']_&]:text-zinc-700 sm:text-[14px] ${
                      slug === "oops" ? "font-extrabold text-zinc-200 [html[data-theme='light']_&]:text-zinc-900" : ""
                    }`}
                  >
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
                    className="absolute right-0 top-[calc(100%+0.6rem)] z-30 w-[min(21rem,calc(100vw-2rem))] rounded-2xl border border-white/10 bg-[#030816]/95 p-4 shadow-[0_18px_48px_-20px_rgba(0,0,0,0.55)] backdrop-blur-sm [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white"
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
                    {orientationCounts.landscape === 0 ? (
                      <p className="mt-2 text-[11px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
                        현재 이 카테고리에는 가로 영상이 없습니다.
                      </p>
                    ) : null}

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
                      className="mt-5 w-full rounded-full border border-reels-cyan/35 bg-reels-cyan/12 py-2 text-[12px] font-bold text-reels-cyan transition hover:bg-reels-cyan/20"
                    >
                      필터 초기화
                    </button>
                  </section>
                ) : null}
              </div>
            </div>
          </header>

          {slug === "best" && sorted.length > 0 ? <BestEndlessRankFeed videos={sorted} /> : null}

          {sorted.length === 0 ? (
            <p className="px-4 py-16 text-center font-mono text-[12px] text-zinc-500 sm:px-6 [html[data-theme='light']_&]:text-zinc-600">
              이 조건에 맞는 릴스가 없어요.
            </p>
          ) : slug !== "best" && orientationFilter === "all" ? (
            <div className="space-y-0">
              {portraitSorted.length > 0 ? (
                <section aria-labelledby="category-portrait-heading">
                  <div className="border-b border-white/10 bg-black/[0.12] px-4 py-4 sm:px-6 lg:px-8 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50">
                    <h2
                      id="category-portrait-heading"
                      className="text-[15px] font-extrabold tracking-tight text-zinc-100 [html[data-theme='light']_&]:text-zinc-900"
                    >
                      세로 영상
                    </h2>
                    <p className="mt-1 text-[12px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
                      릴스·숏폼 비율 · {portraitSorted.length}개
                    </p>
                  </div>
                  {renderMosaicGrid(portraitSorted)}
                </section>
              ) : null}

              {landscapeSorted.length > 0 ? (
                <section
                  className={
                    portraitSorted.length > 0
                      ? "border-t border-white/10 [html[data-theme='light']_&]:border-zinc-200"
                      : ""
                  }
                  aria-labelledby="category-landscape-heading"
                >
                  <div className="border-b border-white/10 bg-black/[0.12] px-4 py-4 sm:px-6 lg:px-8 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50">
                    <h2
                      id="category-landscape-heading"
                      className="text-[15px] font-extrabold tracking-tight text-zinc-100 [html[data-theme='light']_&]:text-zinc-900"
                    >
                      가로 영상
                    </h2>
                    <p className="mt-1 text-[12px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
                      와이드 비율 · {landscapeSorted.length}개
                    </p>
                  </div>
                  {renderMosaicGrid(landscapeSorted)}
                </section>
              ) : null}
            </div>
          ) : slug !== "best" ? (
            <div>
              <div className="border-b border-white/10 bg-black/[0.08] px-4 py-3 sm:px-6 lg:px-8 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50/80">
                <p className="text-[13px] font-semibold text-zinc-300 [html[data-theme='light']_&]:text-zinc-800">
                  {orientationFilter === "portrait"
                    ? "세로 영상만 보기"
                    : "가로 영상만 보기"}
                </p>
              </div>
              {renderMosaicGrid(sorted)}
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}

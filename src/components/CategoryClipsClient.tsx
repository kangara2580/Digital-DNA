"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TrendingVideoStatsFooter } from "@/components/TrendingVideoStatsFooter";
import { VideoCard } from "@/components/VideoCard";
import { getMetricsForVideoDetail } from "@/data/trendingStats";
import type { CategorySlug } from "@/data/videoCatalog";
import type { FeedVideo } from "@/data/videos";
import {
  CATEGORY_LABEL,
  getVideoCatalogMeta,
  getVideosForCategory,
  priceGridSpan12,
} from "@/data/videoCatalog";
import {
  isMicroDna,
} from "@/data/videoCommerce";

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

function minCellHeight(span: number): string {
  if (span <= 2) return "min-h-[132px]";
  if (span <= 3) return "min-h-[158px]";
  if (span <= 4) return "min-h-[188px]";
  if (span <= 6) return "min-h-[220px]";
  return "min-h-[260px]";
}

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
  const base = useMemo(() => getVideosForCategory(slug), [slug]);
  const [orientationFilter, setOrientationFilter] =
    useState<OrientationFilter>("all");
  const [priceFilter, setPriceFilter] = useState<PriceFilter>("all");
  const [newestFilter, setNewestFilter] = useState<NewestFilter>("all");
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
    <div
      className="grid grid-cols-12 gap-0 border border-white/10 [border-width:0.5px] [html[data-theme='light']_&]:border-zinc-200"
      style={{ gridAutoFlow: "dense" as const }}
    >
      {videos.map((video) => {
        const micro = isMicroDna(video);
        const span = micro ? 2 : priceGridSpan12(video.priceWon);
        const dense = micro || span <= 3;
        const minH = micro ? "min-h-[96px] sm:min-h-[104px]" : minCellHeight(span);
        return (
          <div
            key={video.id}
            className={`flex min-h-0 flex-col border-b border-r border-white/10 [border-bottom-width:0.5px] [border-right-width:0.5px] [html[data-theme='light']_&]:border-zinc-200 ${minH}`}
            style={{ gridColumn: `span ${span} / span ${span}` }}
          >
            <VideoCard
              video={video}
              flush
              dense={dense}
              instantPreview={false}
              domId={`clip-${video.id}`}
              className="h-full min-h-0 w-full flex-1"
            />
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-transparent text-zinc-100 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-900">
      <div className="mx-auto flex max-w-[1800px]">
        <aside className="hidden w-[168px] shrink-0 border-r border-white/10 [border-right-width:0.5px] [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50 md:block lg:w-[188px]">
          <div className="sticky top-[var(--header-height,220px)] space-y-1 px-4 py-8">
            <p className={filterSectionLabel}>
              방향
            </p>
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
                orientationFilter === "portrait"
                  ? filterBtnActive
                  : filterBtnInactive
              }`}
            >
              세로
            </button>
            <button
              type="button"
              onClick={() => setOrientationFilter("landscape")}
              className={`w-full rounded-md px-2.5 py-2 text-left font-mono text-[11px] transition-colors ${
                orientationFilter === "landscape"
                  ? filterBtnActive
                  : filterBtnInactive
              }`}
            >
              가로
            </button>

            <p className={`mt-8 ${filterSectionLabel}`}>
              가격
            </p>
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

            <p className={`mt-8 ${filterSectionLabel}`}>
              최신
            </p>
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
        </aside>

        <main className="min-w-0 flex-1 [html[data-theme='light']_&]:bg-white">
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
                    <>등록된 조각 {sorted.length}개</>
                  )}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1 md:hidden">
                <button
                  type="button"
                  onClick={() =>
                    setOrientationFilter((v) =>
                      v === "all" ? "portrait" : v === "portrait" ? "landscape" : "all",
                    )
                  }
                  className={`rounded-md px-3 py-1.5 font-mono text-[11px] ${
                    orientationFilter !== "all"
                      ? "bg-reels-crimson/90 text-white"
                      : "bg-white/[0.06] text-zinc-400 [html[data-theme='light']_&]:bg-zinc-100 [html[data-theme='light']_&]:text-zinc-700"
                  }`}
                >
                  방향:{" "}
                  {orientationFilter === "all"
                    ? "전체"
                    : orientationFilter === "portrait"
                      ? "세로"
                      : "가로"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPriceFilter((v) =>
                      v === "all" ? "high" : v === "high" ? "low" : "all",
                    )
                  }
                  className={`rounded-md px-3 py-1.5 font-mono text-[11px] ${
                    priceFilter !== "all"
                      ? "bg-reels-crimson/90 text-white"
                      : "bg-white/[0.06] text-zinc-400 [html[data-theme='light']_&]:bg-zinc-100 [html[data-theme='light']_&]:text-zinc-700"
                  }`}
                >
                  가격:{" "}
                  {priceFilter === "all"
                    ? "전체"
                    : priceFilter === "high"
                      ? "높은순"
                      : "낮은순"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setNewestFilter((v) =>
                      v === "all" ? "newest" : v === "newest" ? "oldest" : "all",
                    )
                  }
                  className={`rounded-md px-3 py-1.5 font-mono text-[11px] ${
                    newestFilter !== "all"
                      ? "bg-reels-crimson/90 text-white"
                      : "bg-white/[0.06] text-zinc-400 [html[data-theme='light']_&]:bg-zinc-100 [html[data-theme='light']_&]:text-zinc-700"
                  }`}
                >
                  최신:{" "}
                  {newestFilter === "all"
                    ? "전체"
                    : newestFilter === "newest"
                      ? "최신순"
                      : "오래된순"}
                </button>
              </div>
            </div>
          </header>

          {slug === "best" ? (
            <BestEndlessRankFeed videos={sorted} />
          ) : null}

          {slug !== "best" && sorted.length === 0 ? (
            <p className="px-4 py-16 text-center font-mono text-[12px] text-zinc-500 sm:px-6 [html[data-theme='light']_&]:text-zinc-600">
              이 조건에 맞는 조각이 없어요.
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

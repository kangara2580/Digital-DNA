"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

const INITIAL_VISIBLE = 20;
const BATCH_SIZE = 20;
import { SlidersHorizontal, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { TrendingVideoStatsFooter } from "@/components/TrendingVideoStatsFooter";
import { VideoCard } from "@/components/VideoCard";
import { useTranslation } from "@/hooks/useTranslation";
import { getMetricsForVideoDetail } from "@/data/trendingStats";
import {
  MALL_CATEGORY_TOOLBAR_END_ID,
  MALL_CATEGORY_TOOLBAR_START_ID,
} from "@/data/mallCategoryNav";
import type { CategorySlug } from "@/data/videoCatalog";
import type { FeedVideo } from "@/data/videos";
import {
  getVideoCatalogMeta,
  getVideosForCategory,
} from "@/data/videoCatalog";

type OrientationFilter = "all" | "portrait" | "landscape";
type PriceFilter = "all" | "high" | "low";
type NewestFilter = "all" | "newest" | "oldest";
const CATEGORY_FEED_CACHE_TTL_MS = 120_000;

/** 필터 칩 — 컴팩트(전체 너비 행 제거) */
const chipBase =
  "inline-flex shrink-0 items-center justify-center rounded-full px-2.5 py-1.5 text-[11px] font-semibold transition-[background-color,color,opacity] tabular-nums";
const chipOn =
  "bg-white/22 text-white ring-2 ring-white/35 [html[data-theme='light']_&]:bg-zinc-900 [html[data-theme='light']_&]:text-white [html[data-theme='light']_&]:ring-zinc-700";
const chipOff =
  "text-zinc-200 hover:bg-white/14 hover:text-white [html[data-theme='light']_&]:text-zinc-700 [html[data-theme='light']_&]:hover:bg-zinc-200 [html[data-theme='light']_&]:hover:text-zinc-950";
const chipDisabled =
  "cursor-not-allowed opacity-45 hover:bg-transparent hover:text-zinc-400 [html[data-theme='light']_&]:text-zinc-400 [html[data-theme='light']_&]:hover:bg-transparent [html[data-theme='light']_&]:hover:text-zinc-400";

const filterGroupLabel =
  "mb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-300 [html[data-theme='light']_&]:text-zinc-600";

export function CategoryClipsClient({ slug }: { slug: CategorySlug }) {
  const router = useRouter();
  const { t } = useTranslation();
  const label = t(`nav.cat.${slug}`);
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
  const [toolbarHosts, setToolbarHosts] = useState<{
    start: HTMLElement | null;
    end: HTMLElement | null;
  }>({ start: null, end: null });
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
      aria-label={t("category.listAria", { cat: label })}
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

  useLayoutEffect(() => {
    setToolbarHosts({
      start: document.getElementById(MALL_CATEGORY_TOOLBAR_START_ID),
      end: document.getElementById(MALL_CATEGORY_TOOLBAR_END_ID),
    });
  }, []);

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

  const categoryTitleToolbar = (
    <h1 className="truncate text-xl font-extrabold tracking-tight text-zinc-100 sm:text-2xl [html[data-theme='light']_&]:text-zinc-900">
      {label}
    </h1>
  );

  const categoryFilterToolbar = (
    <div ref={filterWrapRef} className="relative">
      <button
        type="button"
        onClick={() => setFilterOpen((open) => !open)}
        aria-expanded={filterOpen}
        aria-controls="category-filter-popover"
        className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-2.5 py-1.5 text-[11px] font-bold text-zinc-200 transition hover:border-white/25 hover:bg-white/[0.1] sm:gap-2 sm:px-3.5 sm:py-2 sm:text-[12px] [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-100 [html[data-theme='light']_&]:text-zinc-800"
      >
        <SlidersHorizontal className="h-4 w-4 shrink-0 sm:h-[18px] sm:w-[18px]" aria-hidden />
        {t("category.filter.button")}
        {activeFilterCount > 0 ? (
          <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-reels-crimson/85 px-1.5 py-0.5 text-[10px] font-extrabold text-white">
            {activeFilterCount}
          </span>
        ) : null}
      </button>

      {filterOpen ? (
        <section
          id="category-filter-popover"
          className="absolute right-0 top-[calc(100%+0.45rem)] z-30 w-max min-w-[10.5rem] max-w-[calc(100vw-1.25rem)] rounded-xl border border-white/18 bg-[#03050c]/[0.97] px-2.5 py-2.5 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.75)] backdrop-blur-sm [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:shadow-lg"
          aria-label={t("category.filter.popoverAria")}
        >
          <div className="mb-2.5 flex items-center justify-between gap-3">
            <p className="text-[12px] font-bold text-white [html[data-theme='light']_&]:text-zinc-900">
              {t("category.filter.title")}
            </p>
            <button
              type="button"
              onClick={() => setFilterOpen(false)}
              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-zinc-300 transition hover:bg-white/12 hover:text-white [html[data-theme='light']_&]:text-zinc-600 [html[data-theme='light']_&]:hover:bg-zinc-200 [html[data-theme='light']_&]:hover:text-zinc-950"
              aria-label={t("category.filter.close")}
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <p className={filterGroupLabel}>{t("category.filter.orientation")}</p>
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => setOrientationFilter("all")}
                  className={`${chipBase} ${
                    orientationFilter === "all" ? chipOn : chipOff
                  }`}
                >
                  {t("category.filter.all")}
                </button>
                <button
                  type="button"
                  onClick={() => setOrientationFilter("portrait")}
                  className={`${chipBase} ${
                    orientationFilter === "portrait" ? chipOn : chipOff
                  }`}
                >
                  {t("category.orientation.portrait")}
                </button>
                <button
                  type="button"
                  onClick={() => setOrientationFilter("landscape")}
                  disabled={orientationCounts.landscape === 0}
                  className={`${chipBase} ${
                    orientationCounts.landscape === 0
                      ? chipDisabled
                      : orientationFilter === "landscape"
                        ? chipOn
                        : chipOff
                  }`}
                >
                  {t("category.orientation.landscape")}
                </button>
              </div>
            </div>

            <div>
              <p className={filterGroupLabel}>{t("category.filter.price")}</p>
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => setPriceFilter("all")}
                  className={`${chipBase} ${priceFilter === "all" ? chipOn : chipOff}`}
                >
                  {t("category.filter.all")}
                </button>
                <button
                  type="button"
                  onClick={() => setPriceFilter("high")}
                  className={`${chipBase} ${priceFilter === "high" ? chipOn : chipOff}`}
                >
                  {t("category.price.highToLow")}
                </button>
                <button
                  type="button"
                  onClick={() => setPriceFilter("low")}
                  className={`${chipBase} ${priceFilter === "low" ? chipOn : chipOff}`}
                >
                  {t("category.price.lowToHigh")}
                </button>
              </div>
            </div>

            <div>
              <p className={filterGroupLabel}>{t("category.filter.newest")}</p>
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => setNewestFilter("all")}
                  className={`${chipBase} ${newestFilter === "all" ? chipOn : chipOff}`}
                >
                  {t("category.filter.all")}
                </button>
                <button
                  type="button"
                  onClick={() => setNewestFilter("newest")}
                  className={`${chipBase} ${newestFilter === "newest" ? chipOn : chipOff}`}
                >
                  {t("category.sort.newest")}
                </button>
                <button
                  type="button"
                  onClick={() => setNewestFilter("oldest")}
                  className={`${chipBase} ${newestFilter === "oldest" ? chipOn : chipOff}`}
                >
                  {t("category.sort.oldest")}
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setOrientationFilter("all");
              setPriceFilter("all");
              setNewestFilter("all");
            }}
            className="mt-3 w-full rounded-full border border-white/30 py-1.5 text-[11px] font-semibold text-zinc-100 transition hover:border-white/45 hover:bg-white/[0.08] [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:text-zinc-800 [html[data-theme='light']_&]:hover:border-zinc-500 [html[data-theme='light']_&]:hover:bg-zinc-100"
          >
            {t("category.filter.reset")}
          </button>
        </section>
      ) : null}
    </div>
  );

  return (
    <div className="min-h-screen bg-transparent text-zinc-100 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-900">
      <div className="mx-auto max-w-[1800px]">
        <main className="min-w-0 pt-3 sm:pt-4 [html[data-theme='light']_&]:bg-white">
          {toolbarHosts.start ? createPortal(categoryTitleToolbar, toolbarHosts.start) : null}
          {toolbarHosts.end ? createPortal(categoryFilterToolbar, toolbarHosts.end) : null}

          {sorted.length === 0 ? (
            <p className="px-4 py-16 text-center font-mono text-[12px] text-zinc-500 sm:px-6 [html[data-theme='light']_&]:text-zinc-600">
              {t("category.emptyFiltered")}
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

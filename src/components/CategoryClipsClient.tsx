"use client";

import { useMemo, useState } from "react";
import { VideoCard } from "@/components/VideoCard";
import type { CategorySlug } from "@/data/videoCatalog";
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

function minCellHeight(span: number): string {
  if (span <= 2) return "min-h-[132px]";
  if (span <= 3) return "min-h-[158px]";
  if (span <= 4) return "min-h-[188px]";
  if (span <= 6) return "min-h-[220px]";
  return "min-h-[260px]";
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

  return (
    <div className="min-h-screen bg-transparent text-zinc-100">
      <div className="mx-auto flex max-w-[1800px]">
        <aside className="hidden w-[168px] shrink-0 border-r border-white/10 [border-right-width:0.5px] md:block lg:w-[188px]">
          <div className="sticky top-[var(--header-height,220px)] space-y-1 px-4 py-8">
            <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-600">
              방향
            </p>
            <button
              type="button"
              onClick={() => setOrientationFilter("all")}
              className={`w-full rounded-md px-2.5 py-2 text-left font-mono text-[11px] transition-colors ${
                orientationFilter === "all"
                  ? "bg-white/10 text-zinc-100"
                  : "text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-300"
              }`}
            >
              전체
            </button>
            <button
              type="button"
              onClick={() => setOrientationFilter("portrait")}
              className={`w-full rounded-md px-2.5 py-2 text-left font-mono text-[11px] transition-colors ${
                orientationFilter === "portrait"
                  ? "bg-white/10 text-zinc-100"
                  : "text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-300"
              }`}
            >
              세로
            </button>
            <button
              type="button"
              onClick={() => setOrientationFilter("landscape")}
              className={`w-full rounded-md px-2.5 py-2 text-left font-mono text-[11px] transition-colors ${
                orientationFilter === "landscape"
                  ? "bg-white/10 text-zinc-100"
                  : "text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-300"
              }`}
            >
              가로
            </button>

            <p className="mb-3 mt-8 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-600">
              가격
            </p>
            <button
              type="button"
              onClick={() => setPriceFilter("all")}
              className={`w-full rounded-md px-2.5 py-2 text-left font-mono text-[11px] transition-colors ${
                priceFilter === "all"
                  ? "bg-white/10 text-zinc-100"
                  : "text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-300"
              }`}
            >
              전체
            </button>
            <button
              type="button"
              onClick={() => setPriceFilter("high")}
              className={`w-full rounded-md px-2.5 py-2 text-left font-mono text-[11px] transition-colors ${
                priceFilter === "high"
                  ? "bg-white/10 text-zinc-100"
                  : "text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-300"
              }`}
            >
              높은순
            </button>
            <button
              type="button"
              onClick={() => setPriceFilter("low")}
              className={`w-full rounded-md px-2.5 py-2 text-left font-mono text-[11px] transition-colors ${
                priceFilter === "low"
                  ? "bg-white/10 text-zinc-100"
                  : "text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-300"
              }`}
            >
              낮은순
            </button>

            <p className="mb-3 mt-8 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-600">
              최신
            </p>
            <button
              type="button"
              onClick={() => setNewestFilter("all")}
              className={`w-full rounded-md px-2.5 py-2 text-left font-mono text-[11px] transition-colors ${
                newestFilter === "all"
                  ? "bg-white/10 text-zinc-100"
                  : "text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-300"
              }`}
            >
              전체
            </button>
            <button
              type="button"
              onClick={() => setNewestFilter("newest")}
              className={`w-full rounded-md px-2.5 py-2 text-left font-mono text-[11px] transition-colors ${
                newestFilter === "newest"
                  ? "bg-white/10 text-zinc-100"
                  : "text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-300"
              }`}
            >
              최신순
            </button>
            <button
              type="button"
              onClick={() => setNewestFilter("oldest")}
              className={`w-full rounded-md px-2.5 py-2 text-left font-mono text-[11px] transition-colors ${
                newestFilter === "oldest"
                  ? "bg-white/10 text-zinc-100"
                  : "text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-300"
              }`}
            >
              오래된순
            </button>

          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="border-b border-white/10 [border-bottom-width:0.5px] px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-zinc-100 sm:text-2xl">
                  {label}
                </h1>
                <p className="mt-2 font-mono text-[11px] leading-none text-zinc-500 sm:text-[12px]">
                  등록된 조각 {sorted.length}개
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
                      : "bg-white/[0.06] text-zinc-400"
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
                      : "bg-white/[0.06] text-zinc-400"
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
                      : "bg-white/[0.06] text-zinc-400"
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

          {sorted.length === 0 ? (
            <p className="px-4 py-16 text-center font-mono text-[12px] text-zinc-500 sm:px-6">
              이 조건에 맞는 조각이 없어요.
            </p>
          ) : (
            <div
              className="grid grid-cols-12 gap-0 border border-white/10 [border-width:0.5px]"
              style={{ gridAutoFlow: "dense" as const }}
            >
              {sorted.map((video) => {
                const micro = isMicroDna(video);
                const span = micro ? 2 : priceGridSpan12(video.priceWon);
                const dense = micro || span <= 3;
                const minH = micro ? "min-h-[96px] sm:min-h-[104px]" : minCellHeight(span);
                return (
                  <div
                    key={video.id}
                    className={`flex min-h-0 flex-col border-b border-r border-white/10 [border-bottom-width:0.5px] [border-right-width:0.5px] ${minH}`}
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
          )}
        </main>
      </div>
    </div>
  );
}

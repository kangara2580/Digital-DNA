"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { VideoCard } from "@/components/VideoCard";
import { useRecentClips } from "@/context/RecentClipsContext";
import { ALL_MARKET_VIDEOS } from "@/data/videoCatalog";
import type { FeedVideo } from "@/data/videos";

const SORT_OPTIONS = [
  { value: "recent", label: "Recently viewed" },
  { value: "oldest", label: "Oldest in history" },
  { value: "price-asc", label: "Price · Low → high" },
  { value: "price-desc", label: "Price · High → low" },
  { value: "title-asc", label: "Title · A → Z" },
  { value: "title-desc", label: "Title · Z → A" },
  { value: "duration-asc", label: "Duration · Short first" },
  { value: "duration-desc", label: "Duration · Long first" },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]["value"];

type Row = { video: FeedVideo; viewedAt: number };

function sortRows(rows: Row[], sort: SortValue): Row[] {
  const copy = [...rows];
  const noPrice = 1e12;
  switch (sort) {
    case "recent":
      return copy.sort((a, b) => b.viewedAt - a.viewedAt);
    case "oldest":
      return copy.sort((a, b) => a.viewedAt - b.viewedAt);
    case "price-asc":
      return copy.sort(
        (a, b) =>
          (a.video.priceWon ?? noPrice) - (b.video.priceWon ?? noPrice),
      );
    case "price-desc":
      return copy.sort(
        (a, b) =>
          (b.video.priceWon ?? -1) - (a.video.priceWon ?? -1),
      );
    case "title-asc":
      return copy.sort((a, b) =>
        a.video.title.localeCompare(b.video.title, undefined, {
          sensitivity: "base",
        }),
      );
    case "title-desc":
      return copy.sort((a, b) =>
        b.video.title.localeCompare(a.video.title, undefined, {
          sensitivity: "base",
        }),
      );
    case "duration-asc":
      return copy.sort(
        (a, b) =>
          (a.video.durationSec ?? 0) - (b.video.durationSec ?? 0),
      );
    case "duration-desc":
      return copy.sort(
        (a, b) =>
          (b.video.durationSec ?? 0) - (a.video.durationSec ?? 0),
      );
    default:
      return copy;
  }
}

export default function RecentPage() {
  const { entries, hydrated, clear, remove } = useRecentClips();
  const [sort, setSort] = useState<SortValue>("recent");

  const catalogById = useMemo(
    () => new Map(ALL_MARKET_VIDEOS.map((v) => [v.id, v] as const)),
    [],
  );

  const rows = useMemo(() => {
    const list: Row[] = [];
    for (const e of entries) {
      const video = catalogById.get(e.id);
      if (video) list.push({ video, viewedAt: e.viewedAt });
    }
    return sortRows(list, sort);
  }, [entries, catalogById, sort]);

  return (
    <main className="mx-auto min-h-[50vh] max-w-[1800px] px-4 py-10 text-zinc-100 [html[data-theme='light']_&]:text-zinc-900 sm:px-6 sm:py-12 lg:px-8">
      <header className="flex flex-col gap-4 border-b border-white/10 pb-8 [html[data-theme='light']_&]:border-zinc-200 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-100 sm:text-3xl [html[data-theme='light']_&]:text-zinc-900">
            최근 본 조각
          </h1>
          <p className="mt-1 text-[15px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
            <span className="font-semibold text-zinc-300 [html[data-theme='light']_&]:text-zinc-800">Recently viewed</span>
            <span className="mx-1.5 text-zinc-600" aria-hidden>
              ·
            </span>
            조각 상세 페이지를 열면 자동으로 여기 쌓입니다. 우측 상단 시계
            아이콘으로도 올 수 있어요.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <label className="flex items-center gap-2 text-[13px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
            <span className="sr-only">Sort order</span>
            <span className="hidden font-medium text-zinc-400 sm:inline [html[data-theme='light']_&]:text-zinc-700">
              Sort
            </span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortValue)}
              className="min-w-[11.5rem] cursor-pointer rounded-lg border border-white/15 bg-reels-void/80 px-3 py-2 text-[13px] font-medium text-zinc-100 outline-none transition-colors hover:border-reels-cyan/35 focus:border-reels-cyan/50 focus:ring-2 focus:ring-reels-cyan/25 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-900"
              aria-label="Sort recently viewed clips"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          {hydrated && entries.length > 0 ? (
            <button
              type="button"
              onClick={() => {
                if (
                  typeof window !== "undefined" &&
                  window.confirm("Clear all recently viewed clips on this device?")
                ) {
                  clear();
                }
              }}
              className="rounded-lg border border-white/15 px-3 py-2 text-[13px] font-medium text-zinc-400 transition-colors hover:border-reels-crimson/35 hover:bg-white/[0.06] hover:text-zinc-100 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:text-zinc-700 [html[data-theme='light']_&]:hover:bg-zinc-100 [html[data-theme='light']_&]:hover:text-zinc-900"
            >
              Clear all
            </button>
          ) : null}
        </div>
      </header>

      {!hydrated ? (
        <p className="mt-10 text-[14px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600" aria-live="polite">
          Loading…
        </p>
      ) : rows.length === 0 ? (
        <div className="mx-auto mt-16 max-w-md text-center">
          <p className="text-[16px] font-semibold text-zinc-200 [html[data-theme='light']_&]:text-zinc-900">
            No recently viewed clips
          </p>
          <p className="mt-2 text-[14px] leading-relaxed text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
            Open any clip detail page — it will show up here automatically.
            <span className="mt-2 block text-[13px] text-zinc-600">
              아직 본 조각이 없어요. 마음에 드는 클립을 열어 보세요.
            </span>
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-full bg-reels-crimson px-5 py-2.5 text-[14px] font-extrabold text-white shadow-reels-crimson hover:brightness-110"
          >
            Browse clips
          </Link>
        </div>
      ) : (
        <ul className="mt-8 grid list-none grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {rows.map(({ video }) => (
            <li key={video.id} className="relative min-w-0">
              <button
                type="button"
                onClick={() => remove(video.id)}
                className="absolute right-2 top-2 z-[25] flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-reels-void/90 text-zinc-300 shadow-md backdrop-blur-md transition-colors hover:border-reels-crimson/40 hover:bg-white/10 hover:text-white [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-800 [html[data-theme='light']_&]:hover:bg-zinc-100"
                aria-label={`Remove ${video.title} from recently viewed`}
              >
                <X className="h-4 w-4" strokeWidth={2.2} aria-hidden />
              </button>
              <VideoCard
                video={video}
                domId={`recent-${video.id}`}
                className="min-w-0"
              />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

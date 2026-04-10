"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { VideoCard } from "@/components/VideoCard";
import { useWishlist } from "@/context/WishlistContext";
import { ALL_MARKET_VIDEOS } from "@/data/videoCatalog";
import type { FeedVideo } from "@/data/videos";

/** 글로벌 사용자 기준: 라벨은 영어(국제 관례), 보조 설명은 한국어 */
const SORT_OPTIONS = [
  { value: "recent", label: "Recently saved" },
  { value: "oldest", label: "Oldest saved" },
  { value: "price-asc", label: "Price · Low → high" },
  { value: "price-desc", label: "Price · High → low" },
  { value: "title-asc", label: "Title · A → Z" },
  { value: "title-desc", label: "Title · Z → A" },
  { value: "duration-asc", label: "Duration · Short first" },
  { value: "duration-desc", label: "Duration · Long first" },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]["value"];

type Row = { video: FeedVideo; savedAt: number };

function sortRows(rows: Row[], sort: SortValue): Row[] {
  const copy = [...rows];
  const noPrice = 1e12;
  switch (sort) {
    case "recent":
      return copy.sort((a, b) => b.savedAt - a.savedAt);
    case "oldest":
      return copy.sort((a, b) => a.savedAt - b.savedAt);
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

export default function WishlistPage() {
  const { entries, hydrated, clear } = useWishlist();
  const [sort, setSort] = useState<SortValue>("recent");

  const catalogById = useMemo(
    () => new Map(ALL_MARKET_VIDEOS.map((v) => [v.id, v] as const)),
    [],
  );

  const rows = useMemo(() => {
    const list: Row[] = [];
    for (const e of entries) {
      const video = catalogById.get(e.id);
      if (video) list.push({ video, savedAt: e.savedAt });
    }
    return sortRows(list, sort);
  }, [entries, catalogById, sort]);

  return (
    <main className="mx-auto min-h-[50vh] max-w-[1800px] px-4 py-10 text-zinc-100 [html[data-theme='light']_&]:text-zinc-900 sm:px-6 sm:py-12 lg:px-8">
      <header className="flex flex-col gap-4 border-b border-white/10 pb-8 [html[data-theme='light']_&]:border-zinc-200 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-100 sm:text-3xl [html[data-theme='light']_&]:text-zinc-900">
            찜한 조각
          </h1>
          <p className="mt-1 text-[15px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
            <span className="font-semibold text-zinc-300 [html[data-theme='light']_&]:text-zinc-800">Saved clips</span>
            <span className="mx-1.5 text-zinc-600" aria-hidden>
              ·
            </span>
            카드에서 하트를 누르면 여기 모입니다. 우측 상단 하트에서도 바로 올 수
            있어요.
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
              aria-label="Sort saved clips"
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
                  window.confirm("Remove all saved clips from this list?")
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
            No saved clips yet
          </p>
          <p className="mt-2 text-[14px] leading-relaxed text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
            Explore clips and tap the heart on a card — they will appear here.
            <span className="mt-2 block text-[13px] text-zinc-600">
              아직 찜한 클립이 없어요. 영상 카드에서 하트를 눌러 보세요.
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
            <li key={video.id} className="min-w-0">
              <VideoCard
                video={video}
                domId={`wishlist-${video.id}`}
                className="min-w-0"
              />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { VideoCard } from "@/components/VideoCard";
import { useWishlist } from "@/context/WishlistContext";
import { resolveManualTikTokVideoForStudio } from "@/data/tiktokData";
import { buildWishlistVideoLookup } from "@/data/videoCatalog";
import type { FeedVideo } from "@/data/videos";
import { useAuthSession } from "@/hooks/useAuthSession";

const SORT_OPTIONS = [
  { value: "recent", label: "최근 찜한 순" },
  { value: "oldest", label: "오래된 순" },
  { value: "price-asc", label: "가격 낮은 순" },
  { value: "price-desc", label: "가격 높은 순" },
  { value: "title-asc", label: "제목 가나다순" },
  { value: "title-desc", label: "제목 역순" },
  { value: "duration-asc", label: "재생 짧은 순" },
  { value: "duration-desc", label: "재생 긴 순" },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]["value"];

type Row = { entryId: string; video: FeedVideo; savedAt: number };

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
  const { user, loading: authLoading, supabaseConfigured } = useAuthSession();
  const { entries, hydrated, clear } = useWishlist();
  const [sort, setSort] = useState<SortValue>("recent");

  const videoByStoredId = useMemo(() => buildWishlistVideoLookup(), []);

  const rows = useMemo(() => {
    const list: Row[] = [];
    for (const e of entries) {
      const fromCatalog = videoByStoredId.get(e.id);
      const video =
        fromCatalog ?? resolveManualTikTokVideoForStudio(e.id) ?? undefined;
      if (video) list.push({ entryId: e.id, video, savedAt: e.savedAt });
    }
    return sortRows(list, sort);
  }, [entries, videoByStoredId, sort]);

  const showLoginGate =
    supabaseConfigured && !authLoading && hydrated && !user;

  return (
    <main className="mx-auto min-h-[50vh] max-w-[1800px] px-4 py-10 text-zinc-100 [html[data-theme='light']_&]:text-zinc-900 sm:px-6 sm:py-12 lg:px-8">
      <header className="flex flex-col gap-4 border-b border-white/10 pb-8 [html[data-theme='light']_&]:border-zinc-200 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-100 sm:text-3xl [html[data-theme='light']_&]:text-zinc-900">
            Wishlist · 찜한 목록
          </h1>
        </div>

        {!showLoginGate ? (
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <label className="flex items-center gap-2 text-[13px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
              <span className="sr-only">정렬 기준</span>
              <span className="hidden font-medium text-zinc-400 sm:inline [html[data-theme='light']_&]:text-zinc-700">
                정렬
              </span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortValue)}
                className="min-w-[11.5rem] cursor-pointer rounded-lg border border-white/15 bg-reels-void/80 px-3 py-2 text-[13px] font-medium text-zinc-100 outline-none transition-colors hover:border-reels-cyan/35 focus:border-reels-cyan/50 focus:ring-2 focus:ring-reels-cyan/25 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-900"
                aria-label="찜한 릴스 정렬"
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
                  void (async () => {
                    if (
                      typeof window !== "undefined" &&
                      window.confirm("찜한 릴스를 모두 목록에서 삭제할까요?")
                    ) {
                      await clear();
                    }
                  })();
                }}
                className="rounded-lg border border-white/15 px-3 py-2 text-[13px] font-medium text-zinc-400 transition-colors hover:border-reels-crimson/35 hover:bg-white/[0.06] hover:text-zinc-100 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:text-zinc-700 [html[data-theme='light']_&]:hover:bg-zinc-100 [html[data-theme='light']_&]:hover:text-zinc-900"
              >
                전체 삭제
              </button>
            ) : null}
          </div>
        ) : null}
      </header>

      {showLoginGate ? (
        <div className="mx-auto mt-16 max-w-md text-center">
          <p className="text-[15px] leading-relaxed text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
            로그인하면 찜한 릴스가 저장되고, 이 페이지에서만 모아 볼 수 있어요.
          </p>
          <Link
            href={`/login?redirect=${encodeURIComponent("/wishlist")}`}
            className="mt-6 inline-flex rounded-full bg-reels-crimson px-5 py-2.5 text-[14px] font-extrabold text-white shadow-reels-crimson hover:brightness-110"
          >
            로그인
          </Link>
        </div>
      ) : !hydrated ? (
        <p className="mt-10 text-[14px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600" aria-live="polite">
          불러오는 중…
        </p>
      ) : rows.length === 0 ? (
        <div className="mx-auto mt-16 max-w-md text-center">
          <p className="text-[15px] leading-relaxed text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
            아직 찜한 릴스가 없어요. 영상 카드에서 하트를 눌러 보세요.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-full bg-reels-crimson px-5 py-2.5 text-[14px] font-extrabold text-white shadow-reels-crimson hover:brightness-110"
          >
            릴스 둘러보기
          </Link>
        </div>
      ) : (
        <ul className="mt-8 grid list-none grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {rows.map(({ entryId, video }) => (
            <li key={entryId} className="min-w-0">
              <VideoCard
                video={video}
                domId={`wishlist-${entryId}`}
                className="min-w-0"
              />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

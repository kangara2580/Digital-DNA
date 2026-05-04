"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { VideoCard } from "@/components/VideoCard";
import { MyPageSortSelect } from "@/components/MyPageSortSelect";
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
  const { entries, hydrated, clear, removeMany } = useWishlist();
  const [sort, setSort] = useState<SortValue>("recent");
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [loginCtaVisible, setLoginCtaVisible] = useState(false);

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

  const allEntryIds = useMemo(() => rows.map((r) => r.entryId), [rows]);

  const toggleSelect = useCallback((id: string) => {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }, []);

  const selectAllWishlist = useCallback(() => {
    setSelected(new Set(allEntryIds));
  }, [allEntryIds]);

  const clearWishlistSelection = useCallback(() => setSelected(new Set()), []);

  const deleteSelectedWishlist = useCallback(() => {
    if (selected.size === 0) return;
    if (
      typeof window !== "undefined" &&
      !window.confirm(`선택한 ${selected.size}개를 찜 목록에서 뺄까요?`)
    ) {
      return;
    }
    void removeMany([...selected]).then(() => setSelected(new Set()));
  }, [selected, removeMany]);

  /** 로그인 없이도 localStorage 찜이 있으면 목록 표시 */
  const showLoginGate =
    supabaseConfigured &&
    !authLoading &&
    hydrated &&
    !user &&
    entries.length === 0;

  useEffect(() => {
    if (!showLoginGate) {
      setLoginCtaVisible(false);
      return;
    }
    const raf = window.requestAnimationFrame(() => {
      setLoginCtaVisible(true);
    });
    return () => window.cancelAnimationFrame(raf);
  }, [showLoginGate]);

  return (
    <main className="mx-auto min-h-[50vh] max-w-[1800px] px-4 py-10 text-zinc-100 [html[data-theme='light']_&]:text-zinc-900 sm:px-6 sm:py-12 lg:px-8">
      <header className="flex flex-col gap-4 border-b border-white/10 pb-8 [html[data-theme='light']_&]:border-zinc-200 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
            찜한 목록
          </h1>
        </div>

        {!showLoginGate ? (
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <label className="flex items-center gap-2 text-[13px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
              <span className="sr-only">정렬 기준</span>
              <span className="hidden font-medium text-zinc-400 sm:inline [html[data-theme='light']_&]:text-zinc-700">
                정렬
              </span>
              <MyPageSortSelect
                options={SORT_OPTIONS}
                value={sort}
                onChange={(v) => setSort(v as SortValue)}
                ariaLabel="찜한 동영상 정렬"
              />
            </label>
            {hydrated && entries.length > 0 ? (
              <>
                <button
                  type="button"
                  onClick={selectAllWishlist}
                  className="rounded-lg border border-white/15 px-3 py-2 text-[13px] font-medium text-zinc-400 transition-[border-color,background-color] hover:border-white/40 hover:bg-white/[0.06] [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:text-zinc-700 [html[data-theme='light']_&]:hover:border-zinc-400"
                >
                  전체 선택
                </button>
                <button
                  type="button"
                  onClick={clearWishlistSelection}
                  disabled={selected.size === 0}
                  className="rounded-lg border border-white/15 px-3 py-2 text-[13px] font-medium text-zinc-400 transition-colors hover:border-white/25 disabled:opacity-40 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:text-zinc-700"
                >
                  선택 해제
                </button>
                <button
                  type="button"
                  onClick={deleteSelectedWishlist}
                  disabled={selected.size === 0}
                  className="rounded-lg border border-reels-crimson/38 px-3 py-2 text-[13px] font-medium text-[#F3C4D9] transition-colors hover:bg-reels-crimson/12 disabled:opacity-40 [html[data-theme='light']_&]:text-reels-crimson"                >
                  선택 삭제
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void (async () => {
                      if (
                        typeof window !== "undefined" &&
                        window.confirm("찜한 동영상을 모두 목록에서 삭제할까요?")
                      ) {
                        await clear();
                        setSelected(new Set());
                      }
                    })();
                  }}
                  className="rounded-lg border border-white/15 px-3 py-2 text-[13px] font-medium text-zinc-400 transition-[border-color,background-color] hover:border-white/40 hover:bg-white/[0.06] [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:text-zinc-700 [html[data-theme='light']_&]:hover:border-zinc-400"
                >
                  전체 삭제
                </button>
              </>
            ) : null}
          </div>
        ) : null}
      </header>

      {showLoginGate ? (
        <div className="mx-auto mt-16 max-w-md text-center">
          <p className="text-[15px] leading-relaxed text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
            로그인하면 찜한 동영상을 볼 수 있어요!
          </p>
          <div
            className={`mt-6 transition-[opacity,transform] duration-300 ease-out ${
              loginCtaVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-1.5 opacity-0"
            }`}
          >
            <Link
              href={`/login?redirect=${encodeURIComponent("/wishlist")}`}
              className="inline-flex items-center justify-center rounded-full border border-white/20 bg-[linear-gradient(135deg,#0b1327_0%,#122247_50%,#1e3a8a_100%)] px-7 py-2.5 text-[14px] font-bold text-white ring-1 ring-white/10 shadow-[0_12px_28px_-14px_rgba(30,58,138,0.82)] transition-all duration-300 hover:-translate-y-0.5 hover:border-white/30 hover:brightness-110 hover:shadow-[0_18px_38px_-16px_rgba(37,99,235,0.8)]"
            >
              로그인
            </Link>
          </div>
        </div>
      ) : !hydrated ? (
        <p className="mt-10 text-[14px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600" aria-live="polite">
          불러오는 중…
        </p>
      ) : rows.length === 0 ? (
        <div className="mx-auto mt-16 max-w-md text-center">
          <p className="text-[15px] leading-relaxed text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
            아직 찜한 동영상이 없어요.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-full bg-reels-crimson px-5 py-2.5 text-[14px] font-extrabold text-white shadow-reels-crimson hover:brightness-110"
          >
            동영상 둘러보기
          </Link>
        </div>
      ) : (
        <ul className="mt-8 grid list-none grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {rows.map(({ entryId, video }) => (
            <li key={entryId} className="relative min-w-0">
              <label className="absolute left-2 top-2 z-[20] flex cursor-pointer items-center rounded-md bg-black/55 px-1.5 py-1 backdrop-blur-sm">
                <input
                  type="checkbox"
                  checked={selected.has(entryId)}
                  onChange={() => toggleSelect(entryId)}
                  className="h-4 w-4 rounded border-white/30 accent-reels-cyan"
                />
                <span className="sr-only">선택</span>
              </label>
              <VideoCard
                video={video}
                domId={`wishlist-${entryId}`}
                className="min-w-0"
                compactHoverActions
              />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

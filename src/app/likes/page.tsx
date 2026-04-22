"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { VideoCard } from "@/components/VideoCard";
import { resolveManualTikTokVideoForStudio } from "@/data/tiktokData";
import { buildWishlistVideoLookup } from "@/data/videoCatalog";
import type { FeedVideo } from "@/data/videos";
import { useAuthSession } from "@/hooks/useAuthSession";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import {
  fetchUserFavoritesByKind,
  removeFavorite,
} from "@/lib/supabaseFavorites";
import { waitForSupabaseAccessToken } from "@/lib/waitSupabaseSessionReady";

const SORT_OPTIONS = [
  { value: "recent", label: "최근 좋아요 순" },
  { value: "oldest", label: "오래된 순" },
  { value: "price-asc", label: "가격 낮은 순" },
  { value: "price-desc", label: "가격 높은 순" },
  { value: "title-asc", label: "제목 가나다순" },
  { value: "title-desc", label: "제목 역순" },
  { value: "duration-asc", label: "재생 짧은 순" },
  { value: "duration-desc", label: "재생 긴 순" },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]["value"];
type LikeEntry = { id: string; likedAt: number };
type Row = { entryId: string; video: FeedVideo; likedAt: number };

function sortRows(rows: Row[], sort: SortValue): Row[] {
  const copy = [...rows];
  const noPrice = 1e12;
  switch (sort) {
    case "recent":
      return copy.sort((a, b) => b.likedAt - a.likedAt);
    case "oldest":
      return copy.sort((a, b) => a.likedAt - b.likedAt);
    case "price-asc":
      return copy.sort((a, b) => (a.video.priceWon ?? noPrice) - (b.video.priceWon ?? noPrice));
    case "price-desc":
      return copy.sort((a, b) => (b.video.priceWon ?? -1) - (a.video.priceWon ?? -1));
    case "title-asc":
      return copy.sort((a, b) =>
        a.video.title.localeCompare(b.video.title, undefined, { sensitivity: "base" }),
      );
    case "title-desc":
      return copy.sort((a, b) =>
        b.video.title.localeCompare(a.video.title, undefined, { sensitivity: "base" }),
      );
    case "duration-asc":
      return copy.sort((a, b) => (a.video.durationSec ?? 0) - (b.video.durationSec ?? 0));
    case "duration-desc":
      return copy.sort((a, b) => (b.video.durationSec ?? 0) - (a.video.durationSec ?? 0));
    default:
      return copy;
  }
}

function rowsToLikeEntries(rows: { video_id: string; created_at: string }[]): LikeEntry[] {
  return rows.map((r) => {
    const t = Date.parse(r.created_at);
    return {
      id: r.video_id,
      likedAt: Number.isFinite(t) ? t : Date.now(),
    };
  });
}

export default function LikesPage() {
  const { user, loading: authLoading, supabaseConfigured } = useAuthSession();
  const [entries, setEntries] = useState<LikeEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sort, setSort] = useState<SortValue>("recent");
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  const videoByStoredId = useMemo(() => buildWishlistVideoLookup(), []);

  const loadLikes = useCallback(async () => {
    if (!supabaseConfigured || !user) {
      setEntries([]);
      setHydrated(true);
      return;
    }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setEntries([]);
      setHydrated(true);
      return;
    }

    setLoading(true);
    const tokenReady = await waitForSupabaseAccessToken(supabase);
    if (!tokenReady) {
      setLoading(false);
      setHydrated(true);
      return;
    }

    const result = await fetchUserFavoritesByKind(supabase, user.id, "like");
    if (result.ok) {
      setEntries(rowsToLikeEntries(result.rows));
    } else {
      setEntries([]);
    }
    setLoading(false);
    setHydrated(true);
  }, [supabaseConfigured, user]);

  useEffect(() => {
    if (authLoading) return;
    void loadLikes();
  }, [authLoading, loadLikes]);

  const rows = useMemo(() => {
    const list: Row[] = [];
    for (const e of entries) {
      const fromCatalog = videoByStoredId.get(e.id);
      const video =
        fromCatalog ?? resolveManualTikTokVideoForStudio(e.id) ?? undefined;
      if (video) list.push({ entryId: e.id, video, likedAt: e.likedAt });
    }
    return sortRows(list, sort);
  }, [entries, videoByStoredId, sort]);

  const allEntryIds = useMemo(() => rows.map((r) => r.entryId), [rows]);
  const showLoginGate = supabaseConfigured && !authLoading && hydrated && !user;

  const toggleSelect = useCallback((id: string) => {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }, []);

  const unlikeSelected = useCallback(async () => {
    if (!user || selected.size === 0) return;
    if (
      typeof window !== "undefined" &&
      !window.confirm(`선택한 ${selected.size}개를 좋아요 목록에서 뺄까요?`)
    ) {
      return;
    }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const ready = await waitForSupabaseAccessToken(supabase);
    if (!ready) return;
    const ids = [...selected];
    const results = await Promise.all(
      ids.map((id) => removeFavorite(supabase, user.id, id, "like")),
    );
    if (results.some((r) => !r.ok)) {
      if (typeof window !== "undefined") {
        window.alert("일부 좋아요 해제에 실패했어요. 다시 시도해 주세요.");
      }
    }
    await loadLikes();
    setSelected(new Set());
  }, [selected, user, loadLikes]);

  return (
    <main className="mx-auto min-h-[50vh] max-w-[1800px] px-4 py-10 text-zinc-100 [html[data-theme='light']_&]:text-zinc-900 sm:px-6 sm:py-12 lg:px-8">
      <header className="flex flex-col gap-4 border-b border-white/10 pb-8 [html[data-theme='light']_&]:border-zinc-200 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
          좋아요한 릴스
        </h1>
        {!showLoginGate ? (
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <label className="flex items-center gap-2 text-[13px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
              <span className="hidden font-medium text-zinc-400 sm:inline [html[data-theme='light']_&]:text-zinc-700">
                정렬
              </span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortValue)}
                className="min-w-[11.5rem] cursor-pointer rounded-lg border border-white/15 bg-reels-void/80 px-3 py-2 text-[13px] font-medium text-zinc-100 outline-none transition-colors hover:border-reels-cyan/35 focus:border-reels-cyan/50 focus:ring-2 focus:ring-reels-cyan/25 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-900"
                aria-label="좋아요한 릴스 정렬"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => void loadLikes()}
              className="rounded-lg border border-white/15 px-3 py-2 text-[13px] font-medium text-zinc-400 transition-colors hover:border-reels-cyan/35 hover:bg-white/[0.06] [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:text-zinc-700"
            >
              새로고침
            </button>
            {hydrated && entries.length > 0 ? (
              <>
                <button
                  type="button"
                  onClick={() => setSelected(new Set(allEntryIds))}
                  className="rounded-lg border border-white/15 px-3 py-2 text-[13px] font-medium text-zinc-400 transition-colors hover:border-reels-cyan/35 hover:bg-white/[0.06] [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:text-zinc-700"
                >
                  전체 선택
                </button>
                <button
                  type="button"
                  onClick={() => setSelected(new Set())}
                  disabled={selected.size === 0}
                  className="rounded-lg border border-white/15 px-3 py-2 text-[13px] font-medium text-zinc-400 transition-colors hover:border-white/25 disabled:opacity-40 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:text-zinc-700"
                >
                  선택 해제
                </button>
                <button
                  type="button"
                  onClick={() => void unlikeSelected()}
                  disabled={selected.size === 0}
                  className="rounded-lg border border-rose-500/35 px-3 py-2 text-[13px] font-medium text-rose-300 transition-colors hover:bg-rose-500/10 disabled:opacity-40 [html[data-theme='light']_&]:text-rose-800"
                >
                  선택한 좋아요 해제
                </button>
              </>
            ) : null}
          </div>
        ) : null}
      </header>

      {showLoginGate ? (
        <div className="mx-auto mt-16 max-w-md text-center">
          <p className="text-[15px] leading-relaxed text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
            로그인 후 좋아요한 릴스를 찾아볼 수 있어요.
          </p>
          <Link
            href={`/login?redirect=${encodeURIComponent("/likes")}`}
            className="mt-6 inline-flex rounded-full bg-reels-crimson px-5 py-2.5 text-[14px] font-extrabold text-white shadow-reels-crimson hover:brightness-110"
          >
            로그인
          </Link>
        </div>
      ) : !hydrated || loading ? (
        <p className="mt-10 text-[14px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600" aria-live="polite">
          불러오는 중…
        </p>
      ) : rows.length === 0 ? (
        <div className="mx-auto mt-16 max-w-md text-center">
          <p className="text-[15px] leading-relaxed text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
            아직 좋아요한 릴스가 없어요.
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
                domId={`likes-${entryId}`}
                className="min-w-0"
              />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}


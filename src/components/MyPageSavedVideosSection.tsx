"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { VideoCard } from "@/components/VideoCard";
import { resolveManualTikTokVideoForStudio } from "@/data/tiktokData";
import { buildWishlistVideoLookup } from "@/data/videoCatalog";
import type { FeedVideo } from "@/data/videos";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useWishlist } from "@/context/WishlistContext";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import {
  fetchUserFavoritesByKind,
  removeFavorite,
} from "@/lib/supabaseFavorites";
import { waitForSupabaseAccessToken } from "@/lib/waitSupabaseSessionReady";

type Pane = "wishlist" | "likes";

const W_SORT = [
  { value: "recent", label: "최근 찜한 순" },
  { value: "oldest", label: "오래된 순" },
  { value: "price-asc", label: "가격 낮은 순" },
  { value: "price-desc", label: "가격 높은 순" },
  { value: "title-asc", label: "제목 가나다순" },
  { value: "title-desc", label: "제목 역순" },
  { value: "duration-asc", label: "재생 짧은 순" },
  { value: "duration-desc", label: "재생 긴 순" },
] as const;
type WSort = (typeof W_SORT)[number]["value"];

const L_SORT = [
  { value: "recent", label: "최근 좋아요 순" },
  { value: "oldest", label: "오래된 순" },
  { value: "price-asc", label: "가격 낮은 순" },
  { value: "price-desc", label: "가격 높은 순" },
  { value: "title-asc", label: "제목 가나다순" },
  { value: "title-desc", label: "제목 역순" },
  { value: "duration-asc", label: "재생 짧은 순" },
  { value: "duration-desc", label: "재생 긴 순" },
] as const;
type LSort = (typeof L_SORT)[number]["value"];

type WRow = { entryId: string; video: FeedVideo; savedAt: number };
function sortWishlist(rows: WRow[], sort: WSort): WRow[] {
  const copy = [...rows];
  const noPrice = 1e12;
  switch (sort) {
    case "recent":
      return copy.sort((a, b) => b.savedAt - a.savedAt);
    case "oldest":
      return copy.sort((a, b) => a.savedAt - b.savedAt);
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

type LikeEntry = { id: string; likedAt: number };
type LRow = { entryId: string; video: FeedVideo; likedAt: number };
function sortLikes(rows: LRow[], sort: LSort): LRow[] {
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

const selectBtn =
  "min-w-[11.5rem] cursor-pointer rounded-lg border border-white/15 bg-reels-void/80 px-3 py-2 text-[13px] font-medium text-zinc-100 outline-none transition-colors hover:border-reels-cyan/35 focus:border-reels-cyan/50 focus:ring-2 focus:ring-reels-cyan/25 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-900";

const pillTab =
  "rounded-full px-4 py-2 text-[13px] font-bold transition border border-transparent";
const pillActive =
  "border-reels-cyan/45 bg-reels-cyan/15 text-zinc-100 [html[data-theme='light']_&]:text-zinc-900";
const pillInactive =
  "border-white/15 bg-black/20 text-zinc-400 hover:border-white/25 hover:text-zinc-200 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-700";

export function MyPageSavedVideosSection() {
  const { user, loading: authLoading, supabaseConfigured } = useAuthSession();
  const videoByStoredId = useMemo(() => buildWishlistVideoLookup(), []);
  const [pane, setPane] = useState<Pane>("wishlist");

  return (
    <div className="reels-glass-card rounded-xl p-4 sm:rounded-2xl sm:p-5 lg:p-6">
      <div className="flex flex-col gap-4 border-b border-white/10 pb-6 [html[data-theme='light']_&]:border-zinc-200 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-extrabold tracking-tight sm:text-xl">찜 · 좋아요</h2>
          <p className="mt-1 text-[12px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600 sm:text-[13px]">
            찜한 릴스와 좋아요한 동영상을 마이페이지에서 한 번에 확인해요.
          </p>
        </div>
        <div role="tablist" aria-label="목록 종류" className="flex flex-wrap gap-2">
          <button
            type="button"
            role="tab"
            aria-selected={pane === "wishlist"}
            id="saved-tab-wishlist"
            aria-controls="saved-pane-wishlist"
            className={`${pillTab} ${pane === "wishlist" ? pillActive : pillInactive}`}
            onClick={() => setPane("wishlist")}
          >
            찜 목록
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={pane === "likes"}
            id="saved-tab-likes"
            aria-controls="saved-pane-likes"
            className={`${pillTab} ${pane === "likes" ? pillActive : pillInactive}`}
            onClick={() => setPane("likes")}
          >
            좋아요한 동영상
          </button>
        </div>
      </div>

      <div className="mt-6 min-h-[120px]" id={`saved-pane-${pane}`} role="tabpanel">
        <p className="sr-only">{pane === "wishlist" ? "찜 목록 패널" : "좋아요 패널"}</p>
        {pane === "wishlist" ? (
          <WishlistPaneInner
            authLoading={authLoading}
            supabaseConfigured={supabaseConfigured}
            user={user}
            videoByStoredId={videoByStoredId}
          />
        ) : (
          <LikesPaneInner
            authLoading={authLoading}
            supabaseConfigured={supabaseConfigured}
            user={user}
            videoByStoredId={videoByStoredId}
          />
        )}
      </div>
    </div>
  );
}

function WishlistPaneInner({
  authLoading,
  supabaseConfigured,
  user,
  videoByStoredId,
}: {
  authLoading: boolean;
  supabaseConfigured: boolean;
  user: { id: string } | null | undefined;
  videoByStoredId: Map<string, FeedVideo>;
}) {
  const { entries, hydrated, clear, removeMany } = useWishlist();
  const [sort, setSort] = useState<WSort>("recent");
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  const rows = useMemo(() => {
    const list: WRow[] = [];
    for (const e of entries) {
      const fromCatalog = videoByStoredId.get(e.id);
      const video =
        fromCatalog ?? resolveManualTikTokVideoForStudio(e.id) ?? undefined;
      if (video) list.push({ entryId: e.id, video, savedAt: e.savedAt });
    }
    return sortWishlist(list, sort);
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

  const showLoginGateWishlistOnly =
    supabaseConfigured &&
    !authLoading &&
    hydrated &&
    !user &&
    entries.length === 0;

  if (!authLoading && showLoginGateWishlistOnly) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/15 p-8 text-center [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50">
        <p className="text-[14px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
          로그인하면 찜한 릴스를 여기에서 모아볼 수 있어요.
        </p>
        <Link
          href={`/login?redirect=${encodeURIComponent("/mypage?tab=saved")}`}
          className="mt-4 inline-flex rounded-full bg-reels-crimson px-5 py-2.5 text-[13px] font-extrabold text-white shadow-reels-crimson hover:brightness-110"
        >
          로그인
        </Link>
      </div>
    );
  }

  if (!hydrated) {
    return (
      <p className="text-[14px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600" aria-live="polite">
        불러오는 중…
      </p>
    );
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-[13px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
          <span className="hidden font-medium sm:inline">정렬</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as WSort)}
            className={selectBtn}
            aria-label="찜한 릴스 정렬"
          >
            {W_SORT.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        {entries.length > 0 ? (
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
              onClick={deleteSelectedWishlist}
              disabled={selected.size === 0}
              className="rounded-lg border border-rose-500/35 px-3 py-2 text-[13px] font-medium text-rose-300 transition-colors hover:bg-rose-500/10 disabled:opacity-40 [html[data-theme='light']_&]:text-rose-800"
            >
              선택 삭제
            </button>
            <button
              type="button"
              onClick={() => {
                void (async () => {
                  if (
                    typeof window !== "undefined" &&
                    window.confirm("찜한 릴스를 모두 목록에서 삭제할까요?")
                  ) {
                    await clear();
                    setSelected(new Set());
                  }
                })();
              }}
              className="rounded-lg border border-white/15 px-3 py-2 text-[13px] font-medium text-zinc-400 transition-colors hover:border-reels-crimson/35 hover:bg-white/[0.06] [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:text-zinc-700"
            >
              전체 삭제
            </button>
          </>
        ) : null}
      </div>

      {rows.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-[14px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
            아직 찜한 릴스가 없어요.
          </p>
          <Link
            href="/explore"
            className="mt-5 inline-flex rounded-full border border-reels-cyan/40 bg-reels-cyan/10 px-5 py-2.5 text-[13px] font-extrabold text-reels-cyan transition hover:bg-reels-cyan/18"
          >
            릴스 둘러보기
          </Link>
        </div>
      ) : (
        <ul className="grid list-none grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
          {rows.map(({ entryId, video }) => (
            <li key={entryId} className="relative min-w-0">
              <label className="absolute left-2 top-2 z-[20] flex cursor-pointer items-center rounded-md bg-black/55 px-1.5 py-1 backdrop-blur-sm [html[data-theme='light']_&]:bg-white/80">
                <input
                  type="checkbox"
                  checked={selected.has(entryId)}
                  onChange={() => toggleSelect(entryId)}
                  className="h-4 w-4 rounded border-white/30 accent-[#ff0055] [html[data-theme='light']_&]:border-zinc-400"
                />
                <span className="sr-only">선택</span>
              </label>
              <VideoCard
                video={video}
                domId={`mypage-wishlist-${entryId}`}
                className="min-w-0"
                compactHoverActions
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function LikesPaneInner({
  authLoading,
  supabaseConfigured,
  user,
  videoByStoredId,
}: {
  authLoading: boolean;
  supabaseConfigured: boolean;
  user: { id: string } | null | undefined;
  videoByStoredId: Map<string, FeedVideo>;
}) {
  const [entries, setEntries] = useState<LikeEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sort, setSort] = useState<LSort>("recent");
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

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
    const list: LRow[] = [];
    for (const e of entries) {
      const fromCatalog = videoByStoredId.get(e.id);
      const video =
        fromCatalog ?? resolveManualTikTokVideoForStudio(e.id) ?? undefined;
      if (video) list.push({ entryId: e.id, video, likedAt: e.likedAt });
    }
    return sortLikes(list, sort);
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
    if (results.some((r) => !r.ok) && typeof window !== "undefined") {
      window.alert("일부 좋아요 해제에 실패했어요. 다시 시도해 주세요.");
    }
    await loadLikes();
    setSelected(new Set());
  }, [selected, user, loadLikes]);

  const showLoginGate =
    supabaseConfigured && !authLoading && hydrated && !user;

  if (showLoginGate) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/15 p-8 text-center [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50">
        <p className="text-[14px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
          로그인 후 좋아요한 릴스를 여기에서 모아볼 수 있어요.
        </p>
        <Link
          href={`/login?redirect=${encodeURIComponent("/mypage?tab=saved")}`}
          className="mt-4 inline-flex rounded-full bg-reels-crimson px-5 py-2.5 text-[13px] font-extrabold text-white shadow-reels-crimson hover:brightness-110"
        >
          로그인
        </Link>
      </div>
    );
  }

  if (!hydrated || loading) {
    return (
      <p className="text-[14px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600" aria-live="polite">
        불러오는 중…
      </p>
    );
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-[13px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
          <span className="hidden font-medium sm:inline">정렬</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as LSort)}
            className={selectBtn}
            aria-label="좋아요한 릴스 정렬"
          >
            {L_SORT.map((o) => (
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
        {entries.length > 0 ? (
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

      {rows.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-[14px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
            아직 좋아요한 릴스가 없어요.
          </p>
          <Link
            href="/explore"
            className="mt-5 inline-flex rounded-full border border-reels-cyan/40 bg-reels-cyan/10 px-5 py-2.5 text-[13px] font-extrabold text-reels-cyan transition hover:bg-reels-cyan/18"
          >
            릴스 둘러보기
          </Link>
        </div>
      ) : (
        <ul className="grid list-none grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
          {rows.map(({ entryId, video }) => (
            <li key={entryId} className="relative min-w-0">
              <label className="absolute left-2 top-2 z-[20] flex cursor-pointer items-center rounded-md bg-black/55 px-1.5 py-1 backdrop-blur-sm [html[data-theme='light']_&]:bg-white/80">
                <input
                  type="checkbox"
                  checked={selected.has(entryId)}
                  onChange={() => toggleSelect(entryId)}
                  className="h-4 w-4 rounded border-white/30 accent-[#ff0055] [html[data-theme='light']_&]:border-zinc-400"
                />
                <span className="sr-only">선택</span>
              </label>
              <VideoCard
                video={video}
                domId={`mypage-likes-${entryId}`}
                className="min-w-0"
                compactHoverActions
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

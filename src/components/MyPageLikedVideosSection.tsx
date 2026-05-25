"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { VideoCard } from "@/components/VideoCard";
import { MyPageSortSelect } from "@/components/MyPageSortSelect";
import { resolveManualTikTokVideoForStudio } from "@/data/tiktokData";
import { buildWishlistVideoLookup } from "@/data/videoCatalog";
import type { FeedVideo } from "@/data/videos";
import { useAuthSession } from "@/hooks/useAuthSession";
import {
  USER_FAVORITE_LIKE_UPDATED_EVENT,
  type UserFavoriteLikeUpdatedDetail,
} from "@/hooks/useVideoLike";
import { GlobalLoading } from "@/components/GlobalLoading";
import { useTranslation } from "@/hooks/useTranslation";
import {
  feedOverlayCheckboxInputClass,
  feedOverlayCheckboxLabelClass,
} from "@/lib/brandPinkTokens";
import { canonicalFavoriteVideoId } from "@/lib/favoriteVideoId";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import {
  fetchUserFavoritesByKind,
  removeFavorite,
} from "@/lib/supabaseFavorites";
import { waitForSupabaseAccessToken } from "@/lib/waitSupabaseSessionReady";
import { MYPAGE_OUTLINE_BTN_MD, MYPAGE_OUTLINE_BTN_SM } from "@/lib/mypageOutlineCta";

type Sort = "recent" | "oldest" | "price-asc" | "price-desc";

type LikeEntry = { id: string; likedAt: number };
type Row = { entryId: string; video: FeedVideo; likedAt: number };

function sortRows(rows: Row[], sort: Sort): Row[] {
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
    default:
      return copy;
  }
}

function rowsToLikeEntries(rows: { video_id: string; created_at: string }[]): LikeEntry[] {
  return rows.map((r) => {
    const ts = Date.parse(r.created_at);
    return {
      id: r.video_id,
      likedAt: Number.isFinite(ts) ? ts : Date.now(),
    };
  });
}

const LOGIN_REDIRECT = encodeURIComponent("/mypage?tab=likes");

export function MyPageLikedVideosSection() {
  const { user, loading: authLoading, supabaseConfigured } = useAuthSession();
  const { t } = useTranslation();

  const sortOptions = useMemo(
    () =>
      [
        { value: "recent" as const, label: t("mypage.sort.recentLiked") },
        { value: "oldest" as const, label: t("mypage.sort.oldestSaved") },
        { value: "price-asc" as const, label: t("mypage.sort.priceAsc") },
        { value: "price-desc" as const, label: t("mypage.sort.priceDesc") },
      ] as const,
    [t],
  );

  const videoByStoredId = useMemo(() => buildWishlistVideoLookup(), []);

  const [entries, setEntries] = useState<LikeEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sort, setSort] = useState<Sort>("recent");
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

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<UserFavoriteLikeUpdatedDetail>;
      const d = ce.detail;
      if (!d || typeof d.videoId !== "string" || typeof d.likedByMe !== "boolean") return;
      if (!d.likedByMe) {
        setEntries((prev) =>
          prev.filter((x) => canonicalFavoriteVideoId(x.id) !== d.videoId),
        );
        setSelected((s) => {
          let changed = false;
          const n = new Set(s);
          for (const id of s) {
            if (canonicalFavoriteVideoId(id) === d.videoId) {
              n.delete(id);
              changed = true;
            }
          }
          return changed ? n : s;
        });
      } else {
        void loadLikes();
      }
    };
    window.addEventListener(USER_FAVORITE_LIKE_UPDATED_EVENT, handler as EventListener);
    return () =>
      window.removeEventListener(USER_FAVORITE_LIKE_UPDATED_EVENT, handler as EventListener);
  }, [loadLikes]);

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
      !window.confirm(t("mypage.likes.confirmUnlike", { n: selected.size }))
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
      window.alert(t("mypage.likes.unlikeFailed"));
    }
    await loadLikes();
    setSelected(new Set());
  }, [selected, user, loadLikes, t]);

  const showLoginGate = supabaseConfigured && !authLoading && hydrated && !user;

  return (
    <div className="min-h-[120px]">
      {showLoginGate ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-black/20 px-6 py-14 text-center [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:bg-white">
          <p className="text-[16px] text-white/65 [html[data-theme='light']_&]:text-zinc-600">
            {t("mypage.likes.loginHint")}
          </p>
          <Link href={`/login?redirect=${LOGIN_REDIRECT}`} className={`mt-6 ${MYPAGE_OUTLINE_BTN_SM}`}>
            {t("mypage.loginCta")}
          </Link>
        </div>
      ) : !hydrated || loading ? (
        <GlobalLoading
          size="md"
          label={t("common.loading")}
          className="py-8 text-zinc-500 [html[data-theme='light']_&]:text-zinc-600"
        />
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-[15px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
              <span className="hidden font-medium sm:inline">{t("mypage.sort.label")}</span>
              <MyPageSortSelect
                options={[...sortOptions]}
                value={sort}
                onChange={(v) => setSort(v as Sort)}
                ariaLabel={t("mypage.likes.sortAria")}
              />
            </label>
            {entries.length > 0 ? (
              <>
                <button
                  type="button"
                  onClick={() => setSelected(new Set(allEntryIds))}
                  className="rounded-lg border border-white/15 px-3 py-2 text-[15px] font-medium text-zinc-400 transition-[border-color,background-color] hover:border-white/40 hover:bg-white/[0.06] [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:text-zinc-700 [html[data-theme='light']_&]:hover:border-zinc-400"
                >
                  {t("mypage.wishlist.selectAll")}
                </button>
                <button
                  type="button"
                  onClick={() => setSelected(new Set())}
                  disabled={selected.size === 0}
                  className="rounded-lg border border-white/15 px-3 py-2 text-[15px] font-medium text-zinc-400 transition-colors hover:border-white/25 disabled:opacity-40 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:text-zinc-700"
                >
                  {t("mypage.wishlist.deselect")}
                </button>
                <button
                  type="button"
                  onClick={() => void unlikeSelected()}
                  disabled={selected.size === 0}
                  aria-label={t("mypage.likes.unlikeSelected")}
                  title={t("mypage.likes.unlikeSelected")}
                  className="relative z-10 inline-flex items-center justify-center rounded-lg border border-[color:var(--reels-point)] bg-transparent p-2 text-white shadow-none outline-none transition-[background-color] hover:bg-[color:var(--reels-point)]/14 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40 [html[data-theme='light']_&]:border-[#FF2D8D] [html[data-theme='light']_&]:hover:bg-[color:var(--reels-point)]/10"
                >
                  <Trash2 className="h-[1.125rem] w-[1.125rem] shrink-0" strokeWidth={2} aria-hidden />
                </button>
              </>
            ) : null}
          </div>

          {rows.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-[16px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
                {t("mypage.likes.empty")}
              </p>
              <Link href="/explore" className={`mt-5 inline-flex ${MYPAGE_OUTLINE_BTN_MD}`}>
                {t("mypage.wishlist.browse")}
              </Link>
            </div>
          ) : (
            <ul className="grid list-none grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
              {rows.map(({ entryId, video }) => (
                <li key={entryId} className="relative min-w-0">
                  <label className={feedOverlayCheckboxLabelClass}>
                    <input
                      type="checkbox"
                      checked={selected.has(entryId)}
                      onChange={() => toggleSelect(entryId)}
                      className={feedOverlayCheckboxInputClass}
                    />
                    <span className="sr-only">{t("mypage.selectItemAria")}</span>
                  </label>
                  <VideoCard
                    video={video}
                    domId={`mypage-likes-${entryId}`}
                    className="min-w-0"
                    compactHoverActions
                    mypageListCard
                  />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

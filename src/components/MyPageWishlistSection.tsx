"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { VideoCard } from "@/components/VideoCard";
import { MyPageSortSelect } from "@/components/MyPageSortSelect";
import { resolveManualTikTokVideoForStudio } from "@/data/tiktokData";
import { buildWishlistVideoLookup } from "@/data/videoCatalog";
import type { FeedVideo } from "@/data/videos";
import { useWishlist } from "@/context/WishlistContext";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useTranslation } from "@/hooks/useTranslation";
import {
  feedOverlayCheckboxInputClass,
  feedOverlayCheckboxLabelClass,
} from "@/lib/brandPinkTokens";
import { MYPAGE_OUTLINE_BTN_MD, MYPAGE_OUTLINE_BTN_SM } from "@/lib/mypageOutlineCta";

type Sort = "recent" | "oldest" | "price-asc" | "price-desc";

type Row = { entryId: string; video: FeedVideo; savedAt: number };

function sortRows(rows: Row[], sort: Sort): Row[] {
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
    default:
      return copy;
  }
}

const selectBtn =
  "min-w-[11.5rem] cursor-pointer rounded-lg border border-white/15 bg-reels-void/80 px-3 py-2 text-[15px] font-medium text-zinc-100 outline-none transition-[border-color,background-color] hover:border-white/45 hover:bg-white/[0.08] focus-visible:border-white/50 focus-visible:outline-none [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:hover:border-zinc-400 [html[data-theme='light']_&]:focus-visible:border-zinc-500";

const LOGIN_REDIRECT = encodeURIComponent("/mypage?tab=wishlist");

export function MyPageWishlistSection() {
  const { user, loading: authLoading, supabaseConfigured } = useAuthSession();
  const { t } = useTranslation();

  const sortOptions = useMemo(
    () =>
      [
        { value: "recent" as const, label: t("mypage.sort.recentSaved") },
        { value: "oldest" as const, label: t("mypage.sort.oldestSaved") },
        { value: "price-asc" as const, label: t("mypage.sort.priceAsc") },
        { value: "price-desc" as const, label: t("mypage.sort.priceDesc") },
      ] as const,
    [t],
  );
  const videoByStoredId = useMemo(() => buildWishlistVideoLookup(), []);
  const { entries, hydrated, removeMany } = useWishlist();
  const [sort, setSort] = useState<Sort>("recent");
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

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

  const deleteSelectedWishlist = useCallback(() => {
    if (selected.size === 0) return;
    if (
      typeof window !== "undefined" &&
      !window.confirm(t("mypage.wishlist.confirmRemoveSelected", { n: selected.size }))
    ) {
      return;
    }
    void removeMany([...selected]).then(() => setSelected(new Set()));
  }, [selected, removeMany, t]);

  const showLoginGateWishlistOnly =
    supabaseConfigured &&
    !authLoading &&
    hydrated &&
    !user &&
    entries.length === 0;

  return (
    <div className="min-h-[120px]">
        {!authLoading && showLoginGateWishlistOnly ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-black/20 px-6 py-14 text-center [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:bg-white">
            <p className="text-[16px] text-white/65 [html[data-theme='light']_&]:text-zinc-600">
              {t("mypage.wishlist.loginHint")}
            </p>
            <Link
              href={`/login?redirect=${LOGIN_REDIRECT}`}
              className={`mt-6 ${MYPAGE_OUTLINE_BTN_SM}`}
            >
              {t("mypage.loginCta")}
            </Link>
          </div>
        ) : !hydrated ? (
          <p
            className="text-[16px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600"
            aria-live="polite"
          >
            {t("common.loading")}
          </p>
        ) : (
          <>
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 text-[15px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
                <span className="hidden font-medium sm:inline">{t("mypage.sort.label")}</span>
                <MyPageSortSelect
                  options={[...sortOptions]}
                  value={sort}
                  onChange={(v) => setSort(v as Sort)}
                  ariaLabel={t("mypage.wishlist.sortAria")}
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
                    onClick={deleteSelectedWishlist}
                    disabled={selected.size === 0}
                    aria-label={t("mypage.wishlist.deleteSelected")}
                    title={t("mypage.wishlist.deleteSelected")}
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
                  {t("mypage.wishlist.empty")}
                </p>
                <Link
                  href="/explore"
                  className={`mt-5 inline-flex ${MYPAGE_OUTLINE_BTN_MD}`}
                >
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
                      domId={`mypage-wishlist-${entryId}`}
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

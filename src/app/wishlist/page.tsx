"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { VideoCard } from "@/components/VideoCard";
import { MyPageSortSelect } from "@/components/MyPageSortSelect";
import { useWishlist } from "@/context/WishlistContext";
import { resolveManualTikTokVideoForStudio } from "@/data/tiktokData";
import { buildWishlistVideoLookup } from "@/data/videoCatalog";
import type { FeedVideo } from "@/data/videos";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useTranslation } from "@/hooks/useTranslation";
import {
  feedOverlayCheckboxInputClass,
  feedOverlayCheckboxLabelClass,
} from "@/lib/brandPinkTokens";

type SortValue = "recent" | "oldest" | "price-asc" | "price-desc";

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
    default:
      return copy;
  }
}

export default function WishlistPage() {
  const { t } = useTranslation();
  const sortOptions = useMemo(
    () =>
      [
        { value: "recent" as const, label: t("mypage.sort.recentSaved") },
        { value: "oldest" as const, label: t("mypage.sort.oldestSaved") },
        { value: "price-asc" as const, label: t("mypage.sort.priceAsc") },
        { value: "price-desc" as const, label: t("mypage.sort.priceDesc") },
      ],
    [t],
  );
  const { user, loading: authLoading, supabaseConfigured } = useAuthSession();
  const { entries, hydrated, removeMany } = useWishlist();
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
      !window.confirm(t("mypage.wishlist.confirmRemoveSelected", { n: selected.size }))
    ) {
      return;
    }
    void removeMany([...selected]).then(() => setSelected(new Set()));
  }, [selected, removeMany, t]);

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
          <h1 className="text-[1.625rem] font-semibold tracking-tight text-zinc-50 sm:text-[1.875rem] [html[data-theme='light']_&]:text-zinc-900">
            {t("mypage.section.wishlist.title")}
          </h1>
        </div>

        {!showLoginGate ? (
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <label className="flex items-center gap-2 text-[15px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
              <span className="sr-only">{t("mypage.sort.label")}</span>
              <span className="hidden font-medium text-zinc-400 sm:inline [html[data-theme='light']_&]:text-zinc-700">
                {t("mypage.sort.label")}
              </span>
              <MyPageSortSelect
                options={sortOptions}
                value={sort}
                onChange={(v) => setSort(v as SortValue)}
                ariaLabel={t("mypage.wishlist.sortAria")}
              />
            </label>
            {hydrated && entries.length > 0 ? (
              <>
                <button
                  type="button"
                  onClick={selectAllWishlist}
                  className="rounded-lg border border-white/15 px-3 py-2 text-[15px] font-medium text-zinc-400 transition-[border-color,background-color] hover:border-white/40 hover:bg-white/[0.06] [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:text-zinc-700 [html[data-theme='light']_&]:hover:border-zinc-400"
                >
                  {t("mypage.wishlist.selectAll")}
                </button>
                <button
                  type="button"
                  onClick={clearWishlistSelection}
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
                  className="relative z-10 inline-flex items-center justify-center rounded-lg border border-[color:var(--reels-point)] bg-transparent p-2 text-white shadow-none outline-none transition-[background-color] hover:bg-[color:var(--reels-point)]/14 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40 [html[data-theme='light']_&]:border-[color:var(--reels-point)] [html[data-theme='light']_&]:hover:bg-[color:var(--reels-point)]/10"
                >
                  <Trash2 className="h-[1.125rem] w-[1.125rem] shrink-0" strokeWidth={2} aria-hidden />
                </button>
              </>
            ) : null}
          </div>
        ) : null}
      </header>

      {showLoginGate ? (
        <div className="mx-auto mt-16 max-w-md text-center">
          <p className="text-[17px] leading-relaxed text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
            {t("mypage.wishlist.pageLoginHint")}
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
              className="inline-flex items-center justify-center rounded-full border border-white/20 bg-[linear-gradient(135deg,#0b1327_0%,#122247_50%,#1e3a8a_100%)] px-7 py-2.5 text-[16px] font-bold text-white ring-1 ring-white/10 shadow-[0_12px_28px_-14px_rgba(30,58,138,0.82)] transition-all duration-300 hover:-translate-y-0.5 hover:border-white/30 hover:brightness-110 hover:shadow-[0_18px_38px_-16px_rgba(37,99,235,0.8)]"
            >
              {t("settings.loginCta")}
            </Link>
          </div>
        </div>
      ) : !hydrated ? (
        <p className="mt-10 text-[16px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600" aria-live="polite">
          {t("common.loading")}
        </p>
      ) : rows.length === 0 ? (
        <div className="mx-auto mt-16 max-w-md text-center">
          <p className="text-[17px] leading-relaxed text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
            {t("mypage.wishlist.empty")}
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-full bg-reels-crimson px-5 py-2.5 text-[16px] font-extrabold text-white shadow-reels-crimson hover:brightness-110"
          >
            {t("mypage.wishlist.browse")}
          </Link>
        </div>
      ) : (
        <ul className="mt-8 grid list-none grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
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
                domId={`wishlist-${entryId}`}
                className="min-w-0"
                compactHoverActions
                mypageListCard
              />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

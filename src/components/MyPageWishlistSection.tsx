"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { VideoCard } from "@/components/VideoCard";
import { MyPageSortSelect } from "@/components/MyPageSortSelect";
import { resolveManualTikTokVideoForStudio } from "@/data/tiktokData";
import { buildWishlistVideoLookup } from "@/data/videoCatalog";
import type { FeedVideo } from "@/data/videos";
import { useSitePreferences } from "@/context/SitePreferencesContext";
import { useAuthSession } from "@/hooks/useAuthSession";
import { videoDisplayTitle } from "@/lib/videoDisplayTitle";
import type { SiteLocale } from "@/lib/sitePreferences";
import { useWishlist } from "@/context/WishlistContext";
import { useTranslation } from "@/hooks/useTranslation";
import { MYPAGE_OUTLINE_BTN_MD, MYPAGE_OUTLINE_BTN_SM } from "@/lib/mypageOutlineCta";

type Sort =
  | "recent"
  | "oldest"
  | "price-asc"
  | "price-desc"
  | "title-asc"
  | "title-desc"
  | "duration-asc"
  | "duration-desc";

type Row = { entryId: string; video: FeedVideo; savedAt: number };

function sortRows(rows: Row[], sort: Sort, locale: SiteLocale): Row[] {
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
        videoDisplayTitle(a.video, locale).localeCompare(
          videoDisplayTitle(b.video, locale),
          locale === "en" ? "en" : "ko",
          { sensitivity: "base" },
        ),
      );
    case "title-desc":
      return copy.sort((a, b) =>
        videoDisplayTitle(b.video, locale).localeCompare(
          videoDisplayTitle(a.video, locale),
          locale === "en" ? "en" : "ko",
          { sensitivity: "base" },
        ),
      );
    case "duration-asc":
      return copy.sort((a, b) => (a.video.durationSec ?? 0) - (b.video.durationSec ?? 0));
    case "duration-desc":
      return copy.sort((a, b) => (b.video.durationSec ?? 0) - (a.video.durationSec ?? 0));
    default:
      return copy;
  }
}

const selectBtn =
  "min-w-[11.5rem] cursor-pointer rounded-lg border border-white/15 bg-reels-void/80 px-3 py-2 text-[15px] font-medium text-zinc-100 outline-none transition-[border-color,background-color] hover:border-white/45 hover:bg-white/[0.08] focus-visible:border-white/50 focus-visible:outline-none [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:hover:border-zinc-400 [html[data-theme='light']_&]:focus-visible:border-zinc-500";

const LOGIN_REDIRECT = encodeURIComponent("/mypage?tab=wishlist");

export function MyPageWishlistSection() {
  const { user, loading: authLoading, supabaseConfigured } = useAuthSession();
  const { locale } = useSitePreferences();
  const { t } = useTranslation();
  const loc = locale as SiteLocale;

  const sortOptions = useMemo(
    () =>
      [
        { value: "recent" as const, label: t("mypage.sort.recentSaved") },
        { value: "oldest" as const, label: t("mypage.sort.oldestSaved") },
        { value: "price-asc" as const, label: t("mypage.sort.priceAsc") },
        { value: "price-desc" as const, label: t("mypage.sort.priceDesc") },
        {
          value: "title-asc" as const,
          label: loc === "en" ? t("mypage.sort.titleAscEn") : t("mypage.sort.titleAsc"),
        },
        {
          value: "title-desc" as const,
          label: loc === "en" ? t("mypage.sort.titleDescEn") : t("mypage.sort.titleDesc"),
        },
        { value: "duration-asc" as const, label: t("mypage.sort.durationAsc") },
        { value: "duration-desc" as const, label: t("mypage.sort.durationDesc") },
      ] as const,
    [t, loc],
  );
  const videoByStoredId = useMemo(() => buildWishlistVideoLookup(), []);
  const { entries, hydrated, clear, removeMany } = useWishlist();
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
    return sortRows(list, sort, locale as SiteLocale);
  }, [entries, videoByStoredId, sort, locale]);

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
                    className="rounded-lg border border-reels-crimson/38 px-3 py-2 text-[15px] font-medium text-[#F3C4D9] transition-colors hover:bg-reels-crimson/12 disabled:opacity-40 [html[data-theme='light']_&]:text-reels-crimson"                  >
                    {t("mypage.wishlist.deleteSelected")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void (async () => {
                        if (
                          typeof window !== "undefined" &&
                          window.confirm(t("mypage.wishlist.confirmClearAll"))
                        ) {
                          await clear();
                          setSelected(new Set());
                        }
                      })();
                    }}
                    className="rounded-lg border border-white/15 px-3 py-2 text-[15px] font-medium text-zinc-400 transition-[border-color,background-color] hover:border-white/40 hover:bg-white/[0.06] [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:text-zinc-700 [html[data-theme='light']_&]:hover:border-zinc-400"
                  >
                    {t("mypage.wishlist.deleteAll")}
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
                    <label className="absolute left-2 top-2 z-[20] flex cursor-pointer items-center rounded-md bg-black/55 px-1.5 py-1 backdrop-blur-sm [html[data-theme='light']_&]:bg-white/80">
                      <input
                        type="checkbox"
                        checked={selected.has(entryId)}
                        onChange={() => toggleSelect(entryId)}
                        className="h-4 w-4 rounded border-white/30 accent-[#E42980] [html[data-theme='light']_&]:border-zinc-400"
                      />
                      <span className="sr-only">{t("mypage.selectItemAria")}</span>
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
        )}
      </div>
  );
}

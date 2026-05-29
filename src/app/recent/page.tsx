"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { VideoCard } from "@/components/VideoCard";
import { useRecentClips } from "@/context/RecentClipsContext";
import { useSitePreferences } from "@/context/SitePreferencesContext";
import { ALL_MARKET_VIDEOS } from "@/data/videoCatalog";
import type { FeedVideo } from "@/data/videos";
import { useReelsConfirm } from "@/components/ReelsConfirmProvider";
import { useTranslation } from "@/hooks/useTranslation";
import { useVideoDisplayTitle } from "@/hooks/useVideoDisplayTitle";
import { videoDisplayTitle } from "@/lib/videoDisplayTitle";
import type { SiteLocale } from "@/lib/sitePreferences";

type SortValue =
  | "recent"
  | "oldest"
  | "price-asc"
  | "price-desc"
  | "title-asc"
  | "title-desc"
  | "duration-asc"
  | "duration-desc";

type Row = { video: FeedVideo; viewedAt: number };

function compareViewedAtDesc(a: Row, b: Row): number {
  return b.viewedAt - a.viewedAt;
}

function comparePriceAsc(a: Row, b: Row): number {
  const ap = a.video.priceWon;
  const bp = b.video.priceWon;
  if (ap == null && bp == null) return compareViewedAtDesc(a, b);
  if (ap == null) return 1;
  if (bp == null) return -1;
  if (ap !== bp) return ap - bp;
  return compareViewedAtDesc(a, b);
}

function comparePriceDesc(a: Row, b: Row): number {
  const ap = a.video.priceWon;
  const bp = b.video.priceWon;
  if (ap == null && bp == null) return compareViewedAtDesc(a, b);
  if (ap == null) return 1;
  if (bp == null) return -1;
  if (ap !== bp) return bp - ap;
  return compareViewedAtDesc(a, b);
}

function compareDurationAsc(a: Row, b: Row): number {
  const ad = a.video.durationSec;
  const bd = b.video.durationSec;
  if (ad == null && bd == null) return compareViewedAtDesc(a, b);
  if (ad == null) return 1;
  if (bd == null) return -1;
  if (ad !== bd) return ad - bd;
  return compareViewedAtDesc(a, b);
}

function compareDurationDesc(a: Row, b: Row): number {
  const ad = a.video.durationSec;
  const bd = b.video.durationSec;
  if (ad == null && bd == null) return compareViewedAtDesc(a, b);
  if (ad == null) return 1;
  if (bd == null) return -1;
  if (ad !== bd) return bd - ad;
  return compareViewedAtDesc(a, b);
}

function sortRows(rows: Row[], sort: SortValue, locale: SiteLocale): Row[] {
  const copy = [...rows];
  switch (sort) {
    case "recent":
      return copy.sort((a, b) => b.viewedAt - a.viewedAt);
    case "oldest":
      return copy.sort((a, b) => a.viewedAt - b.viewedAt);
    case "price-asc":
      return copy.sort(comparePriceAsc);
    case "price-desc":
      return copy.sort(comparePriceDesc);
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
      return copy.sort(compareDurationAsc);
    case "duration-desc":
      return copy.sort(compareDurationDesc);
    default:
      return copy;
  }
}

export default function RecentPage() {
  const { t } = useTranslation();
  const reelsConfirm = useReelsConfirm();
  const { entries, hydrated, clear, remove } = useRecentClips();
  const { locale } = useSitePreferences();
  const sortOptions = useMemo(
    () => [
      { value: "recent" as const, label: t("mypage.sort.recentViewed") },
      { value: "oldest" as const, label: t("mypage.sort.oldestSaved") },
      { value: "price-asc" as const, label: t("mypage.sort.priceAsc") },
      { value: "price-desc" as const, label: t("mypage.sort.priceDesc") },
      {
        value: "title-asc" as const,
        label:
          locale === "en"
            ? t("mypage.sort.titleAscEn")
            : t("mypage.sort.titleAsc"),
      },
      {
        value: "title-desc" as const,
        label:
          locale === "en"
            ? t("mypage.sort.titleDescEn")
            : t("mypage.sort.titleDesc"),
      },
      { value: "duration-asc" as const, label: t("mypage.sort.durationAsc") },
      { value: "duration-desc" as const, label: t("mypage.sort.durationDesc") },
    ],
    [t, locale],
  );
  const displayTitle = useVideoDisplayTitle();
  const [sort, setSort] = useState<SortValue>("recent");
  const [browseCtaVisible, setBrowseCtaVisible] = useState(false);

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
    return sortRows(list, sort, locale as SiteLocale);
  }, [entries, catalogById, sort, locale]);

  const showEmptyGate = hydrated && rows.length === 0;

  useEffect(() => {
    if (!showEmptyGate) {
      setBrowseCtaVisible(false);
      return;
    }
    const raf = window.requestAnimationFrame(() => {
      setBrowseCtaVisible(true);
    });
    return () => window.cancelAnimationFrame(raf);
  }, [showEmptyGate]);

  const onClearAll = useCallback(async () => {
    const ok = await reelsConfirm({
      message: t("mypage.recent.clearConfirm"),
      confirmLabel: t("common.confirm"),
      dialogAriaLabel: t("common.confirmDialogAria"),
    });
    if (ok) clear();
  }, [clear, reelsConfirm, t]);

  return (
    <main className="mx-auto min-h-[50vh] max-w-[1800px] px-4 py-10 text-zinc-100 [html[data-theme='light']_&]:text-zinc-900 sm:px-6 sm:py-12 lg:px-8">
      <header className="flex flex-col gap-4 border-b border-white/10 pb-8 [html[data-theme='light']_&]:border-zinc-200 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
            {t("mypage.section.recent.title")}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <label className="flex items-center gap-2 text-[13px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
            <span className="sr-only">{t("mypage.recent.sortSr")}</span>
            <span className="hidden font-medium text-zinc-400 sm:inline [html[data-theme='light']_&]:text-zinc-700">
              {t("mypage.sort.label")}
            </span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortValue)}
              className="min-w-[11.5rem] cursor-pointer rounded-lg border border-white/15 bg-reels-void/80 px-3 py-2 text-[13px] font-medium text-zinc-100 outline-none transition-colors hover:border-reels-cyan/35 focus:border-reels-cyan/50 focus:ring-2 focus:ring-reels-cyan/25 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-900"
              aria-label={t("mypage.recent.sortAria")}
            >
              {sortOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          {hydrated && entries.length > 0 ? (
            <button
              type="button"
              onClick={() => void onClearAll()}
              className="rounded-lg border border-white/15 px-3 py-2 text-[13px] font-medium text-zinc-400 transition-colors hover:border-reels-crimson/35 hover:bg-white/[0.06] hover:text-zinc-100 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:text-zinc-700 [html[data-theme='light']_&]:hover:bg-zinc-100 [html[data-theme='light']_&]:hover:text-zinc-900"
            >
              {t("mypage.recent.clearAll")}
            </button>
          ) : null}
        </div>
      </header>

      {!hydrated ? (
        <p className="mt-10 text-[14px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600" aria-live="polite">
          {t("common.loading")}
        </p>
      ) : rows.length === 0 ? (
        <div className="mx-auto mt-16 max-w-md text-center">
          <p className="mt-2 text-[14px] leading-relaxed text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
            {t("mypage.recent.emptyHint")}
          </p>
          <div
            className={`mt-6 transition-[opacity,transform] duration-300 ease-out ${
              browseCtaVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-1.5 opacity-0"
            }`}
          >
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full border border-white/20 bg-[linear-gradient(135deg,#0b1327_0%,#122247_50%,#1e3a8a_100%)] px-7 py-2.5 text-[14px] font-bold text-white ring-1 ring-white/10 shadow-[0_12px_28px_-14px_rgba(30,58,138,0.82)] transition-all duration-300 hover:-translate-y-0.5 hover:border-white/30 hover:brightness-110 hover:shadow-[0_18px_38px_-16px_rgba(37,99,235,0.8)]"
            >
              {t("mypage.wishlist.browse")}
            </Link>
          </div>
        </div>
      ) : (
        <ul className="mt-8 grid list-none grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {rows.map(({ video }) => (
            <li key={video.id} className="relative min-w-0">
              <button
                type="button"
                onClick={() => remove(video.id)}
                className="absolute right-2 top-2 z-[25] flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-reels-void/90 text-zinc-300 shadow-md backdrop-blur-md transition-colors hover:border-reels-crimson/40 hover:bg-white/10 hover:text-white [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-800 [html[data-theme='light']_&]:hover:bg-zinc-100"
                aria-label={t("mypage.recent.removeAria", {
                  title: displayTitle(video),
                })}
              >
                <X className="h-4 w-4" strokeWidth={2.2} aria-hidden />
              </button>
              <VideoCard
                video={video}
                domId={`recent-${video.id}`}
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

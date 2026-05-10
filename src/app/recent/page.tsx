"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { VideoCard } from "@/components/VideoCard";
import { useRecentClips } from "@/context/RecentClipsContext";
import { useSitePreferences } from "@/context/SitePreferencesContext";
import { ALL_MARKET_VIDEOS } from "@/data/videoCatalog";
import type { FeedVideo } from "@/data/videos";
import { useVideoDisplayTitle } from "@/hooks/useVideoDisplayTitle";
import { videoDisplayTitle } from "@/lib/videoDisplayTitle";
import type { SiteLocale } from "@/lib/sitePreferences";

const SORT_OPTIONS = [
  { value: "recent", label: "최근 본 순" },
  { value: "oldest", label: "오래된 순" },
  { value: "price-asc", label: "가격 낮은 순" },
  { value: "price-desc", label: "가격 높은 순" },
  { value: "title-asc", label: "제목 가나다 순" },
  { value: "title-desc", label: "제목 역순" },
  { value: "duration-asc", label: "짧은 영상 먼저" },
  { value: "duration-desc", label: "긴 영상 먼저" },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]["value"];

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
  const { entries, hydrated, clear, remove } = useRecentClips();
  const { locale } = useSitePreferences();
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

  return (
    <main className="mx-auto min-h-[50vh] max-w-[1800px] px-4 py-10 text-zinc-100 [html[data-theme='light']_&]:text-zinc-900 sm:px-6 sm:py-12 lg:px-8">
      <header className="flex flex-col gap-4 border-b border-white/10 pb-8 [html[data-theme='light']_&]:border-zinc-200 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
            최근 본 동영상
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <label className="flex items-center gap-2 text-[13px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
            <span className="sr-only">정렬 순서</span>
            <span className="hidden font-medium text-zinc-400 sm:inline [html[data-theme='light']_&]:text-zinc-700">
              정렬
            </span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortValue)}
              className="min-w-[11.5rem] cursor-pointer rounded-lg border border-white/15 bg-reels-void/80 px-3 py-2 text-[13px] font-medium text-zinc-100 outline-none transition-colors hover:border-reels-cyan/35 focus:border-reels-cyan/50 focus:ring-2 focus:ring-reels-cyan/25 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-900"
              aria-label="최근 본 동영상 정렬"
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
                  window.confirm("이 기기에서 최근 본 기록을 모두 지울까요?")
                ) {
                  clear();
                }
              }}
              className="rounded-lg border border-white/15 px-3 py-2 text-[13px] font-medium text-zinc-400 transition-colors hover:border-reels-crimson/35 hover:bg-white/[0.06] hover:text-zinc-100 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:text-zinc-700 [html[data-theme='light']_&]:hover:bg-zinc-100 [html[data-theme='light']_&]:hover:text-zinc-900"
            >
              모두 지우기
            </button>
          ) : null}
        </div>
      </header>

      {!hydrated ? (
        <p className="mt-10 text-[14px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600" aria-live="polite">
          불러오는 중…
        </p>
      ) : rows.length === 0 ? (
        <div className="mx-auto mt-16 max-w-md text-center">
          <p className="mt-2 text-[14px] leading-relaxed text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
            로그인 후 최근 본 동영상을 찾아볼 수 있어요.
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
              동영상 둘러보기
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
                aria-label={`${displayTitle(video)} — 최근 본 목록에서 제거`}
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

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
import { MYPAGE_OUTLINE_BTN_MD, MYPAGE_OUTLINE_BTN_SM } from "@/lib/mypageOutlineCta";

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
type Sort = (typeof SORT_OPTIONS)[number]["value"];

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
  "min-w-[11.5rem] cursor-pointer rounded-lg border border-white/15 bg-reels-void/80 px-3 py-2 text-[13px] font-medium text-zinc-100 outline-none transition-[border-color,background-color] hover:border-white/45 hover:bg-white/[0.08] focus-visible:border-white/50 focus-visible:outline-none [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:hover:border-zinc-400 [html[data-theme='light']_&]:focus-visible:border-zinc-500";

const LOGIN_REDIRECT = encodeURIComponent("/mypage?tab=wishlist");

export function MyPageWishlistSection() {
  const { user, loading: authLoading, supabaseConfigured } = useAuthSession();
  const { locale } = useSitePreferences();
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

  return (
    <div className="min-h-[120px]">
        {!authLoading && showLoginGateWishlistOnly ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-black/20 px-6 py-14 text-center [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:bg-white">
            <p className="text-[14px] text-white/65 [html[data-theme='light']_&]:text-zinc-600">
              로그인하면 찜한 동영상을 여기에서 모아볼 수 있어요.
            </p>
            <Link
              href={`/login?redirect=${LOGIN_REDIRECT}`}
              className={`mt-6 ${MYPAGE_OUTLINE_BTN_SM}`}
            >
              로그인
            </Link>
          </div>
        ) : !hydrated ? (
          <p
            className="text-[14px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600"
            aria-live="polite"
          >
            불러오는 중…
          </p>
        ) : (
          <>
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 text-[13px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
                <span className="hidden font-medium sm:inline">정렬</span>
                <MyPageSortSelect
                  options={SORT_OPTIONS}
                  value={sort}
                  onChange={(v) => setSort(v as Sort)}
                  ariaLabel="찜한 동영상 정렬"
                />
              </label>
              {entries.length > 0 ? (
                <>
                  <button
                    type="button"
                    onClick={() => setSelected(new Set(allEntryIds))}
                    className="rounded-lg border border-white/15 px-3 py-2 text-[13px] font-medium text-zinc-400 transition-[border-color,background-color] hover:border-white/40 hover:bg-white/[0.06] [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:text-zinc-700 [html[data-theme='light']_&]:hover:border-zinc-400"
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
                    className="rounded-lg border border-reels-crimson/38 px-3 py-2 text-[13px] font-medium text-[#F3C4D9] transition-colors hover:bg-reels-crimson/12 disabled:opacity-40 [html[data-theme='light']_&]:text-reels-crimson"                  >
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

            {rows.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-[14px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
                  아직 찜한 동영상이 없어요.
                </p>
                <Link
                  href="/explore"
                  className={`mt-5 inline-flex ${MYPAGE_OUTLINE_BTN_MD}`}
                >
                  동영상 둘러보기
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
        )}
      </div>
  );
}

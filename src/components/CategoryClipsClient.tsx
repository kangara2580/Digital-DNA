"use client";

import { useMemo, useState } from "react";
import { VideoCard } from "@/components/VideoCard";
import type { CategorySlug } from "@/data/videoCatalog";
import {
  CATEGORY_LABEL,
  getVideosForCategory,
  priceGridSpan12,
  sortVideosByNewest,
  sortVideosByPrice,
} from "@/data/videoCatalog";
import {
  type EditionFilter,
  getCommerceMeta,
  isMicroDna,
  matchesEditionFilter,
} from "@/data/videoCommerce";

type SortMode = "price" | "newest";

function minCellHeight(span: number): string {
  if (span <= 2) return "min-h-[132px]";
  if (span <= 3) return "min-h-[158px]";
  if (span <= 4) return "min-h-[188px]";
  if (span <= 6) return "min-h-[220px]";
  return "min-h-[260px]";
}

const EDITION_PILLS: { id: EditionFilter; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "limited", label: "한정판 전용" },
  { id: "open", label: "무제한 조각" },
];

export function CategoryClipsClient({ slug }: { slug: CategorySlug }) {
  const label = CATEGORY_LABEL[slug];
  const base = useMemo(() => getVideosForCategory(slug), [slug]);
  const [sort, setSort] = useState<SortMode>("price");
  const [priceAsc, setPriceAsc] = useState(true);
  const [editionFilter, setEditionFilter] = useState<EditionFilter>("all");

  const filtered = useMemo(
    () =>
      base.filter((v) =>
        matchesEditionFilter(getCommerceMeta(v.id).edition, editionFilter),
      ),
    [base, editionFilter],
  );

  const sorted = useMemo(() => {
    if (sort === "newest") return sortVideosByNewest(filtered);
    return sortVideosByPrice(filtered, priceAsc);
  }, [filtered, sort, priceAsc]);

  const pillClass = (active: boolean) =>
    `rounded-md px-2.5 py-1.5 font-mono text-[11px] transition-colors ${
      active ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
    }`;

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto flex max-w-[1800px]">
        <aside className="hidden w-[168px] shrink-0 border-r border-[#e5e7eb] [border-right-width:0.5px] md:block lg:w-[188px]">
          <div className="sticky top-[var(--header-height,220px)] space-y-1 px-4 py-8">
            <p className="mb-3 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">
              정렬
            </p>
            <button
              type="button"
              onClick={() => {
                setSort("price");
                setPriceAsc((a) => !a);
              }}
              className={`flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left font-mono text-[11px] transition-colors ${
                sort === "price"
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              <span>가격순</span>
              {sort === "price" ? (
                <span className="text-[10px] text-slate-500">{priceAsc ? "↑" : "↓"}</span>
              ) : null}
            </button>
            <button
              type="button"
              onClick={() => setSort("newest")}
              className={`w-full rounded-md px-2.5 py-2 text-left font-mono text-[11px] transition-colors ${
                sort === "newest"
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              최신순
            </button>

            <p className="mb-3 mt-8 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">
              판매 방식
            </p>
            {EDITION_PILLS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setEditionFilter(p.id)}
                className={`w-full rounded-md px-2.5 py-2 text-left font-mono text-[11px] transition-colors ${
                  editionFilter === p.id
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="border-b border-[#e5e7eb] [border-bottom-width:0.5px] px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
                  {label}
                </h1>
                <p className="mt-2 font-mono text-[11px] leading-none text-slate-500 sm:text-[12px]">
                  등록된 조각 {sorted.length}개
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1 md:hidden">
                <button
                  type="button"
                  onClick={() => {
                    setSort("price");
                    setPriceAsc((a) => !a);
                  }}
                  className={`rounded-md px-3 py-1.5 font-mono text-[11px] ${
                    sort === "price" ? "bg-slate-200 text-slate-900" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  가격순{sort === "price" ? (priceAsc ? " ↑" : " ↓") : ""}
                </button>
                <button
                  type="button"
                  onClick={() => setSort("newest")}
                  className={`rounded-md px-3 py-1.5 font-mono text-[11px] ${
                    sort === "newest" ? "bg-slate-200 text-slate-900" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  최신순
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5 border-t border-[#f1f5f9] pt-4 [border-top-width:0.5px] md:hidden">
              <span className="mr-1 self-center font-mono text-[10px] text-slate-400">판매</span>
              {EDITION_PILLS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setEditionFilter(p.id)}
                  className={pillClass(editionFilter === p.id)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </header>

          {sorted.length === 0 ? (
            <p className="px-4 py-16 text-center font-mono text-[12px] text-slate-500 sm:px-6">
              이 조건에 맞는 조각이 없어요.
            </p>
          ) : (
            <div
              className="grid grid-cols-12 gap-0 border border-[#e5e7eb] [border-width:0.5px]"
              style={{ gridAutoFlow: "dense" as const }}
            >
              {sorted.map((video) => {
                const micro = isMicroDna(video);
                const span = micro ? 2 : priceGridSpan12(video.priceWon);
                const dense = micro || span <= 3;
                const minH = micro ? "min-h-[96px] sm:min-h-[104px]" : minCellHeight(span);
                return (
                  <div
                    key={video.id}
                    className={`flex min-h-0 flex-col border-b border-r border-[#e5e7eb] [border-bottom-width:0.5px] [border-right-width:0.5px] ${minH}`}
                    style={{ gridColumn: `span ${span} / span ${span}` }}
                  >
                    <VideoCard
                      video={video}
                      flush
                      dense={dense}
                      instantPreview={false}
                      domId={`clip-${video.id}`}
                      className="h-full min-h-0 w-full flex-1"
                    />
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

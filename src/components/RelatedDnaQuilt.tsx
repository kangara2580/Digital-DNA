"use client";

import Link from "next/link";
import type { FeedVideo } from "@/data/videos";
import { getRelatedByVibe, vibeSummaryLabel } from "@/data/videoCatalog";

type Props = {
  video: FeedVideo;
  className?: string;
};

/** 같은 Vibe를 공유하는 조각을 퀼트처럼 엮어 표시 */
export function RelatedDnaQuilt({ video, className }: Props) {
  const related = getRelatedByVibe(video.id, 4);
  if (related.length === 0) return null;

  const label = vibeSummaryLabel(video.id);
  const [hero, ...rest] = related;
  const small = rest.slice(0, 3);

  return (
    <div
      className={`border-t border-[#e5e7eb] bg-white [border-top-width:0.5px] ${className ?? ""}`}
    >
      <div className="flex items-center justify-between gap-2 px-2 py-1.5 sm:px-2.5 sm:py-2">
        <p className="min-w-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
          연관 DNA
        </p>
        {label ? (
          <p className="truncate text-[10px] font-medium text-slate-600">{label}</p>
        ) : null}
      </div>
      <div className="flex gap-1 px-2 pb-2 sm:gap-1.5 sm:px-2.5">
        <Link
          href={`/video/${hero.id}`}
          className="group relative w-[44%] max-w-[120px] shrink-0 overflow-hidden rounded-lg border border-slate-200/90 bg-slate-50 shadow-sm ring-1 ring-slate-900/[0.04] transition-[transform,box-shadow] hover:-rotate-1 hover:shadow-md sm:w-[42%] sm:max-w-[140px]"
        >
          <div className="aspect-[4/5] w-full sm:aspect-[3/4]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={hero.poster}
              alt=""
              className="h-full w-full object-cover opacity-95 transition-opacity group-hover:opacity-100"
            />
          </div>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-1.5 pb-1.5 pt-6">
            <p className="line-clamp-2 text-[10px] font-medium leading-tight text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.55)]">
              {hero.title}
            </p>
            {hero.priceWon != null ? (
              <p className="mt-0.5 text-[10px] font-bold tabular-nums text-white">
                {hero.priceWon.toLocaleString("ko-KR")}원
              </p>
            ) : null}
          </div>
        </Link>
        <div className="grid min-h-0 flex-1 grid-cols-2 gap-1 sm:gap-1.5">
          {small.map((v, idx) => (
            <Link
              key={`rel-${video.id}-${v.id}`}
              href={`/video/${v.id}`}
              className={`group relative block min-h-0 overflow-hidden rounded-md border border-slate-200/90 bg-slate-50 shadow-sm transition-[transform,box-shadow] hover:shadow-md ${
                idx === 1 ? "translate-y-0.5 rotate-[1.5deg]" : "-rotate-1"
              }`}
            >
              <div className="aspect-square w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={v.poster}
                  alt=""
                  className="h-full w-full object-cover opacity-95 group-hover:opacity-100"
                />
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent px-1 pb-1 pt-4">
                <p className="line-clamp-2 text-[9px] font-medium leading-tight text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]">
                  {v.title}
                </p>
                {v.priceWon != null ? (
                  <p className="text-[9px] font-bold tabular-nums text-white/95">
                    {v.priceWon.toLocaleString("ko-KR")}원
                  </p>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import { VideoCard } from "@/components/VideoCard";
import { getShopRecommendations } from "@/data/videoCatalog";
import type { FeedVideo } from "@/data/videos";

type Props = {
  video: FeedVideo;
};

const STRIP = 8;
const INITIAL_GRID = 12;
const STEP = 12;

/** 글로벌 이커머스 흔한 패턴: 상단 가로 스트립 + 아래 그리드(중복 없음) + 더보기 */
export function VideoDetailRecommendations({ video }: Props) {
  const pool = useMemo(() => getShopRecommendations(video.id, 48), [video.id]);
  const [gridVisible, setGridVisible] = useState(INITIAL_GRID);

  const strip = pool.slice(0, STRIP);
  const afterStrip = pool.slice(STRIP);
  const grid = afterStrip.slice(0, gridVisible);

  if (pool.length === 0) return null;

  return (
    <section
      className="border-t border-white/10 pt-10 [html[data-theme='light']_&]:border-zinc-200"
      aria-labelledby="video-reco-heading"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2
            id="video-reco-heading"
            className="text-xl font-extrabold tracking-tight text-zinc-100 [html[data-theme='light']_&]:text-zinc-900"
          >
            You may also like
          </h2>
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
          {pool.length} picks
        </p>
      </div>

      <div
        className="feed-scroll -mx-4 mt-6 flex gap-3 overflow-x-auto px-4 pb-2 sm:-mx-0 sm:px-0"
        role="region"
        aria-label="추천 영상 가로 목록"
        tabIndex={0}
      >
        {strip.map((v) => (
          <div key={`strip-${video.id}-${v.id}`} className="w-[42vw] max-w-[200px] shrink-0 sm:w-[180px]">
            <VideoCard video={v} reelLayout disableHoverScale className="min-w-0" />
          </div>
        ))}
      </div>

      {afterStrip.length > 0 ? (
        <>
          <h3 className="mt-8 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
            More clips to shop
          </h3>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {grid.map((v) => (
              <VideoCard
                key={`grid-${video.id}-${v.id}`}
                video={v}
                reelLayout
                dense
                disableHoverScale
                className="min-w-0"
              />
            ))}
          </div>
        </>
      ) : null}

      {gridVisible < afterStrip.length ? (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => setGridVisible((n) => Math.min(n + STEP, afterStrip.length))}
            aria-label="추천 영상 더 보기"
            title="추천 영상 더 보기"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-reels-cyan/40 bg-reels-cyan/10 text-reels-cyan shadow-[0_0_20px_-6px_rgba(0,242,234,0.45)] transition hover:border-reels-cyan/60 hover:bg-reels-cyan/18 hover:shadow-[0_0_28px_-4px_rgba(0,242,234,0.55)] active:scale-[0.97] [html[data-theme='light']_&]:border-reels-cyan/45 [html[data-theme='light']_&]:bg-reels-cyan/12 [html[data-theme='light']_&]:text-reels-cyan"
          >
            <ChevronDown className="h-5 w-5" strokeWidth={2.25} aria-hidden />
          </button>
        </div>
      ) : null}
    </section>
  );
}

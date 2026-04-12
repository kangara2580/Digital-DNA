"use client";

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
          <p className="mt-1 text-[13px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
            비슷한 무드와 카테고리 조각을 이어서 둘러보세요. 쇼핑을 끊기지 않게 골라 담았어요.
          </p>
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
        <button
          type="button"
          onClick={() => setGridVisible((n) => Math.min(n + STEP, afterStrip.length))}
          className="mt-6 w-full rounded-xl border border-white/15 bg-white/[0.04] py-3 text-[14px] font-bold text-zinc-200 transition hover:border-reels-cyan/40 hover:bg-reels-cyan/10 hover:text-reels-cyan [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-900"
        >
          Load more recommendations
        </button>
      ) : null}
    </section>
  );
}

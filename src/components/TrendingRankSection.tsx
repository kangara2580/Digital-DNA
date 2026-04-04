"use client";

import { TRENDING_RANK_CLIPS } from "@/data/videos";
import { VideoCard } from "./VideoCard";

export function TrendingRankSection() {
  return (
    <section className="bg-[#FFFFFF]" aria-labelledby="trending-rank-heading">
      <div className="mx-auto max-w-[1800px] px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-14 lg:px-8">
        <div className="text-left">
          <h2
            id="trending-rank-heading"
            className="text-[22px] font-bold leading-snug tracking-tight text-[#0f172a] sm:text-[26px] md:text-[28px]"
          >
            실시간 인기순위 영상
          </h2>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-slate-600 sm:text-[16px]">
            지금 거래·조회가 가장 빠르게 오르는 클립이에요. 비급도 팔지만,
            퀄리티와 트렌드는 여기서 먼저 만나 보세요.
          </p>
        </div>

        <div className="mt-4 overflow-hidden rounded-lg border border-slate-200/90 bg-white shadow-sm sm:mt-5">
          <div className="grid grid-cols-2 divide-x divide-slate-200 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {TRENDING_RANK_CLIPS.map((video, index) => (
              <div key={`trend-${video.id}`} className="relative min-w-0">
                <span
                  className="absolute left-2 top-2 z-[3] flex h-7 min-w-[1.75rem] items-center justify-center rounded-md bg-black/80 px-1.5 text-[12px] font-bold tabular-nums text-white ring-1 ring-white/20 sm:left-2.5 sm:top-2.5 sm:h-8 sm:min-w-8 sm:text-[13px]"
                  aria-label={`${index + 1}위`}
                >
                  {index + 1}
                </span>
                <VideoCard video={video} flush className="min-w-0 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

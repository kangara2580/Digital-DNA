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
            공식보다 앞서가는 날 것의 바이브. 지금 가장 ‘폼’ 미친 클립들만 모았어요.
          </p>
        </div>

        <div className="mt-4 overflow-hidden rounded-lg border border-slate-200/90 bg-white shadow-sm sm:mt-5">
          <div className="grid grid-cols-2 divide-x divide-slate-200 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {TRENDING_RANK_CLIPS.map((video, index) => (
              <div key={`trend-${video.id}`} className="relative min-w-0">
                <span
                  className="absolute left-2 top-2 z-[3] flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-black/52 px-1.5 text-[11px] font-bold tabular-nums text-white ring-1 ring-white/15 backdrop-blur-[3px] sm:left-2.5 sm:top-2.5 sm:h-7 sm:min-w-[1.75rem] sm:text-[12px]"
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

"use client";

import { FAILURE_OOPS_CLIPS } from "@/data/videos";
import { VideoCard } from "./VideoCard";

const FAILURE_HASHTAGS = [
  "#실패",
  "#실수",
  "#NG컷",
  "#망한영상",
  "#인생은실전",
  "#0점짜리하루",
  "#B급감성",
] as const;

export function FailureOopsSection() {
  return (
    <section
      className="border-t border-slate-200/90 bg-[#FFFFFF]"
      aria-labelledby="failure-oops-heading"
    >
      <div className="mx-auto max-w-[1800px] px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-14 lg:px-8">
        <div className="text-left">
          <h2
            id="failure-oops-heading"
            className="text-[22px] font-bold leading-snug tracking-tight text-[#0f172a] sm:text-[26px] md:text-[28px]"
          >
            누군가의 실패와 실수
          </h2>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-slate-600 sm:text-[16px]">
            오히려 좋아, 0.1%의 완벽함보다 99.9%의 리얼함
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5 sm:mt-3.5 sm:gap-2">
            {FAILURE_HASHTAGS.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[13px] font-semibold tracking-tight text-slate-800 sm:px-3.5 sm:py-1.5 sm:text-[14px]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-lg border border-slate-200/90 bg-white shadow-sm sm:mt-5">
          <div className="grid grid-cols-2 divide-x divide-slate-200 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {FAILURE_OOPS_CLIPS.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                flush
                className="min-w-0 w-full"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

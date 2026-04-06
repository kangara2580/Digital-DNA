"use client";

import { FAILURE_OOPS_CLIPS } from "@/data/videos";
import { OopsPlayIcon } from "./icons/SectionPlayIcons";
import { SectionMoreLink } from "./SectionMoreLink";
import { VideoCard } from "./VideoCard";

const REELS_HOME_GRID =
  "grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4";

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
      className="border-t border-white/10 bg-transparent"
      aria-labelledby="failure-oops-heading"
    >
      <div className="mx-auto max-w-[1800px] px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-14 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="min-w-0 text-left">
            <h2
              id="failure-oops-heading"
              className="flex items-center gap-2.5 text-[22px] font-extrabold leading-snug tracking-tight text-zinc-100 sm:gap-3 sm:text-[26px] md:text-[28px]"
            >
              <OopsPlayIcon className="h-7 w-7 shrink-0 text-reels-cyan sm:h-8 sm:w-8" />
              누군가의 실패와 실수
            </h2>
            <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-zinc-500 sm:text-[16px]">
              오히려 좋아, 0.1%의 완벽함보다 99.9%의 리얼함
            </p>
          </div>
          <SectionMoreLink
            category="comedy"
            className="shrink-0 self-stretch sm:self-center"
          />
        </div>
        <div className="mt-3 text-left sm:mt-3">
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {FAILURE_HASHTAGS.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full border border-dashed border-reels-cyan/35 bg-white/[0.04] px-3 py-1 text-[13px] font-bold tracking-tight text-zinc-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:px-3.5 sm:py-1.5 sm:text-[14px]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className={`mt-4 sm:mt-5 ${REELS_HOME_GRID}`}>
          {FAILURE_OOPS_CLIPS.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              reelLayout
              className="min-w-0"
            />
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import type { FeedVideo } from "@/data/videos";
import { SAMPLE_VIDEOS, shuffleVideos } from "@/data/videos";
import { isMicroDna } from "@/data/videoCommerce";
import { RecommendMagnetIcon } from "./icons/RecommendMagnetIcon";
import { SectionMoreLink } from "./SectionMoreLink";
import { VideoCard } from "./VideoCard";

function isRecommendFeedClip(v: FeedVideo): boolean {
  if (v.id.startsWith("dna-")) return false;
  if (isMicroDna(v)) return false;
  return true;
}

/** 릴스 마켓플레이스형 — 세로(포트레이트)만 다열 그리드 */
const REELS_GRID =
  "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6";

export function VideoFeed() {
  const portraitBase = useMemo(
    () =>
      SAMPLE_VIDEOS.filter(
        (v) =>
          v.orientation === "portrait" && isRecommendFeedClip(v),
      ),
    [],
  );

  const [clips, setClips] = useState(portraitBase);

  useEffect(() => {
    setClips(shuffleVideos([...portraitBase]));
  }, [portraitBase]);

  return (
    <section
      className="w-full border-t border-white/10 bg-transparent"
      aria-labelledby="recommended-feed-heading"
    >
      <div className="mx-auto max-w-[1800px] px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-14 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="min-w-0 text-left">
            <h2
              id="recommended-feed-heading"
              className="flex items-center gap-2.5 text-[22px] font-extrabold leading-snug tracking-tight text-zinc-100 sm:gap-3 sm:text-[26px] md:text-[28px]"
            >
              <RecommendMagnetIcon className="h-7 w-7 shrink-0 sm:h-8 sm:w-8" />
              추천 영상
            </h2>
            <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-zinc-500 sm:text-[16px]">
              왠지 자꾸 보게 되는 영상
            </p>
          </div>
          <SectionMoreLink
            category="recommend"
            className="shrink-0 self-stretch sm:self-center"
          />
        </div>

        <div className={`mt-4 sm:mt-5 ${REELS_GRID}`}>
          {clips.map((video) => (
            <VideoCard
              key={`feed-p-${video.id}`}
              video={video}
              domId={`clip-${video.id}`}
              className="min-w-0"
            />
          ))}
        </div>
      </div>
    </section>
  );
}

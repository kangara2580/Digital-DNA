"use client";

import { useEffect, useMemo, useState } from "react";
import type { FeedVideo } from "@/data/videos";
import { SAMPLE_VIDEOS, shuffleVideos } from "@/data/videos";
import { isMicroDna } from "@/data/videoCommerce";
import { RecommendMagnetIcon } from "./icons/RecommendMagnetIcon";
import { SectionMoreLink } from "./SectionMoreLink";
import { VideoCard } from "./VideoCard";

function FeedRows({
  portrait,
  landscape,
  keyPrefix,
}: {
  portrait: FeedVideo[];
  landscape: FeedVideo[];
  keyPrefix: string;
}) {
  const portraitFive = portrait.slice(0, 5);

  return (
    <div className="min-w-0 flex-1 divide-y divide-slate-200">
      <div className="grid grid-cols-2 gap-0 divide-x divide-slate-200 sm:grid-cols-3 md:grid-cols-5">
        {portraitFive.map((video) => (
          <VideoCard
            key={`${keyPrefix}-p-${video.id}`}
            video={video}
            flush
            domId={`clip-${video.id}`}
            className="min-w-0 w-full"
          />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-0 divide-x divide-slate-200 sm:grid-cols-2 md:grid-cols-3">
        {landscape.map((video) => (
          <VideoCard
            key={`${keyPrefix}-l-${video.id}`}
            video={video}
            flush
            domId={`clip-${video.id}`}
            className="min-w-0 w-full"
          />
        ))}
      </div>
    </div>
  );
}

function isRecommendFeedClip(v: FeedVideo): boolean {
  if (v.id.startsWith("dna-")) return false;
  if (isMicroDna(v)) return false;
  return true;
}

export function VideoFeed() {
  const portraitBase = useMemo(
    () =>
      SAMPLE_VIDEOS.filter(
        (v) => v.orientation === "portrait" && isRecommendFeedClip(v),
      ),
    [],
  );
  const landscapeBase = useMemo(
    () =>
      SAMPLE_VIDEOS.filter(
        (v) => v.orientation === "landscape" && isRecommendFeedClip(v),
      ),
    [],
  );

  const [portrait, setPortrait] = useState(portraitBase);
  const [landscape, setLandscape] = useState(landscapeBase);

  useEffect(() => {
    setPortrait(shuffleVideos([...portraitBase]));
    setLandscape(shuffleVideos([...landscapeBase]));
  }, [portraitBase, landscapeBase]);

  return (
    <section
      className="w-full overflow-hidden border-t border-slate-200/90 bg-[#FFFFFF]"
      aria-labelledby="recommended-feed-heading"
    >
      <div className="mx-auto max-w-[1800px] px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-14 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="min-w-0 text-left">
            <h2
              id="recommended-feed-heading"
              className="flex items-center gap-2.5 text-[22px] font-bold leading-snug tracking-tight text-[#0f172a] sm:gap-3 sm:text-[26px] md:text-[28px]"
            >
              <RecommendMagnetIcon className="h-7 w-7 shrink-0 sm:h-8 sm:w-8" />
              추천 영상
            </h2>
            <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-slate-600 sm:text-[16px]">
              왠지 자꾸 보게 되는 영상
            </p>
          </div>
          <SectionMoreLink category="recommend" className="shrink-0 self-stretch sm:self-center" />
        </div>

        <div className="mt-3 overflow-hidden rounded-lg border border-slate-200/90 bg-white shadow-sm sm:mt-3.5">
          <FeedRows portrait={portrait} landscape={landscape} keyPrefix="feed" />
        </div>
      </div>
    </section>
  );
}

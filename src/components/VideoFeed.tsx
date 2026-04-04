"use client";

import { useMemo } from "react";
import type { FeedVideo } from "@/data/videos";
import { SAMPLE_VIDEOS, shuffleVideos } from "@/data/videos";
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
            className="min-w-0 w-full"
          />
        ))}
      </div>
    </div>
  );
}

export function VideoFeed() {
  const portrait = useMemo(
    () => shuffleVideos(SAMPLE_VIDEOS.filter((v) => v.orientation === "portrait")),
    [],
  );
  const landscape = useMemo(
    () => shuffleVideos(SAMPLE_VIDEOS.filter((v) => v.orientation === "landscape")),
    [],
  );

  return (
    <section aria-label="동영상 피드" className="w-full overflow-hidden">
      <FeedRows portrait={portrait} landscape={landscape} keyPrefix="feed" />
    </section>
  );
}

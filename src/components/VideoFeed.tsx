"use client";

import { useMemo } from "react";
import { SAMPLE_VIDEOS, shuffleVideos } from "@/data/videos";
import { VideoCard } from "./VideoCard";

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
    <section id="feed" aria-label="추천 릴스 피드" className="space-y-10">
      <div>
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          세로 동영상
        </h2>
        <div className="relative -mx-6 sm:-mx-8">
          <div
            className="feed-scroll flex gap-4 overflow-x-auto scroll-smooth px-6 pb-3 pt-1 sm:px-8"
            style={{ scrollbarGutter: "stable" }}
          >
            {portrait.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                className="w-[min(46vw,220px)] shrink-0 snap-center sm:w-[240px]"
              />
            ))}
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          가로 동영상
        </h2>
        <div className="relative -mx-6 sm:-mx-8">
          <div
            className="feed-scroll flex gap-4 overflow-x-auto scroll-smooth px-6 pb-3 pt-1 sm:px-8"
            style={{ scrollbarGutter: "stable" }}
          >
            {landscape.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                className="w-[min(78vw,320px)] shrink-0 snap-center sm:w-[340px]"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

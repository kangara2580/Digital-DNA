"use client";

import { useMemo } from "react";
import { SAMPLE_VIDEOS, shuffleVideos } from "@/data/videos";
import { VideoCard } from "./VideoCard";

export function VideoFeed() {
  const items = useMemo(() => shuffleVideos(SAMPLE_VIDEOS), []);

  return (
    <section id="feed" aria-label="추천 릴스 피드">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
    </section>
  );
}

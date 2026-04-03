"use client";

import { useCallback, useRef } from "react";
import type { FeedVideo } from "@/data/videos";

type Props = { video: FeedVideo };

export function VideoCard({ video }: Props) {
  const ref = useRef<HTMLVideoElement>(null);

  const play = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.muted = true;
    void el.play().catch(() => {});
  }, []);

  const pause = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.pause();
    el.currentTime = 0;
  }, []);

  return (
    <article
      className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white/60 shadow-sm transition-transform duration-300 hover:-translate-y-0.5 hover:border-violet-300/60"
      onMouseEnter={play}
      onMouseLeave={pause}
    >
      <div className="relative aspect-[9/16] w-full bg-slate-100 sm:aspect-video">
        <video
          ref={ref}
          className="absolute inset-0 h-full w-full object-cover"
          poster={video.poster}
          playsInline
          muted
          loop
          preload="metadata"
        >
          <source src={video.src} type="video/mp4" />
        </video>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-90 transition-opacity group-hover:opacity-100" />
        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
          <h3 className="line-clamp-2 text-sm font-semibold text-white">
            {video.title}
          </h3>
          <p className="mt-1 text-xs text-white/75">{video.creator}</p>
        </div>
      </div>
    </article>
  );
}

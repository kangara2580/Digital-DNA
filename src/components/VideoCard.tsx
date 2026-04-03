"use client";

import { useCallback, useRef } from "react";
import type { FeedVideo } from "@/data/videos";

type Props = { video: FeedVideo; className?: string };

export function VideoCard({ video, className }: Props) {
  const aspectClass =
    video.orientation === "portrait"
      ? "aspect-[9/18] w-full"
      : "aspect-video w-full";
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
      className={`group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_8px_30px_-12px_rgba(15,23,42,0.12)] transition-transform duration-300 hover:-translate-y-0.5 hover:border-violet-200/80 hover:shadow-[0_16px_40px_-14px_rgba(15,23,42,0.18)] ${className ?? ""}`}
      onMouseEnter={play}
      onMouseLeave={pause}
    >
      <div className={`relative bg-slate-100 ${aspectClass}`}>
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

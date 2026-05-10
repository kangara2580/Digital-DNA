"use client";

import { useReducedMotion } from "framer-motion";
import Link from "next/link";
import type { FeedVideo } from "@/data/videos";
import { useHoverInstantPreview } from "@/hooks/useHoverInstantPreview";
import { useVideoDisplayTitle } from "@/hooks/useVideoDisplayTitle";
import { sanitizePosterSrc } from "@/lib/videoPoster";

type Props = {
  video: FeedVideo;
  /** 가로 스크롤 행에서 열 너비(예: 6열 기준 calc) */
  className?: string;
};

export function EditorCurationClipThumb({ video, className }: Props) {
  const reduceMotion = useReducedMotion() ?? false;
  const displayTitle = useVideoDisplayTitle();
  const isPexelsBlockedVideo = /^https?:\/\/videos\.pexels\.com\//i.test(
    video.previewSrc ?? video.src,
  );
  const { ref, onTimeUpdate, onEnter, onLeave } = useHoverInstantPreview(
    !isPexelsBlockedVideo,
    video,
    reduceMotion,
  );
  const previewSrc = video.previewSrc ?? video.src;
  const posterSrc = sanitizePosterSrc(video.poster);

  return (
    <Link
      href={`/video/${video.id}`}
      className={
        className
          ? `group ${className}`
          : "group w-[104px] shrink-0 sm:w-[118px]"
      }
    >
      <div
        className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-white/12 bg-black/35 shadow-none transition-[box-shadow,transform] duration-[400ms] ease-in-out group-hover:border-reels-cyan/30 group-hover:shadow-reels-cyan/20"
        onMouseEnter={isPexelsBlockedVideo ? undefined : onEnter}
        onMouseLeave={isPexelsBlockedVideo ? undefined : onLeave}
      >
        <video
          ref={ref}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
          poster={posterSrc}
          playsInline
          muted
          preload={isPexelsBlockedVideo ? "none" : "auto"}
          onTimeUpdate={onTimeUpdate}
          aria-hidden
        >
          {!isPexelsBlockedVideo ? <source src={previewSrc} type="video/mp4" /> : null}
        </video>
      </div>
      <p className="mt-2 line-clamp-2 text-left text-[12px] font-bold leading-snug text-zinc-200 sm:text-[13px]">
        {displayTitle(video)}
      </p>
      {video.priceWon != null ? (
        <p className="mt-0.5 text-left text-[11px] font-semibold tabular-nums text-reels-cyan sm:text-[12px]">
          {video.priceWon.toLocaleString("ko-KR")}원
        </p>
      ) : null}
    </Link>
  );
}

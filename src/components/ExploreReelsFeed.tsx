"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ALL_MARKET_VIDEOS,
  getVideosForCategory,
} from "@/data/videoCatalog";
import type { FeedVideo } from "@/data/videos";
import { shuffleVideos } from "@/data/videos";

const BATCH = 5;
const MAX_SLIDES = 120;

function useExplorePool() {
  return useMemo(() => {
    const rec = getVideosForCategory("recommend");
    const portrait = rec.filter((v) => v.orientation === "portrait");
    const base = portrait.length ? portrait : rec;
    const fb =
      base.length > 0
        ? base
        : ALL_MARKET_VIDEOS.filter((v) => v.orientation === "portrait");
    const list = fb.length > 0 ? fb : ALL_MARKET_VIDEOS;
    return shuffleVideos([...list]);
  }, []);
}

function ReelSlide({
  video,
  scrollRootRef,
}: {
  video: FeedVideo;
  scrollRootRef: React.RefObject<HTMLDivElement | null>;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const blockRef = useRef<HTMLDivElement>(null);
  const previewSrc = video.previewSrc ?? video.src;

  useEffect(() => {
    const block = blockRef.current;
    const root = scrollRootRef.current;
    if (!block) return;

    const io = new IntersectionObserver(
      (entries) => {
        const el = videoRef.current;
        if (!el) return;
        const e = entries[0];
        if (e.isIntersecting && e.intersectionRatio >= 0.42) {
          el.play().catch(() => {});
        } else {
          el.pause();
        }
      },
      { root: root ?? undefined, threshold: [0, 0.35, 0.55, 0.85, 1] },
    );
    io.observe(block);
    return () => io.disconnect();
  }, [scrollRootRef, video.id]);

  return (
    <div
      ref={blockRef}
      className="relative h-[calc(100dvh-var(--header-height,4.5rem))] w-full shrink-0 snap-start snap-always"
    >
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        poster={video.poster}
        src={previewSrc}
        muted
        playsInline
        loop
        preload="metadata"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-black/40"
        aria-hidden
      />
      <div className="absolute inset-x-0 bottom-0 z-[2] flex flex-col gap-2 p-4 pb-8 sm:p-6 sm:pb-10">
        <p className="line-clamp-2 text-left text-[16px] font-bold leading-snug text-white sm:text-[18px]">
          {video.title}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          {video.priceWon != null ? (
            <span className="text-[15px] font-extrabold tabular-nums text-reels-cyan">
              {video.priceWon.toLocaleString("ko-KR")}원
            </span>
          ) : null}
          <Link
            href={`/video/${video.id}`}
            className="pointer-events-auto rounded-full border border-white/25 bg-white/10 px-4 py-2 text-[13px] font-bold text-white backdrop-blur-sm transition hover:bg-white/20"
          >
            상세 보기
          </Link>
        </div>
      </div>
    </div>
  );
}

export function ExploreReelsFeed() {
  const pool = useExplorePool();
  const [count, setCount] = useState(BATCH);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const slides = useMemo(() => {
    const n = Math.min(count, MAX_SLIDES);
    const out: FeedVideo[] = [];
    for (let i = 0; i < n; i++) {
      out.push(pool[i % pool.length]);
    }
    return out;
  }, [pool, count]);

  const loadMore = useCallback(() => {
    setCount((c) => Math.min(c + BATCH, MAX_SLIDES));
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const root = scrollRef.current;
    if (!sentinel || !root) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { root, rootMargin: "120px 0px", threshold: 0 },
    );
    io.observe(sentinel);
    return () => io.disconnect();
  }, [loadMore]);

  return (
    <>
      <Link
        href="/"
        className="fixed left-3 top-[calc(var(--header-height,4.5rem)+0.5rem)] z-[45] inline-flex h-10 items-center gap-1.5 rounded-full border border-white/20 bg-black/45 px-3.5 text-[13px] font-semibold text-zinc-100 shadow-lg backdrop-blur-md transition hover:border-reels-cyan/40 hover:bg-black/60 hover:text-white md:left-[calc(var(--reels-rail-w)+0.75rem)] [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white/90 [html[data-theme='light']_&]:text-zinc-900"
        aria-label="홈으로"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2.25} aria-hidden />
        홈
      </Link>

      <p className="pointer-events-none fixed left-1/2 top-[calc(var(--header-height,4.5rem)+0.65rem)] z-[44] -translate-x-1/2 rounded-full border border-white/15 bg-black/35 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-300 backdrop-blur-md [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white/85 [html[data-theme='light']_&]:text-zinc-800">
        탐색 · 릴스
      </p>

      <div
        ref={scrollRef}
        className="fixed inset-x-0 bottom-0 top-[var(--header-height,4.5rem)] z-[30] overflow-y-auto overflow-x-hidden overscroll-y-contain snap-y snap-mandatory md:left-[var(--reels-rail-w)]"
        style={{ WebkitOverflowScrolling: "touch" }}
        role="feed"
        aria-label="세로 탐색 릴스 피드"
      >
        {slides.map((video, i) => (
          <ReelSlide
            key={`${video.id}-${i}`}
            video={video}
            scrollRootRef={scrollRef}
          />
        ))}
        <div
          ref={sentinelRef}
          className="h-px w-full shrink-0 snap-none"
          aria-hidden
        />
      </div>
    </>
  );
}

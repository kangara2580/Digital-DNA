"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { VideoCard } from "@/components/VideoCard";
import { getVideosBySellerHandle, normalizeSellerHandle } from "@/data/videoCatalog";
import type { FeedVideo } from "@/data/videos";

type Props = {
  video: FeedVideo;
};

const INITIAL_COUNT = 12;
const LOAD_BATCH = 12;

/** 상세 하단: 같은 판매자의 다른 판매 영상만 무한 로드 */
export function VideoDetailRecommendations({ video }: Props) {
  const pool = useMemo(() => {
    const sellerHandle = normalizeSellerHandle(video.creator);
    return getVideosBySellerHandle(sellerHandle).filter((item) => item.id !== video.id);
  }, [video.creator, video.id]);
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const visibleItems = useMemo(
    () => pool.slice(0, Math.min(visibleCount, pool.length)),
    [pool, visibleCount],
  );

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + LOAD_BATCH, pool.length));
  }, [pool.length]);

  useEffect(() => {
    setVisibleCount(INITIAL_COUNT);
  }, [video.id]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    if (visibleCount >= pool.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        loadMore();
      },
      { rootMargin: "280px 0px", threshold: 0 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [loadMore, pool.length, visibleCount]);

  if (pool.length === 0) return null;

  return (
    <section
      className="border-t border-white/10 pt-10 [html[data-theme='light']_&]:border-zinc-200"
      aria-labelledby="video-reco-heading"
    >
      <h2
        id="video-reco-heading"
        className="text-center text-xl font-extrabold tracking-tight text-zinc-100 [html[data-theme='light']_&]:text-zinc-900"
      >
        크리에이터의 다른 판매 동영상
      </h2>

      <div className="mt-6 grid grid-cols-2 gap-2 border border-white/10 p-2 [html[data-theme='light']_&]:border-zinc-200 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {visibleItems.map((item) => (
          <div key={`seller-${video.id}-${item.id}`} className="min-w-0">
            <VideoCard
              video={item}
              reelLayout
              disableHoverScale
              compactHoverActions
              className="min-w-0"
            />
          </div>
        ))}
      </div>

      {visibleCount < pool.length ? (
        <div ref={sentinelRef} className="h-20 w-full" aria-hidden />
      ) : null}
    </section>
  );
}

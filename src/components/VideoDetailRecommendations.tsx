"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { VideoCard } from "@/components/VideoCard";
import {
  getVideosBySellerHandle,
  getShopRecommendations,
  normalizeSellerHandle,
} from "@/data/videoCatalog";
import type { FeedVideo } from "@/data/videos";

type Props = {
  video: FeedVideo;
};

const INITIAL_COUNT = 12;
const BATCH_SIZE = 12;

/** 상세 하단: 같은 판매자 영상 → DB 판매자 영상 → 추천 영상 순으로 항상 표시 */
export function VideoDetailRecommendations({ video }: Props) {
  const router = useRouter();

  // 1) 카탈로그 기반: 같은 크리에이터 핸들로 매칭
  const catalogPool = useMemo(() => {
    const handle = normalizeSellerHandle(video.creator);
    return getVideosBySellerHandle(handle).filter((v) => v.id !== video.id);
  }, [video.creator, video.id]);

  // 2) DB 기반: listing.sellerId가 있으면 공개 API로 같은 판매자 영상 추가 로드
  const [dbPool, setDbPool] = useState<FeedVideo[]>([]);
  const sellerId = video.listing?.sellerId;
  useEffect(() => {
    setDbPool([]);
    if (!sellerId) return;
    let alive = true;
    void fetch(
      `/api/seller/videos?sellerId=${encodeURIComponent(sellerId)}&exclude=${encodeURIComponent(video.id)}`,
      { cache: "no-store" },
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { ok?: boolean; videos?: FeedVideo[] } | null) => {
        if (!alive || !data?.ok || !Array.isArray(data.videos)) return;
        setDbPool(data.videos);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [sellerId, video.id]);

  // 3) 최종 풀: DB → 카탈로그 크리에이터 → 추천(항상 존재)
  const pool = useMemo(() => {
    if (dbPool.length > 0) return dbPool;
    if (catalogPool.length > 0) return catalogPool;
    return getShopRecommendations(video.id, 40);
  }, [dbPool, catalogPool, video.id]);

  // 무한 스크롤 (순환)
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setVisibleCount(INITIAL_COUNT);
  }, [video.id]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || pool.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setVisibleCount((n) => n + BATCH_SIZE);
      },
      { rootMargin: "0px 0px 60% 0px", threshold: 0 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [pool.length]);

  const visibleItems = useMemo(() => {
    if (pool.length === 0) return [];
    return Array.from({ length: visibleCount }, (_, i) => {
      const v = pool[i % pool.length];
      return { video: v, key: `reco-${v.id}-${Math.floor(i / pool.length)}-${i}` };
    });
  }, [pool, visibleCount]);

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
        {visibleItems.map(({ video: item, key }) => (
          <div
            key={key}
            className="min-w-0 cursor-pointer"
            onClick={() => router.push(`/video/${encodeURIComponent(item.id)}`)}
          >
            <VideoCard
              video={item}
              reelLayout
              hideInfoBar
              disableHoverScale
              compactHoverActions
              className="min-w-0"
            />
          </div>
        ))}
      </div>

      {/* 무한 스크롤 sentinel */}
      <div ref={sentinelRef} className="h-4 w-full" aria-hidden />
    </section>
  );
}
